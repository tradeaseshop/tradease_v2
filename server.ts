import "dotenv/config";
import express from "express";
import path from "path";
import crypto from "crypto";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import apiRouter from "./backend/index";
import db, { AVATAR_UPLOAD_DIR, PRODUCT_IMAGE_UPLOAD_DIR } from "./backend/db";
import { requireRole } from "./backend/auth";

const app = express();
app.use((req,res,next)=>{ const id=String(req.headers["x-request-id"]||crypto.randomUUID()); (req as any).requestId=id; res.setHeader("X-Request-Id",id); next(); });
app.disable("x-powered-by");
const PORT = Number(process.env.PORT) || 3000;

// Once this app is packaged with Capacitor, it runs from a mobile-app
// origin (capacitor://localhost or http://localhost) rather than this
// server's own address, so the browser's normal same-origin rule would
// otherwise block every request. This allows exactly those known mobile
// app origins, plus this server's own address for the regular web build,
// rather than opening the API to any website on the internet.
app.use(cors({
  origin: [
    "capacitor://localhost",
    "http://localhost",
    "https://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    ...(process.env.CORS_ORIGINS || "").split(",").map((v) => v.trim()).filter(Boolean),
  ],
  credentials: true,
}));

app.use(express.json({ limit: "1mb",
  verify: (req, _res, buf) => {
    // Captured for webhook signature verification (backend/routes/webhooks.ts),
    // which must check the exact bytes sent, not a re-serialized copy of req.body.
    (req as any).rawBody = buf.toString('utf8');
  },
}));

// REST API backend (migrated from the Suremart PHP app): auth, products,
// categories, orders, vendors, users, delivery zones, logistics providers,
// support chats. See backend/index.ts for the full route list.
app.use("/api", apiRouter);

// Profile pictures and vendor logos — public, unlike KYC documents which
// go through an authenticated endpoint instead.
app.use("/uploads/avatars", express.static(AVATAR_UPLOAD_DIR));
app.use("/uploads/products", express.static(PRODUCT_IMAGE_UPLOAD_DIR));

// Initialize Gemini SDK with telemetry and fallback state
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not configured. Falling back to rule-based simulation engine.");
}

// Helper to sanitize Gemini response text
function cleanMarkdownJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiEnabled: !!ai
  });
});

// API: Admin AI operations briefing — uses a compact live database snapshot.
app.post("/api/gemini/admin-insights", requireRole("admin"), async (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.body?.days) || 30));
  const orders = db.prepare(`SELECT status,payment_status,total_amount,date FROM orders WHERE date >= datetime('now', ?)` ).all(`-${days} days`);
  const vendors = db.prepare(`SELECT status,account_status,store_status,kyc_status,payout_status FROM vendors`).all();
  const delivery = db.prepare(`SELECT status,COUNT(*) count FROM delivery_jobs GROUP BY status`).all();
  const refunds = db.prepare(`SELECT status,COUNT(*) count,COALESCE(SUM(COALESCE(approved_amount,requested_amount)),0) amount FROM refunds GROUP BY status`).all();
  const snapshot={days,orders,vendors,delivery,refunds};
  if(!ai) return res.json({mode:'rules',summary:'Gemini is not configured.',snapshot,actions:["Review pending vendor/KYC states","Review open refunds and failed payments","Review delivery jobs that are not delivered"]});
  try {
    const response=await ai.models.generateContent({model:"gemini-3.5-flash",contents:`You are TradeEase Operations AI. Analyze this live marketplace snapshot for the last ${days} days. Do not invent facts. Return JSON with keys summary (string), risks (array of concise factual observations), actions (array of concrete admin follow-ups), metrics (array of {label,value}). Snapshot: ${JSON.stringify(snapshot)}`,config:{responseMimeType:'application/json',systemInstruction:'Be concise, operational, and evidence-based. Never fabricate numbers.'}});
    return res.json({mode:'gemini',...JSON.parse(cleanMarkdownJson(response.text||'{}'))});
  } catch(err){ console.error('[gemini] admin insights error',err); return res.json({mode:'rules',summary:'AI analysis temporarily unavailable.',snapshot,actions:['Review pending vendor/KYC states','Review open refunds and failed payments','Review delivery jobs that are not delivered']}); }
});

// API: Get Personalized Product Recommendations
app.post("/api/gemini/recommend", async (req, res) => {
  const { persona, interests, budget, products } = req.body;

  if (!persona) {
    return res.status(400).json({ error: "persona is required" });
  }

  const prompt = `You are TradeEase AI, a brilliant personal shopping assistant specializing in the Nigerian marketplace.
A user with the shopping persona "${persona}" and interest tags [${interests?.join(", ")}] with a budget of ₦${budget || "any"} is seeking recommendations.

Here is the current TradeEase marketplace products inventory:
${JSON.stringify(products?.map((p: any) => ({ id: p.id, title: p.title, price: p.price, category: p.category, description: p.description })))}

Analyze this inventory. Select the top 3-4 products that fit this user's persona, interests, and budget best.
Explain *why* each product is perfectly personalized for them. Also suggest a dynamic personalized shopping advice tip.

You must respond with a valid JSON array of objects conforming exactly to this structure:
{
  "recommendations": [
    {
      "productId": "id-of-the-product",
      "personalizationReason": "Why this matches your exact interest and budget specifically."
    }
  ],
  "advice": "A custom paragraph of shopping advice tailored to their profile (referencing local Nigerian trends, state specifics, saving tips, etc.)",
  "aiPersonaName": "e.g., Tech Guru, Fashionista Scout, Budget Strategist, Naija Food Connoisseur"
}`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert personalized retail AI assistant. Format your output strictly as compact JSON.",
        }
      });

      const text = response.text || "";
      const parsed = JSON.parse(cleanMarkdownJson(text));
      return res.json(parsed);
    }
  } catch (error) {
    console.error("Gemini recommends error:", error);
  }

  // Fallback engine if Gemini key is missing or fails
  console.log("Using rule-based simulation for recommendations...");
  const budgetVal = Number(budget) || 9999999;
  const matches = (products || []).filter((p: any) => {
    const isUnderBudget = p.price <= budgetVal;
    const categoryMatches = (interests || []).some((interest: string) => 
      p.category?.toLowerCase().includes(interest.toLowerCase()) || 
      p.title?.toLowerCase().includes(interest.toLowerCase())
    );
    return isUnderBudget && (categoryMatches || Math.random() > 0.6);
  }).slice(0, 3);

  const finalRecommendations = matches.map((p: any) => ({
    productId: p.id,
    personalizationReason: `Selected because it matches your preferred price point and fits with your ${persona.toLowerCase()} lifestyle.`
  }));

  res.json({
    recommendations: finalRecommendations.length > 0 ? finalRecommendations : (products || []).slice(0, 3).map((p: any) => ({
      productId: p.id,
      personalizationReason: "Selected as a curated high-rating essential matching your marketplace budget."
    })),
    advice: `Since you're shopping with a ${persona} mindset, we recommend prioritizing highly durable items. Consider pairing your picks with certified TradeEase shipping options to optimize deliveri tracking inside Nigeria.`,
    aiPersonaName: persona === "budget" ? "Naija Budget Strategist" : "Premium Curator Assistant"
  });
});

// API: Dynamic AI Shopping Copilot Chat
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, currentPersona, currentPreferences, products } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Formulate prompt context
  const latestMessage = messages[messages.length - 1]?.content || "";
  const previousTurns = messages.slice(0, messages.length - 1).map((m: any) => 
    `${m.role === "user" ? "Buyer" : "Assistant"}: ${m.content}`
  ).join("\n");

  const systemPrompt = `You are TradeEase AI Copilot, a helpful, witty, and personalized shopping assistant for TradeEase - Nigeria's elite multivendor marketplace.
User Persona: ${currentPersona || "General Shopper"}
Preferences: ${JSON.stringify(currentPreferences || {})}
Inventory of active products:
${JSON.stringify(products?.slice(0, 15).map((p: any) => ({ id: p.id, title: p.title, price: p.price, category: p.category })))}

Provide an elegant, helpful response to the user's latest query. Make references to the items in our list if appropriate. Be friendly, polite, utilize authentic local context (like naira prices ₦, shipping via local state capitals, or common Nigerian terms) when helpful. Keep answers concise, highly polished, and clear.`;

  try {
    if (ai) {
      const chatPrompt = `${previousTurns}\nBuyer: ${latestMessage}\nAssistant:`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatPrompt,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      return res.json({ reply: response.text });
    }
  } catch (error) {
    console.error("Gemini chat error:", error);
  }

  // Fallback dialogue responder
  const replyText = `Hello! I am your TradeEase personalized copilot. I scanned our active inventory for your profile (${currentPersona || "General"}). If you're looking for recommendations, try checking out products like our rechargeable solar fans or premium fashion items. How else can I assist with your ₦ budgeting today?`;
  res.json({ reply: replyText });
});

// API: Vendor Listing Optimizer
app.post("/api/gemini/vendor-optimize", async (req, res) => {
  const { title, description, category, price } = req.body;

  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const prompt = `You are an expert digital marketing content writer for Nigerian merchants.
Optimize the following TradeEase product listing to attract high conversions:
Original Title: ${title}
Original Description: ${description || "None provided"}
Category: ${category || "General"}
Target List Price: ₦${price || "TBD"}

Tasks:
1. Write a highly persuasive, professional SEO-optimized Title.
2. Formulate a rich, engaging, structured Description emphasizing key selling points, durability, and target benefits for Nigerian households or professionals. Include 3 bullet points of highlights.
3. Suggest a 1-sentence catchy social media pitch for Instagram or WhatsApp Business status.

Respond STRICTLY with a valid JSON object conforming exactly to this schema:
{
  "optimizedTitle": "New Beautiful Title",
  "optimizedDescription": "Elegantly written description with benefits...",
  "socialMediaPitch": "Captivating pitch text for WhatsApp/Insta..."
}`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an elite e-commerce listing optimizer. Produce only valid JSON.",
        }
      });

      const text = response.text || "";
      const parsed = JSON.parse(cleanMarkdownJson(text));
      return res.json(parsed);
    }
  } catch (error) {
    console.error("Gemini vendor optimize error:", error);
  }

  // Fallback optimization
  res.json({
    optimizedTitle: `★ Premium ${title} (Authentic Quality Guarantee)`,
    optimizedDescription: `${description || "Elegantly crafted item designed for premium performance."}\n\nKey Highlights:\n• High durability and excellent materials\n• Great value-for-money pricing verified by TradeEase\n• Quick delivery to all Nigerian coordinates`,
    socialMediaPitch: `✨ Upgrade your lifestyle with the pure quality of our certified "${title}" today! Best rates guaranteed. DM to order now! 📲`
  });
});

// Setup Vite & static serving
async function startServer() {
  // First-boot convenience: if this is a brand new database (no admin
  // account exists yet — e.g. a fresh deploy with an empty volume), seed it
  // automatically with the app's starting data, instead of requiring a
  // manual `npm run seed` step on the host.
  try {
    const adminCount = (db.prepare('SELECT COUNT(*) as c FROM admins').get() as any).c;
    if (adminCount === 0) {
      console.log('No admin account found — seeding the database with starting data...');
      const { runSeed } = await import('./backend/seed');
      runSeed({ productionBootstrap: process.env.NODE_ENV === 'production' });
      console.log('Database seeded. Admin credentials come from ADMIN_INITIAL_PASSWORD.');
    }
  } catch (err) {
    console.error('Auto-seed check failed (continuing without seeding):', err);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/^\/(admin|backoffice)$/, (req, res) => {
      res.sendFile(path.join(distPath, 'admin.html'));
    });
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static product bundle from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();


process.on("SIGTERM",()=>{ console.log('[server] SIGTERM received; closing database.'); try{db.close();}finally{process.exit(0);} });
process.on("SIGINT",()=>{ try{db.close();}finally{process.exit(0);} });

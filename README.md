# TradeEase — Setup and Finishing Guide

This project used to run on Firebase. It now runs on its own backend, built in
Node.js, which stores everything in a small local database file instead of a
cloud service. This document walks you through getting it running on your own
computer, checking that it actually works, and finishing the last few pieces
that were left undone.

Nothing here has been run and tested end to end yet. Treat this as the plan
for turning a finished-looking codebase into a working app.

---

## 1. What you need before you start

- **Node.js**, version 18 or newer. Version 20 is a safe choice. You can check
  what you have installed by typing `node -v` in a terminal. If you don't have
  it, download it from nodejs.org.
- A terminal (Command Prompt, PowerShell, or Terminal on Mac).
- A code editor, such as VS Code, so you can read error messages in context if
  something goes wrong.
- About ten minutes.

You do **not** need MySQL, PHP, or a Firebase account for any of this. Those
were the old requirements, and none of them apply anymore.

---

## 2. Unzip the project

Unzip the file you downloaded. You should end up with a folder that contains,
among other things, a `package.json` file, a `src` folder, and a `backend`
folder. Open a terminal and move into that folder:

```
cd path/to/tradeease
```

Replace `path/to/tradeease` with wherever you unzipped it.

---

## 3. Install everything the project needs

Run:

```
npm install
```

This downloads all the small pieces of code (called packages) that the
project depends on — things like the web server, the database engine, and the
tools used to check passwords securely. It can take a minute or two. If it
finishes without red error text at the end, you're fine.

If you see an error mentioning `better-sqlite3` failing to build, it usually
means your computer is missing basic build tools. On a Mac, running
`xcode-select --install` once and then trying `npm install` again usually
fixes it. On Windows, installing "Node.js" from nodejs.org (not a portable
zip) normally brings the right tools with it. On Linux, installing `build-essential`
through your package manager does the same thing.

---

## 4. Set up your environment file

In the project folder, copy the file named `.env.example` and rename the copy
to `.env`. On Mac or Linux you can do this with:

```
cp .env.example .env
```

On Windows:

```
copy .env.example .env
```

Open `.env` in your editor. You'll see a few lines. The important one for now
is `JWT_SECRET`. This is a password the server uses internally to sign login
tokens — it's not something you type in anywhere, it's just a random string
the code uses to prove a login token is genuine. Change it to any long,
random sentence or string of characters. For example:

```
JWT_SECRET="a-long-random-sentence-nobody-will-guess-58204"
ADMIN_INITIAL_PASSWORD="a-strong-unique-admin-password"
# Optional: allow demo wallet checkout only in disposable development environments
ALLOW_DEMO_WALLET="false"
# Optional comma-separated production frontend origins
CORS_ORIGINS="https://your-domain.example"
```

You can leave `DATABASE_PATH` blank — the app will create its database file
automatically in the `backend` folder.

If you plan to use the AI shopping assistant feature (the Gemini-powered
copilot), you'll also need to fill in `GEMINI_API_KEY` with a key from Google
AI Studio. If you don't have one yet, you can skip it for now — everything
else in the app will still work, just not that one feature.

---

## 5. Create and fill the database

The app needs a database with some starting data in it — categories,
products, a couple of demo accounts, and so on — otherwise you'll open the
app to an empty shop. Run:

```
npm run seed
```

This creates a file called `tradeease.db` inside the `backend` folder and
fills it with:

- TradeEase's original demo products, categories, and orders
- The old Suremart grocery items (chicken, fish, rice), now attached to a
  vendor called "Suremart Grocery"
- Suremart's original delivery zones, now offered as a shipping option
- A ready-to-use admin account and a ready-to-use buyer account (see below)

You should see a list of "Seeding..." messages print out, ending with two
lines showing login details. If this command fails, stop here and read the
error message — it will most likely say something couldn't be found, which
usually means step 3 (`npm install`) didn't fully complete.

You can re-run `npm run seed` any time you want to wipe the database and
start fresh. It deletes everything and rebuilds it from scratch, so don't run
it if you've added real data you care about keeping.

---

## 6. Start the app

Run:

```
npm run dev
```

This starts one single server that serves both the website and the backend
API together. Once it's running, it will print out an address, usually:

```
http://localhost:3000
```

Open that address in your web browser. You should see the TradeEase app.

To stop the server, go back to the terminal and press `Ctrl + C`.

---

## 7. Logging in

Two accounts are created automatically by the seed step:

**Admin backoffice** — click through to the admin login screen:
- Email: `admin@tradeease.ng`
- Password: the value you set in `ADMIN_INITIAL_PASSWORD`

**Buyer account** (also works to browse as a vendor if you sign up separately):
- Email: `onyekachi@mail.com`
- Password: development demo only (not seeded in production)

You can also create a brand-new account through the normal sign-up screen —
that goes through the real backend now, not a simulation, so any account you
create will actually be saved and let you log back in later.

For production, set a strong `ADMIN_INITIAL_PASSWORD` before first boot; do not commit or publish it.
just a starting point, not something to leave in place.

---

## 8. What to test, in order

Work through this list. If any step doesn't behave as described, that's the
next thing to fix — see the troubleshooting section below.

1. **Browse the shop** — open the app, look at categories and products. You
   should see both TradeEase's usual products and the migrated Suremart
   grocery items (Chicken, Fish, Local Rice) mixed in.
2. **Sign up as a buyer** — create a new account, log out, log back in with
   the same email and password.
3. **Add items to a cart and check out** — place an order. Confirm it shows
   up afterward in your order history within the app.
4. **Sign up as a vendor** — create a second account choosing the vendor
   role, add a product, and confirm it appears in the shop for buyers to see.
5. **Log in as admin** — check that you can see the users, vendors, products,
   and orders you just created. Try approving the vendor account you signed
   up in step 4, since new vendors start out "Pending."
6. **Try the support chat** — open it as a buyer, send a message, then check
   as admin that the message shows up and that a reply from admin appears
   back on the buyer's side.
7. **Download your data** — as a logged-in buyer, go to Profile → Settings
   → Privacy & Your Data → Download My Data. Confirm a `.json` file
   downloads and that it contains your profile and the order from step 3.
8. **Delete a test account** — using an account you don't need to keep (not
   your main admin or buyer test account), go to the same screen and delete
   it. Confirm you're logged out afterward and that logging back in with
   that email fails, since the account no longer exists.
9. **Pay with a test card** (once Paystack keys are set — section 14) —
   check out with "Debit Card" selected, and use one of Paystack's published
   test card numbers in the popup. Confirm the order shows up with payment
   status "Paid," not "Pending."
10. **Sign in with Google** (once configured — section 15) — from the login
    screen, click the Google button, pick an account, and confirm you land
    inside the app logged in under that Google account's name and email.
11. **Manage a logistics provider as admin** — go to Admin → DELIVERI →
    Carriers, toggle a provider active/inactive, then refresh the page and
    confirm the change stuck (rather than reverting, which would mean it
    wasn't actually saved).
12. **Log a dispute, save a setting, and invite a second admin** — as admin,
    go to Reports and log a new dispute, go to Settings and change something
    (e.g. the commission rate) and save, then use the Admin Team section to
    invite a second admin account. Log out, log back in as that second
    admin, and confirm the dispute and the setting change are both still
    there.
13. **Upload and review a KYC document** — log in as a vendor account, go to
    Profile, and upload a photo or PDF as the ID document. As admin, go to
    the KYC Verification tab and confirm it shows up as Pending. Approve it,
    then check back as the vendor that the status updated. Try rejecting a
    document too, and confirm the vendor sees your rejection reason.

If every one of these works, the migration is functioning end to end.

---

## 9. What's already finished

- A full backend (in the `backend` folder) that replaces the old PHP/MySQL
  Suremart code with a Node.js API, using the same ideas (products,
  categories, orders, delivery zones) plus the extra concepts TradeEase
  needed (vendors, logistics providers, support chat).
- The original Suremart grocery catalog and delivery zones, brought across as
  real data rather than left behind.
- The TradeEase frontend rewritten to talk to this new backend instead of
  Firebase — login, product management, checkout, order tracking, and
  support chat all go through it now.
- Firebase itself has been removed from the project.
- A two-way webhook connection to DELIVERI (see section 13) so orders can be
  handed off for real fulfilment.
- **Customer data download and account deletion**, from Profile → Settings
  → Privacy & Your Data. Downloading gives a JSON file with the person's
  profile, every order they've placed, their vendor listings if they have a
  store, and their support chat history. Deleting requires typing "DELETE"
  and re-entering the current password, then permanently removes the
  account and everything tied to it (orders, vendor products, support chat
  history) from the database — there's no soft-delete or recovery window.
- **Real card payments through Paystack.** Choosing "Debit Card" at checkout
  opens an actual Paystack payment popup. The amount charged is independently
  re-checked with Paystack's own servers before an order is created — a
  shopper (or anyone poking at the browser's dev tools) can't just claim they
  paid without Paystack itself confirming it happened. See section 14 for
  the two keys you need to provide to turn this on.
- **The logistics provider admin screen** (Admin → DELIVERI → Carriers) now
  reads and writes real data through the backend instead of a fixed list
  built into the code. Adding a carrier or toggling one active/inactive
  actually persists now. There's now also a **Delivery Zones** tab in the
  same screen for managing Suremart-style flat-fee local zones.
- **The rest of the admin backoffice is now fully backed by real data too:**
  - **Payments** shows real transactions derived from actual orders, not a
    sample list.
  - **Settings** (commission rate, payout frequency, restricted categories,
    etc.) now actually saves to the database and survives a restart.
  - **Reports/Disputes** is a real, persisted list — admins can now log a
    new dispute by hand (there was no way to create one before, only view
    sample ones) and its status updates are saved.
  - **Admin Team**, a new section under Settings, lets an admin see who else
    has backoffice access, invite a new admin, and remove one — previously
    there was no way to add a second admin account at all.
  - Editing your own admin profile (name, phone) now actually saves, instead
    of resetting on next login.
- **Real Google Sign-In.** The Google button on the login screen now goes
  through an actual Google account picker and creates or logs into a real
  TradeEase account — no more fake account switcher. Facebook and Apple are
  still the original visual simulation; see section 15 for what's needed to
  make Google work.
- The app is ready to deploy to Railway (see section 16) — the hardcoded
  port that would have blocked this has been fixed, and a `railway.json` is
  included.
- **Vendor KYC verification.** Vendors can upload a government ID and a
  proof-of-address document from Profile → Identity Verification (KYC).
  Admins review them in the new **KYC Verification** tab — approve, reject
  with a reason, and the vendor's overall verification status (Unverified →
  Pending → Verified, or Rejected) updates automatically based on their
  documents. See section 17 for how the files are stored and a few things
  worth knowing before going live with this.

## 10. What's left to finish

Be aware of these gaps rather than assuming everything is covered:

- **Facebook and Apple sign-in** are still a visual simulation — only Google
  was wired up to a real provider. Each additional provider is its own
  separate setup with that company's developer console.
- **Admin reports, transactions, and payout analytics** (separate from the
  Paystack checkout flow above) still show sample data rather than being
  calculated from the real orders and payments in the database. Worth doing
  next if the admin dashboard needs to be trustworthy for real business
  decisions.
- **Nothing here has been tested by actually running it.** This whole build
  was written and reviewed by reading the code carefully, not by executing
  it, because the environment it was built in had no internet access to
  install anything. Treat step 8 above as the real first test — and pay
  particular attention to the Paystack flow specifically, since money
  actually moving is the highest-stakes part of this to get right before
  trusting it.

---

## 11. If something breaks

**The app loads but shows no products.**
You likely skipped `npm run seed`, or it failed partway through. Run it again
and read any error message it prints.

**"Invalid email or password" when you know the demo account details are right.**
Make sure you ran `npm run seed` after unzipping — without it, no accounts
exist yet, including the demo ones.

**A blank white page in the browser.**
Open your browser's developer tools (usually F12) and look at the Console
tab for a red error message. Copy the exact wording — it will point at
either a missing file or a mismatch between what one part of the code expects
and what another part is sending it.

**"Cannot find module" errors when starting the server.**
Run `npm install` again. If it still fails, delete the `node_modules` folder
and the `package-lock.json` file, then run `npm install` fresh.

**Changes you made to the code don't seem to show up.**
Stop the server (`Ctrl + C`) and start it again with `npm run dev`. The
database itself doesn't reset when you do this — only your code changes are
picked up.

**You want to start over completely, with a brand new empty database.**
Delete the file `backend/tradeease.db` (and any files next to it ending in
`-wal` or `-shm`, if present), then run `npm run seed` again.

---

## 12. A quick map of the project

- `backend/` — the new server-side code. This replaces what used to be PHP
  files in Suremart. `backend/routes/` holds the actual API endpoints, grouped
  by what they manage (accounts, products, orders, admin tools, support
  chat).
- `src/api.ts` — the one file the frontend uses to talk to the backend. If
  you ever need to add a new kind of request, this is where it goes.
- `src/buyer-vendor/` and `src/admin/` — the two halves of the app: the
  regular shopping/selling experience, and the separate admin backoffice.
- `src/components/` — the actual screens and pieces of interface, like the
  product listing page or the checkout flow.
- `server.ts` — the file that starts everything up and connects the backend
  API to the website itself.

---

## 13. Connecting to DELIVERI (the logistics sister company)

TradeEase can now automatically hand orders off to DELIVERI, a real
logistics backend, whenever a buyer picks DELIVERI as their courier at
checkout — and receive live delivery status updates back, automatically.

This is a separate project with its own setup. Full instructions, including
the two `.env` values that need to match between the two apps, are in
DELIVERI's own `README.md`. The short version: set `DELIVERI_API_URL` and
`DELIVERI_WEBHOOK_SECRET` in this project's `.env` file, set the matching
values in DELIVERI's `.env` file, and run both servers at the same time.

---

## 14. Setting up real card payments (Paystack)

Checkout has a "Debit Card" option that opens a genuine Paystack payment
popup and charges a real card, once you've provided your own Paystack keys.

**Getting your keys:**

1. Sign up free at paystack.com — you can use your CAC-registered TradeEase
   business.
2. In the dashboard, go to **Settings → API Keys & Webhooks**.
3. Copy the **Test Secret Key** (`sk_test_...`) and **Test Public Key**
   (`pk_test_...`). Stay on test keys until you've confirmed the whole flow
   works — test mode lets you "pay" with Paystack's published test card
   numbers without moving real money.
4. Paste them into your `.env` file:

```
PAYSTACK_SECRET_KEY="sk_test_your_real_key_here"
PAYSTACK_PUBLIC_KEY="pk_test_your_real_key_here"
```

5. Restart the server. Checkout → Debit Card should now open a real Paystack
   popup. If `PAYSTACK_SECRET_KEY` isn't set, the app tells the shopper card
   payments aren't available yet, rather than pretending to accept payment.

**How it actually works, in plain terms:** when someone pays, the browser
tells TradeEase "the payment succeeded" — but browsers can be tampered with,
so that claim alone is never trusted. Before an order is created, the
backend independently asks Paystack directly, using your secret key, "did
this payment really happen, and for how much?" Only if Paystack's own answer
matches does the order get created. This happens twice, once right after the
popup closes and once more when the order is actually saved, so there's no
window where a manipulated request could sneak an unpaid order through.

**Going live:** once you're satisfied everything works in test mode, verify
your Paystack account (they'll ask for business details — you already have
your CAC registration for this) and swap in the **Live** keys from the same
dashboard page. Nothing else in the code needs to change.

**One current limitation:** the total charged still comes from the same
place order totals already came from before this feature existed — the
shopper's browser calculates the cart total and shipping, and that's what
gets sent to Paystack to charge. The payment step itself can't be faked (see
above), but a more thorough system would also have the server independently
recalculate the total from the product prices actually in the database,
rather than trusting the number the browser hands over. Worth doing before
handling real, larger transaction volumes.

---

## 15. Setting up real Google Sign-In

**Getting your Client ID:**

1. Go to console.cloud.google.com and create a project (any name is fine).
2. Under **APIs & Services → OAuth consent screen**, fill in the basics —
   app name, your support email. For testing, "External" + "Testing" mode is
   enough; you don't need Google's full verification process yet.
3. Under **APIs & Services → Credentials**, click **Create Credentials →
   OAuth Client ID**, choose **Web application**.
4. Under **Authorized JavaScript origins**, add `http://localhost:3000`. Once
   deployed, come back and add your real domain here too (e.g.
   `https://app.tradeease.ng`) — Google will reject the login otherwise.
5. Copy the **Client ID** (ends in `.apps.googleusercontent.com`) into your
   `.env` file:

```
GOOGLE_CLIENT_ID="000000000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
```

6. Restart the server. The Google button on the login screen should now open
   a real Google account picker.

**How accounts are matched:** if someone signs in with Google using an email
that already has a TradeEase account, they're logged into that same account.
If it's a new email, a fresh account is created automatically — same as
signing up normally, just without typing a password.

**A note on reliability:** Google has been migrating this kind of sign-in
flow to a newer browser standard (FedCM) over the past couple of years, and
browser behavior here can shift. If the Google button stops opening a picker
after a browser update, that's the first thing to check — Google's own
documentation for "Sign In With Google for Web" will have the current
guidance.

---

## 16. Deploying to Railway

Recommended because it runs Node apps straight from GitHub, gives you a real
persistent disk (needed for the SQLite database file), and env vars are just
a form in their dashboard — no server administration required.

1. **Push this project to GitHub**, if it isn't there already.
2. **Sign up at railway.app** (one click with your GitHub account).
3. **New Project → Deploy from GitHub repo** → pick this repository. Railway
   will detect it's a Node app automatically (helped along by the
   `railway.json` already included here).
4. **Add a volume**, so your database survives redeploys: in the service
   settings, add a volume mounted at `/data`. Without this, every new deploy
   would start with a completely empty database.
5. **Set environment variables** (Service → Variables) — copy every value
   from your local `.env` file, plus this one specifically for the volume:

```
DATABASE_PATH="/data/tradeease.db"
```

6. **Deploy.** Railway builds with `npm run build` and starts with
   `npm start`, both already set up correctly. On first boot, since the
   database will be empty, the app automatically seeds itself with starting
   data — no manual step needed. Watch the deploy logs for a line confirming
   this.
7. **Add a custom domain** once you're happy with it, under Settings →
   Domains. Remember to add that final domain to the Google Cloud console
   (section 15) and to DELIVERI's own deployment, if you're running that too.

**Cost:** Railway starts with a free trial credit, then is usage-based —
realistically a few dollars a month for an app this size, since it's not
running heavy compute.

**DELIVERI needs this too.** This section only covers TradeEase. DELIVERI is
a separate app with its own repository and would go through the same steps
on its own Railway service, with its own volume and its own domain. Once
both are deployed, update `DELIVERI_API_URL` (in TradeEase's variables) and
`TRADEEASE_WEBHOOK_URL` (in DELIVERI's variables) to point at each other's
real deployed addresses instead of `localhost`.

---

## 17. Vendor KYC verification — how it works and what to know

Vendors upload a government ID and a proof-of-address document from their
Profile tab. Admins review both in the new **KYC Verification** screen in
the admin sidebar and approve or reject each one individually. A vendor's
overall status moves automatically:

- **Unverified** — no documents uploaded yet
- **Pending** — at least one document uploaded, waiting on review
- **Verified** — both the ID and the address document have been approved
- **Rejected** — at least one document was rejected (the vendor sees the
  reason and can re-upload, which replaces the rejected one)

**Where the files actually go:** uploaded documents are saved to
`backend/uploads/kyc/` on whatever machine is running the server, with the
filename randomized on disk — never the original filename, and never
guessable. The database only stores a reference to the file, not the file
itself. Accepted formats are JPG, PNG, WEBP, or PDF, up to 8MB each.

**Who can actually see a document:** nobody, by just knowing its address.
Every document is served through an authenticated route that checks the
request is either the vendor who uploaded it or a logged-in admin — there's
no public URL for these files, unlike product images. This matters because
these are identity documents, not product photos.

**Important for deployment (Railway or anywhere else):** these files live on
local disk, exactly like the SQLite database does. If you deploy this
without attaching a persistent volume (the same one covered in section 16
for the database), **every redeploy will permanently delete every uploaded
KYC document** — the database row would still say "Approved" but the actual
file would be gone. Make sure `backend/uploads/` sits on the same persistent
volume as the database, or point `DATABASE_PATH`'s volume to also cover the
`backend/uploads` folder before any vendor uploads a real document you need
to keep.

**Worth knowing before handling real, sensitive ID documents at scale:**
this stores files directly on the server's own disk, which is fine for
getting started but isn't how most production KYC systems work at real
volume — they typically use a dedicated object storage service (like AWS S3)
with its own access controls and audit logging, partly so the documents
survive independently of the app server itself, and partly because
compliance requirements around storing government ID scans are often
stricter than for other files. Worth revisiting if this moves from "a
handful of vendors" to real production scale.

---

If you get through setup and testing and hit something this guide doesn't
explain, the most useful thing you can do is copy the exact error message
you're seeing, along with which step you were on, so it can be tracked down
precisely rather than guessed at.

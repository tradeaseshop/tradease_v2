TRADEEASE
Platform Overview, Technology, Achievements & Future Direction
Built by FAUCH — Technology, Digital Marketing & Business Development

What TradeEase Is About
TradeEase is a Nigerian multi-vendor digital marketplace designed to connect buyers, independent vendors and delivery providers in one connected commerce ecosystem. Buyers can discover products, manage carts, place orders, make payments, fund wallets and follow fulfilment, while vendors can create stores, list products, manage orders and receive marketplace earnings.
TradeEase is designed as a provider-independent logistics platform. TradeEase acts as the commerce and fulfilment orchestrator and can integrate multiple logistics companies through APIs and webhooks. DELIVERI, which is owned by TradeEase, is the preferred logistics provider, but it is not the only provider.
The broader objective is to provide practical digital marketplace infrastructure for Nigerian commerce while remaining extensible enough to connect additional payment, logistics, verification and business services.

Who Built TradeEase
TradeEase was built by FAUCH, a technology company run by FAUCH. FAUCH provides hands-on technology and business solutions, including:
Web development and deployment.
Cross-platform web and app development.
Digital marketing services.
Business development solutions.
Technology solutions for businesses and digital products.
TradeEase is also a demonstration of FAUCH's ability to design, build, integrate and deploy scalable end-to-end digital platform 

Technology Behind TradeEase
Frontend / User Experience:
React/TypeScript component-based frontend.
Responsive web/mobile interface and PWA architecture.
Buyer marketplace, product discovery, categories/subcategories, product pages, cart and checkout.
Vendor dashboard for stores, products, orders, fulfilment and finance.
Admin functionality for platform operations, vendors, orders, analytics, disputes and controls.
Authentication and account management for buyers and vendors.
Guest marketplace browsing with protected authenticated functions.
Profile images and account personalization.
Saved location/onboarding state to avoid repeated walkthroughs.
In-app Terms of Use and Privacy Policy.
'Sell on TradeEase' seller-acquisition experience.
Android APK packaging of the deployed PWA 

Backend / Server:
Node.js/TypeScript backend.
Express-style API routing.
JWT authentication and role-based authorization.
bcrypt password hashing.
Login brute-force protection and strong-password rules.
Production admin authentication and controlled password recovery.
Server-side validation and request-body limits.
Server-calculated order totals, payment amounts and stock checks.
Buyer/vendor/admin ownership and access restrictions.
Vendor account, store, KYC and payout states.
Notifications, analytics, disputes/refunds and operational controls.
Health/readiness checks, diagnostics and graceful shutdown.

Database:
TradeEase uses SQLite through better-sqlite3 for persistent application data. The database architecture supports:
Users and authentication.
Administrator accounts.
Vendors and storefronts.
Products, categories and subcategories.
Product media/images, specifications and digital ebook information.
Orders and order items.
Vendor-specific orders (vendor_orders) for multi-vendor fulfilment.
Vendor financial ledger and withdrawals.
Buyer wallets and wallet transactions.
Payment references and transaction states.
Delivery jobs.
Notifications.
Disputes and refund requests.
Operational/analytics data.
Indexes and migrations for database evolution.

Product Catalogue:
TradeEase uses a canonical category/subcategory taxonomy covering:
Fashion & Apparel.
Electronics & Gadgets.
Home & Kitchen.
Beauty, Health & Personal Care.
Grocery & Food.
Automotive.
Baby & Kids.
Sports & Fitness.
Industrial & Tools.
Office & Stationery.
Books & Media.
Services & Digital Products.
Agriculture & Farm.
Handmade & Custom.

Payments — Paystack:
Paystack public and secret keys are separated; the secret key remains server-side.
Paystack checkout for buyer payments.
Server-side transaction verification.
Amount and NGN currency verification.
Unique payment references and duplicate-payment protection.
Real wallet funding rather than browser/local-storage simulation.
Paystack Test Mode support for development and testing.
Payment states connected to TradeEase orders and wallet transactions.

Buyer Wallet:
The Buyer Wallet is server-controlled. A buyer requests a funding amount, TradeEase creates a pending transaction, Paystack processes it, and the backend verifies the transaction before crediting the wallet. The browser cannot simply declare that money was received.
Persistent wallet balance.
Pending/successful funding transactions.
Paystack reference tracking.
Server-side amount/currency/email checks.
Duplicate-credit protection.
Transaction history.

Marketplace & Order Architecture
Parent orders can contain multiple vendor orders.
Each vendor order has its own vendor and fulfilment state.
Order items retain vendor identity snapshots.
Vendor fulfilment is separated from parent-order status.
Parent order status is recomputed from vendor fulfilment.
Commission and vendor earnings are calculated server-side.
Vendor ledger records sales, commissions, adjustments, withdrawals and refunds.
Stock is rechecked during order creation.
Buyer/vendor access is restricted according to ownership and role.

Logistics & External Providers:
TradeEase is a logistics orchestrator rather than a DELIVERI-only marketplace. The intended structure is:
TradeEase — commerce and logistics orchestration layer.
DELIVERI — TradeEase-owned and preferred logistics provider.
Other logistics companies — independent providers integrated through APIs/webhooks.
Delivery jobs — persistent links between orders/vendor orders and providers.
Provider-specific tracking and delivery identifiers.
HMAC-signed service-to-service requests and webhooks.
Provider selection at fulfilment level rather than assuming every order belongs to DELIVERI.

DELIVERI Integration:
TradeEase can send fulfilment requests to DELIVERI.
DELIVERI sends authenticated delivery lifecycle events back to TradeEase.
Multi-vendor orders can produce separate vendor-level delivery fulfilments.
Fulfilment IDs, vendor-order IDs, order IDs and tracking IDs provide correlation.
HMAC secrets protect service-to-service communication.
Delivery completion can update TradeEase fulfilment/order states and vendor financial processing.

Security & Access Control:
JWT authentication with production session controls.
bcrypt password hashing.
Protected administrator authentication, including TOTP support.
Role-aware buyer, vendor and administrator access.
Vendor and order ownership restrictions.
KYC, account, store and payout state controls.
Secrets and webhook credentials kept server-side/environmentally.
Request validation and body-size controls.
Production safeguards around demo/live data.

Admin & Business Operations:
Vendor account/store status management.
KYC and payout management.
Order and fulfilment oversight.
Wallet, ledger and withdrawal oversight.
Dispute and refund workflows.
Notifications.
Revenue/order/product/fulfilment analytics.
Operational diagnostics and health checks.
Controlled administrator password recovery.

Deployment & Infrastructure:
GitHub-based source-control/deployment workflow.
Railway hosting and deployment.
Environment variables for production secrets and integrations.
Persistent SQLite deployment considerations.
Production health/readiness checks.
PWA deployment and Android packaging. 

External Connections:
Paystack — payments and transaction verification.
DELIVERI — preferred TradeEase-owned logistics provider.
Other logistics companies — API/webhook integration model.
Google/social authentication integrations are part of the application direction.
Railway — hosting/deployment.
GitHub — source control/deployment.

 
What Has Been Achieved So Far
TradeEase has progressed from marketplace concept to a live full-stack application deployed on Railway.
A multi-vendor marketplace architecture is operational for buyers, vendors and administrators.
Canonical product categories/subcategories are implemented.
Product images, galleries, specifications and digital ebook support are implemented.
Server-side pricing, stock validation and payment verification are implemented.
Paystack payment infrastructure is connected for testing and production configuration.
A real server-controlled Buyer Wallet funding architecture has been implemented.
Vendor wallets, financial ledgers and withdrawal eligibility controls have been developed.
Multi-vendor order and vendor-order fulfilment architecture has been implemented.
DELIVERI is connected through authenticated API/webhook mechanisms while preserving multi-provider logistics support.
Notifications, analytics, disputes/refunds and administrative workflows have been developed.
Production security hardening has been carried out across authentication, secrets, ownership and payment controls.
Guest marketplace browsing has been separated from authenticated buyer functions.
TradeEase Terms of Use and Privacy Policy have been incorporated into the user experience.
Demo vendor accounts and marketplace products have been created for testing and demonstration.
A 'Sell on TradeEase' seller-acquisition journey has been developed.


What TradeEase Will Achieve
Expand the verified vendor and product network.
Integrate additional Nigerian and international logistics providers through standardized APIs/webhooks.
Prioritize DELIVERI where appropriate while retaining provider choice.
Expand secure payment and financial capabilities.
Strengthen vendor KYC, verification and trust systems.
Develop richer buyer/vendor analytics and operational intelligence.
Improve dispute, refund and customer-support processes.
Expand notifications and delivery communication.
Use AI selectively where it creates measurable operational value rather than unnecessary interface complexity.
Improve marketplace search, discovery and recommendations.
Expand digital products and services.
Develop vendor onboarding, seller education and business-development tools.
Strengthen production infrastructure, monitoring, backups and reliability.
Grow TradeEase into a broader Nigerian commerce ecosystem connecting merchants, buyers, payments and logistics.


The FAUCH Vision Behind TradeEase
TradeEase demonstrates the type of end-to-end technology FAUCH aims to build for businesses: systems that combine customer-facing interfaces, secure backend services, databases, payment infrastructure, external APIs, logistics integrations, administrative tools and real business processes.
The goal is not simply to build websites or apps, but to build useful digital systems around how businesses actually operate — from customer acquisition and transactions through fulfilment, administration, analytics and future expansion.


Summary
TradeEase is a full-stack Nigerian multi-vendor marketplace built by FAUCH. It combines a buyer/vendor marketplace, secure backend services, persistent database systems, Paystack payments, server-controlled wallets, multi-vendor order management, financial ledgers, vendor controls, analytics, disputes, notifications and a provider-independent logistics architecture. DELIVERI is the preferred TradeEase-owned logistics provider, while the platform remains open to other logistics companies through API and webhook integrations.
The achievement so far is therefore more than a marketplace interface: TradeEase has evolved into connected digital commerce infrastructure capable of supporting buyers, sellers, payments, fulfilment and business operations, with room for FAUCH to continue expanding both the platform and its technology-service portfolio.


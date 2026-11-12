# Footwear Retail Management System (ERP 2.0)

A complete, production-ready, enterprise-grade **Footwear Retail Management System** integrating both **Management Suite** and **Sales Executive POS Suite** within one unified web application powered by a shared PostgreSQL database and Prisma ORM.

---

## 🎯 Architecture & Shared Database

Both roles operate on the **same shared database** in real time:
- When a **Sales Executive** checks out an invoice in POS, inventory is automatically decremented atomically via database transactions.
- The **Management Module** instantly reflects updated inventory levels, daily sales graphs, revenue, gross profit, and cashier attribution.
- Size and colour combinations are maintained with separate variant inventory tracking (e.g., `Nike Air / Black / UK 7` vs `Nike Air / Black / UK 8`).

---

## 👥 Demo Login Credentials

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Management** | `admin@solefit.com` | `admin123` | Full 16-module management dashboard, budget targets, financial overview, ageing clearance approvals, reports |
| **Sales Executive 1** | `rajesh@solefit.com` | `sales123` | Fast POS billing, camera barcode scanner, stock lookup, sales activity |
| **Sales Executive 2** | `priya@solefit.com` | `sales123` | POS checkout, personal targets, sales history |
| **Sales Executive 3** | `amit@solefit.com` | `sales123` | POS checkout, personal targets, sales history |

*(Tip: The login page includes 1-click demo credential fill buttons for fast testing).*

---

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+)

### 1. Database & Backend Setup
```bash
cd footwear-erp/backend

# Install dependencies
npm install

# Environment variables (.env is preconfigured)
# DATABASE_URL="postgresql://postgres@localhost:5433/footwear_erp?schema=public"

# Synchronize schema & generate Prisma Client
npx prisma db push

# Seed realistic demo catalog (32+ footwear styles, racks, ageing tiers, vendors, sales history)
npm run db:seed

# Start backend server (Port 5000)
npm start
```

### 2. Frontend Setup
```bash
cd footwear-erp/frontend

# Install dependencies
npm install

# Start development server (Port 5173)
npm run dev
```

Visit the application at: **`http://localhost:5173/`**

---

## 📱 Modules Breakdown

### 1. Management Module (16 Dedicated Sections)
1. **Dashboard**: 12 top KPI cards, 7-day sales trend (Recharts AreaChart), best-performing sales executives, recent transactions, low-stock & clearance alerts.
2. **Budget & Targets**: Daily & monthly targets, target achievement %, employee comparison bar chart, set new target modal.
3. **Sales Monitoring**: Complete sales invoice ledger, customer details, tax breakdown, payment methods, view & reprint thermal receipt.
4. **Purchase Monitoring**: Supplier consignments, purchase invoices, paid vs outstanding amounts, inward consignment modal.
5. **Inventory Overview**: Variant-level stock tracking (Product, Article, Brand, Gender, Colour, Size, Barcode, Prices, Rack), stock adjustment with audit trail, add new footwear modal.
6. **Rack & Display Overview**: Physical store hierarchy (`Floor -> Department -> Rack -> Shelf -> Position`), occupancy rates, display stock tracking, create rack modal.
7. **Ageing & Clearance**: 6 stock age tiers (0-30 fresh, 31-60 normal, 61-90 ageing, 91-120 clearance recommended, 121-180 deep clearance, 180+ dead stock), workflow promotions (20% Assorted Rack, 50% Deep Discount Rack).
8. **Damaged Goods**: Register defects (sole detachment, scuff marks, transit damage), cobbler repair tracking, auto-restoration to stock upon repair or write-off loss recording.
9. **Vendor Overview**: Suppliers, purchase history, credit periods, pay supplier modal.
10. **Financial Overview**: Profit & Loss (Revenue, COGS, Gross Profit, Expenses, Net Profit), cash drawer balance, bank balance, expense logging modal.
11. **Capital Overview**: Initial investment, partner additions, drawings, current net capital balance, transaction ledger.
12. **Sales Analytics**: Brand-wise revenue, category distribution pie chart, size demand analysis (UK 6 to 11), colour preferences, best-sellers & slow-moving stock.
13. **Purchase Analytics**: Supplier procurement spend, monthly procurement trends, brand spend.
14. **Reports**: Dynamic on-demand reports with date filters and **CSV Export** for Sales, Purchases, Inventory, Damaged, and Salespersons.
15. **Notifications**: Real-time alerts for low stock, ageing stock, dead stock, damaged repair due, and vendor payments.
16. **Settings**: Store profile, Indian footwear GST taxation slabs (5% / 12%), staff directory.

### 2. Sales Executive Module (POS-Optimized)
1. **POS Dashboard**: Today's sales, bills generated, pairs sold, daily target progress bar.
2. **Product Search**: Fast multi-field search, attractive footwear cards, size & colour selector, real-time available stock validation, add to cart.
3. **Barcode Scanner**: **Real browser camera barcode scanner** (`html5-qrcode`) with optical viewfinder + fallback manual barcode input. Pinpoints exact physical rack, shelf, and position.
4. **Stock Availability**: Colour-wise size availability matrix (UK 6 to 11) with live stock counters fetched from shared database.
5. **Product Location**: Physical store location hierarchy visualizer (`Floor -> Department -> Rack -> Shelf -> Position`).
6. **My Cart**: Dynamic shopping cart, quantity controls against stock limits, footwear GST calculation, authorized discount application.
7. **Express POS Billing**: Customer mobile look-up / new customer creation, payment method selector (Cash, UPI, Card, Split), quick cash tender buttons, atomic database checkout transaction.
8. **Receipt & Invoicing**: Automatic unique invoice numbers (`INV-YYYY-XXXX`), printable POS thermal receipt, downloadable PDF invoice (`jsPDF`).
9. **Sales History**: Personal sales records, reprint customer bills.
10. **My Sales Activity**: Personal performance analytics, daily shift target completion %, monthly sales attainment.
11. **My Profile**: Sales executive profile details and password management.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, Tailwind CSS v4, React Router v7, Axios, Recharts, Lucide React, html5-qrcode, jsPDF, jspdf-autotable.
- **Backend**: Node.js, Express.js, Prisma ORM (v5), JSON Web Tokens (JWT), Bcrypt.js, Morgan.
- **Database**: PostgreSQL 17 (port 5433).

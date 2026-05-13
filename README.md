# 🌾 F3: Fresh From Farm

> **The intelligent ecosystem connecting farmers with cutting-edge AI, direct markets, and precision agronomy.**

F3 is a full-stack agricultural marketplace platform built to empower Indian farmers and consumers. It eliminates middlemen, provides AI-driven crop intelligence, and delivers a premium digital-first farming experience.

---

## ✨ Features

### 🌐 Immersive Landing Page
- Animated 3D globe with scroll-driven storytelling
- Section navigation dots with smooth transitions
- Premium dark-themed UI with gold accents

### 🏠 Dashboard
- Role-based access for **Farmers** and **Customers**
- Live Mandi (market) price intelligence table
- AI pillar showcases: Agronomist, Marketplace, Financial Growth

### 🛒 Marketplace
- Real-time product listings from Firebase Firestore
- Full cart → checkout → order placement flow
- UPI / Cash on Delivery payment options with QR code
- Order tracking and status management

### 🧪 AI Soil Health Analyzer
- Soil parameter input (pH, Nitrogen, Phosphorus, Potassium, moisture)
- Groq AI (Llama 3) powered analysis and recommendations
- Multilingual support (English / Hindi)

### 🌿 AI Crop Disease Detector
- Image upload with real-time Gemini Vision diagnosis
- Treatment plans and prevention tips
- Works with most common Indian crops

### 📅 Smart Crop Calendar
- Personalized sowing and harvesting timelines
- Region and crop-type specific scheduling
- Weather-aware recommendations

### 📊 Analytics Dashboard
- Yield forecasting and financial summaries
- Trend charts and performance metrics
- Multilingual (English / Hindi)

### 👨‍🌾 Farmer Console
- Inventory management (add, update stock)
- Incoming order management with status updates
- Add new produce listings directly

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Tailwind CSS (CDN), Vanilla JS |
| **Backend** | Node.js, Express.js |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **AI Models** | Groq API (Llama 3), Google Gemini Vision |
| **Fonts** | Inter, Noto Serif (Google Fonts) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/neonnomad04-source/F3--FRESH-FROM-FARM.git
cd F3--FRESH-FROM-FARM

# Install server dependencies
cd server
npm install

# Start the server (serves both API + frontend)
npm run dev
```

Then open **[http://localhost:3005](http://localhost:3005)** in your browser.

> ⚠️ The Express server serves the entire frontend — no separate frontend server needed.

---

## 📁 Project Structure

```
F3--FRESH-FROM-FARM/
├── client/                     # Frontend
│   ├── welcome.html            # Immersive landing page (served at /)
│   ├── index.html              # Main dashboard
│   ├── market.html             # Marketplace
│   ├── soil-health.html        # AI Soil Analyzer
│   ├── crop-disease.html       # AI Disease Detector
│   ├── crop-calendar.html      # Smart Crop Calendar
│   ├── analytics.html          # Analytics Dashboard
│   ├── inventory.html          # Farmer Inventory
│   ├── farmer-orders.html      # Order Management
│   ├── add-product.html        # Add New Product
│   ├── css/
│   │   └── theme.css           # Global design system
│   ├── js/
│   │   ├── common.js           # Shared auth & nav logic
│   │   ├── index.js            # Dashboard logic
│   │   ├── market.js           # Marketplace logic
│   │   ├── analytics.js        # Analytics logic
│   │   ├── soil-health.js      # Soil AI logic
│   │   ├── crop-disease.js     # Disease AI logic
│   │   └── crop-calendar.js    # Calendar logic
│   └── assets/                 # Images and logo
└── server/
    ├── server.js               # Express server + all API routes
    └── package.json
```

---

## 🔗 API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Serves landing page |
| `POST` | `/api/products` | Add a new product |
| `GET` | `/api/products` | Get all products |
| `POST` | `/api/orders` | Place a new order |
| `GET` | `/api/orders/:email` | Get orders by user email |
| `PATCH` | `/api/orders/:id/status` | Update order status |
| `POST` | `/api/register` | Register a new farm |
| `GET` | `/api/registrations` | Get all registrations |

---

## 🎨 Design System

- **Primary Color**: `#D4A017` (Gold)
- **Background**: `#2B1B0E` (Deep Brown)
- **Accent**: `#FFB800` (Amber)
- **Typography**: Inter (UI) + Noto Serif (Display)
- **Theme**: Premium dark glassmorphic with gold accents

---

## 📄 License

© 2026 F3: Fresh From Farm. All rights reserved.

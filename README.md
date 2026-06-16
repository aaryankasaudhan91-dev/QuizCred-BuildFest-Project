# 🍽️ Mealer — Zero Hunger, Powered by Community

> *"No one has ever become poor by giving."*

**Mealer** is a full-stack food and clothing donation platform that connects **Donors**, **Volunteers**, and **Beneficiaries** (NGOs, Orphanages, Old Age Homes) to eliminate food waste and fight hunger. It features a React web app, a Node.js/Express backend, and a companion Android mobile app — all powered by Firebase Authentication, MongoDB, Google Gemini AI, and Leaflet Maps.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Project Structure](#️-project-structure)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Android App Setup](#android-app-setup)
- [🔑 Environment Variables](#-environment-variables)
- [📡 API Reference](#-api-reference)
- [👥 User Roles](#-user-roles)
- [📱 Mobile App](#-mobile-app)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 🎁 For Donors
- Post food or clothing donations with photos, expiry dates, and geolocation
- AI-powered food safety analysis via **Google Gemini** before listing
- Real-time tracking of your donation's journey from pickup to delivery
- **Verification system** — approve/reject volunteer pickup with image proof
- Impact dashboard showing lives touched, meals donated, and CO₂ saved
- Favourite requester list for recurring donations

### 🚴 For Volunteers
- Browse available donation opportunities nearby with a configurable **search radius**
- **Predictive Radar** — AI-powered hotspot forecasting to anticipate future donations
- **Smart Route Optimizer** — Gemini AI plans the optimal multi-stop pickup route
- Live location sharing while in transit so donors and requesters can track progress
- Upload pickup/delivery verification images
- Mission history, reputation score, and badges

### 🏠 For Requesters (NGOs / Orphanages / Old Age Homes)
- Browse available donations and submit requests
- Live volunteer tracking on an interactive map
- Multi-level document verification system (Registration Cert, PAN, DARPAN ID, 80G)
- Per-role request history and impact metrics

### 🌐 Platform-Wide
- **Firebase Authentication** — Email/password & phone OTP (Twilio + Firebase Custom Token)
- **Real-time chat** per donation posting between donor, volunteer, and requester
- **Leaflet Maps** — Interactive map view with list/map toggle
- **Directions modal** with turn-by-turn route overlay
- **Multilingual support** (translations service built-in)
- **Dark mode** and responsive mobile-first design
- **Scroll-reveal animations** and parallax scrolling hero
- In-app rating system after every completed delivery
- Haptic feedback on supported mobile browsers

---

## 🏗️ Project Structure

```
MK2(included mobile view)/
│
├── Frontend/                   # React + TypeScript web application (Vite)
│   ├── components/             # 25+ UI components
│   │   ├── LoginPage.tsx       # Full auth flow (email, phone OTP, registration)
│   │   ├── FoodCard.tsx        # Donation card with full lifecycle actions
│   │   ├── AddDonationView.tsx # Multi-step donation creation form
│   │   ├── PostingsMap.tsx     # Leaflet map of all active postings
│   │   ├── LiveTrackingModal.tsx  # Real-time volunteer tracking
│   │   ├── PredictiveRadarView.tsx # AI hotspot prediction for volunteers
│   │   ├── RoutePlannerModal.tsx   # Gemini-optimized multi-stop route
│   │   ├── ChatModal.tsx       # Real-time in-app messaging
│   │   ├── ProfileView.tsx     # User profile management
│   │   ├── SettingsView.tsx    # App settings & account management
│   │   └── ...                 # And many more
│   │
│   ├── services/               # Service layer
│   │   ├── firebaseConfig.ts   # Firebase Auth initialization
│   │   ├── geminiService.ts    # Google Gemini AI integrations
│   │   ├── storageService.ts   # MongoDB API abstraction
│   │   ├── mapLoader.ts        # Geolocation utilities
│   │   ├── translations.ts     # Multilingual string support
│   │   └── haptics.ts          # Haptic feedback service
│   │
│   ├── App.tsx                 # Root component & global state
│   ├── types.ts                # All TypeScript types and enums
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                    # Node.js + Express REST API
│   ├── server.js               # All API routes (users, postings, chat, notifications)
│   ├── models.js               # Mongoose data models
│   └── db.js                   # MongoDB connection
│
└── Mobile view/                # Android application (Java/Kotlin)
    └── app/
        ├── src/                # Android source code
        └── build.gradle.kts    # App-level Gradle config (minSdk 28, targetSdk 36)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling** | Tailwind CSS (via PostCSS) |
| **Backend** | Node.js, Express 4 |
| **Database** | MongoDB with Mongoose 8 |
| **Authentication** | Firebase Auth (v11) + Twilio Verify (OTP) |
| **AI / ML** | Google Gemini API (`@google/genai`) |
| **Maps** | Leaflet.js |
| **Mobile** | Android (Java/Kotlin), min SDK 28, AdMob |
| **Dev Tools** | Concurrently, ESLint, TypeScript 5 |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **MongoDB** (local instance or MongoDB Atlas connection string)
- A **Firebase** project with Authentication enabled
- A **Twilio** account with Verify service (for phone OTP)
- A **Google Gemini** API key
- **Android Studio** (for the mobile app)

---

### Backend Setup

```bash
# Navigate to the frontend folder (backend scripts run from here)
cd backend

# Install dependencies
npm install

# Create your environment file
cp .env.example .env   # then fill in your values (see below)

# Start only the backend server
npm run server
```

The backend will start at `http://localhost:5000`.

> **Note:** Place your Firebase Admin SDK service account JSON file in the `Frontend/` directory and update the filename reference in `backend/server.js` if it differs from the default.

---

### Frontend Setup

```bash
cd Frontend

# Install dependencies (if not already done)
npm install

# Start the Vite dev server only
npm run dev

# OR start both backend + frontend together
npm run dev:full
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

---

### Android App Setup

1. Open the `Mobile view/` folder in **Android Studio**.
2. Sync Gradle dependencies.
3. Update `local.properties` with your Android SDK path if needed.
4. Connect a device or emulator (API 28+).
5. Click **Run** ▶️.

---

## 🔑 Environment Variables

Create a `.env` file inside the `Frontend/` directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/mealer

# Firebase (Client-side — used in firebaseConfig.ts)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# Twilio (Server-side)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid

# Server
PORT=5000
```

> ⚠️ **Never commit your `.env` file or Firebase Admin SDK JSON to version control.** Both are already listed in `.gitignore`.

---

## 📡 API Reference

All endpoints are served from `http://localhost:5000/api`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/send-otp` | Send OTP to phone via Twilio |
| `POST` | `/auth/verify-otp` | Verify OTP & issue Firebase Custom Token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | Get all users |
| `GET` | `/users/:id` | Get user by ID |
| `POST` | `/users` | Create or update user (upsert) |
| `PATCH` | `/users/:id` | Partially update user |
| `DELETE` | `/users/:id` | Delete user |

### Food/Donation Postings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/postings` | Get all postings (sorted newest first) |
| `POST` | `/postings` | Create or update posting (upsert) |
| `PATCH` | `/postings/:id` | Partially update posting |
| `DELETE` | `/postings/:id` | Delete posting |

### Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ratings` | Submit a rating (updates posting & user stats) |

### Messages (Chat)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/messages/:postingId` | Get all messages for a posting |
| `POST` | `/messages` | Send a message |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications/:userId` | Get notifications for a user |
| `POST` | `/notifications` | Create a notification |

---

## 👥 User Roles

```
Donor ──── posts donation ────► FoodPosting (AVAILABLE)
                                      │
Requester ── requests ────────────── ▼ (REQUESTED)
                                      │
Volunteer ── accepts & picks up ──── ▼ (PICKUP_VERIFICATION_PENDING)
                                      │
Donor ────── approves pickup ───────► (IN_TRANSIT)
                                      │
Volunteer ── delivers ───────────── ▼ (DELIVERY_VERIFICATION_PENDING)
                                      │
Requester ── confirms receipt ──────► (DELIVERED) ✅
```

### Donation Lifecycle Statuses

| Status | Description |
|--------|-------------|
| `AVAILABLE` | Donor posted, waiting for requester |
| `REQUESTED` | Requester has claimed it, awaiting volunteer |
| `PICKUP_VERIFICATION_PENDING` | Volunteer uploaded pickup photo; awaiting donor approval |
| `IN_TRANSIT` | Volunteer is on the way to the requester |
| `DELIVERY_VERIFICATION_PENDING` | Volunteer uploaded delivery photo; awaiting requester approval |
| `DELIVERED` | Delivery confirmed — triggers ratings & impact metrics |

---

## 📱 Mobile App

The `Mobile view/` folder contains a native **Android** companion app built with Java/Kotlin.

- **Package:** `com.mealers.mealers`
- **Min SDK:** 28 (Android 9 Pie)
- **Target SDK:** 36
- **Monetization:** Google AdMob integrated
- **Features:** Pull-to-refresh via `SwipeRefreshLayout`, Material Design components

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code passes TypeScript compilation (`npm run build`) before submitting.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ to fight hunger and reduce food waste.

**Mealer** — *Connecting hearts, one meal at a time.*

</div>

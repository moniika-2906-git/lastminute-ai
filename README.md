# LastMinute AI 🧠⚡

LastMinute AI is a production-ready, AI-powered productivity web application designed to help users proactively complete tasks before deadlines catch up with them. Unlike passive reminder applications, LastMinute AI acts as a **productivity coach** powered by **Google Gemini API** and backed by **Firebase Firestore & Authentication**.

---

## 🌟 Key Features

1. **Apple-Inspired Glassmorphic UI:** Smooth, animated layout styled with glass card blur layers, neon color indicators, and animated circular gauges.
2. **Proactive AI suggestions & Risk Analysis:** Gemini analyzes task difficulty, estimated hours, and workload density, calculates a **Delay Risk Score (0-100%)**, and warns you to reschedule non-urgent items or start immediately.
3. **Voice Assistant with Smart NLP Parsing:** Hands-free task creation. Speak naturally (e.g. *"I have a database exam next Monday morning, taking 3 hours"*). The browser's native **Speech-to-Text** transcribes it, Gemini parses it into structured JSON schema, and **Text-to-Speech** synthesizes confirmation.
4. **AI daily scheduler:** Gemini allocates daily tasks into optimized, realistic hourly blocks with breaks and Pomodoro pacing.
5. **AI Productivity Coach Chat:** Conversational chat helper aware of your active tasks and goals. Offers suggestions on reducing stress or structuring evening review.
6. **Habit Heatmap & Goal Tracker:** Standard trackers integrated with a GitHub-style 365-day calendar heatmap grid and progress log drawers.
7. **Gamification (XP, Levels, Badges):** Earn XP on completing goals and checking off habits (+10 XP) and tasks (+30 to +50 XP). Levels scale dynamically (`level = floor(sqrt(xp/100)) + 1`) and unlock badges.

---

## 📂 Folder Structure

```
lastminute-ai/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root template & Context provider
│   │   ├── page.tsx               # Landing page with active AI live demo
│   │   ├── login/                 # Firebase Auth & Mock Guest controls
│   │   ├── dashboard/             # Dashboard Layout & core screens
│   │   │   ├── page.tsx           # Dashboard main metrics page
│   │   │   ├── tasks/             # Backlog page with voice/NLP controls
│   │   │   ├── schedule/          # AI scheduler time grids
│   │   │   ├── calendar/          # Monthly calendar views
│   │   │   ├── coach/             # Coach chat streams
│   │   │   ├── habits/            # Heatmaps checklist
│   │   │   ├── goals/             # Long-term goal progress bars
│   │   │   └── settings/          # System themes and JSON exporters
│   │   └── api/                   # Backend Next.js API Routes (Server AI actions)
│   │       └── ai/
│   │           ├── smart-task/    # POST: text parser
│   │           ├── prioritize/    # POST: risk analysis
│   │           ├── scheduler/     # POST: daily block organizer
│   │           ├── coach/         # POST: chatbot turn compiles
│   │           ├── plan-day/      # POST: morning brief generator
│   │           ├── reflect/       # POST: reflection analyzer
│   │           └── quote/         # GET: fresh motivational quote
│   ├── components/                # Reusable UI cards, sidebars, headers
│   ├── lib/
│   │   ├── firebase/              # Config context providers
│   │   ├── gemini/                # Gemini client configs and templates
│   │   └── storage.ts             # Storage abstraction layer (Firestore & LocalStorage)
│   └── types/                     # TypeScript Interfaces
├── public/                        # Static assets, svg badges
├── Dockerfile                     # Production container config
├── tailwind.config.ts             # Glassmorphism theme setup
└── README.md                      # Documentation
```

---

## 🛠️ Local Installation & Development

### 1. Prerequisite Program
Ensure you have **Node.js 18+** installed.

### 2. Setup Project
Clone or copy the directory and run:
```bash
# Navigate to project directory
cd lastminute-ai

# Install dependencies
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your **Google Gemini API Key** and your **Firebase Client Configurations**. 

> [!NOTE]
> **No Configuration Fallback Mode (Demo):** If environment variables are missing, the application automatically runs in **Mock Demo Mode**. Firestore sync falls back to browser `localStorage`, and Gemini prompt endpoints return high-quality simulated mock responses. This ensures the app is **100% functional and testable immediately** out of the box!

### 4. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🚀 Deployment Guide

### Deployment Option A: Google Cloud Run (Recommended)
Google Cloud Run compiles the unified server-side Next.js container and serves it with auto-scaling.

1. **Build and Tag Container in Google Artifact Registry:**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/lastminute-ai
   ```
2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy lastminute-ai \
     --image gcr.io/YOUR_PROJECT_ID/lastminute-ai \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY=your_gemini_key_here
   ```
3. Copy the secure HTTPS URL provided by Google Cloud Run.

### Deployment Option B: Firebase Hosting + Firebase App Hosting
If deploying through Firebase's new App Hosting framework supporting SSR:
1. Initialize Hosting config:
   ```bash
   firebase init apphosting
   ```
2. Link your GitHub repository and build branch.
3. Configure the environment variable secrets (`GEMINI_API_KEY`) inside the Firebase Console Dashboard settings.

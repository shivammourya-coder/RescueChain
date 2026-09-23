# RescueChain – Local Setup & Run Guide

**RescueChain** is an AI-powered disaster response and resource coordination platform built with React 19, TypeScript, Tailwind CSS, Leaflet, Node.js, Express, and Google Gemini 2.5 Flash.

🌐 Live Prototype & Jury Access

- **Live Deployed Prototype**=https://rescuechain.ai.studio

## 1. Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js**: v18.0.0 or v20.x / v22.x LTS ([Download Node.js](https://nodejs.org/))
- **npm**: v9.x or higher (bundled with Node.js)
- **Git**: For cloning the repository

Verify your environment by running:
```bash
node -v
npm -v
```

---

## 2. Installation

1. **Clone or extract the repository**:
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd rescuechain
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

---

## 3. Environment Variables Configuration

Create a `.env` file in the root directory of the project (you can copy `.env.example`):

```bash
cp .env.example .env
```

Open `.env` and configure the following variables:

```env
# Required for AI-powered emergency report triage (Gemini 2.5 Flash)
# Get a free API key at https://aistudio.google.com/app/apikey
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Optional: JWT Secret for responder authorization (defaults to internal fallback if unset)
JWT_SECRET=rescuechain-hackathon-jwt-secret-key-2025

# Optional: Server Port (default: 3000)
PORT=3000
```

> **Note on AI Triage Fallback**: If you do not provide a `GEMINI_API_KEY`, the application will **automatically fall back** to its built-in multilingual deterministic heuristic engine (English & Hindi) without crashing.

---

## 4. Running the Development Server

Start the full-stack development server with tsx and Vite middleware:

```bash
npm run dev
```

Once started, open your browser and navigate to:
```
http://localhost:3000
```

---

## 5. Pre-Seeded Demo Test Accounts

The platform includes demo credentials for instant evaluation across all roles:

| Role | Email | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| **Citizen (Survivor)** | *(No login required)* | *(None)* | Instant SOS reporting, live tracking, and confidential 4-digit OTP |
| **Field Volunteer** | `volunteer@rescuechain.org` | `password123` | Task claims, GPS distance sorting, photo pickup upload, OTP delivery verification |
| **NGO Relief Coordinator** | `ngo@redcross.org` | `password123` | Depot registration, resource management (boats, medical kits, rations, water) |
| **Authority / Commander** | `authority@disaster.gov` | `password123` | Incident feed, severity filters, cluster density metrics, analytics |

*Tip: You can also use the **Jury Demo Deck** bar at the top of the interface to switch roles with a single click.*

---

## 6. Other Useful Scripts

- **Rebuild Hackathon Documentation PDF**:
  ```bash
  npm run docs:pdf
  ```
  Generates `RescueChain_Documentation.pdf` in both the project root and `public/` directory.

- **Type Check / Lint**:
  ```bash
  npm run lint
  ```

- **Production Build & Execution**:
  ```bash
  npm run build
  npm run start
  ```

# ApexLoad Setup Guide

Welcome to ApexLoad! This guide covers how to set up the application for local development from the repository, as well as how to install and run the packaged `.dmg` application on macOS (including troubleshooting Gatekeeper security warnings).

---

## 💻 Part 1: Local Development Setup

Follow these steps if you want to run the project from source, modify the code, or contribute to development.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (Node Package Manager)
- Git

### 1. Clone the Repository
Clone the project to your local machine:
\`\`\`bash
git clone <repository-url>
cd ApexLoad
\`\`\`

### 2. Install Dependencies
This project uses a monorepo structure with `frontend` and `backend` packages. Install dependencies in the root and in all packages:
\`\`\`bash
npm install
cd packages/backend && npm install
cd ../frontend && npm install
\`\`\`

### 3. Setup Environment Variables
Navigate to the `packages/backend` directory and create a `.env` file for your configuration:
\`\`\`bash
cd packages/backend
touch .env
\`\`\`

Add the following to your `.env` to enable the AI analyzer features:
\`\`\`env
OPENROUTER_API_KEY="your-openrouter-api-key"
DATABASE_URL="file:./prisma/dev.db"
\`\`\`
*(If you do not provide an API key, the REST API and Websockets will still run, but the AI Bottleneck Analyst will be disabled).*

### 4. Database Setup
Initialize your local SQLite database using Prisma:
\`\`\`bash
cd packages/backend
npx prisma generate
npx prisma db push  # or npx prisma migrate dev
\`\`\`

### 5. Running the App (Development Mode)
You will need to run the backend and frontend concurrently in two separate terminal tabs.

**Terminal 1 (Backend):**
\`\`\`bash
cd packages/backend
npm run dev
\`\`\`

**Terminal 2 (Frontend):**
\`\`\`bash
cd packages/frontend
# This will launch the Vite React app inside the Electron wrapper
npm run dev:electron
\`\`\`

---

## 📦 Part 2: Installing the Packaged App (.dmg)

Follow these steps if you just want to use the application and have received the `.dmg` installer file.

### Step 1: Download the correct architecture
If you received multiple `.dmg` files, make sure to pick the right one for your Mac:
- **`ApexLoad-x.x.x-arm64.dmg`**: For Macs with Apple Silicon processors (M1, M2, M3, M4).
- **`ApexLoad-x.x.x.dmg`**: For older Macs with Intel processors.

*(Using the wrong architecture will result in an immediate "This app cannot be opened" error).*

### Step 2: Install the App
1. Double-click the `.dmg` file to mount it.
2. Drag the **ApexLoad** icon into the **Applications** folder shortcut.

### Step 3: Bypassing macOS Gatekeeper
Because this app is not distributed through the Mac App Store and might not be signed with a paid Apple Developer certificate, macOS will flag it as coming from an "unidentified developer" the first time you try to launch it.

**Method A: The "Right-Click" Bypass (Recommended)**
1. Open your **Applications** folder.
2. **Do not** double-click the app.
3. Instead, hold the `Control` key and click the `ApexLoad` app icon (or Right-Click it).
4. Select **"Open"** from the menu.
5. In the warning dialog that appears, click the **"Open"** button. (You only have to do this once).

**Method B: The Terminal Fix (If macOS says the app is "Damaged")**
Sometimes macOS puts the app in heavy quarantine, falsely stating that the app is "damaged and should be moved to the Trash". To clear the quarantine flag manually:
1. Open the **Terminal** application (you can search for it in Spotlight or Launchpad).
2. Copy and paste the following exact command:
   \`\`\`bash
   xattr -cr /Applications/ApexLoad.app
   \`\`\`
3. Press `Enter`.
4. You can now double-click to open the app normally!

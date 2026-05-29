# Estima 🃏⏱️

**Estima** is a premium, real-time collaborative Agile estimation and consensus-sizing board (Scrum Poker) built as a unified, monolithic TypeScript application. Designed with modern aesthetics and micro-animations, it provides a high-fidelity glassmorphic UI to make planning poker sessions smooth, engaging, and fast.

---

## ✨ Features

- **Flat Hierarchical Access**: No host concept. Every participant in a room has full rights to control timers, reset or reveal votes, and clear selections.
- **Real-Time Synchronization**: Sizing card selections, countdown timers, and voting states update instantly for all players using Socket.io.
- **Fibonacci Sizing Deck**: Responsive card deck including `0`, `1`, `2`, `3`, `5`, `8`, `13`, `21`, `☕` (Break), and `?` (Unsure).
- **Consensus Sizing Analytics**: Calculates voter participation rate, average estimates, majority agreement values, and a sorted frequency distribution (e.g. `3 people: 8`, `1 person: 5`) upon card reveal.
- **Visual Themes**: Dynamic styling system featuring 4 premium themes: **Light** (default pure white), **Dark**, **Cyberpunk**, and **Sunset**.
- **Auto-Rejoin & Refresh Recovery**: Session states persist locally. A **5-second grace period** on the server keeps empty rooms active on disconnect, allowing players to refresh the page without dropping their vote or resetting the room.

---

## 🛠️ Tech Stack

- **Frontend**: React (Functional Components + Hooks), Vite (Fast bundling), TypeScript, Lucide React, Socket.io Client.
- **Backend**: Node.js, Express, Socket.io Server, TypeScript.
- **Styling**: Pure vanilla CSS featuring smooth gradients, glassmorphism, and responsive CSS variables.

---

## 📁 Repository Structure

```text
├── package.json               # Root scripts (build, start, install, dev)
├── backend/                   # Node.js + Express + Socket.io backend
│   ├── src/
│   │   ├── server.ts          # Main Socket.io handlers & grace-period logic
│   │   └── types.ts           # Shared TypeScript typings
│   ├── tsconfig.json          # TypeScript backend configurations
│   └── package.json
└── frontend/                  # React + Vite + TypeScript frontend
    ├── index.html
    ├── src/
    │   ├── App.tsx            # Main state manager & socket router
    │   ├── index.css          # Styled UI framework & glassmorphic themes
    │   ├── types.ts           # Frontend shared typings
    │   └── components/
    │       ├── JoinRoom.tsx   # Split-panel landing page / room selection
    │       ├── LogoIcon.tsx   # Custom SVG logo component
    │       ├── PokerBoard.tsx # Sizing card selector and player list grid/row switcher
    │       └── SidebarOptions.tsx # Timer dials, vote statistics, and room actions
    ├── tsconfig.json          # Vite TypeScript configuration
    └── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 1. Installation

Install all root, frontend, and backend dependencies with a single command:
```bash
npm run install:all
```

### 2. Run in Development Mode

Starts both the backend API server (`http://localhost:5000`) and the Vite client dev server (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

### 3. Build & Run in Production

Compile the TypeScript backend and bundle the React frontend static assets:
```bash
npm run build
```

Start the monolithic production server:
```bash
npm run start
```
By default, the server runs on port `5000` (or `process.env.PORT` on cloud environments) and serves both the Socket.io WebSocket handlers and the frontend client build.

---

## 📦 Production Deployment

### Hostname configuration
The client is configured to connect to `https://estima.io` by default in production. If you deploy the frontend and backend to separate servers, adjust the fallback URL configuration inside [App.tsx](frontend/src/App.tsx).

### Monolithic Cloud Deploy (Render, Railway, Heroku)
1. Link your Git repository.
2. Set the build command: `npm run build`
3. Set the start command: `npm run start`
4. The service will map the ports automatically and serve the entire application under a single dyno or runtime container.

---


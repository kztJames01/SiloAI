# Silo - AI Automation Platform

A powerful, self-hostable workflow automation platform that combines visual building with code flexibility and AI-first capabilities.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20TypeScript-blue)
![Web](https://img.shields.io/badge/Web-React%20%2B%20TypeScript-blue)
![Mobile](https://img.shields.io/badge/Mobile-React%20Native%20(Expo)-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)

## 🚀 Quick Start

### 1. Start Services
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Setup Backend
```bash
cd backend
npm install
cp ../.env.example .env
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

### 3. Setup Web Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 4. Setup Mobile App
```bash
cd mobile
npm install
cp .env.example .env
npm run start
```

**Access the app:**
- Frontend: http://localhost:5173
- Mobile: Expo DevTools (local URL shown in terminal)
- Backend API: http://localhost:5000

## ✨ Features

### 🎨 Visual Workflow Builder
- **Drag-and-drop interface** powered by React Flow
- **Real-time canvas** with nodes and connections
- **4 core node types:** Start, HTTP Request, Code, If/Else
- **Visual configuration** panel for each node
- **Mini map & controls** for easy navigation

### ⚡ Powerful Execution Engine
- **Topological execution** - smart node ordering
- **Real-time logging** - see every step
- **Error handling** - graceful failure recovery
- **Context passing** - data flows between nodes
- **Async execution** - non-blocking workflows

### 🔐 Secure Authentication
- JWT token-based auth
- Password hashing with bcrypt
- Protected API routes
- Auto token refresh

### 📊 Monitoring & Analytics
- Execution history tracking
- Detailed logs per node
- Success/failure metrics
- Duration tracking
- Output data inspection

## 🏗️ Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (database)
- Redis (caching & queues)
- BullMQ (job processing)
- Prisma (ORM)

### Frontend
- React + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- React Flow (workflow visualization)
- Zustand (state management)

### Mobile
- React Native + Expo
- Expo Router
- Shared API/types from `shared/`

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Silo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the database and services:
```bash
npm run docker:up
```

5. Run database migrations:
```bash
cd backend
npm run prisma:migrate
```

6. Start development servers:
```bash
npm run dev
```

7. Start mobile app (optional in parallel):
```bash
npm run dev:mobile
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🐳 Docker Deployment

### Development
```bash
docker-compose up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Project Structure

```
silo/
├── backend/          # Node.js backend
│   ├── src/
│   │   ├── api/      # REST API routes
│   │   ├── engine/   # Workflow execution engine
│   │   ├── nodes/    # Node implementations
│   │   ├── ai/       # AI integration layer
│   │   ├── auth/     # Authentication
│   │   └── db/       # Database & Prisma
├── frontend/         # React web app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── editor/   # Workflow editor
│   │   └── lib/
├── mobile/           # React Native (Expo) app
│   ├── app/          # Expo Router screens
│   └── ...
├── shared/           # Shared API client/types for web + mobile
│   └── src/
└── docker-compose.yml
```

## 🔧 Development

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Mobile
```bash
cd mobile
npm run start        # Start Expo dev server
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator/device
npm run web          # Run mobile app on web
```

## 📖 API Documentation

API documentation is available at `http://localhost:3000/api/docs` when running in development mode.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

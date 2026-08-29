# Silo

Workflow automation for ops teams and field workers. Web app, API, and a mobile companion.

## Run locally

Need Node 20, Docker, and npm.

```bash
docker-compose -f docker-compose.dev.yml up -d
cp .env.example .env
npm install

cd backend
npx prisma migrate dev
npm run prisma:seed
cd ..

npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:5000

Mobile (optional):

```bash
cd mobile
npm install
cp .env.example .env
npm run start
```

## Layout

```
backend/   Express API + workflow engine
frontend/   React web app
mobile/     Expo app (field + monitor)
shared/     API client and types
```

## Scripts

```bash
npm run dev           # backend + frontend
npm run dev:mobile    # expo
cd backend && npm test
```

Copy `.env.example` and fill in secrets before deploying. After deploy run `npx prisma migrate deploy` from `backend/`.

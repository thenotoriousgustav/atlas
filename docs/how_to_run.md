# 🚀 Running the Atlas Platform

Here is the quickstart guide to running, database seeding, and developing on the Atlas monorepo platform.

## 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v22+)
- **pnpm** (v11+)
- **PostgreSQL** (v15+) running locally on port `5432`

---

## ⚡ Quickstart (All-in-One Command)

To spin up the entire monorepo (both the backend and the frontend) simultaneously with live-reload:

```bash
pnpm dev
```

This starts:
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **Cabinet Frontend**: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Running Services Separately

If you prefer to run services in separate terminal sessions for isolated logs:

### 1. Database (If using Docker Compose)
If you aren't using a native PostgreSQL setup, you can launch database containers:
```bash
pnpm db:up
```

### 2. NestJS Backend API
Starts the backend dev server (generates OpenAPI spec and maps routes):
```bash
pnpm --filter @atlas/api dev
```

### 3. Cabinet Frontend
Starts the Next.js frontend dev server:
```bash
pnpm --filter @atlas/cabinet dev
```

---

## 🔑 Default Login Credentials

We pre-seeded a default administrator account into the local database:

- **Email**: `admin@gustam.dev`
- **Password**: `password123`

---

## 🔍 Interactive Endpoints

Once the apps are running, you can explore:

* **Swagger API Documentation**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
* **OpenAPI Schema (JSON)**: [http://localhost:4000/api-json](http://localhost:4000/api-json)
* **Cabinet Frontend Shell**: [http://localhost:3000](http://localhost:3000)

---

## 💾 Database Migrations & Seeding

If you need to rebuild the database schema or re-run the seed script:

```bash
# Apply Prisma migrations
pnpm --filter @atlas/api prisma:migrate

# Seed database with initial users
pnpm --filter @atlas/api prisma:seed
```

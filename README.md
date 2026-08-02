# National Cyber Threat Intelligence Platform

An enterprise AI-assisted SOC (Security Operations Center) threat intelligence platform built with NestJS, React, OpenSearch, BullMQ, and Groq LLM inference.

---

## 🚀 Current Status: Phase 4 Complete (Phases 0–4 Verified)

| Phase | Description | Status |
| :--- | :--- | :---: |
| **Phase 0** | Core Architecture, NestJS API, PostgreSQL Schema & RBAC | ✅ Verified |
| **Phase 1** | Threat Feed Ingestion Collectors (OTX, NVD CVE, abuse.ch) & BullMQ Queues | ✅ Verified |
| **Phase 2** | OpenSearch Mirror, MalwareBazaar Metadata DB & Relational Correlation | ✅ Verified |
| **Phase 3** | Multi-Condition Detection Engine, Deduplication & Groq AI Threat Summaries | ✅ Verified |
| **Phase 4** | SOC Analyst Experience, Spatial Attack Map, Case Timeline & READ_ONLY RBAC | ✅ Verified |
| **Phase 5** | Production Hardening, SIEM Export & Extended Copilot Workflows | ⏳ Next |

---

## 🏗️ Technology Stack

- **Backend**: NestJS (TypeScript), REST APIs, Class Validator DTOs, Swagger/OpenAPI (`/api/docs`)
- **Database & ORM**: PostgreSQL 16, Prisma ORM
- **Async Queue & Background Workers**: Redis 7, BullMQ (`sync-otx`, `sync-nvd`, `sync-abusech`, `sync-malware`)
- **Search Mirror**: OpenSearch 2.13 (`ctp-iocs`, `ctp-cves`, `ctp-malware`)
- **AI Threat Summaries**: Groq API (`llama-3.3-70b-versatile`)
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React
- **Authentication & Security**: JWT Bearer Tokens, Bcrypt Password Hashing, NestJS `RolesGuard` RBAC

---

## 🔑 Environment Variables Required

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Environment Variable Names
- `NODE_ENV`
- `PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `DATABASE_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `BCRYPT_SALT_ROUNDS`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `VITE_API_BASE_URL`
- `OTX_API_KEY`
- `NVD_API_KEY`
- `GROQ_API_KEY`
- `OPENSEARCH_NODE`

---

## ⚙️ Quick Start (Local Setup)

### 1. Launch Docker Infrastructure & App
```bash
docker-compose up -d --build
```

### 2. Seed Initial Users, Feeds & Detection Rules
```bash
cd backend
npx prisma db seed
```

### 3. Access Application Services
- **SOC Web Console**: [http://localhost:5173](http://localhost:5173)
- **API Swagger Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **OpenSearch Cluster**: [http://localhost:9200](http://localhost:9200)

### 🔐 Demo Accounts
- **Admin**: `admin@cyberintel.gov` / `AdminSecurePass123!` (`ADMIN` role)
- **Analyst**: `analyst@cyberintel.gov` / `AnalystPass123!` (`SOC_ANALYST` role)
- **Read-Only**: `readonly@cyberintel.gov` / `ReadOnlyPass123!` (`READ_ONLY` role)

---

## 🧪 Verification & Testing

To run the automated verification suites:

```bash
# Run Phase 4 Scoped Verification Suite
cd backend
npx ts-node src/test-phase4-verification.ts

# Run Direct HTTP API 403 Forbidden RBAC Suite
npx ts-node src/test-rbac-403.ts

# Trigger All Threat Feed Sync Workers
npx ts-node src/run-all-syncs.ts
```

---

## 📜 License
Unlicensed / Enterprise SOC Internal.

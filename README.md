# National Cyber Threat Intelligence Platform

An enterprise AI-assisted Security Operations Center (SOC) threat intelligence platform built to aggregate live threat feeds, detect multi-vector cyber threats, correlate malware & vulnerabilities, manage digital forensics with immutable chain-of-custody, and export SIEM alert streams.

---

## 🎯 Current Status: Phases 0–5 Complete & Verified

| Phase | Module / Capability | Status |
| :--- | :--- | :---: |
| **Phase 0** | Core Architecture, NestJS REST API, PostgreSQL Schema & RBAC | ✅ Verified |
| **Phase 1** | Threat Feed Ingestion Collectors (OTX, NVD CVE, abuse.ch) & BullMQ Queues | ✅ Verified |
| **Phase 2** | OpenSearch Mirror, MalwareBazaar Metadata DB & Relational Correlation | ✅ Verified |
| **Phase 3** | Multi-Condition Detection Engine, Deduplication & Groq AI Threat Summaries | ✅ Verified |
| **Phase 4** | SOC Analyst Experience, Spatial Attack Map, Case Management & Read-Only RBAC | ✅ Verified |
| **Phase 5** | Digital Forensics Module, SIEM Export Stub & Self-Hosted MISP Integration | ✅ Verified |
| **Phase 6** | Hardening, Production Deployment & Infrastructure Hardening | 🔄 In Progress |

---

## 🛠️ Technology Stack

- **Backend Framework**: NestJS (TypeScript), REST APIs, Class Validator DTOs, Swagger/OpenAPI (`/api/docs`)
- **Frontend Shell**: React 18, Vite, TypeScript, Vanilla CSS, Lucide React Icons
- **Primary Database & ORM**: PostgreSQL 16, Prisma ORM
- **Threat-Sharing Platform**: Self-Hosted MISP + Dedicated MariaDB 10.11 database
- **Search & Mirror Engine**: OpenSearch 2.13 (`ctp-iocs`, `ctp-cves`, `ctp-malware`)
- **Async Queue & Job Broker**: Redis 7, BullMQ (`sync-otx`, `sync-nvd`, `sync-abusech`, `sync-malware`, `sync-misp`)
- **AI Threat Scoring & Summaries**: Groq API (`llama-3.3-70b-versatile`)
- **Container Orchestration**: Docker Compose
- **Security & Authentication**: JWT Bearer Tokens, Bcrypt Hashing, Role-Based Access Control (`RolesGuard`)

---

## ✨ Core Features

- **Live Threat Feed Ingestion**: Collectors for AlienVault OTX, NVD CVE 2.0, abuse.ch FeodoTracker, abuse.ch MalwareBazaar, and self-hosted MISP threat-sharing feeds with path-status tagging (`LIVE_API_SUCCESS` / `LIVE_API_FAILED_USED_FALLBACK`).
- **Multi-Vector Detection Engine**: Configurable rule engine supporting `SIMPLE`, `MULTI_CONDITION`, `THRESHOLD`, and cross-feed `CORRELATION` detection rules.
- **Malware Repository & Relational Graph**: In-depth malware sample metadata linked relationally to CVE vulnerabilities and IOCs.
- **Groq LLM Advisory Engine**: Automated AI risk analysis, natural language threat explanations, and suggested severity ratings.
- **SOC Analyst Command Shell**: High-density dashboard, live spatial attack map visualization, global threat search, and real-time alert triage.
- **Investigation & Case Management**: Case lifecycle tracking, analyst assignments, linked entity views, and chronological audit trail logs.
- **Digital Forensics Module**: Immutable forensic artifact registry (`LOG_FILE`, `MEMORY_DUMP_META`, `NETWORK_CAPTURE_META`, `FILE_METADATA`) with strict append-only chain-of-custody tracking. Rejects past entry editing or deletion.
- **SIEM Integration Export**: Standardized export endpoint (`GET /api/siem/export`) supporting Common Event Format (`CEF`) and structured `JSON`, protected via administrative static service keys (`X-SIEM-API-KEY`).
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across `ADMIN`, `INVESTIGATOR`, `SOC_ANALYST`, and `READ_ONLY` roles.

---

## 🔑 Required Environment Variables

Copy `.env.example` to `.env` before running the application:

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
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRATION`
- `BCRYPT_SALT_ROUNDS`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `VITE_API_BASE_URL`
- `OTX_API_KEY`
- `NVD_API_KEY`
- `GROQ_API_KEY`
- `MISP_BASE_URL`
- `MISP_API_KEY`
- `MISP_ADMIN_PASSWORD`
- `SIEM_API_KEY`
- `OPENSEARCH_NODE`

---

## ⚙️ Setup & First-Run Instructions

### 1. Launch Docker Infrastructure Stack
```bash
docker-compose up -d --build
```

### 2. Run Database Migrations & Seed Default Data
```bash
cd backend
npx prisma db push
npx prisma db seed
```

### 3. Enable MISP Community Feeds & Fetch Events (First Run)
To populate the self-hosted MISP instance with authentic community threat events:
```bash
cd backend
npx ts-node src/fetch-circl-osint-feed.ts
```

### 4. Access Platform Interfaces
- **SOC Web Shell**: [http://localhost:5173](http://localhost:5173)
- **API Swagger Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **MISP Threat-Sharing Web UI**: [http://localhost:8443](http://localhost:8443)
- **OpenSearch Cluster**: [http://localhost:9200](http://localhost:9200)

---

## 🧪 Verification & Automated Test Suites

Run the automated verification scripts inside the `backend/` directory:

```bash
cd backend

# Run Phase 5 Automated Verification Suite
npx ts-node src/test-phase5-verification.ts

# Run Live HTTP & RBAC Verification Suite
npx ts-node src/test-phase5-http-rbac.ts

# Run Phase 4 Scoped Verification Suite
npx ts-node src/test-phase4-verification.ts

# Run Direct HTTP API 403 Forbidden RBAC Suite
npx ts-node src/test-rbac-403.ts
```

---

## 👥 Project Team

Designed and developed by a 3-person engineering team for National Cyber Threat Intelligence & SOC Operations.

---

## 📜 License

Unlicensed / Internal Government & Enterprise SOC Platform.

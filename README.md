# National Cyber Threat Intelligence Platform

An enterprise AI-assisted Security Operations Center (SOC) threat intelligence platform built to aggregate live threat feeds, detect multi-vector cyber threats, correlate malware & vulnerabilities, manage digital forensics with immutable chain-of-custody, execute automated SOAR response playbooks, stream live SIEM events, provide STIX/TAXII 2.1 threat sharing, and generate dual-audience AI incident reports.

---

## 🎯 Current Status: Phases 0–7 Complete & Verified

| Phase | Module / Capability | Status |
| :--- | :--- | :---: |
| **Phase 0** | Core Architecture, NestJS REST API, PostgreSQL Schema & RBAC | ✅ Verified |
| **Phase 1** | Threat Feed Ingestion Collectors (OTX, NVD CVE, abuse.ch) & BullMQ Queues | ✅ Verified |
| **Phase 2** | OpenSearch Mirror, MalwareBazaar Metadata DB & Relational Correlation | ✅ Verified |
| **Phase 3** | Multi-Condition Detection Engine, Deduplication & Groq AI Threat Summaries | ✅ Verified |
| **Phase 4** | SOC Analyst Experience, Spatial Attack Map, Case Management & Read-Only RBAC | ✅ Verified |
| **Phase 5** | Digital Forensics Module, SIEM Export Stub & Self-Hosted MISP Integration | ✅ Verified |
| **Phase 6** | Hardening, Production Deployment Prep, Load Testing & Security Audit | ✅ Verified |
| **Phase 7** | SOAR Response Playbooks, Live SIEM Push, VirusTotal Scanning, Brevo SMTP Alerts, STIX/TAXII 2.1 & Dual-Audience AI Incident Reports | ✅ Verified |

---

## 🛠️ Technology Stack

- **Backend Framework**: NestJS (TypeScript), REST APIs, Class Validator DTOs, Swagger/OpenAPI (`/api/docs`), `@nestjs/throttler` Rate Limiting
- **Frontend Shell**: React 18, Vite, TypeScript, Vanilla CSS, Lucide React Icons
- **Primary Database & ORM**: PostgreSQL 16, Prisma ORM (Indexed for high-concurrency queries)
- **Threat-Sharing Platform**: Self-Hosted MISP + Dedicated MariaDB 10.11 database
- **Search & Mirror Engine**: OpenSearch 2.13 (`ctp-iocs`, `ctp-cves`, `ctp-malware`)
- **Async Queue & Job Broker**: Redis 7, BullMQ (`sync-otx`, `sync-nvd`, `sync-abusech`, `sync-malware`, `sync-misp`)
- **AI Threat Scoring & Reports**: Groq API (`llama-3.3-70b-versatile`)
- **Container Orchestration**: Docker Compose
- **Security & Authentication**: JWT Bearer Tokens, Bcrypt Hashing, Role-Based Access Control (`RolesGuard`), Rate Limiting, Configurable CORS

---

## ✨ Core Features

- **Live Threat Feed Ingestion**: Collectors for AlienVault OTX, NVD CVE 2.0, abuse.ch FeodoTracker, abuse.ch MalwareBazaar, and self-hosted MISP threat-sharing feeds with path-status tagging (`LIVE_API_SUCCESS` / `LIVE_API_FAILED_USED_FALLBACK`).
- **Multi-Vector Detection Engine**: Configurable rule engine supporting `SIMPLE`, `MULTI_CONDITION`, `THRESHOLD`, and cross-feed `CORRELATION` detection rules.
- **Malware Repository & VirusTotal Scanner**: In-depth malware sample metadata linked relationally to CVE vulnerabilities, IOCs, and VirusTotal v3 API reputation verdicts (`POST /api/malware/:id/scan`).
- **SOAR Automated Response Playbooks**: Event-driven playbook execution engine supporting auto-case creation, severity escalation, analyst round-robin assignment, and live SIEM streaming (`/api/playbooks`).
- **Live SIEM Push Integrations**: Automated HTTP POST streaming to Splunk HEC (`:8088`) and Wazuh Manager API (`:55000`) on `HIGH` and `CRITICAL` alerts.
- **STIX 2.1 / TAXII 2.1 Threat Sharing Server**: Normalized STIX 2.1 Cyber Threat Intelligence objects (`indicator`, `malware`, `vulnerability`) exposed via TAXII 2.1 Discovery & Collection REST endpoints (`/api/taxii2/`).
- **Transactional Email Alerting (Brevo SMTP)**: Automated HTML email alerts sent to `ADMIN` and `INVESTIGATOR` users upon `CRITICAL` alert creation.
- **Dual-Audience AI Incident Reports**: Groq LLM-powered incident reporter (`POST /api/cases/:id/generate-report`) producing plain-language C-Suite Executive Summaries and Engineering Technical Deep-Dives.
- **SOC Analyst Command Shell**: High-density dashboard, live spatial attack map visualization, global threat search, real-time alert triage, and SOAR builder UI.
- **Digital Forensics Module**: Immutable forensic artifact registry (`LOG_FILE`, `MEMORY_DUMP_META`, `NETWORK_CAPTURE_META`, `FILE_METADATA`) with strict append-only chain-of-custody tracking. Rejects past entry editing or deletion.
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
- `CORS_ORIGIN`
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
- `SPLUNK_HEC_URL`
- `SPLUNK_HEC_TOKEN`
- `WAZUH_API_URL`
- `WAZUH_API_KEY`
- `VIRUSTOTAL_API_KEY`
- `BREVO_SMTP_USER`
- `BREVO_SMTP_KEY`
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

### 3. Trigger Explicit Data Ingestion
```bash
cd backend
# Synchronize all threat feeds (OTX, NVD, abuse.ch, MISP)
npx ts-node src/run-all-syncs.ts

# Fetch live CIRCL OSINT threat events into MISP
npx ts-node src/fetch-circl-osint-feed.ts
```

### 4. Access Platform Interfaces
- **SOC Web Shell**: [http://localhost:5173](http://localhost:5173)
- **API Swagger Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **TAXII 2.1 Discovery API**: [http://localhost:3000/api/taxii2/](http://localhost:3000/api/taxii2/)
- **MISP Threat-Sharing Web UI**: [http://localhost:8443](http://localhost:8443)
- **OpenSearch Cluster**: [http://localhost:9200](http://localhost:9200)

---

## 🧪 Verification & Automated Test Suites

Run the automated verification scripts inside the `backend/` directory:

```bash
cd backend

# Run Phase 7 Automated Response, STIX/TAXII 2.1 & AI Report Suite
npx ts-node src/test-phase7-verification.ts

# Run Phase 6 Load & Stress Testing Benchmark
npx ts-node src/test-load-performance.ts

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

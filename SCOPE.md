# National Cyber Threat Intelligence Platform — Project Scope & Module Roadmap

## Overview
This document tracks the phased development roadmap for the National Cyber Threat Intelligence Platform (AI-assisted SOC tool).

---

## Phased Breakdown Table

| Phase | Milestone | Focus Areas | Status |
| :--- | :--- | :--- | :---: |
| **Phase 0** | **Core Architecture & RBAC** | PostgreSQL schema, NestJS API, JWT Auth, Swagger, Redis & Docker Compose | ✅ Complete |
| **Phase 1** | **Live Ingestion Pipeline** | Threat feed collectors (OTX, NVD, abuse.ch), BullMQ queue workers, deduplication | ✅ Complete |
| **Phase 2** | **Malware DB & OpenSearch Mirror** | abuse.ch MalwareBazaar metadata ingestion, OpenSearch indexing, CVE-IOC-Malware links | ✅ Complete |
| **Phase 3** | **Detection Engine & AI Scoring** | Multi-condition rules, threshold rules, alert deduplication, Groq LLM advisory scoring | ✅ Complete |
| **Phase 4** | **Analyst Experience & Workflows** | SOC Dashboard, Attack Map clustering, Investigation case files, Audit Timeline, READ_ONLY RBAC | ✅ Complete |
| **Phase 5** | **SIEM & Production Hardening** | SIEM export/forwarding, extended copilot capabilities, production deployment | ⏳ Planned |

---

## Phase 1 Included Modules

1. **Authentication & RBAC (`/auth`)**
   - JWT login, registration, token refresh, `/api/auth/me`
   - Role-Based Access Control (`ADMIN`, `SOC_ANALYST`, `INVESTIGATOR`, `READ_ONLY`)
   - Bcrypt password hashing & Admin seed script

2. **User Management (`/users`)**
   - User profile endpoints & role management (Admin only)

3. **Case Management (`/cases`)**
   - CRUD lifecycle for security investigation cases (`OPEN`, `IN_PROGRESS`, `CLOSED`)

4. **Alerts Module (`/alerts`)**
   - CRUD management for security alerts and correlation links

5. **IOC Data Schema (`/iocs`)**
   - Data models for IPs, Domains, Hashes, and URLs with relational case links

6. **Audit Trail Logging (`/audit`)**
   - Interceptor capturing system mutation actions and target entity logs

---

## Out of Scope for Phase 1
- Threat feed collectors & ingestion pipelines
- Automated detection rules & LLM features
- Real-time attack map UI & analytics graphs
- Malware sandbox & SIEM exporters

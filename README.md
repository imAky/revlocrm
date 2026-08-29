<div align="center">

# ⚡ Revlo CRM (`revlocrm`)

### Modern B2B Outbound Intelligence & Collaborative Sales Pipeline Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Resend](https://img.shields.io/badge/Resend-Email_OTP-000000?style=for-the-badge&logo=resend)](https://resend.com/)
[![Google SSO](https://img.shields.io/badge/Google_SSO-OAuth_2.0-EA4335?style=for-the-badge&logo=google)](https://cloud.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<p align="center">
  A fast, lightweight, open-source outbound CRM engineered for growth teams, SDRs, and agency founders. Qualify prospects with automated 4-pillar heuristic scoring, conduct digital footprint audits, manage 13-stage bidirectional pipelines, and collaborate securely with 100% passwordless authentication and granular RBAC.
</p>

[**Live Demo**](http://localhost:3000) • [**Quick Start Guide**](#-quick-start-guide) • [**Feature Tour**](#-visual-ui-tour--feature-gallery) • [**Authentication Setup**](#-100-passwordless-authentication--security) • [**ICP Scoring Formula**](#-0100-deterministic-4-pillar-lead-scorer)

</div>

---

## 📸 Visual UI Tour & Feature Gallery

### 1. Executive Dashboard & Live Pipeline Intelligence
Real-time KPI metrics, active pipeline valuation ($184.5k+), stage conversion funnel, and priority outreach queue.
![Revlo CRM Dashboard](public/uploads/dashboard.png)

---

### 2. Prospect Research Directory & 4-Pillar ICP Scoring
11-facet multi-filter query console with interactive 0–100 heuristic scoring popovers, progress bars, and verified decision-maker dossiers.
![Revlo CRM Prospects Directory](public/uploads/prospects.png)

---

### 3. 13-Stage Bidirectional Kanban Sales Pipeline
Fluid drag-and-drop opportunity board with real-time deal sizing, stage durations, and instant stage rollback controls.
![Revlo CRM Pipeline Board](public/uploads/pipeline.png)

---

### 4. Market Research Keyword Engine
Track localized industry search volumes, CPC benchmarks, and associate leads with target keywords with 1-click Google Maps linkage.
![Revlo CRM Market Research](public/uploads/reseearch.png)

---

### 5. Omnichannel Activity Stream & Follow-Up Tasks
Log calls, meetings, notes, and emails directly on the company timeline with scheduled reminders and priority tags.
![Revlo CRM Activities Feed](public/uploads/activities.png)

---

### 6. Company Dossier & Key Stakeholders Profile
Comprehensive 30+ field intelligence profile with verified C-level contacts, direct dials, and zero-migration custom fields.
![Revlo CRM Contact & Prospect Dossier](public/uploads/contact.png)

---

## 🌟 Comprehensive Feature Matrix

### 🔒 1. 100% Passwordless Authentication & Admin Step-Up Security
- **Zero Passwords to Store or Leak**: Pure Google 1-Click SSO and Resend 6-digit email OTP verification.
- **Jose HS256 Encrypted Sessions**: Cookie-based JWT tokens storing user ID, email, name, role, workspace, and Google avatar.
- **Zero Data Loss Member Suspension**: Soft-deactivate team members (`status = 'suspended'`) without breaking foreign key references to historic leads, tasks, or activity logs.
- **Step-Up Admin Security**: High-risk team actions (member deactivation/suspension) require a verified 6-digit Admin email OTP before execution.
- **Dynamic Host Resolution**: Automatically resolves invitation URLs (`NEXT_PUBLIC_APP_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `APP_URL`) so team invites generate correct production links.

---

### ⚡ 2. 0–100 Deterministic 4-Pillar Lead Scorer
Eliminates qualification guesswork with a standardized 100-point algorithm:
- **💼 Commercial Fit (35% / Max 35 Pts)**: ICP budget fit, ability to pay, deal urgency, and detected buying signals.
- **🌐 Digital Presence & UX (30% / Max 30 Pts)**: Website existence, mobile UX responsiveness, CTA quality, and online quote flows.
- **⭐ Local Google Maps Reputation (20% / Max 20 Pts)**: Verified star rating ($\ge 4.5\star$) and review count volume ($\ge 50$ reviews).
- **🎯 Outreach Readiness (15% / Max 15 Pts)**: Verified C-level decision-maker contact with direct phone/email and local SEO ranking.
- **Automated Grade Assignment**: `A+` (90–100), `A` (75–89), `B` (60–74), `C` (40–59), and `D` (0–39).

---

### 🗂️ 3. Multi-Field Search & Facet Query Engine
- **Target Search Selector**: Search across *All Fields*, *Company Name*, *Industry / Niche*, *Location (City/State)*, *Contact Email/Phone*, or *Opportunity Keywords*.
- **Multi-Facet Filters**: Niche, Stage, Grade (`A+` to `D`), ICP Fit (`HIGH`/`MED`/`LOW`), Minimum Score ($\ge 60, \ge 75, \ge 85, \ge 90$), and Deal Size ($10k+, $20k+, $30k+).
- **Dual View Modes**: Responsive spreadsheet Table and high-density Card Grid view modes.

---

### 📈 4. 13-Stage Bidirectional Pipeline Kanban
Fluid horizontal Kanban board representing the complete sales lifecycle:
`Researching` ➔ `Qualified` ➔ `Ready to Contact` ➔ `Contacted` ➔ `Engaged` ➔ `Discovery Scheduled` ➔ `Discovery Completed` ➔ `Proposal Sent` ➔ `Negotiation` ➔ `Closed Won` ➔ `Closed Lost` ➔ `Nurture` ➔ `Disqualified`.
- **Bidirectional Controls**: Includes both **"Next →"** (advance) and **"← Back"** (rollback) controls to easily reverse accidental stage movements.

---

### 🧩 5. Zero-Migration Dynamic Custom Fields
- Define custom attributes (Text, Number, Currency, Date, Boolean, Select, Multi-select, URL, Email, Phone) per workspace.
- Stored dynamically in PostgreSQL without running schema migrations.
- In-place custom field editor directly inside the company profile view.

---

### 🛡️ 6. Granular Capability-Based RBAC
- Multi-tenant workspace isolation (`workspaces` table foreign keys).
- Role presets: `Admin` (full master authority), `Sales` (pipeline & outreach), and `Researcher` (read/create/edit; strictly denied delete rights).
- Strict server-side permission assertions (`requirePermission()`) protecting all Server Actions.

---

### 📥 7. Smart Duplicate Prevention & Normalization
- Normalizes domains (`https://www.example.com/path?q=1` ➔ `example.com`), phone numbers (`+1 (512) 555-0142` ➔ `15125550142`), and company name + city matches.
- Proactively warns researchers before inserting duplicates.

---

### 📜 8. Immutable Append-Only Security Audit Trail
- PostgreSQL-backed audit trail logging all logins, record creations, updates, deletions, stage movements, and permission adjustments with timestamp and user attribution.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) | React 19 Server Components, Server Actions, Turbopack |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type safety with 0 compile-time errors |
| **Database** | [Neon Serverless PostgreSQL](https://neon.tech/) | Cloud-native serverless PostgreSQL database |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | Type-safe SQL schema, relations, and migrations |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern HSL design tokens, moving gradient borders, and glassmorphism |
| **Transactional Email** | [Resend](https://resend.com/) | 6-Digit OTP delivery and workspace team invitations |
| **Authentication** | [Google OAuth 2.0](https://cloud.google.com/) + Jose HS256 | Passwordless 1-Click SSO and encrypted JWT session cookies |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent, clean iconography |

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/imAky/revlocrm.git
cd revlocrm
npm install
```

---

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Fill in your service credentials:

```env
# 1. DATABASE (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# 2. SESSION SECURITY (Minimum 32 characters)
SESSION_SECRET="revlo-crm-production-encryption-secret-key-32chars-minimum"

# 3. TRANSACTIONAL EMAIL (Resend OTP & Invitations)
RESEND_API_KEY="re_123456789_abcdefghijklmnopqrstuvwxyz"
RESEND_FROM_EMAIL="Revlo CRM <onboarding@resend.dev>"

# 4. APPLICATION HOST URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"

# 5. GOOGLE 1-CLICK SSO (OAuth 2.0)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
GOOGLE_CLIENT_ID="1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
```

---

### 🔑 Setting up External Services

#### A. Neon PostgreSQL Database
1. Create a free PostgreSQL database at [Neon.tech](https://neon.tech).
2. Copy the Connection String and paste it into `DATABASE_URL`.

#### B. Resend Transactional Email
1. Sign up at [Resend.com](https://resend.com) and generate an API key.
2. Paste the key into `RESEND_API_KEY`.
3. For local testing, use `RESEND_FROM_EMAIL="Revlo CRM <onboarding@resend.dev>"`. For production, verify your custom sending domain.

#### C. Google 1-Click SSO (OAuth 2.0)
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (for local development)
   - `https://your-production-domain.com` (for production)
4. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-production-domain.com/api/auth/callback/google`
5. Copy the Client ID into `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID`.

---

### 3. Clean Database Reset & Re-Seed
Run the seed script to automatically reset all tables and insert **16 realistic B2B prospects across 8+ industries**, 13 pipeline stages, custom fields, verified contacts, activity timelines, and market research keywords:

```bash
npx tsx scripts/seed.ts
```

#### Pre-Configured Demo Accounts:
- 👑 **Admin Account**: `admin@revlo.demo` (Full administrative authority)
- 🔍 **Researcher Account**: `researcher@revlo.demo` (Prospecting & audit rights)

---

### 4. Run Automated Test Suites
Verify all authentication, security, and functional CRM flows:

```bash
# Test Jose HS256 JWT, Resend OTP dispatch, and Google Token verification
npx tsx scripts/test-auth-suite.ts

# Test RBAC security, duplicate engine, 4-pillar scoring, and multi-entity persistence (19/19 Tests)
npx tsx scripts/test-functional-audit.ts
```

---

### 5. Launch Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to experience Revlo CRM!

---

## 📁 Project Architecture

```
revlocrm/
├── app/
│   ├── (auth)/             # Passwordless Login, Signup, & Invite Acceptance
│   ├── (workspace)/        # Authenticated Workspace Modules (Dashboard, Prospects, Pipeline, Team, Roles, Custom Fields, Audit)
│   ├── api/auth/           # Google SSO, Resend OTP, & Session Endpoints
│   ├── globals.css         # Tailwind v4 Tokens, Moving Gradient Borders, Animations
│   ├── layout.tsx          # Root Layout & Theme Provider
│   └── page.tsx            # Luxury Marketing Homepage with Animated Showcase
├── components/
│   ├── dashboard/          # Real-time Metrics, Queue, & Funnel Cards
│   ├── marketing/          # 3D Animated Showcase & Moving Gradient Frame
│   ├── pipeline/           # 13-Stage Bidirectional Kanban Board
│   ├── prospects/          # Table/Card Directory, Filters, & 30+ Field Dossier
│   ├── scoring/            # 4-Pillar Score Breakdown Popover & Methodology Modal
│   ├── team/               # Member Suspension & Step-Up Admin OTP Verification
│   └── ui/                 # Accessible Button, Input, Dialog, & Badge Primitives
├── lib/
│   ├── actions/            # Type-Safe Next.js Server Actions with Guardrails
│   ├── auth/               # Jose HS256 Token Encryption & Cookie Handlers
│   ├── db/                 # Neon PostgreSQL Client, Drizzle Schema & Seed Script
│   ├── email/              # Resend HTML Transactional Email Templates
│   ├── permissions/        # RBAC Capability Matrix & Server Assertions
│   └── scoring/            # 0–100 Heuristic Qualification Engine
├── public/uploads/         # Full-Resolution Workspace Screenshots
└── scripts/                # Database Seeder & Complete Automated Test Suites
```

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<div align="center">
  <b>Built with ❤️ for modern outbound sales teams and growth builders.</b>
</div>

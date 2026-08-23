<div align="center">

# ⚡ ProspectForge CRM

### Turn Outbound Prospect Research into a High-Converting Sales Pipeline

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<p align="center">
  A modern, lightweight, open-source collaborative CRM engineered for outbound research teams, SDRs, and agency founders. Qualify prospects with automated heuristic scoring, conduct digital footprint audits, manage 13-stage bidirectional pipelines, and collaborate securely with granular RBAC.
</p>

[**Explore Live Demo**](http://localhost:3000) • [**Quick Start Guide**](#-quick-start-guide) • [**Architecture**](#-system-architecture) • [**Security & RBAC**](#-granular-rbac--security)

</div>

---

## 🌟 Key Features

### 📊 1. Real-Time Analytics Dashboard
- Live aggregated metrics calculated directly in PostgreSQL: Total Prospects, Pipeline Value, A-Grade Lead Counts, and Overdue Tasks.
- Visual stage volume distribution bars with real-time deal sizing.
- Priority work queues highlighting urgent follow-ups and chronological team activity feeds.

### ⚡ 2. Automated Heuristic Lead Scoring (0–100)
- Multi-dimensional scoring engine evaluating:
  - **Digital Footprint (30%)**: Website existence, mobile UX, CTA quality, quote booking flow, trust badges.
  - **Commercial Qualification (35%)**: ICP fit, ability to pay, sales urgency, recurring potential, buying signals.
  - **Local Reputation (20%)**: Google star ratings (1.0–5.0) and review counts.
  - **Decision Maker Readiness (15%)**: Key stakeholder identified with direct phone/email.
- Automatically assigns standardized tier grades: `A+`, `A`, `B`, `C`, and `D`.

### 🗂️ 3. High-Density Spreadsheet Table & Card Views
- Fast data table with live debounced search across names, domains, emails, and locations.
- Multi-facet filtering by Niche/Industry, Pipeline Stage, and Lead Grade.
- Multi-column sorting (Score, Deal Value, Date, Company Name).
- Bulk actions: batch stage transitions and bulk user assignments.
- **Mobile Card View Toggle**: Switch seamlessly between table and responsive card grids on smaller devices.

### 🏢 4. Comprehensive 30+ Field Prospect Profile
- **Business Identity**: Company name, legal name, business category, niche, full street address, postal code, phone, public email, and operational status.
- **Digital Audit**: Website quality, mobile UX audit, speed score (0–100 gauge), quote flow analysis, and social links (Facebook, Instagram, LinkedIn).
- **Stakeholder Directory**: Multiple contacts per company with decision-maker flags, direct emails, phones, and LinkedIn URLs.
- **Communication & Tasks**: Log calls, notes, proposals, and meetings paired with checkable task queues.

### 📈 5. 13-Stage Bidirectional Pipeline Kanban
- Fluid horizontal Kanban board representing the complete sales lifecycle:
  `Researching` ➔ `Identified` ➔ `Outreach Ready` ➔ `Contacted` ➔ `Follow-up Required` ➔ `Responded` ➔ `Discovery Booked` ➔ `Discovery Completed` ➔ `Proposal Sent` ➔ `In Negotiation` ➔ `Closed Won` ➔ `Closed Lost` ➔ `Nurture / Hold`.
- **Bidirectional Stage Navigation**: Includes both **"Next →"** (advance) and **"← Back"** (rollback) controls to easily reverse accidental stage movements.
- Direct stage dropdown jump on every card.

### 🧩 6. Zero-Migration Dynamic Custom Fields
- Define unlimited custom attributes (Text, Number, Currency, Date, Boolean, Select, Multi-select, URL, Email, Phone) per workspace.
- Values stored dynamically without running SQL migrations.
- In-place custom field editor directly inside the company profile view.

### 🛡️ 7. Granular Capability-Based RBAC & Invitations
- Multi-tenant workspace isolation.
- Role presets: `Admin`, `Researcher`, and `Sales`.
- Strict server-side permission assertions (`requirePermission()`) preventing unauthorized record deletions.
- Customizable per-user capability overrides matrix.
- Single-use, expiring invitation tokens with copy-to-clipboard generators.

### 📥 8. CSV Import/Export & Smart Duplicate Detection
- Ingest large CSV files with automatic domain normalization, phone sanitization, and fuzzy company name matching.
- Duplicate detection warning modals before inserting.
- Safe CSV export with formula injection mitigation (`=`, `+`, `-`, `@` sanitization).

### 📜 9. Immutable Append-Only Security Audit Trail
- PostgreSQL-backed audit trail logging all logins, record creations, updates, deletions, stage movements, and permission adjustments with timestamp and user attribution.

### 🌗 10. Site-Wide Light & Dark Theme Switcher
- Persistent theme context using `localStorage` and dynamic class switching.
- Animated Sun/Moon toggle buttons available in the landing page, topbar, and sidebar.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | React 19 Server Components, Server Actions, Turbopack |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type safety with zero compile-time errors |
| **Database** | [Neon Serverless PostgreSQL](https://neon.tech/) | Cloud-native serverless PostgreSQL database |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | Type-safe SQL schema, relations, and migrations |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern HSL design tokens and glassmorphism utilities |
| **UI Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent icons |
| **Auth & Security** | `jose` + `bcryptjs` | Cookie-based encrypted JWT sessions & password hashing |
| **Validation** | [Zod](https://zod.dev/) | Runtime schema validation for forms and server actions |
| **Data Parsing** | [PapaParse](https://www.papaparse.com/) | CSV parsing and export generation |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18.18+ or 20+
- A PostgreSQL database URL (e.g. from [Neon](https://neon.tech), Supabase, or local Postgres)

### 1. Clone the Repository
```bash
git clone https://github.com/imAky/prospect-forge.git
cd prospect-forge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# PostgreSQL Database Connection String
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"

# Secret key for encrypting JWT session cookies (at least 32 characters)
SESSION_SECRET="prospectforge-super-secure-secret-key-32-chars-min"
```

### 4. Push Database Schema
Push the 16 relational Drizzle tables to your PostgreSQL database:
```bash
npx drizzle-kit push
```

### 5. Seed Demo Data & Personas
Populate the database with default pipeline stages, system capabilities, demo users, custom fields, and realistic sample prospects:
```bash
npx tsx scripts/seed.ts
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Seeded Demo Personas

When testing locally with the seeded database, you can use the instant **1-Click Login** buttons on `/login` or enter credentials:

| Persona | Email | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **👑 Admin (Sarah Connor)** | `admin@prospectforge.demo` | `admin123` | Full workspace control, delete permissions, role management |
| **🔍 Researcher (Alex Miller)** | `researcher@prospectforge.demo` | `researcher123` | Create, research & edit prospects (Cannot delete records) |

---

## 🏛️ System Architecture

ProspectForge enforces strict multi-tenant workspace isolation across all 16 relational entities:

```
workspaces (Tenant Boundary)
 ├── memberships ── users (Sessions & Auth)
 ├── roles ── role_permissions ── permissions (RBAC)
 ├── user_permissions (Granular Capability Overrides)
 ├── invitations (Expiring single-use tokens)
 ├── pipeline_stages (13 default sales stages)
 ├── prospects (Core company intelligence & lead score)
 │    ├── contacts (Decision makers & stakeholders)
 │    ├── activities (Timeline & outreach history)
 │    ├── tasks (Follow-up queues & deadlines)
 │    └── custom_field_values (Dynamic custom data)
 ├── custom_fields ── custom_field_options
 └── audit_logs (Append-only security log)
```

---

## 🔒 Granular RBAC & Security

All mutations are protected server-side in `lib/permissions/server-guards.ts`:

- `requireAuth()`: Verifies cookie JWT session and loads active workspace membership.
- `requirePermission(capability)`: Evaluates user's role permissions plus explicit capability overrides.
- `canAccessProspect(prospectId, capability)`: Verifies workspace ownership and prevents researchers from deleting records without explicit `prospects.delete` permissions.
- `recordAuditLog()`: Automatically logs sensitive actions into the append-only `audit_logs` table.

---

## 📂 Project Structure

```
prospect-forge/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login & 1-click persona switcher
│   │   ├── signup/page.tsx         # Workspace signup
│   │   └── invite/[token]/page.tsx # Secure invitation acceptance
│   ├── (workspace)/
│   │   ├── layout.tsx              # Authenticated workspace shell
│   │   ├── dashboard/page.tsx      # Real-time metrics & work queues
│   │   ├── prospects/page.tsx      # Spreadsheet data table & cards
│   │   ├── prospects/[id]/page.tsx # 6-tab prospect detail view
│   │   ├── pipeline/page.tsx       # 13-stage bidirectional Kanban
│   │   ├── contacts/page.tsx       # Stakeholder directory
│   │   ├── tasks/page.tsx          # Task management & follow-ups
│   │   ├── activities/page.tsx     # Activity timeline feed
│   │   ├── custom-fields/page.tsx  # Dynamic custom field builder
│   │   ├── import-export/page.tsx  # CSV importer & duplicate engine
│   │   ├── team/page.tsx           # Team members & RBAC matrix
│   │   ├── audit-logs/page.tsx     # Append-only security audit trail
│   │   └── settings/page.tsx       # Workspace configuration
│   ├── globals.css                 # HSL color system & light/dark tokens
│   ├── layout.tsx                  # Root layout with ThemeProvider
│   └── page.tsx                    # Bento Grid marketing homepage
├── components/
│   ├── layout/                     # Sidebar, Topbar, WorkspaceShell
│   ├── pipeline/                   # Kanban client & transition controls
│   ├── prospects/                  # Table, Card view, Detail client, 30+ Field Wizard
│   ├── ui/                         # Buttons, Badges, Modals, Tables, Tabs, Inputs
│   ├── theme-provider.tsx          # React Theme context (Dark / Light)
│   └── theme-toggle.tsx            # Animated Sun/Moon toggle button
├── lib/
│   ├── actions/                    # Server Actions (Auth, Prospects, Team, etc.)
│   ├── auth/                       # JWT sessions & bcrypt password hashing
│   ├── db/                         # Drizzle schema (16 tables), connection, seed
│   ├── permissions/                # Capabilities map & server guards
│   ├── scoring/                    # 0-100 Heuristic lead scoring engine
│   └── utils/                      # Duplicate detection & CSV helpers
├── scripts/
│   └── seed.ts                     # Database seed execution script
├── drizzle.config.ts               # Drizzle Kit CLI configuration
└── README.md                       # Documentation
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for sales teams and prospect researchers worldwide.</sub>
</div>

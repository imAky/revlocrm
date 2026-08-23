<div align="center">

# ⚡ Revlo CRM (`revlocrm`)

### Turn Outbound Prospect Research into a High-Converting Sales Pipeline

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
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

### ⚡ 2. Automated Heuristic Lead Scoring (0–100) & Grading
- Multi-dimensional deterministic scoring engine evaluating:
  - **Digital Footprint (30%)**: Website existence, mobile UX audit, CTA quality, quote booking flow, trust badges.
  - **Commercial Qualification (35%)**: ICP fit, ability to pay, sales urgency, recurring potential, buying signals.
  - **Local Reputation (20%)**: Google star ratings (1.0–5.0) and review counts.
  - **Decision Maker Readiness (15%)**: Key stakeholder identified with direct phone/email.
- Automatically assigns standardized tier grades: `A+`, `A`, `B`, `C`, and `D`.

### ⚡ 3. Dual-Mode Creation: Quick Add vs. Full Qualification
- **Quick Add (5-Second Workflow)**: Rapidly input Company Name, Industry Niche, Location, Website/Google Maps URL, Phone/Email, Stage, Deal Value, and save in seconds with baseline score generation.
- **Full Qualification Wizard (5 Steps)**: Deep 30+ field audit covering Business Identity, Digital Presence, ICP Commercial Fit, Primary Decision Maker, and Intelligence Notes.

### 🗂️ 4. Advanced Multi-Field Search & Facet Query Console
- Target search selector: Query across **All Fields**, **Company Name**, **Industry / Niche**, **Location (City / State / Country)**, **Contact Phone / Email**, or **Opportunity / Signals**.
- Collapsible multi-facet filter bar: Niche, Pipeline Stage, Grade (`A+`, `A`, `B`, `C`, `D`), ICP Fit (`HIGH`, `MEDIUM`, `LOW`), Minimum Score (≥60, ≥75, ≥85, ≥90), and Deal Size ($10k+, $20k+, $30k+).
- Active filter badges with individual dismissal and one-click global clear.
- Responsive **Table** and **Card Grid** view modes.

### 📈 5. 13-Stage Bidirectional Pipeline Kanban
- Fluid horizontal Kanban board representing the complete sales lifecycle:
  `Researching` ➔ `Qualified` ➔ `Ready to Contact` ➔ `Contacted` ➔ `Engaged` ➔ `Discovery Scheduled` ➔ `Discovery Completed` ➔ `Proposal Sent` ➔ `Negotiation` ➔ `Closed Won` ➔ `Closed Lost` ➔ `Nurture` ➔ `Disqualified`.
- **Bidirectional Stage Navigation**: Includes both **"Next →"** (advance) and **"← Back"** (rollback) controls to easily reverse accidental stage movements.
- Direct stage dropdown selector on every card.

### 🏢 6. Comprehensive 30+ Field Company Intelligence Profile
- **6-Tab Dedicated Workspace**: Overview & KPIs, Business Details, Digital Presence, Contacts & Stakeholders, Activity Timeline, and Follow-up Tasks.
- **Multiple Stakeholders per Company**: Add multiple decision makers with email, direct phone, title, LinkedIn URL, and Decision Maker flag.
- **Timeline Feed**: Log Calls, Emails, Meetings, Proposals, and internal research notes.
- **Task Management**: Prioritized follow-up queue with due dates.

### 🧩 7. Zero-Migration Dynamic Custom Fields
- Define custom attributes (Text, Number, Currency, Date, Boolean, Select, Multi-select, URL, Email, Phone) per workspace.
- Values stored dynamically without running SQL migrations.
- In-place custom field editor directly inside the company profile view.

### 🛡️ 8. Granular Capability-Based RBAC & Security
- Multi-tenant workspace isolation.
- Role presets: `Admin`, `Researcher`, and `Sales`.
- Strict server-side permission assertions (`requirePermission()`) preventing unauthorized record deletions.
- Customizable per-user capability overrides matrix.
- Single-use, expiring invitation tokens with copy-to-clipboard generators.

### 📥 9. CSV Import/Export & Smart Duplicate Detection
- Ingest large CSV files with automatic domain normalization, phone sanitization, and fuzzy company name matching.
- Duplicate detection warning modals before inserting.
- Safe CSV export with formula injection mitigation (`=`, `+`, `-`, `@` sanitization).

### 📜 10. Immutable Append-Only Security Audit Trail
- PostgreSQL-backed audit trail logging all logins, record creations, updates, deletions, stage movements, and permission adjustments with timestamp and user attribution.

### 🌗 11. Solid High-Contrast Light & Sleek Dark Theming
- Persistent theme context using `localStorage` and dynamic class switching.
- Solid opaque, crisp dialog surfaces in Light Mode with high elevation shadows and clear focus rings.
- Sleek dark slate surfaces in Dark Mode with glowing indigo accents.

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
git clone https://github.com/imAky/revlocrm.git
cd revlocrm
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
SESSION_SECRET="revlocrm-super-secure-production-ready-secret-key-32chars"
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
| **👑 Admin (Sarah Connor)** | `admin@revlo.demo` | `admin123` | Full workspace control, delete permissions, role management |
| **🔍 Researcher (Alex Miller)** | `researcher@revlo.demo` | `researcher123` | Create, research & edit prospects (Cannot delete records) |

---

## 🏛️ System Architecture

Revlo CRM enforces strict multi-tenant workspace isolation across all 16 relational entities:

```
workspaces (Tenant Boundary: Revlo Growth Lab)
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
revlocrm/
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
│   ├── prospects/                  # Table, Card view, Detail client, Quick Add & Full Wizard
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
│   ├── seed.ts                     # Database seed execution script
│   └── test-functional-audit.ts    # Automated test suite
├── drizzle.config.ts               # Drizzle Kit CLI configuration
└── README.md                       # Documentation
```

---

## 🧪 Automated Testing

Execute the full automated test suite verifying lead scoring formulas, multi-tenant database persistence, duplicate matching, and role capabilities:

```bash
npx tsx scripts/test-functional-audit.ts
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

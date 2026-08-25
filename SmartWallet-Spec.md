# SmartWallet — Personal Finance Tracker

## Project Brief for AI Coding Agent

---

## 1. Overview

**SmartWallet** is a personal finance web application built with **Next.js** and a **local database**. The user manually logs all income (revenue) and expenses. Expense entries are organized by **types/categories**, which the user can fully manage (create, edit, delete) through an **admin panel**. The app should present the data through a clean, informative **dashboard** that includes visual summaries plus contextual **tips and insights** about spending and income patterns.

This is a single-user, self-hosted tool — no multi-tenant auth system is required unless specified otherwise below.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, latest stable) |
| Language | TypeScript |
| Database | Local DB — SQLite (recommended: via **Prisma** ORM or **Drizzle ORM**) |
| Styling | Tailwind CSS |
| Charts | Recharts or Chart.js |
| State/Data fetching | Server Components + Server Actions (or React Query if client-heavy) |
| Validation | Zod |

> Note to agent: Prefer Server Actions for mutations (add/edit/delete) instead of building a separate REST API layer, unless the user requests an external API.

---

## 3. Core Data Model

### 3.1 `Transaction`
| Field | Type | Notes |
|---|---|---|
| id | string (uuid/cuid) | primary key |
| type | enum: `income` \| `expense` | |
| amount | decimal | always positive; sign is derived from `type` |
| date | datetime | date the transaction occurred |
| description | string (optional) | free text note |
| categoryId | string (nullable) | FK to `Category`, required when `type = expense`, null/optional for income |
| createdAt / updatedAt | datetime | audit fields |

### 3.2 `Category` (expense type)
| Field | Type | Notes |
|---|---|---|
| id | string | primary key |
| name | string | unique, e.g. "Groceries", "Transport" |
| color | string (hex) | used for chart legends/badges |
| icon | string (optional) | icon name/emoji for UI |
| createdAt / updatedAt | datetime | |

> Categories apply to expenses. Deleting a category in use should either (a) block deletion until reassigned, or (b) reassign affected transactions to an "Uncategorized" fallback category — pick one strategy and apply it consistently; block-with-warning is the safer default.

---

## 4. Feature Requirements

### 4.1 Transaction Entry
- A form to add a new transaction: type (income/expense), amount, date, description, and category (category selector only shown/required for expenses).
- Edit and delete existing transactions from a transaction list/table.
- Transaction list should support filtering by: date range, type, category, and a text search on description.
- Sorting by date and amount.
- Pagination or infinite scroll for large transaction histories.

### 4.2 Admin Panel — Category Management
- Dedicated `/admin` (or `/admin/categories`) route.
- List all expense categories with usage counts (how many transactions use each).
- Create new category (name, color, icon).
- Edit existing category.
- Delete category (respecting the deletion strategy defined in 3.2).
- Simple validation: no duplicate category names.

### 4.3 Dashboard
- **Summary cards**: total income, total expenses, net balance — for a selectable time period (this month, last 30 days, custom range, all time).
- **Income vs. Expense chart**: line or bar chart over time (daily/weekly/monthly granularity, toggleable).
- **Expense breakdown by category**: pie/donut chart with percentages.
- **Top spending categories**: ranked list, e.g. top 5 by amount for the selected period.
- **Trend indicators**: percentage change vs. previous period (e.g. "Expenses up 12% vs last month").

### 4.4 Tips & Insights
Generate simple, rule-based insights from the user's own data (no external AI call required, though the agent may design this to be pluggable for an LLM later). Examples of insight rules to implement:
- Flag if total expenses exceed total income for the selected period ("You spent more than you earned this month").
- Flag the fastest-growing expense category vs. the previous period.
- Highlight if any single category exceeds a configurable % of total expenses (e.g. "Dining out is 35% of your spending this month").
- Show a savings rate: `(income - expenses) / income` as a percentage, with a friendly label (e.g. "Great", "Okay", "Needs attention").
- Show a simple "days until your average monthly expenses would exceed your recorded income" style burn-rate note, if enough data exists.
- Surface a "no expenses logged in over N days" reminder to encourage consistent tracking, if relevant.

Display these as a compact list of cards or a "Tips" panel on the dashboard, each with a short label + one-line explanation.

### 4.5 Settings (optional, nice-to-have)
- Currency selection/display format.
- Default dashboard time range.
- Export data (CSV/JSON) of transactions.

---

## 5. Non-Functional Requirements
- Responsive layout (mobile + desktop).
- Local DB file should persist between runs (e.g. SQLite file committed to `.gitignore` but stored in a predictable local path).
- Basic form validation and error states (e.g. negative/zero amounts blocked, required fields enforced).
- Loading and empty states for all data views (e.g. "No transactions yet — add your first one").
- Reasonably fast dashboard load even with a few thousand transactions (use DB-level aggregation queries rather than pulling all rows into memory where practical).

---

## 6. Suggested Project Structure
```
/app
  /admin
    /categories
  /dashboard
  /transactions
  /api (only if REST endpoints are needed instead of Server Actions)
/components
  /charts
  /forms
  /ui
/lib
  /db (schema, client, migrations)
  /insights (tip-generation rules)
  /validation (zod schemas)
/prisma or /drizzle
  schema.*
```

---

## 7. Out of Scope (unless the user asks otherwise)
- Bank account linking or automatic transaction import.
- Multi-user accounts, authentication, or roles.
- Recurring/scheduled transactions (can be a future enhancement).
- Budgeting/goal-setting features (can be a future enhancement, listed here so the agent doesn't build it unprompted).

---

## 8. Deliverable Expectations for the Agent
1. Scaffold the Next.js + TypeScript + Tailwind project.
2. Set up the local DB and ORM with the schema in Section 3.
3. Implement transaction CRUD (Section 4.1).
4. Implement the admin category CRUD panel (Section 4.2).
5. Build the dashboard with charts and summary cards (Section 4.3).
6. Implement the rule-based tips/insights panel (Section 4.4).
7. Ensure responsive styling and basic empty/loading/error states throughout.

# Freelance Tracker

A personal income, expense, and invoicing tracker for freelance work in Japan — built with React and SCSS.

## Running it

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

## How your data works

Everything you enter is saved **only in this browser**, using `localStorage` — nothing is sent to a server. That means:

- Your data will still be there next time you open the app on this computer, in this browser.
- It will **not** show up if you open the app in a different browser or on a different device.
- Clearing your browser's site data/history for this app will erase it.

Because of that, go to **Settings → Backup & restore** and click **Export backup (JSON)** every so often, and especially before switching browsers/computers. Use **Import backup** there to load a previously exported file back in.

## What's in the app

- **Dashboard** — income, expenses, net profit, and an estimated tax set-aside for the selected month, plus an expense breakdown chart and a 6-month trend chart.
- **Income** — log pay, reimbursements, or invoice payments as they land in your account.
- **Expenses** — a ledger of everything you spend, plus a **Recurring & Quick-Add** panel for things like rent, National Health Insurance, or a per-shift car fee, so you're not retyping the same entry every time.
- **Jobs & Clients** — every place you earn income from; also used as the client list when building invoices.
- **Time & Invoices** — log billable hours per client, then use **+ Create Invoice** (top nav) to bundle unbilled time and/or manual line items into a downloadable PDF.
- **Settings** — your business info (shown on invoices), your tax set-aside percentage, custom expense categories, and the backup/restore tools above.

The tax set-aside figure is a simple estimate (net income × your chosen %) to help you budget for tax time — it isn't a filing calculation. Check with a tax office (税務署) or accountant (税理士) for anything official.

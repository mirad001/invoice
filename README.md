# Bond Invoice Dashboard

A browser-only invoice management system for Australian bond cleaning companies.  
All data is stored in browser `localStorage` — no server, no database, no login required.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Logging In

Default PINs (edit `src/config/users.js` to change):

| Name   | PIN  | Role  |
|--------|------|-------|
| Admin  | 0000 | admin |
| Alex   | 1111 | staff |
| Jordan | 2222 | staff |
| Casey  | 3333 | staff |
| Riley  | 4444 | staff |

## Editing Company Details

**In the code** — edit `src/config/companies.js` then run `npm run dev` again.  
**In the browser** — log in as Admin, select a company, click Settings. Changes are saved to localStorage and override the config file.

## Invoice Features

- **Auto-numbering**: Each company has its own sequential counter, e.g. `BCA-20260629-0014`
- **Default line items**: Cleaning Service, Carpet Cleaning, Pest/Flea Treatment, Extra Work
- **Inline editing**: Click any field on the invoice to edit it
- **Paid/Pending toggle**: Toggle status in the action bar; the rubber stamp animates
- **Save & New**: Saves the current invoice and opens a fresh one for the same company
- **Signatures**: Any logged-in user can Accept & Sign (up to 5 per invoice)
- **Print**: Click the printer icon — browser print dialog, hides UI chrome
- **Export PDF**: Click the download icon — uses html2canvas to capture the invoice

## Data Storage

All data lives in `localStorage` under these keys:
- `bond_invoices` — all invoices
- `bond_counters` — per-company invoice counters
- `bond_companies` — company settings (editable in UI)
- `bond_user` — current session user

To reset everything: open browser DevTools → Application → Local Storage → clear all `bond_*` keys.

## Build for Production

```bash
npm run build
```

Output is in `dist/`. Serve with any static file server (`npx serve dist`).

## Tech Stack

- **React 18** + **Vite** — fast dev, tiny bundle
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — stamp animation, page transitions
- **html2canvas + jsPDF** — PDF export
- **lucide-react** — icons
- **localStorage** — all persistence

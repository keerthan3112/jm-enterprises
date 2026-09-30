# JM Enterprises

JM Enterprises is a local-first stationery, Xerox, printing, money-transfer, ordering, billing, and customer-help application.

## Local customer help bot

The customer help bot no longer uses Google AI Studio, Gemini, or any AI API. It runs entirely from the project code and local database, so no API key or external AI service is required.

The bot can answer common questions about:
- Xerox and photocopy rates
- Printing, photos, lamination, and binding
- Money-transfer services
- Notebooks, registers, pens, and stationery
- Store hours, contact details, and location
- Existing order/receipt tracking using the local database

## Run locally

Prerequisite: Node.js 22+

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

If port 3000 is already occupied, run `set PORT=3001 && npm run dev` on Windows and open **http://localhost:3001**.

For Windows, you can also double-click `run-local.bat`.

## Build

```bash
npm run build
npm start
```

No `GEMINI_API_KEY`, Google AI Studio secret, or cloud AI account is needed.

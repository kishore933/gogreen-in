# 🌱 Go Green — From Waste to Resource

A full-stack web app that connects organic waste from **stores and farms**
(spoiled produce, peels, husk, stalks) with people and processes that turn
it into something useful — compost, animal feed, biogas, fiber — instead of
letting it rot in a landfill.

**Stack:** HTML, CSS, vanilla JavaScript (frontend) + Node.js/Express (backend), file-based JSON storage.

```
go-green/
├── backend/
│   ├── data/
│   │   ├── listings.json    # posted waste listings (seeded with examples)
│   │   ├── products.json    # "what it becomes" showcase content
│   │   └── tips.json        # short guides in the Learn section
│   ├── package.json
│   └── server.js            # Express server + API routes
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .gitignore
└── README.md
```

## What it does

- **Stores and farms** post a listing: what type of organic waste they have
  (fruit peels, vegetable scraps, husk, stalks, spoiled produce), roughly
  how much, and where to collect it.
- **Composters, biogas operators, farmers, and makers** browse open
  listings, filter by waste type, and mark one "collected" once they've
  picked it up.
- A **live impact ledger** shows running totals: open listings, kilograms
  diverted from landfill, matches made, and a rough estimate of CO₂e
  avoided.
- A **"what it becomes" showcase** explains what each type of waste turns
  into (compost, feed, biogas, coir fiber, banana-stem fiber, peel-based
  cleaning extracts).
- A **Learn section** has short guides for people new to this — home
  composting, what husk becomes, how a shop preps waste for pickup.

## 1. Prerequisites

- [Node.js](https://nodejs.org/) 18 or later (includes npm)
- [Git](https://git-scm.com/)
- A [GitHub](https://github.com/) account

Check what you have installed:

```bash
node -v
npm -v
git --version
```

## 2. Run it locally

```bash
# from the project root
cd go-green/backend
npm install
npm start
```

You should see:

```
Go Green server running at http://localhost:3000
```

Open **http://localhost:3000**. The Express server serves the frontend
from `public/` *and* the API, so only one process is needed.

For auto-restart while editing the backend, use `npm run dev`.

### API routes

| Method | Route                        | Description                                  |
|--------|-------------------------------|-----------------------------------------------|
| GET    | `/api/listings`               | Returns all waste listings                    |
| POST   | `/api/listings`                | Creates a new listing                          |
| POST   | `/api/listings/:id/claim`     | Marks a listing as collected                   |
| GET    | `/api/products`               | Returns the "what it becomes" showcase content |
| GET    | `/api/tips`                    | Returns the Learn section guides               |
| GET    | `/api/stats`                   | Returns live impact numbers (computed from listings) |

## 3. Push it to GitHub

```bash
cd go-green

git init
git add .
git commit -m "Initial commit: Go Green waste-to-resource platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
git push -u origin main
```

If using the [GitHub CLI](https://cli.github.com/) instead:

```bash
gh repo create go-green --public --source=. --remote=origin --push
```

### Updating it later

```bash
git add .
git commit -m "Describe what changed"
git push
```

## 4. Notes on deploying

- Listings are written to `backend/data/listings.json` on disk. On hosting
  platforms with ephemeral filesystems (most free tiers), this resets on
  redeploy — swap it for a real database (SQLite, Postgres, etc.) before
  relying on it in production.
- The CO₂e-avoided figure on the ledger uses a simple, illustrative
  conversion factor (0.5 kg CO₂e per kg of waste diverted) — clearly a
  rough estimate, not a certified life-cycle figure. Adjust
  `CO2E_PER_KG_DIVERTED` in `server.js` if you have better local data.

## 5. Customizing

- Add or edit "what it becomes" entries in `backend/data/products.json`.
- Add or edit Learn guides in `backend/data/tips.json`.
- Adjust the valid waste types in both `public/index.html` (the `<select>`)
  and `backend/server.js` (`VALID_TYPES`) if you add new categories.
- Colors, type, and layout tokens live at the top of `public/style.css`.

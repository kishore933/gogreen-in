/**
 * Go Green — backend server (Waste-to-Resource edition)
 *
 * Serves the static frontend from /public and exposes a small JSON API:
 *   GET  /api/listings            -> all waste listings
 *   POST /api/listings            -> create a new listing (store/farm)
 *   POST /api/listings/:id/claim  -> mark a listing as collected (maker)
 *   GET  /api/products            -> extracted-products showcase (static)
 *   GET  /api/tips                -> "learn" guides (static)
 *   GET  /api/stats               -> live impact numbers, computed from listings
 *
 * Storage is plain JSON files under backend/data — no database setup
 * required, so the whole project runs with nothing but Node.js installed.
 * Swap this for a real database before using it in production.
 */

const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const LISTINGS_FILE = path.join(DATA_DIR, "listings.json");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const TIPS_FILE = path.join(DATA_DIR, "tips.json");

// Rough, illustrative conversion factor for the impact ledger.
// Diverting 1kg of organic waste from landfill avoids roughly this
// much CO2-equivalent methane emission. Not a precise LCA figure.
const CO2E_PER_KG_DIVERTED = 0.5;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// ---------- helpers ----------

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

const VALID_TYPES = ["Fruit peels", "Vegetable scraps", "Husk", "Stalks", "Spoiled produce", "Other"];

function isValidListing(body) {
  return (
    body &&
    typeof body.sourceName === "string" &&
    body.sourceName.trim().length > 0 &&
    VALID_TYPES.includes(body.type) &&
    Number.isFinite(Number(body.quantityKg)) &&
    Number(body.quantityKg) > 0 &&
    typeof body.location === "string" &&
    body.location.trim().length > 0 &&
    typeof body.contact === "string" &&
    body.contact.trim().length > 0
  );
}

// ---------- routes ----------

app.get("/api/listings", async (req, res) => {
  try {
    const listings = await readJson(LISTINGS_FILE, []);
    // newest first
    listings.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load listings." });
  }
});

app.post("/api/listings", async (req, res) => {
  try {
    if (!isValidListing(req.body)) {
      return res.status(400).json({ error: "Please fill in every required field with valid values." });
    }

    const listings = await readJson(LISTINGS_FILE, []);
    const listing = {
      id: crypto.randomUUID(),
      sourceName: req.body.sourceName.trim(),
      type: req.body.type,
      quantityKg: Number(req.body.quantityKg),
      location: req.body.location.trim(),
      contact: req.body.contact.trim(),
      notes: (req.body.notes || "").trim(),
      status: "open",
      postedAt: new Date().toISOString(),
      claimedAt: null,
    };
    listings.push(listing);
    await writeJson(LISTINGS_FILE, listings);

    res.status(201).json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save listing." });
  }
});

app.post("/api/listings/:id/claim", async (req, res) => {
  try {
    const listings = await readJson(LISTINGS_FILE, []);
    const listing = listings.find((l) => l.id === req.params.id);

    if (!listing) return res.status(404).json({ error: "Listing not found." });
    if (listing.status === "claimed") {
      return res.status(409).json({ error: "This listing has already been collected." });
    }

    listing.status = "claimed";
    listing.claimedAt = new Date().toISOString();
    await writeJson(LISTINGS_FILE, listings);

    res.json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update listing." });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await readJson(PRODUCTS_FILE, []);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load products." });
  }
});

app.get("/api/tips", async (req, res) => {
  try {
    const tips = await readJson(TIPS_FILE, []);
    res.json(tips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load tips." });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const listings = await readJson(LISTINGS_FILE, []);
    const claimed = listings.filter((l) => l.status === "claimed");
    const open = listings.filter((l) => l.status === "open");

    const totalKgDiverted = claimed.reduce((sum, l) => sum + l.quantityKg, 0);

    res.json({
      openListings: open.length,
      totalKgDiverted,
      matches: claimed.length,
      estimatedCo2eAvoided: Math.round(totalKgDiverted * CO2E_PER_KG_DIVERTED),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not compute stats." });
  }
});

// Fallback to index.html for any other GET route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Go Green server running at http://localhost:${PORT}`);
});

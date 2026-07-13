/* ============================================
   GO GREEN — frontend logic
   Talks to the Express backend for listings,
   products, tips, and the impact ledger.
   ============================================ */

const API_BASE = ""; // same-origin; change if backend is hosted separately

document.addEventListener("DOMContentLoaded", () => {
  loadLedger();
  loadListings();
  loadProducts();
  loadTips();
  initListingForm();
});

/* ---------------- Impact ledger ---------------- */

async function loadLedger() {
  const el = document.getElementById("ledgerGrid");
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) throw new Error("stats request failed");
    const stats = await res.json();

    const rows = [
      { label: "Open listings", value: stats.openListings },
      { label: "Kg diverted", value: `${stats.totalKgDiverted.toLocaleString()} kg` },
      { label: "Matches made", value: stats.matches },
      { label: "Est. CO₂e avoided", value: `${stats.estimatedCo2eAvoided.toLocaleString()} kg` },
    ];

    el.innerHTML = rows
      .map(
        (r) => `
      <div class="ledger-row">
        <span class="ledger-label">${r.label}</span>
        <span class="ledger-value">${r.value}</span>
      </div>`
      )
      .join("");
  } catch (err) {
    el.innerHTML = `<p class="loading-text">Manifest unavailable — check that the backend server is running.</p>`;
    console.error(err);
  }
}

/* ---------------- Listings (browse + claim) ---------------- */

let allListings = [];

async function loadListings() {
  const grid = document.getElementById("listingsGrid");
  try {
    const res = await fetch(`${API_BASE}/api/listings`);
    if (!res.ok) throw new Error("listings request failed");
    allListings = await res.json();
    buildTypeFilters(allListings);
    renderListings(allListings);
  } catch (err) {
    grid.innerHTML = `<p class="loading-text">Couldn't load listings — check that the backend server is running.</p>`;
    console.error(err);
  }
}

function buildTypeFilters(listings) {
  const row = document.getElementById("typeFilters");
  const types = ["all", ...new Set(listings.map((l) => l.type))];
  row.innerHTML = types
    .map(
      (t, i) =>
        `<button class="chip ${i === 0 ? "is-active" : ""}" data-type="${t}">${
          t === "all" ? "All" : t
        }</button>`
    )
    .join("");

  row.addEventListener("click", (e) => {
    if (!e.target.matches(".chip")) return;
    row.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    e.target.classList.add("is-active");
    const type = e.target.dataset.type;
    renderListings(type === "all" ? allListings : allListings.filter((l) => l.type === type));
  });
}

function renderListings(listings) {
  const grid = document.getElementById("listingsGrid");

  if (listings.length === 0) {
    grid.innerHTML = `<p class="loading-text">No listings yet — be the first to post one below.</p>`;
    return;
  }

  // open listings first, then claimed
  const sorted = [...listings].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1));

  grid.innerHTML = sorted
    .map(
      (l) => `
    <article class="tag-card ${l.status === "claimed" ? "is-claimed" : ""}">
      <span class="tag-type">${l.type}</span>
      <h3 class="tag-source">${l.sourceName}</h3>
      <p class="tag-meta">${l.quantityKg} kg</p>
      <p class="tag-location">${l.location}</p>
      ${l.notes ? `<p class="tag-notes">"${l.notes}"</p>` : ""}
      <div class="tag-footer">
        <span class="tag-contact">${l.contact}</span>
        ${
          l.status === "open"
            ? `<button class="btn btn-primary btn-small" data-claim-id="${l.id}">Mark collected</button>`
            : `<span class="tag-status">Collected</span>`
        }
      </div>
    </article>`
    )
    .join("");

  grid.querySelectorAll("[data-claim-id]").forEach((btn) => {
    btn.addEventListener("click", () => claimListing(btn.dataset.claimId));
  });
}

async function claimListing(id) {
  try {
    const res = await fetch(`${API_BASE}/api/listings/${id}/claim`, { method: "POST" });
    if (!res.ok) throw new Error("claim request failed");
    await loadListings();
    await loadLedger();
  } catch (err) {
    console.error(err);
    alert("Couldn't mark this listing collected. Please try again.");
  }
}

/* ---------------- List your waste (form) ---------------- */

function initListingForm() {
  const form = document.getElementById("listingForm");
  const status = document.getElementById("listingStatus");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Posting your listing…";
    status.classList.remove("is-error");

    const payload = {
      sourceName: document.getElementById("sourceName").value.trim(),
      type: document.getElementById("wasteType").value,
      quantityKg: Number(document.getElementById("quantityKg").value),
      location: document.getElementById("location").value.trim(),
      contact: document.getElementById("contact").value.trim(),
      notes: document.getElementById("notes").value.trim(),
    };

    try {
      const res = await fetch(`${API_BASE}/api/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "listing request failed");
      }
      form.reset();
      status.textContent = "Listing posted — it's now visible in Browse.";
      await loadListings();
      await loadLedger();
    } catch (err) {
      status.textContent = err.message || "Something went wrong posting your listing.";
      status.classList.add("is-error");
      console.error(err);
    }
  });
}

/* ---------------- Extracted products showcase ---------------- */

async function loadProducts() {
  const grid = document.getElementById("productsGrid");
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error("products request failed");
    const products = await res.json();
    grid.innerHTML = products
      .map(
        (p) => `
      <article class="product-card">
        <p class="product-flow">${p.madeFrom} → ${p.becomes}</p>
        <h3 class="product-title">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
      </article>`
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<p class="loading-text">Couldn't load this section — check that the backend server is running.</p>`;
    console.error(err);
  }
}

/* ---------------- Learn / tips ---------------- */

async function loadTips() {
  const grid = document.getElementById("learnGrid");
  try {
    const res = await fetch(`${API_BASE}/api/tips`);
    if (!res.ok) throw new Error("tips request failed");
    const tips = await res.json();
    grid.innerHTML = tips
      .map(
        (t) => `
      <article class="learn-card">
        <h3 class="learn-title">${t.title}</h3>
        <p class="learn-body">${t.body}</p>
      </article>`
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<p class="loading-text">Couldn't load guides — check that the backend server is running.</p>`;
    console.error(err);
  }
}

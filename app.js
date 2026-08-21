/* ============================================================================
   SCRAPPY PRICE — APP LOGIC
   ----------------------------------------------------------------------------
   This file reads prices.json and draws the price cards on the page.
   You do NOT need to understand the rest of this file — the only part you
   normally change is the CONFIG block directly below.
   ============================================================================ */


/* ============================================================================
   CONFIG  ← the only part you normally need to edit
   ============================================================================ */
const CONFIG = {

  /* ⚠️⚠️⚠️  PLACEHOLDER PHONE NUMBER — REPLACE THIS  ⚠️⚠️⚠️
     ------------------------------------------------------------------
     Write your WhatsApp number as: country code + number, digits only.
     No "+", no spaces, no dashes, no brackets.

        India example :  "919876543210"     (91 = India, then the number)
        WRONG        :  "+91 98765 43210"

     Until you change this, the WhatsApp buttons will not work.
     ------------------------------------------------------------------ */
  WHATSAPP_NUMBER: "91XXXXXXXXXX",

  /* The message that is pre-typed for the customer when they tap WhatsApp */
  WHATSAPP_MESSAGE: "Hi Scrappy Innovations, I would like to know today's scrap rates.",

  /* Category buttons appear in this order. Any new category you invent in
     prices.json is added automatically at the end — no code change needed. */
  CATEGORY_ORDER: ["Metal", "Paper", "Plastic", "E-Waste"],
};


/* ============================================================================
   PAGE ELEMENTS
   ============================================================================ */
const el = {
  locationText:  document.getElementById("locationText"),
  footerLocation: document.querySelector(".footer-location"),
  updatedDate:   document.getElementById("lastUpdatedDate"),
  updatedRel:    document.getElementById("lastUpdatedRelative"),
  currencyNote:  document.getElementById("currencyNote"),

  statTotal: document.getElementById("statTotal"),
  statUp:    document.getElementById("statUp"),
  statDown:  document.getElementById("statDown"),
  statFlat:  document.getElementById("statFlat"),

  search:      document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  filterPills: document.getElementById("filterPills"),
  sortSelect:  document.getElementById("sortSelect"),

  resultCount: document.getElementById("resultCount"),
  grid:        document.getElementById("priceGrid"),

  loading:      document.getElementById("loadingState"),
  errorState:   document.getElementById("errorState"),
  errorDetail:  document.getElementById("errorDetail"),
  emptyState:   document.getElementById("emptyState"),
  resetFilters: document.getElementById("resetFilters"),

  year: document.getElementById("year"),
};

/* What the visitor has currently chosen */
let allItems = [];              // every material, already calculated
let activeCategory = "All";
let searchTerm = "";


/* ============================================================================
   SMALL HELPERS
   ============================================================================ */

/* Makes text safe to place inside HTML, so an odd character in prices.json
   (like < or &) can never break the page. */
function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* 1250  →  "₹1,250"   (Indian digit grouping) */
function money(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/* 2  →  "+₹2"      -12  →  "−₹12"      0  →  "₹0" */
function signedMoney(amount) {
  if (amount > 0) return "+" + money(amount);
  if (amount < 0) return "−" + money(Math.abs(amount));
  return money(0);
}

/* "2026-08-21" → a real date in the visitor's own timezone.
   (Built part-by-part on purpose: new Date("2026-08-21") is read as UTC and
   can show the wrong day for visitors in India.) */
function parseDate(text) {
  const parts = String(text || "").split("-");
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return isNaN(d.getTime()) ? null : d;
}

/* "Friday, 21 August 2026" */
function longDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/* "Updated today" / "Updated yesterday" / "Updated 4 days ago" */
function relativeDay(date) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.round((startOfToday - date) / 86400000);

  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return "Updated " + days + " days ago";
}


/* ============================================================================
   THE CALCULATION  (Requirements 8, 9, 10)
   Works out the increase / decrease / percentage change for one material,
   so you never have to type a trend by hand.
   ============================================================================ */
function calculate(item) {
  // Accepts the new "todayPrice" and still understands the old "price" key.
  const today = Number(item.todayPrice != null ? item.todayPrice : item.price);
  const rawYesterday = item.yesterdayPrice;
  const yesterday = Number(rawYesterday);

  const hasYesterday = rawYesterday != null && rawYesterday !== "" && !isNaN(yesterday);
  const difference = hasYesterday ? today - yesterday : 0;

  // Percentage is only meaningful when yesterday's price was above zero.
  const percent = hasYesterday && yesterday > 0 ? (difference / yesterday) * 100 : null;

  let status = "flat";
  if (!hasYesterday) status = "new";
  else if (difference > 0) status = "up";
  else if (difference < 0) status = "down";

  const labels = {
    up:   { word: "UP",        arrow: "▲", css: "is-up" },
    down: { word: "DOWN",      arrow: "▼", css: "is-down" },
    flat: { word: "NO CHANGE", arrow: "–", css: "is-flat" },
    new:  { word: "NEW",       arrow: "–", css: "is-flat" },
  }[status];

  return {
    id: item.id,
    name: item.name || "Unnamed material",
    category: item.category || "Other",
    unit: item.unit || "kg",
    today: today,
    yesterday: hasYesterday ? yesterday : null,
    difference: difference,
    percent: percent,
    status: status,
    word: labels.word,
    arrow: labels.arrow,
    css: labels.css,
    valid: !isNaN(today),
  };
}


/* ============================================================================
   WHATSAPP BUTTONS  (Requirement 15)
   ============================================================================ */
function setupWhatsApp() {
  const number = String(CONFIG.WHATSAPP_NUMBER).replace(/[^0-9]/g, "");
  const link = "https://wa.me/" + number +
               "?text=" + encodeURIComponent(CONFIG.WHATSAPP_MESSAGE);

  ["waFloat", "waHeader", "waFooter"].forEach(function (id) {
    const node = document.getElementById(id);
    if (node) node.href = link;
  });

  // Loud reminder in the browser console while the placeholder is still there.
  if (String(CONFIG.WHATSAPP_NUMBER).toUpperCase().indexOf("X") !== -1) {
    console.warn(
      "[Scrappy Price] The WhatsApp number is still the placeholder " +
      '"' + CONFIG.WHATSAPP_NUMBER + '". Open app.js and set CONFIG.WHATSAPP_NUMBER ' +
      'to your real number, e.g. "919876543210".'
    );
  }
}


/* ============================================================================
   LOAD prices.json
   ----------------------------------------------------------------------------
   The path is relative ("prices.json", not "/prices.json") because GitHub
   Pages serves this site from a sub-folder. The "?v=" part stops the browser
   showing an old copy after you update your prices.
   ============================================================================ */
function loadPrices() {
  fetch("prices.json?v=" + Date.now(), { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("The server returned " + response.status + " for prices.json");
      }
      return response.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.prices)) {
        throw new Error('prices.json loaded, but it has no "prices" list inside it.');
      }
      start(data);
    })
    .catch(showError);
}

function showError(error) {
  if (el.loading) el.loading.remove();
  el.errorState.hidden = false;

  let hint;
  if (location.protocol === "file:") {
    hint = "It looks like this page was opened directly from a folder. " +
           "Browsers block file reading that way. Please open the site through " +
           "its web address instead (see README.md).";
  } else {
    hint = "Please check that prices.json is in the same folder as index.html, " +
           "and that it is still valid JSON — a missing comma or bracket is the " +
           "usual cause.";
  }

  el.errorDetail.textContent = hint + " (Technical detail: " + error.message + ")";
  el.resultCount.textContent = "";
  console.error("[Scrappy Price] Could not load prices:", error);
}


/* ============================================================================
   START UP
   ============================================================================ */
function start(data) {
  if (el.loading) el.loading.remove();

  // --- Header + footer details ------------------------------------------
  if (data.location) {
    el.locationText.textContent = data.location;
    if (el.footerLocation) el.footerLocation.textContent = data.location;
  }
  if (data.currency && data.currency !== "INR") {
    el.currencyNote.textContent = "All rates in " + data.currency;
  }
  el.year.textContent = new Date().getFullYear();

  // --- Last Updated (Requirement 13) ------------------------------------
  const updated = parseDate(data.lastUpdated);
  if (updated) {
    el.updatedDate.textContent = longDate(updated);
    el.updatedRel.textContent = relativeDay(updated);
  } else {
    el.updatedDate.textContent = data.lastUpdated || "Not available";
    el.updatedRel.textContent = "Date not recognised";
  }

  // --- Calculate every material once ------------------------------------
  const calculated = data.prices.map(calculate);
  allItems = calculated.filter(function (item) { return item.valid; });

  // Tell the owner if a price could not be read (usually a typo in the JSON)
  const skipped = calculated.filter(function (item) { return !item.valid; });
  if (skipped.length) {
    console.warn(
      "[Scrappy Price] " + skipped.length + " material(s) were skipped because " +
      '"todayPrice" is missing or is not a number: ' +
      skipped.map(function (i) { return i.name; }).join(", ")
    );
  }

  buildFilters();
  updateSummary();
  render();
}


/* ============================================================================
   MARKET SUMMARY TILES
   ============================================================================ */
function updateSummary() {
  const count = function (status) {
    return allItems.filter(function (i) { return i.status === status; }).length;
  };
  el.statTotal.textContent = allItems.length;
  el.statUp.textContent = count("up");
  el.statDown.textContent = count("down");
  el.statFlat.textContent = count("flat") + count("new");
}


/* ============================================================================
   CATEGORY FILTER BUTTONS  (Requirement 7)
   Built from whatever categories exist in prices.json.
   ============================================================================ */
function buildFilters() {
  const found = [];
  allItems.forEach(function (item) {
    if (found.indexOf(item.category) === -1) found.push(item.category);
  });

  // Preferred order first, then anything new, alphabetically.
  const preferred = CONFIG.CATEGORY_ORDER.filter(function (c) {
    return found.indexOf(c) !== -1;
  });
  const extras = found.filter(function (c) {
    return preferred.indexOf(c) === -1;
  }).sort();

  const categories = ["All"].concat(preferred, extras);

  el.filterPills.innerHTML = categories.map(function (category) {
    const pressed = category === activeCategory ? "true" : "false";
    return '<button class="pill" type="button" aria-pressed="' + pressed + '" ' +
           'data-category="' + esc(category) + '">' +
             '<span>' + esc(category) + '</span>' +
             '<span class="pill-count" data-count-for="' + esc(category) + '">0</span>' +
           "</button>";
  }).join("");

  el.filterPills.querySelectorAll(".pill").forEach(function (pill) {
    pill.addEventListener("click", function () {
      activeCategory = pill.dataset.category;
      render();
    });
  });
}


/* ============================================================================
   SEARCH + FILTER + SORT  (Requirement 6)
   ============================================================================ */
function matchesSearch(item) {
  if (!searchTerm) return true;
  const haystack = (item.name + " " + item.category).toLowerCase();
  return haystack.indexOf(searchTerm) !== -1;
}

function sortItems(items) {
  const mode = el.sortSelect.value;
  const list = items.slice();

  if (mode === "name") {
    list.sort(function (a, b) { return a.name.localeCompare(b.name); });
  } else if (mode === "high") {
    list.sort(function (a, b) { return b.today - a.today; });
  } else if (mode === "low") {
    list.sort(function (a, b) { return a.today - b.today; });
  } else if (mode === "movers") {
    list.sort(function (a, b) {
      const A = a.percent === null ? -1 : Math.abs(a.percent);
      const B = b.percent === null ? -1 : Math.abs(b.percent);
      return B - A;
    });
  }
  // "featured" keeps the order used in prices.json
  return list;
}


/* ============================================================================
   DRAW ONE CARD
   ============================================================================ */
function cardHTML(item) {
  const percentText = item.percent === null
    ? item.word
    : (item.percent > 0 ? "+" : item.percent < 0 ? "−" : "") +
      Math.abs(item.percent).toFixed(1) + "%";

  const yesterdayText = item.yesterday === null ? "—" : money(item.yesterday);

  return '' +
  '<article class="card ' + item.css + '">' +

    '<div class="card-top">' +
      '<span class="badge">' + esc(item.category) + "</span>" +
      '<span class="trend">' +
        '<span class="trend-arrow" aria-hidden="true">' + item.arrow + "</span>" +
        "<span>" + esc(percentText) + "</span>" +
      "</span>" +
    "</div>" +

    '<h3 class="card-name">' + esc(item.name) + "</h3>" +

    '<div class="card-price">' +
      '<span class="price-value">' + money(item.today) + "</span>" +
      '<span class="price-unit">per ' + esc(item.unit) + "</span>" +
    "</div>" +

    '<div class="card-compare">' +
      '<span class="compare-cell">' +
        '<span class="compare-label">Yesterday</span>' +
        '<span class="compare-value">' + yesterdayText + "</span>" +
      "</span>" +
      '<span class="compare-cell">' +
        '<span class="compare-label">Change</span>' +
        '<span class="compare-value compare-change">' + signedMoney(item.difference) +
          '<span class="status-word">' + esc(item.word) + "</span>" +
        "</span>" +
      "</span>" +
    "</div>" +

  "</article>";
}


/* ============================================================================
   DRAW EVERYTHING
   ============================================================================ */
function render() {
  // Keep the pressed state of the filter buttons in step
  el.filterPills.querySelectorAll(".pill").forEach(function (pill) {
    pill.setAttribute("aria-pressed", pill.dataset.category === activeCategory ? "true" : "false");
  });

  // Search first, so the number on each filter button tells the truth
  const searched = allItems.filter(matchesSearch);

  el.filterPills.querySelectorAll("[data-count-for]").forEach(function (node) {
    const category = node.dataset.countFor;
    node.textContent = category === "All"
      ? searched.length
      : searched.filter(function (i) { return i.category === category; }).length;
  });

  const visible = sortItems(
    activeCategory === "All"
      ? searched
      : searched.filter(function (i) { return i.category === activeCategory; })
  );

  // Draw the cards in one go
  el.grid.innerHTML = visible.map(cardHTML).join("");

  // Show the "nothing found" panel when needed
  const nothingFound = visible.length === 0;
  el.emptyState.hidden = !nothingFound;
  el.grid.hidden = nothingFound;

  // "Showing 8 of 20 materials"
  el.resultCount.innerHTML = nothingFound
    ? ""
    : "Showing <strong>" + visible.length + "</strong> of <strong>" +
      allItems.length + "</strong> materials" +
      (activeCategory === "All" ? "" : " in <strong>" + esc(activeCategory) + "</strong>");

  el.clearSearch.hidden = searchTerm === "";
}


/* ============================================================================
   VISITOR ACTIONS
   ============================================================================ */
el.search.addEventListener("input", function () {
  searchTerm = el.search.value.trim().toLowerCase();
  render();
});

el.clearSearch.addEventListener("click", function () {
  el.search.value = "";
  searchTerm = "";
  el.search.focus();
  render();
});

el.sortSelect.addEventListener("change", render);

el.resetFilters.addEventListener("click", function () {
  el.search.value = "";
  searchTerm = "";
  activeCategory = "All";
  el.sortSelect.value = "featured";
  render();
});


/* ============================================================================
   GO
   ============================================================================ */
setupWhatsApp();
loadPrices();

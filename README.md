# Scrappy Price — Owner's Guide

The daily scrap price website for **Scrappy Innovations**.
Live site: <https://basimtp.github.io/scrappy-price/>

You do **not** need to know how to code to run this site. In normal day-to-day
use you only ever touch **one file: `prices.json`**.

---

## ⚠️ Two things to do before you show this to customers

1. **Set your WhatsApp number.** Open `app.js`, find `WHATSAPP_NUMBER` near the
   very top, and replace `"91XXXXXXXXXX"` with your real number. Until you do,
   the WhatsApp buttons will not work.
2. **Check the sample prices.** Some materials were added as *examples* so the
   category filters had something to show. Verify them against your real rates
   before publishing — see the list at the bottom of this guide.

---

## The files

| File | What it is | Do you touch it? |
|---|---|---|
| `prices.json` | **Your price list.** All rates and the date. | ✅ **Yes — every day** |
| `app.js` | The logic. Your WhatsApp number is at the top. | Once, then rarely |
| `styles.css` | All colours, fonts and spacing. | Only to restyle |
| `index.html` | The page layout and wording. | Only to change text |
| `README.md` | This guide. | No |
| `.nojekyll` | Tells GitHub to publish the files as-is. | ❌ Never delete |

---

## Updating prices (the daily job)

Each material looks like this:

```json
{
  "id": 1,
  "name": "Iron Scrap",
  "category": "Metal",
  "unit": "kg",
  "todayPrice": 35,
  "yesterdayPrice": 33
}
```

**To update a price, you change two numbers:**

1. Copy what is currently in `todayPrice` into `yesterdayPrice`.
2. Type the new rate into `todayPrice`.

So if Iron Scrap moves from ₹35 to ₹37 tomorrow:

```json
"todayPrice": 37,
"yesterdayPrice": 35
```

**Then change the date at the top of the file:**

```json
"lastUpdated": "2026-08-22",
```

Use the `YYYY-MM-DD` format — year, then month, then day.

**That is all.** The website works out the rest by itself:

- the ₹ increase or decrease (`+₹2`)
- the percentage change (`+5.7%`)
- the **UP / DOWN / NO CHANGE** arrow and label
- the "Prices up / down / no change" counters at the top of the page

> You never type a trend by hand. That means the arrow can never disagree with
> the numbers, which used to be possible in the old version of the site.

---

## Adding a new material

Copy any existing block, paste it before the final `]`, and edit it. Remember a
comma after the `}` of the block before it.

```json
    {
      "id": 21,
      "name": "Aluminium Utensils",
      "category": "Metal",
      "unit": "kg",
      "todayPrice": 130,
      "yesterdayPrice": 128
    }
```

- **`id`** — any number not already used.
- **`name`** — shown on the card, and searchable.
- **`category`** — `Metal`, `Paper`, `Plastic` or `E-Waste`.
- **`unit`** — usually `kg`, but use `piece` for things sold per item.
- If you leave out `yesterdayPrice`, the card shows **NEW** instead of an arrow.

### Adding a brand-new category

Just type it into `category` (for example `"Glass"`). A filter button for it
appears on the site automatically — no code change needed. New categories are
listed after the four main ones; to control the order, add the name to
`CATEGORY_ORDER` in `app.js`.

---

## Other small changes

| I want to change… | Where | What to edit |
|---|---|---|
| WhatsApp number | `app.js` | `WHATSAPP_NUMBER` at the top |
| The pre-typed WhatsApp message | `app.js` | `WHATSAPP_MESSAGE` |
| The city / state shown | `prices.json` | `"location": "Kerala, India"` |
| Brand colours | `styles.css` | The `DESIGN TOKENS` block at the top |
| Headings, footer, disclaimer wording | `index.html` | The text between the tags |
| Web address in the sharing preview | `index.html` | The `og:url` line |

---

## The three JSON rules

`prices.json` is strict about punctuation. Nearly every problem is one of these:

1. **A comma between every block**, but **never after the last one**.
2. **Text needs double quotes** (`"Iron Scrap"`). **Numbers must not** — write
   `35`, not `"35"`.
3. **Never use `₹` inside a price.** Write `35`, and the site adds the ₹ itself.

If the page shows an error, paste your file into <https://jsonlint.com> — it
points at the exact line.

---

## Previewing on your own computer

**Double-clicking `index.html` will show an error.** That is expected: browsers
block a page from reading a file (`prices.json`) when it is opened straight from
a folder. It is not a bug in the site.

To preview properly, open a terminal in this folder and run one of these:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000> in your browser.

---

## Publishing

The site is hosted with **GitHub Pages** from the `main` branch. When you push a
change to `prices.json`, the live site updates within a minute or two.

```bash
git add prices.json
git commit -m "Update prices for 22 August 2026"
git push
```

If you still see old prices, refresh with `Ctrl` + `F5`.

**Two rules that keep the site working:**

- Keep all files in the **same folder** — `index.html`, `styles.css`, `app.js`
  and `prices.json` sit side by side.
- Never write a path starting with `/` (like `/prices.json`). This site is
  published in a sub-folder, so a leading `/` breaks it. Always `prices.json`.

---

## Troubleshooting

| What you see | Cause | Fix |
|---|---|---|
| "We couldn't load today's prices" | Broken JSON, or opened by double-click | Check on jsonlint.com; preview using the server command above |
| A material is missing | Its block has a typo | Check the commas and quotes around it |
| Prices look old | Browser cache | Press `Ctrl` + `F5` |
| WhatsApp button does nothing | Number is still the placeholder | Set `WHATSAPP_NUMBER` in `app.js` |
| Card shows **NEW** | No `yesterdayPrice` on that item | Add one |
| Page has no styling | `styles.css` was renamed or moved | Keep it beside `index.html` |

---

## ⚠️ Sample data to verify

These **8 materials keep the exact prices you already published** — untouched:

Iron Scrap · Aluminium Scrap · Copper Scrap · Brass Scrap · Stainless Steel ·
Newspaper · Cardboard · PET Plastic

Their `yesterdayPrice` values were worked backwards from the up/down/stable
trend your old site displayed, so nothing changed meaning.

These **12 materials are examples added to fill out the categories** — the
rates are plausible but **not verified**. Please replace them with your real
numbers, or delete any material you do not buy:

| Category | Added materials |
|---|---|
| Metal | Copper Wire (Household), Tin / Steel Cans |
| Paper | Office White Paper, Books & Magazines |
| Plastic | Hard Plastic (Mixed), Plastic Bottles (Mixed), Milk Pouches (LDPE) |
| E-Waste | Old Laptop, Desktop CPU Cabinet, LCD Monitor, Mobile Phone (Scrap), Computer Motherboard |

---

© Scrappy Innovations

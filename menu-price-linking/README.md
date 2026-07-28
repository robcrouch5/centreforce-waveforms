# Festival bar menus — one spreadsheet, every Photoshop file

Keep **one master price list**. Change a price once, and regenerate **every**
menu — the tall DRINKS/VIP boards *and* the long horizontal ones above each bar —
with a single click. No opening 15 `.psd` files by hand.

Photoshop can't *live-link* to Excel (there's no "auto-refresh from a cell"), but
this kit gets you the same result.

---

## The big idea (why this works for your menus)

Your DRINKS and VIP menus already use almost identical prices — the differences
are *which items appear* (VIP adds Cruzcampo + Pimms), not the numbers. So we give
the **same layer name** to the same price on every menu:

- The pint-of-lager price is a text layer named `lager_pint` on the DRINKS board,
  the VIP board, **and** the horizontal above-bar version.
- Change `lager_pint` to `£8.50` in the spreadsheet → run the script → **all three
  update at once.**

That's the whole trick. One row in the sheet can feed a dozen menus.

---

## One-time setup (do this once per menu)

1. **Name your price layers.** In each `.psd`, double-click each price text layer
   in the Layers panel and rename it to the matching **Key** from `prices.xlsx`.
   The full list of keys is already filled in for your current menus — e.g.:

   | On the menu | Layer name to use |
   |---|---|
   | Spitfire Lager — pint | `lager_pint` |
   | Rose Blush — bottle | `wine_rose_bottle` |
   | Gordons Gin — 50ml | `spirit_gin_50` |
   | Jagermeister shot | `shot_jager` |
   | Bottle of Water | `soft_water` |

   Use the **same key on every menu** that shows that drink. Only layers you rename
   are ever touched — artwork, fonts, and layout are left exactly as you designed.

That's the only fiddly part, and you only do it once.

---

## Every time prices change (30 seconds)

1. Open **`prices.xlsx`**, edit the blue **Price** cells.
2. **File → Save As → CSV UTF-8 (.csv)** → overwrite `prices.csv`.
3. Photoshop → **File → Scripts → Browse…** → pick `update-menus.jsx`.
4. It asks for `prices.csv`, then the **folder** of your `.psd` menus.
5. New **PNG** (and/or JPG/PDF) of every menu appears in the **`output/`** folder,
   all with the new prices.

Your `.psd` masters stay untouched. The script even warns you if a key never
matched a layer — that's how you catch a layer-name typo.

> Output is set to **PNG for screens** by default (great for social / the LED walls).
> Want JPGs or print PDFs too? Flip `EXPORT_JPG` / `EXPORT_PDF` to `true` at the top
> of `update-menus.jsx`.

---

## When drinks come and go ("options change")

Two ways to handle it:

- **Price change / rename / "SOLD OUT":** just edit the value in the sheet. You can
  put any text in a price cell — `£9`, `2 for £10`, `SOLD OUT`.
- **A whole line appears/disappears** (like Cruzcampo or Pimms on VIP only): put
  that row's layers inside a **group**, name the group `row_cruzcampo` (etc.), and
  use the **`show` rows** at the bottom of the sheet — `TRUE` shows it, `FALSE`
  hides it. See `row_cruzcampo` / `row_pimms` in `prices.xlsx`.

  ⚠️ *Honest limit:* hiding a line leaves a **gap** — Photoshop doesn't reflow text
  like a webpage. Show/hide is great for a handful of seasonal items. If you're
  regularly adding/removing lots of drinks, that's a layout job, and it may be
  worth rebuilding the menus in **InDesign (Data Merge)**, which *does* reflow.

---

## Per-menu differences (e.g. VIP-only prices)

If one menu ever needs a *different* price for the same drink, give that layer a
menu-specific key (e.g. `lager_pint_vip`) and add a matching row to the sheet.
Everything else keeps sharing the common key. Right now your VIP prices match the
standard ones, so you don't need this yet.

---

## Files in this folder
| File | What it is |
|------|------------|
| `prices.xlsx` | **Your master.** Pre-filled with current prices. Edit the blue cells. |
| `prices.csv` | What the script reads. Overwrite it via Save As CSV from the xlsx. |
| `update-menus.jsx` | The Photoshop script. Run via **File → Scripts → Browse…** |
| `sample-menus/` | Drop your `.psd` menus here (or point the script anywhere). |
| `output/` | Generated menu images/PDFs land here. |
| `build_master.py` | How `prices.xlsx`/`prices.csv` were generated (for reference). |

---

## No-code fallback (built into Photoshop)
If you'd rather not run a script: **Image → Variables → Define** lets you bind text
layers to variables and **import a CSV** (Data Sets), then **File → Export → Data
Sets as Files**. It works, but one document at a time and it flattens the output —
which is why the script above is the better fit for many menus.

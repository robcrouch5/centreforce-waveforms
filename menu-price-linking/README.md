# Soultown bar menus — one master, all four Photoshop boards

Keep editing **one master** (`Soultown_Menu_2026.xlsx`). Change a price once and
regenerate all your menu boards — **Normal** and **VIP**, each in its **vertical**
and **horizontal** layout — with a single click. No opening 4 `.psd` files by hand.

Photoshop can't *live-link* to Excel (no auto-refresh from a cell), but this gets
you the same result.

---

## How it fits your setup

- Your master holds every bar. The **Menu tab** (customer prices) feeds the boards.
- You design **4 files**: Normal (vertical + horizontal) and VIP (vertical + horizontal).
- I added a **"Photoshop" tab** to `Soultown_Menu_2026_linked.xlsx`. It lists every
  price with a `Key` (the layer name) and a `File` tag (`normal` / `vip`), and it
  **pulls prices from your Menu tab by formula** — so it always matches your master.
- The script reads that tab's CSV and updates the matching text layers on each board.
  The **horizontal and vertical of a board share the same keys**, so one price change
  updates both.

Right now Normal and VIP carry the same prices in the master, so both boards show
the same numbers — but they're wired separately, so you can diverge them any time.

---

## One-time setup (per board, ~once)

1. **Rename your price layers.** Open `LAYER-NAMES.md` (a full list of every price,
   its size, and the exact `Key` to use). In each `.psd`, double-click each price
   text layer and name it to match — e.g. the pint-of-lager price on a Normal board
   becomes `normal_spitfire_lager_pint`; on a VIP board `vip_spitfire_lager_pint`.
2. **Name the 4 files so each contains its tag:**
   `Menu_Normal_Vertical.psd`, `Menu_Normal_Horizontal.psd`,
   `Menu_VIP_Vertical.psd`, `Menu_VIP_Horizontal.psd`.
   (The `File` column routes `normal` rows to the two normal boards and `vip` rows to
   the two VIP boards.)

Only layers you rename are ever touched — artwork, fonts and layout stay exactly as
designed. You only do this once.

---

## Every time prices change (~30 seconds)

1. Edit prices on the **Menu tab** of `Soultown_Menu_2026_linked.xlsx` as normal.
2. Click the **Photoshop tab**, then **File → Save As → CSV UTF-8** and overwrite
   **`menu-data.csv`**.
3. Photoshop → **File → Scripts → Browse…** → pick **`update-menus.jsx`**.
4. It asks for `menu-data.csv`, then the **folder** of your `.psd` boards.
5. Fresh **PNG** of every board (with the new prices) appears in the **`output/`**
   folder. Your `.psd` masters stay untouched.

> Output is **PNG for screens** by default. Want JPGs or print PDFs too? Set
> `EXPORT_JPG` / `EXPORT_PDF` to `true` at the top of `update-menus.jsx`.
> The script also lists any key that never matched a layer — that's how you catch a
> layer-name typo.

---

## Prices show as £7.90 / £8 / £2.50 automatically

The Photoshop tab formats prices for you: whole pounds show as `£8`, everything else
as two decimals (`£7.90`, `£2.50`). You never retype a price there — you only edit
the Menu tab. To change that style, edit the formula in the Photoshop tab's Price
column once.

---

## Items that come and go ("options change")

- **Price change / rename / SOLD OUT:** just edit the Menu tab.
- **A whole line appears/disappears** (e.g. a VIP-only item): put that line's layers
  in a **group**, name the group something like `vip_pimms_row`, and add a row to the
  Photoshop tab with `Type = show` and value `TRUE`/`FALSE`. The script shows/hides it.
  ⚠️ Hiding a line leaves a **gap** — Photoshop doesn't reflow like a webpage — so this
  suits a few seasonal items, not big redesigns. For constantly-changing long lists,
  **InDesign Data Merge** is the tool that *does* reflow.

---

## If your master's layout changes a lot next year
The Photoshop tab is generated from the current cell positions. If you move whole
sections around in the Menu tab, re-run `build_export.py` (it reads the master and
rebuilds the tab + `menu-data.csv`). `parse_master.py` holds which bar feeds which
board (`normal` = Bar 1, `vip` = Bar 7) — change those two lines if you want
different source bars.

---

## Files in this folder
| File | What it is |
|------|------------|
| `Soultown_Menu_2026_linked.xlsx` | Your master **+ a new "Photoshop" tab**. Edit prices on the Menu tab. |
| `menu-data.csv` | Ready-to-run export (overwrite it via Save As CSV from the Photoshop tab). |
| `LAYER-NAMES.md` | The exact layer name to give every price on each board. |
| `update-menus.jsx` | The Photoshop script. Run via **File → Scripts → Browse…** |
| `sample-menus/` | Put your 4 `.psd` boards here (or point the script anywhere). |
| `output/` | Generated board images land here. |
| `parse_master.py`, `build_export.py` | Regenerate the tab/CSV if the master layout changes. |

---

## No-code fallback (built into Photoshop)
If you'd rather not run a script: **Image → Variables → Define** binds text layers to
variables and **imports a CSV** (Data Sets), then **File → Export → Data Sets as
Files**. It works, but one document at a time and it flattens output — which is why
the script is the better fit for four boards.

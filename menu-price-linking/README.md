# Festival bar menus — one spreadsheet, all the Photoshop files

The goal: keep **one master price list**. When a price or option changes, update
it in that one place and regenerate **every** menu — no opening 15 `.psd` files
by hand.

Photoshop can't *live-link* to Excel (there's no "this text = cell B2, auto-refresh"),
but this kit gets you the same result with one click.

---

## The recommended way — one-click script (`update-menus.jsx`)

**One-time setup**

1. **Name your price layers.** In each menu `.psd`, rename every text layer that
   holds a price so it matches a `key` in the spreadsheet. Double-click the layer
   name in the Layers panel and type, e.g. `price_pint_lager`. Do this once —
   after that the layer is "wired up" forever.
   - The *same* key can appear on as many menus as you like. Name the lager-price
     layer `price_pint_lager` on all 15 menus and they all update together.
   - Only layers you rename are touched. Everything else (artwork, fonts, layout)
     is left exactly as you designed it.

2. **Keep your prices in `prices.csv`.** Edit `prices.csv` here, *or* keep a nice
   `prices.xlsx` in Excel as your master and, when ready, do
   **File → Save As → CSV UTF-8 (.csv)** and overwrite `prices.csv`.
   The format is just two columns:

   ```
   key,value
   price_pint_lager,£6.50
   price_double_spirit_mixer,£9.00
   ```

**Every time prices change**

1. Update `prices.csv` (or re-export it from Excel).
2. Open Photoshop → **File → Scripts → Browse…** → pick `update-menus.jsx`.
3. It asks for `prices.csv`, then the **folder** containing your `.psd` menus.
4. Look in the new **`output/`** folder next to your menus — a print-ready
   **PDF** and a **PNG** preview of every menu, all with the new prices.

That's it. Your `.psd` masters are left untouched (unless you flip `SAVE_PSD` to
`true` at the top of the script).

### Handy details
- The script tells you if a key in the sheet never matched a layer — usually a
  typo in a layer name. Fix the name, re-run.
- Values are plain text, so you control the exact look: `£6.50`, `SOLD OUT`,
  `2 for £10`, `Main Stage Bar` all work.
- You can drive more than prices — bar names, "Card only" notes, allergen lines —
  anything on a text layer. See the `label_*` / `note_*` rows in `prices.csv`.
- Toggles live at the top of `update-menus.jsx`: `EXPORT_PDF`, `EXPORT_PNG`,
  `PNG_MAX_PX`, `SAVE_PSD`.

### Naming convention (suggestion)
Keep keys lowercase with underscores so they're easy to match:
`price_<drink>`, `label_<thing>`, `note_<thing>`. Consistency is what lets one
spreadsheet feed every menu.

---

## The no-code fallback — Photoshop's built-in Variables

If you'd rather not use a script, Photoshop has this built in (best for a single
template you re-run):

1. **Image → Variables → Define.** Pick a text layer, tick **Text Replacement**,
   give the variable a name.
2. Repeat for each price layer.
3. **Image → Variables → Data Sets**, or **Import** a CSV/TSV exported from Excel
   (columns = variable names, rows = versions).
4. **File → Export → Data Sets as Files** to render them out.

It works, but it's one document at a time and exports flattened images — which is
why the script above is the better fit when you have *many* menus.

---

## When to consider InDesign instead
If these menus become a recurring, text-heavy job (full drink lists, table
layouts), **InDesign's Data Merge** is the professional tool for exactly this:
link a spreadsheet, auto-flow the data, export print PDFs. It means rebuilding
the artwork off Photoshop, so only worth it if menus become a regular thing.

---

## Files in this folder
| File | What it is |
|------|------------|
| `update-menus.jsx` | The Photoshop script. Run via File → Scripts → Browse… |
| `prices.csv` | Example central price list — edit this (or export it from Excel) |
| `sample-menus/` | Drop your `.psd` menus here (or point the script anywhere) |
| `output/` | Generated PDFs + PNGs land here |

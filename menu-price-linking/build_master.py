#!/usr/bin/env python3
"""Build prices.xlsx (the editable master) and a matching prices.csv.

Data below is taken from the current DRINKS + VIP DRINKS menus. Keys are the
layer names you give each price in Photoshop. The SAME key on several menus
means they all update together from this one file.
"""
import csv
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# category, item, key (layer name), price (exact on-screen text), type, notes
ROWS = [
    ("BEER", "Spitfire Lager — half",  "lager_half",       "£4.00", "text", ""),
    ("BEER", "Spitfire Lager — pint",  "lager_pint",       "£8.00", "text", ""),
    ("BEER", "Orchard View — half",    "cider_half",       "£4.00", "text", ""),
    ("BEER", "Orchard View — pint",    "cider_pint",       "£8.00", "text", ""),
    ("BEER", "Cruzcampo — half",       "cruzcampo_half",   "£4.50", "text", "VIP menu only"),
    ("BEER", "Cruzcampo — pint",       "cruzcampo_pint",   "£8.50", "text", "VIP menu only"),

    ("WINE", "Rose Blush — glass",     "wine_rose_glass",     "£12", "text", ""),
    ("WINE", "Rose Blush — bottle",    "wine_rose_bottle",    "£35", "text", ""),
    ("WINE", "Richelieu Blanc — glass","wine_richelieu_glass","£10", "text", ""),
    ("WINE", "Prosecco — glass",       "wine_prosecco_glass", "£10", "text", ""),
    ("WINE", "Prosecco — bottle",      "wine_prosecco_bottle","£30", "text", ""),

    ("SHOTS", "Myst Salted Caramel",   "shot_salted_caramel", "£6",  "text", ""),
    ("SHOTS", "Myst Coffee Tequila",   "shot_coffee_tequila", "£6",  "text", ""),
    ("SHOTS", "Jagermeister",          "shot_jager",          "£7",  "text", ""),
    ("SHOTS", "Tequila Rose",          "shot_tequila_rose",   "£6",  "text", ""),
    ("SHOTS", "Glass of Pimms",        "shot_pimms",          "£10", "text", "VIP menu only"),

    ("SPIRITS & MIXER", "Zubrowka Vodka — 25ml",           "spirit_zubrowka_25",      "£8",  "text", ""),
    ("SPIRITS & MIXER", "Zubrowka Vodka — 50ml",           "spirit_zubrowka_50",      "£12", "text", ""),
    ("SPIRITS & MIXER", "Zubrowka Rasp & Lemonade — 25ml", "spirit_zubrowka_rasp_25", "£8",  "text", ""),
    ("SPIRITS & MIXER", "Zubrowka Rasp & Lemonade — 50ml", "spirit_zubrowka_rasp_50", "£12", "text", ""),
    ("SPIRITS & MIXER", "Gordons Gin — 25ml",              "spirit_gin_25",           "£8",  "text", ""),
    ("SPIRITS & MIXER", "Gordons Gin — 50ml",              "spirit_gin_50",           "£12", "text", ""),
    ("SPIRITS & MIXER", "Gordons Pink Gin — 25ml",         "spirit_pinkgin_25",       "£8",  "text", ""),
    ("SPIRITS & MIXER", "Gordons Pink Gin — 50ml",         "spirit_pinkgin_50",       "£12", "text", ""),
    ("SPIRITS & MIXER", "Myst Spiced Apple Rum — 25ml",    "spirit_rum_25",           "£8",  "text", ""),
    ("SPIRITS & MIXER", "Myst Spiced Apple Rum — 50ml",    "spirit_rum_50",           "£12", "text", ""),
    ("SPIRITS & MIXER", "Jack Daniels — 25ml",             "spirit_jack_25",          "£9",  "text", ""),
    ("SPIRITS & MIXER", "Jack Daniels — 50ml",             "spirit_jack_50",          "£13", "text", ""),

    ("SOFT DRINKS", "Coke Zero / Lemonade", "soft_coke",    "£3.50", "text", ""),
    ("SOFT DRINKS", "Red Bull",             "soft_redbull", "£4.00", "text", ""),
    ("SOFT DRINKS", "Schweppes Tonic / Soda","soft_tonic",  "£2.50", "text", ""),
    ("SOFT DRINKS", "Bottle of Water",      "soft_water",   "£3.00", "text", ""),

    # OPTIONS: show/hide a whole line/group. Name the row's GROUP with this key
    # in Photoshop. TRUE = show, FALSE = hide. (Hiding leaves a gap — Photoshop
    # doesn't reflow — so use for items that come and go, not big redesigns.)
    ("OPTIONS (show / hide)", "Show Cruzcampo row", "row_cruzcampo", "TRUE", "show", "Set FALSE to hide on menus that don't serve it"),
    ("OPTIONS (show / hide)", "Show Pimms row",     "row_pimms",     "TRUE", "show", "Set FALSE to hide when Pimms is off"),
]

HEADERS = ["Category", "Item", "Key (Photoshop layer name)", "Price", "Type", "Notes"]

# ---------------------------------------------------------------- xlsx -------
wb = Workbook()
ws = wb.active
ws.title = "Prices"

ARIAL = "Arial"
PINK = "E5197E"
PURPLE = "5B2A86"
BLUE_INPUT = Font(name=ARIAL, size=11, color="0000FF")   # editable price cells
GREY = PatternFill("solid", fgColor="F2F2F2")
HEAD_FILL = PatternFill("solid", fgColor=PURPLE)
CAT_FILL = PatternFill("solid", fgColor="FCE4EF")
thin = Side(style="thin", color="D9D9D9")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

r = 1
# Title
ws.cell(r, 1, "Festival Bar — Master Price List").font = Font(name=ARIAL, size=16, bold=True, color=PINK)
r += 1
ws.cell(r, 1, "Edit the blue Price cells, then File > Save As > CSV UTF-8 (overwrite prices.csv) and run update-menus.jsx in Photoshop.").font = Font(name=ARIAL, size=10, italic=True)
r += 1
ws.cell(r, 1, "Blue = you edit this.   Key = name the matching Photoshop text layer exactly this.   Same key on many menus = they all update together.").font = Font(name=ARIAL, size=10, italic=True, color="808080")
r += 2

header_row = r
for c, h in enumerate(HEADERS, start=1):
    cell = ws.cell(header_row, c, h)
    cell.font = Font(name=ARIAL, size=11, bold=True, color="FFFFFF")
    cell.fill = HEAD_FILL
    cell.alignment = Alignment(vertical="center")
    cell.border = BORDER
r += 1

last_cat = None
for (cat, item, key, price, typ, notes) in ROWS:
    show_cat = cat if cat != last_cat else ""
    last_cat = cat
    values = [show_cat, item, key, price, typ, notes]
    for c, v in enumerate(values, start=1):
        cell = ws.cell(r, c, v)
        cell.font = Font(name=ARIAL, size=11)
        cell.border = BORDER
        if c == 1 and show_cat:
            cell.font = Font(name=ARIAL, size=11, bold=True, color=PURPLE)
            cell.fill = CAT_FILL
        if c == 3:  # key column — monospace-ish emphasis
            cell.font = Font(name=ARIAL, size=11, color="333333")
        if c == 4:  # price — editable input
            cell.font = BLUE_INPUT
            cell.alignment = Alignment(horizontal="center")
    r += 1

# Column widths
widths = [22, 34, 30, 12, 8, 34]
for i, w in enumerate(widths, start=1):
    ws.column_dimensions[get_column_letter(i)].width = w

ws.freeze_panes = ws.cell(header_row + 1, 1)

wb.save("prices.xlsx")

# ---------------------------------------------------------------- csv --------
# Mirror of what "Save As CSV UTF-8" from the sheet produces. update-menus.jsx
# reads the Key, Price and Type columns and ignores the rest.
with open("prices.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(HEADERS)
    for (cat, item, key, price, typ, notes) in ROWS:
        w.writerow([cat, item, key, price, typ, notes])

print("Wrote prices.xlsx and prices.csv")

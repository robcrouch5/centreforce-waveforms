/*
 * update-menus.jsx  —  Drive every festival bar menu from ONE spreadsheet.
 * ---------------------------------------------------------------------------
 * WHAT IT DOES
 *   Reads a central price list (prices.csv, exported from your Excel master),
 *   opens every .psd in a folder you choose, and for each one:
 *     - sets the PRICE/TEXT of any layer whose NAME matches a "key" in the sheet
 *     - optionally SHOWS/HIDES a layer or row (for items that come and go)
 *   Then exports an image (PNG/JPG) and/or a print PDF of each menu. Your .psd
 *   masters are left untouched unless you set SAVE_PSD = true below.
 *
 * HOW TO RUN (no coding needed)
 *   1. In Excel, keep your master as prices.xlsx. When ready:
 *      File > Save As > "CSV UTF-8 (.csv)"  and overwrite prices.csv.
 *   2. In each menu .psd, rename the price text layers to match the "key"
 *      column (double-click the layer name in the Layers panel), e.g.
 *      the pint-of-lager price layer becomes  lager_pint
 *   3. In Photoshop:  File > Scripts > Browse...  and pick this file.
 *   4. It asks for prices.csv, then the folder of .psd menus. Look in /output.
 *
 * Re-run any time a price changes. Same key on many menus = they all update.
 * ---------------------------------------------------------------------------
 */

#target photoshop

// ===== Settings you can tweak ==============================================
var EXPORT_PNG     = true;   // on-screen image per menu (screens / social / LED)
var EXPORT_JPG     = false;  // JPG as well (smaller files, good for LED walls)
var EXPORT_PDF     = false;  // print-ready PDF (turn on if a printer needs it)
var IMG_MAX_PX     = 2000;   // longest edge of the exported image
var JPG_QUALITY    = 10;     // 1-12 (JPG only)
var SAVE_PSD       = false;  // true = also overwrite the .psd with new prices
var REPORT_MISSING = true;   // list keys that never matched a layer (catches typos)
// ===========================================================================

function main() {
    var csvFile = File.openDialog("Select your prices.csv (exported from Excel)", "*.csv");
    if (!csvFile) return;

    var records = readCsv(csvFile);          // [ {key, value, type} ]
    if (records.length === 0) { alert("No rows found in that CSV. Expecting columns including 'key' and 'price'."); return; }

    var folder = Folder.selectDialog("Select the folder containing your .psd menu files");
    if (!folder) return;

    var psds = folder.getFiles(function (f) {
        return (f instanceof File) && /\.psd$/i.test(f.name);
    });
    if (psds.length === 0) { alert("No .psd files found in that folder."); return; }

    var outFolder = new Folder(folder.fsName + "/output");
    if (!outFolder.exists) outFolder.create();

    var savedUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    app.displayDialogs = DialogModes.NO;

    var usedKeys = {}, summary = [];

    for (var i = 0; i < psds.length; i++) {
        var doc = app.open(psds[i]);
        var changed = applyRecords(doc, records, usedKeys);

        var base = psds[i].name.replace(/\.psd$/i, "");
        if (EXPORT_PNG) exportImage(doc, new File(outFolder.fsName + "/" + base + ".png"), "png");
        if (EXPORT_JPG) exportImage(doc, new File(outFolder.fsName + "/" + base + ".jpg"), "jpg");
        if (EXPORT_PDF) exportPdf(doc, new File(outFolder.fsName + "/" + base + ".pdf"));

        if (SAVE_PSD) doc.save();
        doc.close(SAVE_PSD ? SaveOptions.SAVECHANGES : SaveOptions.DONOTSAVECHANGES);

        summary.push(base + ":  " + changed.text + " price(s), " + changed.vis + " show/hide");
    }

    app.preferences.rulerUnits = savedUnits;

    var msg = "Done. " + psds.length + " menu(s) processed.\n\n" + summary.join("\n");
    if (REPORT_MISSING) {
        var unused = [];
        for (var j = 0; j < records.length; j++) {
            if (!usedKeys[records[j].key]) unused.push(records[j].key);
        }
        if (unused.length) {
            msg += "\n\nThese keys never matched a layer on any menu (usually a layer-name typo):\n  " + unused.join("\n  ");
        }
    }
    alert(msg);
}

// Apply every record to one document.
//  - type "text" (default): set the contents of the text layer named <key>
//  - type "show":           show/hide the layer OR group named <key>
function applyRecords(doc, records, usedKeys) {
    var textMap = {}, showMap = {}, k;
    for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === "show") showMap[r.key] = parseBool(r.value);
        else textMap[r.key] = r.value;
    }

    var counts = { text: 0, vis: 0 };
    walk(doc, function (layer) {
        var name = trim(layer.name);
        if (layer.kind === LayerKind.TEXT && textMap.hasOwnProperty(name)) {
            try { layer.textItem.contents = textMap[name]; usedKeys[name] = true; counts.text++; } catch (e) {}
        }
        if (showMap.hasOwnProperty(name)) {
            try { layer.visible = showMap[name]; usedKeys[name] = true; counts.vis++; } catch (e2) {}
        }
    });
    return counts;
}

// Visit every layer, descending into groups.
function walk(container, fn) {
    var layers = container.layers;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        fn(layer);
        if (layer.typename === "LayerSet") walk(layer, fn);
    }
}

function parseBool(v) {
    var s = trim(String(v)).toLowerCase();
    return (s === "true" || s === "yes" || s === "y" || s === "1" || s === "on" || s === "show");
}

// ---- CSV reader -----------------------------------------------------------
// Finds the key / price / type columns by their header names, so extra
// columns (Category, Item, Notes...) in your spreadsheet are ignored.
function readCsv(file) {
    file.encoding = "UTF-8";
    file.open("r");
    var text = file.read();
    file.close();
    if (text.length && text.charCodeAt(0) === 0xFEFF) text = text.substring(1); // strip BOM

    var lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    var out = [];
    var keyIdx = 0, valIdx = 1, typeIdx = -1, headerDone = false;

    for (var i = 0; i < lines.length; i++) {
        if (trim(lines[i]) === "") continue;
        var cols = parseCsvLine(lines[i]);

        if (!headerDone) {
            var looksLikeHeader = /key|name|value|price|type/i.test(lines[i]);
            if (looksLikeHeader) {
                for (var c = 0; c < cols.length; c++) {
                    var h = trim(cols[c]).toLowerCase();
                    if (h.indexOf("key") === 0 || h === "name" || h === "id") keyIdx = c;
                    if (h.indexOf("price") === 0 || h.indexOf("value") === 0 || h === "text") valIdx = c;
                    if (h.indexOf("type") === 0) typeIdx = c;
                }
                headerDone = true;
                continue;
            }
            headerDone = true; // first row is data, use default column order
        }

        if (cols.length > keyIdx) {
            var key = trim(cols[keyIdx]);
            if (key === "") continue;              // skip category/blank rows
            var val  = (cols.length > valIdx)  ? trim(cols[valIdx])  : "";
            var type = (typeIdx >= 0 && cols.length > typeIdx) ? trim(cols[typeIdx]).toLowerCase() : "text";
            if (type !== "show") type = "text";
            out.push({ key: key, value: val, type: type });
        }
    }
    return out;
}

function parseCsvLine(line) {
    var out = [], cur = "", inQuotes = false;
    for (var i = 0; i < line.length; i++) {
        var ch = line.charAt(i);
        if (inQuotes) {
            if (ch === '"') {
                if (line.charAt(i + 1) === '"') { cur += '"'; i++; }
                else inQuotes = false;
            } else cur += ch;
        } else {
            if (ch === '"') inQuotes = true;
            else if (ch === ",") { out.push(cur); cur = ""; }
            else cur += ch;
        }
    }
    out.push(cur);
    return out;
}

function trim(s) { return String(s).replace(/^\s+/, "").replace(/\s+$/, ""); }

// ---- Exporters ------------------------------------------------------------
function exportImage(doc, outFile, kind) {
    var dup = doc.duplicate();
    dup.flatten();
    var longest = Math.max(dup.width.as("px"), dup.height.as("px"));
    if (longest > IMG_MAX_PX) {
        var scale = (IMG_MAX_PX / longest) * 100;
        dup.resizeImage(UnitValue(scale, "%"), null, null, ResampleMethod.BICUBICSHARPER);
    }
    var opts;
    if (kind === "jpg") { opts = new JPEGSaveOptions(); opts.quality = JPG_QUALITY; }
    else               { opts = new PNGSaveOptions();  opts.compression = 6; }
    dup.saveAs(outFile, opts, true, Extension.LOWERCASE);
    dup.close(SaveOptions.DONOTSAVECHANGES);
}

function exportPdf(doc, outFile) {
    var opts = new PDFSaveOptions();
    opts.PDFStandard = PDFStandard.NONE;
    opts.preserveEditing = false;
    opts.embedColorProfile = true;
    opts.view = false;
    doc.saveAs(outFile, opts, true, Extension.LOWERCASE);
}

main();

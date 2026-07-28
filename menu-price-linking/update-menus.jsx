/*
 * update-menus.jsx  —  Drive every festival bar menu from ONE spreadsheet.
 * ---------------------------------------------------------------------------
 * WHAT IT DOES
 *   Reads a central price list (prices.csv, exported from your Excel master),
 *   opens every .psd in a folder you choose, finds the text layers whose NAME
 *   matches a key in the spreadsheet, updates the price/text, and exports a
 *   print-ready PDF + a PNG preview of each menu. Your .psd files are left
 *   untouched (masters stay editable) unless you tick "save PSD" below.
 *
 * HOW TO RUN (no coding needed)
 *   1. In Excel, keep your master as prices.xlsx. When ready, File > Save As >
 *      "CSV UTF-8 (.csv)" and save it as prices.csv.
 *   2. In each menu .psd, rename the price text layers to match the "key"
 *      column, e.g. a layer showing the lager price is named  price_pint_lager
 *      (double-click the layer name in the Layers panel to rename).
 *   3. In Photoshop:  File > Scripts > Browse...  and pick this file.
 *   4. It asks for your prices.csv, then the folder of .psd menus. Done — look
 *      in the /output folder next to your menus.
 *
 * Re-run it any time a price changes. That's the whole workflow.
 * ---------------------------------------------------------------------------
 */

#target photoshop

// ===== Settings you can tweak ==============================================
var EXPORT_PDF     = true;   // print-ready PDF per menu
var EXPORT_PNG     = true;   // on-screen preview per menu
var PNG_MAX_PX     = 2000;   // longest edge of the PNG preview (keeps files small)
var SAVE_PSD       = false;  // true = also overwrite the .psd with new prices
var REPORT_MISSING = true;   // warn about keys in the sheet that no layer used
// ===========================================================================

function main() {
    // ---- 1. Pick the spreadsheet -----------------------------------------
    var csvFile = File.openDialog("Select your prices.csv (exported from Excel)", "*.csv");
    if (!csvFile) return;

    var prices = readCsv(csvFile);           // { key: value }
    var keyCount = 0, k;
    for (k in prices) { if (prices.hasOwnProperty(k)) keyCount++; }
    if (keyCount === 0) { alert("No rows found in that CSV. Expecting columns: key,value"); return; }

    // ---- 2. Pick the folder of menus -------------------------------------
    var folder = Folder.selectDialog("Select the folder containing your .psd menu files");
    if (!folder) return;

    var psds = folder.getFiles(function (f) {
        return (f instanceof File) && /\.psd$/i.test(f.name);
    });
    if (psds.length === 0) { alert("No .psd files found in that folder."); return; }

    var outFolder = new Folder(folder.fsName + "/output");
    if (!outFolder.exists) outFolder.create();

    // ---- 3. Process every menu -------------------------------------------
    var usedKeys = {};                       // which keys actually landed on a layer
    var summary = [];
    var savedUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    app.displayDialogs = DialogModes.NO;

    for (var i = 0; i < psds.length; i++) {
        var doc = app.open(psds[i]);
        var changed = applyPrices(doc, prices, usedKeys);

        var base = psds[i].name.replace(/\.psd$/i, "");
        if (EXPORT_PDF) exportPdf(doc, new File(outFolder.fsName + "/" + base + ".pdf"));
        if (EXPORT_PNG) exportPng(doc, new File(outFolder.fsName + "/" + base + ".png"));

        if (SAVE_PSD) doc.save();
        doc.close(SAVE_PSD ? SaveOptions.SAVECHANGES : SaveOptions.DONOTSAVECHANGES);

        summary.push(base + ":  " + changed + " price(s) updated");
    }

    app.preferences.rulerUnits = savedUnits;

    // ---- 4. Report --------------------------------------------------------
    var msg = "Done. " + psds.length + " menu(s) processed.\n\n" + summary.join("\n");
    if (REPORT_MISSING) {
        var unused = [];
        for (k in prices) {
            if (prices.hasOwnProperty(k) && !usedKeys[k]) unused.push(k);
        }
        if (unused.length) {
            msg += "\n\nNot found on any menu (check the layer names match these keys):\n  " + unused.join("\n  ");
        }
    }
    alert(msg);
}

// Walk every layer (including inside groups) and set text where the layer
// name matches a key in the price list.
function applyPrices(doc, prices, usedKeys) {
    var count = 0;
    walk(doc, function (layer) {
        if (layer.kind === LayerKind.TEXT) {
            var name = trim(layer.name);
            if (prices.hasOwnProperty(name)) {
                try {
                    layer.textItem.contents = prices[name];
                    usedKeys[name] = true;
                    count++;
                } catch (e) { /* locked/odd layer — skip */ }
            }
        }
    });
    return count;
}

function walk(container, fn) {
    var layers = container.layers;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (layer.typename === "LayerSet") {
            walk(layer, fn);
        } else {
            fn(layer);
        }
    }
}

// ---- CSV reader: expects a header row with columns key,value ---------------
// Tolerates quoted fields, £/$ signs, blank lines and a UTF-8 BOM.
function readCsv(file) {
    file.encoding = "UTF-8";
    file.open("r");
    var text = file.read();
    file.close();
    if (text.length && text.charCodeAt(0) === 0xFEFF) text = text.substring(1); // strip BOM

    var lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    var map = {};
    var keyIdx = 0, valIdx = 1, headerDone = false;

    for (var i = 0; i < lines.length; i++) {
        if (trim(lines[i]) === "") continue;
        var cols = parseCsvLine(lines[i]);

        if (!headerDone) {
            // Locate the key/value columns by header name if present.
            for (var c = 0; c < cols.length; c++) {
                var h = trim(cols[c]).toLowerCase();
                if (h === "key" || h === "name" || h === "id") keyIdx = c;
                if (h === "value" || h === "price" || h === "text") valIdx = c;
            }
            headerDone = true;
            // If the first row wasn't actually a header, treat it as data too.
            var looksLikeHeader = /key|name|id|value|price|text/i.test(lines[i]);
            if (looksLikeHeader) continue;
        }

        if (cols.length > keyIdx) {
            var key = trim(cols[keyIdx]);
            var val = (cols.length > valIdx) ? trim(cols[valIdx]) : "";
            if (key !== "") map[key] = val;
        }
    }
    return map;
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
function exportPdf(doc, outFile) {
    var opts = new PDFSaveOptions();
    opts.PDFStandard = PDFStandard.NONE;
    opts.preserveEditing = false;
    opts.embedColorProfile = true;
    opts.view = false;
    doc.saveAs(outFile, opts, true, Extension.LOWERCASE);
}

function exportPng(doc, outFile) {
    // Work on a flattened duplicate so the original stays intact.
    var dup = doc.duplicate();
    dup.flatten();
    var longest = Math.max(dup.width.as("px"), dup.height.as("px"));
    if (longest > PNG_MAX_PX) {
        var scale = (PNG_MAX_PX / longest) * 100;
        dup.resizeImage(UnitValue(scale, "%"), null, null, ResampleMethod.BICUBICSHARPER);
    }
    var opts = new PNGSaveOptions();
    opts.compression = 6;
    dup.saveAs(outFile, opts, true, Extension.LOWERCASE);
    dup.close(SaveOptions.DONOTSAVECHANGES);
}

main();

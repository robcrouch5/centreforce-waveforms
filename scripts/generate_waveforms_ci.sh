<?php
/*
 * admin/import_friends.php — ONE-TIME importer.
 * Crawls the old centreforceradio.com "Friends" listing + every detail page and
 * imports each friend (name, logo, website, description, address, phone) into the
 * `friends` table, downloading logos into admin/uploads/friends/. Idempotent:
 * re-running skips friends already imported (matched by name).
 *
 * USAGE: set $ENABLE_IMPORT = true, load the page (it may take ~1 min for 54
 * pages), then DELETE this file.
 */

$ENABLE_IMPORT = true;   // <-- set true to run, then delete this file
@set_time_limit(300);

require 'config.php';                       // $pdo
if (session_status() === PHP_SESSION_NONE) session_start();
if (!isset($_SESSION['admin_logged_in'])) { header('Location: login.php'); exit; }

if (!$ENABLE_IMPORT) {
    http_response_code(403);
    exit('Importer disabled. Edit import_friends.php and set $ENABLE_IMPORT = true to run it, then delete the file.');
}

$LISTING = 'https://www.centreforceradio.com/friends/';
$dir = 'uploads/friends/';
if (!is_dir($dir)) @mkdir($dir, 0775, true);

function fetch_url($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 20, CURLOPT_FOLLOWLOCATION => true, CURLOPT_USERAGENT => 'Mozilla/5.0']);
        $data = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ($data !== false && $code === 200) ? $data : false;
    }
    return @file_get_contents($url);
}

/* ---- 1. Collect detail-page URLs from the listing ---- */
$listingHtml = fetch_url($LISTING);
$detailUrls = [];
if ($listingHtml && preg_match_all('~href="(https://www\.centreforceradio\.com/friends/[^"#/]+/)"~', $listingHtml, $m)) {
    $detailUrls = array_values(array_unique($m[1]));
}

// Which friends are "Station Partners" (vs Sponsors) — split by the listing headings.
$partnerUrls = [];
$pp = $listingHtml ? stripos($listingHtml, 'Station Partners') : false;
$sp = $listingHtml ? stripos($listingHtml, 'Station Sponsors') : false;
if ($pp !== false && $sp !== false && $sp > $pp) {
    if (preg_match_all('~href="(https://www\.centreforceradio\.com/friends/[^"#/]+/)"~', substr($listingHtml, $pp, $sp - $pp), $pm)) {
        $partnerUrls = array_flip(array_unique($pm[1]));
    }
}

/* ---- helpers ---- */
$CHROME_IMG = '~(CFMainlogo|cropped-883|Social-Share|883-v2|sload)~i';
$CHROME_DOM = '~(centreforceradio|assets\.player\.radio|gmpg\.org|w3\.org|schema\.org|google|facebook|sowebdesigns|kick\.com|gravatar|wordpress|googletagmanager|fonts\.|radioplayer)~i';

function clean_text($s) {
    return trim(html_entity_decode(strip_tags($s), ENT_QUOTES, 'UTF-8'));
}

$done = []; $failed = [];
$sort = (int) ($pdo->query("SELECT COALESCE(MAX(sort_order),0) FROM friends")->fetchColumn());
$check = $pdo->prepare("SELECT id FROM friends WHERE name = ?");

foreach ($detailUrls as $url) {
    $html = fetch_url($url);
    if (!$html) { $failed[] = $url; continue; }

    // Name from og:title (strip the site suffix).
    $name = '';
    if (preg_match('~<meta property="og:title" content="([^"]+)"~', $html, $mt)) {
        $name = clean_text($mt[1]);
        $name = preg_replace('~\s*[-–]\s*Centreforce Radio.*$~i', '', $name);
    }
    if ($name === '') { $failed[] = $url; continue; }

    $category = isset($partnerUrls[$url]) ? 'partner' : 'sponsor';

    $check->execute([$name]);
    $existingId = $check->fetchColumn();
    if ($existingId) {
        // Already imported — just ensure the category is correct, don't re-download.
        $pdo->prepare("UPDATE friends SET category=? WHERE id=?")->execute([$category, (int) $existingId]);
        continue;
    }

    // Logo: first uploads image that isn't site chrome (use full-size).
    $logoUrl = '';
    if (preg_match_all('~https://www\.centreforceradio\.com/wp-content/uploads/[^"\' )]+\.(?:png|jpe?g|webp)~i', $html, $mi)) {
        foreach ($mi[0] as $img) {
            if (preg_match($CHROME_IMG, $img)) continue;
            $logoUrl = preg_replace('~-\d+x\d+(\.(?:png|jpe?g|webp))$~i', '$1', $img); // full-size
            break;
        }
    }

    // Website: first external link that isn't site chrome.
    $website = '';
    if (preg_match_all('~href="(https?://[^"]+)"~', $html, $ml)) {
        foreach ($ml[1] as $href) {
            if (!preg_match($CHROME_DOM, $href)) { $website = $href; break; }
        }
    }

    // Text-only <p> blocks = description paragraphs + (address) + (phone), in order.
    $paras = [];
    if (preg_match_all('~<p>([^<]{4,})</p>~', $html, $mp)) {
        foreach ($mp[1] as $p) { $paras[] = clean_text($p); }
    }
    $phone = ''; $address = '';
    // phone = a paragraph that's mostly digits / phone punctuation
    foreach ($paras as $k => $p) {
        if (preg_match('~^[\d \-\+\(\)]{9,18}$~', $p)) { $phone = $p; unset($paras[$k]); break; }
    }
    // address = a paragraph containing a UK postcode
    foreach ($paras as $k => $p) {
        if (preg_match('~[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}~i', $p)) { $address = $p; unset($paras[$k]); break; }
    }
    $description = trim(implode("\n\n", array_values($paras)));

    // Download logo.
    $fname = preg_replace('/[^a-z0-9]+/', '-', strtolower($name)) . '.jpg';
    if ($logoUrl) {
        $img = fetch_url($logoUrl);
        if ($img !== false && strlen($img) > 200) { @file_put_contents($dir . $fname, $img); }
        else { $fname = ''; }
    } else { $fname = ''; }

    $sort++;
    $pdo->prepare("INSERT INTO friends (name, image, link_url, description, address, phone, category, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)")
        ->execute([$name, $fname, $website, $description, $address, $phone, $category, $sort]);
    $done[] = $name;
}

function h($v){ return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
?>
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Import Friends</title>
<link rel="stylesheet" href="assets/style.css"></head>
<body class="admin-auth-page">
<div class="login-box" style="max-width:620px;text-align:left">
  <h2>Friends import complete</h2>
  <p style="color:#6ef6d4">Detail pages found: <?= count($detailUrls) ?> · Imported: <?= count($done) ?> · Failed: <?= count($failed) ?></p>
  <?php if ($done): ?><p style="color:#cfd8e0;font-size:13px;line-height:1.6"><strong>Added:</strong> <?= h(implode(', ', $done)) ?></p><?php endif; ?>
  <?php if ($failed): ?><p style="color:#ffc9c9;font-size:12px;line-height:1.6"><strong>Failed:</strong> <?= h(implode('  ', $failed)) ?></p><?php endif; ?>
  <ol style="color:#cfd8e0;font-size:14px;line-height:1.7">
    <li>Review descriptions / logos / links in <a href="manage_friends.php" style="color:#00cae7">Manage Friends</a> (the scrape is best-effort — tidy any stragglers).</li>
    <li><strong>Delete this file (admin/import_friends.php)</strong>.</li>
  </ol>
</div>
</body></html>

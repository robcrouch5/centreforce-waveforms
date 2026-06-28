#!/usr/bin/env bash
#
# Generate Centreforce show waveforms in CI and upload them to the web host.
#
# Stateless + idempotent: for every listen-back recording it HEAD-checks whether
# the peaks JSON already exists on the site, and only generates/uploads new ones.
#
# Required env (GitHub Secrets/Variables — see docs/waveforms-github-action.md):
#   FTP_HOST, FTP_USER, FTP_PASS, FTP_REMOTE_DIR  (secrets)
# Optional:
#   SITE_BASE     defaults to the current live site
#   FTP_PROTOCOL  sftp (default here) | ftp | ftps
#   FTP_PORT      defaults to 22 (sftp) — set if your host uses another
#   FTP_SSL       true|false  (ftps only)

set -uo pipefail

SITE_BASE="${SITE_BASE:-https://robcrouch.com/portableradio}"
FTP_PROTOCOL="${FTP_PROTOCOL:-sftp}"
FTP_PORT="${FTP_PORT:-22}"
: "${FTP_HOST:?Set FTP_HOST}"
: "${FTP_USER:?Set FTP_USER}"
: "${FTP_PASS:?Set FTP_PASS}"
: "${FTP_REMOTE_DIR:?Set FTP_REMOTE_DIR}"

# Clean the host: strip any scheme, any path, and all whitespace/newlines.
HOST="$(printf '%s' "$FTP_HOST" | tr -d '[:space:]' | sed -E 's#^[a-zA-Z][a-zA-Z0-9+.-]*://##; s#/.*$##')"
echo "Upload target  raw=[$FTP_HOST]  cleaned=[$HOST]  protocol=$FTP_PROTOCOL  port=$FTP_PORT"
if getent hosts "$HOST" >/dev/null 2>&1; then echo "DNS: $HOST resolves OK"; else echo "DNS: WARNING — could not resolve [$HOST]"; fi

API="${SITE_BASE%/}/api/listen-back.php?limit=500"
WAVE_BASE="${SITE_BASE%/}/waveforms"

urldecode() { local s="${1//+/ }"; printf '%b' "${s//%/\\x}"; }

upload() { # $1 = local file, $2 = remote filename
  # Use lftp for EVERY protocol (incl. sftp). lftp does password auth reliably —
  # exactly like the working deploy.sh — whereas sshpass+sftp was failing on the
  # CI runner with "Permission denied (publickey,password)".
  lftp -u "$FTP_USER,$FTP_PASS" "$FTP_PROTOCOL://$HOST:$FTP_PORT" <<EOF
set sftp:auto-confirm yes
set net:timeout 30
set net:max-retries 2
set ftp:ssl-allow ${FTP_SSL:-false}
set ssl:verify-certificate no
mkdir -f -p "$FTP_REMOTE_DIR"
cd "$FTP_REMOTE_DIR"
put "$1" -o "$2"
bye
EOF
}

echo "Fetching recordings: $API"
# Browser-like UA + Accept header so the host's WAF/bot filter doesn't reject us
# with a 415, plus retries so an occasional challenge self-heals.
curl -fsS --retry 5 --retry-delay 4 --retry-all-errors \
  -A "Mozilla/5.0 (compatible; CentreforceWaveformBot/1.0)" \
  -H "Accept: application/json" \
  "$API" -o /tmp/lb.json || { echo "❌ API fetch failed"; exit 1; }

mapfile -t URLS < <(grep -oE '"recording_link":"[^"]+"' /tmp/lb.json \
  | sed 's/^"recording_link":"//; s/"$//; s#\\/#/#g' | sort -u)

total=${#URLS[@]}
echo "Found $total recordings"
gen=0; skip=0; fail=0; i=0

for url in "${URLS[@]}"; do
  i=$((i+1))
  enc="${url##*/}"
  name="$(urldecode "$enc")"
  code=$(curl -s -o /dev/null -w '%{http_code}' -I "$WAVE_BASE/$enc.json")
  if [ "$code" = "200" ]; then skip=$((skip+1)); continue; fi
  echo "[$i/$total] generating: $name"
  if ! curl -fsSL --retry 4 --retry-delay 3 --retry-all-errors -A "Mozilla/5.0 (compatible; CentreforceWaveformBot/1.0)" "$url" -o /tmp/cf.mp3; then
    echo "  ❌ download failed"; fail=$((fail+1)); continue
  fi
  if ! audiowaveform -i /tmp/cf.mp3 -o "/tmp/$name.json" --pixels-per-second 8 -b 8 >/dev/null 2>&1; then
    echo "  ❌ audiowaveform failed"; fail=$((fail+1)); rm -f /tmp/cf.mp3; continue
  fi
  rm -f /tmp/cf.mp3
  if upload "/tmp/$name.json" "$name.json"; then
    echo "  ✅ uploaded"; gen=$((gen+1))
  else
    echo "  ❌ upload failed"; fail=$((fail+1))
  fi
  rm -f "/tmp/$name.json"
done

echo "Done: generated=$gen skipped=$skip failed=$fail (of $total)"
# A few unreadable / missing / odd-named recordings must NOT fail the whole
# scheduled, idempotent run. But if we generated NOTHING and something failed,
# that's systemic (e.g. uploads broken) — surface it.
if [ "$gen" -eq 0 ] && [ "$fail" -gt 0 ]; then
  echo "❌ Generated nothing and $fail failed — systemic problem (upload / host / API)."
  exit 1
fi
echo "✅ Run completed (any per-file failures will retry next run)."
exit 0

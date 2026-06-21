#!/usr/bin/env bash
#
# Generate Centreforce show waveforms in CI and upload them to the web host.
#
# Runs on a GitHub Actions Ubuntu runner (audiowaveform installed via apt).
# Stateless + idempotent: for every listen-back recording it HEAD-checks whether
# the peaks JSON already exists on the site, and only generates/uploads new ones.
# So most runs do nothing and finish in ~1 minute.
#
# Required env (set as GitHub Secrets/Variables — see docs/waveforms-github-action.md):
#   FTP_HOST        host only, e.g. robcrouch.com   (secret)
#   FTP_USER        FTP/SFTP username                (secret)
#   FTP_PASS        FTP/SFTP password                (secret)
#   FTP_REMOTE_DIR  path to the waveforms folder on the host, relative to the
#                   FTP login root, e.g. portableradio/waveforms   (secret)
# Optional:
#   SITE_BASE       defaults to the current live site
#   FTP_PROTOCOL    ftp (default) | ftps | sftp
#   FTP_SSL         true|false  (FTPS only; default false)

set -uo pipefail

SITE_BASE="${SITE_BASE:-https://robcrouch.com/portableradio}"
FTP_PROTOCOL="${FTP_PROTOCOL:-ftp}"
: "${FTP_HOST:?Set FTP_HOST}"
: "${FTP_USER:?Set FTP_USER}"
: "${FTP_PASS:?Set FTP_PASS}"
: "${FTP_REMOTE_DIR:?Set FTP_REMOTE_DIR}"

API="${SITE_BASE%/}/api/listen-back.php?limit=500"
WAVE_BASE="${SITE_BASE%/}/waveforms"

urldecode() { local s="${1//+/ }"; printf '%b' "${s//%/\\x}"; }

upload() { # $1 = local file, $2 = remote filename
  lftp -u "$FTP_USER,$FTP_PASS" "$FTP_PROTOCOL://$FTP_HOST" <<EOF
set net:timeout 30
set net:max-retries 2
set ftp:ssl-allow ${FTP_SSL:-false}
set ssl:verify-certificate no
set sftp:auto-confirm yes
mkdir -f -p "$FTP_REMOTE_DIR"
cd "$FTP_REMOTE_DIR"
put "$1" -o "$2"
bye
EOF
}

echo "Fetching recordings: $API"
curl -fsS "$API" -o /tmp/lb.json || { echo "❌ API fetch failed"; exit 1; }

mapfile -t URLS < <(grep -oE '"recording_link":"[^"]+"' /tmp/lb.json \
  | sed 's/^"recording_link":"//; s/"$//; s#\\/#/#g' | sort -u)

total=${#URLS[@]}
echo "Found $total recordings"
gen=0; skip=0; fail=0; i=0

for url in "${URLS[@]}"; do
  i=$((i+1))
  enc="${url##*/}"                       # percent-encoded basename
  name="$(urldecode "$enc")"             # real filename (spaces/& etc.)
  code=$(curl -s -o /dev/null -w '%{http_code}' -I "$WAVE_BASE/$enc.json")
  if [ "$code" = "200" ]; then
    skip=$((skip+1)); continue
  fi
  echo "[$i/$total] generating: $name"
  if ! curl -fsSL "$url" -o /tmp/cf.mp3; then
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
[ "$fail" -gt 0 ] && exit 1 || exit 0

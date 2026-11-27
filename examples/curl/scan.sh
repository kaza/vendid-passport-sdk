#!/bin/sh
# Read the MRZ of a passport or ID card image with the VendID MRZ API.
#
#   export VENDID_API_KEY=vid_...        # free key: https://vend-id.com/sdk#get-key
#   ./scan.sh                            # reads the ICAO specimen next to this folder
#   ./scan.sh path/to/passport.jpg       # or your own image (JPEG, PNG or WebP, max 10 MB)
#
# Prints the JSON answer. Exits 1 if the read failed (HTTP 4xx/5xx), with the error JSON on stdout.
set -eu

: "${VENDID_API_KEY:?Set VENDID_API_KEY first. Free key: https://vend-id.com/sdk#get-key}"
IMAGE="${1:-$(dirname "$0")/../specimen.jpg}"

curl --silent --show-error --fail-with-body \
  https://vend-id.com/v1/mrz \
  -H "Authorization: Bearer $VENDID_API_KEY" \
  -F "image=@$IMAGE"
echo

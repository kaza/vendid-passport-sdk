"""Read the MRZ of a passport or ID card image with the VendID MRZ API. Python 3.8+, standard library only.

    export VENDID_API_KEY=vid_...          # free key: https://vend-id.com/sdk#get-key
    python3 scan.py                        # reads the ICAO specimen in ../specimen.jpg
    python3 scan.py path/to/passport.jpg   # or your own image (JPEG, PNG or WebP, max 10 MB)
"""
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

API = "https://vend-id.com/v1/mrz"

key = os.environ.get("VENDID_API_KEY")
if not key:
    sys.exit("Set VENDID_API_KEY first. Free key: https://vend-id.com/sdk#get-key")

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent.parent / "specimen.jpg"
content_type = mimetypes.guess_type(path.name)[0] or "image/jpeg"

# The image goes as the raw request body; multipart field "image" works too (see README).
req = urllib.request.Request(
    API,
    data=path.read_bytes(),
    method="POST",
    headers={"Authorization": f"Bearer {key}", "Content-Type": content_type, "User-Agent": "vendid-example/1.0"},
)
try:
    with urllib.request.urlopen(req, timeout=60) as res:
        body = json.load(res)
except urllib.error.HTTPError as err:
    # 422: read but no valid MRZ (no_document | no_mrz | blurry | check_digits). 401: key. 429: quota. 502: retry.
    body = json.load(err)
    print(json.dumps(body, indent=2))
    sys.exit(f"HTTP {err.code}: {body.get('error')}")

print(json.dumps(body, indent=2))
print(f"\n{body['surname']}, {body['given_names']} · {body['document_number']} · born {body['birth_date']} · {body['ms']} ms",
      file=sys.stderr)

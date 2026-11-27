# Python

Python 3.8 or newer, standard library only.

```sh
export VENDID_API_KEY=vid_...            # free key: https://vend-id.com/sdk#get-key
python3 scan.py                          # the ICAO specimen in ../specimen.jpg
python3 scan.py ~/Desktop/passport.jpg   # your own image
```

The JSON answer goes to stdout, a one-line summary to stderr. A failed read exits with code 1.

With [`requests`](https://pypi.org/project/requests/) the same call is:

```python
import os, requests

r = requests.post(
    "https://vend-id.com/v1/mrz",
    headers={"Authorization": f"Bearer {os.environ['VENDID_API_KEY']}"},
    files={"image": open("passport.jpg", "rb")},
)
print(r.status_code, r.json())
```

Answer and error codes: [docs/api.md](../../docs/api.md).

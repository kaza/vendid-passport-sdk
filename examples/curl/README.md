# curl

```sh
export VENDID_API_KEY=vid_...            # free key: https://vend-id.com/sdk#get-key
./scan.sh                                # the ICAO specimen in ../specimen.jpg
./scan.sh ~/Desktop/passport.jpg         # your own image
```

`scan.sh` is one `curl` call. Written out:

```sh
curl https://vend-id.com/v1/mrz \
  -H "Authorization: Bearer $VENDID_API_KEY" \
  -F "image=@../specimen.jpg"
```

The image can also go as the raw body:

```sh
curl https://vend-id.com/v1/mrz \
  -H "Authorization: Bearer $VENDID_API_KEY" \
  -H "Content-Type: image/jpeg" \
  --data-binary @../specimen.jpg
```

Pipe into [`jq`](https://jqlang.github.io/jq/) to pick fields:

```sh
./scan.sh | jq -r '.surname + ", " + .given_names + " · " + .document_number'
# ERIKSSON, ANNA MARIA · L898902C3
```

Answer and error codes: [docs/api.md](../../docs/api.md).

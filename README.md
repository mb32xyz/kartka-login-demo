# KAuth demo app

## How to run locally

1. Open `nginx/certs` folder and generate TLS certificates:
    ```
    openssl ecparam -name prime256v1 -genkey -noout -out demo.key
    openssl req -new -key demo.key -out demo.csr -subj "/CN=localhost/C=by"
    openssl x509 -req -in demo.csr -signkey demo.key -out demo.crt -days 365
    ```
1. Create `.env` file using `example.env`. You want to change at least `COOKIE_SESSION_SECRET`,
`OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`, and `MASTER_KEY`.
1. `docker compose up -d --build`

## How to run on server

The same as above, but:
1. don't generate cert, but use properly signed (or CF provided) files, put them somewhere and update 
`CERTIFICATE_FILE`, `PRIVATE_KEY_FILE` env vars.
1. Change `PUBLIC_IP` and  `OAUTH2_CALLBACK_URL` to reflect your real values.

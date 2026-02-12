# ForoFoos — SMTP & Email troubleshooting

This project supports sending verification emails on user registration. Below are common issues and how to resolve them.

## Troubleshooting `self-signed certificate in certificate chain`

Cause: the SMTP server presents a certificate that is not signed by a CA trusted by Node (commonly in local/dev setups using self-signed certs).

Options to fix (choose one):

1) Development quick fix (INSECURE - **only** for dev)

- In your `.env` set:

  ```env
  SMTP_ALLOW_INSECURE=true
  ```

- Restart the app (`node server.js`).

2) Preferred dev fix: add CA to Node trust

- Save the CA certificate (PEM) to a safe location e.g. `C:\ca\my-ca.pem` or `/home/user/ca.pem`.
- Start node with the extra CA loaded:

  - Windows PowerShell:
    ```powershell
    $env:NODE_EXTRA_CA_CERTS='C:\\path\\to\\ca.pem'; node server.js
    ```

  - Linux / macOS:
    ```bash
    NODE_EXTRA_CA_CERTS=/path/to/ca.pem node server.js
    ```

3) Production: use a trusted SMTP provider

- Configure SMTP using a provider like SendGrid, Amazon SES, or any SMTP server with certificates signed by a trusted CA.
- Do not set `SMTP_ALLOW_INSECURE=true` in production.

## Quick test utility

Run the included test script to validate email sending:

```bash
node scripts/test-mail.js
```

This script will print helpful hints if a self-signed certificate error occurs.

---

If you want, I can add automated checks to fail the server startup when SMTP is misconfigured in production mode. Want me to add that? (Y/N)
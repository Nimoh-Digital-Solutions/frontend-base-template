---
"@nimoh-digital-solutions/tast-utils": patch
---

Fix 415 error when uploading files via FormData.

The HTTP client was unconditionally setting `Content-Type: application/json` on every request and passing the body through `JSON.stringify`, which overwrote the browser's automatic `multipart/form-data; boundary=...` header and corrupted the payload for any `FormData` body.

When the body is a `FormData` instance the `Content-Type` header is now omitted entirely (so the browser sets the correct boundary), and the body is passed through to `fetch` directly rather than being JSON-serialised.

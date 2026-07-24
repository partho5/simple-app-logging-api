# Simple Logging API (Vercel + Supabase)

A minimal logging server. Applications POST log entries in, and
`/public/show-logs.html` displays them.

```
POST /logging/create
Header: x-api-key: <LOG_API_KEY>
Body:   { "identifier_code": "my-app", "log": { "level": "info", "msg": "hello" } }

-> 201 { "ok": true, "log": { "id": 1, "identifier_code": "my-app", "log": "...", "timestamp": "..." } }
```

```
GET /logging/show?identifier_code=my-app&limit=100

-> 200 { "logs": [ { "id": 1, "identifier_code": "my-app", "log": "...", "timestamp": "..." }, ... ] }
```

```
GET /api/app-version?platform=android&current_version_code=4

-> 200 {
  "latest_version_code": 6,
  "latest_version_name": "1.2.0",
  "min_supported_version_code": 3,
  "apk_url": "https://...",
  "changelog": "Bug fixes and improvements",
  "force_update": false
}
```

## One-time setup

1. **Create a Supabase project** at https://supabase.com.

2. **Create the `logs` table** — run this in the Supabase SQL editor:
   ```sql
   create table logs (
     id bigint generated always as identity primary key,
     identifier_code text not null,
     log text not null,
     timestamp timestamptz not null default now()
   );

   create index logs_identifier_code_idx on logs (identifier_code);
   ```

3. **Set environment variables** (in `.env` for local dev, and in Vercel
   Project Settings → Environment Variables for deployment):
   - `SUPABASE_URL` — your project URL, e.g. `https://xxxx.supabase.co`
   - `SUPABASE_KEY` — a service role or anon key with insert/select on `logs`
   - `LOG_API_KEY` — any random secret string, used to protect `/logging/create`

4. **Deploy**
   ```
   vercel deploy --prod
   ```

## Usage

Create a log entry:
```bash
curl -X POST https://your-app.vercel.app/logging/create \
  -H "x-api-key: <LOG_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"identifier_code":"my-app","log":{"level":"info","msg":"hello"}}'
```

Fetch logs:
```bash
curl "https://your-app.vercel.app/logging/show?identifier_code=my-app&limit=50"
```

View logs in a browser: `https://your-app.vercel.app/show-logs.html`

Check app version (e.g. from a mobile client on startup):
```bash
curl "https://your-app.vercel.app/api/app-version?platform=android&current_version_code=4"
```

## Updating the app version config

`/api/app-version` reads from [config/app-version.json](config/app-version.json) — one
object per platform (`android`, `ios`). To ship a new version, edit that file and push:

```json
{
  "android": {
    "latest_version_code": 6,
    "latest_version_name": "1.2.0",
    "min_supported_version_code": 3,
    "apk_url": "https://example.com/downloads/app-v1.2.0.apk",
    "changelog": "Bug fixes and improvements"
  },
  "ios": { "...": "..." }
}
```

- `force_update` in the response is computed automatically:
  `current_version_code < min_supported_version_code`.
- On Vercel, a push to the config file triggers a normal auto-deploy (no manual
  redeploy step) and takes effect in under a minute — no code changes needed.
- There's no database or admin UI for this; it's just a committed JSON file.
  If you need true zero-deploy updates later, look at Vercel Edge Config.

## Notes

- `log` is stored as a JSON string (the `create` endpoint stringifies
  objects automatically; strings are stored as-is).
- `/logging/show` is unauthenticated by default — add your own protection
  if the logs are sensitive.

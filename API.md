# API Reference

Base URL: `https://your-app.vercel.app` (or `http://localhost:<PORT>` for local dev).

All responses are JSON. Errors follow the same shape everywhere:

```json
{ "error": "<message>" }
```

Endpoints marked **Auth: required** must include:

```
x-api-key: <LOG_API_KEY>
```

---

## POST /logging/create

Insert a log entry for an app, identified by `identifier_code`.

**Auth:** required (`x-api-key`)

**Body**
| Field             | Type          | Required | Notes                                  |
|-------------------|---------------|----------|-----------------------------------------|
| `identifier_code` | string        | yes      | Which app/service the log belongs to    |
| `log`              | string or any | yes      | Stored as-is if a string, else JSON-stringified |

**Response** `201`
```json
{
  "ok": true,
  "log": { "id": 1, "identifier_code": "my-app", "log": "...", "timestamp": "2026-07-24T12:00:00Z" }
}
```

**Errors**
| Status | Cause                                  |
|--------|------------------------------------------|
| 400    | Missing `identifier_code` or `log`        |
| 401    | Missing/incorrect `x-api-key`             |
| 405    | Method other than POST                    |
| 500    | Supabase insert failed / misconfigured    |

**Example**
```bash
curl -X POST https://your-app.vercel.app/logging/create \
  -H "x-api-key: <LOG_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"identifier_code":"my-app","log":{"level":"info","msg":"hello"}}'
```

Implementation: [api/logging-create.js](api/logging-create.js) · Storage: [api/supabase.js](api/supabase.js) (Supabase `logs` table).

---

## GET /logging/show

Fetch recent log entries, optionally filtered by app.

**Auth:** none (unauthenticated — add your own protection if logs are sensitive)

**Query params**
| Param             | Type   | Required | Notes                                  |
|-------------------|--------|----------|------------------------------------------|
| `identifier_code` | string | no       | Filter to one app; omit for all apps      |
| `limit`           | int    | no       | Default 100, max 500                      |

**Response** `200`
```json
{ "logs": [ { "id": 1, "identifier_code": "my-app", "log": "...", "timestamp": "..." } ] }
```

**Errors**
| Status | Cause                                  |
|--------|------------------------------------------|
| 405    | Method other than GET                     |
| 500    | Supabase fetch failed / misconfigured     |

**Example**
```bash
curl "https://your-app.vercel.app/logging/show?identifier_code=my-app&limit=50"
```

Implementation: [api/logging-show.js](api/logging-show.js) · Storage: [api/supabase.js](api/supabase.js) (Supabase `logs` table).

---

## GET /api/app-version

Check whether a newer app version is available, and whether the client's
current version has fallen below the minimum supported version (force update).

**Auth:** none (public — safe for an app to call on every startup)

**Query params**
| Param                  | Type   | Required | Notes                        |
|------------------------|--------|----------|-------------------------------|
| `platform`             | string | yes      | `android` or `ios`             |
| `current_version_code` | int    | yes      | The calling app's own version code |

**Response** `200`
```json
{
  "latest_version_code": 6,
  "latest_version_name": "1.2.0",
  "min_supported_version_code": 3,
  "apk_url": "https://example.com/downloads/app-v1.2.0.apk",
  "changelog": "Bug fixes and improvements",
  "force_update": false
}
```
`force_update` is `true` when `current_version_code < min_supported_version_code`.

**Errors**
| Status | Cause                                              |
|--------|------------------------------------------------------|
| 400    | Missing/invalid `platform` or `current_version_code`  |
| 404    | No config exists for the given `platform`             |
| 405    | Method other than GET                                 |
| 500    | Config file missing/unreadable                        |

**Example**
```bash
curl "https://your-app.vercel.app/api/app-version?platform=android&current_version_code=4"
```

Implementation: [api/app-version.js](api/app-version.js) · Storage: [config/app-version.json](config/app-version.json)
(one object per platform — edit and push to update; no redeploy step or DB needed). See
[README.md](README.md#updating-the-app-version-config) for the update workflow.

---

## Adding a new endpoint

This project follows one convention for every route, so keep new ones consistent:

1. **Handler file** — add `api/<name>.js` exporting `async (req, res) => { ... }`.
   Use `req.method`, `new URL(req.url, "http://localhost")` for query params, and
   `res.status(code).json(obj)` for responses (Vercel provides these on `res` in
   production; [server.js](server.js) polyfills them for local dev).
2. **Routing**:
   - Any file under `api/` is automatically reachable at `/api/<name>` — no extra
     config needed (see [server.js](server.js)'s `/api/` prefix handling and
     `vercel.json`'s `functions` block).
   - If you want a friendlier path (like `/logging/create` instead of
     `/api/logging-create`), add a rewrite in **both** places so local dev and
     production match:
     - `vercel.json` → `rewrites`
     - `server.js` → the manual `if (pathname === ...)` block
3. **Non-JS files your handler reads** (config, templates, etc.) — add their
   directory to `vercel.json` → `functions["api/*.js"].includeFiles`, otherwise
   they won't be bundled into the deployed function.
4. **Auth** — if the endpoint should be protected, check
   `req.headers["x-api-key"] !== process.env.LOG_API_KEY` like `logging-create.js`
   does. Document whether an endpoint is public or protected here.
5. **Document it here** — add a section above following the same template
   (Auth, params/body table, response example, errors table, example curl,
   implementation link).

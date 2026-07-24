// api/logging-create.js
//
// POST /logging/create
// Header:  x-api-key: <LOG_API_KEY>
// Body:    { "identifier_code": "my-app", "log": { ...any JSON... } }
//
// Success: 201 { "ok": true, "log": { id, identifier_code, log, timestamp } }

const { insertLog } = require("./supabase");

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (req.headers["x-api-key"] !== process.env.LOG_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    } else if (!body || typeof body !== "object") {
      try {
        body = await getRequestBody(req);
      } catch (e) {
        body = {};
      }
    }

    const { identifier_code, log } = body;
    if (!identifier_code || log === undefined) {
      res.status(400).json({ error: "identifier_code and log are required" });
      return;
    }

    const saved = await insertLog({
      identifier_code,
      log: typeof log === "string" ? log : JSON.stringify(log),
    });

    res.status(201).json({ ok: true, log: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

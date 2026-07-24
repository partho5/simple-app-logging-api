// api/logging-show.js
//
// GET /logging/show?identifier_code=my-app&limit=50
//
// Success: 200 { "logs": [ { id, identifier_code, log, timestamp }, ... ] }

const { fetchLogs } = require("./supabase");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const parsedUrl = new URL(req.url, "http://localhost");
    const identifier_code = parsedUrl.searchParams.get("identifier_code") || undefined;
    const limitParam = parseInt(parsedUrl.searchParams.get("limit"), 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 100;

    const logs = await fetchLogs({ identifier_code, limit });
    res.status(200).json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

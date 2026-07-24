// api/download-link.js
//
// GET /api/download-link
//
// Success: 200 { url }

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "..", "config", "app-version.json");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load config" });
    return;
  }

  const url = config.android && config.android.apk_url;
  if (!url) {
    res.status(404).json({ error: "Download link not configured" });
    return;
  }

  res.status(200).json({ url });
};

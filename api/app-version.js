// api/app-version.js
//
// GET /api/app-version?platform=android&current_version_code=4
//
// Success: 200 {
//   latest_version_code, latest_version_name, min_supported_version_code,
//   apk_url, changelog, force_update
// }

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "..", "config", "app-version.json");

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const parsedUrl = new URL(req.url, "http://localhost");
  const platform = parsedUrl.searchParams.get("platform");
  const currentVersionCode = parseInt(parsedUrl.searchParams.get("current_version_code"), 10);

  if (platform !== "android" && platform !== "ios") {
    res.status(400).json({ error: "platform must be 'android' or 'ios'" });
    return;
  }
  if (!Number.isFinite(currentVersionCode)) {
    res.status(400).json({ error: "current_version_code must be an integer" });
    return;
  }

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load version config" });
    return;
  }

  const platformConfig = config[platform];
  if (!platformConfig) {
    res.status(404).json({ error: `No version config for platform '${platform}'` });
    return;
  }

  const {
    latest_version_code,
    latest_version_name,
    min_supported_version_code,
    apk_url,
    changelog,
  } = platformConfig;

  res.status(200).json({
    latest_version_code,
    latest_version_name,
    min_supported_version_code,
    apk_url,
    changelog,
    force_update: currentVersionCode < min_supported_version_code,
  });
};

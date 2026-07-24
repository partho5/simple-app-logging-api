// api/supabase.js
// Thin REST client for Supabase's PostgREST API. No SDK dependency.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TABLE_NAME = "logs";

function assertConfigured() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
  }
}

/**
 * Inserts a single row into the logs table.
 */
async function insertLog({ identifier_code, log }) {
  assertConfigured();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify([{ identifier_code, log }]),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase insert failed: ${response.status} ${text}`);
  }

  const rows = await response.json();
  return rows[0];
}

/**
 * Fetches logs, most recent first, optionally filtered by identifier_code.
 */
async function fetchLogs({ identifier_code, limit }) {
  assertConfigured();

  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", "timestamp.desc");
  params.set("limit", String(limit));
  if (identifier_code) {
    params.set("identifier_code", `eq.${identifier_code}`);
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?${params.toString()}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase fetch failed: ${response.status} ${text}`);
  }

  return response.json();
}

module.exports = {
  insertLog,
  fetchLogs,
};

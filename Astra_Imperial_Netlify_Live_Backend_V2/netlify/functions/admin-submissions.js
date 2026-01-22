const { createClient } = require("@supabase/supabase-js");

exports.handler = async () => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing env vars" }) };
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await supabase
      .from("submissions")
      .select("id, created_at, full_name, email, service, score, tier")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ data }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};
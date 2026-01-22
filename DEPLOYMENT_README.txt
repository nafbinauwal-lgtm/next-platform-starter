
ASTRA IMPERIAL LTD — Netlify V2 (Real accounts + Database)

This package is designed to:
1) Work immediately as a static demo (no configuration).
2) Upgrade to LIVE mode with real accounts + database storage using Supabase.

A) QUICK DEPLOY (works immediately)
- Deploy to Netlify (drag & drop or Git).
- The site runs in DEMO mode until you add Supabase keys.

B) ENABLE REAL CLIENT ACCOUNTS + DATABASE (Supabase)
1) Create a Supabase project.
2) In Supabase SQL editor, run: SUPABASE_SCHEMA.sql
3) In Supabase Auth:
   - Enable Email provider
   - Optional: require email confirmation, set redirect URLs to your Netlify domain

4) Edit: website/assets/config.js
   Set SUPABASE_URL and SUPABASE_ANON_KEY.

5) In Netlify Environment variables:
   SUPABASE_URL = your supabase url
   SUPABASE_SERVICE_ROLE_KEY = your service role key (server-only)

C) HOW IT WORKS
- Onboarding form:
  - LIVE: inserts into submissions table; if logged in, ties to user_id.
  - DEMO: stores locally in browser.
- Portal:
  - LIVE: email/password accounts via Supabase Auth.
  - DEMO: admin/Astra2026!

D) CANADA RELOCATION SECTION
- Home page includes "Relocation to Canada"
- Dedicated page: relocation.html

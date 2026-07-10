-- Replace dev/test prospects with 2mb review clients (+ keep MAXAR AG).
-- Workspace: default 2mb workspace. Safe to re-run: deletes non-MAXAR prospects first.

BEGIN;

-- ── 1. Remove all prospects except MAXAR ─────────────────────────────────────
DELETE FROM prospects
WHERE id <> '06ff1a1e-430c-4379-9268-6479945310d1';

-- Orphan accounts (seed/smoke leftovers)
DELETE FROM accounts
WHERE id NOT IN (SELECT account_id FROM prospects);

-- ── 2. Constants ─────────────────────────────────────────────────────────────
-- void / founder
-- a31b57f8-a911-422a-8955-f03ce6df0fd1

-- ── 3. TCHOBAN VOSS Architekten ──────────────────────────────────────────────
INSERT INTO accounts (
  id, workspace_id, name, legal_form, hq_country, hq_city, employees, founded_year,
  website, public_private
) VALUES (
  'a1000001-0001-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'TCHOBAN VOSS Architekten',
  'Partnerschaft',
  'DE',
  'Berlin',
  180,
  1931,
  'https://tchobanvoss.de',
  'private'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  website = EXCLUDED.website,
  employees = EXCLUDED.employees,
  hq_city = EXCLUDED.hq_city,
  updated_at = now();

INSERT INTO prospects (
  id, account_id, workspace_id, owner_id, created_by,
  source, territory, stage, priority, triage_decision
) VALUES (
  'f1000001-0001-4000-8000-000000000001',
  'a1000001-0001-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'a31b57f8-a911-422a-8955-f03ce6df0fd1',
  'a31b57f8-a911-422a-8955-f03ce6df0fd1',
  'referral',
  'DE',
  'dossier_in_progress',
  2,
  'accept'
)
ON CONFLICT (id) DO UPDATE SET stage = EXCLUDED.stage, updated_at = now();

INSERT INTO contacts (
  id, account_id, workspace_id, full_name, role, email, linkedin_url, languages
) VALUES (
  'c1000001-0001-4000-8000-000000000001',
  'a1000001-0001-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Sergei Tchoban',
  'Managing Partner',
  'berlin@tchobanvoss.de',
  NULL,
  ARRAY['de', 'en', 'ru']
)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = now();

UPDATE prospects SET primary_contact_id = 'c1000001-0001-4000-8000-000000000001'
WHERE id = 'f1000001-0001-4000-8000-000000000001';

INSERT INTO triggers (id, account_id, workspace_id, prospect_id, type, source_url, occurred_at, payload)
VALUES (
  'b1000001-0001-4000-8000-000000000001',
  'a1000001-0001-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'f1000001-0001-4000-8000-000000000001',
  'client_review',
  'https://2mb.studio',
  now() - interval '14 days',
  '{"text": "2mb video testimonial — Developers & Interior Designers section (Sergei Tchoban)."}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dossiers (id, prospect_id, status, version, sections)
VALUES (
  'd1000001-0001-4000-8000-000000000001',
  'f1000001-0001-4000-8000-000000000001',
  'draft',
  1,
  $json${
    "snapshot": {
      "hqCity": "Berlin",
      "hqCountry": "DE",
      "employees": 180,
      "foundedYear": 1931,
      "publicPrivate": "private",
      "projectPhase": "Active pipeline: Dockyard Berlin, EDGE Südkreuz, Bauerfeind campus, multiple HOAI phases 1–9",
      "notes": "Offices Hamburg, Berlin, Dresden; 150+ staff, 20+ nationalities. In-house 3D / AI / visualisation capability — potential peer + upsell on premium marketing visuals for landmark schemes."
    },
    "what_they_do": {
      "summary": "Full-service architecture firm for public and private clients in Germany and internationally. Design, planning and delivery across residential, commercial, cultural and urban regeneration — HOAI phases 1–9.",
      "segments": ["Architecture", "Urban planning", "Commercial", "Residential", "Public sector", "DACH"],
      "flagshipOffering": "Large-scale urban projects (Dockyard, Rosenthaler Str. 43–45, Museum for Architectural Drawing)",
      "targetCustomer": "Developers, municipalities, institutional investors"
    },
    "signals": {
      "items": [
        {
          "text": "Dockyard Berlin won Green Good Design Awards 2026.",
          "type": "press",
          "sourceUrl": "https://tchobanvoss.de/en",
          "occurredAt": "2026-01-15"
        },
        {
          "text": "Building corporate campus for Bauerfeind — new major commercial mandate.",
          "type": "press",
          "sourceUrl": "https://tchobanvoss.de/en",
          "occurredAt": "2025-11-01"
        }
      ]
    },
    "decision_makers": {
      "contactIds": ["c1000001-0001-4000-8000-000000000001"],
      "notes": "Sergei Tchoban — Managing Partner Berlin; also heads SPEECH Moscow. Tchoban Foundation / Museum for Architectural Drawing."
    },
    "tech_clues": {
      "siteStack": ["Corporate CMS", "Multilingual DE/EN"],
      "visibleVendors": ["In-house visualisation / 3D / AI"],
      "notes": "Site showcases extensive project photography and render credits; strong visual culture — quality bar high for any external viz partner."
    },
    "competitive": {
      "currentVendors": ["In-house viz team", "External specialist render studios on select competitions"],
      "inHouseTeam": "Multidisciplinary: architecture, interior, visualisation, PM",
      "notes": "Existing 2mb relationship via testimonial — warm account for cross-sell on developer-facing campaign assets."
    },
    "hooks": {
      "items": [
        "Dockyard / Green Good Design momentum — offer campaign-grade stills + film cutdowns aligned with their sustainability narrative.",
        "Bauerfeind campus and other live sites need consistent marketing visuals across HOAI milestones.",
        "Peer credibility: Sergei already endorsed 2mb on site — leverage for intro to their developer clients."
      ]
    },
    "cases": { "items": [{}, {}, {}] },
    "risks": {
      "summary": "Strong in-house visual capability may limit scope to campaign / film layer unless positioned as overflow capacity for peak pipeline.",
      "blockers": ["High internal quality bar", "Complex approval chains on landmark projects"]
    },
    "next_step": {
      "channel": "email",
      "notes": "Warm follow-up referencing published testimonial; propose 30-min sync on Dockyard / pipeline marketing visuals."
    }
  }$json$::jsonb
)
ON CONFLICT (prospect_id) DO UPDATE SET sections = EXCLUDED.sections, updated_at = now();

-- ── 4. tti gruppe ────────────────────────────────────────────────────────────
INSERT INTO accounts (
  id, workspace_id, name, legal_form, hq_country, hq_city, employees, founded_year,
  website, public_private
) VALUES (
  'a1000002-0002-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'tti gruppe',
  'Familienunternehmen',
  'DE',
  'Berlin',
  50,
  2011,
  'https://tti-gruppe.de',
  'private'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, website = EXCLUDED.website, updated_at = now();

INSERT INTO prospects (
  id, account_id, workspace_id, owner_id, created_by,
  source, territory, stage, priority, triage_decision
) VALUES (
  'f1000002-0002-4000-8000-000000000002',
  'a1000002-0002-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'a31b57f8-a911-422a-8955-f03ce6df0fd1',
  'a31b57f8-a911-422a-8955-f03ce6df0fd1',
  'referral',
  'DE',
  'dossier_in_progress',
  2,
  'accept'
)
ON CONFLICT (id) DO UPDATE SET stage = EXCLUDED.stage, updated_at = now();

INSERT INTO contacts (
  id, account_id, workspace_id, full_name, role, email, linkedin_url, languages
) VALUES (
  'c1000002-0002-4000-8000-000000000002',
  'a1000002-0002-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Jan Taschlizki',
  'Geschäftsführer',
  NULL,
  'https://www.linkedin.com/in/jan-taschlizki',
  ARRAY['de']
)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = now();

UPDATE prospects SET primary_contact_id = 'c1000002-0002-4000-8000-000000000002'
WHERE id = 'f1000002-0002-4000-8000-000000000002';

INSERT INTO triggers (id, account_id, workspace_id, prospect_id, type, source_url, occurred_at, payload)
VALUES (
  'b1000002-0002-4000-8000-000000000002',
  'a1000002-0002-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'f1000002-0002-4000-8000-000000000002',
  'client_review',
  'https://2mb.studio',
  now() - interval '21 days',
  '{"text": "2mb video testimonial — Jan Taschlizki, CEO tti gruppe (Developers section)."}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dossiers (id, prospect_id, status, version, sections)
VALUES (
  'd1000002-0002-4000-8000-000000000002',
  'f1000002-0002-4000-8000-000000000002',
  'draft',
  1,
  $json${
    "snapshot": {
      "hqCity": "Berlin",
      "hqCountry": "DE",
      "employees": 50,
      "foundedYear": 2011,
      "publicPrivate": "private",
      "projectPhase": "Active development + Bestand across Berlin & Brandenburg; 40+ group entities",
      "notes": "Family-run developer (Jan & Emil Taschlizki). Portfolio mix Wohnen/Gewerbe, Neubau, Revitalisierung. Strong marketing need for project launches and investor materials."
    },
    "what_they_do": {
      "summary": "Berlin-based family real estate group: acquisition, project development, marketing and asset management. End-to-end from technical planning through Vermarktung — Wohn- and Gewerbeimmobilien.",
      "segments": ["Residential", "Commercial", "Project development", "Asset management", "Berlin", "Brandenburg"],
      "flagshipOffering": "Integrated Projektentwicklung aus einer Hand",
      "targetCustomer": "Owner-occupiers, investors, tenants in Berlin metro"
    },
    "signals": {
      "items": [
        {
          "text": "Public positioning as innovative Familienunternehmen with in-house marketing and technical development.",
          "type": "press",
          "sourceUrl": "https://tti-gruppe.de/ueber-uns/",
          "occurredAt": "2025-12-01"
        }
      ]
    },
    "decision_makers": {
      "contactIds": ["c1000002-0002-4000-8000-000000000002"],
      "notes": "Jan Taschlizki — Geschäftsführer; brother Emil co-founder. Active on LinkedIn / social on deal-making culture."
    },
    "tech_clues": {
      "siteStack": ["WordPress"],
      "visibleVendors": ["In-house Immobilienmarketing"],
      "notes": "Project microsites and image-heavy portfolio; speed of launch matters for their acquisition-driven model."
    },
    "competitive": {
      "currentVendors": ["In-house marketing", "Local render / photo suppliers"],
      "notes": "Existing 2mb testimonial — upsell standardized viz package across parallel projects."
    },
    "hooks": {
      "items": [
        "High deal velocity (quantity over perfection) — offer fast-turnaround viz slots for new acquisitions.",
        "Brand consistency across 40+ entities — one 2mb visual language for all Exposés.",
        "Jan already on camera for 2mb — propose pipeline retainer for 2026 launches."
      ]
    },
    "cases": { "items": [{}, {}, {}] },
    "risks": {
      "blockers": ["Price-sensitive on per-project basis", "May prefer bundled in-house marketing"]
    },
    "next_step": {
      "channel": "linkedin",
      "notes": "DM Jan referencing testimonial; offer sample board for one live Berlin project."
    }
  }$json$::jsonb
)
ON CONFLICT (prospect_id) DO UPDATE SET sections = EXCLUDED.sections, updated_at = now();

-- ── 5. S&P Architektura Krajobrazu ───────────────────────────────────────────
INSERT INTO accounts (
  id, workspace_id, name, legal_form, hq_country, hq_city, employees, founded_year,
  website, public_private
) VALUES (
  'a1000003-0003-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  'S&P Architektura Krajobrazu',
  'Sp. z o.o.',
  'PL',
  'Warsaw',
  25,
  2010,
  'https://sztukaipartnerzy.pl',
  'private'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, website = EXCLUDED.website, updated_at = now();

INSERT INTO prospects (
  id, account_id, workspace_id, owner_id, created_by,
  source, territory, stage, priority, triage_decision
) VALUES (
  'f1000003-0003-4000-8000-000000000003',
  'a1000003-0003-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  'a31b57f8-a911-422a-8955-f03ce6df0fd1',
  'a31b57f8-a911-422a-8955-f03ce6df0fd1',
  'referral',
  'EU_other',
  'dossier_in_progress',
  2,
  'accept'
)
ON CONFLICT (id) DO UPDATE SET stage = EXCLUDED.stage, updated_at = now();

INSERT INTO contacts (
  id, account_id, workspace_id, full_name, role, email, linkedin_url, languages
) VALUES (
  'c1000003-0003-4000-8000-000000000003',
  'a1000003-0003-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  'Mirek Sztuka',
  'Owner / Managing Director',
  NULL,
  'https://www.linkedin.com/in/mirek-sztuka-8a970813',
  ARRAY['pl', 'en', 'ru']
)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = now();

UPDATE prospects SET primary_contact_id = 'c1000003-0003-4000-8000-000000000003'
WHERE id = 'f1000003-0003-4000-8000-000000000003';

INSERT INTO triggers (id, account_id, workspace_id, prospect_id, type, source_url, occurred_at, payload)
VALUES (
  'b1000003-0003-4000-8000-000000000003',
  'a1000003-0003-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  'f1000003-0003-4000-8000-000000000003',
  'client_review',
  'https://2mb.studio',
  now() - interval '10 days',
  '{"text": "2mb video testimonial — Mirek Sztuka, S&P Landscape Architecture."}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dossiers (id, prospect_id, status, version, sections)
VALUES (
  'd1000003-0003-4000-8000-000000000003',
  'f1000003-0003-4000-8000-000000000003',
  'draft',
  1,
  $json${
    "snapshot": {
      "hqCity": "Warsaw",
      "hqCountry": "PL",
      "employees": 25,
      "foundedYear": 2010,
      "publicPrivate": "private",
      "projectPhase": "~25 active projects; expansion Marbella (Essence Residence), Middle East, Russia/Ekaterinburg office",
      "notes": "Boutique landscape studio with global reach. Climate-resilience and biodiversity focus — visuals must communicate planting maturity and water strategy."
    },
    "what_they_do": {
      "summary": "Landscape architecture and urban strategies for housing, public realm, hospitality and masterplans. Offices Warsaw and Ekaterinburg; projects across PL, EU, Middle East, formerly China/Russia.",
      "segments": ["Landscape architecture", "Master planning", "Public realm", "Hospitality", "Residential"],
      "flagshipOffering": "Integrated landscape planning + detail design for large-scale developments",
      "targetCustomer": "Developers, municipalities, hotel operators"
    },
    "signals": {
      "items": [
        {
          "text": "Essence Residence luxury development Marbella — sustainable water management and climate-resilient planting.",
          "type": "press",
          "sourceUrl": "https://sztukaipartnerzy.pl/en/",
          "occurredAt": "2026-02-01"
        }
      ]
    },
    "decision_makers": {
      "contactIds": ["c1000003-0003-4000-8000-000000000003"],
      "notes": "Mirek Sztuka — founder 2010; 30+ years experience (EDAW/AECOM, RS Architektura Krajobrazu)."
    },
    "tech_clues": {
      "siteStack": ["WordPress", "Multilingual PL/EN"],
      "notes": "Portfolio-heavy site; competition submissions need photoreal seasonal variants."
    },
    "competitive": {
      "currentVendors": ["In-house landscape visuals", "Local CGI on competitions"],
      "notes": "2mb testimonial on site — cross-sell aerial / lifestyle film for masterplans."
    },
    "hooks": {
      "items": [
        "Marbella + Middle East expansion needs consistent hero visuals for investor decks.",
        "Urban biotope / climate narrative aligns with 2mb botanical detail in stills.",
        "Warm intro via existing video testimonial."
      ]
    },
    "cases": { "items": [{}, {}, {}] },
    "risks": {
      "blockers": ["International cashflow / project pauses in RU market", "Landscape-led viz scope differs from architecture exteriors"]
    },
    "next_step": {
      "channel": "email",
      "notes": "Email Mirek (PL/EN) referencing testimonial; attach masterplan still sample."
    }
  }$json$::jsonb
)
ON CONFLICT (prospect_id) DO UPDATE SET sections = EXCLUDED.sections, updated_at = now();

-- ── 6. GONY Architect & Planner P.C. ─────────────────────────────────────────
INSERT INTO accounts (
  id, workspace_id, name, legal_form, hq_country, hq_city, employees, founded_year,
  website, public_private
) VALUES (
  'a1000004-0004-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000001',
  'GONY Architect & Planner P.C.',
  'Professional Corporation',
  'US',
  'Brooklyn, NY',
  12,
  2012,
  'https://gonyarchitect.com',
  'private'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, website = EXCLUDED.website, updated_at = now();

INSERT INTO prospects (
  id, account_id, workspace_id, owner_id, created_by,
  source, territory, stage, priority, triage_decision
) VALUES (
  'f1000004-0004-4000-8000-000000000004',
  'a1000004-0004-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000001',
  'a31b57f8-a911-422a-8955-f03ce6df0fd1',
  'a31b57f8-a911-422a-8955-f03ce6df0fd1',
  'referral',
  'EU_other',
  'dossier_in_progress',
  2,
  'accept'
)
ON CONFLICT (id) DO UPDATE SET stage = EXCLUDED.stage, updated_at = now();

INSERT INTO contacts (
  id, account_id, workspace_id, full_name, role, email, linkedin_url, languages
) VALUES (
  'c1000004-0004-4000-8000-000000000004',
  'a1000004-0004-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000001',
  'Vitaly Ganopolsky, RA',
  'Founder & President',
  NULL,
  NULL,
  ARRAY['en']
)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = now();

UPDATE prospects SET primary_contact_id = 'c1000004-0004-4000-8000-000000000004'
WHERE id = 'f1000004-0004-4000-8000-000000000004';

INSERT INTO triggers (id, account_id, workspace_id, prospect_id, type, source_url, occurred_at, payload)
VALUES (
  'b1000004-0004-4000-8000-000000000004',
  'a1000004-0004-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000001',
  'f1000004-0004-4000-8000-000000000004',
  'client_review',
  'https://2mb.studio',
  now() - interval '7 days',
  '{"text": "2mb video testimonial — Vitaly Ganopolsky RA, GONY Architect & Planner."}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dossiers (id, prospect_id, status, version, sections)
VALUES (
  'd1000004-0004-4000-8000-000000000004',
  'f1000004-0004-4000-8000-000000000004',
  'draft',
  1,
  $json${
    "snapshot": {
      "hqCity": "Brooklyn, NY",
      "hqCountry": "US",
      "employees": 12,
      "foundedYear": 2012,
      "publicPrivate": "private",
      "projectPhase": "Retail, hospitality, early education and adaptive reuse across tri-state + US/EU",
      "notes": "Boutique NYC firm — hands-on CA, zoning expertise. Clients include Philly Pretzel Factory and specialty retail; strong contractor network referrals on site."
    },
    "what_they_do": {
      "summary": "Architectural design, zoning, interior design and construction administration for commercial, hospitality, healthcare and residential clients. Founded 2012; expanded from NYC housing to complex retail / F&B / education.",
      "segments": ["Architecture", "Retail", "Hospitality", "Early education", "Adaptive reuse", "US"],
      "flagshipOffering": "Full-service arch + zoning + CA for NYC metro commercial",
      "targetCustomer": "Retail operators, hospitality groups, education providers, contractors"
    },
    "signals": {
      "items": [
        {
          "text": "Portfolio expansion beyond tri-state to US and Europe per firm website.",
          "type": "press",
          "sourceUrl": "https://gonyarchitect.com/AboutUs.html",
          "occurredAt": "2025-09-01"
        }
      ]
    },
    "decision_makers": {
      "contactIds": ["c1000004-0004-4000-8000-000000000004"],
      "notes": "Vitaly Ganopolsky RA — Pratt + Odessa architecture; ex NYC Transit (Stillwell Terminal Coney Island)."
    },
    "tech_clues": {
      "siteStack": ["Static site"],
      "notes": "Project gallery oriented; client testimonials emphasize code expertise + speed."
    },
    "competitive": {
      "currentVendors": ["Local render freelancers", "Contractor-provided visuals"],
      "notes": "2mb testimonial — offer viz support for franchise rollouts (retail templates)."
    },
    "hooks": {
      "items": [
        "Franchise / retail rollout model needs repeatable 2mb visual kit per prototype store.",
        "Vitaly’s contractor referrals could introduce developer-side leads.",
        "Reference on-site video testimonial for US architecture audience case study."
      ]
    },
    "cases": { "items": [{}, {}, {}] },
    "risks": {
      "blockers": ["US timezone", "Smaller project budgets vs DACH developers"]
    },
    "next_step": {
      "channel": "email",
      "notes": "Email Vitaly — EN — franchise viz template pitch."
    }
  }$json$::jsonb
)
ON CONFLICT (prospect_id) DO UPDATE SET sections = EXCLUDED.sections, updated_at = now();

COMMIT;

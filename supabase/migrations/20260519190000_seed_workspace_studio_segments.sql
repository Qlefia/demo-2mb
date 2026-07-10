-- Seed audience segments from 2mb.studio /solutions/* pages (workspace dev seed).
UPDATE public.workspace_studio_settings
SET
  sales = jsonb_set(
    sales,
    '{segments}',
    $segments$[
      {
        "id": "s2010001-0001-4000-8000-000000000001",
        "title": "Architects",
        "subheader": "Architectural visualization",
        "headline": "From Concept to Icon",
        "subtitle": "Persuasive CGI and cinematic animation that honors your architectural intent.",
        "description": "<p>We translate your blueprints into persuasive visual narratives. Win competitions and secure investment with high-end CGI that respects structure, tectonic logic, and materiality.</p><p>Fluent in CAD, BIM, and construction details. Competition-ready delivery under strict deadlines. Urban context and landscape integration so every submission reads in its real environment.</p>",
        "bannerMode": "image",
        "bannerDataUrl": null,
        "bannerPortraitDataUrl": null,
        "bannerVideoUrl": "",
        "linkedCatalogIds": [
          "b1010001-0001-4000-8000-000000000001",
          "b1010001-0002-4000-8000-000000000002",
          "b1010001-0003-4000-8000-000000000003",
          "b1010001-0004-4000-8000-000000000004",
          "b1010001-0005-4000-8000-000000000005",
          "b1010001-0006-4000-8000-000000000006",
          "b1010001-0007-4000-8000-000000000007",
          "b1010001-0008-4000-8000-000000000008",
          "b1010001-0009-4000-8000-000000000009",
          "b1030001-0001-4000-8000-000000000001"
        ]
      },
      {
        "id": "s2010001-0002-4000-8000-000000000002",
        "title": "Interior Designers",
        "subheader": "Interior visualization",
        "headline": "Your Vision. Flawlessly Executed",
        "subtitle": "A scalable, high-end visualization department without hiring risk.",
        "description": "<p>Focus on design while we handle digital production with absolute reliability. We interpret your intent as design partners, not just technicians executing a brief.</p><p>Physical material calibration, editorial composition, and an internal quality filter so you only see production-ready frames. Zero-management workflow once your aesthetic DNA is aligned.</p>",
        "bannerMode": "image",
        "bannerDataUrl": null,
        "bannerPortraitDataUrl": null,
        "bannerVideoUrl": "",
        "linkedCatalogIds": [
          "b1020001-0001-4000-8000-000000000001",
          "b1020001-0002-4000-8000-000000000002",
          "b1020001-0003-4000-8000-000000000003",
          "b1020001-0004-4000-8000-000000000004",
          "b1020001-0005-4000-8000-000000000005",
          "b1020001-0006-4000-8000-000000000006",
          "b1030001-0001-4000-8000-000000000001",
          "b1050001-0001-4000-8000-000000000001",
          "b1050001-0003-4000-8000-000000000003"
        ]
      },
      {
        "id": "s2010001-0003-4000-8000-000000000003",
        "title": "Developers: Luxury Villas",
        "subheader": "Luxury residential",
        "headline": "Sell the Dream Before It's Built",
        "subtitle": "Emotional narratives that justify premium pricing and secure early buyers.",
        "description": "<p>We create high-value visual assets that drive off-plan sales. Transform blueprints into lifestyle scenarios that make prospects imagine living there before ground is broken.</p><p>Virtual interior design, iconic hero shots, lush landscape integration, and cinematic films aligned with your sales launch calendar.</p>",
        "bannerMode": "image",
        "bannerDataUrl": null,
        "bannerPortraitDataUrl": null,
        "bannerVideoUrl": "",
        "linkedCatalogIds": [
          "b1010001-0001-4000-8000-000000000001",
          "b1010001-0002-4000-8000-000000000002",
          "b1020001-0001-4000-8000-000000000001",
          "b1020001-0003-4000-8000-000000000003",
          "b1020001-0005-4000-8000-000000000005",
          "b1010001-0006-4000-8000-000000000006",
          "b1010001-0007-4000-8000-000000000007",
          "b1030001-0002-4000-8000-000000000002",
          "b1030001-0001-4000-8000-000000000001",
          "b1050001-0001-4000-8000-000000000001",
          "b1030001-0003-4000-8000-000000000003",
          "b1030001-0004-4000-8000-000000000004"
        ]
      },
      {
        "id": "s2010001-0004-4000-8000-000000000004",
        "title": "Developers: Residential Complexes",
        "subheader": "Multi-unit developments",
        "headline": "From Blueprint to Sold-Out Community",
        "subtitle": "Cohesive visuals for lifestyle, scale, and value across the whole neighborhood.",
        "description": "<p>We turn complex masterplans into vibrant living environments. Drive off-plan sales with a strategy that communicates placemaking, amenities, and community life, not only building massing.</p><p>Masterplan and aerial views, amenity highlights, neighborhood atmosphere, and omnichannel assets sized for hoardings, brochures, and digital campaigns.</p>",
        "bannerMode": "image",
        "bannerDataUrl": null,
        "bannerPortraitDataUrl": null,
        "bannerVideoUrl": "",
        "linkedCatalogIds": [
          "b1010001-0004-4000-8000-000000000004",
          "b1010001-0003-4000-8000-000000000003",
          "b1010001-0001-4000-8000-000000000001",
          "b1010001-0007-4000-8000-000000000007",
          "b1020001-0001-4000-8000-000000000001",
          "b1020001-0006-4000-8000-000000000006",
          "b1030001-0001-4000-8000-000000000001",
          "b1050001-0001-4000-8000-000000000001",
          "b1010001-0006-4000-8000-000000000006",
          "b1010001-0009-4000-8000-000000000009"
        ]
      },
      {
        "id": "s2010001-0005-4000-8000-000000000005",
        "title": "Landscape Architects",
        "subheader": "Landscape visualization",
        "headline": "Capturing the Living Landscape",
        "subtitle": "Botanically accurate environments where nature is the protagonist.",
        "description": "<p>We translate planting plans and hardscape designs into immersive scenes that breathe. Species, age, and growth habits follow your schedule and climate zone.</p><p>Seasonal narratives, activated public spaces with realistic activity, and meticulous hardscape and street-furniture detailing at any scale from courtyards to urban forests.</p>",
        "bannerMode": "image",
        "bannerDataUrl": null,
        "bannerPortraitDataUrl": null,
        "bannerVideoUrl": "",
        "linkedCatalogIds": [
          "b1010001-0006-4000-8000-000000000006",
          "b1010001-0004-4000-8000-000000000004",
          "b1010001-0003-4000-8000-000000000003",
          "b1010001-0001-4000-8000-000000000001",
          "b1010001-0009-4000-8000-000000000009",
          "b1050001-0003-4000-8000-000000000003",
          "b1010001-0008-4000-8000-000000000008"
        ]
      },
      {
        "id": "s2010001-0006-4000-8000-000000000006",
        "title": "Furniture Brands",
        "subheader": "Product visualization",
        "headline": "The Perfect Digital Studio",
        "subtitle": "Digital twins indistinguishable from high-end photography.",
        "description": "<p>Skip shipping prototypes and studio rentals. We build hyper-realistic product visuals with total control over lighting, materials, and settings before units leave the factory.</p><p>Every SKU and fabric variation from one 3D model, catalog-consistent angles, tactile materiality, and macro detail that holds up on 4K screens and print.</p>",
        "bannerMode": "image",
        "bannerDataUrl": null,
        "bannerPortraitDataUrl": null,
        "bannerVideoUrl": "",
        "linkedCatalogIds": [
          "b1020001-0004-4000-8000-000000000004",
          "b1050001-0002-4000-8000-000000000002",
          "b1050001-0003-4000-8000-000000000003",
          "b1020001-0001-4000-8000-000000000001",
          "b1030001-0003-4000-8000-000000000003",
          "b1030001-0004-4000-8000-000000000004"
        ]
      }
    ]$segments$::jsonb
  ),
  revision = revision + 1
WHERE workspace_id = '00000000-0000-4000-8000-000000000001';

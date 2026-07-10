-- Seed portfolio works from 2mb.studio case categories (workspace dev seed).
UPDATE public.workspace_studio_settings
SET
  sales = jsonb_set(
    sales,
    '{works}',
    $works$[
  {
    "id": "w3010001-0001-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Beauty Center",
    "subheader": "Luxury",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To deliver conceptual design and a comprehensive visualization package (including 3D renders, animation, and a 360° virtual tour) for the Luxury Beauty Center. The goal was to fuse retro luxury with contemporary elegance, showcasing strategic material choices and a unique design aesthetic to attract potential investors for the commercial space.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1030001-0002-4000-8000-000000000002",
      "b1050001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0002-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Boho Cafe",
    "subheader": "Cozy",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To craft a powerful visual pitch for a new café concept, transforming a scenic location into a compelling, commercially viable project to secure investor funding.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1030001-0002-4000-8000-000000000002",
      "b1030001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0003-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "City Lounge",
    "subheader": "Modern Urban Community Hub",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To create a conceptual design and full visualization package (including 3D animation and an immersive 360° Virtual Tour) for a multifunctional Urban Living Room. The aim was to balance aesthetics with functionality, using biophilic elements and strategic zoning to craft a vibrant community hub and a compelling investment attraction tool for building renovation.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1030001-0002-4000-8000-000000000002",
      "b1050001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0004-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Skyline Penthouse",
    "subheader": "Luxury Above the Clouds",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To partner with an interior designer on a luxury penthouse project, providing photorealistic visualization and 3D animation that would perfectly capture the design's sophisticated atmosphere, its blend of high-end materials, and its seamless connection to the panoramic sea view.</p>",
    "timeline": "3 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1030001-0002-4000-8000-000000000002"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0005-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Coworking Space",
    "subheader": "Conceptual Design & Flow",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To develop a complete conceptual design and visualization package (including a 3D tour and animation) for a 410 m² co-working hub. The core challenge was to overcome a long, narrow floor plan, using strategic, curved spatial planning to maximize workstations while creating an airy, dynamic environment for a young, student-based audience.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1030001-0002-4000-8000-000000000002",
      "b1050001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0006-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Techno-Minimalist Concept Store",
    "subheader": "Retail & Culture Hub",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To challenge traditional retail boundaries by designing a hybrid space that functions as a minimalist store by day and a cultural event hub by night, using innovative lighting and industrial aesthetics.</p>",
    "timeline": "3 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0005-4000-8000-000000000005",
      "b1020001-0001-4000-8000-000000000001",
      "b1030001-0002-4000-8000-000000000002"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0007-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "SPA & Wellness Center",
    "subheader": "Balanced Zoning",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>Transform a 550 m² commercial floor into a multi-zoned holistic fitness facility targeting a youthful, active demographic within a mixed-use complex.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1030001-0002-4000-8000-000000000002",
      "b1050001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0008-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Japandi Aesthetic Apartment",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0009-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Luminous Open-Plan Living",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0010-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Historic Pop-Art Living Space",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0011-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Kids Activity Center",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0012-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Sakura Serenity Cafe",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0013-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Luxe View Penthouse Interior",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1030001-0002-4000-8000-000000000002"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0014-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Entrance Lobby Design",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0015-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Lakeside Villa Private Residence",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Interior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1020001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0016-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Symphony Garden",
    "subheader": "Premium Residences",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Exterior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To visualize a high-end Neoclassical residential complex for a premium developer. The goal was to market a lifestyle of exclusivity and serenity, focusing on the grand architecture and the extensive, private secret garden within the courtyard.</p>",
    "timeline": "3 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0017-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Hillside Villa Community",
    "subheader": "Modern Hillside Living",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Exterior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To visualize a premium community of tiered villas integrated into a scenic landscape. The goal was to demonstrate how the master plan ensures panoramic views and privacy for every residence within the settlement.</p>",
    "timeline": "2 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0018-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Waterfront Redevelopment & Residential Complex",
    "subheader": "Urban Renewal",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Exterior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To visualize a large-scale waterfront redevelopment project. The goal was to demonstrate how a new residential complex and public promenade would revitalize the district and become a city-wide destination.</p>",
    "timeline": "2 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0019-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Cultural Center Concept",
    "subheader": "Visual Research",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Exterior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To develop a complete visual narrative for a bold architectural concept from scratch. This experimental project demonstrates how to package a complex idea for investors and competition juries using atmospheric storytelling.</p>",
    "timeline": "3 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0005-4000-8000-000000000005",
      "b1010001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0020-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Futuristic Urban Skyscraper Concept",
    "subheader": "Iconic City Marker",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Exterior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To transform a bold architectural concept into a compelling visual package for investors. The goal was to demonstrate how this multifunctional skyscraper integrates into the city fabric, becoming a new dominant landmark.</p>",
    "timeline": "3 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0021-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Dubai Townhouses Residential Community",
    "subheader": "Modern Desert Living",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Exterior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To visualize a premium townhouse community in Dubai. The goal was to showcase modern architectural forms, lush landscaping, and a vibrant lifestyle to attract international investors.</p>",
    "timeline": "2 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0022-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Academy Park Renovation",
    "subheader": "Innovative Urban Renewal",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Exterior",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To transform an outdated building in Berlin's technology hub into a vibrant, modern campus for young professionals. The scope included developing multiple façade design concepts, activating the rooftop, and designing private courtyard amenities.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0005-4000-8000-000000000005",
      "b1010001-0006-4000-8000-000000000006",
      "b1010001-0001-4000-8000-000000000001",
      "b1050001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0023-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Grusonwerk Residential",
    "subheader": "Complete Marketing Package",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>The developer commissioned us to create visual content for the Grusonwerk property sales website. To avoid repetition in the catalog we designed unique interiors for twenty-four apartments. The comprehensive package includes exteriors, floor plans, interactive 3D tours, and an animated film.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1020001-0001-4000-8000-000000000001",
      "b1050001-0001-4000-8000-000000000001",
      "b1030001-0002-4000-8000-000000000002"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0024-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Quartier A15 Residential",
    "subheader": "Modern Classic in Berlin",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To create a massive visual presentation package for a residential project in Berlin. The developer required a holistic approach to showcase the property from every angle — from the architectural context to an immersive, fully designed interior experience.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1020001-0001-4000-8000-000000000001",
      "b1050001-0001-4000-8000-000000000001",
      "b1030001-0002-4000-8000-000000000002"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0025-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Luxury Hillside Villa",
    "subheader": "Minimalist Retreat",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To create a comprehensive design concept for a hillside villa intended for sale. The goal was to develop a minimalist yet cozy environment where every element serves a function while highlighting the stunning mountain views.</p>",
    "timeline": "3 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1020001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0026-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Three-Level Luxury Duplex",
    "subheader": "Eastern Elegance",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To create a comprehensive visual marketing package for a typical townhouse unit. The goal was to transform standard floor plans into a premium sales tool, demonstrating a sophisticated Modern Classic lifestyle to prospective buyers through renders and interactive tour.</p>",
    "timeline": "3 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1020001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0027-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Complex of Office and Residential Buildings",
    "subheader": "Urban Oasis",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To create a full package of marketing materials for a new mixed-use development. The challenge was to not only visualize the architecture but to develop attractive interior concepts from scratch to demonstrate the project's full potential to future buyers.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1020001-0001-4000-8000-000000000001",
      "b1050001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0028-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Richter-Gärten",
    "subheader": "Townhouse Community",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To create a comprehensive visual solution for a new townhouse complex. The goal was to transform architectural plans into a tangible product, including facade concept adaptation, photorealistic renders, 3D tours, and cinematic animation.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0005-4000-8000-000000000005",
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0001-4000-8000-000000000001",
      "b1030001-0002-4000-8000-000000000002",
      "b1030001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0029-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Single-Family House with a Pool",
    "subheader": "Scandinavian Minimalism",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To create a comprehensive visual sales package for a developer's website. The goal was to showcase a typical 2-story house layout by developing a soft Scandinavian interior concept tailored for a young family with two children.</p>",
    "timeline": "3 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0005-4000-8000-000000000005",
      "b1020001-0001-4000-8000-000000000001",
      "b1050001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0030-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Urban Harmony Residences",
    "subheader": "Integrated Development",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>To visualize a large-scale waterfront redevelopment project. The goal was to demonstrate how a new residential complex and public promenade would revitalize the district and become a city-wide destination.</p>",
    "timeline": "4 Weeks",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0008-4000-8000-000000000008",
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0031-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Bungalow with Cosy Backyard",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0032-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Sonnengärten",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0033-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Sonnenblick Schafheide",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0034-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Wohnen im Kranichnest",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Complex",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1010001-0001-4000-8000-000000000001",
      "b1020001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0035-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Maxar AG",
    "subheader": "Construction Company",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>Our team paid special attention to safety, professionalism, and environmental responsibility. We developed a visual style that reflects the professionalism and integrity of the company. The color palette combined serious and natural colors to emphasize reliability.</p>",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0001-4000-8000-000000000001",
      "b1040001-0004-4000-8000-000000000004"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "https://maxar-ag.com/",
    "featured": true
  },
  {
    "id": "w3010001-0036-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Sztuka & Partnerzy",
    "subheader": "Landscape Design",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>Sztuka & Partnerzy is a company with a diverse portfolio of projects and a strong team of landscape architects, urban designers, and technical specialists. The website showcases completed projects and provides deeper insight into the company, its values, and its professional approach.</p>",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0001-4000-8000-000000000001",
      "b1040001-0004-4000-8000-000000000004"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0037-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "New Landscape Technologies",
    "subheader": "Landscape Design Company",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>Clean lines, minimalist design, and balanced site compositions convey an image of organization and composure. The project appears structured, reflecting the professionalism and responsibility of the company.</p>",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0001-4000-8000-000000000001",
      "b1040001-0004-4000-8000-000000000004",
      "b1040001-0002-4000-8000-000000000002"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": true
  },
  {
    "id": "w3010001-0038-4000-8000-000000000001",
    "publicationStatus": "published",
    "title": "Immo.dev",
    "subheader": "Platform for Brokers and Developers",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "<p>Immo.dev takes a fresh approach to real estate website design, combining innovative design principles with advanced development techniques.</p>",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0001-4000-8000-000000000001",
      "b1040001-0004-4000-8000-000000000004",
      "b1040001-0002-4000-8000-000000000002"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "https://immo.dev/",
    "featured": true
  },
  {
    "id": "w3010001-0039-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Bederov Group",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0001-4000-8000-000000000001",
      "b1040001-0004-4000-8000-000000000004"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0040-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Echo Studio",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0001-4000-8000-000000000001",
      "b1040001-0004-4000-8000-000000000004"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0041-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Corgi Battle",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0002-4000-8000-000000000002",
      "b1040001-0004-4000-8000-000000000004"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0042-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Swift Swap",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0002-4000-8000-000000000002",
      "b1040001-0004-4000-8000-000000000004"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0043-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Mosa Agency",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0001-4000-8000-000000000001",
      "b1040001-0004-4000-8000-000000000004"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0044-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Am Brandenburger Tor",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0001-4000-8000-000000000001"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0045-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Nova Platform",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0001-4000-8000-000000000001",
      "b1040001-0004-4000-8000-000000000004"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  },
  {
    "id": "w3010001-0046-4000-8000-000000000001",
    "publicationStatus": "draft",
    "title": "Signal Healthcare",
    "subheader": "",
    "headline": "",
    "subtitle": "",
    "categoryLabel": "Branding & Website",
    "clientName": "",
    "locationLabel": "",
    "description": "",
    "taskBody": "",
    "timeline": "",
    "tags": "",
    "linkedCatalogIds": [
      "b1040001-0001-4000-8000-000000000001",
      "b1040001-0004-4000-8000-000000000004"
    ],
    "bannerDataUrl": null,
    "bannerPortraitDataUrl": null,
    "galleryVisualGrid": {
      "sectionTitle": "",
      "rows": []
    },
    "videoUrl": "",
    "caseUrl": "",
    "featured": false
  }
]$works$::jsonb
  ),
  revision = revision + 1
WHERE workspace_id = '00000000-0000-4000-8000-000000000001';

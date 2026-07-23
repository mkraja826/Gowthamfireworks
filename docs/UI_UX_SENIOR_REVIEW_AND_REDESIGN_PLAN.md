# Gowtham Fireworks — Senior UI/UX Review and Redesign Plan

Date: 24 July 2026
Review basis: Current Next.js implementation in `main`, including homepage, global CSS, navigation, catalogue, product cards, cart and admin product workflow. The currently deployed Worker URL was not supplied, so this is a source-level product and UI/UX review rather than a pixel-by-pixel browser screenshot audit.

## Executive assessment

Current UI/UX maturity: **4.5/10**

The application is structurally useful, responsive and technically organised, but the public experience does not yet feel like a trustworthy, high-conversion fireworks catalogue. It feels like a generic dark SaaS or startup landing page describing the platform architecture.

The main problem is not the colour palette alone. The interface prioritises abstract system messaging such as B2C/B2B paths, OTP and owner dashboard architecture instead of the customer’s immediate questions:

- What crackers are available?
- What do they look like?
- What is the price and pack size?
- What offers or minimum requirement apply?
- Is my city serviceable?
- Is this a real Sivakasi factory/seller?
- How quickly can I speak to someone?

The website should be redesigned around real products, real commercial information, real factory evidence and a faster catalogue journey.

## What is working

1. Clear technical separation between Retail and Wholesale.
2. Responsive grid foundation exists.
3. Catalogue, cart, login and admin routes are already structured.
4. Colour variables and reusable components provide a workable implementation base.
5. The enquiry/manual-confirmation wording is safer than a payment-first flow.
6. Admin and public areas are visually separated.

These foundations should be retained. The public visual system, content hierarchy and commerce UX should be rebuilt.

## Critical findings

### 1. The hero communicates internal architecture, not customer value

The right hero panel says “Sivakasi Midnight Festival” and highlights “2 buying paths”, “1 owner dashboard” and “OTP secure access”. These are implementation details. A shopper does not care that the platform has one owner dashboard.

**Impact:** The first screen feels like a software demo, not a fireworks store/factory catalogue.

**Fix:** Replace the panel with authentic product/factory photography or a curated festival-combo visual. The first screen should show:

- real crackers and gift boxes;
- a direct retail catalogue CTA;
- wholesale CTA as secondary;
- verified minimum-order/serviceability information;
- WhatsApp assistance;
- concise enquiry-only clarification.

### 2. Emoji imagery destroys product credibility

Categories and products use emojis such as ✨, 🌋, 🌀 and 🎆. Product cards and detail pages therefore look like placeholders or a school/demo project rather than a commercial catalogue.

**Impact:** Customers cannot assess packaging, brand, size or authenticity. Trust and purchase intent fall immediately.

**Fix:** Use real square product photographs on a clean neutral background. Establish a photo standard:

- 1:1 aspect ratio;
- front-facing box/pack;
- consistent crop and lighting;
- WebP/AVIF delivery;
- 800–1200 px source;
- optional second image showing contents or back label;
- meaningful alt text.

No emoji should remain as final product/category artwork.

### 3. The visual language is generic dark-template styling

The site relies heavily on midnight gradients, gold accents, Georgia headings, glass panels and glowing circles. This combination is common across AI-generated luxury, crypto and event templates. It does not create a distinctive Gowtham identity.

**Impact:** The brand appears manufactured rather than established and local.

**Fix:** Move to a product-led light interface:

- 75–80% warm white/light surfaces;
- deep maroon or navy primarily in header/footer and selected banners;
- saffron/gold as an accent, not the dominant treatment;
- real package colours provide most of the visual energy;
- minimal gradients;
- no decorative circles pretending to be fireworks.

Recommended direction: **Modern Sivakasi Market** — warm, authentic, energetic and highly readable.

### 4. Typography is unbranded and inconsistent

The CSS names Inter but does not load it through `next/font`; many devices will use a system fallback. Georgia is used broadly for large headings and brand text, making the experience feel editorial/old-fashioned rather than modern retail.

**Fix:** Load fonts explicitly with `next/font`.

Recommended pairing:

- UI/body/numbers: **Manrope** or **Inter**;
- selected hero/display headings: **Fraunces** or **DM Serif Display**, used sparingly;
- Tamil later: **Noto Sans Tamil**.

Use tabular numerals for prices, MOQ and stock.

### 5. Public copy contains development placeholders

Examples include statements that the business “is developing a modern retail and wholesale catalogue experience” and that verified history, licences, regions and photographs “will be added”. The catalogue also tells visitors that demo data is being shown.

**Impact:** These statements openly tell customers that the site is unfinished.

**Fix:** Never deploy implementation notes publicly. Until verified data is available, hide the section or use neutral approved copy. Development/staging can show a clearly restricted staging banner, but production must not expose placeholders.

### 6. The homepage is too abstract and too long before commercial proof

Large sections repeat the same pattern: eyebrow, large serif heading, descriptive paragraph, cards. The layout has generous 84 px section padding and several large concept sections before meaningful product/service information.

**Impact:** Users must scroll through brand language before seeing enough products, offers, service locations or proof.

**Fix:** Reorder the homepage for conversion:

1. compact compliance/support strip;
2. focused header with search;
3. product-led hero;
4. quick category rail;
5. festival/family combos;
6. best sellers/new arrivals;
7. verified offer/minimum requirement;
8. serviceability and WhatsApp assistance;
9. retail versus wholesale explanation;
10. factory proof and brands;
11. enquiry process;
12. safety;
13. footer.

Retail/Wholesale cards should not consume the second-largest visual block on the page. Wholesale is important but likely not the primary journey for most public visitors.

### 7. Navigation is overfilled and misses primary commerce actions

The header includes six text navigation links, while search is absent and WhatsApp/contact is not prominent. Login and Cart receive equal emphasis. On mobile, navigation becomes a basic dropdown with no persistent catalogue/cart actions.

The footer also exposes an **Owner Login**, contradicting the approved rule that admin access should not be publicly promoted.

**Fix:**

Desktop header:

- Logo
- Search field
- Categories
- Combo Packs
- Wholesale
- Safety/How to Buy
- WhatsApp
- Account
- Cart

Mobile:

- compact logo;
- visible search;
- WhatsApp icon;
- cart badge;
- menu;
- sticky bottom navigation: Home, Categories, Cart, Requests, Account.

Remove Owner Login from the public footer. `/admin/login` may remain technically reachable but should not be advertised to customers.

### 8. Catalogue filtering is too basic and partially redundant

The page provides both a category select and category chips, but no useful sort, brand filter, availability filter, price filter or mobile filter sheet.

**Fix:**

Desktop:

- persistent search;
- category/brand/availability filters;
- price range only where appropriate;
- sort by recommended, price, name and newest;
- result count;
- clear-all action.

Mobile:

- sticky search bar;
- horizontal category rail;
- Filter and Sort buttons;
- bottom-sheet filters;
- active-filter count.

### 9. Product cards lack the information hierarchy needed for fast comparison

Current cards rely on a large placeholder image, tiny category/brand text and a full-width dark button. The mobile breakpoint changes to one product per row at 430 px, making browsing unnecessarily slow on common phones.

**Fix product card anatomy:**

1. real 1:1 image;
2. small availability/low-sound badge;
3. brand/category;
4. product name, maximum two lines;
5. pack size/unit;
6. selling price, MRP and savings;
7. MOQ/carton only for authorised wholesale;
8. compact Add button or quantity stepper.

Keep a compact two-column mobile grid down to approximately 360 px where readability allows. Use one column only for special wide combo cards.

### 10. Product details need stronger purchase support

The current product detail is a large emoji/placeholder and basic data list.

**Fix:**

- image carousel with thumbnails;
- brand, SKU and category;
- pack size and exact unit;
- selling price, MRP and savings;
- availability/serviceability note;
- quantity stepper;
- sticky mobile “Add to requirement” bar;
- product-specific safety details;
- related products;
- WhatsApp share/help;
- wholesale teaser for business users without leaking wholesale prices.

### 11. Cart is a functional shell, not a reassuring checkout/request journey

The cart correctly uses “Verify phone and continue”, but it lacks progress, delivery/serviceability input, minimum requirement feedback and a summary of what happens next.

**Fix:** Add a simple step indicator:

Cart → Phone → Address → Review → Request submitted

Show:

- minimum requirement progress where applicable;
- city/serviceability check;
- pack and quantity validation;
- clear factory-confirmation message;
- expected contact channel;
- WhatsApp alternative;
- reference number after submission.

### 12. Trust evidence is too weak

The current experience talks about trust but does not visually prove it. The legacy site at least exposes commercial signals such as minimum order, service areas, GST inclusion, offers, brands and contact channels. Only verified/current versions should be migrated.

**Fix:** Use a compact proof strip with verified data:

- Sivakasi factory/direct sourcing;
- GST-inclusive pricing, only if true;
- service regions, only if current;
- factory-confirmed availability;
- real phone/WhatsApp;
- brand logos;
- real factory/warehouse/team photos;
- current price-list date.

Never use unverified claims or fake review counts.

### 13. Accessibility and interaction states are incomplete

Inputs have focus styling, but links/buttons do not consistently show strong keyboard focus. There is no skip link, category emojis may be read by screen readers, and the mobile menu lacks richer keyboard/escape behaviour.

**Fix:**

- visible `:focus-visible` ring for every interactive element;
- 44 px minimum touch targets;
- skip-to-content link;
- proper active-page navigation state;
- semantic headings;
- accessible filter labels;
- alt text for product imagery;
- no colour-only status communication;
- preserve reduced-motion handling;
- close mobile menu on Escape and route changes.

## Admin UX review

The admin colour separation is directionally correct, but the product workflow is not ready for daily owner use.

### Main admin issues

- one long product form containing every field;
- no image preview or crop/order management;
- category creation uses `window.prompt`;
- no tabs/sections that preserve progress;
- no autosave or unsaved-change warning;
- no retail/wholesale preview;
- product list lacks thumbnails, price, category, edit action and bulk actions;
- mobile navigation becomes a large two-column link grid;
- errors can leave a partially created product because related inserts are not transactional.

### Recommended admin redesign

Products page:

- searchable table with image, name, category, retail price, wholesale status, stock, availability, publish status and actions;
- filters for category, status, channel and stock;
- bulk availability/publish controls;
- dedicated Add Product button.

Add/Edit Product:

Use a full-page editor or wide drawer with sections:

1. Basics
2. Images
3. Retail
4. Wholesale
5. Inventory
6. SEO
7. Preview & Publish

Show completion status for each section. Provide an image drop zone, compression feedback and retail/wholesale previews. Replace browser prompts with proper modal forms.

## Recommended new visual system

### Brand direction

**Modern Sivakasi Market**

Attributes:

- authentic;
- colourful through products, not decoration;
- warm and local;
- fast and commerce-first;
- trustworthy;
- suitable for family and wholesale customers.

### Palette

- Canvas: `#FFFDF8`
- Surface: `#FFFFFF`
- Ink: `#171717`
- Muted: `#6B6B6B`
- Deep Maroon: `#6E1423`
- Sivakasi Saffron: `#F59E0B`
- Warm Red: `#D43D2F`
- Soft Sand: `#F7EEDB`
- Success: `#16845B`
- Warning: `#B86B00`

Use dark navy only where it improves contrast, not as the default atmosphere for every major section.

### Shape and spacing

- 8 px spacing system;
- 12–16 px controls;
- 16–20 px product cards;
- 24 px feature panels;
- fewer oversized 28–30 px rounded containers;
- restrained shadows;
- visible borders and clean alignment.

## Proposed homepage wireframe

### Header

Announcement/support line:

“Enquiry portal • Factory confirms stock and fulfilment • WhatsApp support”

Main navigation:

Logo | Search crackers | Categories | Combo Packs | Wholesale | How to Buy | WhatsApp | Account | Cart

### Hero

Left:

- eyebrow: “Direct from Sivakasi”
- headline: “Build your Diwali cracker requirement in minutes.”
- body: “Browse retail packs and family combos, add what you need, and receive direct confirmation from Gowtham Fireworks.”
- primary CTA: “Browse Crackers”
- secondary CTA: “View Family Combos”
- small wholesale link: “Buying for a shop? Apply for wholesale”

Right:

- authentic collage of 3–5 popular product boxes or one premium family combo;
- one verified offer/minimum-order badge if current;
- no internal architecture statistics.

### Immediately below hero

- category icon/image rail;
- serviceability/contact strip;
- best-selling products;
- combo packs;
- verified offer;
- wholesale panel;
- factory proof;
- how enquiry works;
- safety and footer.

## Priority remediation plan

### Phase A — visual reset and trust repair

1. Remove emojis and development copy.
2. Remove Owner Login from public footer.
3. Replace hero architecture panel with real product/factory visual.
4. Simplify palette and load real fonts.
5. Rebuild header around search, WhatsApp and cart.
6. Add verified contact/serviceability/commercial trust strip.

### Phase B — catalogue conversion UX

1. Redesign product cards.
2. Keep compact two-column mobile catalogue.
3. Add real filters and sort.
4. Redesign product detail and sticky mobile CTA.
5. Improve cart/request progress and messaging.

### Phase C — brand and content proof

1. Add real logo variants.
2. Add factory/team/warehouse photography.
3. Add verified brands, service regions, offers and current price-list date.
4. Rewrite every public sentence in direct customer language.
5. Add authentic reviews only when available.

### Phase D — admin usability

1. Replace long form with structured editor.
2. Add image preview/management.
3. Add product table actions and filters.
4. Add content/offer/settings screens.
5. Add autosave, validation and transactional product creation.

## Acceptance standard for the redesign

The redesigned homepage should let a first-time mobile visitor answer these questions within ten seconds:

1. Is this Gowtham Fireworks/Sivakasi?
2. Can I browse real products and prices?
3. Is this retail, wholesale or both?
4. How does the enquiry process work?
5. Can I contact the factory immediately?
6. Where do I tap to start?

The catalogue should let a customer compare products without opening every detail page. The owner should be able to add or update a product without navigating one overwhelming form or risking partial data creation.

## Final recommendation

Do not spend time merely tweaking the current gradients, shadows or font sizes. Preserve the application architecture and rebuild the public visual layer around authentic photography, tangible commercial information and a faster mobile catalogue. The current design needs a **structured visual reset**, not cosmetic polishing.

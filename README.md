# Knectar Portfolio – Minimal Multi-Page Web Showcase

A clean, responsive portfolio site for **Knectar** featuring:

* Fixed sidebar navigation with SVG iconography
* Dynamic connecting-line accents between navigation & content
* An interactive audio-visual canvas demo powered by Web Audio API
* A lightweight multi-page architecture – pure **HTML / CSS / JS** (no build step)

---

## 📂 Project Structure (2024-06-24)
```text
K6_MINIMAL/
├── assets/                 # SVG icons & media
│   ├── *.svg
│   └── ycba.png
├── css/
│   └── style.css           # Global styles & responsive layout
├── js/
│   ├── script.js           # Sidebar, mobile nav, connecting-lines
│   ├── lines.js            # Generative diagonal-line synth (home-page feature)
│   └── projects.js         # Category filter for projects list view
├── index.html              # Landing page / definition + lines demo
├── lines.html              # Stand-alone playground for the generator (legacy)
├── intranets.html          # Section landing – Intranets & Portals
├── page?-intranets.html    # Example paginated lists (x3)
├── web-apps.html           # Section landing – Web & iOS Apps
├── informational.html      # Section landing – Informational Sites
├── projects.html           # NEW unified list view with category filter
├── project_detail.html     # Detailed case study – Yale Center for British Art
├── blog_post.html          # Sample blog post page
└── README.md               # ← you are here
```

> **Note**: As of 2025-07, the landing page has been consolidated back to `index.html` (previously `home.html`).

---

## ✨ Key Functionalities

### 0. Shared Menu Partial *(new)*
The sidebar + overlay navigation HTML now lives in **`includes/menu.html`**.
A lightweight loader (`js/load_menu.js`) injects this markup into every page at runtime and then loads the main site script. This eliminates duplicate sidebar code across all HTML files and makes future updates to the navigation structure a single-file change.

### 1. Sidebar Navigation
• Fixed 250 px column with logo and parent menu items.
• Parent links toggle sub-menus; only one submenu can be open at a time (`script.js`).
• Mobile view (≤ 768 px) collapses the sidebar behind a hamburger with an overlay for focus.

### 2. Unified Project List (`projects.html`)
• A single master list of all portfolio projects rendered as alternating image/text "tiles".
• A drop-down filter (top-right) lets visitors switch between: **Higher Education**, **Intranets & Portals**, **Web & iOS Apps**, **E-Commerce**, and **Informational**.
• Tiles now **slide in** from a random left or right offset (no vertical movement) on first load and after each filter change, adding subtle motion.
• The sidebar's parent menu links now route to this page and auto-select the relevant filter for seamless navigation.
• Responsive layout – on desktop the tile images alternate left/right; on mobile the layout stacks vertically.

> **Tip**: Add a new project by cloning an existing `<article class="project-tile">` block and updating its `data-category` plus content.

### 3. Dynamic Connecting Line
On desktop, a 1 px grey line with an animated red dot visually connects:
1. The **active submenu item** to the **hero image** on project pages; or
2. The **site logo** to the **"node:"** definition on the home page.

The line updates on resize, navigation clicks, or page load and is removed on mobile to avoid clutter.

### 4. Interactive Lines + Audio Synth (Home)
The `<section id="interactive-lines">` canvas is powered by `js/lines.js`:
* Generates diagonal line bundles with variable spacing/angle.
* Clicking or mouse-over triggers red vibration and a pentatonic note.
* A fixed-tempo (220 BPM) pattern & 8-step beat sequencer drive autonomous playback.
* `Play / Pause` button, beat dots, and keyboard shortcuts give control.
* Audio is produced via Web Audio `Oscillator` & `Gain` nodes – **no external libs**.
* A red "click to play" prompt now appears beside the Play button on page load and automatically hides after the first user click.
* Toggle play/pause via the **space bar** or the on-screen play button.

### 5. Intro-Text "Negative Force Field" (Home)
The paragraph under `.intro-text` on the home page now reacts to the user's cursor:
* Each word is wrapped in a `<span>` and, on `mousemove`, is gently repelled from the pointer.
* The effect is calculated in real-time in `js/script.js` (radius 100 px, max displacement 40 px) and eases back to rest on mouse leave.
* Adds a playful, tactile feel echoing the interactive aesthetic of the [reference demo](https://k6-nu.vercel.app/).

### 6. Case-Study Template (`project_detail.html`)
A sample case study (Yale Center for British Art) demonstrates:
* Breadcrumb navigation with semantic links & external-link icon treatment.
* Gallery / details split layout.
* Dynamic navigation indicator + connecting line.

Use this file as a blueprint for future projects – duplicate & populate.

### 7. Blog Post Template (`blog_post.html`)
A sample editorial page that demonstrates:
* Breadcrumb navigation and metadata list (author, date, tech, domain).
* Figure with caption styling for inline imagery.
* **New:** A text-to-speech audio player that automatically generates spoken audio of the TL;DR summary using the ElevenLabs API (see `js/blog_tts.js`).
* Re-uses global typography and spacing tokens for clean, readable prose.

Use this file as a blueprint when authoring future blog content – duplicate & populate.

### 8. **3D Glow-Edges Demo** (`meshes/dist/index.html`) – an experimental Three.js demo that draws a **steady** (non-flashing) glowing wireframe around a GLB model using CSS-blurred dual canvases. Open the file through a local web-server (e.g. `python -m http.server`) so the model can be fetched without CORS issues.

### 9. **JSON-Driven Content** (NEW)

All page-level metadata and short copy now live inside **`data/menu.json`** so the same file both powers the sidebar navigation *and* serves as a tiny headless CMS.

#### Added Optional Fields per page
- `projectTitle`
- `role`
- `budget`
- `technology`
- `years`
- `designPartner`
- `designPartnerUrl`
- `projectLinkDisplay`
- `projectUrl`
- `author`
- `pageSummary`
- `pageBody`
- `pageTLDR`
- `textToAudioWidgetDisplayed` *(boolean)*
- `audioGraphicDisplayed` *(boolean)*
- `menuImageAnimationDisplayed` *(boolean)*
- `sub_menu` *(boolean \| 0/1)* – only leaf items with this set to `true`/`1` appear in the rendered submenu list
- `slug` – unique string used in query `?item=<slug>` for master templates
- `coverImage` – path to hero image displayed in `.project-gallery`

If a field is omitted or set to `null` it is simply ignored at render-time.

#### How it works
1. `js/load_menu.js` now exposes the parsed JSON on `window.__MENU_DATA` after building the sidebar.
2. `js/script.js` calls **`injectPageData()`** on `DOMContentLoaded`.
3. The helper finds the page's entry in `__MENU_DATA` (via the URL suffix) and:
   • Rewrites the `.project-info` or `.blog-post` section with fresh HTML.
   • Replaces any element that carries a `data-field="someKey"` attribute.
   • Hides optional widgets (e.g. TTS player) based on boolean flags.

Because the injection is *progressive* the legacy static HTML still works — the dynamic layer simply overrides what's there. This lets you migrate pages gradually: just add/extend the JSON record and clear out hard-coded markup.

A minimal example for a leaf page object:
```json
{
  "label": "Yale",
  "url": "projects/higher_education/yale.html",
  "projectTitle": "Yale Center for British Art",
  "role": "Technical Lead, Developer",
  "budget": "$200K",
  "technology": "Drupal 9, 10",
  "years": "2019 – Present",
  "designPartner": "Fabrique",
  "designPartnerUrl": "https://fabrique.com",
  "projectLinkDisplay": "britishart.yale.edu",
  "projectUrl": "http://britishart.yale.edu",
  "pageSummary": "Opened in 1977 through the generosity…",
  "textToAudioWidgetDisplayed": false,
  "audioGraphicDisplayed": true,
  "menuImageAnimationDisplayed": true,
  "sub_menu": true,
  "slug": "yale-center-for-british-art",
  "coverImage": "assets/images/yale-center-for-british-art.jpg"
}
```

> **Tip**: When adding new pages you now only need to create a bare HTML shell that includes the shared loader plus a blank `<section class="project-info"></section>` — the rest comes from JSON.

---

## 🎨 Design Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#FF0000` | Brand red / active states |
| `--color-text` | `#000` & `#333` | Headlines / body |
| `--color-muted` | `#666`, `#999` | Secondary text |
| `--sidebar-bg` | `#fff` | Sidebar background |
| `--border` | `#eee` | Light separators |

All tokens are defined as CSS custom properties near the top of `style.css` for rapid theming.

---

## 🚀 Getting Started
1. **Clone / download** the repo then open a terminal:
   ```bash
   cd K6_MINIMAL
   python -m http.server 8000   # or npx serve, php -S, etc.
   ```
2. Navigate to <http://localhost:8000/index.html>.
3. Resize the window or open DevTools device toolbar to verify responsive behaviour.

No build tools, bundlers, or package managers are required – it's fully static.

---

## 🛠️ Development Notes
* **Add a new section**: duplicate an existing `*.html` page, update sidebar markup, and content.
* **Enable a submenu item indicator**: give the `<li>` the class `active-sub`.
* **Connecting line**: ensure the page contains either `.project-details` with an `<img>` or `.home-content` with `.node-text` for the script to hook.
* **Interactive lines demo** parameters (tempo, reverse, double-time) are hard-coded in `lines.js` for the embedded version; the full playground with controls lives in `lines.html`.

---

## 🗺️ Roadmap
- [x] Add filtering / routing for large project lists (see `projects.html`).
- [ ] Convert static HTML into a componentised framework (11ty, Astro, etc.).
- [ ] Provide CMS data integration (e.g., Drupal headless JSON feed).
- [ ] Make interactive lines section optional per-page via a feature flag.

---

## 📜 License
Copyright © 2025 Knectar.

This project is released under the MIT License—see `LICENSE` for details.

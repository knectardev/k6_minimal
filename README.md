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
│   ├── projects.js         # Category filter for projects list view
│   ├── auth.js             # Authentication system and edit mode management
│   └── load_menu.js        # Dynamic menu loader and script orchestrator
├── data/
│   ├── menu.json           # Generated navigation + page meta (DO NOT EDIT MANUALLY)
│   └── project_data.csv    # ← single source-of-truth for all projects
├── scripts/
│   └── csv_to_menu.py      # Helper to convert CSV → menu.json
├── index.html              # Landing page / definition + lines demo
├── lines.html              # Stand-alone playground for the generator (legacy)
├── intranets.html          # Section landing – Intranets & Portals
├── page?-intranets.html    # Example paginated lists (x3)
├── web-apps.html           # Section landing – Web & iOS Apps
├── informational.html      # Section landing – Informational Sites
├── projects.html           # NEW unified list view with category filter
├── project.html            # Generic project detail template (populated via ?item=slug)
├── blog.html               # Sample blog post page
├── edit.html               # Edit mode login page
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
• A drop-down filter (top-right) lets visitors switch between: **Higher Education**, **Intranets & Portals**, **Web & iOS Apps**, **Informational**, **E-Commerce**, and more.
• A second drop-down now filters by **Technology** (e.g., Drupal 10, Shopify, JavaScript). Selecting a technology combines with the category filter so only projects matching *both* criteria appear.
• Technology options display a live project count: e.g., *Drupal (23)* shows 23 matching projects.
• Technology option counts now automatically update when a category is selected so numbers always reflect the visible subset.
• Technology options whose count drops to 0 for a given category are now automatically hidden, keeping the list concise.
• The “All” technology option now shows the number of projects in the active category rather than the site-wide total.
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

### 6. Project Detail Template (`project.html`)
A sample case study (Yale Center for British Art) demonstrates:
* Breadcrumb navigation with semantic links & external-link icon treatment.
* Gallery / details split layout.
* Dynamic navigation indicator + connecting line.

Use this file as a blueprint for future projects – duplicate & populate.

### 7. Blog Post Template (`blog.html`)
A sample editorial page that demonstrates:
* Breadcrumb navigation and metadata list (author, date, tech, domain).
* Figure with caption styling for inline imagery.
* **New:** A text-to-speech audio player that automatically generates spoken audio of the TL;DR summary using the ElevenLabs API (see `js/blog_tts.js`).
* Re-uses global typography and spacing tokens for clean, readable prose.

Use this file as a blueprint when authoring future blog content – duplicate & populate.

### 8. **3D Glow-Edges Demo** (`meshes/dist/index.html`) – an experimental Three.js demo that draws a **steady** (non-flashing) glowing wireframe around a GLB model using CSS-blurred dual canvases. Open the file through a local web-server (e.g. `python -m http.server`) so the model can be fetched without CORS issues.

### 9. **CSV → JSON Data Pipeline** (Updated)

Project/content data is maintained in **`data/project_data.csv`**.  A lightweight script

```bash
python scripts/csv_to_menu.py data/project_data.csv data/menu.json
```

generates **`data/menu.json`**, which the site consumes at runtime to build the sidebar and inject per-page metadata. **Do not edit `menu.json` directly**—always update the CSV and re-run the script.

This pipeline keeps the data human-editable in spreadsheets while retaining the existing JSON interface used by the JavaScript.

#### Added Optional Fields per page
- `projectTitle`
- `role`
- `budget`

### 10. **Edit Mode Authentication** *(new)*

A secure authentication system allows the site owner to access editing functionality:

- **Login Page**: Navigate to `edit.html` to access the login form
- **Secure Authentication**: Uses SHA-256 password hashing with no passwords stored in code
- **Session Management**: 24-hour sessions stored in localStorage
- **Edit Banner**: When logged in, a slim red banner appears at the top of all pages with "Editing Mode" text and logout button
- **Fork on GitHub Button**: A modern, floating button in the upper right links to the public repo ([knectardev/k6_minimal](https://github.com/knectardev/k6_minimal)) on every page
- **Responsive Design**: Banner and button adjust layout for both desktop and mobile views

#### Setup Instructions:
1. Open `js/auth.js` and change the `expectedUsername` and `expectedPasswordHash` variables
2. Generate your password hash by running this in browser console:
   ```javascript
   crypto.subtle.digest('SHA-256', new TextEncoder().encode('---)')).then(hash => console.log(Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')))
   ```
3. Replace the default hash with your generated hash
4. Access `edit.html` to log in and test the system

**Default credentials**: username: `admin`, password: `---` (CHANGE THESE!)

#### Todos: 

#### MVP
Minimal Content 
Calendly (form?) - 
API https://developer.calendly.com/how-to-display-the-scheduling-page-for-users-of-your-app 
Embed options: 
https://help.calendly.com/hc/en-us/articles/4409838727703-How-to-add-Calendly-to-your-website#h_01JXFNNPH36B2K3DB6TYWSFZ79
https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview?tab=general#h_01JSCFZS5Q3X3DA0QD5JX11SCS 

Fork on GitHub logo
About Us: Current and former employees

#### backlog
More content 


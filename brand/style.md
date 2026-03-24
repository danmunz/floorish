# Floorish Styleguide: The Olive Branch

## Brand Overview

### **The Vibe & Concept: "Midcentury Transitional Meets 'Welcome Home'"**

Floorish takes the traditionally sterile, overwhelming task of arranging furniture to scale and turns it into a joyful, nesting experience. It beautifully balances the precise, technical nature of scale calibration and measurement tools with the cozy, emotional anticipation of making a space your own. It feels like a sunny Sunday morning spent daydreaming over a cup of coffee.

### **The Brand Voice: The Knowledgeable Neighbor**

The voice is empathetic, warm, and highly encouraging. Floorish speaks to the user like a friendly neighbor who came over to help you unpack—and just happens to be brilliant at spatial reasoning. The tone strips away technical intimidation; while the app runs complex tools like OCR auto-detection and grid snapping under the hood, the voice focuses entirely on the excitement of finding the perfect layout.

### **The Color Palette: "The Olive Branch"**

A grounded, earthy, and sophisticated palette that provides high contrast without the harshness of pure black and white. Brand colors are used intentionally as *pops* against neutral surfaces to prevent the earthy palette from looking washed out.

*   **Plaster (#FAFAFA):** A fresh, warm white used for raised surfaces and cards.
    
*   **Forest (#264653):** A deep, grounding green-blue that gives text and structural borders a strong, architectural weight. Used for active tab fills, section headings, and the header gradient accent line.
    
*   **Mustard (#E9C46A):** A sunny, energetic accent used to draw the eye to primary calls to action, active tools, focus rings, and glow accents on selected items.
    
*   **Olive (#7A8B52):** A true midcentury green used for secondary UI accents—badges, panel left-borders, progress fills, scrollbar thumbs, drop-zone text, and success states.

### **The Typography: Editorial Precision**

*   **Headings (Lora):** An elegant, welcoming serif that feels like flipping through a high-end lifestyle or interior design magazine.
    
*   **UI & Body (DM Sans):** A friendly, geometric sans-serif that ensures absolute clarity and legibility for the app's menus, catalogs, and technical data.

### **The Visual Identity**

The UI leans into soft, tactile shapes—pill-style buttons and gently rounded cards that float above the canvas with layered shadows. Micro-interactions (translateY lifts, translateX slides, outer ring glows) give the interface physical presence. The olive→mustard gradient accent line beneath the header anchors the brand at the top of every view.

## Brand Voice Examples

### Welcome Copy
This copy is designed to sit right near the top of your landing page, perhaps just below the main "Upload Floor Plan" button. It immediately establishes the "knowledgeable neighbor" voice, acknowledging the stress of moving while pivoting straight to the joy of nesting.

>Welcome home.
>
>Moving into a new space—or reimagining your current one—should be exciting, not exhausting. Floorish is your personal studio for turning empty floor plans into perfectly planned sanctuaries. We handle the heavy lifting behind the scenes, ensuring your furniture catalog and custom shapes are perfectly scaled to real-world dimensions. You get to focus on the fun part: finding exactly where the sofa belongs.
>
>Pour a cup of coffee, drop in your floor plan, and let's bring your vision to life.

---

## 🎨 Color Palette

### Brand Colors

These four core colors drive the entire application interface.

| Color Name | Hex Code | CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Plaster** | `#FAFAFA` | `--plaster` | Raised surfaces (cards, sidebar, auth card). |
| **Mustard** | `#E9C46A` | `--mustard` | Primary CTA fills, active tool buttons, focus rings, glow accents, gradient accent line. |
| **Forest** | `#264653` | `--forest` | Primary text, section headings, active tab fills, header gradient endpoints. |
| **Olive** | `#7A8B52` | `--olive` | Panel left-borders, badges, progress fills, scrollbar thumbs, calibration accents, drop-zone text. |

### Derived Surface Palette

The app background is **not** pure white—it uses a warm linen-tinted stack to avoid a flat, washed-out look.

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--bg` | `#F5F2ED` | App background, canvas area. |
| `--bg-raised` | `#FFFFFF` | Cards, sidebar, header, dropdowns. |
| `--bg-surface` | `#FAFAFA` | Inactive tabs, input fields. |
| `--bg-hover` | `#F0ECE6` | Hover states on neutral elements. |

### Borders

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--border` | `rgba(38, 70, 83, 0.1)` | Subtle dividers, card outlines. |
| `--border-strong` | `rgba(38, 70, 83, 0.2)` | Input borders, inactive tab outlines. |
| `--border-active` | `var(--mustard)` | Focused inputs, active selections. |

### Text

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--text` | `var(--forest)` | Primary body text. |
| `--text-dim` | `rgba(38, 70, 83, 0.7)` | Secondary text, labels. |
| `--text-muted` | `rgba(38, 70, 83, 0.45)` | Hints, timestamps, placeholders. |

### Semantic Colors

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--accent` | `var(--mustard)` | Primary accent. |
| `--accent-hover` | `#d4af5a` | Darkened mustard for hover. |
| `--danger` | `#C1534F` | Delete actions, error states. |
| `--success` | `var(--olive)` | Calibrated badges, completed steps. |
| `--warning` | `#D4943A` | Warning notices. |

### Color-Pop Principles

To prevent the earthy palette from looking washed out, brand colors are applied with *deliberate intensity* at key interaction points:

* **Active states** use outer ring glows (e.g., `box-shadow: 0 0 0 3px rgba(233, 196, 106, 0.15)` on active tool buttons).
* **Panel accents** use `border-left: 4px solid var(--olive)` paired with an olive-tinted background (`rgba(122, 139, 82, 0.04)`), not plain gray.
* **Scrollbar thumbs** are olive-tinted (`rgba(122, 139, 82, 0.25)`), not generic gray.
* **Progress bars** use an `olive → mustard` gradient for visual energy.
* **Badges** (e.g., "Calibrated ✓") use a visible olive border + saturated olive background (`rgba(122, 139, 82, 0.15)`).
* **Hover on project cards** adds an olive left-border accent for color continuity.

---

## 🔤 Typography

Floorish uses a two-font system available via Google Fonts, balancing editorial warmth with high-legibility interface text.

### Headings & Display
* **Font Family:** `'Lora', Georgia, serif`
* **CSS Variable:** `--font-heading`
* **Weights:** Regular (400), Medium (500), Semi-bold (600)
* **Style:** `text-transform: uppercase; letter-spacing: 0.06em` on section headings; normal case on display text.
* **Usage:** Section titles (sidebar headers, calibration panel), empty state headers, auth page title, and large display text (e.g., "Welcome home.").

### UI & Body Copy
* **Font Family:** `'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif`
* **CSS Variable:** `--font-body`
* **Weights:** Regular (400), Medium (500), Bold (700)
* **Usage:** Toolbar labels, buttons, furniture catalog items, inputs, and general interface copy.

---

## ✨ Motion & Timing

All transitions use custom easing curves for a polished, physical feel—never generic `ease`.

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Standard interactions (hover, focus). |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrance animations (fadeInUp, dropdowns). |
| `--transition-fast` | `0.15s ease-out-quart` | Hover, active states. |
| `--transition-med` | `0.25s ease-out-quart` | Panel transitions, card lifts. |
| `--transition-slow` | `0.4s ease-out-expo` | Page-level entrances. |

### Keyframe Animations

* **`fadeInUp`** — Entrance: `translateY(24px) → 0` with opacity. Used on auth card, auth elements (staggered), dropdowns.
* **`fadeIn`** — Simple opacity entrance. Used on auth logo, footnote.
* **`breathe`** — Subtle `scale(1) → scale(1.04)` pulse, 3s infinite. Used on empty-state icon.

### Micro-Interactions

* **Tool buttons:** `translateY(-1px)` on hover; `translateY(-2px)` on primary button hover.
* **Preset items:** `translateX(3px)` slide on hover.
* **Category tabs:** `translateY(-1px)` lift on hover.
* **Export dropdown items:** `padding-left` indent on hover.
* **Project/sample cards:** `translateY(-2px)` lift + elevated shadow on hover.

---

## 🔲 Shadows

A layered shadow system provides consistent depth across components.

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--shadow-soft` | `0 1px 2px rgba(38,70,83,0.04), 0 4px 12px rgba(38,70,83,0.06)` | Header, zoom indicator, cards at rest. |
| `--shadow-btn` | `0 2px 4px rgba(233,196,106,0.3), 0 4px 12px rgba(233,196,106,0.2)` | Primary/active buttons (mustard-tinted). |
| `--shadow-btn-hover` | `0 4px 8px rgba(233,196,106,0.35), 0 8px 24px rgba(233,196,106,0.25)` | Primary button hover state. |
| `--shadow-elevated` | `0 4px 12px rgba(38,70,83,0.05), 0 16px 40px rgba(38,70,83,0.1)` | Dropdowns, card hover states. |
| `--shadow-dramatic` | `0 8px 24px rgba(38,70,83,0.08), 0 32px 64px rgba(38,70,83,0.12)` | Auth card, modals. |

---

## 📐 Radii

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--radius-pill` | `50px` | Buttons, search inputs, tabs, badges. |
| `--radius-card` | `12px` | Cards, panels, dropdowns. |
| `--radius-sm` | `6px` | Preset items, small containers. |
| `--radius-xs` | `4px` | Inline inputs, small controls. |

---

## 🧩 UI Elements & Components

### Buttons

All buttons use `DM Sans` (`--font-body`), `font-weight: 700`, `font-size: 12px`, `border-radius: var(--radius-pill)`.

* **Primary (`.btn-primary`):** Mustard fill, forest text, mustard-tinted box-shadow. Lifts `translateY(-2px)` on hover.
* **Ghost (`.btn-ghost`):** Transparent with border. Hover tints background with `rgba(38, 70, 83, 0.05)` and turns text/border forest.
* **Danger (`.btn-danger`):** Transparent, danger-red text/border. Hover fills with `rgba(193, 83, 79, 0.08)`.
* **Cancel (`.btn-cancel`):** Neutral transparent. Hover fills `--bg-hover`.

### Section Headers

Sidebar section headings (Calibration, Furniture) use:
* `font-family: var(--font-heading)` · `text-transform: uppercase` · `letter-spacing: 0.06em` · `color: var(--forest)`
* A `::after` pseudo-element underline accent — **mustard** for Furniture, **olive** for Calibration — `width: 24px; height: 2px`.

### Active States

Active elements are never just a background fill; they use layered visual signals:
* **Active tool button:** Mustard fill + outer mustard glow ring (`0 0 0 3px rgba(233, 196, 106, 0.15)`).
* **Active floor tab:** Forest fill + deeper shadow + outer forest ring (`0 0 0 3px rgba(38, 70, 83, 0.08)`).
* **Active category tab:** Same forest fill + ring pattern.
* **Active preset item:** Mustard-tinted background + mustard border + inset mustard left-bar (`inset 3px 0 0`).

### Panels

* **Selected furniture panel:** Olive-tinted bg (`rgba(122, 139, 82, 0.04)`) + olive border + `border-left: 4px solid var(--olive)`.
* **Preset editor panel:** Neutral bg + border + `border-left: 4px solid var(--olive)`.
* **Placing indicator:** Mustard-tinted bg (`rgba(233, 196, 106, 0.15)`) + mustard border + outer mustard glow.
* **Palette notice:** Warmer mustard-tinted bg (`rgba(233, 196, 106, 0.12)`) + mustard left-border accent.

### Inputs

* `border: 1.5px solid var(--border-strong)` at rest.
* `border-color: var(--mustard)` + `box-shadow: 0 0 0 3px rgba(233, 196, 106, 0.2)` on focus.

### Cards (Project Picker)

* Rest: white bg, subtle border, `--radius-card`.
* Hover: `translateY(-2px)` lift + `--shadow-elevated` + olive left-border accent (`border-left: 3px solid var(--olive)`).

### Auth Page

* Full-screen radial gradient background (olive + mustard tints over `--bg`).
* Auth card: `--shadow-dramatic`, `border-radius: 20px`, staggered `fadeInUp` entrance animations (logo → title → subtitle → buttons → footnote, 0.15s delays).

---

## 💻 CSS Custom Properties

The app uses plain CSS custom properties (no Tailwind). All tokens are defined in `:root` in `src/App.css`:

```css
:root {
  /* Brand colors */
  --plaster: #FAFAFA;
  --mustard: #E9C46A;
  --forest: #264653;
  --olive: #7A8B52;

  /* Derived surfaces */
  --bg: #F5F2ED;
  --bg-raised: #FFFFFF;
  --bg-surface: #FAFAFA;
  --bg-hover: #F0ECE6;
  --border: rgba(38, 70, 83, 0.1);
  --border-strong: rgba(38, 70, 83, 0.2);
  --border-active: var(--mustard);

  /* Text */
  --text: var(--forest);
  --text-dim: rgba(38, 70, 83, 0.7);
  --text-muted: rgba(38, 70, 83, 0.45);

  /* Semantic */
  --accent: var(--mustard);
  --accent-hover: #d4af5a;
  --danger: #C1534F;
  --success: var(--olive);
  --warning: #D4943A;

  /* Shadows */
  --shadow-soft: 0 1px 2px rgba(38, 70, 83, 0.04), 0 4px 12px rgba(38, 70, 83, 0.06);
  --shadow-btn: 0 2px 4px rgba(233, 196, 106, 0.3), 0 4px 12px rgba(233, 196, 106, 0.2);
  --shadow-btn-hover: 0 4px 8px rgba(233, 196, 106, 0.35), 0 8px 24px rgba(233, 196, 106, 0.25);
  --shadow-elevated: 0 4px 12px rgba(38, 70, 83, 0.05), 0 16px 40px rgba(38, 70, 83, 0.1);
  --shadow-dramatic: 0 8px 24px rgba(38, 70, 83, 0.08), 0 32px 64px rgba(38, 70, 83, 0.12);

  /* Layout */
  --sidebar-w: 300px;
  --header-h: 56px;
  --toolbar-h: 46px;

  /* Fonts */
  --font-heading: 'Lora', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Radii */
  --radius-pill: 50px;
  --radius-card: 12px;
  --radius-sm: 6px;
  --radius-xs: 4px;

  /* Timing */
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --transition-fast: 0.15s var(--ease-out-quart);
  --transition-med: 0.25s var(--ease-out-quart);
  --transition-slow: 0.4s var(--ease-out-expo);
}
```
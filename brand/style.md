# Floorish Styleguide: The Olive Branch

**Theme Concept:** A true midcentury nod. The earthy olive green pairs perfectly with the mustard yellow, feeling both retro and sophisticated, creating a welcoming space to start planning.

## 🎨 Color Palette

These core colors drive the entire application interface, from the background canvas to the active tool states.

| Color Name | Hex Code | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Plaster** | `#FAFAFA` | `bg-plaster` | Main application background and empty canvas area. |
| **Mustard** | `#E9C46A` | `bg-mustard` / `text-mustard` | Primary calls to action, active tools, and highlights. |
| **Forest** | `#264653` | `text-forest` / `bg-forest` | Primary text, heavy structural borders, and high-contrast elements. |
| **Olive** | `#7A8B52` | `bg-olive` / `border-olive` | Secondary accents, success states, and UI card borders. |

*Note: A subtle border color `rgba(38, 70, 83, 0.1)` (semi-transparent Forest) is used for dividers and secondary outlines.*

---

## 🔤 Typography

Floorish uses a two-font system available via Google Fonts, balancing editorial warmth with high-legibility interface text.

### Headings & Display
* **Font Family:** `Lora`, serif
* **Tailwind Class:** `font-heading`
* **Weights:** Regular (400), Medium (500), Semi-bold (600)
* **Usage:** Main section titles, empty state headers, and large display text (e.g., "Welcome home.").

### UI & Body Copy
* **Font Family:** `DM Sans`, sans-serif
* **Tailwind Class:** `font-body`
* **Weights:** Regular (400), Medium (500), Bold (700)
* **Usage:** Toolbar labels, buttons, furniture catalog items, and general interface copy (e.g., "Upload floor plan").

---

## 🧩 UI Elements & Components

The interface relies on pill-shaped buttons for actions and slightly structured cards for information panels. 

### Buttons
All buttons use the `DM Sans` font (`font-body`), bold (`font-bold`), at `1.05rem` (`text-[1.05rem]`).

* **Primary Button**
    * **Classes:** `bg-mustard text-forest rounded-pill px-8 py-3.5 shadow-btn hover:-translate-y-0.5 hover:shadow-btn-hover transition-all duration-200`
* **Secondary Button**
    * **Classes:** `bg-transparent text-forest border-2 border-forest/20 rounded-pill px-8 py-3 hover:border-forest transition-colors duration-200`

### UI Cards & Panels
Used for catalog items, notifications, or floating toolbars.

* **Classes:** `bg-white text-forest font-body font-semibold text-[1.05rem] rounded-card px-7 py-4 border-l-4 border-olive shadow-soft flex items-center gap-3`

---

## 💻 Tailwind Configuration

Drop this into your `tailwind.config.js` file to make all of your theme tokens available as utility classes across your Vite project:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plaster: '#FAFAFA',
        mustard: '#E9C46A',
        forest: '#264653',
        olive: '#7A8B52',
      },
      fontFamily: {
        heading: ['Lora', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(38, 70, 83, 0.06)',
        'btn': '0 4px 12px rgba(233, 196, 106, 0.4)',
        'btn-hover': '0 6px 16px rgba(233, 196, 106, 0.5)',
      },
      borderRadius: {
        'pill': '50px',
        'card': '12px',
      }
    },
  },
  plugins: [],
}
```
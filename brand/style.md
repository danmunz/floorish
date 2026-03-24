# Floorish Styleguide: The Olive Branch

## Brand Overview

### **The Vibe & Concept: "Midcentury Transitional Meets 'Welcome Home'"**

Floorish takes the traditionally sterile, overwhelming task of arranging furniture to scale and turns it into a joyful, nesting experience. It beautifully balances the precise, technical nature of scale calibration and measurement tools with the cozy, emotional anticipation of making a space your own. It feels like a sunny Sunday morning spent daydreaming over a cup of coffee.

### **The Brand Voice: The Knowledgeable Neighbor**

The voice is empathetic, warm, and highly encouraging. Floorish speaks to the user like a friendly neighbor who came over to help you unpack—and just happens to be brilliant at spatial reasoning. The tone strips away technical intimidation; while the app runs complex tools like OCR auto-detection and grid snapping under the hood, the voice focuses entirely on the excitement of finding the perfect layout.

### **The Color Palette: "The Olive Branch"**

A grounded, earthy, and sophisticated palette that provides high contrast without the harshness of pure black and white.

*   **Plaster (#FAFAFA):** A fresh, warm white that provides a clean, inviting background for importing floor plan images.
    
*   **Forest (#264653):** A deep, grounding green-blue that gives text and structural borders a strong, architectural weight.
    
*   **Mustard (#E9C46A):** A sunny, energetic accent used to draw the eye to primary calls to action and active tools.
    
*   **Olive (#7A8B52):** A true midcentury green used for secondary UI accents, snapping highlights, and success states.

### **The Typography: Editorial Precision**

*   **Headings (Lora):** An elegant, welcoming serif that feels like flipping through a high-end lifestyle or interior design magazine.
    
*   **UI & Body (DM Sans):** A friendly, geometric sans-serif that ensures absolute clarity and legibility for the app's menus, catalogs, and technical data.

### **The Visual Identity**

The UI leans into soft, tactile shapes, utilizing pill-style buttons and gently rounded cards that float above the canvas.

## Brand Voice Examples

### Welcome Copy
This copy is designed to sit right near the top of your landing page, perhaps just below the main "Upload Floor Plan" button. It immediately establishes the "knowledgeable neighbor" voice, acknowledging the stress of moving while pivoting straight to the joy of nesting.

>Welcome home.
>
>Moving into a new space—or reimagining your current one—should be exciting, not exhausting. Floorish is your personal studio for turning empty floor plans into perfectly planned sanctuaries. We handle the heavy lifting behind the scenes, ensuring your furniture catalog and custom shapes are perfectly scaled to real-world dimensions. You get to focus on the fun part: finding exactly where the sofa belongs.
>
>Pour a cup of coffee, drop in your floor plan, and let's bring your vision to life.

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
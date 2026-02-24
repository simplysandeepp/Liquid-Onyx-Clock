# Master Project Prompt: Liquid Clock Screensaver PWA

Copy the entire content below and feed it into a new project session to start:

---

## Project Title: **Liquid Onyx: The Ultimate Glossy Clock PWA**

### Overview
Create a high-end, high-performance web-based screensaver application. The aesthetic MUST be "Pure Glossy Black Liquid Glassomorphic." It should feel like a premium luxury device (think high-end Apple/Tesla dashboards).

### 1. Visual Identity & Aesthetics
- **Theme:** Glossy Deep Black background.
- **Background Effect:** A dynamic "Liquid" background with flowing, amorphous blobs. Use **Three.js** or **Framer Motion** with SVG filters to achieve a gooey, liquid-metal effect.
- **Glassomorphism:** All UI panels (Timer, Stopwatch, Settings) must use high-end glassomorphism:
  - `backdrop-filter: blur(20px) saturate(180%)`
  - Subtle `1px` border with `rgba(255, 255, 255, 0.1)`
  - Semi-transparent black backgrounds (`rgba(0, 0, 0, 0.4)`).
- **Typography:** Use a professional, clean font like **Inter** or **Outfit**. Large responsive font sizes for the main clock.

### 2. Core Functional Requirements
- **Center Clock:** A large, prominent digital clock in the center of the screen.
- **Infinite Loop / Full Screen:** 
  - The app must default to an immersive full-screen mode.
  - User can exit/minimise via `Esc` key or a dedicated button.
- **Navigation (Hamburger Menu):** Top-right corner.
  - Options to switch between **Clock**, **Timer**, and **Stopwatch**.
  - **Themes Picker:** 
    1. *Glossy Black:* Deep Onyx liquid.
    2. *Liquid Gold:* Metallic fluid.
    3. *Abstract Frost:* Glassy white/translucent.

### 3. Feature Details
- **Stopwatch:**
  - Start, Stop, Reset buttons.
  - **Lap Counting:** Record timestamped laps.
  - **Data Export:** Button to download lap history as a `.txt` or `.csv` file. 
- **Timer:**
  - Preset options (5m, 15m, 30m, 1h).
  - Custom duration input.
  - Audio alert when finished.
- **Persistence:** Use `localStorage` to save the active theme, recent timer durations, and lap history so they persist after a refresh.

### 4. Technical Stack & PWA
- **Framework:** React + Vite + TypeScript.
- **Styling:** Tailwind CSS + Vanilla CSS for custom animations.
- **PWA Capabilities:** 
  - Configure `vite-plugin-pwa`.
  - Full offline support via Service Workers.
  - Custom "Install App" prompt for Desktop (Mac/Win) and Mobile (Android/iOS).
- **Responsiveness:** 
  - Must be **"Liquid Responsive"**—smooth transitions between iMac 5K, iPad Pro, and iPhone Pro Max dimensions.
  - Auto-scrolling/adapting layouts.

### 5. Interaction
- Hide the cursor and UI controls after 3 seconds of inactivity (screensaver mode).
- Reveal controls instantly on mouse move or screen touch.
---
# Aesthetics Specification: Liquid & Glossy Glass
Use these tokens to maintain the "Liquid Onyx" visual style throughout the project development.

# 1. Color Palette (Deep Onyx)
<!-- ```css
:root {
  --bg-dark: #040404;       /* Deepest Black */
  --bg-surface: #0A0A0A;    /* Surface Elevations */
  --glass-border: rgba(255, 255, 255, 0.12);
  --text-primary: #F5F7FA;
  --text-muted: #B6BDC9;
  --accent-glow: rgba(28, 32, 48, 0.8);
} -->


# 2. Liquid Animation Parameters (SVG Filter)
<!-- <svg style="display: none;">
  <filter id="liquid-filter">
    <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -12" result="liquid" />
    <feComposite in="SourceGraphic" in2="liquid" operator="atop" />
  </filter>
</svg> -->

# 3. Glassmorphism Standard
<!-- .glass-panel {
  background: rgba(10, 10, 10, 0.45);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
} -->

## 4. Full-Screen Interaction
<!-- const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}; -->

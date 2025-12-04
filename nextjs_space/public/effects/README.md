# Sports Graphics Visual Effects Assets

High-quality visual effects assets for professional sports graphics templates.

## Overview

This collection contains 58 professional-grade visual effects assets organized into 4 categories:
- **10 Paint Splatters** - Dynamic black paint splatter effects
- **19 Textures** - Various texture overlays for backgrounds
- **21 Photo Effects** - Light effects, particles, and visual enhancements
- **8 Filters** - Gradient and vignette overlays

All assets are:
- High resolution (1500x1500px minimum for effects, 2000x2000px for textures)
- PNG format with transparent backgrounds (RGBA)
- Optimized for sports graphics and professional designs
- Ready to use in web applications, print, and video

## Directory Structure

```
effects/
├── splatters/          # Paint splatter effects (10 files)
├── textures/           # Texture overlays (19 files)
├── photo-effects/      # Light and particle effects (21 files)
└── filters/            # Gradient and vignette overlays (8 files)
```

## Asset Categories

### 1. Paint Splatters (10 variations)
**Location:** `/effects/splatters/`
**Size:** Minimum 1500x1500px
**Format:** PNG with transparent background

Dynamic, energetic black paint splatter effects perfect for sports graphics. Users can recolor these in their applications.

Files:
- `splatter-01.png` through `splatter-10.png`

**Use Cases:**
- Background accents
- Dynamic overlays
- Action emphasis
- Team branding elements

---

### 2. Textures (19 variations)
**Location:** `/effects/textures/`
**Size:** Minimum 2000x2000px
**Format:** PNG (transparent or white background for blending)

Professional texture overlays for adding depth and character to designs.

**Grunge Textures (4 files):**
- `grunge-01.png` through `grunge-04.png`
- Distressed, worn textures for urban/edgy looks

**Concrete/Stone Textures (2 files):**
- `concrete-01.png`, `concrete-02.png`
- Seamless concrete and stone patterns

**Metal Textures (1 file):**
- `metal-01.png`
- Brushed metal texture

**Carbon Fiber (1 file):**
- `carbon-fiber-01.png`
- Modern carbon fiber pattern

**Distressed (1 file):**
- `distressed-01.png`
- Scratched, worn overlay

**Halftone Patterns (3 files):**
- `halftone-01.png` through `halftone-03.png`
- Dot pattern textures

**Geometric Patterns (1 file):**
- `geometric-01.png`
- Modern geometric line patterns

**Diagonal Lines (1 file):**
- `diagonal-lines-01.png`
- Striped diagonal pattern

**Hexagon Patterns (2 files):**
- `hexagon-01.png`, `hexagon-02.png`
- Honeycomb/hexagonal patterns

**Paint Stroke (1 file):**
- `paint-stroke-01.png`
- Artistic brush stroke texture

**Scratched (1 file):**
- `scratched-01.png`
- Scratch overlay effect

**Noise/Grain (1 file):**
- `noise-01.png`
- Film grain texture

**Use Cases:**
- Background textures
- Overlay effects
- Depth and dimension
- Material simulation

---

### 3. Photo Effects (21 variations)
**Location:** `/effects/photo-effects/`
**Size:** Minimum 1500x1500px
**Format:** PNG with transparent background

Professional light effects and visual enhancements.

**Lens Flares (3 files):**
- `lens-flare-01.png` through `lens-flare-03.png`
- Multiple styles of lens flare effects

**Light Rays/God Rays (2 files):**
- `light-rays-01.png`, `light-rays-02.png`
- Dramatic light beam effects

**Bokeh Effects (2 files):**
- `bokeh-01.png`, `bokeh-02.png`
- Soft, out-of-focus light circles

**Glow Effects (2 files):**
- `glow-01.png`, `glow-02.png`
- Radiant glow overlays

**Particle Effects (2 files):**
- `particle-01.png`, `particle-02.png`
- Floating particle overlays

**Smoke Effects (2 files):**
- `smoke-01.png`, `smoke-02.png`
- Realistic smoke overlays

**Explosion Effects (2 files):**
- `explosion-01.png`, `explosion-02.png`
- Dynamic explosion bursts

**Speed Lines/Motion Blur (2 files):**
- `speed-lines-01.png`, `speed-lines-02.png`
- Motion and speed effects

**Sparkle/Glitter Effects (2 files):**
- `sparkle-01.png`, `sparkle-02.png`
- Sparkling light effects

**Neon Glow Effects (2 files):**
- `neon-glow-01.png`, `neon-glow-02.png`
- Vibrant neon lighting

**Use Cases:**
- Dramatic lighting
- Action emphasis
- Atmospheric effects
- Energy and motion

---

### 4. Filters (8 variations)
**Location:** `/effects/filters/`
**Size:** 2000x2000px
**Format:** PNG with transparent background

Gradient and vignette overlays for color grading and focus effects.

**Gradient Overlays (5 files):**
- `red-gradient-01.png` - Red color gradient
- `blue-gradient-01.png` - Blue color gradient
- `orange-gradient-01.png` - Orange color gradient
- `purple-gradient-01.png` - Purple color gradient
- `black-gradient-01.png` - Black gradient for darkening

**Vignette Effects (2 files):**
- `vignette-01.png`, `vignette-02.png`
- Edge darkening for focus

**Light Gradient (1 file):**
- `light-gradient-01.png`
- Radial light gradient

**Use Cases:**
- Color grading
- Focus effects
- Mood enhancement
- Depth of field simulation

---

## Technical Specifications

### Image Properties
- **Format:** PNG (Portable Network Graphics)
- **Color Mode:** RGBA (with alpha channel for transparency)
- **Bit Depth:** 8-bit per channel
- **Compression:** Lossless PNG compression

### Size Requirements Met
- Paint Splatters: ≥1500x1500px ✓
- Textures: ≥2000x2000px ✓
- Photo Effects: ≥1500x1500px ✓
- Filters: ≥2000x2000px ✓

### File Naming Convention
- Descriptive prefix (e.g., `splatter`, `lens-flare`, `grunge`)
- Sequential numbering with zero-padding (e.g., `-01`, `-02`)
- `.png` extension

---

## Usage Guidelines

### In Web Applications
```javascript
// Example: Using a splatter effect
<img src="/effects/splatters/splatter-01.png" 
     style="mix-blend-mode: multiply; opacity: 0.8;" />

// Example: Using a texture overlay
<div style="background-image: url('/effects/textures/grunge-01.png'); 
            background-blend-mode: overlay;" />
```

### In CSS
```css
.sports-graphic {
  background-image: url('/effects/textures/carbon-fiber-01.png');
  background-size: cover;
}

.action-overlay {
  background-image: url('/effects/photo-effects/explosion-01.png');
  mix-blend-mode: screen;
  opacity: 0.7;
}
```

### Blend Modes
Recommended blend modes for different effects:
- **Splatters:** Multiply, Darken
- **Textures:** Overlay, Soft Light
- **Light Effects:** Screen, Add, Lighten
- **Filters:** Normal, Overlay

---

## Performance Considerations

### Optimization Tips
1. **Lazy Loading:** Load effects only when needed
2. **Responsive Images:** Use appropriate sizes for different screen sizes
3. **Caching:** Leverage browser caching for frequently used effects
4. **Compression:** Consider WebP format for web delivery (with PNG fallback)

### File Sizes
- Most assets are optimized for web use
- Larger files (>5MB) should be compressed for production
- Consider using CDN for faster delivery

---

## License & Attribution

These assets were sourced from:
- Public domain resources (Pixabay, Unsplash)
- Free-to-use stock sites (Pngtree, Vecteezy, Freepik)
- Procedurally generated (custom Python scripts)

**Usage Rights:**
- Free for commercial and personal use
- No attribution required for procedurally generated assets
- Check individual source licenses for downloaded assets

---

## Support & Updates

For issues, suggestions, or custom asset requests, please contact the development team.

**Version:** 1.0
**Last Updated:** October 22, 2025
**Total Assets:** 58 files

---

## Quick Reference

| Category | Count | Min Size | Location |
|----------|-------|----------|----------|
| Paint Splatters | 10 | 1500x1500 | `/effects/splatters/` |
| Textures | 19 | 2000x2000 | `/effects/textures/` |
| Photo Effects | 21 | 1500x1500 | `/effects/photo-effects/` |
| Filters | 8 | 2000x2000 | `/effects/filters/` |
| **TOTAL** | **58** | - | `/effects/` |


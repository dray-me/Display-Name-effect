# 🎨 Display Effects Catalog — JavaScript

This document outlines the visual border styling effects supported by the **Discord Display Name Styles** service. Visual effects apply outline styles, shadows, or gradients directly onto custom display names.

---

## 📋 Effects Database

Visual effects are represented in payloads via an integer ID (Format A: `effect_id`, Format B: `display_name_effect_id`).

### 1. Solid
- **ID**: `1`
- **Key Name**: `solid`
- **Behavior**: Applies a flat, single color to the text with standard contrast outlines.
- **Required Colors**: Minimum 1 color (e.g. `[16777215]` / White). If secondary colors are applied, they are generally ignored or truncated.
- **Example**:
  ```javascript
  const payload = { font_id: 11, effect_id: 1, colors: [16777215] };
  ```
- **Compatibility**: High. Universal fallback supported on all client software versions.

### 2. Gradient
- **ID**: `2`
- **Key Name**: `gradient`
- **Behavior**: Interpolates between multiple colors to apply a linear horizontal or diagonal gradient fill across the letters.
- **Required Colors**: Exactly 2 colors required (e.g. `[16711935, 8388736]` / Pink to Purple). Applying only 1 color might degrade the style back to solid.
- **Example**:
  ```javascript
  const payload = { font_id: 7, effect_id: 2, colors: [5865, 16777215] };
  ```
- **Compatibility**: High on modern desktop and web clients; older mobile versions may render only the first primary color.

### 3. Neon
- **ID**: `3`
- **Key Name**: `neon`
- **Behavior**: Adds an elegant glowing stroke outline surrounding the text contour, conveying a luminous tube or glow-in-the-dark layout.
- **Required Colors**: Works best with highly vibrant neon colors (such as Magenta, Deep Pink, Cyan, or Crisp White).
- **Example**:
  ```javascript
  const payload = { font_id: 10, effect_id: 3, colors: [16777215] };
  ```
- **Compatibility**: Extremely High. This was the flagship aesthetic in early Discord Display Name Styles.

### 4. Toon
- **ID**: `4`
- **Key Name**: `toon`
- **Behavior**: Generates a thick, high-contrast dark stroke outline surrounding the font with a gentle cartoon-like inner vertical gradient.
- **Required Colors**: Works beautifully with lighter colors (White, Light Yellow, and Light Pink) contrasted against the dark outline.
- **Example**:
  ```javascript
  const payload = { font_id: 3, effect_id: 4, colors: [16777215] };
  ```
- **Compatibility**: Fully supported on modern clients. Highly popular on rounded fonts.

### 5. Pop
- **ID**: `5`
- **Key Name**: `pop`
- **Behavior**: Creates a crisp, offset, high-contrast drop shadow behind each character, evoking a paper-cutout or sticker layout.
- **Required Colors**: Highly contrasting pairs of text and shadow colors are optimal.
- **Example**:
  ```javascript
  const payload = { font_id: 8, effect_id: 5, colors: [8388736] };
  ```
- **Compatibility**: High. Fully tested across all resolution grids.

### 6. Glow
- **ID**: `6`
- **Key Name**: `glow`
- **Behavior**: Surrounds the display text with a soft, diffused outer drop glow.
- **Required Colors**: Highly vibrant colors recommended representing the core glow source.
- **Example**:
  ```javascript
  const payload = { font_id: 1, effect_id: 6, colors: [16711935, 8388736] };
  ```
- **Compatibility**: High. Adds a beautiful, subtle visual aesthetic.

---

## 📋 Compatibility Summary Matrix

| Effect Name | Requirements | Mobile Support | Desktop Support | Performance Impact |
|---|---|---|---|---|
| **Solid** | `1 Color` | Perfect | Perfect | None |
| **Gradient** | `2 Colors` | High (Iterated) | Perfect | Low |
| **Neon** | `1 Color` | Perfect | Perfect | Low |
| **Toon** | `1+ Colors` | Perfect | Perfect | Low |
| **Pop** | `1+ Colors` | Perfect | Perfect | Medium |
| **Glow** | `1+ Colors` | High | Perfect | Medium |

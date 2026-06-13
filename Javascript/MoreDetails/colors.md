# 🎨 Known Colors Index — JavaScript

Discord Display Name Styles require color representations in **24-bit decimal integer format**, rather than standard hex strings (e.g. `"#FF00FF"`). This document maps color options to their decimal values and details how translation functions work in JavaScript.

---

## 📋 Standard Decimal Colors List

Here is your core reference for pre-registered hues:

| Color Name | Hex Representation | Decimal Integer | Example Use-Case |
|---|---|---|---|
| **White** | `#FFFFFF` | `16777215` | Default elegant overlay accent |
| **Blue** | `#0016E9` | `5865` | High-tech deep blue accent |
| **Pink** | `#FF00FF` | `16711935` | Vibrant aesthetic neon glow |
| **Purple** | `#800000` | `8388736` | Heavy dark gothic contrast |

*Note on Purple ID `8388736`*: In the underlying profile system, `8388736` converts in hex code directly to `0x800000` (which is standard dark maroon, often used as base shadowing under deep purple profile effects).

---

## 📈 Multi-Color / Gradient Pair Presets

When combining values for gradients (`effect_id: 2`) or multi-colored glow overlays, supply the integer values in order inside the payload array:

### 1. White to Blue Gradient
- **Hex Code Pair**: `#FFFFFF` + `#0016E9`
- **Decimal Representation**: `[16777215, 5865]`
- **Style Concept**: Cold, electronic glass effect. Pair with font ID `7` (Neo-Castel).

### 2. Pink to Purple Gradient
- **Hex Code Pair**: `#FF00FF` + `#800000`
- **Decimal Representation**: `[16711935, 8388736]`
- **Style Concept**: Cyberpunk high-saturation contrast. Pair with font ID `1` (Bangers) or `9` (Ribes).

### 3. Pure Cyberpunk Glow
- **Hex Code Pair**: `#00FFD2` (Cyan) + `#FF00FF` (Pink)
- **Decimal Representation**: `[65490, 16711935]`
- **Style Concept**: Distinctive neon glow aesthetic. Pair with font ID `8` (Pixelify Sans) or `10` (Sinistre).

---

## 💻 JavaScript Conversion Functions

You can integrate these helpers directly inside your JavaScript handlers or utilities to safely convert on-the-fly:

```javascript
/**
 * Converts a standard Hex string (e.g., "#FF00FF" or "FF00FF") to a Discord-compatible 24-bit decimal integer.
 */
function hexToDecimal(hex) {
  const sanitized = hex.replace("#", "").trim();
  const parsed = parseInt(sanitized, 16);
  if (isNaN(parsed) || parsed < 0 || parsed > 0xffffff) {
    throw new Error(`Invalid hexadecimal color input: ${hex}`);
  }
  return parsed;
}

/**
 * Converts a Discord-compatible 24-bit decimal integer back to a formatted Hex string.
 */
function decimalToHex(decimal) {
  if (decimal < 0 || decimal > 0xffffff) {
    throw new Error(`Invalid decimal color input: ${decimal}`);
  }
  const hex = decimal.toString(16).toUpperCase();
  return `#${hex.padStart(6, "0")}`;
}

// Example usage:
const decColor = hexToDecimal("#FF00FF"); // Returns 16711935
const hexColor = decimalToHex(5865);       // Returns "#0016E9"

module.exports = {
  hexToDecimal,
  decimalToHex
};
```

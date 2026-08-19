/**
 * Generic wrapper around a per-system color palette (see e.g.
 * data/systems/nervous/colors.js). Systems share this mechanism; only the
 * data differs. Two palettes on purpose: `meshColors` is the muted, natural
 * palette applied to the 3D model itself; `accentColors` is a separate, more
 * saturated palette used only for UI chrome (labels, legend, leader lines) —
 * a legend swatch needs to be visually distinct even when the model's own
 * colors are deliberately subtle.
 */
export class RegionColorScheme {
  constructor({ meshColors, accentColors, baseNames }) {
    this.meshColors = meshColors;
    this.accentColors = accentColors;
    this.baseNames = baseNames;
  }

  /** Strips a trailing _left/_right so both sides look up the same color. */
  static baseId(regionId) {
    return regionId ? regionId.replace(/_(left|right)$/, "") : null;
  }

  colorForRegion(regionId) {
    const base = RegionColorScheme.baseId(regionId);
    return base ? (this.meshColors[base] ?? null) : null;
  }

  accentColorForRegion(regionId) {
    const base = RegionColorScheme.baseId(regionId);
    return base ? (this.accentColors[base] ?? 0x9aa4b2) : 0x9aa4b2;
  }
}

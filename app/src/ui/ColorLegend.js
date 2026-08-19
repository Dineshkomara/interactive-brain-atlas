import { ACCENT_COLORS, BASE_NAMES } from "../brain/RegionColors.js";

function cssColor(hex) {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

/**
 * Small color key shown alongside the Labels toggle, so the color-coding on
 * the labels/lines actually means something to a student at a glance instead
 * of just looking decorative.
 */
export class ColorLegend {
  constructor(container) {
    this.root = document.createElement("div");
    this.root.id = "color-legend";
    this.root.style.display = "none";

    const items = Object.entries(BASE_NAMES)
      .map(([id, name]) => {
        const color = cssColor(ACCENT_COLORS[id]);
        return `<span class="legend-item"><span class="legend-dot" style="background:${color}"></span>${name}</span>`;
      })
      .join("");

    this.root.innerHTML = items;
    container.appendChild(this.root);
  }

  setVisible(visible) {
    this.root.style.display = visible ? "flex" : "none";
  }
}

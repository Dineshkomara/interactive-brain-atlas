function cssColor(hex) {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

/**
 * Small color key shown alongside the Labels toggle, so the color-coding on
 * the labels/lines actually means something to a student at a glance instead
 * of just looking decorative. Rebuilt via setScheme() whenever the active
 * body system changes.
 */
export class ColorLegend {
  constructor(container) {
    this.root = document.createElement("div");
    this.root.id = "color-legend";
    this.root.style.display = "none";
    container.appendChild(this.root);
  }

  setScheme(colorScheme) {
    const items = Object.entries(colorScheme.baseNames)
      .map(([id, name]) => {
        const color = cssColor(colorScheme.accentColors[id]);
        return `<span class="legend-item"><span class="legend-dot" style="background:${color}"></span>${name}</span>`;
      })
      .join("");
    this.root.innerHTML = items;
  }

  setVisible(visible) {
    this.root.style.display = visible ? "flex" : "none";
  }
}

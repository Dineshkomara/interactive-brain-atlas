import regions from "../data/regions.json";

/**
 * Renders the region info panel from data/regions.json. Knows nothing about
 * Three.js — only reads region data and reports clicks back via callbacks.
 */
export class RegionPanel {
  constructor(container, { onSelectRelated, onClose }) {
    this.container = container;
    this.onSelectRelated = onSelectRelated;
    this.onClose = onClose;
  }

  show(regionId) {
    const data = regions[regionId];
    if (!data) {
      console.warn(`No content in regions.json for region_id "${regionId}"`);
      this.hide();
      return;
    }

    const relatedChips = (data.relatedRegions || [])
      .filter((id) => regions[id])
      .map((id) => `<button class="related-chip" data-region-id="${id}">${regions[id].name}</button>`)
      .join("");

    this.container.innerHTML = `
      <div class="region-panel-header">
        <h2>${data.name}</h2>
        <button class="panel-close" aria-label="Close">&times;</button>
      </div>
      <section>
        <h3>Where is it?</h3>
        <p>${data.location}</p>
      </section>
      <section>
        <h3>What is it?</h3>
        <p>${data.summary}</p>
      </section>
      <section>
        <h3>Main functions</h3>
        <ul>${data.functions.map((f) => `<li>${f}</li>`).join("")}</ul>
      </section>
      ${relatedChips ? `<section><h3>Connected to</h3><div class="related-chips">${relatedChips}</div></section>` : ""}
      ${data.clinicalRelevance ? `<section><h3>Why it matters</h3><p>${data.clinicalRelevance}</p></section>` : ""}
      <p class="draft-note">Educational content — draft, pending expert review.</p>
    `;

    this.container.classList.add("open");

    this.container.querySelector(".panel-close").addEventListener("click", () => this.onClose());
    this.container.querySelectorAll(".related-chip").forEach((chip) => {
      chip.addEventListener("click", () => this.onSelectRelated(chip.dataset.regionId));
    });
  }

  hide() {
    this.container.classList.remove("open");
    this.container.innerHTML = "";
  }
}

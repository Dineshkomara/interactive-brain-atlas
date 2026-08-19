/**
 * "Choose a Structure" combobox: type to filter, or browse grouped by
 * system. Selecting an entry drives the same selection pipeline as clicking
 * the model directly (Section 17 Search System). Region data and grouping
 * (GROUP_ORDER/GROUP_LABELS) are injected so this works for any body system.
 */
export class StructureSearch {
  constructor(container, regions, groupOrder, groupLabels, { onSelect }) {
    this.regions = regions;
    this.groupOrder = groupOrder;
    this.groupLabels = groupLabels;
    this.entries = Object.entries(regions)
      .map(([id, data]) => ({ id, name: data.name, system: data.system }))
      .sort((a, b) => a.name.localeCompare(b.name));
    this.onSelect = onSelect;
    this.isOpen = false;

    this.root = document.createElement("div");
    this.root.id = "structure-search";
    this.root.innerHTML = `
      <input type="text" id="structure-search-input" placeholder="Choose a structure…" autocomplete="off" />
      <div id="structure-search-results"></div>
    `;
    container.appendChild(this.root);

    this.input = this.root.querySelector("#structure-search-input");
    this.results = this.root.querySelector("#structure-search-results");

    this.input.addEventListener("focus", () => this._open());
    this.input.addEventListener("input", () => this._render(this.input.value));
    document.addEventListener("click", (e) => {
      if (!this.root.contains(e.target)) this._close();
    });
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.input.blur();
    });
  }

  _open() {
    this.isOpen = true;
    this.root.classList.add("open");
    this._render(this.input.value);
  }

  _close() {
    this.isOpen = false;
    this.root.classList.remove("open");
  }

  _render(query) {
    const q = query.trim().toLowerCase();
    const filtered = q ? this.entries.filter((e) => e.name.toLowerCase().includes(q)) : this.entries;

    if (filtered.length === 0) {
      this.results.innerHTML = `<div class="structure-search-empty">No matches</div>`;
      return;
    }

    const bySystem = new Map();
    for (const entry of filtered) {
      if (!bySystem.has(entry.system)) bySystem.set(entry.system, []);
      bySystem.get(entry.system).push(entry);
    }

    const groups = this.groupOrder.filter((sys) => bySystem.has(sys));
    this.results.innerHTML = groups
      .map((sys) => {
        const items = bySystem
          .get(sys)
          .map((e) => `<button class="structure-result" data-region-id="${e.id}">${e.name}</button>`)
          .join("");
        return `<div class="structure-group"><div class="structure-group-label">${this.groupLabels[sys] || sys}</div>${items}</div>`;
      })
      .join("");

    this.results.querySelectorAll(".structure-result").forEach((btn) => {
      btn.addEventListener("click", () => {
        const regionId = btn.dataset.regionId;
        this.input.value = this.regions[regionId].name;
        this._close();
        this.onSelect(regionId);
      });
    });
  }

  setValue(regionId) {
    this.input.value = this.regions[regionId]?.name || "";
  }

  clear() {
    this.input.value = "";
  }
}

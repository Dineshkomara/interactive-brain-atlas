import regions from "../data/regions.json";

/** Small floating label that follows the cursor while hovering a region. */
export class HoverTooltip {
  constructor(container) {
    this.el = document.createElement("div");
    this.el.id = "hover-tooltip";
    container.appendChild(this.el);
  }

  show(regionId, clientX, clientY) {
    const data = regions[regionId];
    if (!data) return this.hide();
    this.el.textContent = data.name;
    this.el.style.left = `${clientX}px`;
    this.el.style.top = `${clientY}px`;
    this.el.classList.add("visible");
  }

  hide() {
    this.el.classList.remove("visible");
  }
}

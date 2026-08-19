/**
 * License-required attribution, moved out of the always-visible viewport
 * into an explicit About/Credits modal (opened via the small "ⓘ About"
 * button). The 3D model is a modified derivative of Z-Anatomy/BodyParts3D
 * content under CC BY-SA 4.0, which requires (a) attribution and (b) that
 * the derivative asset itself stay under the same license — both satisfied
 * here. Only the anatomical asset carries that obligation; this app's own
 * code, UI, and educational text are original and unaffected.
 */
export class CreditsPanel {
  constructor(container, toggleButton) {
    this.overlay = document.createElement("div");
    this.overlay.id = "credits-overlay";
    this.overlay.innerHTML = `
      <div id="credits-modal" role="dialog" aria-label="About and credits">
        <div class="credits-header">
          <h2>About this project</h2>
          <button class="panel-close" id="credits-close" aria-label="Close">&times;</button>
        </div>
        <section>
          <h3>3D brain model</h3>
          <p>
            Derived from <strong>Z-Anatomy</strong> (Gauthier Kervyn et al.), built on the
            <strong>BodyParts3D</strong> dataset (The Database Center for Life Science, Japan).
            Licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.
          </p>
          <p>
            Modified for this project: structures re-tagged with stable region IDs, recolored,
            and reorganized for web delivery. As a derivative work, this modified asset is
            likewise licensed under
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.
          </p>
        </section>
        <section>
          <h3>Educational content</h3>
          <p>Region descriptions, lessons, and quiz questions are original to this project and are drafts pending expert review — see the note on each region panel.</p>
        </section>
        <section>
          <h3>Application</h3>
          <p>Built with Three.js and Blender, following the project's own development plan.</p>
        </section>
      </div>
    `;
    container.appendChild(this.overlay);

    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });
    this.overlay.querySelector("#credits-close").addEventListener("click", () => this.close());
    toggleButton.addEventListener("click", () => this.open());
  }

  open() {
    this.overlay.classList.add("open");
  }

  close() {
    this.overlay.classList.remove("open");
  }
}

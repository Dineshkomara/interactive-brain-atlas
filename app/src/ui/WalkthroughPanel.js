const AUTO_ADVANCE_MS = 6500;

/**
 * Section 20 Guided Lesson Architecture: a step-by-step tour driven by data,
 * not hard-coded. Each step reuses the same selectRegion pipeline as manual
 * clicks/search, so highlight/camera/info-panel behavior stays consistent.
 */
export class WalkthroughPanel {
  constructor(container, lessons, { onStepChange, onToggle }) {
    this.lesson = lessons[0];
    this.onStepChange = onStepChange;
    this.onToggle = onToggle || (() => {});
    this.stepIndex = 0;
    this.playing = false;
    this.timer = null;
    this.isOpen = false;

    this.root = document.createElement("div");
    this.root.id = "walkthrough-panel";
    container.appendChild(this.root);
    this._render();
  }

  open() {
    this.isOpen = true;
    this.root.classList.add("open");
    this._goTo(this.stepIndex);
    this.onToggle(true);
  }

  close() {
    this.isOpen = false;
    this.root.classList.remove("open");
    this._pause();
    this.onToggle(false);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
    return this.isOpen;
  }

  _render() {
    const steps = this.lesson.steps;
    this.root.innerHTML = `
      <div class="wt-header">
        <div>
          <div class="wt-title">${this.lesson.title}</div>
          <div class="wt-progress">Step <span id="wt-num"></span> of ${steps.length}</div>
        </div>
        <button class="btn-ui" id="wt-close" aria-label="Close walkthrough">&times;</button>
      </div>
      <div class="wt-body">
        <h3 id="wt-step-title"></h3>
        <p id="wt-step-text"></p>
      </div>
      <div class="wt-controls">
        <button class="btn-ui" id="wt-prev">&larr; Prev</button>
        <button class="btn-ui primary" id="wt-play">&#9654; Play</button>
        <button class="btn-ui" id="wt-next">Next &rarr;</button>
      </div>
      <div class="wt-dots" id="wt-dots">
        ${steps.map((_, i) => `<button class="wt-dot" data-index="${i}" aria-label="Go to step ${i + 1}"></button>`).join("")}
      </div>
    `;

    this.root.querySelector("#wt-close").addEventListener("click", () => this.close());
    this.root.querySelector("#wt-prev").addEventListener("click", () => {
      this._pause();
      this._goTo(this.stepIndex - 1);
    });
    this.root.querySelector("#wt-next").addEventListener("click", () => {
      this._pause();
      this._goTo(this.stepIndex + 1);
    });
    this.root.querySelector("#wt-play").addEventListener("click", () => {
      this.playing ? this._pause() : this._play();
    });
    this.root.querySelectorAll(".wt-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        this._pause();
        this._goTo(Number(dot.dataset.index));
      });
    });
  }

  _play() {
    this.playing = true;
    this.root.querySelector("#wt-play").innerHTML = "&#10074;&#10074; Pause";
    this.timer = setInterval(() => {
      if (this.stepIndex >= this.lesson.steps.length - 1) {
        this._pause();
        return;
      }
      this._goTo(this.stepIndex + 1);
    }, AUTO_ADVANCE_MS);
  }

  _pause() {
    this.playing = false;
    this.root.querySelector("#wt-play").innerHTML = "&#9654; Play";
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  _goTo(index) {
    const steps = this.lesson.steps;
    this.stepIndex = Math.max(0, Math.min(steps.length - 1, index));
    const step = steps[this.stepIndex];

    this.root.querySelector("#wt-num").textContent = this.stepIndex + 1;
    this.root.querySelector("#wt-step-title").textContent = step.title;
    this.root.querySelector("#wt-step-text").textContent = step.body;
    this.root.querySelector("#wt-prev").disabled = this.stepIndex === 0;
    this.root.querySelector("#wt-next").disabled = this.stepIndex === steps.length - 1;

    this.root.querySelectorAll(".wt-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === this.stepIndex);
    });

    this.onStepChange(step.regionId);
  }
}

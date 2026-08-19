// Regions in these categories are buried inside the cortex and unclickable
// under a normal opaque view — see onXrayChange below.
const INTERNAL_CATEGORIES = new Set(["subcortical", "ventricle", "white_matter"]);

/**
 * Section 21 Quiz Architecture. Two question types:
 *  - "identify": student clicks the named structure on the live 3D model.
 *    handleModelClick() is fed every model click from main.js and grades it
 *    only while this exact question is expanded.
 *  - "multipleChoice": standard single-answer options list, graded instantly.
 * Quiz logic stays independent of Three.js — it only ever sees region IDs.
 *
 * onXrayChange(active) fires whenever an open "identify" question targets an
 * internal structure (thalamus, hippocampus, ventricles, basal ganglia...):
 * those are fully hidden behind opaque cortex, so a raycast can never reach
 * them normally. main.js wires this to RegionHighlighter.xray(), which fades
 * every surface region uniformly — not just the correct answer — so the
 * student can see and click among all the internal structures without the
 * fade itself giving away which one is right.
 */
export class QuizPanel {
  constructor(container, quizzes, regions, { onOpenQuestion, onToggle, onXrayChange }) {
    this.quiz = quizzes[0];
    this.regions = regions;
    this.onOpenQuestion = onOpenQuestion;
    this.onToggle = onToggle || (() => {});
    this.onXrayChange = onXrayChange || (() => {});
    this.isOpen = false;
    this.openQuestionId = null;
    this.answers = new Map();

    this.root = document.createElement("div");
    this.root.id = "quiz-panel";
    container.appendChild(this.root);
    this._render();
  }

  open() {
    this.isOpen = true;
    this.root.classList.add("open");
    this.onToggle(true);
  }

  close() {
    this.isOpen = false;
    this.root.classList.remove("open");
    this.openQuestionId = null;
    this.onOpenQuestion(null);
    this.onToggle(false);
    this._notifyXray();
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
    return this.isOpen;
  }

  reset() {
    this.answers.clear();
    this._render();
    this._notifyXray();
  }

  totalPoints() {
    return this.quiz.questions.reduce((sum, q) => sum + q.points, 0);
  }

  scorePoints() {
    let score = 0;
    for (const q of this.quiz.questions) {
      if (this.answers.get(q.id)?.status === "correct") score += q.points;
    }
    return score;
  }

  /** Called for every model click; grades the open "identify" question if any. */
  handleModelClick(regionId) {
    if (this.openQuestionId === null) return false;
    const question = this.quiz.questions.find((q) => q.id === this.openQuestionId);
    if (!question || question.type !== "identify" || this.answers.has(question.id)) return false;

    const correct = regionId === question.answer;
    this.answers.set(question.id, { status: correct ? "correct" : "incorrect", clickedRegionId: regionId });
    this._render();
    this._reopen(question.id);
    this._notifyXray();
    return true;
  }

  _render() {
    const answeredCount = this.answers.size;
    this.root.innerHTML = `
      <div class="quiz-header">
        <div>
          <div class="quiz-title">${this.quiz.title}</div>
          <div class="quiz-sub">${answeredCount} of ${this.quiz.questions.length} answered</div>
        </div>
        <button class="btn-ui" id="quiz-close" aria-label="Close assignment">&times;</button>
      </div>
      <div class="quiz-score">Score <b>${this.scorePoints()}</b> / ${this.totalPoints()}</div>
      <div class="quiz-list">
        ${this.quiz.questions.map((q) => this._renderQuestion(q)).join("")}
      </div>
      <button class="btn-ui" id="quiz-reset">&#8635; Reset quiz</button>
    `;

    this.root.querySelector("#quiz-close").addEventListener("click", () => this.close());
    this.root.querySelector("#quiz-reset").addEventListener("click", () => this.reset());

    this.root.querySelectorAll(".qbtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.qid);
        this._toggleQuestion(id);
      });
    });

    this.root.querySelectorAll(".opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        const qid = Number(btn.dataset.qid);
        const label = btn.dataset.label;
        this._answerMultipleChoice(qid, label);
      });
    });
  }

  _renderQuestion(q) {
    const answer = this.answers.get(q.id);
    const isOpen = this.openQuestionId === q.id;
    const statusLabel = !answer ? "Not answered" : answer.status === "correct" ? "Correct" : "Incorrect";
    const statusClass = !answer ? "" : answer.status === "correct" ? "ok" : "no";

    return `
      <div class="q ${isOpen ? "open" : ""}" data-q="${q.id}">
        <button class="qbtn" data-qid="${q.id}" aria-expanded="${isOpen}">
          <span class="qnum">${q.id}</span>
          <span class="qtitle">${q.prompt}</span>
          <span class="qmeta">
            <span class="qstat ${statusClass}">${statusLabel}</span>
            <span class="qpts">${q.points} pt</span>
          </span>
        </button>
        <div class="qwrap">
          <div class="qbody">
            <div class="qinner">${this._renderQuestionBody(q, answer)}</div>
          </div>
        </div>
      </div>
    `;
  }

  _renderQuestionBody(q, answer) {
    if (q.type === "identify") {
      if (!answer) {
        const hint = INTERNAL_CATEGORIES.has(this.regions[q.answer]?.category)
          ? "This structure is buried inside the brain, so the surface has been faded to let you see and click among the internal structures. Click the correct one."
          : "Click the correct structure on the 3D brain to answer.";
        return `<p class="q-hint">${hint}</p>`;
      }
      const correctName = this.regions[q.answer]?.name || q.answer;
      const clickedName = this.regions[answer.clickedRegionId]?.name || answer.clickedRegionId || "nothing tagged";
      return `
        <div class="feedback ${answer.status === "correct" ? "ok" : "no"}">
          ${answer.status === "correct" ? "&#10003; Correct." : `&#10007; You clicked <b>${clickedName}</b>.`}
          The answer is <b>${correctName}</b>.
        </div>
      `;
    }

    if (q.type === "multipleChoice") {
      const opts = q.options
        .map((opt) => {
          let cls = "";
          if (answer) {
            if (opt.correct) cls = "ok";
            else if (opt.label === answer.selectedLabel) cls = "no";
          }
          return `<button class="opt ${cls}" data-qid="${q.id}" data-label="${opt.label}" ${answer ? "disabled" : ""}>${opt.label}</button>`;
        })
        .join("");
      const feedback = answer
        ? `<div class="feedback ${answer.status === "correct" ? "ok" : "no"}">${answer.status === "correct" ? "&#10003; Correct." : "&#10007; Not quite."} ${q.explanation}</div>`
        : "";
      return `<div class="opts">${opts}</div>${feedback}`;
    }

    return "";
  }

  _toggleQuestion(id) {
    this.openQuestionId = this.openQuestionId === id ? null : id;
    this._render();
    this._reopen(this.openQuestionId);
    this.onOpenQuestion(this.openQuestionId);
    this._notifyXray();
  }

  _needsXray() {
    if (this.openQuestionId === null) return false;
    const q = this.quiz.questions.find((qq) => qq.id === this.openQuestionId);
    if (!q || q.type !== "identify" || this.answers.has(q.id)) return false;
    return INTERNAL_CATEGORIES.has(this.regions[q.answer]?.category);
  }

  _notifyXray() {
    this.onXrayChange(this._needsXray());
  }

  _answerMultipleChoice(qid, label) {
    if (this.answers.has(qid)) return;
    const q = this.quiz.questions.find((qq) => qq.id === qid);
    const chosen = q.options.find((o) => o.label === label);
    this.answers.set(qid, { status: chosen.correct ? "correct" : "incorrect", selectedLabel: label });
    this._render();
    this._reopen(qid);
  }

  _reopen(id) {
    if (id === null) return;
    const el = this.root.querySelector(`.q[data-q="${id}"]`);
    if (el) el.classList.add("open");
    this.openQuestionId = id;
  }
}

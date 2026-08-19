import { BrainViewer } from "./brain/BrainViewer.js";
import { loadBrain } from "./brain/BrainLoader.js";
import { RegionPicker } from "./brain/RegionPicker.js";
import { RegionHighlighter } from "./brain/RegionHighlighter.js";
import { CameraController } from "./brain/CameraController.js";
import { RegionPanel } from "./ui/RegionPanel.js";
import { HoverTooltip } from "./ui/HoverTooltip.js";
import { StructureSearch } from "./ui/StructureSearch.js";
import { LabelsOverlay } from "./ui/LabelsOverlay.js";
import { WalkthroughPanel } from "./ui/WalkthroughPanel.js";
import { QuizPanel } from "./ui/QuizPanel.js";
import { ColorLegend } from "./ui/ColorLegend.js";
import { CreditsPanel } from "./ui/CreditsPanel.js";

const container = document.getElementById("viewer-container");
const loadingIndicator = document.getElementById("loading-indicator");
const fpsCounter = document.getElementById("fps-counter");
const toolbar = document.getElementById("toolbar");
const toolbarActions = document.getElementById("toolbar-actions");
const viewerHint = document.getElementById("viewer-hint");
const panelContainer = document.getElementById("region-panel");
const structureSearchContainer = document.getElementById("structure-search-container");
const walkthroughContainer = document.getElementById("walkthrough-container");
const quizContainer = document.getElementById("quiz-container");

const viewer = new BrainViewer(container);

// selectedRegionId is the single authoritative selection state (Section 11):
// the picker, highlighter, camera, panel, and search box all react to it,
// nothing else drives selection directly.
let selectedRegionId = null;
let regionIndex = null;
let highlighter = null;
let cameraController = null;
let labelsOverlay = null;

const panel = new RegionPanel(panelContainer, {
  onSelectRelated: (regionId) => selectRegion(regionId, { bestAngle: true }),
  onClose: () => deselectRegion(),
});

const hoverTooltip = new HoverTooltip(container);
const colorLegend = new ColorLegend(container);
new CreditsPanel(document.body, document.getElementById("credits-toggle"));

const structureSearch = new StructureSearch(structureSearchContainer, {
  onSelect: (regionId) => selectRegion(regionId, { bestAngle: true }),
});

const walkthrough = new WalkthroughPanel(walkthroughContainer, {
  onStepChange: (regionId) => selectRegion(regionId, { bestAngle: true }),
  onToggle: (open) => tourButton.classList.toggle("active", open),
});

const quiz = new QuizPanel(quizContainer, {
  onOpenQuestion: () => {},
  onToggle: (open) => quizButton.classList.toggle("active", open),
  onXrayChange: (active) => highlighter?.xray(active),
});

// bestAngle:true (label clicks, search, tour steps, related chips) picks a
// curated viewing direction; direct clicks on the model (bestAngle:false,
// the default) only reframe distance/target and keep whichever direction
// the user has freely orbited to, so exploring never yanks the view around.
function selectRegion(regionId, { bestAngle = false } = {}) {
  const target = regionIndex?.get(regionId);
  if (!target) return;
  selectedRegionId = regionId;
  highlighter.select(regionId);
  cameraController.flyTo(target, { bestAngle });
  structureSearch.setValue(regionId);
  viewerHint.style.display = "none";
  if (!quiz.isOpen) panel.show(regionId);
}

function deselectRegion() {
  selectedRegionId = null;
  highlighter?.clear();
  panel.hide();
  structureSearch.clear();
  viewerHint.style.display = "";
}

// Hovering a label previews that structure's highlight without touching the
// camera, panel, or selection state — lets a student sweep across labels and
// see each one light up before committing to a click. Leaving the label
// reverts to whatever was actually selected (or nothing).
function previewRegion(regionId) {
  highlighter?.select(regionId);
}

function clearPreview() {
  highlighter?.select(selectedRegionId);
}

loadBrain("/models/brain.glb", (event) => {
  if (event.lengthComputable) {
    const pct = Math.round((event.loaded / event.total) * 100);
    loadingIndicator.textContent = `Loading brain model… ${pct}%`;
  }
})
  .then(({ root, regionIndex: index }) => {
    viewer.setBrainRoot(root);
    regionIndex = index;
    highlighter = new RegionHighlighter(root);
    cameraController = new CameraController(viewer.camera, viewer.controls);
    cameraController.setSceneScale(root);
    labelsOverlay = new LabelsOverlay(container, regionIndex, {
      onSelect: (regionId) => selectRegion(regionId, { bestAngle: true }),
      onHoverStart: (regionId) => previewRegion(regionId),
      onHoverEnd: () => clearPreview(),
    });
    labelsOverlay.setSceneScale(cameraController.sceneCenter, cameraController.sceneDiameter / 2);

    new RegionPicker(viewer.camera, viewer.renderer.domElement, root, {
      onSelect: (regionId) => {
        quiz.handleModelClick(regionId);
        selectRegion(regionId);
      },
      // Clicking empty space intentionally does nothing — background clicks
      // happen easily while orbiting, and losing the current focus/panel to
      // a stray miss-click was disruptive. Use the panel's close button or
      // Reset view to explicitly clear a selection.
      onDeselect: () => {},
      onHover: (regionId, x, y) => hoverTooltip.show(regionId, x, y),
      onHoverEnd: () => hoverTooltip.hide(),
    });

    loadingIndicator.classList.add("hidden");
    console.info(`Brain loaded: ${regionIndex.size} tagged regions indexed.`);
  })
  .catch((error) => {
    loadingIndicator.textContent = "Failed to load brain model. See console for details.";
    console.error(error);
  });

let frames = 0;
let fpsAccumulator = 0;
viewer.onFrame = (delta) => {
  frames += 1;
  fpsAccumulator += delta;
  if (fpsAccumulator >= 0.5) {
    const fps = Math.round(frames / fpsAccumulator);
    fpsCounter.textContent = `${fps} fps`;
    frames = 0;
    fpsAccumulator = 0;
  }
  labelsOverlay?.update(viewer.camera);
};

const resetButton = document.createElement("button");
resetButton.id = "reset-camera";
resetButton.textContent = "Reset view";
resetButton.addEventListener("click", () => {
  deselectRegion();
  viewer.resetCamera();
});
toolbar.appendChild(resetButton);

const labelsButton = document.createElement("button");
labelsButton.className = "btn-ui";
labelsButton.textContent = "\u{1F3F7} Labels";
labelsButton.addEventListener("click", () => {
  const visible = labelsOverlay?.toggle();
  labelsButton.classList.toggle("active", !!visible);
  colorLegend.setVisible(!!visible);
});
toolbarActions.appendChild(labelsButton);

const tourButton = document.createElement("button");
tourButton.className = "btn-ui";
tourButton.textContent = "\u{1F393} Tour";
tourButton.addEventListener("click", () => {
  if (quiz.isOpen) quiz.close();
  walkthrough.toggle();
});
toolbarActions.appendChild(tourButton);

const quizButton = document.createElement("button");
quizButton.className = "btn-ui";
quizButton.textContent = "\u{1F4DD} Assignment";
quizButton.addEventListener("click", () => {
  if (walkthrough.isOpen) walkthrough.close();
  panel.hide();
  quiz.toggle();
});
toolbarActions.appendChild(quizButton);

viewer.start();

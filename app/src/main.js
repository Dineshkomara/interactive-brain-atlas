import { BrainViewer } from "./brain/BrainViewer.js";
import { loadBrain } from "./brain/BrainLoader.js";
import { RegionPicker } from "./brain/RegionPicker.js";
import { RegionHighlighter } from "./brain/RegionHighlighter.js";
import { RegionColorScheme } from "./brain/RegionColorScheme.js";
import { CameraController } from "./brain/CameraController.js";
import { RegionPanel } from "./ui/RegionPanel.js";
import { HoverTooltip } from "./ui/HoverTooltip.js";
import { StructureSearch } from "./ui/StructureSearch.js";
import { LabelsOverlay } from "./ui/LabelsOverlay.js";
import { WalkthroughPanel } from "./ui/WalkthroughPanel.js";
import { QuizPanel } from "./ui/QuizPanel.js";
import { ColorLegend } from "./ui/ColorLegend.js";
import { CreditsPanel } from "./ui/CreditsPanel.js";
import systemsCatalog from "./data/systems.json";

// Every body system lives in its own data/systems/<id>/ folder (config.js +
// regions/lessons/quizzes.json — see docs/full-body-atlas-plan.md Section 3).
// import.meta.glob auto-discovers whichever folders actually exist, so
// adding a new system needs no changes here: just the folder plus a
// "status": "available" entry in data/systems.json.
const configLoaders = import.meta.glob("./data/systems/*/config.js");
const regionsLoaders = import.meta.glob("./data/systems/*/regions.json");
const lessonsLoaders = import.meta.glob("./data/systems/*/lessons.json");
const quizzesLoaders = import.meta.glob("./data/systems/*/quizzes.json");

async function loadSystemData(systemId) {
  const base = `./data/systems/${systemId}`;
  const [config, regionsModule, lessonsModule, quizzesModule] = await Promise.all([
    configLoaders[`${base}/config.js`](),
    regionsLoaders[`${base}/regions.json`](),
    lessonsLoaders[`${base}/lessons.json`](),
    quizzesLoaders[`${base}/quizzes.json`](),
  ]);
  return {
    // Model paths in systems.json are domain-root-absolute ("/models/...");
    // prefix with Vite's configured base so they still resolve when the app
    // is deployed under a subpath (e.g. GitHub Pages project sites).
    modelPath: import.meta.env.BASE_URL + systemsCatalog[systemId].glb.replace(/^\//, ""),
    regions: regionsModule.default,
    lessons: lessonsModule.default,
    quizzes: quizzesModule.default,
    colorScheme: new RegionColorScheme({
      meshColors: config.MESH_COLORS,
      accentColors: config.ACCENT_COLORS,
      baseNames: config.BASE_NAMES,
    }),
    surfaceRegions: config.SURFACE_REGIONS,
    groupOrder: config.GROUP_ORDER,
    groupLabels: config.GROUP_LABELS,
  };
}

function pickInitialSystemId() {
  const requested = new URLSearchParams(window.location.search).get("system");
  if (requested && systemsCatalog[requested]?.status === "available") return requested;
  return Object.keys(systemsCatalog).find((id) => systemsCatalog[id].status === "available") || "nervous";
}

const container = document.getElementById("viewer-container");
const loadingIndicator = document.getElementById("loading-indicator");
const fpsCounter = document.getElementById("fps-counter");
const toolbar = document.getElementById("toolbar");
const appTitle = document.getElementById("app-title");
const toolbarActions = document.getElementById("toolbar-actions");
const viewerHint = document.getElementById("viewer-hint");
const panelContainer = document.getElementById("region-panel");
const structureSearchContainer = document.getElementById("structure-search-container");
const walkthroughContainer = document.getElementById("walkthrough-container");
const quizContainer = document.getElementById("quiz-container");

const viewer = new BrainViewer(container);

// selectedRegionId is the single authoritative selection state (Section 11):
// the picker, highlighter, camera, panel, and search box all react to it,
// nothing else drives selection directly. Everything below is re-created by
// mountSystem() whenever the active body system changes, so it's `let`
// rather than `const` even where a single-system build would only assign it
// once.
let selectedRegionId = null;
let regionIndex = null;
let highlighter = null;
let cameraController = null;
let labelsOverlay = null;
let regionPicker = null;
let panel = null;
let hoverTooltip = null;
let structureSearch = null;
let walkthrough = null;
let quiz = null;
let currentSystemId = null;

const colorLegend = new ColorLegend(container);
new CreditsPanel(document.body, document.getElementById("credits-toggle"));

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
  panel?.hide();
  structureSearch?.clear();
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

// System selector: lists every entry in systems.json, greyed out unless
// "status": "available" — switching systems tears down and rebuilds the
// per-system components below via mountSystem() (Section 3.2 of the plan).
const systemSelect = document.createElement("select");
systemSelect.id = "system-select";
for (const [id, info] of Object.entries(systemsCatalog)) {
  const option = document.createElement("option");
  option.value = id;
  option.textContent = info.status === "available" ? info.name : `${info.name} (coming soon)`;
  option.disabled = info.status !== "available";
  systemSelect.appendChild(option);
}
systemSelect.addEventListener("change", () => mountSystem(systemSelect.value));
toolbar.insertBefore(systemSelect, structureSearchContainer);

function clearContainer(el) {
  el.innerHTML = "";
}

async function mountSystem(systemId) {
  if (systemId === currentSystemId) return;
  currentSystemId = systemId;
  systemSelect.value = systemId;

  loadingIndicator.classList.remove("hidden");
  loadingIndicator.textContent = "Loading…";
  const url = new URL(window.location.href);
  url.searchParams.set("system", systemId);
  window.history.replaceState(null, "", url);

  // Tear down the previous system's live instances before building new
  // ones — components that hold DOM/listeners/raycasting state need to be
  // explicitly disposed, not just replaced, or the old ones leak.
  regionPicker?.dispose();
  labelsOverlay?.dispose();
  viewer.clearBrainRoot();
  clearContainer(panelContainer);
  clearContainer(structureSearchContainer);
  clearContainer(walkthroughContainer);
  clearContainer(quizContainer);
  container.querySelectorAll("#hover-tooltip").forEach((el) => el.remove());
  labelsButton.classList.remove("active");
  tourButton.classList.remove("active");
  quizButton.classList.remove("active");
  selectedRegionId = null;
  regionIndex = null;
  highlighter = null;
  cameraController = null;
  labelsOverlay = null;
  regionPicker = null;
  viewerHint.style.display = "";

  const system = await loadSystemData(systemId);
  appTitle.textContent = `${systemsCatalog[systemId].name} Atlas`;

  panel = new RegionPanel(panelContainer, system.regions, {
    onSelectRelated: (regionId) => selectRegion(regionId, { bestAngle: true }),
    onClose: () => deselectRegion(),
  });
  hoverTooltip = new HoverTooltip(container, system.regions);
  colorLegend.setScheme(system.colorScheme);
  colorLegend.setVisible(false);

  structureSearch = new StructureSearch(structureSearchContainer, system.regions, system.groupOrder, system.groupLabels, {
    onSelect: (regionId) => selectRegion(regionId, { bestAngle: true }),
  });

  walkthrough = new WalkthroughPanel(walkthroughContainer, system.lessons, {
    onStepChange: (regionId) => selectRegion(regionId, { bestAngle: true }),
    onToggle: (open) => tourButton.classList.toggle("active", open),
  });

  quiz = new QuizPanel(quizContainer, system.quizzes, system.regions, {
    onOpenQuestion: () => {},
    onToggle: (open) => quizButton.classList.toggle("active", open),
    onXrayChange: (active) => highlighter?.xray(active),
  });

  try {
    const { root, regionIndex: index } = await loadBrain(system.modelPath, (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        loadingIndicator.textContent = `Loading ${systemsCatalog[systemId].name.toLowerCase()} model… ${pct}%`;
      }
    });

    if (systemId !== currentSystemId) return; // a newer mountSystem() call superseded this one

    viewer.setBrainRoot(root);
    regionIndex = index;
    highlighter = new RegionHighlighter(root, system.colorScheme, system.surfaceRegions);
    cameraController = new CameraController(viewer.camera, viewer.controls);
    cameraController.setSceneScale(root);
    labelsOverlay = new LabelsOverlay(container, regionIndex, system.regions, system.colorScheme, {
      onSelect: (regionId) => selectRegion(regionId, { bestAngle: true }),
      onHoverStart: (regionId) => previewRegion(regionId),
      onHoverEnd: () => clearPreview(),
    });

    regionPicker = new RegionPicker(viewer.camera, viewer.renderer.domElement, root, {
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
    console.info(`${systemsCatalog[systemId].name} loaded: ${regionIndex.size} tagged regions indexed.`);
  } catch (error) {
    loadingIndicator.textContent = "Failed to load model. See console for details.";
    console.error(error);
  }
}

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

viewer.start();
mountSystem(pickInitialSystemId());

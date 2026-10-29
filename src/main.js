import gsap from "gsap";

import { Howl } from "howler";

import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import smokeVertexShader from "./shaders/smoke/vertex.glsl";
import smokeFragmentShader from "./shaders/smoke/fragment.glsl";
import themeVertexShader from "./shaders/theme/vertex.glsl";
import themeFragmentShader from "./shaders/theme/fragment.glsl";

import {
  RENDER_MODE,
  USE_BAKED_TEXTURES,
  MODEL_PATH,
  UNBAKED_CAMERA,
  UNBAKED_LIGHTS,
  UNBAKED_PAN_BOUNDS,
  UNBAKED_ORBIT_LIMITS,
  UI_PALETTE,
} from "./config.js";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  translations,
} from "./i18n.js";

/**  -------------------------- Language setup -------------------------- */
const LANGUAGE_STORAGE_KEY = "victors-portfolio-language";
const languageButtons = document.querySelectorAll(".language-button");
const originalTextByNode = new WeakMap();
let currentLanguage = (() => {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return SUPPORTED_LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
})();
let loadingState = "loading";

const normalizeText = (text) => text.replace(/\s+/g, " ").trim();

const translate = (key) =>
  translations[currentLanguage]?.[key] ??
  translations.en[key] ??
  key;

const findTranslationKey = (normalized) => {
  const dictionary = translations[currentLanguage];
  if (!dictionary) return null;
  return (
    Object.keys(dictionary)
      .filter((key) => !key.startsWith("$") && normalized.startsWith(key))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
};

const applyLanguage = (language) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    language = DEFAULT_LANGUAGE;
  }
  currentLanguage = language;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.documentElement.lang = language;

  const metaLanguage = document.querySelector('meta[name="language"]');
  if (metaLanguage) {
    metaLanguage.content = {
      es: "Spanish",
      pt: "Portuguese",
      en: "English",
    }[language];
  }
  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) {
    ogLocale.content = {
      es: "es_ES",
      pt: "pt_BR",
      en: "en_US",
    }[language];
  }
  document.title = translate("$meta.title");
  const description = document.querySelector(
    'meta[property="og:description"]'
  );
  if (description) {
    description.content = translate("$meta.description");
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (
        parent.closest(
          "script, style, svg, .language-selector, .loading-screen-button, .no-sound-button"
        )
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  for (const node of textNodes) {
    if (!originalTextByNode.has(node)) {
      originalTextByNode.set(node, node.nodeValue);
    }
    const original = originalTextByNode.get(node);
    if (language === "en") {
      node.nodeValue = original;
      continue;
    }
    const key = findTranslationKey(normalizeText(original));
    node.nodeValue = key ? translations[language][key] : original;
  }

  const loadingScreenButton = document.querySelector(
    ".loading-screen-button"
  );
  if (loadingScreenButton) {
    loadingScreenButton.textContent =
      loadingState === "ready"
        ? translate("$loading.enter")
        : loadingState === "entered"
          ? translate("$loading.hello")
          : translate("$loading.loading");
  }
  const noSoundButton = document.querySelector(".no-sound-button");
  if (noSoundButton && loadingState !== "entered") {
    noSoundButton.textContent = translate("$loading.noSound");
  }

  languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === language);
  });
};

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
    buttonSounds.click.play();
  });
});

applyLanguage(currentLanguage);

/**  -------------------------- Audio setup -------------------------- */

// Background Music
let pianoDebounceTimer = null;
let isMusicFaded = false;
const MUSIC_FADE_TIME = 500;
const PIANO_TIMEOUT = 2000;
const BACKGROUND_MUSIC_VOLUME = 1;
const FADED_VOLUME = 0;

const backgroundMusic = new Howl({
  src: ["/audio/music/cosmic_candy.ogg"],
  loop: true,
  volume: 1,
});

const fadeOutBackgroundMusic = () => {
  if (!isMuted && !isMusicFaded) {
    backgroundMusic.fade(
      backgroundMusic.volume(),
      FADED_VOLUME,
      MUSIC_FADE_TIME
    );
    isMusicFaded = true;
  }
};

const fadeInBackgroundMusic = () => {
  if (!isMuted && isMusicFaded) {
    backgroundMusic.fade(
      FADED_VOLUME,
      BACKGROUND_MUSIC_VOLUME,
      MUSIC_FADE_TIME
    );
    isMusicFaded = false;
  }
};

// Piano
const pianoKeyMap = {
  C1_Key: "Key_24",
  "C#1_Key": "Key_23",
  D1_Key: "Key_22",
  "D#1_Key": "Key_21",
  E1_Key: "Key_20",
  F1_Key: "Key_19",
  "F#1_Key": "Key_18",
  G1_Key: "Key_17",
  "G#1_Key": "Key_16",
  A1_Key: "Key_15",
  "A#1_Key": "Key_14",
  B1_Key: "Key_13",
  C2_Key: "Key_12",
  "C#2_Key": "Key_11",
  D2_Key: "Key_10",
  "D#2_Key": "Key_9",
  E2_Key: "Key_8",
  F2_Key: "Key_7",
  "F#2_Key": "Key_6",
  G2_Key: "Key_5",
  "G#2_Key": "Key_4",
  A2_Key: "Key_3",
  "A#2_Key": "Key_2",
  B2_Key: "Key_1",
};

const pianoSounds = {};

Object.values(pianoKeyMap).forEach((soundKey) => {
  pianoSounds[soundKey] = new Howl({
    src: [`/audio/sfx/piano/${soundKey}.ogg`],
    preload: true,
    volume: 0.5,
  });
});

// Button
const buttonSounds = {
  click: new Howl({
    src: ["/audio/sfx/click/bubble.ogg"],
    preload: true,
    volume: 0.5,
  }),
};

/**  -------------------------- Scene setup -------------------------- */
const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(UI_PALETTE.periwinkle);

const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  200
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// El modo sin bake no tiene luz horneada, así que iluminamos la escena.
let unbakedLighting = null;
if (!USE_BAKED_TEXTURES) {
  const day = UNBAKED_LIGHTS.day;

  const ambientLight = new THREE.AmbientLight(0xffffff, day.ambient);
  const hemisphereLight = new THREE.HemisphereLight(
    0xffffff,
    UI_PALETTE.slate,
    day.hemisphere
  );

  const sunLight = new THREE.DirectionalLight(UNBAKED_LIGHTS.sunColor, day.sun);
  sunLight.position.fromArray(UNBAKED_LIGHTS.sunPosition);
  sunLight.target.position.set(0, 0, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 120;
  sunLight.shadow.camera.left = -40;
  sunLight.shadow.camera.right = 40;
  sunLight.shadow.camera.top = 40;
  sunLight.shadow.camera.bottom = -40;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const lampLight = new THREE.PointLight(
    new THREE.Color(UNBAKED_LIGHTS.lamp.color),
    day.lamp,
    40,
    2
  );
  lampLight.position.fromArray(UNBAKED_LIGHTS.lamp.position);

  scene.add(ambientLight, hemisphereLight, sunLight, sunLight.target, lampLight);

  scene.background = new THREE.Color(day.background);
  // Neutral tone mapping preserva mejor los colores fríos de la paleta;
  // ACES viraba los lavandas hacia un gris rosado.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.1;

  unbakedLighting = {
    ambient: ambientLight,
    hemisphere: hemisphereLight,
    sun: sunLight,
    lamp: lampLight,
  };
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 45;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.update();

//Set starting camera position
if (USE_BAKED_TEXTURES) {
  if (window.innerWidth < 768) {
    camera.position.set(
      29.567116827654726,
      14.018476147584705,
      31.37040363900147
    );
    controls.target.set(
      -0.08206262548844094,
      3.3119233527087255,
      -0.7433922282864018
    );
  } else {
    camera.position.set(
      17.49173098423395,
      9.108969527553887,
      17.850992894238058
    );
    controls.target.set(
      0.4624746759408973,
      1.9719940043010387,
      -0.8300979125494505
    );
  }
} else {
  camera.position.fromArray(UNBAKED_CAMERA.position);
  controls.target.fromArray(UNBAKED_CAMERA.target);
  controls.minDistance = UNBAKED_ORBIT_LIMITS.minDistance;
  controls.maxDistance = UNBAKED_ORBIT_LIMITS.maxDistance;
  controls.minPolarAngle = UNBAKED_ORBIT_LIMITS.minPolarAngle;
  controls.maxPolarAngle = UNBAKED_ORBIT_LIMITS.maxPolarAngle;
  controls.minAzimuthAngle = UNBAKED_ORBIT_LIMITS.minAzimuthAngle;
  controls.maxAzimuthAngle = UNBAKED_ORBIT_LIMITS.maxAzimuthAngle;
  controls.minPan.fromArray(UNBAKED_PAN_BOUNDS.min);
  controls.maxPan.fromArray(UNBAKED_PAN_BOUNDS.max);
}

let cameraDebugUpdate = null;

const setupCameraDebug = () => {
  const initialPosition = camera.position.clone();
  const initialTarget = controls.target.clone();
  const defaultLimits = {
    minDistance: controls.minDistance,
    maxDistance: controls.maxDistance,
    minPolarAngle: controls.minPolarAngle,
    maxPolarAngle: controls.maxPolarAngle,
    minAzimuthAngle: controls.minAzimuthAngle,
    maxAzimuthAngle: controls.maxAzimuthAngle,
    minPan: controls.minPan.clone(),
    maxPan: controls.maxPan.clone(),
  };

  const style = document.createElement("style");
  style.textContent = `
    .camera-debug {
      position: fixed;
      top: 84px;
      left: 12px;
      z-index: 9999;
      width: 280px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      padding: 12px 14px;
      border-radius: 12px;
      background: rgba(18, 41, 95, 0.92);
      color: rgb(173, 180, 228);
      font-family: system-ui, sans-serif;
      font-size: 12px;
      line-height: 1.3;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      user-select: none;
    }
    .camera-debug .cd-title {
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 700;
      color: rgb(159, 165, 213);
    }
    .camera-debug .cd-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      cursor: pointer;
    }
    .camera-debug .cd-group {
      margin-bottom: 10px;
    }
    .camera-debug .cd-group-title {
      margin-bottom: 4px;
      font-weight: 600;
      color: rgb(159, 165, 213);
    }
    .camera-debug .cd-row {
      display: grid;
      grid-template-columns: 16px 1fr 62px;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .camera-debug .cd-row span {
      text-align: center;
      opacity: 0.85;
    }
    .camera-debug input[type="range"] {
      width: 100%;
      accent-color: rgb(180, 60, 228);
    }
    .camera-debug input[type="number"] {
      width: 100%;
      padding: 2px 4px;
      border: 1px solid rgba(173, 180, 228, 0.4);
      border-radius: 4px;
      background: rgba(18, 41, 95, 0.6);
      color: inherit;
      font: inherit;
    }
    .camera-debug .cd-actions {
      display: flex;
      gap: 6px;
      margin: 8px 0;
    }
    .camera-debug button {
      flex: 1;
      padding: 6px 8px;
      border: none;
      border-radius: 6px;
      background: rgb(180, 60, 228);
      color: rgb(243, 236, 247);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .camera-debug button:hover {
      background: rgb(173, 180, 228);
      color: rgb(43, 46, 84);
    }
    .camera-debug .cd-output {
      margin: 0;
      padding: 8px;
      border-radius: 6px;
      background: rgba(18, 41, 95, 0.6);
      color: rgb(159, 165, 213);
      font-family: ui-monospace, monospace;
      font-size: 11px;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement("div");
  panel.className = "camera-debug";

  const title = document.createElement("div");
  title.className = "cd-title";
  title.textContent = "Cámara (debug)";
  panel.appendChild(title);

  const limitLabel = document.createElement("label");
  limitLabel.className = "cd-toggle";
  const limitCheckbox = document.createElement("input");
  limitCheckbox.type = "checkbox";
  limitLabel.append(
    limitCheckbox,
    document.createTextNode(" Respetar límites de órbita")
  );
  panel.appendChild(limitLabel);

  const applyLimits = (enabled) => {
    if (enabled) {
      controls.minDistance = defaultLimits.minDistance;
      controls.maxDistance = defaultLimits.maxDistance;
      controls.minPolarAngle = defaultLimits.minPolarAngle;
      controls.maxPolarAngle = defaultLimits.maxPolarAngle;
      controls.minAzimuthAngle = defaultLimits.minAzimuthAngle;
      controls.maxAzimuthAngle = defaultLimits.maxAzimuthAngle;
      controls.minPan.copy(defaultLimits.minPan);
      controls.maxPan.copy(defaultLimits.maxPan);
    } else {
      controls.minDistance = 0.1;
      controls.maxDistance = Infinity;
      controls.minPolarAngle = -Infinity;
      controls.maxPolarAngle = Infinity;
      controls.minAzimuthAngle = -Infinity;
      controls.maxAzimuthAngle = Infinity;
      controls.minPan.set(-Infinity, -Infinity, -Infinity);
      controls.maxPan.set(Infinity, Infinity, Infinity);
    }
  };

  limitCheckbox.addEventListener("change", () => {
    applyLimits(limitCheckbox.checked);
    controls.update();
  });

  const fmt = (value) => Math.round(value * 1000) / 1000;
  const rows = [];

  const makeGroup = (label, getVec, onChange) => {
    const group = document.createElement("div");
    group.className = "cd-group";

    const heading = document.createElement("div");
    heading.className = "cd-group-title";
    heading.textContent = label;
    group.appendChild(heading);

    ["x", "y", "z"].forEach((axis) => {
      const row = document.createElement("label");
      row.className = "cd-row";

      const name = document.createElement("span");
      name.textContent = axis.toUpperCase();

      const range = document.createElement("input");
      range.type = "range";
      range.min = -120;
      range.max = 120;
      range.step = 0.1;

      const num = document.createElement("input");
      num.type = "number";
      num.step = "any";
      num.inputMode = "decimal";

      const setValue = (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return;
        getVec()[axis] = parsed;
        range.value = parsed;
        num.value = fmt(parsed);
        if (onChange) onChange();
      };

      range.addEventListener("input", () => setValue(range.value));
      num.addEventListener("input", () => setValue(num.value));

      row.append(name, range, num);
      group.appendChild(row);

      rows.push({ getVec, axis, range, num });
    });

    panel.appendChild(group);
  };

  makeGroup("Posición", () => camera.position, () => controls.update());
  makeGroup("Target", () => controls.target, () => controls.update());

  if (unbakedLighting?.sun) {
    makeGroup(
      "Sol",
      () => unbakedLighting.sun.position,
      () => {
        renderer.shadowMap.needsUpdate = true;
      }
    );
  }

  if (unbakedLighting?.lamp) {
    makeGroup("Luz escritorio", () => unbakedLighting.lamp.position);
  }

  const autoBtn = document.createElement("button");
  autoBtn.type = "button";
  autoBtn.textContent = "Auto diagonal";
  autoBtn.addEventListener("click", () => {
    const root = window.__portfolioDebug?.glb?.scene ?? scene;
    const box = new THREE.Box3();
    const temp = new THREE.Box3();
    root.updateWorldMatrix(true, true);
    root.traverse((object) => {
      if (!object.isMesh || !object.geometry) return;
      temp.setFromObject(object);
      const objectSize = temp.getSize(new THREE.Vector3());
      if (objectSize.x > 50 || objectSize.y > 50 || objectSize.z > 50) {
        return;
      }
      box.union(temp);
    });

    if (box.isEmpty()) return;
    const boxSize = box.getSize(new THREE.Vector3());
    if (boxSize.x < 5 && boxSize.z < 5) return;

    const center = box.getCenter(new THREE.Vector3());
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const tanV = Math.tan(vFov / 2);
    const tanH = tanV * camera.aspect;
    const horizontalExtent = (boxSize.x + boxSize.z) / Math.SQRT2;
    const distanceH = horizontalExtent / 2 / tanH;
    const distanceV = boxSize.y / 2 / tanV;
    const distance = Math.max(distanceH, distanceV) * 1.1;

    controls.target.copy(center);
    camera.position
      .copy(center)
      .addScaledVector(new THREE.Vector3(0.8, 0.5, 1).normalize(), distance);
    controls.update();
    cameraDebugUpdate(true);
  });

  const autoWrap = document.createElement("div");
  autoWrap.className = "cd-actions";
  autoWrap.appendChild(autoBtn);
  panel.appendChild(autoWrap);

  const actions = document.createElement("div");
  actions.className = "cd-actions";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.textContent = "Copiar config";
  copyBtn.addEventListener("click", async () => {
    const p = camera.position;
    const t = controls.target;
    const sun = unbakedLighting?.sun?.position;
    const lamp = unbakedLighting?.lamp;
    let snippet =
      `export const UNBAKED_CAMERA = {\n` +
      `  position: [${fmt(p.x)}, ${fmt(p.y)}, ${fmt(p.z)}],\n` +
      `  target: [${fmt(t.x)}, ${fmt(t.y)}, ${fmt(t.z)}],\n` +
      `};`;

    const lightLines = [];
    if (sun) {
      lightLines.push(
        `sunPosition: [${fmt(sun.x)}, ${fmt(sun.y)}, ${fmt(sun.z)}],`
      );
    }
    if (lamp) {
      const lp = lamp.position;
      lightLines.push(
        `lamp: {\n` +
          `  position: [${fmt(lp.x)}, ${fmt(lp.y)}, ${fmt(lp.z)}],\n` +
          `  color: "#${lamp.color.getHexString()}",\n` +
          `},`
      );
    }
    if (lightLines.length) {
      snippet += `\n\n// dentro de UNBAKED_LIGHTS:\n` + lightLines.join("\n");
    }

    try {
      await navigator.clipboard.writeText(snippet);
      copyBtn.textContent = "¡Copiado!";
    } catch (error) {
      copyBtn.textContent = "Mira la consola";
    }

    console.log(snippet);

    window.setTimeout(() => {
      copyBtn.textContent = "Copiar config";
    }, 1500);
  });

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.textContent = "Reset";
  resetBtn.addEventListener("click", () => {
    camera.position.copy(initialPosition);
    controls.target.copy(initialTarget);
    controls.update();
    cameraDebugUpdate(true);
  });

  actions.append(copyBtn, resetBtn);
  panel.appendChild(actions);

  const output = document.createElement("pre");
  output.className = "cd-output";
  panel.appendChild(output);

  const isEditing = (element) =>
    document.activeElement === element &&
    (element.type === "number" || element.matches(":active"));

  const refresh = (force = false) => {
    rows.forEach(({ getVec, axis, range, num }) => {
      if (force || (!isEditing(range) && !isEditing(num))) {
        range.value = getVec()[axis];
        num.value = fmt(getVec()[axis]);
      }
    });

    const p = camera.position;
    const t = controls.target;
    output.textContent =
      `position: [${fmt(p.x)}, ${fmt(p.y)}, ${fmt(p.z)}]\n` +
      `target:   [${fmt(t.x)}, ${fmt(t.y)}, ${fmt(t.z)}]`;
  };

  cameraDebugUpdate = refresh;

  document.body.appendChild(panel);
  applyLimits(false);
  cameraDebugUpdate(true);
};

const ENABLE_CAMERA_DEBUG = false;

if (import.meta.env.DEV && ENABLE_CAMERA_DEBUG) {
  setupCameraDebug();
}

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update Camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**  -------------------------- Modal Stuff -------------------------- */
const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact"),
};

const overlay = document.querySelector(".overlay");

let touchHappened = false;
overlay.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();
    const modal = document.querySelector('.modal[style*="display: block"]');
    if (modal) hideModal(modal);
  },
  { passive: false }
);

overlay.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();
    const modal = document.querySelector('.modal[style*="display: block"]');
    if (modal) hideModal(modal);
  },
  { passive: false }
);

document.querySelectorAll(".modal-exit-button").forEach((button) => {
  function handleModalExit(e) {
    e.preventDefault();
    const modal = e.target.closest(".modal");

    gsap.to(button, {
      scale: 5,
      duration: 0.5,
      ease: "back.out(2)",
      onStart: () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.5,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.set(button, {
              clearProps: "all",
            });
          },
        });
      },
    });

    buttonSounds.click.play();
    hideModal(modal);
  }

  button.addEventListener(
    "touchend",
    (e) => {
      touchHappened = true;
      handleModalExit(e);
    },
    { passive: false }
  );

  button.addEventListener(
    "click",
    (e) => {
      if (touchHappened) return;
      handleModalExit(e);
    },
    { passive: false }
  );
});

let isModalOpen = true;

const showModal = (modal) => {
  modal.style.display = "block";
  overlay.style.display = "block";

  isModalOpen = true;
  controls.enabled = false;

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }
  document.body.style.cursor = "default";
  currentIntersects = [];

  gsap.set(modal, {
    opacity: 0,
    scale: 0,
  });
  gsap.set(overlay, {
    opacity: 0,
  });

  gsap.to(overlay, {
    opacity: 1,
    duration: 0.5,
  });

  gsap.to(modal, {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    ease: "back.out(2)",
  });
};

const hideModal = (modal) => {
  isModalOpen = false;
  controls.enabled = true;

  gsap.to(overlay, {
    opacity: 0,
    duration: 0.5,
  });

  gsap.to(modal, {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    ease: "back.in(2)",
    onComplete: () => {
      modal.style.display = "none";
      overlay.style.display = "none";
    },
  });
};

/**  -------------------------- Loading Screen & Intro Animation -------------------------- */

const manager = new THREE.LoadingManager();

const loadingScreen = document.querySelector(".loading-screen");
const loadingScreenButton = document.querySelector(".loading-screen-button");
const noSoundButton = document.querySelector(".no-sound-button");

manager.onLoad = function () {
  loadingScreenButton.style.border = `8px solid ${UI_PALETTE.slate}`;
  loadingScreenButton.style.background = UI_PALETTE.midnight;
  loadingScreenButton.style.color = UI_PALETTE.periwinkle;
  loadingScreenButton.style.boxShadow = `rgba(0, 0, 0, 0.24) 0px 3px 8px`;
  loadingState = "ready";
  loadingScreenButton.textContent = translate("$loading.enter");
  loadingScreenButton.style.cursor = "pointer";
  loadingScreenButton.style.transition =
    "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
  let isDisabled = false;

  noSoundButton.textContent = translate("$loading.noSound");

  function handleEnter(withSound = true) {
    if (isDisabled) return;

    loadingState = "entered";
    noSoundButton.textContent = "";
    loadingScreenButton.style.cursor = "default";
    loadingScreenButton.style.border = `8px solid ${UI_PALETTE.slate}`;
    loadingScreenButton.style.background = UI_PALETTE.periwinkle;
    loadingScreenButton.style.color = UI_PALETTE.midnight;
    loadingScreenButton.style.boxShadow = "none";
    loadingScreenButton.textContent = translate("$loading.hello");
    loadingScreen.style.background = UI_PALETTE.periwinkle;
    isDisabled = true;

    toggleFavicons();

    if (!withSound) {
      isMuted = true;
      updateMuteState(true);

      soundOnSvg.style.display = "none";
      soundOffSvg.style.display = "block";
    } else {
      backgroundMusic.play();
    }

    playReveal();
  }

  loadingScreenButton.addEventListener("mouseenter", () => {
    loadingScreenButton.style.transform = "scale(1.3)";
  });

  loadingScreenButton.addEventListener("touchend", (e) => {
    touchHappened = true;
    e.preventDefault();
    handleEnter();
  });

  loadingScreenButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter(true);
  });

  loadingScreenButton.addEventListener("mouseleave", () => {
    loadingScreenButton.style.transform = "none";
  });

  noSoundButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter(false);
  });
};

function playReveal() {
  const tl = gsap.timeline();

  tl.to(loadingScreen, {
    scale: 0.5,
    duration: 1.2,
    delay: 0.25,
    ease: "back.in(1.8)",
  }).to(
    loadingScreen,
    {
      y: "200vh",
      transform: "perspective(1000px) rotateX(45deg) rotateY(-35deg)",
      duration: 1.2,
      ease: "back.in(1.8)",
      onComplete: () => {
        isModalOpen = false;
        if (USE_BAKED_TEXTURES) {
          playIntroAnimation();
        } else {
          createDelayedHitboxes();
        }
        loadingScreen.remove();
      },
    },
    "-=0.1"
  );
}

function playIntroAnimation() {
  const t1 = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  t1.timeScale(0.8);

  t1.to(plank1.scale, {
    x: 1,
    y: 1,
  })
    .to(
      plank2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      workBtn.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    )
    .to(
      aboutBtn.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    )
    .to(
      contactBtn.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    );

  const tFrames = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFrames.timeScale(0.8);

  tFrames
    .to(frame1.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      frame2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      frame3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const t2 = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  t2.timeScale(0.8);

  t2.to(boba.scale, {
    z: 1,
    y: 1,
    x: 1,
    delay: 0.4,
  })
    .to(
      github.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      youtube.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    )
    .to(
      twitter.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.6"
    );

  const tFlowers = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFlowers.timeScale(0.8);

  tFlowers
    .to(flower5.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      flower4.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      flower3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      flower2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      flower1.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tBoxes = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tBoxes.timeScale(0.8);

  tBoxes
    .to(box1.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      box2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      box3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tLamp = gsap.timeline({
    defaults: {
      duration: 0.8,
      delay: 0.2,
      ease: "back.out(1.8)",
    },
  });
  tLamp.timeScale(0.8);

  tLamp.to(lamp.scale, {
    x: 1,
    y: 1,
    z: 1,
  });

  const tSlippers = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tSlippers.timeScale(0.8);

  tSlippers
    .to(slippers1.scale, {
      x: 1,
      y: 1,
      z: 1,
      delay: 0.5,
    })
    .to(
      slippers2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tEggs = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tEggs.timeScale(0.8);

  tEggs
    .to(egg1.scale, {
      x: 1,
      y: 1,
      z: 1,
    })
    .to(
      egg2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    )
    .to(
      egg3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
      },
      "-=0.5"
    );

  const tFish = gsap.timeline({
    defaults: {
      delay: 0.8,
      duration: 0.8,
      ease: "back.out(1.8)",
    },
  });
  tFish.timeScale(0.8);

  tFish.to(fish.scale, {
    x: 1,
    y: 1,
    z: 1,
  });

  const lettersTl = gsap.timeline({
    defaults: {
      duration: 0.8,
      ease: "back.out(1.7)",
    },
  });
  lettersTl.timeScale(0.8);

  lettersTl
    .to(letter1.position, {
      y: letter1.userData.initialPosition.y + 0.3,
      duration: 0.4,
      ease: "back.out(1.8)",
      delay: 0.25,
    })
    .to(
      letter1.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter1.position,
      {
        y: letter1.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter2.position,
      {
        y: letter2.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter2.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter2.position,
      {
        y: letter2.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter3.position,
      {
        y: letter3.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter3.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter3.position,
      {
        y: letter3.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter4.position,
      {
        y: letter4.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter4.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter4.position,
      {
        y: letter4.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter5.position,
      {
        y: letter5.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter5.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter5.position,
      {
        y: letter5.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter6.position,
      {
        y: letter6.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter6.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter6.position,
      {
        y: letter6.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter7.position,
      {
        y: letter7.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter7.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter7.position,
      {
        y: letter7.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    )

    .to(
      letter8.position,
      {
        y: letter8.userData.initialPosition.y + 0.3,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "-=0.5"
    )
    .to(
      letter8.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      "<"
    )
    .to(
      letter8.position,
      {
        y: letter8.userData.initialPosition.y,
        duration: 0.4,
        ease: "back.out(1.8)",
      },
      ">-0.2"
    );

  const pianoKeysTl = gsap.timeline({
    defaults: {
      duration: 0.4,
      ease: "back.out(1.7)",
      onComplete: () => {
        setTimeout(() => {
          createDelayedHitboxes();
        }, 1950);
      },
    },
  });
  pianoKeysTl.timeScale(1.2);

  const pianoKeys = [
    C1_Key,
    Cs1_Key,
    D1_Key,
    Ds1_Key,
    E1_Key,
    F1_Key,
    Fs1_Key,
    G1_Key,
    Gs1_Key,
    A1_Key,
    As1_Key,
    B1_Key,
    C2_Key,
    Cs2_Key,
    D2_Key,
    Ds2_Key,
    E2_Key,
    F2_Key,
    Fs2_Key,
    G2_Key,
    Gs2_Key,
    A2_Key,
    As2_Key,
    B2_Key,
  ];

  pianoKeys.forEach((key, index) => {
    pianoKeysTl
      .to(
        key.position,
        {
          y: key.userData.initialPosition.y + 0.2,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        index * 0.1
      )
      .to(
        key.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        "<"
      )
      .to(
        key.position,
        {
          y: key.userData.initialPosition.y,
          duration: 0.4,
          ease: "back.out(1.8)",
        },
        ">-0.2"
      );
  });
}

/**  -------------------------- Loaders & Texture Preparations -------------------------- */
const textureLoader = new THREE.TextureLoader();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const loader = new GLTFLoader(manager);
loader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
  .setPath("textures/skybox/")
  .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);

const textureMap = {
  First: {
    day: "/textures/room/day/first_texture_set_day.webp",
    night: "/textures/room/night/first_texture_set_night.webp",
  },
  Second: {
    day: "/textures/room/day/second_texture_set_day.webp",
    night: "/textures/room/night/second_texture_set_night.webp",
  },
  Third: {
    day: "/textures/room/day/third_texture_set_day.webp",
    night: "/textures/room/night/third_texture_set_night.webp",
  },
  Fourth: {
    day: "/textures/room/day/fourth_texture_set_day.webp",
    night: "/textures/room/night/fourth_texture_set_night.webp",
  },
};

const loadedTextures = {
  day: {},
  night: {},
};

if (USE_BAKED_TEXTURES) {
  Object.entries(textureMap).forEach(([key, paths]) => {
    // Load and configure day texture
    const dayTexture = textureLoader.load(paths.day);
    dayTexture.flipY = false;
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    dayTexture.minFilter = THREE.LinearFilter;
    dayTexture.magFilter = THREE.LinearFilter;
    loadedTextures.day[key] = dayTexture;

    // Load and configure night texture
    const nightTexture = textureLoader.load(paths.night);
    nightTexture.flipY = false;
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    nightTexture.minFilter = THREE.LinearFilter;
    nightTexture.magFilter = THREE.LinearFilter;
    loadedTextures.night[key] = nightTexture;
  });
}

// Reuseable Materials
const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  opacity: 1,
  color: 0xfbfbfb,
  metalness: 0,
  roughness: 0,
  ior: 3,
  thickness: 0.01,
  specularIntensity: 1,
  envMap: environmentMap,
  envMapIntensity: 1,
  depthWrite: false,
  specularColor: 0xfbfbfb,
});

const whiteMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

const createMaterialForTextureSet = (textureSet) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uDayTexture1: { value: loadedTextures.day.First },
      uNightTexture1: { value: loadedTextures.night.First },
      uDayTexture2: { value: loadedTextures.day.Second },
      uNightTexture2: { value: loadedTextures.night.Second },
      uDayTexture3: { value: loadedTextures.day.Third },
      uNightTexture3: { value: loadedTextures.night.Third },
      uDayTexture4: { value: loadedTextures.day.Fourth },
      uNightTexture4: { value: loadedTextures.night.Fourth },
      uMixRatio: { value: 0 },
      uTextureSet: { value: textureSet },
    },
    vertexShader: themeVertexShader,
    fragmentShader: themeFragmentShader,
  });

  Object.entries(material.uniforms).forEach(([key, uniform]) => {
    if (uniform.value instanceof THREE.Texture) {
      uniform.value.minFilter = THREE.LinearFilter;
      uniform.value.magFilter = THREE.LinearFilter;
    }
  });

  return material;
};

const roomMaterials = USE_BAKED_TEXTURES
  ? {
      First: createMaterialForTextureSet(1),
      Second: createMaterialForTextureSet(2),
      Third: createMaterialForTextureSet(3),
      Fourth: createMaterialForTextureSet(4),
    }
  : {};

// Smoke Shader setup
const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
smokeGeometry.translate(0, 0.5, 0);
smokeGeometry.scale(0.33, 1, 0.33);

const perlinTexture = textureLoader.load("/shaders/perlin.png");
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;

const smokeMaterial = new THREE.ShaderMaterial({
  vertexShader: smokeVertexShader,
  fragmentShader: smokeFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uPerlinTexture: new THREE.Uniform(perlinTexture),
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
});

const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
smoke.position.y = 1.83;
scene.add(smoke);

const videoElement = document.createElement("video");
videoElement.src = "/textures/video/Screen.mp4";
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.autoplay = true;
videoElement.play();

const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.flipY = false;

/**  -------------------------- Model and Mesh Setup -------------------------- */

// LOL DO NOT DO THIS USE A FUNCTION TO AUTOMATE THIS PROCESS HAHAHAAHAHAHAHAHAHA
let fish;
let coffeePosition;
let hourHand;
let minuteHand;
let chairTop;
const xAxisFans = [];
const yAxisFans = [];
let plank1,
  plank2,
  workBtn,
  aboutBtn,
  contactBtn,
  boba,
  github,
  youtube,
  twitter;

let letter1, letter2, letter3, letter4, letter5, letter6, letter7, letter8;

let C1_Key,
  Cs1_Key,
  D1_Key,
  Ds1_Key,
  E1_Key,
  F1_Key,
  Fs1_Key,
  G1_Key,
  Gs1_Key,
  A1_Key,
  As1_Key,
  B1_Key;
let C2_Key,
  Cs2_Key,
  D2_Key,
  Ds2_Key,
  E2_Key,
  F2_Key,
  Fs2_Key,
  G2_Key,
  Gs2_Key,
  A2_Key,
  As2_Key,
  B2_Key;

let flower1, flower2, flower3, flower4, flower5;

let box1, box2, box3;

let lamp;

let slippers1, slippers2;

let egg1, egg2, egg3;

let frame1, frame2, frame3;

const useOriginalMeshObjects = ["Bulb", "Cactus", "Kirby"];

const objectsNeedingHitboxes = [];

const objectsWithIntroAnimations = [
  "Hanging_Plank_1",
  "Hanging_Plank_2",
  "My_Work_Button",
  "About_Button",
  "Contact_Button",
  "Boba",
  "GitHub",
  "YouTube",
  "Twitter",
  "Name_Letter_1",
  "Name_Letter_2",
  "Name_Letter_3",
  "Name_Letter_4",
  "Name_Letter_5",
  "Name_Letter_6",
  "Name_Letter_7",
  "Name_Letter_8",
  "Flower_1",
  "Flower_2",
  "Flower_3",
  "Flower_4",
  "Flower_5",
  "Box_1",
  "Box_2",
  "Box_3",
  "Lamp",
  "Slipper_1",
  "Slipper_2",
  "Fish_Fourth",
  "Egg_1",
  "Egg_2",
  "Egg_3",
  "Frame_1",
  "Frame_2",
  "Frame_3",
  "C1_Key",
  "C#1_Key",
  "D1_Key",
  "D#1_Key",
  "E1_Key",
  "F1_Key",
  "F#1_Key",
  "G1_Key",
  "G#1_Key",
  "A1_Key",
  "A#1_Key",
  "B1_Key",
  "C2_Key",
  "C#2_Key",
  "D2_Key",
  "D#2_Key",
  "E2_Key",
  "F2_Key",
  "F#2_Key",
  "G2_Key",
  "G#2_Key",
  "A2_Key",
  "A#2_Key",
  "B2_Key",
];

function hasIntroAnimation(objectName) {
  return objectsWithIntroAnimations.some((animatedName) =>
    objectName.includes(animatedName)
  );
}
//carga el modelo

loader.load(MODEL_PATH, (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      if (child.name.includes("Fish_Fourth")) {
        fish = child;
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
      }
      if (child.name.includes("Chair_Top")) {
        chairTop = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Hour_Hand")) {
        hourHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Minute_Hand")) {
        minuteHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("Coffee")) {
        coffeePosition = child.position.clone();
      } else if (
        !USE_BAKED_TEXTURES &&
        child.name.toLowerCase().includes("taza")
      ) {
        coffeePosition = child.getWorldPosition(new THREE.Vector3());
      }

      if (child.name.includes("Hover") || child.name.includes("Key")) {
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (USE_BAKED_TEXTURES) {
        // LOL DO NOT DO THIS USE A FUNCTION TO AUTOMATE THIS PROCESS HAHAHAAHAHAHAHAHAHA
        if (child.name.includes("Hanging_Plank_1")) {
        plank1 = child;
        child.scale.set(0, 0, 1);
      } else if (child.name.includes("Hanging_Plank_2")) {
        plank2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("My_Work_Button")) {
        workBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("About_Button")) {
        aboutBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Contact_Button")) {
        contactBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Boba")) {
        boba = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("GitHub")) {
        github = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("YouTube")) {
        youtube = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Twitter")) {
        twitter = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_1")) {
        letter1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_2")) {
        letter2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_3")) {
        letter3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_4")) {
        letter4 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_5")) {
        letter5 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_6")) {
        letter6 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_7")) {
        letter7 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Name_Letter_8")) {
        letter8 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_1")) {
        flower1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_2")) {
        flower2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_3")) {
        flower3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_4")) {
        flower4 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Flower_5")) {
        flower5 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Box_1")) {
        box1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Box_2")) {
        box2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Box_3")) {
        box3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Lamp")) {
        lamp = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Slipper_1")) {
        slippers1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Slipper_2")) {
        slippers2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Fish_Fourth")) {
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Egg_1")) {
        egg1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Egg_2")) {
        egg2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Egg_3")) {
        egg3 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Frame_1")) {
        frame1 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Frame_2")) {
        frame2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Frame_3")) {
        frame3 = child;
        child.scale.set(0, 0, 0);
      }
        Object.keys(pianoKeyMap).forEach((keyName) => {
          if (child.name.includes(keyName)) {
            const varName = keyName.replace("#", "s").split("_")[0] + "_Key";
            eval(`${varName} = child`);
            child.scale.set(0, 0, 0);
            child.userData.initialPosition = new THREE.Vector3().copy(
              child.position
            );
          }
        });
      }

      if (USE_BAKED_TEXTURES) {
        if (child.name.includes("Water")) {
          child.material = new THREE.MeshBasicMaterial({
            color: 0x558bc8,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
          });
        } else if (child.name.includes("Glass")) {
          child.material = glassMaterial;
        } else if (child.name.includes("Bubble")) {
          child.material = whiteMaterial;
        } else if (child.name.includes("Screen")) {
          child.material = new THREE.MeshBasicMaterial({
            map: videoTexture,
            transparent: true,
            opacity: 0.9,
          });
        } else {
          Object.keys(textureMap).forEach((key) => {
            if (child.name.includes(key)) {
              child.material = roomMaterials[key];

              if (child.name.includes("Fan")) {
                if (
                  child.name.includes("Fan_2") ||
                  child.name.includes("Fan_4")
                ) {
                  xAxisFans.push(child);
                } else {
                  yAxisFans.push(child);
                }
              }
            }
          });
        }
      } else {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        const isTransparent = materials.some(
          (material) =>
            material &&
            (material.transparent || (material.transmission || 0) > 0)
        );
        const isBackdrop = materials.some(
          (material) => material && material.name.includes("Backdrop")
        );

        child.castShadow = !isTransparent && !isBackdrop;
        child.receiveShadow = !isTransparent;
      }

      if (child.name.includes("Raycaster")) {
        if (hasIntroAnimation(child.name)) {
          // Create a hitbox for object after intro is done playing,
          // Set an original scale first for the hitbox
          child.userData.originalScale = new THREE.Vector3(1, 1, 1);

          objectsNeedingHitboxes.push(child);
        } else {
          // Create immediate hitboxes/meshes for objects that DON'T have an intro animation
          const raycastObject = createStaticHitbox(child);

          if (raycastObject !== child) {
            scene.add(raycastObject);
          }

          raycasterObjects.push(raycastObject);
          hitboxToObjectMap.set(raycastObject, child);
        }
      }
    }
  });

  if (coffeePosition) {
    smoke.position.set(
      coffeePosition.x,
      coffeePosition.y + 0.2,
      coffeePosition.z
    );
  } else if (!USE_BAKED_TEXTURES) {
    smoke.visible = false;
  }

  scene.add(glb.scene);

  if (!USE_BAKED_TEXTURES) {
    window.__portfolioDebug = { scene, glb, camera };
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
  }

  console.info(`[portfolio] Modelo cargado (${RENDER_MODE}): ${MODEL_PATH}`);
}, undefined, (error) => {
  console.error("[portfolio] No se pudo cargar el modelo", error);
  loadingScreenButton.textContent = translate("$loading.error");
  loadingScreenButton.style.cursor = "default";
});

/**  -------------------------- Raycaster setup -------------------------- */

const raycasterObjects = [];
let currentIntersects = [];
let currentHoveredObject = null;

const socialLinks = {
  GitHub: "https://github.com/andrewwoan/sooahkimsfolio",
  YouTube: "https://youtu.be/AB6sulUMRGE",
  Twitter: "https://www.twitter.com/",
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const hitboxToObjectMap = new Map();

function shouldUseOriginalMesh(objectName) {
  return useOriginalMeshObjects.some((meshName) =>
    objectName.includes(meshName)
  );
}

function createStaticHitbox(originalObject) {
  // Check if we should use original mesh
  if (shouldUseOriginalMesh(originalObject.name)) {
    if (!originalObject.userData.initialScale) {
      originalObject.userData.initialScale = new THREE.Vector3().copy(
        originalObject.scale
      );
    }
    if (!originalObject.userData.initialPosition) {
      originalObject.userData.initialPosition = new THREE.Vector3().copy(
        originalObject.position
      );
    }
    if (!originalObject.userData.initialRotation) {
      originalObject.userData.initialRotation = new THREE.Euler().copy(
        originalObject.rotation
      );
    }

    originalObject.userData.originalObject = originalObject;
    return originalObject;
  }

  if (!originalObject.userData.initialScale) {
    originalObject.userData.initialScale = new THREE.Vector3().copy(
      originalObject.scale
    );
  }
  if (!originalObject.userData.initialPosition) {
    originalObject.userData.initialPosition = new THREE.Vector3().copy(
      originalObject.position
    );
  }
  if (!originalObject.userData.initialRotation) {
    originalObject.userData.initialRotation = new THREE.Euler().copy(
      originalObject.rotation
    );
  }

  const currentScale = originalObject.scale.clone();
  const hasZeroScale =
    currentScale.x === 0 || currentScale.y === 0 || currentScale.z === 0;

  if (hasZeroScale && originalObject.userData.originalScale) {
    originalObject.scale.copy(originalObject.userData.originalScale);
  }

  const box = new THREE.Box3().setFromObject(originalObject);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  if (hasZeroScale) {
    originalObject.scale.copy(currentScale);
  }

  let hitboxGeometry;
  let sizeMultiplier = { x: 1.1, y: 1.75, z: 1.1 };

  hitboxGeometry = new THREE.BoxGeometry(
    size.x * sizeMultiplier.x,
    size.y * sizeMultiplier.y,
    size.z * sizeMultiplier.z
  );

  const hitboxMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    visible: false,
  });

  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
  hitbox.position.copy(center);
  hitbox.name = originalObject.name + "_Hitbox";
  hitbox.userData.originalObject = originalObject;

  if (originalObject.name.includes("Headphones")) {
    hitbox.rotation.x = 0;
    hitbox.rotation.y = Math.PI / 4;
    hitbox.rotation.z = 0;
  }

  return hitbox;
}

function createDelayedHitboxes() {
  objectsNeedingHitboxes.forEach((child) => {
    const raycastObject = createStaticHitbox(child);

    if (raycastObject !== child) {
      scene.add(raycastObject);
    }

    raycasterObjects.push(raycastObject);
    hitboxToObjectMap.set(raycastObject, child);
  });

  objectsNeedingHitboxes.length = 0;
}

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const hitbox = currentIntersects[0].object;
    const object = hitboxToObjectMap.get(hitbox);

    if (object.name.includes("Button")) {
      buttonSounds.click.play();
    }

    Object.entries(pianoKeyMap).forEach(([keyName, soundKey]) => {
      if (object.name.includes(keyName)) {
        if (pianoDebounceTimer) {
          clearTimeout(pianoDebounceTimer);
        }

        fadeOutBackgroundMusic();

        pianoSounds[soundKey].play();

        pianoDebounceTimer = setTimeout(() => {
          fadeInBackgroundMusic();
        }, PIANO_TIMEOUT);

        gsap.to(object.rotation, {
          x: object.userData.initialRotation.x + Math.PI / 42,
          duration: 0.4,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.to(object.rotation, {
              x: object.userData.initialRotation.x,
              duration: 0.25,
              ease: "back.out(2)",
            });
          },
        });
      }
    });

    Object.entries(socialLinks).forEach(([key, url]) => {
      if (object.name.includes(key)) {
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = url;
        newWindow.target = "_blank";
        newWindow.rel = "noopener noreferrer";
      }
    });

    if (object.name.includes("Work_Button")) {
      showModal(modals.work);
    } else if (object.name.includes("About_Button")) {
      showModal(modals.about);
    } else if (object.name.includes("Contact_Button")) {
      showModal(modals.contact);
    }
  }
}

function playHoverAnimation(objectHitbox, isHovering) {
  let scale = 1.4;
  const object = hitboxToObjectMap.get(objectHitbox);
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (object.name.includes("Coffee")) {
    gsap.killTweensOf(smoke.scale);
    if (isHovering) {
      gsap.to(smoke.scale, {
        x: 1.4,
        y: 1.4,
        z: 1.4,
        duration: 0.5,
        ease: "back.out(2)",
      });
    } else {
      gsap.to(smoke.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  }

  if (object.name.includes("Fish")) {
    scale = 1.2;
  }

  if (isHovering) {
    // Scale animation for all objects
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * scale,
      y: object.userData.initialScale.y * scale,
      z: object.userData.initialScale.z * scale,
      duration: 0.5,
      ease: "back.out(2)",
    });

    if (object.name.includes("About_Button")) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x - Math.PI / 10,
        duration: 0.5,
        ease: "back.out(2)",
      });
    } else if (
      object.name.includes("Contact_Button") ||
      object.name.includes("My_Work_Button") ||
      object.name.includes("GitHub") ||
      object.name.includes("YouTube") ||
      object.name.includes("Twitter")
    ) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x + Math.PI / 10,
        duration: 0.5,
        ease: "back.out(2)",
      });
    }

    if (object.name.includes("Boba") || object.name.includes("Name_Letter")) {
      gsap.to(object.position, {
        y: object.userData.initialPosition.y + 0.2,
        duration: 0.5,
        ease: "back.out(2)",
      });
    }
  } else {
    // Reset scale for all objects
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "back.out(2)",
    });

    if (
      object.name.includes("About_Button") ||
      object.name.includes("Contact_Button") ||
      object.name.includes("My_Work_Button") ||
      object.name.includes("GitHub") ||
      object.name.includes("YouTube") ||
      object.name.includes("Twitter")
    ) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }

    if (object.name.includes("Boba") || object.name.includes("Name_Letter")) {
      gsap.to(object.position, {
        y: object.userData.initialPosition.y,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  }
}

window.addEventListener("mousemove", (e) => {
  touchHappened = false;
  pointer.x = (e.clientX / sizes.width) * 2 - 1;
  pointer.y = -(e.clientY / sizes.height) * 2 + 1;
});

window.addEventListener(
  "touchstart",
  (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / sizes.width) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / sizes.height) * 2 + 1;
  },
  { passive: false }
);

window.addEventListener(
  "touchend",
  (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    handleRaycasterInteraction();
  },
  { passive: false }
);

window.addEventListener("click", handleRaycasterInteraction);

// Other Event Listeners
const themeToggleButton = document.querySelector(".theme-toggle-button");
const muteToggleButton = document.querySelector(".mute-toggle-button");
const sunSvg = document.querySelector(".sun-svg");
const moonSvg = document.querySelector(".moon-svg");
const soundOffSvg = document.querySelector(".sound-off-svg");
const soundOnSvg = document.querySelector(".sound-on-svg");

const updateMuteState = (muted) => {
  if (muted) {
    backgroundMusic.volume(0);
  } else {
    backgroundMusic.volume(BACKGROUND_MUSIC_VOLUME);
  }

  buttonSounds.click.mute(muted);
  Object.values(pianoSounds).forEach((sound) => {
    sound.mute(muted);
  });
};

const handleMuteToggle = (e) => {
  e.preventDefault();

  isMuted = !isMuted;
  updateMuteState(isMuted);
  buttonSounds.click.play();

  if (!backgroundMusic.playing()) {
    backgroundMusic.play();
  }

  gsap.to(muteToggleButton, {
    rotate: -45,
    scale: 5,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (!isMuted) {
        soundOffSvg.style.display = "none";
        soundOnSvg.style.display = "block";
      } else {
        soundOnSvg.style.display = "none";
        soundOffSvg.style.display = "block";
      }

      gsap.to(muteToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.set(muteToggleButton, {
            clearProps: "all",
          });
        },
      });
    },
  });
};

let isMuted = false;
muteToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleMuteToggle(e);
  },
  { passive: false }
);

muteToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleMuteToggle(e);
  },
  { passive: false }
);

// Themeing stuff
const toggleFavicons = () => {
  // The Victor "V" favicon is fixed for both themes.
};

let isNightMode = false;

const animateUnbakedTheme = (night) => {
  if (!unbakedLighting) return;

  const target = night ? UNBAKED_LIGHTS.night : UNBAKED_LIGHTS.day;
  const { ambient, hemisphere, sun, lamp } = unbakedLighting;

  const start = {
    ambient: ambient.intensity,
    hemisphere: hemisphere.intensity,
    sun: sun.intensity,
    lamp: lamp.intensity,
    background: scene.background.clone(),
  };
  const targetBackground = new THREE.Color(target.background);
  const state = { t: 0 };

  gsap.to(state, {
    t: 1,
    duration: 1.5,
    ease: "power2.inOut",
    onUpdate: () => {
      const t = state.t;
      ambient.intensity = THREE.MathUtils.lerp(start.ambient, target.ambient, t);
      hemisphere.intensity = THREE.MathUtils.lerp(
        start.hemisphere,
        target.hemisphere,
        t
      );
      sun.intensity = THREE.MathUtils.lerp(start.sun, target.sun, t);
      lamp.intensity = THREE.MathUtils.lerp(start.lamp, target.lamp, t);
      scene.background.copy(start.background).lerp(targetBackground, t);
    },
  });
};

const handleThemeToggle = (e) => {
  e.preventDefault();
  toggleFavicons();

  const isDark = document.body.classList.contains("dark-theme");
  document.body.classList.remove(isDark ? "dark-theme" : "light-theme");
  document.body.classList.add(isDark ? "light-theme" : "dark-theme");

  isNightMode = !isNightMode;
  buttonSounds.click.play();

  gsap.to(themeToggleButton, {
    rotate: 45,
    scale: 5,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (isNightMode) {
        sunSvg.style.display = "none";
        moonSvg.style.display = "block";
      } else {
        moonSvg.style.display = "none";
        sunSvg.style.display = "block";
      }

      gsap.to(themeToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.set(themeToggleButton, {
            clearProps: "all",
          });
        },
      });
    },
  });

  if (USE_BAKED_TEXTURES) {
    Object.values(roomMaterials).forEach((material) => {
      gsap.to(material.uniforms.uMixRatio, {
        value: isNightMode ? 1 : 0,
        duration: 1.5,
        ease: "power2.inOut",
      });
    });
  } else {
    animateUnbakedTheme(isNightMode);
  }
};

// Click event listener
themeToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleThemeToggle(e);
  },
  { passive: false }
);

themeToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleThemeToggle(e);
  },
  { passive: false }
);

/**  -------------------------- Render and Animations Stuff -------------------------- */
const clock = new THREE.Clock();

const updateClockHands = () => {
  if (!hourHand || !minuteHand) return;

  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const minuteAngle = (minutes + seconds / 60) * ((Math.PI * 2) / 60);

  const hourAngle = (hours + minutes / 60) * ((Math.PI * 2) / 12);

  minuteHand.rotation.x = -minuteAngle;
  hourHand.rotation.x = -hourAngle;
};

const render = (timestamp) => {
  const elapsedTime = clock.getElapsedTime();

  // Update Shader Univform
  smokeMaterial.uniforms.uTime.value = elapsedTime;

  //Update Orbit Controls
  controls.update();

  if (cameraDebugUpdate) cameraDebugUpdate();

  // Update Clock hand rotation
  updateClockHands();

  // Fan rotate animation
  xAxisFans.forEach((fan) => {
    fan.rotation.x -= 0.04;
  });

  yAxisFans.forEach((fan) => {
    fan.rotation.y -= 0.04;
  });

  // Chair rotate animation
  if (chairTop) {
    const time = timestamp * 0.001;
    const baseAmplitude = Math.PI / 8;

    const rotationOffset =
      baseAmplitude *
      Math.sin(time * 0.5) *
      (1 - Math.abs(Math.sin(time * 0.5)) * 0.3);

    chairTop.rotation.y = chairTop.userData.initialRotation.y + rotationOffset;
  }

  // Fish up and down animation
  if (fish) {
    const time = timestamp * 0.0015;
    const amplitude = 0.12;
    const position =
      amplitude * Math.sin(time) * (1 - Math.abs(Math.sin(time)) * 0.1);
    fish.position.y = fish.userData.initialPosition.y + position;
  }

  // Raycaster
  if (!isModalOpen) {
    raycaster.setFromCamera(pointer, camera);

    // Get all the objects the raycaster is currently shooting through / intersecting with
    currentIntersects = raycaster.intersectObjects(raycasterObjects);

    for (let i = 0; i < currentIntersects.length; i++) {}

    if (currentIntersects.length > 0) {
      const currentIntersectObject = currentIntersects[0].object;

      if (currentIntersectObject.name.includes("Hover")) {
        if (currentIntersectObject !== currentHoveredObject) {
          if (currentHoveredObject) {
            playHoverAnimation(currentHoveredObject, false);
          }

          currentHoveredObject = currentIntersectObject;
          playHoverAnimation(currentIntersectObject, true);
        }
      }

      if (currentIntersectObject.name.includes("Pointer")) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    } else {
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
    }
  }

  renderer.render(scene, camera);

  window.requestAnimationFrame(render);
};

render();

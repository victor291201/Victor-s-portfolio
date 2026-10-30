// Espejo en JS de los design tokens de src/styles/variables.scss
// (paleta canónica + neón). Úsalo para cualquier color de UI o material
// Three.js; no hardcodees hex en main.js.
export const UI_PALETTE = {
  periwinkle: "#ADB4E4",
  violet: "#B43CE4",
  midnight: "#2B2E54",
  navy: "#12295F",
  slate: "#626AA0",
  lavender: "#9FA5D5",
  neonPink: "#FF007F",
  neonCyan: "#00FFFF",
  neonYellow: "#FFFF00",
  neonUltraviolet: "#7F00FF",
};

// Pipeline de render:
// - "unbaked": usa room_unbaked.glb con sus materiales propios (fase actual).
// - "baked":   usa Room_Portfolio.glb + las 4 texturas horneadas día/noche.
// Cambia solo esta constante cuando tengas el bake terminado.
export const RENDER_MODE = "unbaked";

export const USE_BAKED_TEXTURES = RENDER_MODE === "baked";

export const MODEL_PATHS = {
  unbaked: "/models/room_unbaked.glb",
  baked: "/models/Room_Portfolio.glb",
};

export const MODEL_PATH = MODEL_PATHS[RENDER_MODE];

// Cámara para el cuarto sin bake (1.4x respecto al encuadre inicial).
export const UNBAKED_CAMERA = {
  position: [9.799, 21.1, -25.902],
  target: [-15.6, 0.9, -46.7],
};


// Límites de paneo del target (coordenadas reales del cuarto sin bake).
export const UNBAKED_PAN_BOUNDS = {
  min: [-30, -4, -62],
  max: [2, 10, -28],
};

// Límites de órbita ajustados al encuadre actual del cuarto sin bake.
export const UNBAKED_ORBIT_LIMITS = {
  minDistance: 18,
  maxDistance: 60,
  minPolarAngle: 0.7,
  maxPolarAngle: 1.52,
  minAzimuthAngle: 0.25,
  maxAzimuthAngle: 1.2,
};

// El cuarto se muestra tal cual viene en el GLB: no se desplaza, escala ni
// recoloca por código.

// Luces de respaldo para el modo sin bake. El día/noche se anima por luces
// porque todavía no existen las texturas horneadas.
export const UNBAKED_LIGHTS = {
  // Rig original del proyecto (commit inicial); ajústalo en vivo con el
  // panel de debug de luces.
  sunPosition: [59.5, 103.5, -21.1],
  sunColor: "#FFF1E0",
  hemisphereGround: "#6B5B6E",
  lamp: {
    // El cuarto cambió de sitio con el re-bake: la lámpara se reposicionó
    // para seguir sobre el escritorio.
    position: [-21.4, 3.6, -52.9],
    color: "#ff4ff3",
  },
  day: {
    background: "#d9cad1",
    ambient: 0.9,
    hemisphere: 0.9,
    sun: 2.4,
    lamp: 12,
  },
  night: {
    background: "#141228",
    ambient: 0.22,
    hemisphere: 0.25,
    sun: 0.25,
    lamp: 55,
  },
};

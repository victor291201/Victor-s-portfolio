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
  position: [32.546, 17.526, 26.694],
  target: [1.523, 4.827, 1.39],
};

// El cuarto se muestra tal cual viene en el GLB: no se desplaza, escala ni
// recoloca por código.

// Luces de respaldo para el modo sin bake. El día/noche se anima por luces
// porque todavía no existen las texturas horneadas.
export const UNBAKED_LIGHTS = {
  lamp: {
    position: [-2.428, 3.823, -3.767],
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

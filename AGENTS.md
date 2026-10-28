# AGENTS.md — Sooah's Room Folio

## Overview

3D interactive portfolio website built with Three.js. Users explore a stylized room, click objects to trigger modals, play a functional piano, and toggle day/night themes. The project is monolithic by design — nearly all logic lives in `src/main.js`.

## Tech Stack

| Layer          | Technology              |
| -------------- | ----------------------- |
| Bundler/Dev    | Vite 6                  |
| 3D Engine      | Three.js 0.172          |
| Animations     | GSAP 3                  |
| Audio          | Howler.js 2             |
| Styling        | SCSS (Sass 1.83)        |
| Shaders        | GLSL (vite-plugin-glsl) |
| 3D Compression | Draco (THREE.DRACOLoader) |
| Models         | GLTF/GLB (loaded from Blender export) |

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (with --host for LAN access)
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

## Project Structure

```
sooahs-room-folio-main/
├── index.html              # Entry point, all DOM markup (canvas, modals, buttons)
├── vite.config.js          # Vite config with vite-plugin-glsl
├── package.json
├── public/                 # Static assets served at /
│   ├── audio/              # music/ (bgm), sfx/ (click, piano keys)
│   ├── draco/              # Draco decoder WASM/files
│   ├── fonts/              # Custom fonts (Motley Forces, Shifty Notes)
│   ├── images/             # Modal images (profile_pic, community, computer, piano)
│   ├── media/              # Favicons (light/dark themes) + og-image
│   ├── models/             # Room_Portfolio.glb (single large GLB)
│   ├── shaders/            # perlin.png for smoke shader
│   └── textures/
│       ├── room/day/       # 4 day texture sets (first ~ fourth)
│       ├── room/night/     # 4 night texture sets
│       ├── skybox/         # Cube map textures (px/nx/py/ny/pz/nz.webp)
│       └── video/          # Screen.mp4 (plays on an in-game screen)
├── src/
│   ├── main.js             # (2115 lines) ALL application logic
│   ├── style.scss          # Main SCSS (762 lines)
│   ├── styles/             # SCSS partials (fonts, reset, variables, defaults/media)
│   ├── shaders/
│   │   ├── smoke/          # Coffee steam smoke shader (vertex + fragment)
│   │   ├── theme/          # Day/night texture blending shader (vertex + fragment)
│   │   └── includes/       # rotate2D.glsl utility
│   └── utils/
│       └── OrbitControls.js # Custom Three.js orbit controls
└── blender files/          # Source Blender (.blend) file for the room
```

## Color Palette

Canonical palette for the whole project (UI, 3D accents, shaders, favicons). All values are opaque (`FF` alpha); use `rgba()`/hex-with-alpha only when transparency is required.

| Token | Hex | SCSS variable | Role |
| ----- | --- | ------------- | ---- |
| Periwinkle | `#ADB4E4` | `$color-periwinkle` | Primary light — panels, buttons, hover surfaces |
| Violet | `#B43CE4` | `$color-violet` | Accent — CTA, active states, highlights (use sparingly) |
| Midnight | `#2B2E54` | `$color-midnight` | Dark base — body background, dark-theme surfaces |
| Navy | `#12295F` | `$color-navy` | Deep base — gradients, shadows, depth layers |
| Slate | `#626AA0` | `$color-slate` | Secondary — muted text, borders, dividers |
| Lavender | `#9FA5D5` | `$color-lavender` | Soft neutral — secondary surfaces, disabled states |

Usage rules:

- Never hardcode hex values in `index.html`, `style.scss`, `src/styles/*`, or `main.js`. Import/consume the tokens above (SCSS variables for styles, a shared JS constant for Three.js materials/shaders).
- Pair Violet only against Periwinkle/Lavender/Midnight/Navy — it fails AA contrast on white.
- Body text on light surfaces → Midnight; on dark surfaces → Periwinkle or Lavender.
- The existing variables in `src/styles/variables.scss` (`$base-dark-purple`, `$base-purple`, etc.) are legacy and must be migrated to these tokens whenever that file is touched.
- New colors require user approval and a documented role in this table.

## Work Methodology

1. **Scope** — restate the request as a checklist before editing; never mix unrelated refactors with the requested change.
2. **Inspect** — read the affected files and their neighbors to match existing patterns; check `AGENTS.md` conventions first.
3. **Design tokens first** — any visual change starts by picking tokens from the palette above, not ad-hoc values.
4. **Implement small** — one concern per change; keep `main.js` logic untouched unless the task requires it.
5. **Verify** — `npm run dev` and check the affected flow manually (see Testing); run `npm run build` when touching assets, shaders, or styles.
6. **Document** — update the relevant section of this file when behavior, naming conventions, or architecture change.

## Architecture & Key Concepts

### 1. Loading Flow
1. `THREE.LoadingManager` monitors all GLTF/texture loads.
2. On load complete → "Enter!" button appears on loading screen.
3. User clicks → loading screen animates away → `playIntroAnimation()` starts.
4. Intro animation uses GSAP timelines to scale objects from 0→1 in staggered groups.

### 2. The GLB Model
- Single GLB file (`/models/Room_Portfolio.glb`) contains the entire room.
- Meshes use naming conventions to drive behavior:
  - **`*_Hover_*` / `*_Pointer_*`** → interactable (hover cursor, click actions).
  - **`*_Raycaster_*`** → receives raycasting hitbox generation.
  - **`*_Key`** (C1_Key, D#1_Key, etc.) → piano keys.
  - **`First` / `Second` / `Third` / `Fourth`** → receive day/night shader materials.
  - **`Water`, `Glass`, `Bubble`, `Screen`** → special materials.
  - **`Fan_*`** → continuous rotation (x-axis or y-axis groups).
  - **`Hour_Hand` / `Minute_Hand`** → clock hands tracking real time.
  - **`Chair_Top`** → oscillating rotation.
  - **`Fish_Fourth`** → floating up/down motion.
  - **`Coffee`** → smoke effect position anchor.

### 3. Raycasting & Hitboxes
- Objects listed in `objectsWithIntroAnimations` get **delayed hitboxes** (created after intro finishes).
- Objects NOT in that list get **immediate hitboxes** during model load.
- `useOriginalMeshObjects` (Bulb, Cactus, Kirby) skip hitbox creation — the mesh itself is used.
- Hitboxes are invisible `Box3`-based meshes sized 1.1x × 1.75y × 1.1z of the object bounds.
- Each hitbox maps back to the original mesh via `hitboxToObjectMap`.

### 4. Day/Night Theme
- Four room texture sets (First–Fourth), each has a day and night variant.
- `theme/fragment.glsl` shader blends between day/night textures via `uMixRatio` uniform.
- Toggle button animates `uMixRatio` 0→1 (night) or 1→0 (day) over 1.5s with GSAP.
- CSS theming switches `.light-theme` / `.dark-theme` classes on `<body>`.
- Favicons swap between light/dark variants.

### 5. Audio
- Background music: `.ogg` (known iPhone/Safari compatibility issue — see Known Issues).
- Piano: 24 individual `.ogg` files mapped to keyboard keys via `pianoKeyMap`.
- Click SFX: `bubble.ogg`.
- Background music fades out when piano is played (2s debounce), fades back in after inactivity.

### 6. Modals
- Three modals: Work, About, Contact — all defined in `index.html`.
- Shown/hidden via `display` style + GSAP scale/opacity animations.
- OrbitControls disabled while modal is open.
- Overlay click/touch closes active modal.

### 7. Smoke Shader
- Procedural smoke effect above the coffee cup using a custom vertex+fragment shader.
- Uses a perlin noise texture (`perlin.png`) and `uTime` uniform for animation.
- Scale animates on coffee hover.

## Known Issues (from README)

1. **Monolithic code**: All ~2115 lines in `main.js`. Should be refactored into modules.
2. **Messy SCSS**: `style.scss` is disorganized; the author recommends rewriting styles.
3. **iPhone/Safari .ogg bug**: `.ogg` audio files may not play. Need `.mp3` fallbacks for iOS.
4. **Hover twitching/vibrating**: When hover animation scales/displaces a mesh, the raycaster may lose the hitbox, killing the tween. The tween revert causes re-hover, looping infinitely. They partially solved it with delayed hitboxes and `useOriginalMeshObjects`, but it can still occur at certain angles. To fully fix it, use static invisible hitboxes that don't animate.
5. **No linting/typechecking scripts** in `package.json`. Consider adding ESLint + Prettier.

## Code Conventions

- Uses `eval()` for dynamic piano key variable assignment (line 1450). Avoid this pattern in refactors.
- Variables declared at module scope with `let` — no `const` for most object references.
- Comments are informal and self-deprecating (e.g., "LOL DO NOT DO THIS").
- Tabs/indentation: 2 spaces.
- JavaScript module type: ES Modules (`"type": "module"`).

## Blender Workflow

- Source file: `Before Baking original.blend` (in root) and `blender files/`.
- Room exported as a single `Room_Portfolio.glb` with Draco compression.
- Object names in Blender directly control behavior in JavaScript (Hover, Pointer, Raycaster, Key suffixes, etc.).
- Textures are baked externally and loaded separately (not embedded in GLB).

## Development Notes

- The dev server runs with `--host` to expose on the local network.
- No SPA routing — single `index.html` page app.
- No framework (React, Vue, etc.) — vanilla JS + DOM manipulation.
- Custom OrbitControls limits: azimuth 0–90°, polar 0–90°, distance 5–45, damping 0.05.
- Camera starts at different positions depending on screen width (mobile vs desktop).
- `camera.near = 0.1`, `camera.far = 200`.
- Renderer pixel ratio capped at 2.
- The `window.open()` for social links (line 1689) opens an empty window and sets location — this triggers popup blockers in some browsers.

## Testing

No test framework configured. Manual testing only:
1. `npm run dev` → check browser at `http://localhost:5173`
2. Verify loading screen → intro animation → room interaction
3. Test day/night toggle, mute toggle, modal open/close
4. Test piano keys on different devices
5. `npm run build` → `npm run preview` to verify production build

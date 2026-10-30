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
| Baking         | Blender 5.0 Python (bpy), Cycles DIFFUSE bake (base color) |

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (with --host for LAN access)
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

Bake the room (regenerates `room_unbaked.glb` with per-object base color):

```bash
blender -b "blender files/Baking.blend" --python "blender files/export_unbaked.py"
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
│   ├── media/              # Favicon (fixed "V") + og-image
│   ├── models/             # Room_Portfolio.glb (baked) + room_unbaked.glb (unbaked)
│   ├── shaders/            # perlin.png for smoke shader
│   └── textures/
│       ├── room/day/       # 4 day texture sets
│       ├── room/night/     # 4 night texture sets
│       ├── skybox/         # Cube map textures (px/nx/py/ny/pz/nz.webp)
│       └── video/          # Screen.mp4 (plays on an in-game screen)
├── src/
│   ├── main.js             # (2381 lines) application logic
│   ├── config.js           # RENDER_MODE, model paths, camera, real-time lights
│   ├── i18n.js             # es/pt/en translations
│   ├── style.scss          # Main SCSS (824 lines)
│   ├── styles/             # SCSS partials (fonts, reset, variables, defaults/media)
│   ├── shaders/
│   │   ├── smoke/          # Coffee steam smoke shader (vertex + fragment)
│   │   ├── theme/          # Day/night blending shader (vertex + fragment)
│   │   └── includes/       # rotate2D.glsl utility
│   └── utils/
│       └── OrbitControls.js # Custom Three.js orbit controls
└── blender files/          # Blender sources + bake scripts
    ├── Baking.blend        # Bake source (333 MB)
    ├── For Night Time Baking.blend  # Reference night lighting
    ├── export_unbaked.py   # Per-object base-color bake → room_unbaked.glb
    └── textures/           # Source bake PNG/WebP (4 texture sets)
```

## Color Palette

Canonical palette for the whole project (UI, 3D accents, shaders, favicons). All values are opaque (`FF` alpha); use `rgba()`/hex-with-alpha only when transparency is required.

| Token | Hex | SCSS variable | Role |
| ----- | --- | ------------- | ---- |
| Periwinkle | `#ADB4E4` | `$color-periwinkle` | Primary light — panels, buttons, hover surfaces |
| Violet | `#B43CE4` | `$color-violet` | Accent — CTA, active states, highlights; night UI: neon tube core color for borders/outlines |
| Midnight | `#2B2E54` | `$color-midnight` | Dark base — body background, dark-theme surfaces |
| Navy | `#12295F` | `$color-navy` | Deep base — gradients, shadows, depth layers |
| Slate | `#626AA0` | `$color-slate` | Secondary — muted text, borders, dividers |
| Lavender | `#9FA5D5` | `$color-lavender` | Soft neutral — secondary surfaces, disabled states |
| Neon Pink | `#FF007F` | `$color-neon-pink` | Approved 2026-10 — currently unused in UI (kept out of the neon scheme per user feedback) |
| Neon Cyan | `#00FFFF` | `$color-neon-cyan` | Night UI — body text, icons, headings (blue glow) |
| Neon Yellow | `#FFFF00` | `$color-neon-yellow` | Night UI — hover/active accent only (use sparingly) |
| Neon Ultraviolet | `#7F00FF` | `$color-neon-ultraviolet` | Night UI — panel/button outlines, glow halos, translucent active backgrounds |

Usage rules:

- Never hardcode hex values in `index.html`, `style.scss`, `src/styles/*`, or `main.js`. Import/consume the tokens above (SCSS variables for styles, a shared JS constant for Three.js materials/shaders).
- Pair Violet only against Periwinkle/Lavender/Midnight/Navy — it fails AA contrast on white.
- Body text on light surfaces → Midnight; on dark surfaces → Periwinkle or Lavender.
- `src/styles/variables.scss` now holds only the canonical + neon tokens above (`$base-*` legacy variables were migrated in the 2026-10 neon restyle). `src/config.js` exports `UI_PALETTE`, the JS mirror of these tokens for inline styles and Three.js materials.
- Global CSS custom properties are emitted in `:root` at the top of `src/style.scss`: `--color-*` (palette), `--color-*-rgb` (space-separated RGB channels for alpha glows, e.g. `rgb(var(--color-violet-rgb) / 0.75)`), and `--font-display` / `--font-body` (Motley Forces / Shifty Notes). SCSS variables generate these tokens — always reference the CSS variables (or `var(--ui-*)` theme vars) in rules, never raw hex or font strings.
- New colors require user approval and a documented role in this table.

## Work Methodology

1. **Scope** — restate the request as a checklist before editing; never mix unrelated refactors with the requested change.
2. **Inspect** — read the affected files and their neighbors to match existing patterns; check `AGENTS.md` conventions first.
3. **Design tokens first** — any visual change starts by picking tokens from the palette above, not ad-hoc values.
4. **Implement small** — one concern per change; keep `main.js` logic untouched unless the task requires it.
5. **Verify** — `npm run dev` and check the affected flow manually (see Testing); run `npm run build` when touching assets, shaders, or styles.
6. **Document** — update the relevant section of this file when behavior, naming conventions, or architecture change.

## Architecture & Key Concepts

### Rendering Pipeline (baked vs unbaked)

The render mode is selected in `src/config.js` via `RENDER_MODE`:

- **`baked`** (legacy/original): loads `Room_Portfolio.glb` + four day/night texture sets. Meshes named `First/Second/Third/Fourth` get the 4-set `theme/fragment.glsl` shader; day/night blend via `uMixRatio`.
- **`unbaked`** (default, current): loads `room_unbaked.glb` (per-object baked base colors from `export_unbaked.py`). Lighting is baked **as base color only** — no lighting — so the sealed room isn't black. The scene is lit in real time with the rig in `config.js` (`UNBAKED_LIGHTS`); day/night animates those lights.

### 1. Loading Flow
1. `THREE.LoadingManager` monitors the GLB load.
2. On load complete → "Enter!" button appears on loading screen.
3. User clicks → loading screen animates away.
4. **baked**: `playIntroAnimation()` scales objects 0→1 in staggered GSAP groups, then creates delayed hitboxes.
5. **unbaked**: intro is skipped — `createDelayedHitboxes()` runs immediately.

### 2. The GLB Model
- Single GLB file (`/models/room_unbaked.glb` for unbaked, `/models/Room_Portfolio.glb` for baked) contains the entire room.
- Meshes use naming conventions to drive behavior:
  - **`*_Hover_*` / `*_Pointer_*`** → interactable (hover cursor, click actions).
  - **`*_Raycaster_*`** → receives raycasting hitbox generation.
  - **`*_Key`** (C1_Key, D#1_Key, etc.) → piano keys.
  - **`First` / `Second` / `Third` / `Fourth`** → (baked mode) receive day/night shader materials.
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
- Two mechanisms depending on `RENDER_MODE`:
  - **baked**: `theme/fragment.glsl` blends four day/night texture sets via `uMixRatio`.
  - **unbaked**: `animateUnbakedTheme()` lerps the real-time light intensities + `scene.background` between `UNBAKED_LIGHTS.day` and `.night`.
- Toggle button animates over 1.5s with GSAP.
- CSS theming switches `.light-theme` / `.dark-theme` classes on `<body>`. Interface colors come from CSS custom properties defined per theme in `style.scss` (`--ui-*`): day uses the canonical palette, night uses the neon tokens with glow (`--ui-glow`, `--ui-panel-shadow`, `neon-panel-pulse`/`neon-title-flicker` keyframes). Never hardcode hex in component rules — consume the variables.
- Favicon is fixed ("V") — `toggleFavicons()` is no-op.
- **Lighting/camera debug panel** (`setupCameraDebug`, enabled via `ENABLE_CAMERA_DEBUG` in dev only): sliders for camera, sun & lamp position, day/night intensities, sun/lamp/background colors, exposure. "Copiar luces" outputs the `UNBAKED_LIGHTS` snippet to paste back into `config.js`. The sun rig uses the project's original values (`sunPosition [18, 30, 12]`, `sunColor #FFF1E0`, day `0.9/0.9/2.4/12`).

### 5. Audio
- Background music: 3-track `.mp3` playlist (`public/audio/music/`, `MUSIC_TRACKS` in `main.js`). A random track plays (never the same as the current one) and on end the next is chained with fade-out → fade-in (1.5s).
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

1. **Monolithic code**: All ~2381 lines in `main.js`. Should be refactored into modules.
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

- Source: `blender files/Baking.blend` (333 MB) is the bake source. `For Night Time Baking.blend` holds the reference night lighting.
- `export_unbaked.py` (run headless with Blender 5.0) bakes per-object base color and exports the GLB in one pass:

```bash
blender -b "blender files/Baking.blend" --python "blender files/export_unbaked.py"
```

- Output: `public/models/room_unbaked.glb` (Draco + WebP).
- Bake config: Cycles CPU, 1 sample, no denoising, DIFFUSE `pass_filter={'COLOR'}` (base color only — no lighting, so the sealed room isn't black), `use_clear=True`, margin 4. Per-object `BakeUV` (smart project) at 256/512/1024 by object size.
- Skips image-textured, transparent/glass/water, and unlit objects; flattens leftover procedural materials to a representative color.
- `$env:SKIP_BAKE="1"` skips the bake for a fast geometry-only export.
- Object names control runtime behavior (Hover, Pointer, Raycaster, Key suffixes).

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

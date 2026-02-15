import Phaser from "phaser";

export interface DinoTextureOptions {
  pixel?: number; // pixel size per grid cell
  key?: string;   // texture key
  baseColor?: number; // body base color (overrides default green)
}

// Generates a blocky pixel-art dino texture on the given scene
export function generateDinoTexture(scene: Phaser.Scene, key = "player", opts: DinoTextureOptions = {}) {
  const pixel = opts.pixel ?? 4;
  const w = 20;
  const h = 20;

  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const g = scene.make.graphics({ x: 0, y: 0});

  const base = opts.baseColor ?? 0x4caf50;
  const DARK_GREEN = darken(base, 0.35);
  const GREEN = base;
  const LIGHT_GREEN = lighten(base, 0.35);
  const NAVY = 0x1f2a66;
  const ORANGE = 0xff6d00;

  const fill = (x: number, y: number, wCells: number, hCells: number, color: number) => {
    g.fillStyle(color, 1);
    g.fillRect(x * pixel, y * pixel, wCells * pixel, hCells * pixel);
  };

  // Define rectangles to draw [x, y, w, h, color]
  const rects: Array<[number, number, number, number, number]> = [
    [3, 5, 14, 12, GREEN],      // body outer
    [4, 6, 12, 10, LIGHT_GREEN],// body inner
    [5, 17, 3, 2, GREEN],       // left foot
    [13, 17, 3, 2, GREEN],      // right foot
    [5, 3, 2, 2, DARK_GREEN],   // spikes
    [8, 3, 2, 2, DARK_GREEN],
    [11, 3, 2, 2, DARK_GREEN],
    [14, 3, 2, 2, DARK_GREEN],
    [7, 9, 2, 2, NAVY],         // eye
    [3, 5, 14, 1, DARK_GREEN],  // border top
    [3, 16, 14, 1, DARK_GREEN], // border bottom
    [3, 5, 1, 12, DARK_GREEN],  // border left
    [16, 5, 1, 12, DARK_GREEN], // border right
  ];

  rects.forEach(([x, y, wCells, hCells, color]) => fill(x, y, wCells, hCells, color));

  // Mouth/beak triangle on the right side
  g.fillStyle(ORANGE, 1);
  g.beginPath();
  g.moveTo(17 * pixel, 9 * pixel);
  g.lineTo(19 * pixel, 10 * pixel);
  g.lineTo(17 * pixel, 11 * pixel);
  g.closePath();
  g.fillPath();

  g.generateTexture(key, w * pixel, h * pixel);
  g.destroy();
}

// helper: lighten/darken an RGB hex by factor (0..1)
function lighten(hex: number, f: number) {
  const r = Math.min(255, ((hex >> 16) & 0xff) + Math.round(255 * f));
  const g = Math.min(255, ((hex >> 8) & 0xff) + Math.round(255 * f));
  const b = Math.min(255, (hex & 0xff) + Math.round(255 * f));
  return (r << 16) | (g << 8) | b;
}

function darken(hex: number, f: number) {
  const r = Math.max(0, ((hex >> 16) & 0xff) - Math.round(255 * f));
  const g = Math.max(0, ((hex >> 8) & 0xff) - Math.round(255 * f));
  const b = Math.max(0, (hex & 0xff) - Math.round(255 * f));
  return (r << 16) | (g << 8) | b;
}

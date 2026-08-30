import { GUARDIAN_DATA } from "@/data/guardians";

export const MASTER_CARD_WIDTH = 1080;
export const MASTER_CARD_HEIGHT = 1920;

/**
 * Single source of truth for the betel-leaf geometry, always expressed in
 * FINAL canvas coordinates (1080x1920). The interactive preview renders this
 * exact geometry scaled down, so preview and generated card always match.
 */
export const LEAF_CENTER_X = 540;
export const LEAF_CENTER_Y = 960;
export const LEAF_WIDTH = 560;
export const LEAF_HEIGHT = 760;
/** Pixels of canvas movement produced by a single unit of offsetX/offsetY. */
export const OFFSET_PX_PER_UNIT = 2.5;

const FONT_STACK = "'Noto Sans Thai', 'Sarabun', 'Tahoma', 'sans-serif'";
const GOLD = "#FFD700";
const GOLD_DARK = "#D4AF37";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only request CORS for network URLs; blob:/data: URLs must stay same-origin.
    if (/^(https?:)?\/\//i.test(src)) img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
  });
}

/**
 * Shared standardized betel leaf (ใบพลู) drawing logic — used by BOTH the
 * final canvas render and the interactive preview, so the leaf shape always
 * matches. Normalized leaf: pointed top tip, broad shoulders sweeping down
 * to the base. Centered on `(cx, cy)` with bounding box `width x height`.
 */
export function drawBetelLeafPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number
): void {
  const topY = cy - height / 2;
  const bottomY = cy + height / 2;
  const halfW = width / 2;

  ctx.beginPath();
  // 1. Pointed top tip
  ctx.moveTo(cx, topY);
  // 2. Right leaf curve (broad shoulder curving smoothly down to the base)
  ctx.bezierCurveTo(
    cx + halfW * 1.15,
    cy - height * 0.18,
    cx + halfW * 0.95,
    cy + height * 0.28,
    cx,
    bottomY
  );
  // 3. Left leaf curve
  ctx.bezierCurveTo(
    cx - halfW * 0.95,
    cy + height * 0.28,
    cx - halfW * 1.15,
    cy - height * 0.18,
    cx,
    topY
  );
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* Zoom & pan (transform)                                              */
/* ------------------------------------------------------------------ */

export interface TransformOptions {
  /** 0.5x..3.0x zoom of the user photo inside the betel leaf frame */
  scale: number;
  /** Horizontal pan offset (arbitrary units, mapped to 2.5px at 1080px) */
  offsetX: number;
  /** Vertical pan offset (arbitrary units, mapped to 2.5px at 1080px) */
  offsetY: number;
}

export interface LeafDrawRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Compute the user photo draw rect in FINAL 1080x1920 coordinates. The
 * interactive preview scale-copies this rect, so the crop always matches.
 * Base size covers the leaf (cover-fit of original aspect) then scales by
 * `transform.scale` and pans by `offsetX/offsetY` in final-canvas pixels.
 */
export function computeLeafUserDraw(
  imgW: number,
  imgH: number,
  transform: TransformOptions
): LeafDrawRect {
  const baseAspect = imgW / imgH;
  let baseDrawW = LEAF_WIDTH * 1.4;
  let baseDrawH = baseDrawW / baseAspect;
  if (baseDrawH < LEAF_HEIGHT) {
    baseDrawH = LEAF_HEIGHT * 1.4;
    baseDrawW = baseDrawH * baseAspect;
  }

  const w = baseDrawW * transform.scale;
  const h = baseDrawH * transform.scale;
  return {
    w,
    h,
    x: LEAF_CENTER_X - w / 2 + transform.offsetX * OFFSET_PX_PER_UNIT,
    y: LEAF_CENTER_Y - h / 2 + transform.offsetY * OFFSET_PX_PER_UNIT,
  };
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** Reduce the font size until the text fits inside `maxWidth`. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  weight: number = 700,
  minSize: number = 12
): number {
  let size = startSize;
  do {
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  } while (size > minSize);
  return minSize;
}

export function formatThaiDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
      era: "short",
    });
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/* Master card composer                                                */
/* ------------------------------------------------------------------ */

export interface GenerateOptions {
  userImage: HTMLImageElement;
  userName: string;
  unlockedDate: string;
  transform: TransformOptions;
  format?: "image/jpeg" | "image/png";
  quality?: number;
}

/**
 * Composite the 5th Master Card on a 1080x1920 canvas:
 * 4-card seamless 2x2 background -> vignette -> gold frame ->
 * zoom/pan betel-leaf cutout of the user photo -> golden glow border ->
 * header & badges. Returns a data URL.
 */
export async function generateFinalGuardianCard({
  userImage,
  userName,
  unlockedDate,
  transform,
  format = "image/jpeg",
  quality = 0.95,
}: GenerateOptions): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = MASTER_CARD_WIDTH;
  canvas.height = MASTER_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  // Best effort preload of web fonts so Thai text renders correctly.
  try {
    await Promise.race([
      (document as Document & { fonts: FontFaceSet }).fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  } catch {
    /* fonts are optional; fall back to system font */
  }

  // 1. Load & draw the 4 cards edge-to-edge (2x2 seamless grid background).
  const [fireImg, earthImg, windImg, waterImg] = await Promise.all([
    loadImage(GUARDIAN_DATA.fire.image),
    loadImage(GUARDIAN_DATA.earth.image),
    loadImage(GUARDIAN_DATA.wind.image),
    loadImage(GUARDIAN_DATA.water.image),
  ]);

  const halfW = MASTER_CARD_WIDTH / 2;
  const halfH = MASTER_CARD_HEIGHT / 2;

  ctx.drawImage(fireImg, 0, 0, halfW, halfH); // Top-Left  : Chinese Guardian (Fire)
  ctx.drawImage(waterImg, halfW, 0, halfW, halfH); // Top-Right : Mon Guardian (Water)
  ctx.drawImage(windImg, 0, halfH, halfW, halfH); // Bottom-L  : Thai Guardian (Wind)
  ctx.drawImage(earthImg, halfW, halfH, halfW, halfH); // Bottom-R : Muslim Guardian (Earth)

  // 2. Vignette & dark overlay to make the centerpiece stand out.
  const radial = ctx.createRadialGradient(540, 960, 200, 540, 960, 900);
  radial.addColorStop(0, "rgba(0, 0, 0, 0.4)");
  radial.addColorStop(1, "rgba(0, 0, 0, 0.85)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, MASTER_CARD_WIDTH, MASTER_CARD_HEIGHT);

  // 3. Outer gold frame.
  ctx.strokeStyle = GOLD_DARK;
  ctx.lineWidth = 16;
  ctx.strokeRect(20, 20, 1040, 1880);
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, 1008, 1848);

  // 4. User photo clipped inside the betel leaf, honoring zoom & pan.
  ctx.save();
  drawBetelLeafPath(ctx, LEAF_CENTER_X, LEAF_CENTER_Y, LEAF_WIDTH, LEAF_HEIGHT);
  ctx.clip();

  const photoW = userImage.naturalWidth || userImage.width;
  const photoH = userImage.naturalHeight || userImage.height;
  const draw = computeLeafUserDraw(photoW, photoH, transform);
  ctx.drawImage(userImage, draw.x, draw.y, draw.w, draw.h);
  ctx.restore();

  // 5. Glowing golden leaf outline.
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 10;
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 24;
  drawBetelLeafPath(ctx, LEAF_CENTER_X, LEAF_CENTER_Y, LEAF_WIDTH, LEAF_HEIGHT);
  ctx.stroke();
  ctx.restore();

  // 6. Header & badges.
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = `bold 52px ${FONT_STACK}`;
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 10;
  ctx.fillText("GUARDIANS OF TALATPHLU", 540, 130);

  ctx.font = `bold 36px ${FONT_STACK}`;
  ctx.fillText("THE 4TH GUARDIAN", 540, 1480);

  const name = userName.trim() || "ผู้พิทักษ์แห่งตลาดพลู";
  const nameSize = fitText(ctx, name, 900, 46, 800, 22);
  ctx.font = `bold ${nameSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(name, 540, 1550);

  ctx.font = `24px ${FONT_STACK}`;
  ctx.fillStyle = GOLD_DARK;
  ctx.fillText(`ปลดล็อกสำเร็จ: ${formatThaiDate(unlockedDate)}`, 540, 1600);

  return canvas.toDataURL(format, quality);
}

/** Trigger a client-side download of a data URL (e.g. from the generator). */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
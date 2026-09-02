import { GUARDIAN_DATA } from "@/data/guardians";

export const MASTER_CARD_WIDTH = 1080;
export const MASTER_CARD_HEIGHT = 1920;

/* ------------------------------------------------------------------ */
/* Centerpiece geometry (final canvas coordinates, 1080x1920)          */
/* ------------------------------------------------------------------ */

/** Source asset for the betel leaf graphic drawn behind the avatar. */
export const BETEL_LEAF_SRC = "/images/betel-leaf.png";

/** Betel leaf image bounding box — centered at (540, 930), ~660x660. */
export const LEAF_CENTER_X = 540;
export const LEAF_CENTER_Y = 930;
export const LEAF_WIDTH = 660;
export const LEAF_HEIGHT = 660;

/** Circular avatar frame inside the leaf — radius 185 => ~370px across. */
export const CIRCLE_X = 540;
export const CIRCLE_Y = 890;
export const CIRCLE_RADIUS = 185;
/** Normalized pan range: +/-1 maps to one circle radius of movement. */
export const PAN_RANGE = 1;

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

/* ------------------------------------------------------------------ */
/* Zoom & pan (transform)                                              */
/* ------------------------------------------------------------------ */

export interface TransformOptions {
  /** 0.5x..3.0x zoom of the user photo inside the circular frame */
  scale: number;
  /** Horizontal pan offset, normalized -1..1 (1 = one circle radius) */
  normX: number;
  /** Vertical pan offset, normalized -1..1 (1 = one circle radius) */
  normY: number;
}

export interface CircleDrawRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Compute the user photo draw rect in FINAL 1080x1920 coordinates. The
 * interactive preview scale-copies this rect, so the crop always matches.
 * Base size covers the circle (cover-fit of original aspect) then scales by
 * `transform.scale` and pans by the normalized offsets `normX/normY`.
 */
export function computeCircleUserDraw(
  imgW: number,
  imgH: number,
  transform: TransformOptions
): CircleDrawRect {
  const base = CIRCLE_RADIUS * 2 * 1.1;
  const aspect = imgW / imgH;
  let drawW = base;
  let drawH = drawW / aspect;
  if (drawH < base) {
    drawH = base;
    drawW = drawH * aspect;
  }

  const w = drawW * transform.scale;
  const h = drawH * transform.scale;
  return {
    w,
    h,
    x: CIRCLE_X - w / 2 + transform.normX * CIRCLE_RADIUS,
    y: CIRCLE_Y - h / 2 + transform.normY * CIRCLE_RADIUS,
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
/* 5th Master Talisman composer                                        */
/* ------------------------------------------------------------------ */

export interface GenerateOptions {
  userImage: HTMLImageElement;
  userName: string;
  unlockedDate: string;
  talatphluBlessing: string;
  personalPromise: string;
  transform: TransformOptions;
  format?: "image/jpeg" | "image/png";
  quality?: number;
}

/**
 * Composite the 5th Master Talisman on a 1080x1920 canvas:
 * 4-card seamless 2x2 background -> vignette -> double gold frame ->
 * betel leaf graphic -> circular user-avatar crop (zoom/pan) ->
 * glowing gold ring -> ceremony typography. Returns a data URL.
 */
export async function generateFinalGuardianCard({
  userImage,
  userName,
  unlockedDate,
  personalPromise,
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

  // 1. Load the 4 card backdrops and the betel leaf graphic.
  const [fireImg, waterImg, windImg, earthImg, leafImg] = await Promise.all([
    loadImage(GUARDIAN_DATA.fire.cardImageUrl),
    loadImage(GUARDIAN_DATA.water.cardImageUrl),
    loadImage(GUARDIAN_DATA.wind.cardImageUrl),
    loadImage(GUARDIAN_DATA.earth.cardImageUrl),
    loadImage(BETEL_LEAF_SRC),
  ]);

  // 2. Draw the 4 cards as a seamless 2x2 background grid.
  const halfW = MASTER_CARD_WIDTH / 2;
  const halfH = MASTER_CARD_HEIGHT / 2;
  ctx.drawImage(fireImg, 0, 0, halfW, halfH); // Top-Left  : Chinese Guardian (Fire)
  ctx.drawImage(waterImg, halfW, 0, halfW, halfH); // Top-Right : Mon Guardian (Water)
  ctx.drawImage(windImg, 0, halfH, halfW, halfH); // Bottom-L  : Thai Guardian (Wind)
  ctx.drawImage(earthImg, halfW, halfH, halfW, halfH); // Bottom-R : Muslim Guardian (Earth)

  // 3. Dark vignette so the centerpiece stands out.
  const radial = ctx.createRadialGradient(540, 960, 180, 540, 960, 920);
  radial.addColorStop(0, "rgba(0, 0, 0, 0.45)");
  radial.addColorStop(1, "rgba(0, 0, 0, 0.88)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, MASTER_CARD_WIDTH, MASTER_CARD_HEIGHT);

  // 4. Double outer gold frame.
  ctx.strokeStyle = GOLD_DARK;
  ctx.lineWidth = 14;
  ctx.strokeRect(24, 24, 1032, 1872);
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, 1000, 1840);

  // 5. Betel leaf graphic (centered behind the avatar).
  ctx.drawImage(
    leafImg,
    LEAF_CENTER_X - LEAF_WIDTH / 2,
    LEAF_CENTER_Y - LEAF_HEIGHT / 2,
    LEAF_WIDTH,
    LEAF_HEIGHT
  );

  // 6. Circular user photo mask inside the leaf (arc clip, honor zoom & pan).
  ctx.save();
  ctx.beginPath();
  ctx.arc(CIRCLE_X, CIRCLE_Y, CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const photoW = userImage.naturalWidth || userImage.width;
  const photoH = userImage.naturalHeight || userImage.height;
  const draw = computeCircleUserDraw(photoW, photoH, transform);
  ctx.drawImage(userImage, draw.x, draw.y, draw.w, draw.h);
  ctx.restore();

  // 7. Glowing gold ring around the circular photo.
  ctx.save();
  ctx.beginPath();
  ctx.arc(CIRCLE_X, CIRCLE_Y, CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 8;
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.restore();

  // 8. Header typography.
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;

  ctx.font = `bold 50px ${FONT_STACK}`;
  ctx.fillText("GUARDIANS OF TALATPHLU", 540, 130);
  ctx.font = `24px ${FONT_STACK}`;
  ctx.fillStyle = "#E8D5B5";
  ctx.fillText("มหาสถิต ๔ ผู้พิทักษ์แห่งตลาดพลู", 540, 175);

  // 9. Badge & subtitle (just under the leaf).
  ctx.font = `bold 36px ${FONT_STACK}`;
  ctx.fillStyle = GOLD;
  ctx.fillText("THE FIFTH GUARDIAN", 540, 1340);
  ctx.font = `22px ${FONT_STACK}`;
  ctx.fillStyle = "#F5E6CC";
  ctx.fillText("พลังจิตวิญญาณแห่งมนุษย์ • THE POWER OF HUMAN SPIRIT", 540, 1380);

  // 10. User name.
  const name = userName.trim() || "ผู้พิทักษ์แห่งตลาดพลู";
  const nameSize = fitText(ctx, name, 900, 44, 800, 20);
  ctx.font = `bold ${nameSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(name, 540, 1450);

  // 11. Personal promise inscription.
  const promise = personalPromise.trim();
  if (promise) {
    const inscription = `“สัญญาว่า: ${promise}”`;
    const promiseSize = fitText(ctx, inscription, 920, 24, 600, 13);
    ctx.font = `italic ${promiseSize}px ${FONT_STACK}`;
    ctx.fillStyle = GOLD;
    ctx.fillText(inscription, 540, 1505);
  }

  // 12. Timestamp.
  ctx.font = `20px ${FONT_STACK}`;
  ctx.fillStyle = "#B0A08D";
  ctx.fillText(`พิธีปลุกเสกสำเร็จเมื่อ: ${formatThaiDate(unlockedDate)}`, 540, 1560);

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
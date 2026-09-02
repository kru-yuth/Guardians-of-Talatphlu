"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GUARDIAN_DATA, GUARDIAN_ORDER } from "@/data/guardians";
import { useGuardians } from "@/hooks/useGuardians";
import { logFifthGuardianSubmission } from "@/utils/analytics";
import {
  BETEL_LEAF_SRC,
  CIRCLE_RADIUS,
  CIRCLE_X,
  CIRCLE_Y,
  computeCircleUserDraw,
  downloadDataUrl,
  generateFinalGuardianCard,
  LEAF_CENTER_X,
  LEAF_CENTER_Y,
  LEAF_HEIGHT,
  LEAF_WIDTH,
  loadImage,
  MASTER_CARD_HEIGHT,
  MASTER_CARD_WIDTH,
} from "@/utils/canvasGenerator";
import type { TransformOptions } from "@/utils/canvasGenerator";
import type { GuardianId } from "@/types/guardian";
import { getStoredState } from "@/utils/storage";
import LogoBar from "@/components/LogoBar";

type ImageFormat = "image/jpeg" | "image/png";

const PREVIEW_W = 340;
const PREVIEW_H = Math.round(PREVIEW_W * (MASTER_CARD_HEIGHT / MASTER_CARD_WIDTH));

const DEFAULT_TRANSFORM = { scale: 1, normX: 0, normY: 0 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M12 4v11" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export default function FinalCardPage() {
  const { state, submitFifthGuardian } = useGuardians();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [bgReady, setBgReady] = useState(false);
  const [leafImg, setLeafImg] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<TransformOptions>(DEFAULT_TRANSFORM);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ImageFormat>("image/jpeg");
  const [blessingDraft, setBlessingDraft] = useState(
    () => getStoredState().fifthGuardian?.talatphluBlessing ?? ""
  );
  const [promiseDraft, setPromiseDraft] = useState(
    () => getStoredState().fifthGuardian?.personalPromise ?? ""
  );
  const [ceremonyError, setCeremonyError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const photoUrlRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const userImageRef = useRef<HTMLImageElement | null>(null);
  const bgRefs = useRef<Partial<Record<string, HTMLImageElement>>>({});
  const dragRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const submissionSavedRef = useRef(false);

  const collectedCount = state
    ? GUARDIAN_ORDER.filter((id) => state.guardians[id].unlocked).length
    : 0;
  const ready = state ? collectedCount === 4 : false;
  const userName = state?.userName ?? "";
  const completedCard = state?.fifthGuardian;
  const hasSavedCard = Boolean(completedCard?.completedAt && completedCard?.finalImageUrl);
  // Show the completed talisman directly when it exists — no form re-run.
  const viewingSaved = hasSavedCard && !editMode;

  /* ---- Preload the 4 guardian backdrops once (they mirror the final grid). ---- */
  useEffect(() => {
    let alive = true;
    void Promise.all(
      GUARDIAN_ORDER.map(async (id) => {
        try {
          return { id, img: await loadImage(GUARDIAN_DATA[id].cardImageUrl) };
        } catch {
          return { id, img: null };
        }
      })
    ).then((loaded) => {
      if (!alive) return;
      for (const { id, img } of loaded) {
        if (img) bgRefs.current[id] = img;
      }
      setBgReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* ---- Preload the betel leaf graphic behind the avatar. ---- */
  useEffect(() => {
    let alive = true;
    loadImage(BETEL_LEAF_SRC)
      .then((img) => {
        if (alive) setLeafImg(img);
      })
      .catch(() => {
        /* leaf is decorative; preview still renders without it */
      });
    return () => {
      alive = false;
    };
  }, []);

  /* ---- Decode the uploaded photo into an HTMLImageElement. ---- */
  useEffect(() => {
    if (!photoUrl) return;
    let alive = true;
    loadImage(photoUrl)
      .then((img) => {
        if (alive) {
          userImageRef.current = img;
          setUserImage(img);
        }
      })
      .catch(() => {
        if (alive) setError("อ่านรูปภาพไม่สำเร็จ กรุณาเลือกรูปใหม่");
      });
    return () => {
      alive = false;
    };
  }, [photoUrl]);

  /* ---- Live preview: mirrors generateFinalGuardianCard 1:1 (scale 340/1080). ---- */
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const photo = userImageRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = PREVIEW_W / MASTER_CARD_WIDTH;
    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.fillStyle = "#0B1220";
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

    // 2x2 guardian backdrop.
    const quadW = (MASTER_CARD_WIDTH / 2) * s;
    const quadH = (MASTER_CARD_HEIGHT / 2) * s;
    const drawQuad = (id: GuardianId, x: number, y: number) => {
      const img = bgRefs.current[id];
      if (img) {
        ctx.drawImage(img, x, y, quadW, quadH);
        ctx.save();
        ctx.font = "700 11px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(GUARDIAN_DATA[id].name, x + 6, y + 6);
        ctx.restore();
      }
    };
    drawQuad("fire", 0, 0); // Top-Left  : Fire
    drawQuad("water", quadW, 0); // Top-Right : Water
    drawQuad("wind", 0, quadH); // Bottom-Left: Wind
    drawQuad("earth", quadW, quadH); // Bottom-Right: Earth

    // Vignette (matches final generator).
    const vignette = ctx.createRadialGradient(540 * s, 960 * s, 180 * s, 540 * s, 960 * s, 920 * s);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0.45)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.88)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

    // Double outer gold frame.
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 14 * s;
    ctx.strokeRect(24 * s, 24 * s, 1032 * s, 1872 * s);
    ctx.lineWidth = 3 * s;
    ctx.strokeRect(40 * s, 40 * s, 1000 * s, 1840 * s);

    // Betel leaf graphic.
    if (leafImg) {
      ctx.drawImage(
        leafImg,
        (LEAF_CENTER_X - LEAF_WIDTH / 2) * s,
        (LEAF_CENTER_Y - LEAF_HEIGHT / 2) * s,
        LEAF_WIDTH * s,
        LEAF_HEIGHT * s
      );
    }

    // Circular user photo mask (arc clip, shared with the final generator).
    if (photo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(CIRCLE_X * s, CIRCLE_Y * s, CIRCLE_RADIUS * s, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      // Photo rect is computed in FINAL 1080x1920 coordinates (shared with
      // generateFinalGuardianCard) then scaled down by `s` for the preview,
      // so zoom & pan are pixel-identical between preview and generated card.
      const dr = computeCircleUserDraw(
        photo.naturalWidth || photo.width,
        photo.naturalHeight || photo.height,
        transform
      );
      ctx.drawImage(photo, dr.x * s, dr.y * s, dr.w * s, dr.h * s);
      ctx.restore();
    }

    // Glowing gold ring around the circular photo.
    ctx.save();
    ctx.beginPath();
    ctx.arc(CIRCLE_X * s, CIRCLE_Y * s, CIRCLE_RADIUS * s, 0, Math.PI * 2);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 8 * s;
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 20 * s;
    ctx.stroke();
    ctx.restore();

    // Typography mirrors the final layout (sizes shared, drawn scaled).
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `bold 50px sans-serif`;
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 8;
    ctx.fillText("GUARDIANS OF TALATPHLU", 540 * s, 130 * s);
    ctx.font = `24px sans-serif`;
    ctx.fillStyle = "#E8D5B5";
    ctx.fillText("มหาสถิต ๔ ผู้พิทักษ์แห่งตลาดพลู", 540 * s, 175 * s);
    ctx.font = `bold 36px sans-serif`;
    ctx.fillStyle = "#FFD700";
    ctx.fillText("THE FIFTH GUARDIAN", 540 * s, 1340 * s);
    ctx.font = `22px sans-serif`;
    ctx.fillStyle = "#F5E6CC";
    ctx.fillText("พลังจิตวิญญาณแห่งมนุษย์ • THE POWER OF HUMAN SPIRIT", 540 * s, 1380 * s);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `24px sans-serif`;
    const name = userName.trim() || "ผู้พิทักษ์แห่งตลาดพลู";
    ctx.fillText(name, 540 * s, 1450 * s);
    ctx.restore();

    ctx.save();
    ctx.font = "500 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("แสดงผลจริง · ครอบเฉพาะกรอบวงกลม", PREVIEW_W / 2, PREVIEW_H - 12);
    ctx.restore();
  }, [transform, leafImg, userName]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview, userImage, bgReady]);

  /* ---- Wheel to zoom the photo inside the leaf. ---- */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setTransform((t) => ({
        ...t,
        scale: clamp(t.scale * (1 - e.deltaY * 0.001), 0.5, 3),
      }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY, active: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY, active: true };
    const s = PREVIEW_W / MASTER_CARD_WIDTH;
    setTransform((t) => ({
      ...t,
      normX: clamp(t.normX + dx / (CIRCLE_RADIUS * s), -1, 1),
      normY: clamp(t.normY + dy / (CIRCLE_RADIUS * s), -1, 1),
    }));
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  const handleScale = (value: number) => {
    setTransform((t) => ({ ...t, scale: clamp(value, 0.5, 3) }));
  };

  const handleResetTransform = () => setTransform(DEFAULT_TRANSFORM);

  const handleGenerate = useCallback(
    async (overrideFormat?: ImageFormat) => {
      if (!userImage || !state) return;
      const blessing = blessingDraft.trim();
      const promise = promiseDraft.trim();
      if (!blessing || !promise) {
        setCeremonyError("กรุณาเขียนพรแด่ตลาดพลูและปณิธานส่วนตัวก่อนสร้างการ์ด");
        return;
      }
      setCeremonyError(null);
      setGenerating(true);
      setError(null);
      try {
        const url = await generateFinalGuardianCard({
          userImage,
          userName: state.userName,
          unlockedDate: state.fifthGuardian?.completedAt ?? new Date().toISOString(),
          transform,
          format: overrideFormat ?? format,
          talatphluBlessing: blessing,
          personalPromise: promise,
        });
        setResultDataUrl(url);
        if (!submissionSavedRef.current) {
          submissionSavedRef.current = true;
          submitFifthGuardian({
            talatphluBlessing: blessing,
            personalPromise: promise,
            finalImageUrl: url,
          });
          await logFifthGuardianSubmission({
            userName: state.userName || "ผู้ไม่ประสงค์ออกนาม",
            talatphluBlessing: blessing,
            personalPromise: promise,
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "สร้างการ์ดไม่สำเร็จ กรุณาลองใหม่");
      } finally {
        setGenerating(false);
      }
    },
    [userImage, state, transform, format, blessingDraft, promiseDraft, submitFifthGuardian]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    const url = URL.createObjectURL(file);
    photoUrlRef.current = url;
    setResultDataUrl(null);
    setError(null);
    setTransform(DEFAULT_TRANSFORM);
    setPhotoUrl(url);
    e.target.value = "";
  };

  useEffect(() => {
    return () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    };
  }, []);

  const handleDownload = (url = resultDataUrl) => {
    if (!url) return;
    const ext = url.startsWith("data:image/png") ? "png" : "jpg";
    downloadDataUrl(url, `guardian-master-talatphlu.${ext}`);
  };

  const changeFormat = (value: ImageFormat) => {
    setFormat(value);
    if (resultDataUrl && userImage) void handleGenerate(value);
  };

  const handleRetake = () => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = null;
    setPhotoUrl(null);
    setUserImage(null);
    userImageRef.current = null;
    setResultDataUrl(null);
    setTransform(DEFAULT_TRANSFORM);
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 py-8">
      <LogoBar />

      <h1 className="anim-reveal text-2xl font-black leading-snug">
        พิธีรวมร่างผู้พิทักษ์ · <span className="text-gold">การ์ดใบที่ 5</span>
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-cream/65">
        ทั้ง 4 ผู้พิทักษ์ถูกเรียงต่อเป็นผืนหลังฉาก เขียน<span className="text-gold">พรแด่ตลาดพลู</span>
        และ<span className="text-gold">ปณิธานส่วนตัว</span>ของคุณ แล้วเติมรูปตรงกลาง
        <b className="text-gold">ใบพลู</b> เป็นกรอบวงกลม เพื่อร่วมร่างเป็นผู้พิทักษ์ตนที่ 5
      </p>

      {!state ? (
        <div className="mt-8 flex items-center justify-center py-16">
          <span className="size-8 animate-spin rounded-full border-4 border-gold/20 border-t-gold" />
        </div>
      ) : !ready ? (
        <div className="anim-reveal mt-8 rounded-3xl border border-cream/15 bg-inksoft/40 p-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full border border-gold/40 bg-ink text-2xl font-extrabold text-gold">
            {collectedCount}
          </span>
          <h2 className="mt-4 text-lg font-bold text-cream">ยังไม่ครบทั้ง 4 ธาตุ</h2>
          <p className="mt-1 text-sm leading-relaxed text-cream/60">
            พิธีรวมร่างจะเปิดขึ้นเมื่อคุณปลุกผู้พิทักษ์ครบ 4 ธาตุ (ไฟ · ดิน · ลม · น้ำ) ผ่านคำถามแห่งพิธีกรรม
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-bold text-ink transition hover:bg-golddark"
          >
            กลับไปคอลเลกชัน
          </Link>
        </div>
      ) : viewingSaved && completedCard ? (
        <section className="anim-reveal mt-6 space-y-5" style={{ animationDelay: "80ms" }}>
          <div className="rounded-3xl border border-gold/30 bg-inksoft/40 p-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-gold">
              ✦ การ์ดพิธีรวมร่างของคุณ
            </span>
            <p className="mt-3 text-sm leading-relaxed text-cream/80">
              “{completedCard.talatphluBlessing}”
            </p>
            <p className="mt-1 text-xs italic text-gold/90">
              สัญญาว่า: {completedCard.personalPromise}
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border-2 border-gold/50 bg-ink shadow-[0_20px_80px_-20px_rgba(255,215,0,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={completedCard.finalImageUrl}
              alt="การ์ดผู้พิทักษ์ใบที่ 5 พิธีรวมร่าง ของคุณ"
              className="h-auto w-full"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => handleDownload(completedCard.finalImageUrl)}
              className="flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-4 text-base font-extrabold text-ink shadow-[0_14px_40px_-10px_rgba(255,215,0,0.6)] transition hover:bg-golddark active:scale-[0.98]"
            >
              <DownloadIcon />
              ดาวน์โหลดการ์ดรวมร่าง
            </button>
            <Link
              href="/community"
              className="block w-full py-3 bg-stone-900 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-xl text-center hover:bg-stone-800 transition"
            >
🌐 ดูเสียงคำอวยพรของทุกคนในงาน (Wall of Wishes)
            </Link>
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="rounded-full border border-cream/20 px-5 py-3 text-sm font-semibold text-cream/80 transition hover:border-gold/50 hover:text-gold"
            >
              จัดองค์ประกอบใหม่ (บลแต่งรูปกับข้อความ)
            </button>
            <Link
              href="/"
              className="rounded-full border border-cream/20 px-5 py-3 text-center text-sm font-semibold text-cream/80 transition hover:border-gold/50 hover:text-gold"
            >
              กลับไปคอลเลกชัน
            </Link>
          </div>
        </section>
      ) : (
        <div className="anim-reveal mt-6 space-y-5" style={{ animationDelay: "80ms" }}>
          {/* Ceremony vows */}
          <section className="rounded-3xl border border-cream/15 bg-inksoft/40 p-5">
            <h2 className="text-base font-bold text-cream">ตอกย้ำพิธีรวมร่าง</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-cream/55">
              ทั้งสองข้อความนี้จะถูกประทับลงบนการ์ดใบที่ 5 ของคุณ
            </p>

            <label htmlFor="ceremony-blessing" className="mt-4 block text-xs font-semibold text-cream/80">
              พรแด่ตลาดพลู <span className="text-gold">*</span>
            </label>
            <textarea
              id="ceremony-blessing"
              rows={3}
              value={blessingDraft}
              onChange={(e) => {
                setBlessingDraft(e.target.value);
                setCeremonyError(null);
              }}
              maxLength={200}
              placeholder="เช่น ขอให้ตลาดพลูยังมีร้านดี ๆ ผู้คนคอยดูแลกันและกัน"
              className="mt-2 w-full resize-none rounded-xl border border-cream/20 bg-ink/70 px-4 py-3 text-sm text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none"
            />

            <label htmlFor="ceremony-promise" className="mt-4 block text-xs font-semibold text-cream/80">
              ปณิธานส่วนตัวของคุณ <span className="text-gold">*</span>
            </label>
            <textarea
              id="ceremony-promise"
              rows={3}
              value={promiseDraft}
              onChange={(e) => {
                setPromiseDraft(e.target.value);
                setCeremonyError(null);
              }}
              maxLength={200}
              placeholder="เช่น ฉันจะกลับมาอุดหนุนร้านในตลาดพลูอย่างน้อยเดือนละครั้ง"
              className="mt-2 w-full resize-none rounded-xl border border-cream/20 bg-ink/70 px-4 py-3 text-sm text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none"
            />

            {ceremonyError && (
              <p className="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {ceremonyError}
              </p>
            )}
          </section>

          {/* Upload control */}
          {!photoUrl && (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-gold/40 bg-inksoft/30 p-8 text-center transition hover:border-gold/70 hover:bg-inksoft/50">
              <CameraIcon />
              <span className="text-sm font-semibold text-cream/85">
                เลือกรูปของคุณ (แนะนำถ่ายแนวตั้ง)
              </span>
              <span className="text-xs text-cream/50">
                รูปจะถูกครอบเป็นวงกลมกลางใบพลูอัตโนมัติ · รูปอยู่บนเครื่องคุณเท่านั้น บันทึกเฉพาะข้อความพรและปณิธานแบบนิรนาม
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="sr-only"
                aria-label="เลือกรูปภาพ"
              />
            </label>
          )}

          {error && <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          {photoUrl && (
            <>
              {generating && (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-cream/15 bg-inksoft/40 py-6 text-sm text-cream/70">
                  <span className="size-6 animate-spin rounded-full border-4 border-gold/20 border-t-gold" />
                  กำลังประดิษฐานรูปของคุณกลางยันต์…
                </div>
              )}

              {/* Live zoom/pan editor with real-time circular crop preview */}
              <div className="overflow-hidden rounded-3xl border-2 border-gold/50 bg-ink shadow-[0_20px_80px_-20px_rgba(255,215,0,0.35)]">
                <canvas
                  ref={canvasRef}
                  width={PREVIEW_W}
                  height={PREVIEW_H}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className={`block h-auto w-full touch-none select-none ${userImage ? "cursor-grab active:cursor-grabbing" : ""}`}
                  aria-label="ตัวอย่างการ์ดแบบเรียลไทม์ — ลากเพื่อเลื่อนตำแหน่งรูป"
                />
              </div>

              {/* Transform controls */}
              <div className="space-y-3 rounded-2xl border border-cream/15 bg-inksoft/40 p-4">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="zoom-range" className="font-semibold text-cream/80">
                    ซูมรูป
                  </label>
                  <span className="rounded-full bg-ink px-2.5 py-0.5 font-bold text-gold">
                    {transform.scale.toFixed(1)}×
                  </span>
                </div>
                <input
                  id="zoom-range"
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.05}
                  value={transform.scale}
                  onChange={(e) => handleScale(parseFloat(e.target.value))}
                  className="w-full accent-gold"
                  aria-label="ซูม 0.5 ถึง 3 เท่า"
                />

                <div className="flex items-center justify-between text-xs text-cream/55">
                  <span className="font-medium">
                    ตำแหน่ง: X {transform.normX.toFixed(2)} · Y {transform.normY.toFixed(2)} (-1 ถึง 1)
                  </span>
                  <button
                    type="button"
                    onClick={handleResetTransform}
                    className="rounded-full border border-cream/20 px-3 py-1 font-semibold text-cream/75 transition hover:border-gold/50 hover:text-gold"
                  >
                    ปรับกึ่งกลาง
                  </button>
                </div>

                <p className="text-[11px] leading-relaxed text-cream/45">
                  ลากบนรูปเพื่อเลื่อนตำแหน่ง · ใช้แถบด้านบนหรือล้อเลื่อนเพื่อซูม พอดีกับกรอบวงกลมกลางใบพลูแล้วกด
                  &quot;ประกอบการ์ดพิธีรวมร่าง&quot;
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={generating || !userImage}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-4 text-base font-extrabold text-ink shadow-[0_14px_40px_-10px_rgba(255,215,0,0.6)] transition hover:bg-golddark active:scale-[0.98] disabled:opacity-60"
              >
                ประกอบการ์ดพิธีรวมร่าง (1080 × 1920)
              </button>
            </>
          )}

          {/* Final result */}
          {resultDataUrl && !generating && (
            <>
              <div className="overflow-hidden rounded-3xl border-2 border-gold/50 bg-ink shadow-[0_20px_80px_-20px_rgba(255,215,0,0.35)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultDataUrl}
                  alt="การ์ดผู้พิทักษ์ใบที่ 5 พิธีรวมร่าง ตัวอย่าง"
                  className="h-auto w-full"
                />
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-semibold text-cream/60">รูปแบบไฟล์</span>
                {(
                  [
                    ["image/jpeg", "JPEG"],
                    ["image/png", "PNG"],
                  ] as [ImageFormat, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changeFormat(value)}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                      format === value
                        ? "border-gold bg-gold text-ink"
                        : "border-cream/25 text-cream/70 hover:border-gold/50 hover:text-gold"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => handleDownload()}
                  className="flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-4 text-base font-extrabold text-ink shadow-[0_14px_40px_-10px_rgba(255,215,0,0.6)] transition hover:bg-golddark active:scale-[0.98]"
                >
                  <DownloadIcon />
                  ดาวน์โหลดการ์ดรวมร่าง
                </button>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="rounded-full border border-cream/20 px-5 py-3 text-sm font-semibold text-cream/80 transition hover:border-gold/50 hover:text-gold"
                >
                  เปลี่ยนรูปใหม่
                </button>
                <Link
                  href="/"
                  className="rounded-full border border-cream/20 px-5 py-3 text-center text-sm font-semibold text-cream/80 transition hover:border-gold/50 hover:text-gold"
                >
                  กลับไปคอลเลกชัน
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
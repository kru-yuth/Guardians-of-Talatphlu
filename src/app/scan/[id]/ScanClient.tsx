"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import type { Guardian } from "@/types/guardian";
import { GUARDIAN_ORDER } from "@/data/guardians";
import { useGuardians } from "@/hooks/useGuardians";
import { formatThaiDate } from "@/utils/storage";
import LogoBar from "@/components/LogoBar";

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

export default function ScanClient({ guardian }: { guardian: Guardian }) {
  const router = useRouter();
  const { state, setName, collect } = useGuardians();
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [blessing, setBlessing] = useState("");
  const [justUnlocked, setJustUnlocked] = useState(false);

  const collected = state?.cards[guardian.id];
  const allCollected = state ? GUARDIAN_ORDER.every((id) => state.cards[id]) : false;
  const playerName = state?.playerName ?? "";

  // Once all 4 guardians are collected, gently move the user to /final-card.
  useEffect(() => {
    if (!allCollected || !justUnlocked) return;
    const timer = setTimeout(() => router.push("/final-card"), 4500);
    return () => clearTimeout(timer);
  }, [allCollected, justUnlocked, router]);

  const theme = {
    "--g-primary": guardian.primary,
    "--g-accent": guardian.accent,
  } as CSSProperties;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName) {
      const name = nameDraft.trim();
      if (!name) {
        setNameError("กรุณากรอกชื่อของคุณก่อน");
        return;
      }
      setName(name);
    }
    if (!blessing) return;
    collect(guardian.id, blessing);
    setJustUnlocked(true);
  };

  const alreadyCollected = Boolean(collected) && !justUnlocked;

  return (
    <main style={theme} className="mx-auto min-h-dvh w-full max-w-md px-5 py-8">
      <LogoBar />

      {/* Checkpoint header */}
      <section className="anim-reveal mb-6">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em]"
          style={{ color: guardian.accent, borderColor: guardian.accent }}
        >
          จุดสแกน · {guardian.directionThai}
        </span>
        <h1
          className="mt-3 text-3xl font-black leading-tight"
          style={{ color: guardian.accent }}
        >
          {guardian.title}
        </h1>
        <p className="mt-1 text-sm text-cream/70">
          ธาตุ{guardian.elementThai} · {guardian.communityThai} · สัญลักษณ์ {guardian.motifThai}
        </p>
      </section>

      {alreadyCollected ? (
        /* Already unlocked state */
        <div className="anim-reveal space-y-5">
          <div className="relative overflow-hidden rounded-3xl border-2" style={{ borderColor: guardian.primary }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={guardian.image} alt={`${guardian.title}`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4 pt-16">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-widest"
                style={{ color: guardian.accent, borderColor: guardian.accent }}
              >
                ● ปลดล็อกแล้ว
              </span>
              <p className="mt-2 text-base font-bold text-cream">{collected?.blessing}</p>
              {collected && (
                <p className="mt-1 text-xs text-cream/60">ปลดล็อกเมื่อ {formatThaiDate(collected.unlockedAt)}</p>
              )}
              <p className="mt-2 text-sm text-cream/80">
                ในนามของ <span className="font-bold text-gold">{collected?.playerName}</span> เหนือหัวใจตลาดพลู
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <a
              href={guardian.image}
              download={`guardian-${guardian.id}-card.jpg`}
              className="flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink transition hover:bg-golddark active:scale-95"
            >
              <DownloadIcon />
              ดาวน์โหลดการ์ดความละเอียดสูง
            </a>
            <Link
              href="/"
              className="flex items-center justify-center rounded-full border border-cream/20 px-5 py-3 text-sm font-semibold text-cream/85 transition hover:border-gold/50 hover:text-gold"
            >
              กลับไปคอลเลกชัน
            </Link>
          </div>
        </div>
      ) : (
        /* Claim form */
        <form onSubmit={handleSubmit} className="anim-reveal space-y-5" style={{ animationDelay: "80ms" }}>
          <div className="rounded-3xl border border-cream/15 bg-inksoft/40 p-5">
            <h2 className="text-base font-bold text-cream">ขึ้นทะเบียนคำอธิษฐานของคุณ</h2>
            <p className="mt-1 text-xs leading-relaxed text-cream/60">
              เลือกคำมั่นสัญญา 1 ข้อ เพื่อมอบพลังคำอวยพรแก่{guardian.title} ประจำตลาดพลู
            </p>

            {!playerName && (
              <div className="mt-4">
                <label htmlFor="scan-name" className="block text-xs font-semibold text-cream/80">
                  ชื่อของคุณ <span className="text-gold">*</span>
                </label>
                <input
                  id="scan-name"
                  required
                  value={nameDraft}
                  onChange={(e) => {
                    setNameDraft(e.target.value);
                    setNameError("");
                  }}
                  maxLength={40}
                  placeholder="พิมพ์ชื่อเพื่อประทับบนการ์ด"
                  aria-invalid={Boolean(nameError)}
                  className="mt-2 w-full rounded-xl border border-cream/20 bg-ink/70 px-4 py-3 text-sm text-cream placeholder:text-cream/40 focus:border-[var(--g-accent)] focus:outline-none"
                />
                {nameError && <p className="mt-1 text-xs text-red-400">{nameError}</p>}
              </div>
            )}
          </div>

          <fieldset className="space-y-3">
            <legend className="sr-only">เลือกคำอธิษฐาน</legend>
            {guardian.choices.map((choice, i) => {
              const selected = blessing === choice;
              return (
                <label
                  key={choice}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-inksoft/40 px-4 py-3.5 transition ${
                    selected ? "border-[var(--g-accent)]" : "border-cream/15 hover:border-cream/35"
                  }`}
                >
                  <input
                    type="radio"
                    name="blessing"
                    value={choice}
                    checked={selected}
                    onChange={() => setBlessing(choice)}
                    className="sr-only"
                  />
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full border-2 text-[11px] font-bold transition ${
                      selected
                        ? "border-[var(--g-accent)] bg-[var(--g-accent)] text-ink"
                        : "border-cream/30 text-transparent"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-sm font-medium ${selected ? "text-cream" : "text-cream/75"}`}>
                    {choice}
                  </span>
                </label>
              );
            })}
          </fieldset>

          <button
            type="submit"
            disabled={!blessing}
            className="w-full rounded-full py-4 text-base font-extrabold text-ink transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: `linear-gradient(135deg, var(--g-accent), var(--g-primary))`,
            }}
          >
            รับพลังคำอวยพรจาก {guardian.title}
          </button>

          {!playerName && !nameError && (
            <p className="text-center text-[11px] text-cream/45">
              ชื่อของคุณจะใช้ครั้งเดียวในการ์ดทั้งหมด · ข้อมูลอยู่บนเครื่องของคุณเท่านั้น
            </p>
          )}
        </form>
      )}

      {justUnlocked && (
        <div className="anim-reveal mt-6 space-y-5">
          <div className="relative overflow-hidden rounded-3xl border-2" style={{ borderColor: guardian.primary }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={guardian.image}
              alt={`${guardian.title} ปลดล็อกแล้ว`}
              className="anim-float-glow h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4 pt-16">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-widest"
                style={{ color: guardian.accent, borderColor: guardian.accent }}
              >
                ปลดล็อก ธาตุ{guardian.elementThai} สำเร็จ
              </span>
              <p className="mt-2 text-base font-bold text-cream">{blessing}</p>
              {state?.cards[guardian.id] && (
                <p className="mt-1 text-xs text-cream/60">
                  ปลดล็อกเมื่อ {formatThaiDate(state.cards[guardian.id]!.unlockedAt)}
                </p>
              )}
            </div>
          </div>

          {allCollected && justUnlocked && (
            <p className="text-center text-xs font-medium text-gold/90">
              ครบทั้ง 4 ธาตุแล้ว — กำลังนำคุณไปสร้างการ์ดใบที่ 5 อัตโนมัติ…
            </p>
          )}

          <div className="grid grid-cols-1 gap-3">
            <a
              href={guardian.image}
              download={`guardian-${guardian.id}-card.jpg`}
              className="flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink transition hover:bg-golddark active:scale-95"
            >
              <DownloadIcon />
              ดาวน์โหลดการ์ดความละเอียดสูง
            </a>
            {allCollected ? (
              <Link
                href="/final-card"
                className="flex items-center justify-center rounded-full bg-gradient-to-r from-golddark to-gold px-5 py-3 text-sm font-extrabold text-ink transition hover:brightness-110 active:scale-95"
              >
                ครบ 4 ธาตุแล้ว → สร้างการ์ดใบที่ 5
              </Link>
            ) : (
              <Link
                href="/"
                className="flex items-center justify-center rounded-full border border-cream/20 px-5 py-3 text-sm font-semibold text-cream/85 transition hover:border-gold/50 hover:text-gold"
              >
                กลับไปคอลเลกชัน
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
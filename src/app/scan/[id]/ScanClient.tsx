"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import type { GuardianMeta, GuardianQuestion } from "@/types/guardian";
import { GUARDIAN_ORDER } from "@/data/guardians";
import { useGuardians } from "@/hooks/useGuardians";
import { formatThaiDate } from "@/utils/storage";
import { logCheckpointCompletion } from "@/utils/analytics";
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

export default function ScanClient({ guardian }: { guardian: GuardianMeta }) {
  const router = useRouter();
  const { state, setName, awaken } = useGuardians();
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [justAwakened, setJustAwakened] = useState(false);
  const [stage, setStage] = useState<"story" | "questions" | "awakened">("story");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionError, setQuestionError] = useState("");

  const progress = state?.guardians[guardian.id];
  const isUnlocked = Boolean(progress?.unlocked);
  const userName = state?.userName ?? "";
  const allCollected = state
    ? GUARDIAN_ORDER.every((id) => state.guardians[id].unlocked)
    : false;
  const questions = guardian.questions;
  const currentQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;

  // Once all 4 guardians are awakened, gently move the user to the
  // 5th Guardian ceremony (/final-card).
  useEffect(() => {
    if (!allCollected || !justAwakened) return;
    const timer = setTimeout(() => router.push("/final-card"), 4500);
    return () => clearTimeout(timer);
  }, [allCollected, justAwakened, router]);

  const theme = {
    "--g-primary": guardian.themeColor.primary,
    "--g-accent": guardian.themeColor.accent,
  } as CSSProperties;

  const handleBegin = () => {
    if (!userName) {
      const name = nameDraft.trim();
      if (!name) {
        setNameError("กรุณากรอกชื่อของคุณก่อนเริ่มพิธี");
        return;
      }
      setName(name);
    }
    setStage("questions");
  };

  const handleNext = async () => {
    const q = currentQuestion;
    if (!q) return;
    if (!(answers[q.id] ?? "").trim()) {
      setQuestionError("กรุณาตอบคำถามข้อนี้ก่อน");
      return;
    }
    setQuestionError("");

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      await logCheckpointCompletion({
        userName: userName || "ผู้ไม่ประสงค์ออกนาม",
        guardianId: guardian.id,
        guardianName: guardian.name,
        element: guardian.element,
        answers,
      });
      awaken(guardian.id, answers);
      setJustAwakened(true);
      setStage("awakened");
    }
  };

  const setAnswer = (q: GuardianQuestion, value: string) => {
    setAnswers((a) => ({ ...a, [q.id]: value }));
    setQuestionError("");
  };

  const renderQuestionInput = (q: GuardianQuestion) => {
    if (q.type === "radio" && q.options) {
      return (
        <div className="mt-4 grid grid-cols-1 gap-2.5">
          {q.options.map((option) => {
            const selected = answers[q.id] === option;
            return (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-inksoft/40 px-4 py-3.5 transition ${
                  selected ? "border-[var(--g-accent)]" : "border-cream/15 hover:border-cream/35"
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={option}
                  checked={selected}
                  onChange={() => setAnswer(q, option)}
                  className="sr-only"
                />
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition ${
                    selected
                      ? "border-[var(--g-accent)] bg-[var(--g-accent)] text-ink"
                      : "border-cream/30"
                  }`}
                >
                  {selected ? "✓" : ""}
                </span>
                <span className={`text-sm font-medium ${selected ? "text-cream" : "text-cream/75"}`}>
                  {option}
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    const isNumber = q.type === "number";
    return (
      <input
        type={isNumber ? "number" : "text"}
        value={answers[q.id] ?? ""}
        onChange={(e) => setAnswer(q, e.target.value)}
        placeholder={q.placeholderTh}
        maxLength={isNumber ? undefined : 240}
        aria-label={`${q.questionTh} (${isNumber ? "ตัวเลข" : "ข้อความ"})`}
        className={`mt-4 w-full rounded-2xl border border-cream/20 bg-ink/70 px-4 py-3.5 text-sm text-cream placeholder:text-cream/40 focus:border-[var(--g-accent)] focus:outline-none`}
      />
    );
  };

  const talismanLink = (
    <a
      href={guardian.cardImageUrl}
      download={`${guardian.talismanDownloadName}.jpg`}
      className="flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-ink transition hover:bg-golddark active:scale-95"
    >
      <DownloadIcon />
      ดาวน์โหลดยันต์ {guardian.name}
    </a>
  );

  if (isUnlocked && !justAwakened) {
    return (
      <main style={theme} className="mx-auto min-h-dvh w-full max-w-md px-5 py-8">
        <LogoBar />
        <HeaderSection guardian={guardian} themeAccent={guardian.themeColor.accent} />

        <div className="anim-reveal space-y-5">
          <div className="relative overflow-hidden rounded-3xl border-2" style={{ borderColor: guardian.themeColor.primary }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={guardian.cardImageUrl} alt={`${guardian.titleTh}`} className="anim-float-glow h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4 pt-16">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-widest"
                style={{ color: guardian.themeColor.accent, borderColor: guardian.themeColor.accent }}
              >
                ● ปลุกแล้ว · {guardian.name}
              </span>
              {progress?.unlockedAt && (
                <p className="mt-1 text-xs text-cream/60">ปลุกเมื่อ {formatThaiDate(progress.unlockedAt)}</p>
              )}
              <p className="mt-2 text-sm text-cream/80">
                ในนามของ <span className="font-bold text-gold">{userName || "ผู้พิทักษ์แห่งตลาดพลู"}</span>
              </p>
            </div>
          </div>

          <section className="rounded-3xl border border-cream/15 bg-inksoft/40 p-5">
            <p className="whitespace-pre-line text-[15px] font-semibold leading-relaxed text-cream/95">
              {guardian.finalMessageTh}
            </p>
            <p className="mt-3 text-right text-xs italic text-cream/50">{guardian.quote.en}</p>
          </section>

          <div className="grid grid-cols-1 gap-3">
            {talismanLink}
            {allCollected ? (
              <Link
                href="/final-card"
                className="flex items-center justify-center rounded-full bg-gradient-to-r from-golddark to-gold px-5 py-3 text-sm font-extrabold text-ink transition hover:brightness-110 active:scale-95"
              >
                ครบ 4 ธาตุแล้ว → เข้าสู่พิธีรวมร่าง (การ์ดใบที่ 5)
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
      </main>
    );
  }

  return (
    <main style={theme} className="mx-auto min-h-dvh w-full max-w-md px-5 py-8">
      <LogoBar />
      <HeaderSection guardian={guardian} themeAccent={guardian.themeColor.accent} />

      {stage === "story" && (
        <section className="anim-reveal space-y-5">
          <div className={`rounded-3xl border border-cream/15 bg-gradient-to-b ${guardian.themeColor.bgGradient} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-cream/60">คำบอกเล่าแห่ง {guardian.name}</p>
            <p className="mt-3 whitespace-pre-line text-[15px] font-medium leading-relaxed text-cream/95">
              {guardian.storyTh}
            </p>
            <blockquote className="mt-4 border-l-2 pl-3" style={{ borderColor: guardian.themeColor.accent }}>
              <p className="text-sm italic text-cream/75">“{guardian.quote.th}”</p>
              <p className="mt-1 text-right text-[11px] text-cream/45">{guardian.quote.en}</p>
            </blockquote>
          </div>

          {!userName && (
            <div className="rounded-3xl border border-cream/15 bg-inksoft/40 p-5">
              <label htmlFor="scan-name" className="block text-xs font-semibold text-cream/80">
                ชื่อของคุณ <span className="text-gold">*</span>
              </label>
              <p className="mt-1 text-[11px] text-cream/50">ชื่อจะถูกประทับลงบนยันต์และใช้ในพิธีรวมร่างครั้งสุดท้าย</p>
              <input
                id="scan-name"
                required
                value={nameDraft}
                onChange={(e) => {
                  setNameDraft(e.target.value);
                  setNameError("");
                }}
                maxLength={40}
                placeholder="พิมพ์ชื่อเพื่อประทับบนยันต์"
                aria-invalid={Boolean(nameError)}
                className="mt-2 w-full rounded-xl border border-cream/20 bg-ink/70 px-4 py-3 text-sm text-cream placeholder:text-cream/40 focus:border-[var(--g-accent)] focus:outline-none"
              />
              {nameError && <p className="mt-1 text-xs text-red-400">{nameError}</p>}
            </div>
          )}

          <button
            type="button"
            onClick={handleBegin}
            className="w-full rounded-full py-4 text-base font-extrabold text-ink transition hover:brightness-110 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, var(--g-accent), var(--g-primary))`,
            }}
          >
            เปิดพิธีปลุก · {guardian.name}
          </button>
          <p className="text-center text-[11px] text-cream/45">
            จะมีคำถาม {questions.length} ข้อเพื่อตอกย้ำปณิธานของคุณ · คำตอบจะถูกบันทึกเป็นข้อมูลนิรนามเพื่อเก็บสถิติภาพรวม
          </p>
        </section>
      )}

      {stage === "questions" && currentQuestion && (
        <section className="anim-reveal space-y-5" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border px-3 py-1" style={{ color: guardian.themeColor.accent, borderColor: guardian.themeColor.accent }}>
              {questionIndex + 1} / {questions.length}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((questionIndex + 1) / questions.length) * 100}%`,
                  background: guardian.themeColor.accent,
                }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-cream/15 bg-inksoft/40 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-cream/45">
              {currentQuestion.questionEn}
            </p>
            <p className="mt-2 text-lg font-bold leading-snug text-cream">{currentQuestion.questionTh}</p>
            {renderQuestionInput(currentQuestion)}
          </div>

          {questionError && (
            <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {questionError}
            </p>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="w-full rounded-full py-4 text-base font-extrabold text-ink transition hover:brightness-110 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, var(--g-accent), var(--g-primary))`,
            }}
          >
            {isLastQuestion ? "ตอกย้ำปณิธาน · ปลุกขุมพลัง" : "คำถามถัดไป"}
          </button>
        </section>
      )}

      {stage === "awakened" && (
        <section className="anim-reveal mt-4 space-y-5">
          <div className="relative overflow-hidden rounded-3xl border-2" style={{ borderColor: guardian.themeColor.primary }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={guardian.cardImageUrl}
              alt={`${guardian.titleTh} ปลุกแล้ว`}
              className="anim-float-glow h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4 pt-16">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-widest"
                style={{ color: guardian.themeColor.accent, borderColor: guardian.themeColor.accent }}
              >
                ✦ ปลุก {guardian.name} สำเร็จ
              </span>
              {progress?.unlockedAt && (
                <p className="mt-1 text-xs text-cream/60">ปลุกเมื่อ {formatThaiDate(progress.unlockedAt)}</p>
              )}
            </div>
          </div>

          <section className="space-y-4 rounded-3xl border border-cream/15 bg-inksoft/40 p-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-widest"
              style={{ color: guardian.themeColor.accent, borderColor: guardian.themeColor.accent }}
            >
              สาส์นแห่งผู้พิทักษ์
            </span>
            <p className="whitespace-pre-line text-[15px] font-semibold leading-relaxed text-cream/95">
              {guardian.finalMessageTh}
            </p>
            <p className="text-right text-xs italic text-cream/50">{guardian.quote.en}</p>
          </section>

          {allCollected && justAwakened && (
            <p className="text-center text-xs font-medium text-gold/90">
              ปลุกครบทั้ง 4 ธาตุแล้ว — กำลังนำคุณไปสู่พิธีรวมร่าง การ์ดใบที่ 5 อัตโนมัติ…
            </p>
          )}

          <div className="grid grid-cols-1 gap-3">
            {talismanLink}
            {allCollected ? (
              <Link
                href="/final-card"
                className="flex items-center justify-center rounded-full bg-gradient-to-r from-golddark to-gold px-5 py-3 text-sm font-extrabold text-ink transition hover:brightness-110 active:scale-95"
              >
                ครบ 4 ธาตุแล้ว → เข้าสู่พิธีรวมร่าง (การ์ดใบที่ 5)
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
        </section>
      )}
    </main>
  );
}

function HeaderSection({ guardian, themeAccent }: { guardian: GuardianMeta; themeAccent: string }) {
  const titleMain = guardian.titleTh.split(" - ")[0];
  const titleRest = guardian.titleTh.split(" - ").slice(1).join(" - ");
  return (
    <section className="anim-reveal mb-6">
      <span
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em]"
        style={{ color: themeAccent, borderColor: themeAccent }}
      >
        จุดปลุก · {guardian.direction}
      </span>
      <h1 className="mt-3 text-2xl font-black leading-tight" style={{ color: themeAccent }}>
        {titleMain}
      </h1>
      {titleRest && <p className="mt-1 text-sm font-medium text-cream/75">{titleRest}</p>}
      <p className="mt-2 text-xs leading-relaxed text-cream/60">
        {guardian.culture} · {guardian.element} · {guardian.colorName}
      </p>
    </section>
  );
}
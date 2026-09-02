'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { GUARDIAN_DATA } from '@/data/guardians';
import { getStoredState } from '@/utils/storage';
import type { AppStorageState } from '@/types/guardian';

export default function DashboardPage() {
  const router = useRouter();
  // `mounted` gates all browser-only reads (localStorage) so the server HTML
  // and the first client paint always match — no hydration mismatch, no blank UI.
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<AppStorageState | null>(null);

  useEffect(() => {
    // Read browser-only storage once, after hydration. This is the
    // documented "you might not need an effect" exception: localStorage
    // is an external system unavailable during SSR, so we sync it here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setState(getStoredState());
  }, []);

  // Static, SSR-safe source of truth — all 4 slots always render.
  const guardianList = Object.values(GUARDIAN_DATA);
  const unlockedCount =
    mounted && state ? guardianList.filter((g) => state.guardians[g.id].unlocked).length : 0;
  const isAllUnlocked = unlockedCount === 4;
  const ceremonyDone = Boolean(
    state?.fifthGuardian?.completedAt && state?.fifthGuardian?.finalImageUrl
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between bg-stone-950 p-4 text-amber-50">
      {/* Header */}
      <div className="w-full">
        <header className="mb-6 flex items-center justify-between border-b border-stone-800/80 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-950/40 text-lg font-bold text-amber-400">
              4
            </div>
            <div>
              <h1 className="text-sm font-extrabold uppercase tracking-widest text-amber-400">
                GUARDIANS
              </h1>
              <p className="text-xs text-stone-400">4 ผู้พิทักษ์ตลาดพลู</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300">
              ปลุกแล้ว {mounted ? unlockedCount : '…'}/4
            </div>
            <Link
              href="/community"
              className="text-xs text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full hover:bg-amber-500/10 transition"
            >
✨ สถิติชุมชน
            </Link>
          </div>
        </header>

        {/* 2x2 Grid — skeleton while mounting, then all 4 slots */}
        {!mounted ? (
          <div className="my-2 grid grid-cols-2 gap-3.5" aria-label="กำลังโหลดคอลเลกชัน">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[9/16] animate-pulse rounded-2xl border border-stone-800 bg-stone-900/70"
              />
            ))}
          </div>
        ) : (
          <div className="my-2 grid grid-cols-2 gap-3.5">
            {guardianList.map((g) => {
              const progress = state?.guardians[g.id];
              const isUnlocked = Boolean(progress?.unlocked);
              return (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => router.push(`/scan/${g.id}` as Route)}
                  aria-label={`${g.titleTh} ${isUnlocked ? 'ปลุกแล้ว' : 'ยังไม่ปลุก'}`}
                  className={`relative aspect-[9/16] cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 active:scale-95 ${
                    isUnlocked
                      ? 'border-amber-400 shadow-lg shadow-amber-950/60 ring-1 ring-amber-400/50'
                      : 'border-stone-800 bg-stone-900/60'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.cardImageUrl}
                    alt={g.titleTh}
                    className={`h-full w-full object-cover transition duration-300 ${
                      isUnlocked ? 'opacity-100 grayscale-0' : 'opacity-25 grayscale'
                    }`}
                  />

                  {!isUnlocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-3 text-center">
                      <div className="mb-2 flex size-8 items-center justify-center rounded-full border border-stone-700 bg-stone-800/90 text-sm text-stone-300">
                        🔒
                      </div>
                      <span className="line-clamp-2 text-xs font-semibold text-stone-200">
                        {g.titleTh.split(' - ')[0]}
                      </span>
                      <span className="mt-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                        {g.direction}
                      </span>
                    </div>
                  )}

                  {isUnlocked && progress && (
                    <div className="absolute inset-x-2 bottom-2 rounded-lg border border-amber-400/30 bg-black/70 p-1.5 text-center backdrop-blur-md">
                      <span className="block truncate text-[10px] font-medium text-amber-300">
                        {g.quote.th}
                      </span>
                      {progress.unlockedAt && (
                        <span className="mt-0.5 block text-[9px] text-stone-400">ปลุกแล้ว</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Fifth Guardian ceremony slot */}
        <div
          className={`relative my-2 overflow-hidden rounded-2xl border p-4 transition ${
            isAllUnlocked
              ? 'border-amber-400/70 bg-gradient-to-br from-amber-950/80 via-stone-900 to-stone-950 shadow-lg shadow-amber-950/40'
              : 'border-stone-800 bg-stone-900/40'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                พิธีรวมร่าง · การ์ดใบที่ 5
              </p>
              <h2 className="mt-1 text-base font-black text-cream">
                {ceremonyDone ? 'พิธีรวมร่างสำเร็จ' : 'ผู้พิทักษ์รวมร่างแห่งตลาดพลู'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-400">
                {ceremonyDone
                  ? `พรแด่ตลาดพลู: ${state?.fifthGuardian?.talatphluBlessing ?? ''}`
                  : isAllUnlocked
                    ? 'คุณปลุกครบทั้ง 4 ธาตุแล้ว เข้าสู่พิธีรวมร่างและสร้างการ์ดใบสุดท้ายของคุณ'
                    : `สะสมครบทั้ง 4 ธาตุ ${unlockedCount}/4 เพื่อเปิดพิธีรวมร่างผู้พิทักษ์`}
              </p>
            </div>
            <div
              className={`grid size-10 shrink-0 place-items-center rounded-full border text-lg font-bold ${
                ceremonyDone || isAllUnlocked
                  ? 'border-amber-400 bg-amber-400 text-black'
                  : 'border-stone-700 text-stone-500'
              }`}
            >
              {ceremonyDone ? '✦' : '5'}
            </div>
          </div>
          {isAllUnlocked && (
            <button
              type="button"
              onClick={() => router.push('/final-card' as Route)}
              className={`mt-4 w-full rounded-xl py-3 text-sm font-extrabold transition active:scale-95 ${
                ceremonyDone
                  ? 'border border-amber-400/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/40'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black shadow-xl hover:brightness-110'
              }`}
            >
              {ceremonyDone ? 'กลับสู่การ์ดพิธีรวมร่าง' : 'เข้าสู่พิธีรวมร่าง · สร้างการ์ดใบที่ 5'}
            </button>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <footer className="mt-4 py-4">
        {!mounted ? null : isAllUnlocked && !ceremonyDone ? (
          <button
            type="button"
            onClick={() => router.push('/final-card')}
            className="w-full animate-bounce rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 py-3.5 font-extrabold tracking-wide text-black shadow-xl transition hover:brightness-110 active:scale-95"
          >
            🌿 ประกอบพิธีรวมร่างผู้พิทักษ์ทั้งสี่
          </button>
        ) : (
          <p className="text-center text-xs text-stone-500">
            แตะที่การ์ดเพื่อปลุกผู้พิทักษ์ผ่านคำถามแห่งพิธีกรรม หรือสะสมให้ครบ 4 ธาตุ
          </p>
        )}
      </footer>
    </main>
  );
}
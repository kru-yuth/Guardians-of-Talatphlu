'use client';

import { useEffect, useState } from 'react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { pingFirestore } from '@/utils/analytics';

interface CheckpointData {
  guardianId: string;
  guardianName: string;
  element: string;
  userName: string;
  answers?: Record<string, string>;
  clientTimestamp?: string;
}

interface FifthSubmissionData {
  id: string;
  userName: string;
  talatphluBlessing: string;
  personalPromise: string;
  clientTimestamp?: string;
}

/** Thai relative time, e.g. "เมื่อสักครู่", "5 นาทีที่แล้ว", "2 วันที่แล้ว". */
function formatThaiRelativeTime(iso?: string): string {
  if (!iso) return 'เมื่อสักครู่';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'เมื่อสักครู่';
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 45) return 'เมื่อสักครู่';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export default function CommunityDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<FifthSubmissionData[]>([]);
  const [checkpointStats, setCheckpointStats] = useState({
    earth: 0,
    fire: 0,
    water: 0,
    wind: 0,
    total: 0,
  });
  const [wishTargets, setWishTargets] = useState<Record<string, number>>({});
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const handleTestPing = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const result = await pingFirestore();
      setPingResult(`${result.ok ? '✅' : '❌'} ${result.message}`);
    } catch (error) {
      setPingResult(`❌ ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    // 1. Subscribe to Checkpoints Collection
    const qCheckpoints = query(collection(db, 'guardian_checkpoints'), limit(2000));
    const unsubCheckpoints = onSnapshot(
      qCheckpoints,
      (snapshot) => {
        const counts = { earth: 0, fire: 0, water: 0, wind: 0, total: 0 };
        const targets: Record<string, number> = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as CheckpointData;
          counts.total++;
          if (data.guardianId && counts[data.guardianId as keyof typeof counts] !== undefined) {
            counts[data.guardianId as keyof typeof counts]++;
          }

          // Count wish targets from Wind Guardian
          if (data.guardianId === 'wind' && data.answers?.wish_target) {
            const rawTarget = data.answers.wish_target;
            targets[rawTarget] = (targets[rawTarget] || 0) + 1;
          }
        });

        setCheckpointStats(counts);
        setWishTargets(targets);
      },
      (error) => console.error('Error fetching checkpoints:', error)
    );

    // 2. Subscribe to Fifth Guardian Submissions (Live Wall).
    // Index-free fetch (no orderBy) so no composite index needs building;
    // we sort newest-first locally by clientTimestamp.
    const qSubmissions = query(collection(db, 'fifth_guardian_submissions'), limit(100));
    const unsubSubmissions = onSnapshot(
      qSubmissions,
      (snapshot) => {
        const list: FifthSubmissionData[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<FifthSubmissionData, 'id'>),
          }))
          .sort(
            (a, b) =>
              new Date(b.clientTimestamp ?? 0).getTime() -
              new Date(a.clientTimestamp ?? 0).getTime()
          );
        setSubmissions(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching submissions:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubCheckpoints();
      unsubSubmissions();
    };
  }, []);

  const getPercentage = (count: number) => {
    if (!checkpointStats.total) return 0;
    return Math.round((count / checkpointStats.total) * 100);
  };

  return (
    <main
      className="min-h-screen bg-stone-950 text-amber-50 p-4 md:p-8 max-w-6xl mx-auto font-sans"
      style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}
    >
      {/* Header */}
      <header className="text-center py-6 border-b border-amber-500/20 mb-8">
        <div className="inline-flex items-center gap-2 bg-amber-950/60 border border-amber-500/40 rounded-full px-4 py-1 text-xs font-semibold text-amber-300 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          REALTIME COMMUNITY INSIGHTS
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-amber-100 tracking-wide">
          เสียงแห่งจิตวิญญาณ ๔ ผู้พิทักษ์ตลาดพลู
        </h1>
        <p className="text-xs md:text-sm text-stone-400 mt-2">
          ภาพสะท้อนคุณค่า ความทรงจำ และปณิธานร่วมของผู้คนในย่านประวัติศาสตร์
        </p>
      </header>

      {/* Direct Test Write to Firestore (temporary diagnostic) */}
      <button
        onClick={async () => {
          try {
            const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            const ref = await addDoc(collection(db, "guardian_checkpoints"), {
              guardianId: "fire",
              guardianName: "Lion Guardian",
              element: "Fire",
              userName: "Test User",
              answers: { test: "ping" },
              createdAt: serverTimestamp(),
              clientTimestamp: new Date().toISOString(),
            });
            alert("Ping successful! Doc ID: " + ref.id);
          } catch (err) {
            const e = err as { message?: string };
            console.error("Ping Failed:", err);
            alert("Ping failed: " + (e?.message ?? String(err)));
          }
        }}
        className="mb-4 rounded bg-red-600 px-4 py-2 text-xs font-bold text-white"
      >
        🛠 Test Write to Firestore
      </button>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-stone-900/80 border border-orange-600/30 rounded-2xl p-4 text-center">
          <EarthIcon className="mx-auto size-8" />
          <p className="text-xs text-stone-400 mt-1">ผู้พิทักษ์ปฐพี (เสือ)</p>
          <p className="text-2xl md:text-3xl font-bold text-orange-400 mt-1">{checkpointStats.earth}</p>
          <span className="text-[10px] text-stone-500">{getPercentage(checkpointStats.earth)}% ของทั้งหมด</span>
        </div>

        <div className="bg-stone-900/80 border border-red-600/30 rounded-2xl p-4 text-center">
          <FireIcon className="mx-auto size-8" />
          <p className="text-xs text-stone-400 mt-1">ผู้พิทักษ์เปลวไฟ (สิงโต)</p>
          <p className="text-2xl md:text-3xl font-bold text-red-400 mt-1">{checkpointStats.fire}</p>
          <span className="text-[10px] text-stone-500">{getPercentage(checkpointStats.fire)}% ของทั้งหมด</span>
        </div>

        <div className="bg-stone-900/80 border border-emerald-600/30 rounded-2xl p-4 text-center">
          <WaterIcon className="mx-auto size-8" />
          <p className="text-xs text-stone-400 mt-1">ผู้พิทักษ์สายน้ำ (มังกร)</p>
          <p className="text-2xl md:text-3xl font-bold text-emerald-400 mt-1">{checkpointStats.water}</p>
          <span className="text-[10px] text-stone-500">{getPercentage(checkpointStats.water)}% ของทั้งหมด</span>
        </div>

        <div className="bg-stone-900/80 border border-sky-600/30 rounded-2xl p-4 text-center">
          <WindIcon className="mx-auto size-8" />
          <p className="text-xs text-stone-400 mt-1">ผู้พิทักษ์สายลม (ม้า)</p>
          <p className="text-2xl md:text-3xl font-bold text-sky-400 mt-1">{checkpointStats.wind}</p>
          <span className="text-[10px] text-stone-500">{getPercentage(checkpointStats.wind)}% ของทั้งหมด</span>
        </div>
      </div>

      {/* Summary Highlight */}
      <div className="bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/60 border border-amber-500/40 rounded-2xl p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div>
          <span className="text-xs text-amber-400 font-semibold tracking-wider uppercase">Master Completion</span>
          <h2 className="text-xl font-bold text-amber-100">ยันต์ผู้พิทักษ์องค์ที่ 5 ที่ปลุกเสกสำเร็จ</h2>
          <p className="text-xs text-stone-400">ผู้เข้าร่วมที่เดินครบ 4 จุดและฝากปณิธานไว้กับตลาดพลู</p>
        </div>
        <div className="text-4xl font-extrabold text-amber-300 bg-black/40 px-6 py-3 rounded-xl border border-amber-500/30">
          {submissions.length} <span className="text-xs font-normal text-stone-400">คน</span>
        </div>
      </div>

      {/* Firestore Connectivity Test (temporary diagnostic) */}
      <div className="mb-8 rounded-2xl border border-stone-800 bg-stone-900/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              🔌 การเชื่อมต่อ Firestore (Test Ping)
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              ตรวจสอบว่าเว็บเขียนข้อมูลลง Firestore ได้จริงหรือไม่ (debug)
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestPing}
            disabled={pinging}
            className="shrink-0 rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-50"
          >
            {pinging ? 'กำลังตรวจ...' : '🔍 Test Firestore Ping'}
          </button>
        </div>
        {pingResult && (
          <p className="mt-3 rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2 text-[11px] leading-relaxed text-amber-100 break-words">
            {pingResult}
          </p>
        )}
      </div>

      {/* Wish Target Distribution Section */}
      {Object.keys(wishTargets).length > 0 && (
        <section className="bg-stone-900/50 border border-stone-800 rounded-2xl p-5 mb-8">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">
            🎯 พรจากสายลมถูกมอบให้ใครเป็นหลัก (Wish Targets)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(wishTargets).map(([label, count]) => (
              <div key={label} className="bg-stone-950/80 border border-stone-800/80 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs text-stone-300 truncate mr-2">{label}</span>
                <span className="text-xs font-bold text-amber-400">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Realtime Wall of Wishes & Promises */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-bold text-amber-300 flex items-center gap-2">
            <span>✨</span> กำแพงพรและปณิธานแห่งตลาดพลู (Wall of Human Spirit)
          </h3>
          <span className="text-xs text-stone-500">อัปเดตแบบเรียลไทม์</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-500 text-sm">กำลังเชื่อมต่อข้อมูลจากตลาดพลู...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-sm">ยังไม่มีคำอธิษฐานแรกเข้ามา เป็นคนแรกที่เริ่มจุดประกาย!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((item) => (
              <div
                key={item.id}
                className="bg-stone-900/70 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-400/50 transition-all duration-300 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
                    <span className="text-xs font-bold text-amber-400">
                      🌿 ผู้พิทักษ์: {item.userName || 'ผู้มาเยือน'}
                    </span>
                  </div>

                  {item.talatphluBlessing && (
                    <div className="mb-3">
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">พรแด่ตลาดพลู</p>
                      <p className="text-xs text-stone-200 italic mt-0.5 leading-relaxed">
                        “{item.talatphluBlessing}”
                      </p>
                    </div>
                  )}

                  {item.personalPromise && (
                    <div>
                      <p className="text-[10px] text-amber-400/80 uppercase tracking-wider font-semibold">ปณิธานส่วนตัว</p>
                      <p className="text-xs text-amber-100/90 mt-0.5 leading-relaxed">
                        สัญญาว่าจะ: {item.personalPromise}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-stone-800/60 flex justify-end">
                  <span className="text-[10px] text-stone-500">
                    {formatThaiRelativeTime(item.clientTimestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function IconProps({ className }: { className?: string }) {
  return {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };
}

function EarthIcon({ className }: { className?: string }) {
  return (
    <svg {...IconProps({ className })}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13.5 13.5 0 0 1 0 18 13.5 13.5 0 0 1 0-18Z" />
    </svg>
  );
}

function FireIcon({ className }: { className?: string }) {
  return (
    <svg {...IconProps({ className })}>
      <path d="M12 3c1 3-1.5 4.5-1.5 7a3 3 0 0 0 3 3c1 0 1.5-.5 1.5-.5C15.5 13 16 14.5 16 16a4 4 0 0 1-8 0c0-3 1.5-5.5 4-8 0 1 1.5 1 2-.5L12 3Z" />
    </svg>
  );
}

function WaterIcon({ className }: { className?: string }) {
  return (
    <svg {...IconProps({ className })}>
      <path d="M12 22a7 7 0 0 0 7-7c0-5-4.5-9-7-11C9.5 6 5 10 5 15a7 7 0 0 0 7 7Z" />
      <path d="M12 22a3 3 0 0 0 3-3c0-2-1.5-3.5-3-5-1.5 1.5-3 3-3 5a3 3 0 0 0 3 3Z" />
    </svg>
  );
}

function WindIcon({ className }: { className?: string }) {
  return (
    <svg {...IconProps({ className })}>
      <path d="M17.5 9a3.5 3.5 0 1 0-3.5-3.5" />
      <circle cx="12" cy="9" r="3" />
      <path d="M4 9h5" />
      <path d="M2 14h13a3 3 0 1 1-3 3" />
    </svg>
  );
}
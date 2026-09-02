import Link from "next/link";
import type { GuardianMeta, UserProgress } from "@/types/guardian";
import { formatThaiDate } from "@/utils/storage";

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-7"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2.5" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

interface GuardianTileProps {
  guardian: GuardianMeta;
  unlocked: boolean;
  progress?: UserProgress | null;
  index: number;
}

export default function GuardianTile({ guardian, unlocked, progress, index }: GuardianTileProps) {
  return (
    <Link
      href={`/scan/${guardian.id}`}
      aria-label={`${guardian.titleTh} ${unlocked ? "ปลุกแล้ว" : "ยังไม่ปลุก"}`}
      className={`group relative block aspect-[3/4] overflow-hidden rounded-2xl border-2 transition ${
        unlocked
          ? "border-gold/70 shadow-[0_10px_40px_-12px_rgba(255,215,0,0.35)]"
          : "border-cream/15"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={guardian.cardImageUrl}
        alt={`${guardian.titleTh} (${guardian.element})`}
        className={`h-full w-full object-cover transition duration-500 ${
          unlocked ? "group-hover:scale-105" : "blur-[1.5px] grayscale"
        }`}
      />

      {!unlocked && (
        <div className="absolute inset-0 grid place-items-center bg-ink/55 backdrop-blur-[1px]">
          <span className="flex flex-col items-center gap-2 text-cream/80">
            <LockIcon />
            <span className="text-[11px] font-semibold tracking-wide">ผ่านพิธีปลุกเพื่อเก็บพลัง</span>
          </span>
        </div>
      )}

      {unlocked && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 pt-10">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest"
            style={{
              color: guardian.themeColor.accent,
              borderColor: guardian.themeColor.accent,
              backgroundColor: "rgba(0,0,0,0.45)",
            }}
          >
            {guardian.element} · ปลุกแล้ว
          </span>
          <p className="mt-2 text-[13px] font-medium leading-snug text-cream">
            {guardian.quote.th}
          </p>
          {progress?.unlockedAt && (
            <p className="mt-1 text-[11px] text-cream/60">
              {formatThaiDate(progress.unlockedAt)}
            </p>
          )}
        </div>
      )}

      <span className="pointer-events-none absolute left-3 top-3 text-[10px] font-bold tracking-widest text-cream/50">
        {String(index + 1).padStart(2, "0")}
      </span>
    </Link>
  );
}
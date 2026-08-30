import Link from "next/link";

export default function LogoBar() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <Link href="/" className="group flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full border border-gold/60 bg-ink text-xl font-extrabold text-gold shadow-[0_0_18px_rgba(255,215,0,0.25)]">
          4
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-extrabold uppercase tracking-[0.22em] text-gold">
            Guardians
          </span>
          <span className="block text-xs text-cream/70">4 ผู้พิทักษ์ตลาดพลู</span>
        </span>
      </Link>
      <Link
        href="/"
        className="rounded-full border border-cream/15 px-4 py-2 text-xs font-semibold text-cream/80 transition hover:border-gold/50 hover:text-gold"
      >
        คอลเลกชัน
      </Link>
    </header>
  );
}
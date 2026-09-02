import { notFound } from "next/navigation";
import { GUARDIAN_DATA, GUARDIAN_ORDER } from "@/data/guardians";
import type { GuardianId } from "@/types/guardian";
import ScanClient from "./ScanClient";

export function generateStaticParams() {
  return GUARDIAN_ORDER.map((id) => ({ id }));
}

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guardian = GUARDIAN_DATA[id as GuardianId];
  if (!guardian) notFound();
  return <ScanClient guardian={guardian} />;
}
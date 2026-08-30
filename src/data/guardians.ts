import type { Guardian, GuardianId } from "@/types/guardian";

/**
 * Configuration for the 4 Guardians of Talatphlu.
 *
 * `card-fire.jpg`  -> Fire  (North / Chinese Guardian, Lion motif)
 * `card-earth.jpg` -> Earth (South / Muslim Guardian, Tiger motif)
 * `card-wind.jpg`  -> Wind  (East / Thai Guardian, White Horse motif)
 * `card-water.jpg` -> Water (West / Mon Guardian, Naga motif)
 */
export const GUARDIANS: Record<GuardianId, Guardian> = {
  fire: {
    id: "fire",
    element: "Fire",
    elementThai: "ไฟ",
    title: "ผู้พิทักษ์ไฟ",
    community: "Chinese Guardian",
    communityThai: "ผู้พิทักษ์จีน",
    directionEn: "North",
    directionThai: "ทิศเหนือ",
    motif: "Lion",
    motifThai: "สิงโต",
    blessing: "รุ่งเรืองด้วยไฟศรัทธา ค้าขายร่ำรวย",
    primary: "#D32F2F",
    accent: "#FFD700",
    image: "/images/card-fire.jpg",
    choices: ["ค้าขายร่ำรวย", "พลังชีวิตเปี่ยมล้น", "อุดหนุนร้านท้องถิ่น"],
  },
  earth: {
    id: "earth",
    element: "Earth",
    elementThai: "ดิน",
    title: "ผู้พิทักษ์ดิน",
    community: "Muslim Guardian",
    communityThai: "ผู้พิทักษ์มุสลิม",
    directionEn: "South",
    directionThai: "ทิศใต้",
    motif: "Tiger",
    motifThai: "เสือ",
    blessing: "มั่นคงดั่งผืนดิน สุขสงบร่มเย็น",
    primary: "#E65100",
    accent: "#D4AF37",
    image: "/images/card-earth.jpg",
    choices: ["ครอบครัวอบอุ่นมั่นคง", "สุขภาพแข็งแรง", "สันติสุขคุ้มครอง"],
  },
  wind: {
    id: "wind",
    element: "Wind",
    elementThai: "ลม",
    title: "ผู้พิทักษ์ลม",
    community: "Thai Guardian",
    communityThai: "ผู้พิทักษ์ไทย",
    directionEn: "East",
    directionThai: "ทิศตะวันออก",
    motif: "White Horse",
    motifThai: "ม้าขาว",
    blessing: "โปรยปรายดั่งสายลม สู่ความสำเร็จ",
    primary: "#0D1B2A",
    accent: "#DAA520",
    image: "/images/card-wind.jpg",
    choices: ["ก้าวหน้าไร้อุปสรรค", "อิสรภาพแห่งใจ", "สืบสานเรื่องราว"],
  },
  water: {
    id: "water",
    element: "Water",
    elementThai: "น้ำ",
    title: "ผู้พิทักษ์น้ำ",
    community: "Mon Guardian",
    communityThai: "ผู้พิทักษ์มอญ",
    directionEn: "West",
    directionThai: "ทิศตะวันตก",
    motif: "Naga",
    motifThai: "พญานาค",
    blessing: "ไหลเสนสดั่งสายน้ำ ปัญญาสว่างไสว",
    primary: "#1B4332",
    accent: "#90BE6D",
    image: "/images/card-water.jpg",
    choices: ["ร่มเย็นเป็นสุข", "ปัญญาเฉียบแหลม", "อนุรักษ์สายน้ำ"],
  },
};

/** Canonical display order of the guardians. */
export const GUARDIAN_ORDER: GuardianId[] = ["fire", "earth", "wind", "water"];

/** Static map of all guardians — always safe for SSR (no storage access). */
export const GUARDIAN_DATA = GUARDIANS;

export function getGuardian(id: GuardianId): Guardian {
  return GUARDIANS[id];
}

export function getAllGuardians(): Guardian[] {
  return GUARDIAN_ORDER.map((id) => GUARDIANS[id]);
}
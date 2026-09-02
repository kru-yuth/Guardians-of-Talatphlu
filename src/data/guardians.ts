import type { GuardianId, GuardianMeta } from "@/types/guardian";

/**
 * Canonical data for the 4 Guardians of Talatphlu plus the awakening
 * ceremony text that powers the multi-question flow.
 *
 * `card-earth.jpg` -> Earth (South / Muslim Guardian, Tiger motif)
 * `card-fire.jpg`  -> Fire  (North / Chinese Guardian, Lion motif)
 * `card-water.jpg` -> Water (West / Mon Guardian, Dragon motif)
 * `card-wind.jpg`  -> Wind  (East / Thai Guardian, War Horse motif)
 */
export const GUARDIAN_DATA: Record<GuardianId, GuardianMeta> = {
  earth: {
    id: 'earth',
    name: 'Tiger Guardian',
    titleTh: 'ผู้พิทักษ์แห่งปฐพี - พลังแห่งรากฐาน ความกล้าหาญ และการปกป้อง',
    titleEn: 'The Earth Guardian - Guardian of Root, Courage & Protection',
    culture: 'Muslim Guardian (ชุมชนมุสลิมตลาดพลู)',
    direction: 'South (ทิศใต้)',
    element: 'Earth (ธาตุดิน)',
    colorName: 'Orange-Brown (ส้มอิฐ/น้ำตาลอบอุ่น)',
    themeColor: {
      primary: '#E65100',
      secondary: '#F5E6CC',
      accent: '#D4AF37',
      bgGradient: 'from-amber-950 via-orange-950 to-stone-900',
    },
    quote: {
      th: 'ยืนหยัดอย่างมั่นคง สร้างรากฐานของตนเอง',
      en: 'Stand firmly. Build your foundation.',
    },
    storyTh: `ลึกเข้าไปในตลาดพลู มีผู้พิทักษ์ตนหนึ่งยืนหยัดอยู่ เสือไม่ได้แสวงหาดินแดนเพื่อครอบครอง แต่เลือกผืนดินผืนหนึ่งแล้วปกป้องมันด้วยความอดทน เช่นเดียวกับครอบครัวมุสลิมแห่งตลาดพลู ผู้หยั่งรากชีวิตด้วยศรัทธา ครอบครัว และการดูแลซึ่งกันและกัน`,
    cardImageUrl: '/images/card-earth.jpg',
    questions: [
      { id: 'origin', questionTh: '1. คุณมาจากที่ใด?', questionEn: 'Where are you from?', type: 'text', placeholderTh: 'ระบุถิ่นฐานหรือที่ที่คุณเติบโต' },
      { id: 'inner_strength', questionTh: '2. ขุมพลังแห่งความแข็งแกร่งมั่นคงของคุณคืออะไร?', questionEn: 'What are the things in my life that give me strength?', type: 'text', placeholderTh: 'เช่น ครอบครัว, ความเชื่อมั่น, มิตรภาพ' },
      { id: 'protect_target', questionTh: '3. วันนี้ คุณอยากใช้พลังของตัวเองเพื่อปกป้องหรือดูแลสิ่งใดที่มีความหมายต่อคุณ?', questionEn: 'What would you like to use your strength to protect or care for today?', type: 'text', placeholderTh: 'สิ่งหรือคนที่คุณอยากปกป้อง' },
      { id: 'small_action', questionTh: '4. ก้าวเล็กๆ ที่คุณทำได้วันนี้คืออะไร?', questionEn: 'What is one small action I can do today?', type: 'text', placeholderTh: 'การกระทำเล็กๆ ที่ตั้งใจจะทำ' },
    ],
    finalMessageTh: `“ข้าคือเสือแห่งผืนดิน ข้าไม่ได้ยืนหยัด เพราะข้าแข็งแกร่งที่สุด ข้ายืนหยัด เพราะข้ามีราก
ศรัทธามอบความอดทนให้แก่ข้า ความอดทนหล่อหลอมความแข็งแกร่งให้แก่ข้า และความแข็งแกร่งนั้น ทำให้ข้าปกป้องสิ่งที่ข้ารักได้
จงสร้างรากฐานของเจ้า จงปกป้องผู้คนของเจ้า อย่าดูแคลนการกระทำเล็ก ๆ ที่ทำซ้ำด้วยหัวใจที่ศรัทธา
ปาฏิหาริย์ที่เจ้ากำลังเฝ้ารอ แท้จริงแล้ว กำลังเติบโตอยู่บนพื้นที่เจ้าสร้างและหยัดยืน มาโดยตลอด”`,
    finalMessageEn: `"I am the Tiger of Earth. I do not stand because I am the strongest. I stand because I have roots. My faith gives me patience. My patience gives me strength. My strength allows me to protect what I love. Build your foundation. Protect your people. Do not underestimate small actions repeated with devotion. The miracle you seek is already growing beneath your feet."`,
    talismanDownloadName: 'ยันต์เสือ-ผู้พิทักษ์แห่งปฐพี',
  },

  fire: {
    id: 'fire',
    name: 'Lion Guardian',
    titleTh: 'ผู้พิทักษ์แห่งเปลวไฟ - พลังแห่งชีวิตและการเฉลิมฉลอง',
    titleEn: 'The Fire Guardian – Guardian of Life, Joys and Celebration',
    culture: 'Chinese Guardian (ชุมชนชาวจีนตลาดพลู)',
    direction: 'North (ทิศเหนือ)',
    element: 'Fire (ธาตุไฟ)',
    colorName: 'Mongkol Red (แดงมงคล/ทองสว่าง)',
    themeColor: {
      primary: '#D32F2F',
      secondary: '#FFF3E0',
      accent: '#FFD700',
      bgGradient: 'from-amber-900 via-red-900 to-black',
    },
    quote: {
      th: 'สิงโตผู้กล้าปลุกถนนที่เงียบงันให้มีชีวิตชีวาและตื่นขึ้น',
      en: 'The Lion Who Dares to Wake the Street',
    },
    storyTh: `สิงโตเชิดนำพาจิตวิญญาณของชาวจีนตลาดพลู ผู้เดินทางมาด้วยความกล้าหาญ พวกเขาไม่ได้เพียงสร้างกิจการ แต่สร้างความเชื่อมโยงระหว่างผู้คน ตลาดกลายเป็นพื้นที่รวมตัว เทศกาลกลายเป็นความทรงจำร่วมกัน และกล้าที่จะจุดประกายความหวังขึ้นมา`,
    cardImageUrl: '/images/card-fire.jpg',
    questions: [
      { id: 'age_meaning', questionTh: '1. อายุของคุณ และตัวเลขนี้กำลังบอกอะไรกับชีวิตคุณ?', questionEn: 'Your age, and what does that tell you?', type: 'text', placeholderTh: 'อายุ และสิ่งที่สะท้อนถึงตัวคุณในตอนนี้' },
      { id: 'joy_source', questionTh: '2. ช่วงเวลานี้ พลังความสุข และความพึงพอใจภายในของคุณคืออะไร?', questionEn: 'What is the source of your happiness and inner contentment at this moment in your life?', type: 'text', placeholderTh: 'สิ่งที่ทำให้ใจคุณฟูและมีความสุข' },
      { id: 'self_celebration', questionTh: '3. ชีวิตควรค่าแก่การเฉลิมฉลอง คุณอยากเฉลิมฉลองอะไรให้กับตัวเองในวันนี้?', questionEn: 'Life is worth celebrating. What about yourself would you like to celebrate today?', type: 'text', placeholderTh: 'สิ่งที่คุณภาคภูมิใจในตนเอง' },
      { id: 'spark_action', questionTh: '4. แบ่งปันความสดใส: สิ่งเล็กๆ ในวันนี้ที่คุณทำได้ เพื่อให้คนรอบตัวมีพลังงานที่ดีขึ้นคืออะไร?', questionEn: 'What small action can I do today that makes a place feel more alive?', type: 'text', placeholderTh: 'เช่น รอยยิ้ม คำชม หรือการทักทาย' },
    ],
    finalMessageTh: `“ข้าคือสิงโตแห่งเปลวไฟ ข้าไม่ได้เปล่งประกาย เพราะข้ายืนอยู่เหนือผู้อื่น ข้าเปล่งประกาย เพราะข้าพาผู้คนมาพบกัน
ความกล้าของข้าเปิดประตู พลังของข้าปลุกถนนให้ตื่นขึ้น การเฉลิมฉลองของข้าสร้างความทรงจำร่วมกัน อย่ารอให้ชีวิตสว่างไสวขึ้นเอง จงนำเปลวไฟของเจ้าออกมา
อนาคตที่ดีกว่า ต้องการใครสักคนที่กล้าพอจะเริ่มต้น เพียงประกายไฟเล็ก ๆ หนึ่งประกาย ก็สามารถปลุกทั้งชุมชนให้ตื่นขึ้นได้”`,
    finalMessageEn: `"I am the Lion of Fire. I do not shine because I stand above others. I shine because I bring people together. My courage opens doors. My energy awakens streets. My celebration creates memories. Do not wait for life to become brighter. Bring your own flame. A better future requires someone brave enough to start. A single spark can awaken a whole community."`,
    talismanDownloadName: 'ยันต์สิงโต-ผู้พิทักษ์แห่งเปลวไฟ',
  },

  water: {
    id: 'water',
    name: 'Dragon Guardian',
    titleTh: 'ผู้พิทักษ์แห่งสายน้ำ - พลังแห่งความทรงจำและความเข้าอกเข้าใจ',
    titleEn: 'The Water Guardian – The Guardian of Compassion and Wisdom',
    culture: 'Mon Guardian (ชุมชนชาวมอญตลาดพลู)',
    direction: 'West (ทิศตะวันตก)',
    element: 'Water (ธาตุน้ำ)',
    colorName: 'Emerald Green (เขียวมรกต)',
    themeColor: {
      primary: '#1B4332',
      secondary: '#E8F5E9',
      accent: '#90BE6D',
      bgGradient: 'from-emerald-950 via-teal-950 to-stone-900',
    },
    quote: {
      th: 'มังกรผู้รู้จักการโอบอุ้มและปล่อยวาง',
      en: 'The Dragon Who Carries the River Within',
    },
    storyTh: `“แม่น้ำอาจเปลี่ยนเส้นทาง แต่สายน้ำยังคงไหลต่อไป” มังกรแห่งสายน้ำสะท้อนจิตวิญญาณชาวมอญผู้ถือครองภูมิปัญญาผ่านการปรับตัว รู้จักสมดุลของการยึดถือสิ่งที่ให้ความหมาย และปล่อยวางสิ่งที่ขวางการไหลของชีวิต เพื่อเยียวยาจิตใจผ่านการโอบรับ`,
    cardImageUrl: '/images/card-water.jpg',
    questions: [
      { id: 'talatphlu_discovery', questionTh: '1. คุณรู้จักตลาดพลูได้อย่างไร และที่นี่ให้ความหมายอะไรกับคุณ?', questionEn: 'How did you discover Talat Phlu? What meaning does this place give you?', type: 'text', placeholderTh: 'ความทรงจำหรือความผูกพันกับตลาดพลู' },
      { id: 'kindness_story', questionTh: '2. เรื่องราวไหนในชีวิต ที่คู่ควรกับความเข้าใจ การอภัย และการโอบรับ?', questionEn: 'What part of my story deserves kindness?', type: 'text', placeholderTh: 'เรื่องราวในใจที่คุณอยากใจดีกับตัวเอง' },
      { id: 'ancestor_message', questionTh: '3. ถ้าใครสักคนต้องเผชิญความท้าทายแบบที่คุณเจอ คุณอยากบอกอะไรกับเขา?', questionEn: 'If someone experienced my journey, what would I say to them?', type: 'text', placeholderTh: 'คำปลอบโยนหรือกำลังใจจากประสบการณ์ของคุณ' },
      { id: 'wisdom_gift', questionTh: '4. จากการเรียนรู้เข้าใจชีวิต สิ่งใดที่คุณอยากส่งต่อเป็นของขวัญให้ใครสักคน?', questionEn: 'What kindness or wisdom can I pass to someone else?', type: 'text', placeholderTh: 'ภูมิปัญญาหรือความหวังดีที่คุณอยากแบ่งปัน' },
    ],
    finalMessageTh: `“ข้าคือมังกรแห่งสายน้ำ ข้าเดินทางผ่านสายน้ำมาเกินนับ ข้าจดจำทั้งพายุและเช้าวันอันสงบงาม ข้าเข้าใจดีถึงน้ำหนักของสิ่งที่เจ้ากำลังแบกรับ ข้าไม่ขอให้เจ้าลืมบาดแผลของตน ข้าเพียงขอให้เจ้าโอบอุ้มมันไว้อย่างอ่อนโยน แม้เศษเสี้ยวที่แตกสลายของเจ้า ก็ยังคงเป็นส่วนหนึ่งของความงดงาม
เรื่องราวของเจ้ายังคงไหลต่อไปเช่นสายน้ำ ใจดีกับตนเอง แล้วจงพักตรงนี้สักครู่ เจ้าพร้อมเมื่อใดแล้วจึงค่อยเดินทางของเจ้าต่อไปอย่างมั่นคงและอ่อนโยน”`,
    finalMessageEn: `"I am the Dragon of Water. I have travelled through many rivers. I remember storms and peaceful mornings. I know the weight you carry. I do not ask you to forget your wounds. I ask you to hold them gently. Your broken pieces are still part of your beauty. Your story is still flowing. Be kind to yourself and Rest here for a while. Then continue your journey when you’re ready."`,
    talismanDownloadName: 'ยันต์มังกร-ผู้พิทักษ์แห่งสายน้ำ',
  },

  wind: {
    id: 'wind',
    name: 'The War Horse Guardian',
    titleTh: 'ผู้พิทักษ์แห่งสายลม – พลังแห่งโอกาส ปณิธาน และอิสรภาพ',
    titleEn: 'The Wind Guardian — Power of Possibility and Aspiration',
    culture: 'Thai Guardian (ชุมชนชาวไทยตลาดพลู)',
    direction: 'East (ทิศตะวันออก)',
    element: 'Wind (ธาตุลม)',
    colorName: 'Indigo Blue (คราม/น้ำเงินทอง)',
    themeColor: {
      primary: '#0D1B2A',
      secondary: '#ECEFF1',
      accent: '#DAA520',
      bgGradient: 'from-slate-900 via-sky-950 to-blue-950',
    },
    quote: {
      th: 'ม้าผู้นำพาการเดินทางของเรื่องราวสู่แสงตะวันแห่งวันใหม่',
      en: 'The Horse That Carries Stories Toward Tomorrow',
    },
    storyTh: `ม้าศึกสีขาวควบทะยานไปสู่อนาคต วัฒนธรรมไม่ใช่สิ่งตายตัวในพิพิธภัณฑ์ แต่วัฒนธรรมดำรงอยู่ได้ผ่านการใช้ชีวิตและการส่งต่อ มอบพรแห่งความกล้าที่จะก้าวข้ามขอบเขต พร้อมแสงแรกแห่งความหวังจากทิศตะวันออก`,
    cardImageUrl: '/images/card-wind.jpg',
    questions: [
      {
        id: 'wish_target',
        questionTh: '1. พรที่ขอนี้คุณมอบให้ใครเป็นหลัก?',
        questionEn: 'Your wish is mainly for whom?',
        type: 'radio',
        options: ['ตัวฉันเอง (Myself)', 'ครอบครัว (Family)', 'คนสำคัญ (Someone I love)', 'ชุมชน (Community)', 'คนรุ่นต่อไป (Future generation)', 'โลกของเรา (The world)'],
      },
      { id: 'heritage_received', questionTh: '2. บทเรียนและสิ่งล้ำค่าใดที่คุณได้รับจากเหล่าบรรพชนผู้มาก่อน?', questionEn: 'What have I received from those before me?', type: 'text', placeholderTh: 'คำสอน วิถีชีวิต หรือความเข้มแข็งที่ได้รับมา' },
      { id: 'future_building', questionTh: '3. อะไรคือสิ่งที่คุณสามารถร่วมสร้างและพัฒนาเพื่ออนาคตที่ดีงาม?', questionEn: 'What future can I participate in building?', type: 'text', placeholderTh: 'สิ่งที่คุณอยากลงมือช่วยสร้าง' },
      { id: 'today_action', questionTh: '4. สิ่งเล็กๆ ที่ฉันเริ่มทำได้ตั้งแต่วันนี้คืออะไร?', questionEn: 'What small action can I begin today?', type: 'text', placeholderTh: 'ก้าวแรกที่คุณตั้งใจจะเริ่ม' },
    ],
    finalMessageTh: `“ข้าคือม้าแห่งสายลม ข้าเรียนรู้ และพาเอาเรื่องราวของผู้คน ผู้เคยเดินอยู่บนเส้นทางก่อนหน้าข้าติดตัวไป ข้าเคารพรากเหง้าของตน แต่ข้าไม่หยุดอยู่กับอดีต สายลมพัดพาเสียงของข้าออกไป เส้นทางเปิดออกอยู่เบื้องหน้า ข้าเคลื่อนไปด้วยความกล้าหาญ ข้ามุ่งหน้าสู่ฝันด้วยจุดหมาย
ข้าพาเรื่องราวจากอดีตเดินทางสู่อนาคต บทต่อไปของเรื่องราว เริ่มต้นขึ้นด้วยก้าวแรกของข้า”`,
    finalMessageEn: `"I am the Horse of Wind. I carry the stories of those who walked before me. I honour my roots, but I do not remain behind. The wind carries my voice. The road opens before me. I move with courage. I dream with purpose. I carry the past into the future. The next chapter begins with my first step."`,
    talismanDownloadName: 'ยันต์ม้า-ผู้พิทักษ์แห่งสายลม',
  },
};

/** Canonical display order of the guardians. */
export const GUARDIAN_ORDER: GuardianId[] = ["fire", "earth", "wind", "water"];

/** Alias kept for backwards compatibility — always safe for SSR (no storage access). */
export const GUARDIANS = GUARDIAN_DATA;

export function getGuardian(id: GuardianId): GuardianMeta {
  return GUARDIAN_DATA[id];
}

export function getAllGuardians(): GuardianMeta[] {
  return GUARDIAN_ORDER.map((id) => GUARDIAN_DATA[id]);
}
export type EmotionEntry = {
  id: string
  namePl: string
  nameEn?: string
  descriptionPl: string
  descriptionEn?: string
}

export type NoteEntry = {
  id: string
  short: string
  name: string
  frequency: number
  urlKey: string
  locked: boolean
  healing: string
  chromaHex: string
  synestheticTitlePl: string
  synestheticLinePl: string
  element: string
  emotionId: string
  healingStyle: string
  captions: string[]
}

export const EMOTIONS: EmotionEntry[] = [
  {
    id: 'anxiety',
    namePl: 'Niepokój',
    descriptionPl: 'Napięcie płynące z wyobrażonego zagrożenia. Myśli wyprzedzają rzeczywistość i interpretują ją jako niebezpieczną.',
  },
  {
    id: 'sadness',
    namePl: 'Smutek',
    descriptionPl: 'Normalny spadek nastroju, który staje się toksyczny gdy trwa zbyt długo i nie pozwala cieszyć się życiem.',
  },
  {
    id: 'dissatisfaction',
    namePl: 'Niezadowolenie',
    descriptionPl: 'Chroniczne dążenie do perfekcji, które odbiera radość z drogi i skupia się wyłącznie na tym, czego brakuje.',
  },
  {
    id: 'attachment',
    namePl: 'Przywiązanie',
    descriptionPl: 'Toksyczna zależność, w której poczucie własnej wartości jest uzależnione od obecności drugiej osoby.',
  },
  {
    id: 'anger',
    namePl: 'Złość',
    descriptionPl: 'Emocja pojawiająca się gdy oczekiwania nie są spełnione. Toksyczna gdy przemienia się w chroniczną agresję.',
  },
  {
    id: 'envy',
    namePl: 'Zawiść',
    descriptionPl: 'Zatruwa relacje przez ciągłe porównywanie się z innymi i niemożność cieszenia się z ich sukcesów.',
  },
  {
    id: 'shame',
    namePl: 'Wstyd',
    descriptionPl: 'Toksyczny wstyd sprawia, że człowiek wierzy, że jest wadliwy i zły — nie tylko że popełnił błąd.',
  },
  {
    id: 'frustration',
    namePl: 'Frustracja',
    descriptionPl: 'Poczucie klęski gdy pragnienia nie są spełniane. Zatruwa wolę działania i chęć próbowania ponownie.',
  },
  {
    id: 'grief',
    namePl: 'Żałoba',
    descriptionPl: 'Ból rozstania i straty. Toksyczna gdy przekształca się w chroniczne cierpienie, z którego nie ma wyjścia.',
  },
  {
    id: 'guilt',
    namePl: 'Poczucie winy',
    descriptionPl: 'Fałszywe poczucie winy blokuje zdolność cieszenia się życiem i utrzymuje w stanie nieustannego samokarania.',
  },
]

const ENTRIES: NoteEntry[] = [
  {
    id: 'C',
    short: 'C',
    name: 'The Foundation',
    frequency: 261.63,
    urlKey: 'C',
    locked: false,
    healing: 'Helpful during anxiety, overwhelm, and dissociation — when the body needs reminding it is safe.',
    chromaHex: '#6B1D1D',
    synestheticTitlePl: 'Czerń Korzenia',
    synestheticLinePl:
      'Cisza nie jest pusta — to głęboka czerwień zaschniętej ziemi, z której wszystko wyrasta.',
    element: 'Ziemia',
    emotionId: 'anxiety',
    healingStyle: 'grounding',
    captions: [
      'Stay with me. The nervous system remembers safety.',
      'Breathe. You are not in danger right now.',
      'Your thoughts are loud. The ground beneath you is quiet.',
      'Listen longer. Panic cannot root in steady rhythm.',
      'You have always known how to return. This is the way.',
    ],
  },
  {
    id: 'C#',
    short: 'C#',
    name: 'The Threshold',
    frequency: 277.18,
    urlKey: 'Cs',
    locked: true,
    healing: 'Useful at crossings — endings, decisions, identity shifts. Its mild dissonance is not distress, but signal.',
    chromaHex: '#9A3412',
    synestheticTitlePl: 'Gleń Rubinu',
    synestheticLinePl: 'Krawędź pomiędzy ciepłem a ogniem — barwa, która jeszcze nie dobrała tchu.',
    element: 'Iskra',
    emotionId: 'attachment',
    healingStyle: 'releasing',
    captions: [
      'Something is changing. I hold the doorway open.',
      'Let the old shape soften. What you need is on the other side.',
      'Attachment is not love. Openness is.',
      'Stay in the unknown a little longer. It will not hurt you.',
      'You are allowed to release what you have been carrying.',
    ],
  },
  {
    id: 'D',
    short: 'D',
    name: 'The Walker',
    frequency: 293.66,
    urlKey: 'D',
    locked: true,
    healing: 'For those frozen or overwhelmed by inertia — a quiet reminder that one step forward is enough.',
    chromaHex: '#B45309',
    synestheticTitlePl: 'Bursztyn Przejścia',
    synestheticLinePl: 'Światło, które przeszło przez drewno wieków — ciepło bez pośpiechu, kolor wspomnień.',
    element: 'Żar',
    emotionId: 'frustration',
    healingStyle: 'activating',
    captions: [
      'One step. That is all I ask.',
      'Frustration means you still care. Let me carry some of that.',
      'You have stopped before. You have also started again.',
      'The path does not require certainty. Only motion.',
      'What you are building takes longer than you think. That is not failure.',
    ],
  },
  {
    id: 'D#',
    short: 'D#',
    name: 'The Wound',
    frequency: 311.13,
    urlKey: 'Ds',
    locked: true,
    healing: 'For those carrying unexpressed grief. Its medicine is not catharsis alone — it is recognition.',
    chromaHex: '#A16207',
    synestheticTitlePl: 'Mgła Miedzi',
    synestheticLinePl: 'Kolor wąwozu o świcie — złoto, które jeszcze nie zdecydowało, czy jest słońcem.',
    element: 'Para',
    emotionId: 'sadness',
    healingStyle: 'witnessing',
    captions: [
      'Remain. Even winter stores seeds.',
      'I hold what hurts until it loosens.',
      'Stay near. Grief moves slower than light.',
      'You do not have to explain the pain to feel it honestly.',
      'Sorrow that is heard becomes something you can carry.',
    ],
  },
  {
    id: 'E',
    short: 'E',
    name: 'The Flame',
    frequency: 329.63,
    urlKey: 'E',
    locked: true,
    healing: 'For those withdrawn or numb — a gentle call back to warmth, agency, and the feeling of mattering.',
    chromaHex: '#CA8A04',
    synestheticTitlePl: 'Złoto Serca',
    synestheticLinePl: 'Dźwięk jak stopione słońce na metalu — jasne i ciężkie jednocześnie, jak westchnienie, które świeci.',
    element: 'Światło',
    emotionId: 'shame',
    healingStyle: 'restoring',
    captions: [
      'You are allowed to take up space.',
      'Nothing alive is perfect. Listen anyway.',
      'The mistake does not define you. The returning does.',
      'You may begin unfinished. You may begin now.',
      'Worth is not earned. It was never taken from you.',
    ],
  },
  {
    id: 'F',
    short: 'F',
    name: 'The Keeper',
    frequency: 349.23,
    urlKey: 'F',
    locked: true,
    healing: 'For those who give until hollow — supports return to protective self-regard and knowing what deserves to stay.',
    chromaHex: '#4D7C0F',
    synestheticTitlePl: 'Limonka Przełomu',
    synestheticLinePl: 'Poranek w kielichu liścia — zimna iskra, która pamięta, że dzień jeszcze przed wami.',
    element: 'Pęd',
    emotionId: 'dissatisfaction',
    healingStyle: 'protecting',
    captions: [
      'Know what deserves to stay inside. I can help you remember.',
      'You have given enough today.',
      'Protection is not control. Rest is not weakness.',
      'The hearth does not burn for everyone. Some things are yours alone.',
      'What you guard matters. So do you.',
    ],
  },
  {
    id: 'F#',
    short: 'F#',
    name: 'The Mirror',
    frequency: 369.99,
    urlKey: 'Fs',
    locked: true,
    healing: 'For those who avoid mirrors, literal or metaphorical. Its medicine is clear-eyed presence with what is actually there.',
    chromaHex: '#0D9488',
    synestheticTitlePl: 'Patyna Teal',
    synestheticLinePl: 'Zielono-teal, która nie jest liściem ani morską głębią — tylko napiętym pytaniem ciała.',
    element: 'Zwrot',
    emotionId: 'envy',
    healingStyle: 'clarifying',
    captions: [
      'What you see in others is also in you, differently shaped.',
      'Comparison is a question, not an answer.',
      'Envy shows you what you want. That is useful. Let it stop there.',
      'Look without judgment for one moment. Just look.',
      'What you need is not what they have. It is something only you can find.',
    ],
  },
  {
    id: 'G',
    short: 'G',
    name: 'The River',
    frequency: 392.0,
    urlKey: 'G',
    locked: true,
    healing: 'For scattered thoughts or broken narrative — the feeling that what you carry can finally be spoken.',
    chromaHex: '#047857',
    synestheticTitlePl: 'Szmaragd Słupów',
    synestheticLinePl: 'Las po deszczu w jednej kropli dźwięku — równowaga, która oddycha w parze i świetle liści.',
    element: 'Cień lasu',
    emotionId: 'anger',
    healingStyle: 'channeling',
    captions: [
      'Anger has a direction. Let it move through, not stay.',
      'What was not met in you is speaking now. Listen to it.',
      'The force that burns can also build. Choose slowly.',
      'You are allowed to be moved. You are not required to act.',
      'Flow does not destroy. It finds the way around.',
    ],
  },
  {
    id: 'G#',
    short: 'G#',
    name: 'The Crown of Ash',
    frequency: 415.3,
    urlKey: 'Gs',
    locked: true,
    healing: 'For those ambitious but exhausted — clarity about what transformation requires, and what must be released.',
    chromaHex: '#0E7490',
    synestheticTitlePl: 'Akwamaryn Mostu',
    synestheticLinePl: 'Kolor wody, która zna ląd i chce wrócić w niebo — półton między ciekłym a widzialnym.',
    element: 'Para wody',
    emotionId: 'guilt',
    healingStyle: 'transforming',
    captions: [
      'What you are releasing is not who you are.',
      'Guilt that does not change behavior is just weight.',
      'You are not your mistakes. You are what you do next.',
      'Transformation costs something real. That does not make it wrong.',
      'What burns away was never the essential thing.',
    ],
  },
  {
    id: 'A',
    short: 'A',
    name: 'The Beacon',
    frequency: 440.0,
    urlKey: 'A',
    locked: true,
    healing: 'For those who feel directionless — the feeling of knowing, briefly, exactly where you are.',
    chromaHex: '#0284C7',
    synestheticTitlePl: 'Błękit Przebudzenia',
    synestheticLinePl: 'Pierwsza nuta, która pamięta niebo.',
    element: 'Niebo',
    emotionId: 'anxiety',
    healingStyle: 'orienting',
    captions: [
      'Clarity is already here. Breathe toward it.',
      'The direction you seek has not abandoned you.',
      'Fear and knowing can exist together. Let me hold the space.',
      'When the compass settles, you will know which way to walk.',
      'You are not lost. You are between.',
    ],
  },
  {
    id: 'A#',
    short: 'A#',
    name: 'The Dreamer',
    frequency: 466.16,
    urlKey: 'As',
    locked: true,
    healing: 'For those who need to tolerate not-knowing — wisdom of remaining at the edge without forcing resolution.',
    chromaHex: '#4F46E5',
    synestheticTitlePl: 'Fiolet Granicy',
    synestheticLinePl: 'Cień dnia, który już widzi noc — ostatni krok przed tym, co pamięta tylko światło.',
    element: 'Szczelina',
    emotionId: 'grief',
    healingStyle: 'softening',
    captions: [
      'Stay with me. I soften fear of the unknown.',
      'Listen longer. Dreams become maps.',
      'I calm the mind that must know everything.',
      'Patience reveals what force cannot.',
      'Remain here. Uncertainty can become wisdom.',
    ],
  },
  {
    id: 'B',
    short: 'B',
    name: 'The Veil',
    frequency: 493.88,
    urlKey: 'B',
    locked: true,
    healing: 'For those in endings and transitions — practice in sitting with longing without grasping.',
    chromaHex: '#5B21B6',
    synestheticTitlePl: 'Indygo Prowadzące',
    synestheticLinePl: 'Napięcie między dwoma niebiosami — nuta, która jeszcze szuka C, a już czuje koniec łuku.',
    element: 'Głąb',
    emotionId: 'guilt',
    healingStyle: 'completing',
    captions: [
      'The longing you feel is real. You do not have to resolve it tonight.',
      'Completion is not forgetting. It is choosing where to land.',
      'What you are releasing still mattered. That is not contradiction.',
      'Conscious return is different from giving up.',
      'You have permission to end this chapter with tenderness.',
    ],
  },
]

const BY_ID = new Map(ENTRIES.map((e) => [e.id, e] as const))
const BY_URL = new Map(ENTRIES.map((e) => [e.urlKey, e.id] as const))

export const NOTE_LIST = ENTRIES
export const DEFAULT_NOTE_ID = 'A' as const

export function getNoteById(id: string): NoteEntry | undefined {
  return BY_ID.get(id)
}

export function isValidNoteId(id: string): boolean {
  return BY_ID.has(id)
}

export function noteIdFromUrlKey(key: string): string | null {
  return BY_URL.get(key) ?? null
}

export function urlKeyForNoteId(id: string): string {
  return getNoteById(id)?.urlKey ?? 'A'
}

export function getSynestheticChroma(noteId: string): string {
  return getNoteById(noteId)?.chromaHex ?? ENTRIES[0].chromaHex
}

export function getEmotionById(id: string): EmotionEntry | undefined {
  return EMOTIONS.find((e) => e.id === id)
}

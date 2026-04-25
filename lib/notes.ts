export type EmotionEntry = {
  id: string
  namePl: string
  descriptionPl: string
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
export const DEFAULT_NOTE_ID = 'C' as const

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
  return getNoteById(id)?.urlKey ?? 'C'
}

const LORE_BY_NOTE: Record<string, string[]> = {
  C: [
    'The oldest stable tone in settlement memory — a sound humans return to instinctively, as though the body already knows it before the mind catches up.',
    'Bronze Age builders unknowingly shaped stone chambers that resonated near C\'s frequency through wall spacing and stone density. Archaeologists found worshippers sat inside a hum they could feel in their ribs.',
    'Researchers in psychoacoustics speculate that sustained low-frequency tones near 260 Hz may reduce cortisol responses by encouraging slow diaphragmatic breathing patterns — the body slowing itself to match the sound.',
    'Practitioners suggest C for states of overwhelm, dissociation, or anxiety. Its medicine is grounding without force — not pushing calm inward, but creating the conditions in which calm arrives on its own.',
    'Some traditions hold that cities unconsciously grow around frequencies they can emotionally survive. C, they say, is the sound a city makes when it stops being afraid.',
  ],
  'C#': [
    'Between certainty and change lives a half-step. C# is that interval — the doorway pitch that marks every meaningful crossing, neither where you were nor where you\'re going.',
    'Reed instruments in rite-of-passage ceremonies across Central Asian and North African traditions were tuned to this region of the scale. Oral accounts describe it reserved for lament songs that faced endings without collapsing.',
    'Tonal ambiguity — the quality of a note that belongs to no single emotional resolution — may increase attentional sensitivity. Researchers in auditory neuroscience call this heightened perceptual vigilance: the mind becomes more present.',
    'C# may be useful at thresholds: endings, decisions, identity shifts. Its mild dissonance is not distress — it is the sound of something real being asked of you, and the courage required to stay with the question.',
    'An old belief from oral traditions: the moment between sleep and waking has a pitch. C# is the closest Western tuning comes to naming it — the tone of the liminal instant before the world reassembles itself.',
  ],
  D: [
    'Motion embedded in sound. D appears in more journey melodies than any other note — not because it is dramatic, but because it is honest about the nature of moving forward.',
    'Mountain trade routes in the Alps and Caucasus produced traveling songs centered around D. Guides and porters used repetitive D-based melodies to synchronize breath and pace across long ascents, reducing perceived effort through shared rhythm.',
    'Rhythmic tones in the mid-range frequency spectrum may entrain walking pace and breathing rhythm. Some researchers describe this as motor-auditory coupling — the body finds its stride by following the sound rather than forcing it.',
    'For those stuck, frozen, or overwhelmed by inertia, D may gently reintroduce the body to motion. Not urgency — just the quiet reminder that one step is enough. That movement and arrival are different gifts.',
    'Pilgrims in some traditions believed D was the tone the road itself made when walked with intention. That a long path hummed in D was not traveling through space — but through time, returning the walker to something forgotten.',
  ],
  'D#': [
    'Not darkness — but shadow with something alive inside it. D# is the tone of unresolved beauty: grief that hasn\'t collapsed, longing that hasn\'t lied, love that knows what it has cost.',
    'Lament traditions across Eastern European and Middle Eastern folk music consistently gravitated to scales passing through D#. Oral accounts describe it appearing in funeral songs not to deepen sorrow, but to give sorrow somewhere dignified to live.',
    'Some music therapy researchers speculate that minor-leaning pitches allow emotional processing without triggering avoidance. D# may be difficult enough to feel real, but not so dissonant as to overwhelm — a container for what needs to be felt.',
    'D# may help those carrying unexpressed grief or unfinished mourning. Its medicine is not catharsis alone — it is recognition. To hear D# held steadily is to have the wound acknowledged without being asked to explain it.',
    'Ancient traditions held that D# was where the dead could still be heard if the living listened carefully. Not in horror — but in love, suspended at the edge of forgetting. The tone that keeps presence from becoming absence too quickly.',
  ],
  E: [
    'Bright, open, slightly brave. E carries the frequency of vitality — the chest-forward tone of something that has decided to live fully, without waiting for permission or perfect conditions.',
    'Battle hymns, dawn songs, and sunrise chants across Celtic and South American traditions were built around E. Practitioners report it was used not to suppress fear, but to sing alongside it until fear became energy — until the body remembered it was capable.',
    'Researchers speculate that sustained mid-high frequency tones in the E range may stimulate mild sympathetic arousal — the productive kind: alertness without anxiety, readiness without tension. The nervous system prepared rather than threatened.',
    'For those withdrawn, numb, or disconnected from agency, E can act as a gentle call back. Its medicine is warmth: the feeling of mattering, of being able to act, of the body remembering that it belongs to a life still in motion.',
    'In some oral traditions, E was the first note the sun sang after winter — the one that convinced seeds they were worth the effort of growing. That warmth, they believed, was not metaphor. It was a frequency arriving before the light.',
  ],
  F: [
    'Steadiness without heaviness. F is the tone of hearth, boundary, and care — the pitch that asks quietly: who needs protecting here? And then waits while the answer forms.',
    'Domestic music traditions across Norse, Slavic, and South Asian cultures featured sustained F-based drones in lullabies and home-protection songs. Archival fragments suggest it was sung at doorways, at the edge of sleep, at the hour of someone\'s return.',
    'Some practitioners suggest that F\'s interval relationship to C creates an acoustically stable foundation — its sustained use may be perceived as safe by a nervous system calibrated to familiar harmonic ratios. Not excitement, but permission to rest.',
    'For those with unclear limits, or who give until hollow, F may support a return to protective self-regard. Its medicine is knowing what deserves to stay inside — and what does not — and holding that knowledge without apology.',
    'Storytellers in old traditions held that houses with sustained F in their walls — from the hum of a fire, or the resonance of singing — kept what mattered from drifting away. That a home was not structure but frequency, and frequency was not metaphor.',
  ],
  'F#': [
    'A tone that turns attention inward. F# is the pitch of self-recognition — the one that sits at the edge of major and minor and refuses to pretend that either is the whole truth about what you are.',
    'Instruments designed for trance states and contemplative practice across Persian and Indian classical traditions frequently used F# as a pivot note — the place where the melody stopped traveling outward and began asking questions that only the listener could answer.',
    'Researchers in auditory cognition have noted that unresolved tonal centers can increase introspective attention. F#\'s ambiguity may, in certain listening contexts, encourage self-directed awareness without judgment — seeing without immediately deciding what to do with what is seen.',
    'F# may be useful for those who avoid mirrors — literal or metaphorical. Its medicine is not flattery or shame, but clear-eyed presence with what is actually there. The courage to look, and then to remain in the looking.',
    'Some traditions held that a sustained F# could let a person hear their own name — not spoken aloud, but from inside the silence that surrounds memory. The tone that recalls who you were before you learned to perform yourself.',
  ],
  G: [
    'Language in tone. G is the storytelling note — the one that moves without getting lost, balances without becoming rigid, and carries complexity without effort. The sound of something that knows where it\'s going.',
    'In many ancient pedagogical traditions, teachers sang in G-centered keys while instructing students in memory work. Oral histories from the Tibetan plateau describe G as the tone that keeps stories from breaking — the frequency of coherent transmission.',
    'Balanced mid-range frequencies like G sit near the resonance peak of the human vocal tract. Some acoustic researchers suggest this correspondence makes G particularly easy to internalize and sustain — the body recognizing it as its own.',
    'For those with scattered thoughts, broken narrative, or difficulty expressing what they know, G may offer coherence. Its medicine is organized expression: the feeling that what you carry can be spoken, and that speaking it won\'t destroy it.',
    'Certain oral traditions held that G was the first tone the world spoke after creating light — that before form, before name, there was only the soft flowing frequency of a river finding its way. That language itself was a gift from G.',
  ],
  'G#': [
    'Ambition with consequence. G# is the tone of transformation through sacrifice — a pitch that has always known the price of reaching higher, and climbs anyway. Not naive hope, but informed ascent.',
    'Medieval and Renaissance polyphonic composers used G# as a strategic pivot in tragic sequences — its sharpness propelled melodies toward resolution but marked the cost of every ascent. Archival records suggest royal funeral compositions frequently featured this pitch.',
    'G# sits outside the comfort of natural harmonic series in many tuning systems — its slight strangeness may increase emotional salience. Researchers speculate it heightens perceptual contrast, making what surrounds it feel more vivid, more consequential.',
    'For those ambitious but exhausted, or climbing toward a version of themselves just out of reach, G# may provide clarity about what transformation actually requires — and what must be released to achieve it. The ash is not failure. It is evidence of what was real.',
    'Alchemical manuscripts from 13th-century Europe included reference to the tone of gold that must first burn. Scholars speculate this referred to a modal pitch near G#. The tradition held that only what survives burning was ever truly yours.',
  ],
  A: [
    'Open sky in sound form. A is the alignment note — the modern tuning standard and an ancient symbol of orientation, used when musicians needed to find each other across distance, difference, and unfamiliarity.',
    'Before standardized tuning, traveling musicians across Medieval Europe tuned to A by ear when playing with strangers. Oral traditions describe A as the tone you find first — the one everyone could agree on because it felt honest, like recognizing something you\'d always known.',
    'At 440 Hz, A sits at a frequency many listeners experience as clear and spacious without being sharp. Some researchers associate listening to well-tuned A with improved pitch-discrimination ability and reduced perceptual ambiguity — the mind organizing itself around a reliable center.',
    'A may support those who feel directionless, isolated from their own purpose, or disconnected from clarity. Its medicine is orientation — the feeling of knowing, briefly, exactly where you are. Of the compass settling. Of the path becoming visible.',
    'Some traditions hold that A is the tone the universe hums when nothing in particular is happening. A reminder that beneath all noise, alignment is always available — one held breath away from the place where you remember what you actually want.',
  ],
  'A#': [
    'The liminal tone. A# exists at the brink of the octave — suspended, alert, and profoundly aware that what comes next is not yet determined. The frequency of being almost, but not quite, somewhere else.',
    'Night chants in Indigenous traditions across the Americas and Southeast Asia consistently featured tonal centers near A#. These songs were not designed for sleep, but for the threshold state before sleep — the moment when the symbolic mind becomes audible and images arrive unbidden.',
    'Some sleep researchers speculate that certain frequencies in the 460–470 Hz range may support the hypnagogic state — the half-waking, half-dreaming liminal period when creative insight frequently emerges. The mind permeable, the filter thin.',
    'A# may assist those who need to access imagination, metabolize unresolved experiences through dream-space, or tolerate not knowing. Its medicine is the wisdom of remaining at the edge without forcing resolution — letting the image arrive rather than constructing it.',
    'An old saying: the Dreamer does not arrive. It waits for you to stop insisting on waking. A# is the pitch that keeps the door to images and symbols open — for those still brave enough to step through without knowing what they\'ll find.',
  ],
  B: [
    'The leading tone — the last note before return. B leans toward C with such longing it almost doesn\'t need to resolve. Almost. It is the sound of something that knows where home is, and chooses to linger just outside it.',
    'Contemplative schools in both Eastern and Western traditions used sustained B as a tool for teaching conscious return — the practice of choosing where to land rather than collapsing into habit. Monks held B until they could feel the pull toward C without immediately following it.',
    'The leading tone phenomenon is one of music cognition\'s most documented effects: B creates strong directional expectation toward C. Researchers suggest this expectation activates reward anticipation circuits — making the eventual resolution feel earned rather than automatic.',
    'For those in endings, transitions, or the grief of completion, B offers practice in sitting with longing without grasping. Its medicine is conscious dissolution — the kind that trusts that what comes after is real, even before it has fully arrived.',
    'Some traditions held that B was the last thought of every life — a tone of recognition, not regret. The sound of looking back at what was loved, before the circle closes. What makes B sacred is not its resolution — it is everything it contains before releasing.',
  ],
}

export function getLoreFragmentsForNote(noteId: string): string[] {
  return LORE_BY_NOTE[noteId] ?? LORE_BY_NOTE.C ?? []
}

export function getSynestheticChroma(noteId: string): string {
  return getNoteById(noteId)?.chromaHex ?? ENTRIES[0].chromaHex
}

export function getCaptionsForNote(noteId: string): string[] {
  return getNoteById(noteId)?.captions ?? []
}

export function getEmotionById(id: string): EmotionEntry | undefined {
  return EMOTIONS.find((e) => e.id === id)
}

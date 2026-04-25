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
    'Zanim była muzyka, było milczenie. C jest pierwszym oddechem po tej ciszy — nutą, od której wszystko się zaczyna.',
    'Pitagorejczycy uważali C za pierwszą emanację kosmosu. Mówili, że ten dźwięk słyszały gwiazdy, zanim powstały planety.',
    'Starożytni Egipcjanie stroili harfy do C, wierząc, że ta częstotliwość rezonuje z korzeniami kręgosłupa — miejscem, gdzie ciało spotyka ziemię.',
    'W tradycji tybetańskiej C odpowiada czakrze korzenia. Mnisi śpiewali tę nutę przed medytacją, by zakotwić umysł w ciele.',
    'C nie jest początkiem skali przez przypadek. To nuta, której drgania najłatwiej synchronizują się z rytmem serca spoczywającego człowieka. Słuchasz jej. Ona słucha ciebie.',
  ],
  'C#': [
    'C# pamięta. To nuta, która nosi w sobie wszystko, co zostało zapomniane — imiona, rytuały, gesty rąk, których już nikt nie wykonuje.',
    'Monolityczne budowle — od Stonehenge po krąg w Avebury — wytwarzają rezonans akustyczny zbliżony do częstotliwości C#. Kamień mówi. My przestaliśmy słuchać.',
    'W tradycjach szamańskich skała jest najstarszym świadkiem. C# to jej głos — powolny, pewny, niezmienny jak granit pod stopami.',
    'Muzykolodzy zauważają, że C# pojawia się w muzyce pogrzebowej i pamięci zbiorowej różnych kultur. Jakby ludzkie ciało wiedziało: ta częstotliwość łączy ze zmarłymi bez bólu rozstania.',
    'Słuchaj C# gdy chcesz poczuć ciągłość — że jesteś ogniwem, nie początkiem. Przodkowie nie są martwi. Są ciszą, z której wyrastasz.',
  ],
  D: [
    'D jest nutą, która śni na jawie. Żyje na granicy między tym, co widzialne, a tym, co tylko przeczuwane.',
    'Renesansowi lutnicy unikali D w muzyce dworskiej — uważali, że zbyt mocno pobudza wyobraźnię i sprawia, że słuchacze odpływają myślami.',
    'W tradycji celtyckiej D była nutą bardów. Śpiewana przed snem, miała otwierać drzwi do snów przepowiadających przyszłość.',
    'Współczesne badania nad terapią dźwiękiem pokazują, że częstotliwości w okolicach 293 Hz spowalniają aktywność kory przedczołowej — tej samej, która blokuje kreatywne myślenie.',
    'D nie pyta. D sugeruje. To nuta, która mówi: a co gdyby? Słuchaj jej wtedy, gdy jesteś zablokowany. Ona znajdzie drzwi, których nie widzisz.',
  ],
  'D#': [
    'D# nie pyta, czy wolno jej się cieszyć. Po prostu się cieszy. To nuta, która pamięta, że radość nie potrzebuje powodu.',
    'Kołysanki we wszystkich kulturach — od Japonii po Brazylię — krążą wokół częstotliwości D#. Ten dźwięk mówi: jesteś bezpieczny. Możesz teraz spać. Możesz teraz się śmiać.',
    'Dzieci śpiewają w D# nim ktokolwiek je czegoś nauczy. To instynktowna skala ciała — pierwsza muzyka, zanim pojawi się słowo.',
    'Terapeuci pracy z wewnętrznym dzieckiem używają wysokich, jasnych tonów do przywracania kontaktu z radością sprzed ran. D# to ich ulubiona częstotliwość.',
    'D# pyta: kiedy ostatnio bawiłeś się bez celu? Nie słuchaj jej głową. Zostaw się trochę bez powodu. Ona znajdzie resztę.',
  ],
  E: [
    'E jest nutą, której nikt nie chce słyszeć — i której wszyscy potrzebują. To dźwięk tego, co boli.',
    'Greccy tragicy używali E w chórach podczas scen żałoby. Wierzyli, że ta nuta wyciąga smutek z ciała, zamiast go tłumić.',
    'W flamenco E jest sercem duende — nieuchwytnej siły, która sprawia, że muzyka łamie serce i jednocześnie je leczy.',
    'Terapeuci dźwiękiem używają E przy pracy z traumą. Nie dlatego, że jest przyjemna — ale dlatego, że jest prawdziwa.',
    'E jest odważna. Nie udaje, że wszystko jest w porządku. Jeśli słuchasz jej i czujesz, że coś w tobie drży — to znaczy, że działa. Pozwól sobie drżeć.',
  ],
  F: [
    'F jest miejscem, do którego wracasz. Nie dom z cegły — dom z dźwięku.',
    'Średniowieczne katedry były budowane tak, by ich akustyka naturalnie rezonowała w okolicach F. Architekci wiedzieli: ten dźwięk sprawia, że ludzie czują się bezpieczni.',
    'W muzyce indyjskiej F (Ma) jest nutą matki — stabilną, troskliwą, zawsze obecną pod melodią jak ziemia pod stopami.',
    'Badania wykazały, że F redukuje poziom kortyzolu szybciej niż jakakolwiek inna pojedyncza nuta. To częstotliwość, która mówi układowi nerwowemu: możesz odpocząć.',
    'F nie jest ekscytująca. Nie prowadzi cię w nieznane. F jest ramionami, które na ciebie czekają. Wróć do niej, kiedy świat jest za głośny.',
  ],
  'F#': [
    'F# nie zna odpowiedzi. I nie chce ich znać zbyt szybko. To nuta pytania — otwarta, przestronna, zafascynowana samym szukaniem.',
    'Perskie i indyjskie instrumenty kontemplacyjne były strojone tak, by punkt obrotu melodii trafiał w okolice F#. Tu melodia przestaje szukać zewnątrz i zaczyna słuchać wewnątrz.',
    'F# istnieje na granicy dwóch tonacji — ani major, ani minor. Ta nieokreśloność nie jest brakiem. To przestrzeń, w której mieści się pytanie zanim stanie się przekonaniem.',
    'Słuchacze opisują F# jako nutę, która otwiera okno — nagle widać więcej, niż było przed chwilą. Nie nową odpowiedź. Nową możliwość zadania pytania.',
    'Słuchaj F# gdy wiesz, że czegoś szukasz, ale nie wiesz czego. Ona nie wskaże kierunku. Nauczy cię lubić wędrówkę.',
  ],
  G: [
    'G zawsze zmierza gdzieś dalej. To nuta horyzontu — wabi, ale nigdy nie pozwala się złapać.',
    'Trubadurzy śpiewali w G podczas wędrówek między zamkami. Twierdzili, że ta nuta skraca drogę — nie przez magię, lecz przez to, że sprawia, iż kroki same się rwą do przodu.',
    'G jest dominantą w systemie harmonicznym — nutą, która zawsze chce wrócić do domu, ale po drodze zwiedza cały świat.',
    'Muzykoterapeuci używają G przy pracy z depresją i apatią. Ta częstotliwość aktywuje obszary mózgu związane z antycypacją nagrody — sprawia, że przyszłość znów wydaje się warta zachodu.',
    'G pyta: dokąd idziesz? Nie czeka na odpowiedź. Już rusza. Słuchaj jej, gdy utknąłeś.',
  ],
  'G#': [
    'G# to dźwięk, który ciało zna lepiej niż umysł. To częstotliwość lasu, deszczu, oddechu ziemi — wszystkiego, co przywraca bez pytania o pozwolenie.',
    'Instrumenty uzdrawiające stosowane przez kultury tubylcze — misy tybetańskie, didgeridoo, grzechotki szamańskie — generują harmoniczne zbliżone do G#. Ciało odpowiada, zanim zdążysz pomyśleć o uzdrowieniu.',
    'Badania biofeedback pokazują, że dźwięki w okolicach 415 Hz mogą synchronizować rytm serca i oddech — uruchamiając parasympatyczny układ nerwowy odpowiedzialny za regenerację.',
    'G# nie leczy na siłę. Tworzy warunki, w których ciało leczy się samo — tak jak gleba nie tworzy kwiatu, ale go umożliwia.',
    'Wróć do G# gdy jesteś zmęczony na poziomie, którego nie da się wytłumaczyć. To zmęczenie głębsze niż sen. G# dotyka go inaczej.',
  ],
  A: [
    'A jest nutą, do której stroimy wszystko inne. To punkt odniesienia. Centrum. Ty.',
    'Spór o 440 Hz vs 432 Hz trwa od dekad. Jedni twierdzą, że 432 Hz rezonuje z naturą. Inni — że to mit. A milczy. Wie, że prawda leży w słuchaczu, nie w liczbie.',
    'W tradycji sufickiej A było nutą widzenia siebie — używaną w praktykach, które miały pomóc adeptowi zobaczyć swoje ego bez oceniania.',
    'A aktywuje korę słuchową szybciej niż jakakolwiek inna nuta — to dlatego służy do strojenia. Twój mózg zna A lepiej niż cokolwiek innego.',
    'Słuchasz A i słyszysz siebie. Nie tę wersję, którą pokazujesz innym. Tę prawdziwą — cichą, pewną, zawsze tam obecną. A nie kłamie.',
  ],
  'A#': [
    'A# nie przeprasza za swój hałas. To nuta gniewu, który ma rację — i wie o tym.',
    'Muzyka protestacyjna na wszystkich kontynentach instynktownie sięga po tonacje z A#. Rewolucjoniści śpiewali w tej skali nie dlatego, że ją znali — ale dlatego, że ciało wie, jak brzmieć gdy dość.',
    'Gniew niewyrażony nie znika. Zamienia się w coś gorszego — cichy sabotaż, chroniczne napięcie, obojętność. A# jest bezpiecznym kanałem: wyraź to, co boli, zanim to ciebie wyrazi.',
    'Neurolodzy zauważają, że wysokie, lekko dysonansowe częstotliwości aktywują ciało migdałowate — centrum emocjonalne. A# nie uspokaja. Przebudza. I to jest jej dar.',
    'Słuchaj A# gdy jesteś zbyt grzeczny zbyt długo. Gdy tłumisz coś, co ma prawo głosu. Ona nie nauczy cię wrzeszczeć — nauczy cię wiedzieć, kiedy warto.',
  ],
  B: [
    'B stoi w drzwiach. Patrzy w obie strony. Nie pyta, czy jesteś gotowy.',
    'W muzyce B jest nutą napięcia — zawsze chce rozwiązać się w górę lub w dół, nigdy nie stoi w miejscu. To nuta, która nie pozwala ci zostać tam, gdzie jesteś.',
    'Szamani wielu kultur używali wysokich, napięciowych częstotliwości podczas rytuałów przejścia. B było nutą zmiany skóry.',
    'Neurolodzy zauważyli, że częstotliwości w okolicach 490 Hz wywołują krótkie stany podwyższonej czujności — jakby mózg czuł, że coś ważnego zaraz się wydarzy.',
    'B nie jest dla każdego i nie jest na każdy moment. Słuchaj jej, gdy stoisz przed wyborem i się boisz. Ona nie zdejmie strachu. Pomoże ci przez niego przejść.',
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

export type Mood = 'anxious' | 'tired' | 'sad' | 'numb' | 'restless' | null
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type AffirmationLocale = 'en' | 'pl'

export interface AffirmationInput {
  noteId: string
  mood?: Mood
  timeOfDay: TimeOfDay
  streak: number
  sessionLengthSeconds: number
  teardropMilestone?: 0 | 1 | 2
  locale?: AffirmationLocale
}

const PHRASES: Record<string, readonly string[]> = {
  C: [
    'The ground held you again.',
    'You do not need to rush to be worthy.',
    'Stillness was not absence. It was arrival.',
    'Something sturdy lives inside you.',
    'Even roots grow in silence.',
    'You returned. That is enough.',
    'The foundation was always here.',
  ],
  'C#': [
    'Clarity came quietly this time.',
    'The edge you carry is also a gift.',
    'You are sharper than you needed to be.',
    'Precision has its own gentleness.',
    'What was blurred is less so now.',
    'Courage does not always announce itself.',
    'You cut through something real today.',
  ],
  D: [
    'The path appeared while you listened.',
    'Some journeys begin with closing your eyes.',
    'You were moving even in stillness.',
    'Wandering inward is its own discovery.',
    'Direction comes when you stop forcing it.',
    'You found something without searching.',
    'The wanderer always arrives somewhere.',
  ],
  'D#': [
    'Something in you is still alive and bright.',
    'Even small flames illuminate.',
    'The spark survived the quiet.',
    'You kept something burning today.',
    'Life recognizes itself in you.',
    'What ignites you has not gone out.',
    'Aliveness is not something you earn.',
  ],
  E: [
    'Softness is not weakness. It is spring.',
    'You gave yourself permission to open.',
    'Something gentle bloomed while you stayed.',
    'Growth does not always announce itself.',
    'The tender parts of you deserve care.',
    'Opening is the bravest thing.',
    'Bloom does not apologize for arriving.',
  ],
  F: [
    'Rest is also devotion.',
    'Today softness was enough.',
    'The keeper must also be kept.',
    'Caring for yourself is not a detour.',
    'You held something sacred today.',
    'Shelter can be something you give yourself.',
    'You were gentle, and that mattered.',
  ],
  'F#': [
    'You already knew.',
    'The answer was already in you.',
    'You met yourself with less fear today.',
    'What you saw was real. So are you.',
    'Honesty is its own kind of warmth.',
    'The mirror showed you something true.',
    'Recognition arrives gently if you let it.',
  ],
  G: [
    'Flow returned where force failed.',
    'You did not need to hold on so tightly.',
    'Release is not loss. It is trust.',
    'Something moved through you cleanly.',
    'The river remembers how to move.',
    'What you let go made room for more.',
    'Ease was always available.',
  ],
  'G#': [
    'What burns in you is not destructive.',
    'You carried your fire gently this time.',
    'Transformation is not always violent.',
    'The heat you hold can also warm.',
    'Intensity and softness are not opposites.',
    'Your fire found its shape today.',
    'Passion held lightly becomes art.',
  ],
  A: [
    'Tenderness is strength.',
    'Warmth is courage.',
    'Your heart knows more than it lets on.',
    'You allowed yourself to feel. That takes bravery.',
    'The heart has its own intelligence.',
    'To love is to stay present. Stand still.',
    'What opened in you is not a wound.',
  ],
  'A#': [
    'The storm passed through. You remained.',
    'What felt overwhelming is quieter now.',
    'You were not destroyed by what moved through you.',
    'After the storm, things are clearer.',
    'Even turbulence has its purpose.',
    'You did not become the weather.',
    'The storm was real. So is the stillness after.',
  ],
  B: [
    'You are more whole than you remember.',
    'Something was integrated today.',
    'The crown is already yours.',
    'Wisdom arrives slowly and all at once.',
    'You carry what you know without it weighing you down.',
    'Integration does not look like victory. It looks like this.',
    'Sovereignty is quieter than you expected.',
  ],
}

const PHRASES_PL: Record<string, readonly string[]> = {
  C: [
    'Ziemia znów cię utrzymała.',
    'Nie musisz się spieszyć, by być godnym.',
    'Cisza nie była brakiem. Była przybyciem.',
    'W tobie mieszka coś stałego.',
    'Nawet korzenie rosną w ciszy.',
    'Wróciłeś. To wystarcza.',
    'Fundament był zawsze tu.',
  ],
  'C#': [
    'Tym razem jasność przyszła cicho.',
    'Ostra krawędź, którą niesiesz, to też dar.',
    'Jesteś ostrzejszy niż musisz.',
    'Precyzja ma swoją łagodność.',
    'To, co było rozmyte, jest teraz mniej.',
    'Odwaga nie zawsze się ogłasza.',
    'Dziś przeciąłeś coś prawdziwego.',
  ],
  D: [
    'Ścieżka pojawiła się, gdy słuchałeś.',
    'Niektóre podróże zaczynają się od zamknięcia oczu.',
    'Nawet w bezruchu się poruszałeś.',
    'Wędrówka do środka jest odkryciem samą w sobie.',
    'Kierunek przychodzi, gdy przestajesz go wymuszać.',
    'Znalazłeś coś bez szukania.',
    'Wędrowiec zawsze gdzieś dociera.',
  ],
  'D#': [
    'Coś w tobie wciąż żyje i świeci.',
    'Nawet małe płomienie rozświetlają.',
    'Iskra przetrwała ciszę.',
    'Dziś utrzymałeś coś w płomieniu.',
    'Życie rozpoznaje siebie w tobie.',
    'To, co cię rozpala, nie zgasło.',
    'Życiowość to nie coś, na co zasługujesz.',
  ],
  E: [
    'Miękkość to nie słabość. To wiosna.',
    'Dałeś sobie pozwolenie, by się otworzyć.',
    'Coś delikatnego zakwitło, gdy zostałłeś.',
    'Wzrost nie zawsze się ogłasza.',
    'Delikatne części ciebie zasługują na troskę.',
    'Otwarcie jest najodważniejszą rzeczą.',
    'Kwitnienie nie przeprasza za przybycie.',
  ],
  F: [
    'Odpoczynek też jest oddaniem.',
    'Dziś miękkość wystarczyła.',
    'Kto strzeże, też zasługuje na opiekę.',
    'Troska o siebie nie jest objazdem.',
    'Dziś trzymałeś coś świętego.',
    'Schronieniem może być to, co dajesz sobie.',
    'Byłeś łagodny — i to miało znaczenie.',
  ],
  'F#': [
    'Już wiedziałeś.',
    'Odpowiedź była już w tobie.',
    'Dziś spotkałeś się ze sobą z mniejszym lękiem.',
    'To, co widziałeś, było prawdziwe. Ty też.',
    'Szczerość ma swoje ciepło.',
    'Lustro pokazało ci coś prawdziwego.',
    'Rozpoznanie przychodzi łagodnie, jeśli na nie pozwolisz.',
  ],
  G: [
    'Przepływ wrócił tam, gdzie siła zawiodła.',
    'Nie musiałeś trzymać tak mocno.',
    'Puścić to nie strata. To zaufanie.',
    'Coś przeszło przez ciebie czysto.',
    'Rzeka pamięta, jak płynąć.',
    'To, co puściłeś, zrobiło miejsce na więcej.',
    'Lekkość była zawsze dostępna.',
  ],
  'G#': [
    'To, co w tobie płonie, nie niszczy.',
    'Tym razem niosłeś swój ogień łagodnie.',
    'Przemiana nie zawsze jest gwałtowna.',
    'Ciepło, które nosisz, też może grzać.',
    'Intensywność i miękkość nie są przeciwieństwami.',
    'Dziś twój ogień znalazł kształt.',
    'Pasja niesiona lekko staje się sztuką.',
  ],
  A: [
    'Czułość to siła.',
    'Ciepło to odwaga.',
    'Twoje serce wie więcej, niż ujawnia.',
    'Pozwoliłeś sobie czuć. To wymaga odwagi.',
    'Serce ma swoją inteligencję.',
    'Kochać to trwać w obecności. Stań w miejscu.',
    'To, co się w tobie otworzyło, nie jest raną.',
  ],
  'A#': [
    'Burza przeszła. Ty zostałeś.',
    'To, co przytłaczało, jest teraz ciszej.',
    'Nie zostałeś zniszczony tym, co przez ciebie przeszło.',
    'Po burzy jest jaśniej.',
    'Nawet turbulencja ma swój sens.',
    'Nie stałeś się pogodą.',
    'Burza była prawdziwa. Także cisza potem.',
  ],
  B: [
    'Jesteś pełniejszy, niż pamiętasz.',
    'Dziś coś się zintegrowało.',
    'Korona już jest twoja.',
    'Mądrość przychodzi powoli i naraz.',
    'Nosisz to, co wiesz, bez ciężaru.',
    'Integracja nie wygląda jak zwycięstwo. Wygląda tak.',
    'Suwerenność jest ciszej, niż sądziłeś.',
  ],
}

const FALLBACK_PHRASES: readonly string[] = [
  'You stayed. The note remembers.',
  'Something arrived for you today.',
  'Stillness was the practice.',
  'The sound heard you back.',
]

const FALLBACK_PHRASES_PL: readonly string[] = [
  'Zostałeś. Nuta pamięta.',
  'Coś dziś dla ciebie przyszło.',
  'Cisza była praktyką.',
  'Dźwięk usłyszał ciebie z powrotem.',
]

const MONUMENTAL_PHRASES_EN = new Set<string>([
  'You allowed yourself to feel. That takes bravery.',
  'The crown is already yours.',
  'Sovereignty is quieter than you expected.',
])

const MONUMENTAL_PHRASES_PL = new Set<string>([
  'Pozwoliłeś sobie czuć. To wymaga odwagi.',
  'Korona już jest twoja.',
  'Suwerenność jest ciszej, niż sądziłeś.',
])

const MOOD_OFFSET: Record<NonNullable<Mood>, number> = {
  anxious: 0,
  tired: 1,
  sad: 2,
  numb: 3,
  restless: 4,
}

const TOD_OFFSET: Record<TimeOfDay, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
  night: 3,
}

function streakTier(streak: number): number {
  if (streak >= 7) return 2
  if (streak >= 3) return 1
  return 0
}

function normalizeMilestone(n: number | undefined): 0 | 1 | 2 {
  if (n == null) return 0
  if (n >= 2) return 2
  if (n >= 1) return 1
  return 0
}

export function deriveAffirmation(input: AffirmationInput): string {
  const locale = input.locale ?? 'en'
  const pools = locale === 'pl' ? PHRASES_PL : PHRASES
  const fallbacks = locale === 'pl' ? FALLBACK_PHRASES_PL : FALLBACK_PHRASES
  const pool = pools[input.noteId] ?? fallbacks
  const milestone = normalizeMilestone(input.teardropMilestone)
  const monumentalSet = locale === 'pl' ? MONUMENTAL_PHRASES_PL : MONUMENTAL_PHRASES_EN
  const filteredPool = pool.filter((phrase) => milestone >= 2 || !monumentalSet.has(phrase))
  const effectivePool = filteredPool.length > 0 ? filteredPool : pool
  const moodOff = input.mood != null ? MOOD_OFFSET[input.mood] : 0
  const todOff = TOD_OFFSET[input.timeOfDay]
  const strOff = streakTier(input.streak)
  const sessionBonus = input.sessionLengthSeconds >= 540 ? 1 : 0
  const idx = (moodOff + todOff + strOff + sessionBonus) % effectivePool.length
  return effectivePool[idx]!
}

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

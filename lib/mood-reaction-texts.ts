export const MOOD_ID_LIST = [
  'anxious',
  'numb',
  'heavy',
  'scattered',
  'hopeful',
] as const
export type MoodId = (typeof MOOD_ID_LIST)[number]

type NoteKey =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'B'

const R: Record<NoteKey, Record<MoodId, { en: string; pl: string }>> = {
  C: {
    anxious: {
      en: 'The Foundation hums lower today.',
      pl: 'Fundament dziś brzmi cicho, niżej.',
    },
    numb: {
      en: 'C stays close — a steady tone when feeling is out of reach.',
      pl: 'C zostaje blisko — prosta, gdy uczucie wydaje się daleko.',
    },
    heavy: {
      en: 'C meets weight without asking you to move it in one step.',
      pl: 'C spotyka ciężar i nie wymaga zdjęcia go jednym ruchem.',
    },
    scattered: {
      en: 'C gathers the loose threads of attention into a single line.',
      pl: 'C zbiera rozproszoną uwagę w jedną linię.',
    },
    hopeful: {
      en: 'C is the first yes — a floor beneath a still-unwritten day.',
      pl: 'C to pierwsze tak — podłoga pod jeszcze nienapisanym dniem.',
    },
  },
  'C#': {
    anxious: {
      en: 'C# leans on stone memory — a tone that will not be rushed.',
      pl: 'C# opiera się pamięci skały — dźwięk, który nie chce pędu.',
    },
    numb: {
      en: 'C# can hold feeling that has not yet been named.',
      pl: 'C# może ująć to, co jeszcze nie ma słowa.',
    },
    heavy: {
      en: 'C# is slow gravity — a patient witness under your ribs.',
      pl: 'C# to powolna grawitacja — cierpliwy świadek pod żebrami.',
    },
    scattered: {
      en: 'C# steadies the hand that keeps losing the thread.',
      pl: 'C# uspokaja dłoń, która gubi wątek.',
    },
    hopeful: {
      en: 'C# is an old promise still ringing, quietly true.',
      pl: 'C# to dawna obietnica, która wciąż cicho brzmi prawdą.',
    },
  },
  D: {
    anxious: {
      en: 'D holds the line between what you see and what you sense.',
      pl: 'D trzyma linię między tym, co widzisz, a tym, co wyczuwasz.',
    },
    numb: {
      en: 'D visits even when the heart feels thin — a dreamer still listening.',
      pl: 'D przychodzi, nawet gdy serce jest cienkie — snujący słuch.',
    },
    heavy: {
      en: 'D is not here to fix — it widens the room in your head.',
      pl: 'D nie tu po naprawy — tylko po odsłonięcie przestrzeni w głowie.',
    },
    scattered: {
      en: 'D gathers the fragments the mind dropped without noticing.',
      pl: 'D zbiera okruchy, które umykają bez słowa.',
    },
    hopeful: {
      en: 'D is the unopened door the breath already knows.',
      pl: 'D to drzwi, które oddech już zna, zanim w nie spojrzysz.',
    },
  },
  'D#': {
    anxious: {
      en: 'D# turns worry into a small bright spark, not a verdict.',
      pl: 'D# zamienia niepokój w małą iskrę, nie w wyrok.',
    },
    numb: {
      en: 'D# is gentleness when joy feels foreign.',
      pl: 'D# to łagodność, gdy radość czuje się cudzym słowem.',
    },
    heavy: {
      en: 'D# lifts a corner of the sheet — a breath of lighter air.',
      pl: 'D# unosi róg koca — cieńsze powietrze, lżejsze.',
    },
    scattered: {
      en: 'D# rounds the edges of a day that kept cutting.',
      pl: 'D# zaokrągla dziś krawędź, która ciągle cię raniła.',
    },
    hopeful: {
      en: 'D# is a laugh in the next room, possible again.',
      pl: 'D# to śmiech w pokoju obok — znowu możliwy.',
    },
  },
  E: {
    anxious: {
      en: 'E does not argue with the ache — it lets it speak first.',
      pl: 'E nie kłóci się z bólem — pozwala mówić mu pierwszemu.',
    },
    numb: {
      en: 'E is honest room for a feeling you cannot yet describe.',
      pl: 'E to uczciwa przestrzeń na to, czego jeszcze nie nazwiesz.',
    },
    heavy: {
      en: 'E sits with the truth without flinching — a quiet companion.',
      pl: 'E siedzi z prawdą i nie trwa — cichy towarzysz.',
    },
    scattered: {
      en: 'E steadies a storm by naming the wind, not stopping it.',
      pl: 'E mówi, jak wieje — nie tłumi burzy, tylko daje słowo.',
    },
    hopeful: {
      en: 'E knows healing often begins in the telling.',
      pl: 'E wie, że uzdrowienie bywa w opowieści, nie tylko w ciszy.',
    },
  },
  F: {
    anxious: {
      en: 'Sanctuary draws the walls a little further — you are not in a rush.',
      pl: 'Sanktuarium odsuwa ściany o oddech — nikt nie pędzi.',
    },
    numb: {
      en: 'F keeps a warm corner lit when the heart feels off-site.',
      pl: 'F trzyma ciepły róg, gdy serce jest gdzie indziej.',
    },
    heavy: {
      en: 'Sanctuary widens its breath.',
      pl: 'Sanktuarium poszerza oddech.',
    },
    scattered: {
      en: 'F is the floor that remembers the shape of return.',
      pl: 'F to podłoga, co pamięta kształt powrotu.',
    },
    hopeful: {
      en: 'F lets "safe" be a place you are allowed to land.',
      pl: 'F pozwala, by bezpieczne było miejsce, na które wolno spaść.',
    },
  },
  'F#': {
    anxious: {
      en: 'F# opens a window; the next question is allowed to be gentle.',
      pl: 'F# otwiera okno — twoje pytanie może być łagodne.',
    },
    numb: {
      en: 'F# is space for a question to exist before an answer is bought.',
      pl: 'F# daje miejsca na pytanie, zanim kupicie odpowiedź.',
    },
    heavy: {
      en: 'F# holds space — not a rush to resolve, a room to wonder.',
      pl: 'F# daje salę, nie cwał: miejsce na tęsknotę, nie tylko na słowa.',
    },
    scattered: {
      en: 'F# is the hush that lets thought choose its own path.',
      pl: 'F# to cisza, w której myśl wybiera drogę sama.',
    },
    hopeful: {
      en: 'F# is a shy opening — a maybe that does not have to be loud.',
      pl: 'F# to ciche może — wcale nie musi głośno krzyczeć.',
    },
  },
  G: {
    anxious: {
      en: 'G is already walking — a horizon that asks you to go gently.',
      pl: 'G już stąpa — horyzont, który prosi o łagodne iść dalej.',
    },
    numb: {
      en: 'G suggests distance without shaming the feet that stayed.',
      pl: 'G sugeruje dystans, nie wstydząc stóp, co zostały.',
    },
    heavy: {
      en: 'G pulls like a far shore — a slow promise of else.',
      pl: 'G ciągnie jak daleki brzeg — powolne obiecuje: indziej.',
    },
    scattered: {
      en: 'G gathers a single direction from many half thoughts.',
      pl: 'G zbiera jeden kierunek z tłumu półmyśli.',
    },
    hopeful: {
      en: 'G is a road re-opened, one step, no rush.',
      pl: 'G to znowu droga, jeden krok, nieśpiesznie.',
    },
  },
  'G#': {
    anxious: {
      en: 'G# quiets the inner alarm into something the body can answer.',
      pl: 'G# łagodzi alarm, który ciało może w końcu zrozumieć.',
    },
    numb: {
      en: 'G# is the soft ground under a tired spring.',
      pl: 'G# to miękka ziemia pod wiosną, co się zmęczyła.',
    },
    heavy: {
      en: 'G# mends the breath the day ran through too fast.',
      pl: 'G# ceruje oddech, który dzień spruł zbyt szybko.',
    },
    scattered: {
      en: 'G# rings true where words keep slipping your grasp.',
      pl: 'G# bije prawdą tam, gdzie słowa wymykają się z dłoni.',
    },
    hopeful: {
      en: 'G# is quiet renewal, like rain before it names the soil.',
      pl: 'G# to ciche odnawianie, jak deszcz zanim wymieni glebę.',
    },
  },
  A: {
    anxious: {
      en: 'A asks you to hear the self that is not performing.',
      pl: 'A prosi, by usłyszeć siebie, gdy już nic nie trzeba grać.',
    },
    numb: {
      en: 'A is a mirror you can look into without a script.',
      pl: 'A to lusterko bez scenariusza, na które można wejrzeć.',
    },
    heavy: {
      en: 'A holds a steady line — a reference, not a verdict on you.',
      pl: 'A daje odniesienie, nie osąd: stałą linię, nie rozkaz.',
    },
    scattered: {
      en: 'A gathers a single pitch from a choir of maybes.',
      pl: 'A wybiera jedną wysokość z chóru mżliwości.',
    },
    hopeful: {
      en: 'A is the self that is already in the room, waiting kindly.',
      pl: 'A to ktoś, kto już jest w pokoju, cierpliwie, blisko.',
    },
  },
  'A#': {
    anxious: {
      en: 'A# is heat with a file — a fair witness to a sharp edge in you.',
      pl: 'A# to ciepło o ostrzu — uczciwy świadek ostrości w tobie.',
    },
    numb: {
      en: 'A# finds the part of you that is tired of being polite in pain.',
      pl: 'A# znajduje cząstkę, co ma dość bycia grzecznie w bólu.',
    },
    heavy: {
      en: 'A# holds fire without scolding the spark.',
      pl: 'A# trzyma ogień, nie ganiąc iskry.',
    },
    scattered: {
      en: 'A# is one clear strike through a fog of half-no\'s.',
      pl: 'A# to jedno bystre trafienie we mgle pół-nie.',
    },
    hopeful: {
      en: 'A# is permission the voice has been owed for a long time.',
      pl: 'A# to zezwolenie, na które głos czekał długo.',
    },
  },
  B: {
    anxious: {
      en: 'B stands on the step — a threshold, not a push.',
      pl: 'B stoi na progu — to próg, nie pchnięcie.',
    },
    numb: {
      en: 'B is a thin, honest air for change you cannot name yet.',
      pl: 'B to cienka uczciwa sfera zmiany, której jeszcze nie nazwiesz.',
    },
    heavy: {
      en: 'B holds the hush that lets an ending be real, not cruel.',
      pl: 'B daje ciszę, by koniec był prawdą, nie okrucieństwem.',
    },
    scattered: {
      en: 'B gathers a single line between before and what comes next.',
      pl: 'B wybiera linię między „było" a tym, co będzie dalej.',
    },
    hopeful: {
      en: 'B is a door ajar, light from the other side, no rush to cross.',
      pl: 'B to uchylone drzwi, światło zza nich, bez pędu na krok dalej.',
    },
  },
}

const moodSet = new Set<MoodId>(MOOD_ID_LIST)

export function reactionLine(
  noteId: string,
  mood: string,
  locale: 'en' | 'pl'
): string {
  const n = (noteId in R ? noteId : 'C') as NoteKey
  const m = (moodSet.has(mood as MoodId) ? mood : 'hopeful') as MoodId
  const row = R[n]![m]!
  return locale === 'pl' ? row.pl : row.en
}

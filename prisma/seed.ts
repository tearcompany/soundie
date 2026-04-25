import { PrismaClient } from '@prisma/client'
import { NOTE_LIST, EMOTIONS, getLoreFragmentsForNote, type NoteEntry } from '../lib/notes'

const prisma = new PrismaClient()

type ParsedCard = {
  slug: string
  name: string
  phase: string | null
  phaseOrder: number | null
  arcanaType: 'major' | 'minor' | 'special'
  suit: string | null
  cardNumber: number | null
  tagline: string | null
  description: string | null
  meaningUpright: string | null
  meaningShadow: string | null
  affirmation: string | null
}

const TEARDROP_CARDS: ParsedCard[] = [
  // ROOTS
  {
    slug: 'the-seed', name: 'The Seed', phase: 'roots', phaseOrder: 1, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Początek to decyzja, nie plan.',
    description: 'Nasiono nie wie, że stanie się drzewem. Ale mówi: „tak".',
    meaningUpright: 'Inicjacja\nIntuicyjna decyzja\nWiara bez dowodu',
    meaningShadow: 'Strach przed startem\nPotrzeba kontroli\nOdkładanie',
    affirmation: 'Zaczynam, zanim zrozumiem.',
  },
  {
    slug: 'the-soil', name: 'The Soil', phase: 'roots', phaseOrder: 2, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Podłoże decyduje o wzroście.',
    description: 'Gleba pamięta każde nasienie, które w nią wpadło. Jesteś tym, co karmisz.',
    meaningUpright: 'Przygotowanie\nŻyzność\nCierpliwe podtrzymywanie',
    meaningShadow: 'Jałowość\nZatruty grunt\nZaniedbanie podstaw',
    affirmation: 'Dbam o ziemię, z której wyrastam.',
  },
  {
    slug: 'the-anchor', name: 'The Anchor', phase: 'roots', phaseOrder: 3, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Nie wszystko musi płynąć.',
    description: 'Kotwica nie jest więzieniem. To wybór, gdzie się zatrzymujesz.',
    meaningUpright: 'Zakotwiczenie\nStabilność\nŚwiadome trwanie',
    meaningShadow: 'Bezruch\nStrach przed zmianą\nTrzymanie się czegoś, co minęło',
    affirmation: 'Trwam tam, gdzie wybrałem.',
  },
  {
    slug: 'the-shell', name: 'The Shell', phase: 'roots', phaseOrder: 4, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Ochrona jest formą miłości.',
    description: 'Muszla nie zamknęła się ze strachu. Stworzyła przestrzeń dla perły.',
    meaningUpright: 'Ochrona\nGranice\nBezpieczna przestrzeń wewnętrzna',
    meaningShadow: 'Izolacja\nTwardość\nLęk przed kontaktem',
    affirmation: 'Moje granice są moją mądrością.',
  },
  {
    slug: 'the-core', name: 'The Core', phase: 'roots', phaseOrder: 5, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'To, co w środku, jest prawdziwe.',
    description: 'Centrum nie szuka zatwierdzenia. Płonie bez widowni.',
    meaningUpright: 'Istota\nAutentyczność\nWewnętrzna pewność',
    meaningShadow: 'Zagubienie siebie\nFałszywa tożsamość\nPustka w środku',
    affirmation: 'Jestem tym, czym jestem w środku.',
  },
  {
    slug: 'the-stone', name: 'The Stone', phase: 'roots', phaseOrder: 6, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Twardość może być darem.',
    description: 'Kamień nie przeprasza za swoją solidność. Trwa. Milczy. Jest.',
    meaningUpright: 'Trwałość\nOpór\nNieprzekształcalność',
    meaningShadow: 'Nieugięcie\nZamrożenie\nNiezdolność do zmiany',
    affirmation: 'Jestem mocny. Nie muszę się zmieniać dla nikogo.',
  },
  {
    slug: 'the-branch', name: 'The Branch', phase: 'roots', phaseOrder: 7, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Wzrost nie wymaga zgody.',
    description: 'Gałąź nie pyta, czy ma rosnąć. Wyciąga się ku światłu bez aprobaty.',
    meaningUpright: 'Ekspansja\nSpontaniczny wzrost\nPodążanie za światłem',
    meaningShadow: 'Chaotyczny rozrost\nZatracenie struktury\nRzucanie się bez korzenia',
    affirmation: 'Wyciągam się ku temu, co karmi.',
  },
  {
    slug: 'the-tree', name: 'The Tree', phase: 'roots', phaseOrder: 8, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Korzeń i niebo jednocześnie.',
    description: 'Drzewo nie wybiera – ziemia lub powietrze. Żyje w obu światach.',
    meaningUpright: 'Integracja\nDojrzałość\nRównowaga między ziemią a niebem',
    meaningShadow: 'Rozdarcie\nNiestabilność\nBrak połączenia z korzeniami',
    affirmation: 'Jestem zakorzeniony i wolny jednocześnie.',
  },

  // FLOW
  {
    slug: 'the-stream', name: 'The Stream', phase: 'flow', phaseOrder: 1, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Ciągłość jest formą odwagi.',
    description: 'Strumień nie zatrzymuje się, gdy napotyka kamień. Obchodzi go lub rzeźbi.',
    meaningUpright: 'Ciągłość\nAdaptacja\nDelikatna wytrwałość',
    meaningShadow: 'Niezdolność do zatrzymania się\nUcieczka od głębi\nPowierzchowność',
    affirmation: 'Płynę dalej, bez walki z tym, co jest.',
  },
  {
    slug: 'the-tide', name: 'The Tide', phase: 'flow', phaseOrder: 2, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Rytm przypływu i odpływu jest prawidłem.',
    description: 'Przypływ i odpływ to nie chaos – to oddech oceanu.',
    meaningUpright: 'Rytm\nCykl\nZgoda na przemianę',
    meaningShadow: 'Nieregularność\nLęk przed odpływem\nOpór wobec cyklu',
    affirmation: 'Ufam rytmowi, który mnie niesie.',
  },
  {
    slug: 'the-ebb', name: 'The Ebb', phase: 'flow', phaseOrder: 3, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Odpływ to nie koniec – to odsłonięcie.',
    description: 'Gdy woda się cofa, pokazuje to, co było ukryte. Brzeg.',
    meaningUpright: 'Wyciszenie\nOdkrycie\nNaturalne zakończenie',
    meaningShadow: 'Opuszczenie\nStrach przed utratą\nTęsknota za tym, co minęło',
    affirmation: 'Pozwalam odejść temu, co musi odpłynąć.',
  },
  {
    slug: 'the-drift', name: 'The Drift', phase: 'flow', phaseOrder: 4, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Dryfowanie jest też formą ruchu.',
    description: 'Nie wszystko musi mieć kierunek. Czasem prąd wie lepiej.',
    meaningUpright: 'Poddanie\nZaufanie prądowi\nSpontaniczność',
    meaningShadow: 'Zagubienie\nBrak intencji\nUcieczka od odpowiedzialności',
    affirmation: 'Ufam temu, dokąd mnie niesie.',
  },
  {
    slug: 'the-surge', name: 'The Surge', phase: 'flow', phaseOrder: 5, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Siła przychodzi falami.',
    description: 'Przypływ energii jest darem – użyj go zanim opadnie.',
    meaningUpright: 'Energia\nMoment przełomu\nSkok do przodu',
    meaningShadow: 'Pochopność\nPrzebodźcowanie\nDziałanie bez gruntu',
    affirmation: 'Działam, gdy fala jest ze mną.',
  },
  {
    slug: 'the-whisper', name: 'The Whisper', phase: 'flow', phaseOrder: 6, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Cicho powiedziane – głęboko dosłyszane.',
    description: 'Szept wymaga ciszy. I uwagi. I gotowości.',
    meaningUpright: 'Intuicja\nDelikatny sygnał\nWewnętrzne przesłanie',
    meaningShadow: 'Ignorowanie intuicji\nHałas wewnętrzny\nStracony znak',
    affirmation: 'Słyszę to, co mówi się po cichu.',
  },
  {
    slug: 'the-breaker', name: 'The Breaker', phase: 'flow', phaseOrder: 7, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Rozbicie może być wyzwoleniem.',
    description: 'Fala rozbijająca się o skałę nie przegrywa – zmienia formę.',
    meaningUpright: 'Przełom\nRozpad starej formy\nWyzwolenie przez rozbicie',
    meaningShadow: 'Destrukcja\nNiekontrolowany gniew\nSiła bez mądrości',
    affirmation: 'To, co się rozbija, robi miejsce dla nowego.',
  },

  // VOID
  {
    slug: 'the-shadow', name: 'The Shadow', phase: 'void', phaseOrder: 1, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Cień jest częścią światła.',
    description: 'Cień istnieje tylko dlatego, że gdzieś jest światło. Nie walcz z nim.',
    meaningUpright: 'Integracja cienia\nSamoświadomość\nAkceptacja ciemnej strony',
    meaningShadow: 'Wypieranie\nProjekcja\nStrach przed własną głębią',
    affirmation: 'Mój cień jest moją mapą.',
  },
  {
    slug: 'the-pause', name: 'The Pause', phase: 'void', phaseOrder: 2, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Cisza między nutami tworzy muzykę.',
    description: 'Pauza nie jest błędem. Jest częścią kompozycji.',
    meaningUpright: 'Odpoczynek\nRefleksja\nŚwiadome wstrzymanie',
    meaningShadow: 'Prokrastynacja\nZmrożenie\nLęk przed ruchem',
    affirmation: 'Zatrzymuję się, bo wiem, że to konieczne.',
  },
  {
    slug: 'the-abyss', name: 'The Abyss', phase: 'void', phaseOrder: 3, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Otchłań nie pochłania. Uczy głębokości.',
    description: 'Stanąć na krawędzi i nie upaść – to też rodzaj odwagi.',
    meaningUpright: 'Konfrontacja z nicością\nGłęboka transformacja\nPrzejście przez ciemność',
    meaningShadow: 'Upadek\nDepresja\nUtrata orientacji',
    affirmation: 'Jestem w ciemności, ale nie jestem ciemnością.',
  },
  {
    slug: 'the-fog', name: 'The Fog', phase: 'void', phaseOrder: 4, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Mgła nie zasłania prawdy. Prosi o powolność.',
    description: 'Kiedy nic nie widzisz, idź wolniej. To jest lekcja mgły.',
    meaningUpright: 'Niepewność\nDelikatna nawigacja\nAkceptacja niewidoczności',
    meaningShadow: 'Zagubienie\nParaliż\nLęk przed nieznanym',
    affirmation: 'Idę powoli przez to, czego nie widzę.',
  },
  {
    slug: 'the-silence', name: 'The Silence', phase: 'void', phaseOrder: 5, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Cisza nie jest brakiem. Jest obecnością.',
    description: 'Cisza ma głos. Trzeba umieć jej słuchać.',
    meaningUpright: 'Wewnętrzna cisza\nPrzesłanie bez słów\nGłęboka uważność',
    meaningShadow: 'Izolacja\nStłumienie\nOdcięcie od siebie',
    affirmation: 'W ciszy słyszę to, czego słowa nie osiągają.',
  },
  {
    slug: 'the-stillness', name: 'The Stillness', phase: 'void', phaseOrder: 6, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Bezruch nie jest biernością.',
    description: 'Bezruch to skupiona moc. To wybór, a nie ucieczka.',
    meaningUpright: 'Skupienie\nCentrowanie\nPotencjał w spoczynku',
    meaningShadow: 'Odrętwienie\nOderwanie od życia\nZamknięcie się',
    affirmation: 'Jestem spokojny. To wystarczy.',
  },
  {
    slug: 'the-veil', name: 'The Veil', phase: 'void', phaseOrder: 7, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Zasłona oddziela, ale też chroni.',
    description: 'Nie wszystko musi być widziane od razu. Zasłona ma swoją funkcję.',
    meaningUpright: 'Granica między światami\nMisteria\nDelikatne przejście',
    meaningShadow: 'Ukrywanie prawdy\nSamooszustwo\nStrach przed objawieniem',
    affirmation: 'Pozwalam odsłaniać się powoli temu, co prawdziwe.',
  },

  // LIGHT
  {
    slug: 'the-glow', name: 'The Glow', phase: 'light', phaseOrder: 1, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Łagodne światło nie oślepia.',
    description: 'Poświata nie krzyczy. Cicho wskazuje kierunek.',
    meaningUpright: 'Łagodna nadzieja\nWewnętrzne ciepło\nDelikatny sygnał',
    meaningShadow: 'Zbyt słabe światło\nNiedostrzegany potencjał\nLęk przed błyskiem',
    affirmation: 'Świecę tak, jak potrafię. To wystarczy.',
  },
  {
    slug: 'the-halo', name: 'The Halo', phase: 'light', phaseOrder: 2, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Świętość nie jest wyjątkiem. Jest możliwością.',
    description: 'Halo nie jest nagrodą. To naturalny efekt bycia w pełni sobą.',
    meaningUpright: 'Czystość intencji\nBłogosławieństwo\nŚwietlistość',
    meaningShadow: 'Fałszywa świętość\nPoczucie wyższości\nMaska doskonałości',
    affirmation: 'Moja świętość jest prosta i zwyczajna.',
  },
  {
    slug: 'the-lantern', name: 'The Lantern', phase: 'light', phaseOrder: 3, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Latarnia nie pyta, gdzie zmierzasz.',
    description: 'Latarnia oświetla jeden krok przed Tobą. To wystarczy.',
    meaningUpright: 'Prowadzenie\nJeden krok na raz\nŚwiatło w ciemności',
    meaningShadow: 'Wypalenie\nZgaszenie\nStrach przed ciemnością',
    affirmation: 'Niosę światło dla siebie i tych obok.',
  },
  {
    slug: 'the-sun', name: 'The Sun', phase: 'light', phaseOrder: 4, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Słońce nie pyta, czy zasługujesz.',
    description: 'Słońce wschodzi dla wszystkich. Bez wyjątku. Bez oceny.',
    meaningUpright: 'Radość\nSukces\nPełnia ekspresji',
    meaningShadow: 'Ego\nPrzypiekanie\nZabijanie cieniem własnego światła',
    affirmation: 'Pozwalam sobie być w pełni obecny, jasny, żywy.',
  },
  {
    slug: 'the-star', name: 'The Star', phase: 'light', phaseOrder: 5, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Nadzieja istnieje nawet po najciemniejszej nocy.',
    description: 'Gwiazda nie grzeje – prowadzi. I to wystarczy.',
    meaningUpright: 'Nadzieja\nInspiracja\nDalekosiężna wizja',
    meaningShadow: 'Rozproszenie\nNierealistyczność\nUcieczka w marzenia',
    affirmation: 'Jest nadzieja. Widzę ją nawet teraz.',
  },
  {
    slug: 'the-prism', name: 'The Prism', phase: 'light', phaseOrder: 6, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Jedno światło – wiele prawd.',
    description: 'Pryzmat nie zmienia światła. Ujawnia to, co już w nim było.',
    meaningUpright: 'Perspektywa\nWieloznaczność\nRozbicie na składowe',
    meaningShadow: 'Fragmentacja\nZagubienie w wielości\nNiezdolność do syntezy',
    affirmation: 'Widzę wiele stron i nie muszę wybierać jednej.',
  },
  {
    slug: 'the-beam', name: 'The Beam', phase: 'light', phaseOrder: 7, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Skupione światło trafia głębiej.',
    description: 'Wiązka jest kierunkowym darem. Wie, dokąd zmierza.',
    meaningUpright: 'Skupienie\nIntencja\nPrzebicie się przez mgłę',
    meaningShadow: 'Zawężenie\nBrak peryferyjnego widzenia\nUpartość',
    affirmation: 'Skupiam się na tym, co ważne. Reszta opada.',
  },

  // ARCHETYPES
  {
    slug: 'the-initiate', name: 'The Initiate', phase: 'archetypes', phaseOrder: 1, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Każde wtajemniczenie zaczyna się od nie-wiedzy.',
    description: 'Inicjowany nie zna drogi. To jest właśnie warunek przejścia.',
    meaningUpright: 'Nowy początek\nOtwartość na naukę\nPokora nowicjusza',
    meaningShadow: 'Strach przed pierwszym krokiem\nFałszywa gotowość\nOdkładanie inicjacji',
    affirmation: 'Jestem gotowy, nawet gdy nie wiem jak.',
  },
  {
    slug: 'the-path', name: 'The Path', phase: 'archetypes', phaseOrder: 2, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Nie miejsce, ale sposób bycia.',
    description: 'Ścieżka to więcej niż trasa – to relacja z ruchem. Podróż to sposób myślenia.',
    meaningUpright: 'Proces\nOtwartość\nIntuicyjna nawigacja',
    meaningShadow: 'Zagubienie\nPorównywanie dróg\nOdcięcie od celu',
    affirmation: 'Idę, bo jestem.',
  },
  {
    slug: 'the-crossing', name: 'The Crossing', phase: 'archetypes', phaseOrder: 3, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Przejście nie jest końcem. Jest bramą.',
    description: 'Skrzyżowanie to moment wyboru. Stoisz tu tylko raz w tym samym miejscu.',
    meaningUpright: 'Moment decyzji\nPrzejście przez próg\nPunkt bez powrotu',
    meaningShadow: 'Niezdecydowanie\nStrach przed przejściem\nChęć powrotu',
    affirmation: 'Przekraczam próg. Po drugiej stronie jest moje życie.',
  },
  {
    slug: 'the-sanctuary', name: 'The Sanctuary', phase: 'archetypes', phaseOrder: 4, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Każdy potrzebuje miejsca, które jest tylko jego.',
    description: 'Sanktuarium to nie ucieczka. To miejsce, z którego można działać.',
    meaningUpright: 'Ochrona\nBezpieczeństwo\nŚwięta przestrzeń',
    meaningShadow: 'Izolacja\nUcieczka od świata\nNiezdolność do wyjścia',
    affirmation: 'Mam miejsce, które jest moje. Mogę do niego wrócić.',
  },
  {
    slug: 'the-echo', name: 'The Echo', phase: 'archetypes', phaseOrder: 5, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'To, co wysyłasz, wraca inaczej.',
    description: 'Echo to odpowiedź świata na Twój głos. Nie taka sama – ale spokrewniona.',
    meaningUpright: 'Zrozumienie wpływu\nDuchowa komunikacja\nZnak od eteru',
    meaningShadow: 'Brak słuchania\nLęk przed odpowiedzią\nPowtórzenie błędów',
    affirmation: 'To, co słyszę, jest odpowiedzią na moje wołanie.',
  },
  {
    slug: 'the-pulse', name: 'The Pulse', phase: 'archetypes', phaseOrder: 6, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Rytm to obecność serca.',
    description: 'Puls to nie tylko tętno – to duchowy beat. Synchronizacja z Życiem.',
    meaningUpright: 'Życiowa energia\nSynchronizacja\nOdczuwanie rytmu',
    meaningShadow: 'Przebodźcowanie\nNierówność rytmu\nUtrata kontaktu z ciałem',
    affirmation: 'Biję w rytmie Życia.',
  },
  {
    slug: 'the-flame', name: 'The Flame', phase: 'archetypes', phaseOrder: 7, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Ogień nie pyta o pozwolenie.',
    description: 'Płomień przemienia wszystko, czego dotknie. I siebie też.',
    meaningUpright: 'Pasja\nTransformacja\nŻywa energia twórcza',
    meaningShadow: 'Destrukcja\nWypalenie\nKonsumowanie innych',
    affirmation: 'Płonę tym, co prawdziwe.',
  },
  {
    slug: 'the-watcher', name: 'The Watcher', phase: 'archetypes', phaseOrder: 8, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Widzę. Nie oceniam.',
    description: 'Świadek nie interweniuje – czuwa. Widzenie bez osądu to akt miłości.',
    meaningUpright: 'Głębokie zrozumienie\nSpokój\nObecność',
    meaningShadow: 'Bierność\nUkryta osądzająca postawa\nLęk przed zaangażowaniem',
    affirmation: 'Patrzę sercem. Nic nie muszę robić.',
  },
  {
    slug: 'the-wave', name: 'The Wave', phase: 'archetypes', phaseOrder: 9, arcanaType: 'minor', suit: null, cardNumber: null,
    tagline: 'Poddaj się. Jesteś falą, nie barierą.',
    description: 'Nie zatrzymuj – przepuść. Fala to ruch przez Ciebie, nie z Ciebie.',
    meaningUpright: 'Zgoda\nPrzepływ emocji\nZaufanie',
    meaningShadow: 'Opór\nKontrola\nTłumienie',
    affirmation: 'Pozwalam, by fala przeszła.',
  },
  {
    slug: 'the-weaver', name: 'The Weaver', phase: 'archetypes', phaseOrder: 10, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Każda nić ma swoje miejsce w tkaninie.',
    description: 'Tkacz nie ocenia wątku – łączy go z innymi. Widzi wzór, nie chaos.',
    meaningUpright: 'Integracja\nTworzenie połączeń\nWizja całości',
    meaningShadow: 'Wikłanie\nSkomplikowanie\nManipulacja',
    affirmation: 'Widzę wzór w tym, co wydaje się nieuporządkowane.',
  },
  {
    slug: 'the-witness', name: 'The Witness', phase: 'archetypes', phaseOrder: 11, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Bycie widzianym jest darem.',
    description: 'Świadek widzi Cię takim, jakim jesteś. Bez filtrów. Bez oceny.',
    meaningUpright: 'Bycie widzianym\nUznanie\nObecność drugiego',
    meaningShadow: 'Niewidzialność\nBrak świadka\nSamotność w doświadczeniu',
    affirmation: 'Jestem widziany. Moje istnienie jest ważne.',
  },
  {
    slug: 'the-mirror', name: 'The Mirror', phase: 'archetypes', phaseOrder: 12, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Lustro pokazuje to, co jest. Nie to, co chcesz widzieć.',
    description: 'Lustro jest uczciwym przyjacielem. Bez komentarza.',
    meaningUpright: 'Samopoznanie\nOdbicie\nKonfrontacja z prawdą',
    meaningShadow: 'Zniekształcenie\nSamooszustwo\nStrach przed lustrem',
    affirmation: 'Patrzę na siebie z miłością i bez iluzji.',
  },
  {
    slug: 'the-return', name: 'The Return', phase: 'archetypes', phaseOrder: 13, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Każdy powrót to nowe narodziny.',
    description: 'Powrót nie jest cofnięciem – to odrodzenie z pamięcią. Gdy wracasz, jesteś kimś innym.',
    meaningUpright: 'Reintegracja\nOdkrycie wartości przeszłości\nZgoda na własną drogę',
    meaningShadow: 'Uwięzienie w nostalgii\nZaprzeczanie zmianie\nPustka po drodze',
    affirmation: 'Wróciłem, by pamiętać, kim się stałem.',
  },
  {
    slug: 'the-bridge', name: 'The Bridge', phase: 'archetypes', phaseOrder: 14, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Most istnieje po to, by go przejść.',
    description: 'Most łączy dwa brzegi, nie należąc do żadnego. Jest przestrzenią przejścia.',
    meaningUpright: 'Połączenie\nPrzejście\nMediacja',
    meaningShadow: 'Wieczne bycie w połowie drogi\nNiezdolność do lądowania\nStrach przed jednym brzegiem',
    affirmation: 'Łączę to, co było oddzielone.',
  },
  {
    slug: 'the-messenger', name: 'The Messenger', phase: 'archetypes', phaseOrder: 15, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Wiadomość jest ważniejsza od posłańca.',
    description: 'Posłaniec nie zatrzymuje przekazu dla siebie. Niesie go dalej.',
    meaningUpright: 'Komunikacja\nPrzepływ informacji\nŁaska przekazywana dalej',
    meaningShadow: 'Zniekształcenie przekazu\nSelf-promotion\nEgo posłańca',
    affirmation: 'Przekazuję to, co zostało mi dane. Wiernie.',
  },
  {
    slug: 'the-guardian', name: 'The Guardian', phase: 'archetypes', phaseOrder: 16, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Strażnik nie walczy. Stoi.',
    description: 'Obecność strażnika sama w sobie chroni. Nie potrzeba miecza.',
    meaningUpright: 'Ochrona\nBezpieczeństwo\nObecność opiekuńcza',
    meaningShadow: 'Nadmierna kontrola\nStrach przed zagrożeniem\nIzolacja',
    affirmation: 'Chronię to, co ważne. I wiem, co jest ważne.',
  },
  {
    slug: 'the-lightkeeper', name: 'The Lightkeeper', phase: 'archetypes', phaseOrder: 17, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Światło się nie trzyma. Światło się niesie.',
    description: 'Strażnik Światła nie gasi go dla siebie – ale po to, by ktoś inny mógł znaleźć drogę.',
    meaningUpright: 'Przewodnictwo\nPokora\nNiosąca obecność',
    meaningShadow: 'Poczucie wyższości\nWypalenie\nChęć kontroli',
    affirmation: 'Nie jestem światłem – ale je niosę.',
  },
  {
    slug: 'the-spiral', name: 'The Spiral', phase: 'archetypes', phaseOrder: 18, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Nie ma powrotu – jest tylko coraz głębiej.',
    description: 'Symbol ciągłej ewolucji – ścieżki, która nigdy się nie kończy, lecz wciąż się pogłębia.',
    meaningUpright: 'Rozwój duszy\nIntegracja doświadczeń\nRuch ku centrum',
    meaningShadow: 'Błądzenie w powtórkach\nLęk przed zmianą\nUcieczka od głębi',
    affirmation: 'Kręcę się, ale nie błądzę. Wracam – głębiej.',
  },
  {
    slug: 'the-teardrop', name: 'The Teardrop', phase: 'archetypes', phaseOrder: 20, arcanaType: 'special', suit: null, cardNumber: null,
    tagline: 'Łza jest kompresją całego życia.',
    description: 'Teardrop zawiera wszystko – ból, miłość, oczyszczenie. Jest końcem i początkiem.',
    meaningUpright: 'Oczyszczenie\nKompletność\nEmocjonalne wypełnienie',
    meaningShadow: 'Zablokowane emocje\nNieuleczony ból\nNiezdolność do płaczu',
    affirmation: 'Pozwalam sobie czuć. Każda łza jest prawdziwa.',
  },
  {
    slug: 'the-teardrop-bearer', name: 'The Teardrop Bearer', phase: 'archetypes', phaseOrder: 21, arcanaType: 'special', suit: null, cardNumber: null,
    tagline: 'Niosący łzę nie jest słaby. Jest odważny.',
    description: 'Nosiciel Teardropa niesie cudzy ból bez zatracenia siebie.',
    meaningUpright: 'Empatia\nNiesienie ciężaru\nDar współodczuwania',
    meaningShadow: 'Zatracenie\nAbsorpcja cudzego bólu\nBrak własnych granic',
    affirmation: 'Czuję cudzy ból i pozostaję sobą.',
  },
  {
    slug: 'the-vessel', name: 'The Vessel', phase: 'archetypes', phaseOrder: 22, arcanaType: 'major', suit: null, cardNumber: null,
    tagline: 'Ta karta odsłania wewnętrzne napięcie między ciszą a słuchaniem.',
    description: 'Ta karta odsłania wewnętrzne napięcie między ciszą a słuchaniem. To wezwanie do odczytania własnego wnętrza, ale też zaproszenie do zatrzymania.',
    meaningUpright: 'Wewnętrzne prowadzenie\nPrzebudzenie intencji\nPrzestrzeń prawdy',
    meaningShadow: 'Zatrzymanie w iluzji\nRozproszenie światła\nLęk przed zobaczeniem',
    affirmation: 'Nawet gdy wątpię, pozostaję wierny prawdzie.',
  },
]

const NOTE_TEARDROP_PLAYLIST: Record<string, string[]> = {
  C:   ['the-vessel', 'the-seed', 'the-core', 'the-anchor', 'the-path'],
  'C#': ['the-crossing', 'the-echo', 'the-whisper', 'the-veil', 'the-return'],
  D:   ['the-path', 'the-seed', 'the-stream', 'the-pulse', 'the-bridge'],
  'D#': ['the-vessel', 'the-silence', 'the-abyss', 'the-shadow', 'the-return'],
  E:   ['the-flame', 'the-lightkeeper', 'the-glow', 'the-beam', 'the-sun'],
  F:   ['the-guardian', 'the-anchor', 'the-soil', 'the-lantern', 'the-sanctuary'],
  'F#': ['the-mirror', 'the-watcher', 'the-prism', 'the-echo', 'the-spiral'],
  G:   ['the-wave', 'the-stream', 'the-tide', 'the-drift', 'the-surge'],
  'G#': ['the-flame', 'the-breaker', 'the-shadow', 'the-pulse', 'the-spiral'],
  A:   ['the-beam', 'the-star', 'the-sun', 'the-path', 'the-lightkeeper'],
  'A#': ['the-drift', 'the-whisper', 'the-silence', 'the-fog', 'the-vessel'],
  B:   ['the-veil', 'the-pause', 'the-abyss', 'the-return', 'the-teardrop-bearer'],
}

function buildFragments(note: NoteEntry): string[] {
  return getLoreFragmentsForNote(note.id)
}

async function main() {
  await prisma.$executeRawUnsafe(`
    DELETE FROM "Note" a
    USING "Note" b
    WHERE a.ctid < b.ctid AND a."id" = b."id"
  `)
  await prisma.$executeRawUnsafe(`
    DELETE FROM "Note" a
    USING "Note" b
    WHERE a.ctid < b.ctid AND a."urlKey" = b."urlKey"
  `)
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      BEGIN
        ALTER TABLE "Note" ADD CONSTRAINT "Note_pkey" PRIMARY KEY ("id");
      EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN SQLSTATE '42P16' THEN NULL;
      END;
    END
    $$;
  `)
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      BEGIN
        ALTER TABLE "Note" ADD CONSTRAINT "Note_urlKey_key" UNIQUE ("urlKey");
      EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN SQLSTATE '42P07' THEN NULL;
      END;
    END
    $$;
  `)

  for (const emotion of EMOTIONS) {
    await prisma.$executeRaw`
      INSERT INTO "Emotion" ("id", "namePl", "nameEn", "descriptionPl", "descriptionEn")
      VALUES (
        ${emotion.id},
        ${emotion.namePl},
        ${emotion.nameEn ?? null},
        ${emotion.descriptionPl},
        ${emotion.descriptionEn ?? null}
      )
      ON CONFLICT ("id") DO UPDATE
      SET
        "namePl" = EXCLUDED."namePl",
        "nameEn" = EXCLUDED."nameEn",
        "descriptionPl" = EXCLUDED."descriptionPl",
        "descriptionEn" = EXCLUDED."descriptionEn"
    `
  }

  const deck = await prisma.teardropDeck.upsert({
    where: { slug: 'teardrop-oracle-deck-v0' },
    create: {
      slug: 'teardrop-oracle-deck-v0',
      name: 'Teardrop Oracle Deck',
      version: 'v0',
      source: 'inline',
    },
    update: {
      name: 'Teardrop Oracle Deck',
      version: 'v0',
      source: 'inline',
    },
  })

  console.log(`[seed] deck: ${deck.id}`)

  const teardropCardIdBySlug = new Map<string, string>()

  for (const card of TEARDROP_CARDS) {
    const upserted = await prisma.teardropCard.upsert({
      where: { deckId_slug: { deckId: deck.id, slug: card.slug } },
      create: {
        deckId: deck.id,
        slug: card.slug, 
        name: card.name,
        phase: card.phase,
        phaseOrder: card.phaseOrder,
        arcanaType: card.arcanaType,
        suit: card.suit,
        cardNumber: card.cardNumber,
        sourcePath: 'inline',
        isTemplate: false,
      },
      update: {
        name: card.name,
        phase: card.phase,
        phaseOrder: card.phaseOrder,
        arcanaType: card.arcanaType,
        suit: card.suit,
        cardNumber: card.cardNumber,
        sourcePath: 'inline',
        isTemplate: false,
      },
    })
    teardropCardIdBySlug.set(card.slug, upserted.id)

    const plFields = [
      ['tagline', card.tagline],
      ['description', card.description],
      ['meaning_upright', card.meaningUpright],
      ['meaning_shadow', card.meaningShadow],
      ['affirmation', card.affirmation],
    ] as const

    for (const [field, content] of plFields) {
      if (!content) continue
      await prisma.teardropCardText.upsert({
        where: { cardId_locale_field: { cardId: upserted.id, locale: 'pl', field } },
        create: { cardId: upserted.id, locale: 'pl', field, content },
        update: { content },
      })
    }

    console.log(`  [card] ${card.slug} (affirmation: ${card.affirmation ? 'yes' : 'NO'})`)
  }

  let order = 0
  for (const n of NOTE_LIST) {
    const fragments = buildFragments(n)
    const noteData = {
      id: n.id,
      short: n.short,
      name: n.name,
      frequency: n.frequency,
      urlKey: n.urlKey,
      locked: n.locked,
      healing: n.healing,
      chromaHex: n.chromaHex,
      synestheticTitlePl: n.synestheticTitlePl,
      synestheticLinePl: n.synestheticLinePl,
      element: n.element,
      sortOrder: order,
      emotionId: n.emotionId,
      healingStyle: n.healingStyle,
    }
    await prisma.note.upsert({
      where: { id: n.id },
      create: noteData as any,
      update: noteData as any,
    })

    await prisma.$executeRaw`DELETE FROM "LoreFragment" WHERE "noteId" = ${n.id}`
    for (let i = 0; i < fragments.length; i++) {
      await prisma.$executeRaw`
        INSERT INTO "LoreFragment" ("id", "noteId", "orderIndex", "body")
        VALUES (gen_random_uuid()::text, ${n.id}, ${i}, ${fragments[i]!})
      `
    }

    await prisma.$executeRaw`DELETE FROM "NoteCaption" WHERE "noteId" = ${n.id}`
    for (let i = 0; i < n.captions.length; i++) {
      await prisma.$executeRaw`
        INSERT INTO "NoteCaption" ("id", "noteId", "locale", "orderIndex", "body")
        VALUES (gen_random_uuid()::text, ${n.id}, 'en', ${i}, ${n.captions[i]!})
      `
    }

    order += 1
  }

  await prisma.noteTeardropCard.deleteMany({})
  let linked = 0
  for (const noteId of Object.keys(NOTE_TEARDROP_PLAYLIST)) {
    const playlist = NOTE_TEARDROP_PLAYLIST[noteId] ?? []
    for (let i = 0; i < playlist.length; i++) {
      const slug = playlist[i]!
      const cardId = teardropCardIdBySlug.get(slug)
      if (!cardId) {
        console.warn(`  [warn] card not found for slug: ${slug} (note: ${noteId})`)
        continue
      }
      await prisma.noteTeardropCard.create({
        data: { noteId, cardId, sortOrder: i },
      })
      linked++
    }
  }

  console.log(`[seed] done — ${TEARDROP_CARDS.length} cards, ${linked} note-card links`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })

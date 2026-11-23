(function technique(root) {
  'use strict';

  // Each entry describes one complete repetition on the specified equipment.
  // The selected examples include both external setup and how to return the load.
  const guides = {
    'chest-press': [
      'Ustaw siedzisko tak, by uchwyty znalazły się na wysokości środka klatki. Oprzyj plecy i postaw obie stopy na podłodze.',
      'Wypchnij uchwyty przed siebie. Nadgarstki prowadź w przedłużeniu przedramion, a barki pozostaw przy oparciu.',
      'Powoli zegnij łokcie, aż uchwyty wrócą obok klatki. Zatrzymaj je na tyle wcześnie, by barki zachowały wygodne ustawienie.',
      'Dostosuj położenie startowe uchwytów, jeśli maszyna wypycha łokcie głęboko za tułów.'
    ],
    'bench-press': [
      'Połóż się na płaskiej ławce z oczami pod gryfem. Oprzyj głowę, łopatki, pośladki i obie stopy. Ustaw asekurację i obejmij gryf kciukami.',
      'Zdejmij sztangę ze stojaków nad barki. Zegnij łokcie i opuść gryf ku środkowej lub dolnej części klatki. W dolnej pozycji nadgarstki powinny znajdować się nad łokciami.',
      'Wypchnij sztangę w górę i lekko w kierunku stojaków. Po ostatnim powtórzeniu oprzyj gryf na obu hakach.',
      'Utrzymuj stopy nieruchomo, a pośladki w kontakcie z ławką przez całą serię.'
    ],
    'dumbbell-press': [
      'Usiądź na końcu płaskiej ławki, oprzyj hantle o uda i pomóż sobie kolanami, żeby ustawić je przy klatce podczas kładzenia się. Oprzyj stopy o podłogę.',
      'Wyciśnij obie hantle nad klatkę. Prowadź każdą nad odpowiadającym jej łokciem, utrzymując nadgarstki prosto.',
      'Opuść hantle po bokach klatki do zakresu, który kontrolujesz obydwiema rękami.',
      'Pozwól dłoniom lekko zbliżyć się u góry, zachowując odstęp między hantlami.'
    ],
    'push-up': [
      'Oprzyj dłonie nieco szerzej niż barki. Wyprostuj nogi, oprzyj palce stóp i napnij brzuch oraz pośladki.',
      'Zegnij łokcie ukośnie w tył. Opuść klatkę między dłonie, prowadząc głowę, biodra i pięty w jednej linii.',
      'Odepchnij podłogę do wyprostu ramion. Klatka i biodra powinny unosić się razem.',
      'Jeśli trudno zachować linię tułowia, ustaw dłonie na stabilnym podwyższeniu.'
    ],
    'pec-deck': [
      'Usiądź przy oparciu i ustaw siedzisko tak, żeby dłonie na uchwytach były na wysokości klatki. Rozstaw uchwyty do wygodnej pozycji początkowej.',
      'Przy lekko zgiętych łokciach prowadź uchwyty po łuku przed klatkę, jak przy obejmowaniu szerokiego przedmiotu.',
      'Rozsuń ramiona powoli, utrzymując plecy na oparciu i kontrolując rozciągnięcie klatki.',
      'Utrzymaj podobny kąt łokci podczas całego łuku.'
    ],
    'cable-fly': [
      'Ustaw oba wyciągi mniej więcej na wysokości klatki. Chwyć rączki, stań w wykroku przed bramą i lekko ugnij łokcie.',
      'Zbliż dłonie po szerokich łukach przed mostkiem. Utrzymuj tułów w tym samym pochyleniu.',
      'Otwórz ramiona do momentu, w którym czujesz napięcie klatki i wciąż kontrolujesz pozycję barków.',
      'Na końcu powtórzenia obie linki powinny wciąż pozostawać napięte.'
    ],
    'dumbbell-fly': [
      'Połóż się na płaskiej ławce, oprzyj stopy i ustaw hantle nad klatką. Zwróć dłonie ku sobie, łokcie lekko ugnij.',
      'Rozprowadź hantle na boki szerokim łukiem. Zejdź tylko tak nisko, jak potrafisz zachować stabilne barki i kontrolę nad ciężarem.',
      'Zbliż ramiona po tym samym łuku, aż hantle wrócą nad klatkę.',
      'Utrzymuj prawie stały kąt w łokciach, zwłaszcza blisko dołu ruchu.'
    ],
    'lat-pulldown': [
      'Chwyć drążek nachwytem nieco szerzej niż barki. Usiądź, oprzyj stopy i dopasuj wałek do ud.',
      'Lekko odchyl tułów i utrzymaj to ustawienie. Prowadź łokcie w dół po bokach ciała, sprowadzając drążek przed twarz w kierunku górnej klatki.',
      'Płynnie wyprostuj ręce nad sobą. Pozwól łopatkom unieść się wraz z ramionami.',
      'Dobierz obciążenie, przy którym tułów pozostaje spokojny na początku ściągania.'
    ],
    'pulldown-machine': [
      'Dopasuj siedzisko i podporę ud, żeby móc dosięgnąć obu górnych uchwytów. Usiądź symetrycznie, stopy oprzyj płasko.',
      'Pociągnij dźwignie maszyny w dół, prowadząc łokcie w stronę boków tułowia. Gdy ramiona pracują niezależnie, utrzymuj takie samo tempo obu stron.',
      'Kontroluj unoszenie dźwigni, aż ramiona znajdą się znowu nad głową.',
      'Trzymaj biodra na siedzisku także blisko końca ruchu powrotnego.'
    ],
    'pull-up': [
      'Sięgnij do drążka z podestu, chwyć go nachwytem nieco szerzej niż barki. Zawiśnij z wyprostowanymi ramionami i uspokój nogi.',
      'Pociągnij łokcie w dół w stronę żeber. Unieś ciało tak wysoko, jak możesz z głową w przedłużeniu tułowia.',
      'Opuść się powoli do kontrolowanego zwisu i pozwól wyprostować się łokciom.',
      'Rozpoczynaj kolejne powtórzenie po zatrzymaniu kołysania.'
    ],
    'seated-row': [
      'Usiądź przed dolnym wyciągiem. Oprzyj stopy o podpory, lekko zegnij kolana i chwyć rączkę wyprostowanymi ramionami.',
      'Przyciągnij uchwyt do dolnych żeber lub górnej części brzucha. Prowadź łokcie w tył blisko tułowia.',
      'Wyprostuj ręce i pozwól łopatkom wysunąć się nieco do przodu, utrzymując stabilne lędźwie.',
      'Wybierz odległość od wyciągu, przy której stos pozostaje uniesiony przy pełnym sięgnięciu.'
    ],
    'machine-row': [
      'Ustaw siedzisko i podpórkę na klatkę tak, aby sięgnąć do uchwytów z prawie prostymi ramionami. Oprzyj mostek o poduszkę.',
      'Przyciągnij uchwyty ku żebrom, prowadząc łokcie zgodnie z torem dźwigni. Klatka pozostaje na podporze.',
      'Powoli wypuść uchwyty przed siebie. Pozwól ramionom i łopatkom się wysunąć.',
      'Ustawienie podpórki powinno umożliwiać cały ruch bez odrywania klatki.'
    ],
    'dumbbell-row': [
      'Oprzyj dłoń i kolano tej samej strony o ławkę. Drugą stopę postaw na podłodze, pochyl tułów, a hantel trzymaj pod barkiem wolnej ręki.',
      'Pociągnij łokieć w kierunku biodra, prowadząc hantel blisko dolnych żeber. Biodra i klatka pozostają skierowane ku podłodze.',
      'Opuść hantel do wyprostu ramienia. Po serii zamień stronę podparcia.',
      'Zatrzymaj przyciąganie, zanim tułów zacznie skręcać się za ciężarem.'
    ],
    'barbell-row': [
      'Chwyć sztangę nachwytem. Lekko ugnij kolana, cofnij biodra i pochyl tułów, aż gryf będzie wisiał pod barkami. Napnij brzuch.',
      'Przyciągnij gryf blisko ciała do dolnych żeber lub górnej części brzucha. Kąt pochylenia tułowia pozostaje stały.',
      'Opuść gryf do wyprostowanych ramion i ustabilizuj go przed kolejnym przyciągnięciem.',
      'Jeżeli musisz prostować biodra przy każdym powtórzeniu, zmniejsz ciężar.'
    ],
    'shoulder-press': [
      'Dopasuj siedzisko, by uchwyty maszyny zaczynały w pobliżu wysokości barków. Oprzyj plecy, a stopy postaw płasko.',
      'Wypchnij uchwyty po torze dźwigni nad głowę. Trzymaj nadgarstki w linii z przedramionami.',
      'Powoli zegnij łokcie i wróć do wygodnego poziomu początkowego.',
      'Przez cały ruch utrzymuj żebra nad miednicą i plecy przy oparciu.'
    ],
    'dumbbell-shoulder-press': [
      'Usiądź przy prawie pionowym oparciu. Ustaw hantle po obu stronach barków i wysuń łokcie odrobinę przed linię tułowia.',
      'Wyciśnij hantle nad głowę. Prowadź je niezależnie nad łokciami, tak by obie strony poruszały się równo.',
      'Opuść hantle z powrotem w okolice barków, zachowując kontrolę przy zmianie kierunku.',
      'Stopy oprzyj mocno o podłogę, aby miednica pozostała stabilna na ławce.'
    ],
    'overhead-press': [
      'Stań ze sztangą przy górnej klatce, dłońmi nieco szerzej niż barki i łokciami lekko przed gryfem. Napnij brzuch i pośladki.',
      'Cofnij brodę na tyle, by gryf minął twarz. Wyciśnij go nad głowę i ustaw nad środkiem stóp.',
      'Kontrolując tor gryfu, cofnij głowę i opuść sztangę na przód barków.',
      'W wersji stojącej ze ścisłym wyciskaniem kolana utrzymują ten sam kąt.'
    ],
    'lateral-raise': [
      'Stań z hantlami po bokach ud. Lekko ugnij łokcie i ustaw dłonie nieco przed linią bioder.',
      'Unieś ramiona na boki i lekko do przodu, do komfortowej wysokości w okolicy barków. Prowadź łokcie i dłonie razem.',
      'Opuść hantle tą samą drogą, kontrolując szczególnie końcowy odcinek.',
      'Utrzymuj nadgarstki neutralnie i spokojne kolana, by ciężar nie nabierał rozpędu od nóg.'
    ],
    'cable-lateral-raise': [
      'Stań bokiem do dolnego wyciągu. Dalszą ręką chwyć rączkę przed biodrami i odsuń się do lekkiego napięcia linki.',
      'Z lekko ugiętym łokciem unieś ramię na bok i odrobinę do przodu. Zatrzymaj dłoń w okolicy wysokości barku.',
      'Opuść rączkę spokojnie w stronę przeciwnego biodra. Po serii odwróć się drugim bokiem.',
      'Ustaw się tak, by linka przechodziła swobodnie przed udami.'
    ],
    'machine-lateral-raise': [
      'Ustaw wysokość siedziska zgodnie z oznaczeniami maszyny. Oprzyj zewnętrzne strony ramion przy łokciach o poduszki i złap uchwyty.',
      'Rozsuń ramiona, unosząc poduszki na boki. Zakończ na kontrolowanej wysokości zbliżonej do linii barków.',
      'Powoli opuść poduszki do boków tułowia, zachowując kontakt z nimi.',
      'Dociskaj podpory ramionami i utrzymuj tułów nieruchomo na siedzisku.'
    ],
    'rear-delt-fly': [
      'Usiądź twarzą do oparcia maszyny i oprzyj klatkę o poduszkę. Ustaw przednie uchwyty mniej więcej na wysokości barków.',
      'Lekko zegnij łokcie. Rozprowadź ramiona na boki i w tył po łuku do okolic linii barków.',
      'Spokojnie przywróć uchwyty przed klatkę, zachowując ten sam kąt w łokciach.',
      'Pozwól łopatkom pracować wraz z ramionami, a klatkę przez cały czas oprzyj na poduszce.'
    ],
    'reverse-cable-fly': [
      'Stań pośrodku bramy z wyciągami na wysokości barków. Lewą dłonią chwyć prawą linkę, prawą dłonią lewą. Zacznij z rękami przed sobą.',
      'Prowadź dłonie szeroko na zewnątrz, lekko uginając łokcie. Ramiona rozchodzą się w kierunku litery T.',
      'Zbliż ręce przed klatką, pozwalając linkom ponownie się skrzyżować.',
      'Przez cały ruch zachowaj miejsce między szyją a barkami.'
    ],
    'dumbbell-curl': [
      'Stań z hantlami przy udach i łokciami blisko boków. Zacznij z dłońmi skierowanymi do przodu lub w stronę ud.',
      'Zegnij łokcie i unieś hantle ku barkom. Jeśli zaczynasz chwytem neutralnym, w trakcie unoszenia płynnie obróć dłonie ku górze.',
      'Opuść hantle do prawie prostych ramion i wróć do początkowego ustawienia dłoni.',
      'Pozostaw ramiona przy tułowiu, żeby ruch odbywał się głównie w łokciach.'
    ],
    'cable-curl': [
      'Przypnij krótki drążek do dolnego wyciągu. Stań przodem do stosu, chwyć go podchwytem i odsuń się do lekkiego napięcia linki.',
      'Ugnij łokcie, kierując drążek ku przodowi barków. Trzymaj nadgarstki w jednej linii z przedramionami.',
      'Powoli wyprostuj łokcie tak, aby linka wciąż stawiała opór.',
      'Zachowaj tę samą odległość tułowia od wyciągu przez całe powtórzenie.'
    ],
    'preacher-curl': [
      'Usiądź przy modlitewniku maszyny. Dopasuj wysokość tak, aby całe ramiona oparły się na poduszce, a łokcie znalazły się przy osi obrotu dźwigni.',
      'Chwyć uchwyty podchwytem i ugnij łokcie. Prowadź dłonie ku barkom, utrzymując ramiona oparte na poduszce.',
      'Powoli opuść dźwignię do wygodnego wyprostu i łagodnie zmień kierunek.',
      'W dolnym położeniu zachowaj napięcie, żeby ciężar nie szarpnął za łokcie.'
    ],
    'barbell-curl': [
      'Stań ze sztangą trzymaną podchwytem mniej więcej na szerokość barków. Trzymaj gryf przed udami, a łokcie ustaw po bokach ciała.',
      'Zegnij oba łokcie jednocześnie i unieś gryf w stronę barków. Zachowaj stabilne nadgarstki.',
      'Opuść sztangę do wyprostu ramion i wyhamuj ją przed udami.',
      'Biodra i tułów utrzymuj w tej samej pozycji na początku i na końcu unoszenia.'
    ],
    'triceps-pushdown': [
      'Przymocuj drążek lub linę do górnego wyciągu. Stań przodem, przyciągnij łokcie do boków i zacznij ze zgiętymi ramionami.',
      'Wyprostuj łokcie, prowadząc uchwyt w stronę ud. Przy linie możesz pozwolić dłoniom lekko się rozsunąć na dole.',
      'Zegnij łokcie, pozwalając uchwytowi unieść się pod kontrolą. Ramiona pozostają przy tułowiu.',
      'Ustaw się na tyle daleko, by linka mogła swobodnie przejść przed klatką.'
    ],
    'overhead-extension': [
      'Chwyć stabilnie jeden hantel oburącz i ustaw go nad głową. Skieruj łokcie w górę, napnij brzuch i utrzymaj żebra nad miednicą.',
      'Zegnij łokcie, opuszczając hantel za głowę w wygodnym zakresie. Ramiona pozostają skierowane ku górze.',
      'Wyprostuj łokcie, prowadząc hantel z powrotem nad głowę.',
      'Trzymaj ciężar oburącz również przy kończeniu serii i odstawianiu go.'
    ],
    'triceps-machine': [
      'Usiądź przy maszynie z podparciem ramion. Ustaw siedzisko tak, by łokcie były przy osi dźwigni, i chwyć uchwyty ze zgiętymi łokciami.',
      'Dociskając ramiona do poduszki, wyprostuj łokcie i odsuń uchwyty zgodnie z torem maszyny.',
      'Płynnie zegnij łokcie i sprowadź dłonie z powrotem do pozycji początkowej.',
      'Cały czas opieraj ramiona na poduszce, szczególnie w pierwszych centymetrach ruchu.'
    ],
    'leg-press': [
      'Oprzyj plecy i miednicę o oparcie. Ustaw całe stopy na platformie mniej więcej na szerokość bioder lub barków. Przy suwnicy z blokadą zwolnij ją po przejęciu ciężaru.',
      'Zegnij biodra i kolana, zbliżając platformę. Zejdź do głębokości, przy której pięty oraz miednica zachowują podparcie.',
      'Odepchnij platformę całymi stopami i płynnie wyprostuj nogi. Po serii zabezpiecz wózek zgodnie z oznaczeniami.',
      'Prowadź kolana zgodnie z kierunkiem palców stóp.'
    ],
    'hack-squat': [
      'Oprzyj plecy o skośny wózek i ustaw barki pod poduszkami. Postaw całe stopy na platformie, przejmij ciężar i zwolnij uchwyty blokady.',
      'Uginaj biodra i kolana, prowadząc wózek w dół po szynach. Dobierz głębokość, przy której pięty i miednica nadal mają podparcie.',
      'Wciśnij stopy w platformę i wyprostuj nogi. Przed wyjściem z maszyny ponownie zablokuj wózek.',
      'Ustaw ograniczniki ruchu przed rozpoczęciem serii, jeśli dany model je ma.'
    ],
    squat: [
      'W stojaku z dopasowanymi belkami asekuracyjnymi ułóż gryf na mięśniach górnej części pleców. Obejmij go dłońmi, wyprostuj nogi, cofnij się i ustaw stopy w stabilnym rozstawie.',
      'Napnij brzuch i zegnij równocześnie biodra oraz kolana. Prowadź kolana w kierunku palców, a gryf nad środkową częścią stóp.',
      'Odepchnij podłogę całymi stopami, unosząc biodra i barki razem. Po serii podejdź do stojaków i oprzyj gryf na obu hakach.',
      'Dobierz głębokość, przy której zachowujesz równowagę i kontrolę tułowia.'
    ],
    'goblet-squat': [
      'Stań stabilnie i przytrzymaj jeden hantel pionowo blisko mostka, oburącz pod jego górnym końcem.',
      'Zegnij biodra i kolana, schodząc między uda. Hantel prowadź blisko klatki, a kolana zgodnie z kierunkiem stóp.',
      'Wstań, naciskając podłogę całymi stopami. Zakończ w stabilnej pozycji z hantlem przy mostku.',
      'Utrzymuj łokcie skierowane w dół, by ciężar pozostał blisko tułowia.'
    ],
    'leg-extension': [
      'Dopasuj oparcie, aby oś obrotu maszyny znalazła się na wysokości kolan. Umieść wałek na przedniej części podudzi nad kostkami i oprzyj plecy.',
      'Wyprostuj kolana, unosząc wałek razem z podudziami. Pozostaw uda na siedzisku.',
      'Powoli zegnij kolana, pozwalając wałkowi opaść do pozycji początkowej.',
      'Skoryguj położenie wałka, jeśli naciska na stopy zamiast na podudzia.'
    ],
    'cable-leg-extension': [
      'Ustaw stabilną ławkę przed dolnym wyciągiem. Usiądź tyłem do bloczka z kolanem przy krawędzi i przypnij mankiet nad kostką. Linka biegnie spod ławki za stopę.',
      'Trzymając udo na ławce, wyprostuj jedno kolano i wysuń stopę do przodu przeciwko oporowi linki.',
      'Powoli zegnij kolano, aż podudzie wróci do pozycji startowej. Zmień nogę po zakończeniu serii.',
      'Ustaw ławkę tak, żeby linka miała wolny tor i nie ocierała o jej ramę.'
    ],
    'leg-curl': [
      'Usiądź z plecami przy oparciu. Oś maszyny ustaw przy kolanach, dolny wałek za podudziami nad piętami, a górną poduszkę dopasuj do ud.',
      'Zegnij kolana, ciągnąc pięty w dół i pod siedzisko. Miednicę utrzymuj na miejscu.',
      'Powoli wyprostuj nogi do pozycji początkowej, zachowując kontrolę nad unoszącym się wałkiem.',
      'Poduszka ma przytrzymywać uda podczas uginania, pozostawiając kolanom swobodę.'
    ],
    'lying-leg-curl': [
      'Połóż się przodem na maszynie, ustaw kolana przy osi obrotu, a wałek z tyłu podudzi nad piętami. Chwyć uchwyty.',
      'Zegnij kolana i prowadź pięty w stronę pośladków. Zatrzymaj ruch, zanim biodra zaczną odrywać się od poduszki.',
      'Opuść podudzia powoli, kontrolując wałek aż do prawie prostych nóg.',
      'Zachowaj lekko napięty brzuch, by miednica pozostawała oparta.'
    ],
    'cable-leg-curl': [
      'Zapnij mankiet nad kostką i przypnij go do dolnego wyciągu. Stań przodem do bloczka, oprzyj dłonie o stabilną podporę i lekko ugnij nogę podporową.',
      'Zegnij kolano nogi z mankietem, prowadząc piętę w kierunku pośladka. Udo utrzymuj w sąsiedztwie drugiego uda.',
      'Opuść stopę powoli do pozycji początkowej. Po serii przełóż mankiet na drugą nogę.',
      'Utrzymuj biodra skierowane do przodu, aby opór linki działał głównie na ugięcie kolana.'
    ],
    'romanian-deadlift': [
      'Zacznij stojąc ze sztangą przy udach. Ustaw stopy na szerokość bioder, lekko ugnij kolana, napnij brzuch i chwyć gryf oburącz.',
      'Cofaj biodra, pochylając tułów i prowadząc gryf tuż przy udach, a następnie przy podudziach. Zejdź do wyraźnego rozciągnięcia tyłu ud przy stabilnych plecach.',
      'Wyprostuj biodra i wróć do stania, prowadząc sztangę blisko nóg przez całą drogę.',
      'Głębokość wyznacza zakres ruchu Twoich bioder, więc gryf może zatrzymać się powyżej połowy podudzi.'
    ],
    'dumbbell-rdl': [
      'Stań ze stopami na szerokość bioder. Trzymaj hantle przed udami lub przy ich bokach, lekko ugnij kolana i ustabilizuj tułów.',
      'Przesuwaj biodra w tył, opuszczając obie hantle równolegle blisko nóg. Kontynuuj, dopóki zachowujesz pozycję pleców i czujesz rozciągnięcie tyłu ud.',
      'Naciśnij podłogę stopami i wyprostuj biodra, prowadząc hantle z powrotem do ud.',
      'Obie hantle powinny na dole znajdować się na tej samej wysokości.'
    ],
    'hip-thrust': [
      'Oprzyj górną część pleców o stabilną ławkę, zwykle tuż pod łopatkami. Umieść sztangę z osłoną na zgięciu bioder, przytrzymaj gryf i oprzyj całe stopy.',
      'Unieś biodra, obracając tułów wokół podparcia na ławce. U góry doprowadź uda i tułów do jednej linii przy spokojnym ustawieniu żeber.',
      'Zegnij biodra i opuść sztangę pod kontrolą, zachowując stabilną ławkę i oparcie stóp.',
      'Dobierz odległość stóp tak, by przy wyproście bioder podudzia były zbliżone do pionu.'
    ],
    'glute-drive': [
      'Ułóż górną część pleców na poduszce i całe stopy na platformie. Zapnij pas lub dopasuj dźwignię z poduszką na biodrach zgodnie z oznaczeniami maszyny.',
      'Naciśnij platformę stopami i unieś biodra przeciw oporowi. Zatrzymaj ruch przy wyproście bioder z żebrami nad miednicą.',
      'Powoli zegnij biodra i opuść ramię maszyny. Przed odpięciem pasa lub opuszczeniem stanowiska zabezpiecz dźwignię.',
      'Dopasuj położenie poduszki obciążającej do zgięcia bioder.'
    ],
    'glute-bridge': [
      'Połóż się na plecach na macie. Zegnij kolana, oprzyj całe stopy na szerokość bioder, a ręce połóż wzdłuż ciała.',
      'Naciśnij podłogę stopami i unieś biodra, aż tułów i uda utworzą zbliżoną do prostej linię.',
      'Powoli opuść miednicę na matę, zachowując stopy i górę pleców na podłodze.',
      'Zatrzymaj ruch u góry, kiedy pośladki są napięte, a żebra nadal pozostają nad miednicą.'
    ],
    'calf-raise': [
      'Na maszynie do wspięć ustaw barki pod poduszkami. Oprzyj przodostopie na krawędzi platformy tak, żeby pięty mogły swobodnie się poruszać.',
      'Naciśnij platformę przodostopiem i unieś pięty. Utrzymaj stabilną pozycję kolan i tułowia.',
      'Opuść pięty powoli do komfortowego rozciągnięcia łydek. Zmień kierunek płynnie.',
      'Rozłóż nacisk równomiernie na przodostopiu, aby kostki pozostały stabilne.'
    ],
    'seated-calf': [
      'Usiądź z ugiętymi kolanami. Oprzyj przodostopie na platformie, a poduszki ułóż na udach tuż powyżej kolan. Unieś pięty, aby zwolnić blokadę.',
      'Unieś pięty jak najwyżej w kontrolowanym zakresie. Poduszka unosi się razem z udami.',
      'Opuść pięty poniżej poziomu przodostopia na tyle, na ile swobodnie pozwalają kostki. Po serii oprzyj dźwignię na blokadzie.',
      'Pracuj w stawach skokowych, utrzymując przodostopie w tym samym miejscu.'
    ],
    'dumbbell-calf': [
      'Stań na stabilnym podłożu z hantlami przy bokach. Ustaw stopy równolegle mniej więcej na szerokość bioder. Przy jednym hantlu wolną ręką możesz przytrzymać się podpory.',
      'Przenieś nacisk na przodostopie i unieś pięty, trzymając ciężar blisko ciała.',
      'Opuść pięty powoli do podłoża i zatrzymaj je przed kolejnym wspięciem.',
      'Spójrz przed siebie i zachowaj stałe ugięcie kolan, żeby łatwiej utrzymać równowagę.'
    ],
    'cable-crunch': [
      'Przypnij linę do górnego wyciągu i uklęknij przed nim. Chwyć końce liny przy skroniach, lekko pochyl tułów i ustabilizuj biodra.',
      'Z wydechem zbliż dolne żebra do miednicy, zaokrąglając tułów. Łokcie podążają z klatką w stronę ud.',
      'Powoli wydłuż tułów do pozycji początkowej, zachowując uchwyty przy głowie.',
      'Utrzymuj pośladki na podobnej wysokości i pozwól brzuchowi wykonać spięcie.'
    ],
    'machine-crunch': [
      'Dopasuj siedzisko i podpory według oznaczeń maszyny. Ustaw stopy na podpórkach, oprzyj tułów o poduszkę i chwyć uchwyty.',
      'Z wydechem skieruj żebra ku miednicy. Pozwól dźwigni przesuwać się wraz ze spięciem tułowia.',
      'Wróć powoli do pozycji wyjściowej, kontrolując powrót dźwigni.',
      'Dłonie stabilizują pozycję na uchwytach. Utrzymuj podobne zgięcie łokci podczas całego ruchu.'
    ],
    crunch: [
      'Połóż się na plecach, zegnij kolana i oprzyj stopy o matę. Skrzyżuj ręce na klatce lub oprzyj opuszki palców lekko przy skroniach.',
      'Z wydechem zbliż żebra do miednicy, unosząc głowę i łopatki kilka centymetrów nad matę. Zachowaj przestrzeń między brodą a mostkiem.',
      'Wróć powoli łopatkami i głową na matę. Miednica pozostaje oparta przez całe powtórzenie.',
      'Kieruj wzrok lekko w górę i pozwól szyi podążać za klatką.'
    ]
  };

  const references = [
    [
      'ACE – wyciskanie na maszynie',
      'https://www.acefitness.org/resources/everyone/exercise-library/188/seated-chest-press/'
    ],
    [
      'ACE – rozpiętki z hantlami',
      'https://www.acefitness.org/resources/everyone/exercise-library/21/lying-chest-fly/'
    ],
    [
      'ACE – ściąganie drążka',
      'https://www.acefitness.org/resources/everyone/exercise-library/158/seated-lat-pulldown/'
    ],
    [
      'ACE – wiosłowanie sztangą w opadzie',
      'https://www.acefitness.org/resources/everyone/exercise-library/12/bent-over-row/'
    ],
    [
      'ACE – unoszenie ramion na maszynie',
      'https://www.acefitness.org/resources/everyone/exercise-library/295/lateral-shoulder-raise/'
    ],
    [
      'Fitness Institute – prostowanie ramion na maszynie',
      'https://fitnessinstitute.com.au/triceps-extension-pin-loaded/'
    ],
    [
      'ACE – przysiad ze sztangą',
      'https://www.acefitness.org/resources/everyone/exercise-library/11/back-squat/'
    ],
    [
      'ACE – wypychanie na suwnicy',
      'https://www.acefitness.org/resources/everyone/exercise-library/154/seated-leg-press/'
    ],
    [
      'ACE – prostowanie nóg',
      'https://www.acefitness.org/resources/everyone/exercise-library/183/seated-leg-extension/'
    ],
    [
      'ACE – uginanie nóg leżąc',
      'https://www.acefitness.org/resources/everyone/exercise-library/153/lying-hamstrings-curl/'
    ],
    [
      'NSCA – rumuński martwy ciąg',
      'https://www.nsca.com/education/articles/kinetic-select/romanian-deadlift-rdl/'
    ],
    [
      'Technogym – maszyna do wypychania bioder',
      'https://www.technogym.com/en-GB/product/pure-strength-hip-thrust_MG80.html'
    ]
  ];

  const has = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(guides, id);
  function get(state, exerciseId) {
    const ex = state?.exercises?.find((e) => e.id === exerciseId);
    if (!ex) return null;
    if (has(ex.id))
      return { kind: 'catalogue', modelId: ex.id, steps: guides[ex.id].slice(0, 3), cue: guides[ex.id][3] };
    if (typeof ex.instructions === 'string' && ex.instructions.trim()) {
      return { kind: 'custom', text: ex.instructions.trim() };
    }
    if (has(ex.techniqueId))
      return {
        kind: 'linked',
        modelId: ex.techniqueId,
        steps: guides[ex.techniqueId].slice(0, 3),
        cue: guides[ex.techniqueId][3]
      };
    return null;
  }
  function esc(value) {
    return String(value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  }
  function render(state, id) {
    const guide = get(state, id);
    const header = '<section class="panel guide-card"><h2>Jak wykonać ćwiczenie</h2>';
    if (!guide)
      return (
        header +
        '<p class="guide-empty">W danych własnego ćwiczenia możesz zapisać instrukcję lub wybrać ruch wzorcowy z atlasu.</p></section>'
      );
    if (guide.kind === 'custom') {
      const paragraphs = guide.text
        .split(/\r?\n+/)
        .filter(Boolean)
        .map((line) => '<p>' + esc(line) + '</p>')
        .join('');
      return header + '<div class="guide-own">' + paragraphs + '</div></section>';
    }
    let linkNote = '';
    if (guide.kind === 'linked') {
      const modelName =
        root.ExerciseAtlas?.name(state, guide.modelId) ||
        state.exercises.find((ex) => ex.id === guide.modelId)?.name;
      if (modelName) linkNote = '<p class="guide-linked">Ruch wzorcowy · ' + esc(modelName) + '</p>';
    }
    const labels = ['Ustawienie', 'Ruch', 'Powrót'];
    const steps = guide.steps
      .map((step, i) => '<li><strong>' + labels[i] + '</strong><p>' + esc(step) + '</p></li>')
      .join('');
    return (
      header +
      linkNote +
      '<ol class="guide-steps">' +
      steps +
      '</ol><p class="guide-cue"><strong>Wskazówka</strong> ' +
      esc(guide.cue) +
      '</p></section>'
    );
  }
  const api = { has, get, render, references };
  root.ExerciseTechnique = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);

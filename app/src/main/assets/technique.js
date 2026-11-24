(function technique(root) {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).GymI18n || require('./i18n.js');

  // Each entry describes one complete repetition on the specified equipment.
  // The selected examples include both external setup and how to return the load.
  const guides = {
    'chest-press': [
      L.t("Ustaw siedzisko tak, by uchwyty znalazły się na wysokości środka klatki. Oprzyj plecy i postaw obie stopy na podłodze."),
      L.t("Wypchnij uchwyty przed siebie. Nadgarstki prowadź w przedłużeniu przedramion, a barki pozostaw przy oparciu."),
      L.t("Powoli zegnij łokcie, aż uchwyty wrócą obok klatki. Zatrzymaj je na tyle wcześnie, by barki zachowały wygodne ustawienie."),
      L.t("Dostosuj położenie startowe uchwytów, jeśli maszyna wypycha łokcie głęboko za tułów.")
    ],
    'bench-press': [
      L.t("Połóż się na płaskiej ławce z oczami pod gryfem. Oprzyj głowę, łopatki, pośladki i obie stopy. Ustaw asekurację i obejmij gryf kciukami."),
      L.t("Zdejmij sztangę ze stojaków nad barki. Zegnij łokcie i opuść gryf ku środkowej lub dolnej części klatki. W dolnej pozycji nadgarstki powinny znajdować się nad łokciami."),
      L.t("Wypchnij sztangę w górę i lekko w kierunku stojaków. Po ostatnim powtórzeniu oprzyj gryf na obu hakach."),
      L.t("Utrzymuj stopy nieruchomo, a pośladki w kontakcie z ławką przez całą serię.")
    ],
    'dumbbell-press': [
      L.t("Usiądź na końcu płaskiej ławki, oprzyj hantle o uda i pomóż sobie kolanami, żeby ustawić je przy klatce podczas kładzenia się. Oprzyj stopy o podłogę."),
      L.t("Wyciśnij obie hantle nad klatkę. Prowadź każdą nad odpowiadającym jej łokciem, utrzymując nadgarstki prosto."),
      L.t("Opuść hantle po bokach klatki do zakresu, który kontrolujesz obydwiema rękami."),
      L.t("Pozwól dłoniom lekko zbliżyć się u góry, zachowując odstęp między hantlami.")
    ],
    'push-up': [
      L.t("Oprzyj dłonie nieco szerzej niż barki. Wyprostuj nogi, oprzyj palce stóp i napnij brzuch oraz pośladki."),
      L.t("Zegnij łokcie ukośnie w tył. Opuść klatkę między dłonie, prowadząc głowę, biodra i pięty w jednej linii."),
      L.t("Odepchnij podłogę do wyprostu ramion. Klatka i biodra powinny unosić się razem."),
      L.t("Jeśli trudno zachować linię tułowia, ustaw dłonie na stabilnym podwyższeniu.")
    ],
    'pec-deck': [
      L.t("Usiądź przy oparciu i ustaw siedzisko tak, żeby dłonie na uchwytach były na wysokości klatki. Rozstaw uchwyty do wygodnej pozycji początkowej."),
      L.t("Przy lekko zgiętych łokciach prowadź uchwyty po łuku przed klatkę, jak przy obejmowaniu szerokiego przedmiotu."),
      L.t("Rozsuń ramiona powoli, utrzymując plecy na oparciu i kontrolując rozciągnięcie klatki."),
      L.t("Utrzymaj podobny kąt łokci podczas całego łuku.")
    ],
    'cable-fly': [
      L.t("Ustaw oba wyciągi mniej więcej na wysokości klatki. Chwyć rączki, stań w wykroku przed bramą i lekko ugnij łokcie."),
      L.t("Zbliż dłonie po szerokich łukach przed mostkiem. Utrzymuj tułów w tym samym pochyleniu."),
      L.t("Otwórz ramiona do momentu, w którym czujesz napięcie klatki i wciąż kontrolujesz pozycję barków."),
      L.t("Na końcu powtórzenia obie linki powinny wciąż pozostawać napięte.")
    ],
    'dumbbell-fly': [
      L.t("Połóż się na płaskiej ławce, oprzyj stopy i ustaw hantle nad klatką. Zwróć dłonie ku sobie, łokcie lekko ugnij."),
      L.t("Rozprowadź hantle na boki szerokim łukiem. Zejdź tylko tak nisko, jak potrafisz zachować stabilne barki i kontrolę nad ciężarem."),
      L.t("Zbliż ramiona po tym samym łuku, aż hantle wrócą nad klatkę."),
      L.t("Utrzymuj prawie stały kąt w łokciach, zwłaszcza blisko dołu ruchu.")
    ],
    'lat-pulldown': [
      L.t("Chwyć drążek nachwytem nieco szerzej niż barki. Usiądź, oprzyj stopy i dopasuj wałek do ud."),
      L.t("Lekko odchyl tułów i utrzymaj to ustawienie. Prowadź łokcie w dół po bokach ciała, sprowadzając drążek przed twarz w kierunku górnej klatki."),
      L.t("Płynnie wyprostuj ręce nad sobą. Pozwól łopatkom unieść się wraz z ramionami."),
      L.t("Dobierz obciążenie, przy którym tułów pozostaje spokojny na początku ściągania.")
    ],
    'pulldown-machine': [
      L.t("Dopasuj siedzisko i podporę ud, żeby móc dosięgnąć obu górnych uchwytów. Usiądź symetrycznie, stopy oprzyj płasko."),
      L.t("Pociągnij dźwignie maszyny w dół, prowadząc łokcie w stronę boków tułowia. Gdy ramiona pracują niezależnie, utrzymuj takie samo tempo obu stron."),
      L.t("Kontroluj unoszenie dźwigni, aż ramiona znajdą się znowu nad głową."),
      L.t("Trzymaj biodra na siedzisku także blisko końca ruchu powrotnego.")
    ],
    'pull-up': [
      L.t("Sięgnij do drążka z podestu, chwyć go nachwytem nieco szerzej niż barki. Zawiśnij z wyprostowanymi ramionami i uspokój nogi."),
      L.t("Pociągnij łokcie w dół w stronę żeber. Unieś ciało tak wysoko, jak możesz z głową w przedłużeniu tułowia."),
      L.t("Opuść się powoli do kontrolowanego zwisu i pozwól wyprostować się łokciom."),
      L.t("Rozpoczynaj kolejne powtórzenie po zatrzymaniu kołysania.")
    ],
    'seated-row': [
      L.t("Usiądź przed dolnym wyciągiem. Oprzyj stopy o podpory, lekko zegnij kolana i chwyć rączkę wyprostowanymi ramionami."),
      L.t("Przyciągnij uchwyt do dolnych żeber lub górnej części brzucha. Prowadź łokcie w tył blisko tułowia."),
      L.t("Wyprostuj ręce i pozwól łopatkom wysunąć się nieco do przodu, utrzymując stabilne lędźwie."),
      L.t("Wybierz odległość od wyciągu, przy której stos pozostaje uniesiony przy pełnym sięgnięciu.")
    ],
    'machine-row': [
      L.t("Ustaw siedzisko i podpórkę na klatkę tak, aby sięgnąć do uchwytów z prawie prostymi ramionami. Oprzyj mostek o poduszkę."),
      L.t("Przyciągnij uchwyty ku żebrom, prowadząc łokcie zgodnie z torem dźwigni. Klatka pozostaje na podporze."),
      L.t("Powoli wypuść uchwyty przed siebie. Pozwól ramionom i łopatkom się wysunąć."),
      L.t("Ustawienie podpórki powinno umożliwiać cały ruch bez odrywania klatki.")
    ],
    'dumbbell-row': [
      L.t("Oprzyj dłoń i kolano tej samej strony o ławkę. Drugą stopę postaw na podłodze, pochyl tułów, a hantel trzymaj pod barkiem wolnej ręki."),
      L.t("Pociągnij łokieć w kierunku biodra, prowadząc hantel blisko dolnych żeber. Biodra i klatka pozostają skierowane ku podłodze."),
      L.t("Opuść hantel do wyprostu ramienia. Po serii zamień stronę podparcia."),
      L.t("Zatrzymaj przyciąganie, zanim tułów zacznie skręcać się za ciężarem.")
    ],
    'barbell-row': [
      L.t("Chwyć sztangę nachwytem. Lekko ugnij kolana, cofnij biodra i pochyl tułów, aż gryf będzie wisiał pod barkami. Napnij brzuch."),
      L.t("Przyciągnij gryf blisko ciała do dolnych żeber lub górnej części brzucha. Kąt pochylenia tułowia pozostaje stały."),
      L.t("Opuść gryf do wyprostowanych ramion i ustabilizuj go przed kolejnym przyciągnięciem."),
      L.t("Jeżeli musisz prostować biodra przy każdym powtórzeniu, zmniejsz ciężar.")
    ],
    'shoulder-press': [
      L.t("Dopasuj siedzisko, by uchwyty maszyny zaczynały w pobliżu wysokości barków. Oprzyj plecy, a stopy postaw płasko."),
      L.t("Wypchnij uchwyty po torze dźwigni nad głowę. Trzymaj nadgarstki w linii z przedramionami."),
      L.t("Powoli zegnij łokcie i wróć do wygodnego poziomu początkowego."),
      L.t("Przez cały ruch utrzymuj żebra nad miednicą i plecy przy oparciu.")
    ],
    'dumbbell-shoulder-press': [
      L.t("Usiądź przy prawie pionowym oparciu. Ustaw hantle po obu stronach barków i wysuń łokcie odrobinę przed linię tułowia."),
      L.t("Wyciśnij hantle nad głowę. Prowadź je niezależnie nad łokciami, tak by obie strony poruszały się równo."),
      L.t("Opuść hantle z powrotem w okolice barków, zachowując kontrolę przy zmianie kierunku."),
      L.t("Stopy oprzyj mocno o podłogę, aby miednica pozostała stabilna na ławce.")
    ],
    'overhead-press': [
      L.t("Stań ze sztangą przy górnej klatce, dłońmi nieco szerzej niż barki i łokciami lekko przed gryfem. Napnij brzuch i pośladki."),
      L.t("Cofnij brodę na tyle, by gryf minął twarz. Wyciśnij go nad głowę i ustaw nad środkiem stóp."),
      L.t("Kontrolując tor gryfu, cofnij głowę i opuść sztangę na przód barków."),
      L.t("W wersji stojącej ze ścisłym wyciskaniem kolana utrzymują ten sam kąt.")
    ],
    'lateral-raise': [
      L.t("Stań z hantlami po bokach ud. Lekko ugnij łokcie i ustaw dłonie nieco przed linią bioder."),
      L.t("Unieś ramiona na boki i lekko do przodu, do komfortowej wysokości w okolicy barków. Prowadź łokcie i dłonie razem."),
      L.t("Opuść hantle tą samą drogą, kontrolując szczególnie końcowy odcinek."),
      L.t("Utrzymuj nadgarstki neutralnie i spokojne kolana, by ciężar nie nabierał rozpędu od nóg.")
    ],
    'cable-lateral-raise': [
      L.t("Stań bokiem do dolnego wyciągu. Dalszą ręką chwyć rączkę przed biodrami i odsuń się do lekkiego napięcia linki."),
      L.t("Z lekko ugiętym łokciem unieś ramię na bok i odrobinę do przodu. Zatrzymaj dłoń w okolicy wysokości barku."),
      L.t("Opuść rączkę spokojnie w stronę przeciwnego biodra. Po serii odwróć się drugim bokiem."),
      L.t("Ustaw się tak, by linka przechodziła swobodnie przed udami.")
    ],
    'machine-lateral-raise': [
      L.t("Ustaw wysokość siedziska zgodnie z oznaczeniami maszyny. Oprzyj zewnętrzne strony ramion przy łokciach o poduszki i złap uchwyty."),
      L.t("Rozsuń ramiona, unosząc poduszki na boki. Zakończ na kontrolowanej wysokości zbliżonej do linii barków."),
      L.t("Powoli opuść poduszki do boków tułowia, zachowując kontakt z nimi."),
      L.t("Dociskaj podpory ramionami i utrzymuj tułów nieruchomo na siedzisku.")
    ],
    'rear-delt-fly': [
      L.t("Usiądź twarzą do oparcia maszyny i oprzyj klatkę o poduszkę. Ustaw przednie uchwyty mniej więcej na wysokości barków."),
      L.t("Lekko zegnij łokcie. Rozprowadź ramiona na boki i w tył po łuku do okolic linii barków."),
      L.t("Spokojnie przywróć uchwyty przed klatkę, zachowując ten sam kąt w łokciach."),
      L.t("Pozwól łopatkom pracować wraz z ramionami, a klatkę przez cały czas oprzyj na poduszce.")
    ],
    'reverse-cable-fly': [
      L.t("Stań pośrodku bramy z wyciągami na wysokości barków. Lewą dłonią chwyć prawą linkę, prawą dłonią lewą. Zacznij z rękami przed sobą."),
      L.t("Prowadź dłonie szeroko na zewnątrz, lekko uginając łokcie. Ramiona rozchodzą się w kierunku litery T."),
      L.t("Zbliż ręce przed klatką, pozwalając linkom ponownie się skrzyżować."),
      L.t("Przez cały ruch zachowaj miejsce między szyją a barkami.")
    ],
    'dumbbell-curl': [
      L.t("Stań z hantlami przy udach i łokciami blisko boków. Zacznij z dłońmi skierowanymi do przodu lub w stronę ud."),
      L.t("Zegnij łokcie i unieś hantle ku barkom. Jeśli zaczynasz chwytem neutralnym, w trakcie unoszenia płynnie obróć dłonie ku górze."),
      L.t("Opuść hantle do prawie prostych ramion i wróć do początkowego ustawienia dłoni."),
      L.t("Pozostaw ramiona przy tułowiu, żeby ruch odbywał się głównie w łokciach.")
    ],
    'cable-curl': [
      L.t("Przypnij krótki drążek do dolnego wyciągu. Stań przodem do stosu, chwyć go podchwytem i odsuń się do lekkiego napięcia linki."),
      L.t("Ugnij łokcie, kierując drążek ku przodowi barków. Trzymaj nadgarstki w jednej linii z przedramionami."),
      L.t("Powoli wyprostuj łokcie tak, aby linka wciąż stawiała opór."),
      L.t("Zachowaj tę samą odległość tułowia od wyciągu przez całe powtórzenie.")
    ],
    'preacher-curl': [
      L.t("Usiądź przy modlitewniku maszyny. Dopasuj wysokość tak, aby całe ramiona oparły się na poduszce, a łokcie znalazły się przy osi obrotu dźwigni."),
      L.t("Chwyć uchwyty podchwytem i ugnij łokcie. Prowadź dłonie ku barkom, utrzymując ramiona oparte na poduszce."),
      L.t("Powoli opuść dźwignię do wygodnego wyprostu i łagodnie zmień kierunek."),
      L.t("W dolnym położeniu zachowaj napięcie, żeby ciężar nie szarpnął za łokcie.")
    ],
    'barbell-curl': [
      L.t("Stań ze sztangą trzymaną podchwytem mniej więcej na szerokość barków. Trzymaj gryf przed udami, a łokcie ustaw po bokach ciała."),
      L.t("Zegnij oba łokcie jednocześnie i unieś gryf w stronę barków. Zachowaj stabilne nadgarstki."),
      L.t("Opuść sztangę do wyprostu ramion i wyhamuj ją przed udami."),
      L.t("Biodra i tułów utrzymuj w tej samej pozycji na początku i na końcu unoszenia.")
    ],
    'triceps-pushdown': [
      L.t("Przymocuj drążek lub linę do górnego wyciągu. Stań przodem, przyciągnij łokcie do boków i zacznij ze zgiętymi ramionami."),
      L.t("Wyprostuj łokcie, prowadząc uchwyt w stronę ud. Przy linie możesz pozwolić dłoniom lekko się rozsunąć na dole."),
      L.t("Zegnij łokcie, pozwalając uchwytowi unieść się pod kontrolą. Ramiona pozostają przy tułowiu."),
      L.t("Ustaw się na tyle daleko, by linka mogła swobodnie przejść przed klatką.")
    ],
    'overhead-extension': [
      L.t("Chwyć stabilnie jeden hantel oburącz i ustaw go nad głową. Skieruj łokcie w górę, napnij brzuch i utrzymaj żebra nad miednicą."),
      L.t("Zegnij łokcie, opuszczając hantel za głowę w wygodnym zakresie. Ramiona pozostają skierowane ku górze."),
      L.t("Wyprostuj łokcie, prowadząc hantel z powrotem nad głowę."),
      L.t("Trzymaj ciężar oburącz również przy kończeniu serii i odstawianiu go.")
    ],
    'triceps-machine': [
      L.t("Usiądź przy maszynie z podparciem ramion. Ustaw siedzisko tak, by łokcie były przy osi dźwigni, i chwyć uchwyty ze zgiętymi łokciami."),
      L.t("Dociskając ramiona do poduszki, wyprostuj łokcie i odsuń uchwyty zgodnie z torem maszyny."),
      L.t("Płynnie zegnij łokcie i sprowadź dłonie z powrotem do pozycji początkowej."),
      L.t("Cały czas opieraj ramiona na poduszce, szczególnie w pierwszych centymetrach ruchu.")
    ],
    'leg-press': [
      L.t("Oprzyj plecy i miednicę o oparcie. Ustaw całe stopy na platformie mniej więcej na szerokość bioder lub barków. Przy suwnicy z blokadą zwolnij ją po przejęciu ciężaru."),
      L.t("Zegnij biodra i kolana, zbliżając platformę. Zejdź do głębokości, przy której pięty oraz miednica zachowują podparcie."),
      L.t("Odepchnij platformę całymi stopami i płynnie wyprostuj nogi. Po serii zabezpiecz wózek zgodnie z oznaczeniami."),
      L.t("Prowadź kolana zgodnie z kierunkiem palców stóp.")
    ],
    'hack-squat': [
      L.t("Oprzyj plecy o skośny wózek i ustaw barki pod poduszkami. Postaw całe stopy na platformie, przejmij ciężar i zwolnij uchwyty blokady."),
      L.t("Uginaj biodra i kolana, prowadząc wózek w dół po szynach. Dobierz głębokość, przy której pięty i miednica nadal mają podparcie."),
      L.t("Wciśnij stopy w platformę i wyprostuj nogi. Przed wyjściem z maszyny ponownie zablokuj wózek."),
      L.t("Ustaw ograniczniki ruchu przed rozpoczęciem serii, jeśli dany model je ma.")
    ],
    squat: [
      L.t("W stojaku z dopasowanymi belkami asekuracyjnymi ułóż gryf na mięśniach górnej części pleców. Obejmij go dłońmi, wyprostuj nogi, cofnij się i ustaw stopy w stabilnym rozstawie."),
      L.t("Napnij brzuch i zegnij równocześnie biodra oraz kolana. Prowadź kolana w kierunku palców, a gryf nad środkową częścią stóp."),
      L.t("Odepchnij podłogę całymi stopami, unosząc biodra i barki razem. Po serii podejdź do stojaków i oprzyj gryf na obu hakach."),
      L.t("Dobierz głębokość, przy której zachowujesz równowagę i kontrolę tułowia.")
    ],
    'goblet-squat': [
      L.t("Stań stabilnie i przytrzymaj jeden hantel pionowo blisko mostka, oburącz pod jego górnym końcem."),
      L.t("Zegnij biodra i kolana, schodząc między uda. Hantel prowadź blisko klatki, a kolana zgodnie z kierunkiem stóp."),
      L.t("Wstań, naciskając podłogę całymi stopami. Zakończ w stabilnej pozycji z hantlem przy mostku."),
      L.t("Utrzymuj łokcie skierowane w dół, by ciężar pozostał blisko tułowia.")
    ],
    'leg-extension': [
      L.t("Dopasuj oparcie, aby oś obrotu maszyny znalazła się na wysokości kolan. Umieść wałek na przedniej części podudzi nad kostkami i oprzyj plecy."),
      L.t("Wyprostuj kolana, unosząc wałek razem z podudziami. Pozostaw uda na siedzisku."),
      L.t("Powoli zegnij kolana, pozwalając wałkowi opaść do pozycji początkowej."),
      L.t("Skoryguj położenie wałka, jeśli naciska na stopy zamiast na podudzia.")
    ],
    'cable-leg-extension': [
      L.t("Ustaw stabilną ławkę przed dolnym wyciągiem. Usiądź tyłem do bloczka z kolanem przy krawędzi i przypnij mankiet nad kostką. Linka biegnie spod ławki za stopę."),
      L.t("Trzymając udo na ławce, wyprostuj jedno kolano i wysuń stopę do przodu przeciwko oporowi linki."),
      L.t("Powoli zegnij kolano, aż podudzie wróci do pozycji startowej. Zmień nogę po zakończeniu serii."),
      L.t("Ustaw ławkę tak, żeby linka miała wolny tor i nie ocierała o jej ramę.")
    ],
    'leg-curl': [
      L.t("Usiądź z plecami przy oparciu. Oś maszyny ustaw przy kolanach, dolny wałek za podudziami nad piętami, a górną poduszkę dopasuj do ud."),
      L.t("Zegnij kolana, ciągnąc pięty w dół i pod siedzisko. Miednicę utrzymuj na miejscu."),
      L.t("Powoli wyprostuj nogi do pozycji początkowej, zachowując kontrolę nad unoszącym się wałkiem."),
      L.t("Poduszka ma przytrzymywać uda podczas uginania, pozostawiając kolanom swobodę.")
    ],
    'lying-leg-curl': [
      L.t("Połóż się przodem na maszynie, ustaw kolana przy osi obrotu, a wałek z tyłu podudzi nad piętami. Chwyć uchwyty."),
      L.t("Zegnij kolana i prowadź pięty w stronę pośladków. Zatrzymaj ruch, zanim biodra zaczną odrywać się od poduszki."),
      L.t("Opuść podudzia powoli, kontrolując wałek aż do prawie prostych nóg."),
      L.t("Zachowaj lekko napięty brzuch, by miednica pozostawała oparta.")
    ],
    'cable-leg-curl': [
      L.t("Zapnij mankiet nad kostką i przypnij go do dolnego wyciągu. Stań przodem do bloczka, oprzyj dłonie o stabilną podporę i lekko ugnij nogę podporową."),
      L.t("Zegnij kolano nogi z mankietem, prowadząc piętę w kierunku pośladka. Udo utrzymuj w sąsiedztwie drugiego uda."),
      L.t("Opuść stopę powoli do pozycji początkowej. Po serii przełóż mankiet na drugą nogę."),
      L.t("Utrzymuj biodra skierowane do przodu, aby opór linki działał głównie na ugięcie kolana.")
    ],
    'romanian-deadlift': [
      L.t("Zacznij stojąc ze sztangą przy udach. Ustaw stopy na szerokość bioder, lekko ugnij kolana, napnij brzuch i chwyć gryf oburącz."),
      L.t("Cofaj biodra, pochylając tułów i prowadząc gryf tuż przy udach, a następnie przy podudziach. Zejdź do wyraźnego rozciągnięcia tyłu ud przy stabilnych plecach."),
      L.t("Wyprostuj biodra i wróć do stania, prowadząc sztangę blisko nóg przez całą drogę."),
      L.t("Głębokość wyznacza zakres ruchu Twoich bioder, więc gryf może zatrzymać się powyżej połowy podudzi.")
    ],
    'dumbbell-rdl': [
      L.t("Stań ze stopami na szerokość bioder. Trzymaj hantle przed udami lub przy ich bokach, lekko ugnij kolana i ustabilizuj tułów."),
      L.t("Przesuwaj biodra w tył, opuszczając obie hantle równolegle blisko nóg. Kontynuuj, dopóki zachowujesz pozycję pleców i czujesz rozciągnięcie tyłu ud."),
      L.t("Naciśnij podłogę stopami i wyprostuj biodra, prowadząc hantle z powrotem do ud."),
      L.t("Obie hantle powinny na dole znajdować się na tej samej wysokości.")
    ],
    'hip-thrust': [
      L.t("Oprzyj górną część pleców o stabilną ławkę, zwykle tuż pod łopatkami. Umieść sztangę z osłoną na zgięciu bioder, przytrzymaj gryf i oprzyj całe stopy."),
      L.t("Unieś biodra, obracając tułów wokół podparcia na ławce. U góry doprowadź uda i tułów do jednej linii przy spokojnym ustawieniu żeber."),
      L.t("Zegnij biodra i opuść sztangę pod kontrolą, zachowując stabilną ławkę i oparcie stóp."),
      L.t("Dobierz odległość stóp tak, by przy wyproście bioder podudzia były zbliżone do pionu.")
    ],
    'glute-drive': [
      L.t("Ułóż górną część pleców na poduszce i całe stopy na platformie. Zapnij pas lub dopasuj dźwignię z poduszką na biodrach zgodnie z oznaczeniami maszyny."),
      L.t("Naciśnij platformę stopami i unieś biodra przeciw oporowi. Zatrzymaj ruch przy wyproście bioder z żebrami nad miednicą."),
      L.t("Powoli zegnij biodra i opuść ramię maszyny. Przed odpięciem pasa lub opuszczeniem stanowiska zabezpiecz dźwignię."),
      L.t("Dopasuj położenie poduszki obciążającej do zgięcia bioder.")
    ],
    'glute-bridge': [
      L.t("Połóż się na plecach na macie. Zegnij kolana, oprzyj całe stopy na szerokość bioder, a ręce połóż wzdłuż ciała."),
      L.t("Naciśnij podłogę stopami i unieś biodra, aż tułów i uda utworzą zbliżoną do prostej linię."),
      L.t("Powoli opuść miednicę na matę, zachowując stopy i górę pleców na podłodze."),
      L.t("Zatrzymaj ruch u góry, kiedy pośladki są napięte, a żebra nadal pozostają nad miednicą.")
    ],
    'calf-raise': [
      L.t("Na maszynie do wspięć ustaw barki pod poduszkami. Oprzyj przodostopie na krawędzi platformy tak, żeby pięty mogły swobodnie się poruszać."),
      L.t("Naciśnij platformę przodostopiem i unieś pięty. Utrzymaj stabilną pozycję kolan i tułowia."),
      L.t("Opuść pięty powoli do komfortowego rozciągnięcia łydek. Zmień kierunek płynnie."),
      L.t("Rozłóż nacisk równomiernie na przodostopiu, aby kostki pozostały stabilne.")
    ],
    'seated-calf': [
      L.t("Usiądź z ugiętymi kolanami. Oprzyj przodostopie na platformie, a poduszki ułóż na udach tuż powyżej kolan. Unieś pięty, aby zwolnić blokadę."),
      L.t("Unieś pięty jak najwyżej w kontrolowanym zakresie. Poduszka unosi się razem z udami."),
      L.t("Opuść pięty poniżej poziomu przodostopia na tyle, na ile swobodnie pozwalają kostki. Po serii oprzyj dźwignię na blokadzie."),
      L.t("Pracuj w stawach skokowych, utrzymując przodostopie w tym samym miejscu.")
    ],
    'dumbbell-calf': [
      L.t("Stań na stabilnym podłożu z hantlami przy bokach. Ustaw stopy równolegle mniej więcej na szerokość bioder. Przy jednym hantlu wolną ręką możesz przytrzymać się podpory."),
      L.t("Przenieś nacisk na przodostopie i unieś pięty, trzymając ciężar blisko ciała."),
      L.t("Opuść pięty powoli do podłoża i zatrzymaj je przed kolejnym wspięciem."),
      L.t("Spójrz przed siebie i zachowaj stałe ugięcie kolan, żeby łatwiej utrzymać równowagę.")
    ],
    'cable-crunch': [
      L.t("Przypnij linę do górnego wyciągu i uklęknij przed nim. Chwyć końce liny przy skroniach, lekko pochyl tułów i ustabilizuj biodra."),
      L.t("Z wydechem zbliż dolne żebra do miednicy, zaokrąglając tułów. Łokcie podążają z klatką w stronę ud."),
      L.t("Powoli wydłuż tułów do pozycji początkowej, zachowując uchwyty przy głowie."),
      L.t("Utrzymuj pośladki na podobnej wysokości i pozwól brzuchowi wykonać spięcie.")
    ],
    'machine-crunch': [
      L.t("Dopasuj siedzisko i podpory według oznaczeń maszyny. Ustaw stopy na podpórkach, oprzyj tułów o poduszkę i chwyć uchwyty."),
      L.t("Z wydechem skieruj żebra ku miednicy. Pozwól dźwigni przesuwać się wraz ze spięciem tułowia."),
      L.t("Wróć powoli do pozycji wyjściowej, kontrolując powrót dźwigni."),
      L.t("Dłonie stabilizują pozycję na uchwytach. Utrzymuj podobne zgięcie łokci podczas całego ruchu.")
    ],
    crunch: [
      L.t("Połóż się na plecach, zegnij kolana i oprzyj stopy o matę. Skrzyżuj ręce na klatce lub oprzyj opuszki palców lekko przy skroniach."),
      L.t("Z wydechem zbliż żebra do miednicy, unosząc głowę i łopatki kilka centymetrów nad matę. Zachowaj przestrzeń między brodą a mostkiem."),
      L.t("Wróć powoli łopatkami i głową na matę. Miednica pozostaje oparta przez całe powtórzenie."),
      L.t("Kieruj wzrok lekko w górę i pozwól szyi podążać za klatką.")
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

  const library = root.ExerciseLibrary || require('./library.js');
  for (const ex of library.additions) {
    const family = library.families[ex.family];
    guides[ex.id] = [...family[L.language], L.language === 'en' ? ex.cueEn : ex.cuePl];
  }
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
    const header = ("<section class=\"panel guide-card\"><h2>" + L.t("Jak wykonać ćwiczenie") + "</h2>");
    if (!guide)
      return (
        header +
        ("<p class=\"guide-empty\">" + L.t("W danych własnego ćwiczenia możesz zapisać instrukcję lub wybrać ruch wzorcowy z atlasu.") + "</p></section>")
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
      if (modelName) linkNote = ("<p class=\"guide-linked\">" + L.t("Ruch wzorcowy ·") + " ") + esc(modelName) + '</p>';
    }
    const labels = [L.t("Ustawienie"), L.t("Ruch"), L.t("Powrót")];
    const steps = guide.steps
      .map((step, i) => '<li><strong>' + labels[i] + '</strong><p>' + esc(step) + '</p></li>')
      .join('');
    return (
      header +
      linkNote +
      '<ol class="guide-steps">' +
      steps +
      ("</ol><p class=\"guide-cue\"><strong>" + L.t("Wskazówka") + "</strong> ") +
      esc(guide.cue) +
      '</p></section>'
    );
  }
  const api = { has, get, render, references };
  root.ExerciseTechnique = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);

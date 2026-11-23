# BebechDestroyer

Dziennik siłowy dla Androida z dowolną liczbą planów, atlasem 49 ćwiczeń oraz przelicznikiem obciążeń między konkretnymi maszynami. Treningi, plany i pomiary są przechowywane na telefonie. Do prowadzenia dziennika wystarczy tryb offline.

## Instalacja i aktualizacje

W sekcji **Releases** tego repozytorium pobierz plik **BebechDestroyer.apk** na telefon z Androidem 8 lub nowszym. Jeśli masz wcześniejszą aplikację **Rozstaw**, otwórz nowy APK na tym samym telefonie i wybierz **Aktualizuj**. Identyfikator aplikacji `pl.rozstaw.app`, certyfikat i format dziennika są wspólne dla tych wydań.

Wersje od 1.3 sprawdzają nowe wydania po otwarciu aplikacji oraz okresowo, kiedy aplikacja jest na ekranie. Możesz też użyć **Więcej → Sprawdź aktualizacje**. Telefon proponuje pobranie i instalację nowszego wydania. Android może po raz pierwszy poprosić o zezwolenie na instalowanie aplikacji z tego źródła. Po potwierdzeniu aktualizacji treningi pozostają na urządzeniu. Jeśli korzystasz z lokalnego APK startowego bez wbudowanego kanału, wybierz repozytorium w ustawieniach aktualizacji, wpisując `TwójLogin/BebechDestroyer`.

## Od propozycji do wydania

1. Zmień kod na osobnej gałęzi i otwórz pull request do `master`.
2. Zadanie **testy-master** sprawdza m.in. przeliczenia obciążeń, zapis treningów, kopie, aktualizator i publikację. Przechodzi też przez trening w Chrome i uruchamia testy, Android Lint oraz kompilację APK.
3. Po konfiguracji ochrony decyzja o scaleniu należy do właściciela repozytorium. Dotyczy to również jego własnych PR. Instrukcja konfiguracji i audytu znajduje się w [admin/README.md](admin/README.md).
4. Po scaleniu GitHub Actions sprawdza aktualny `master` i przygotowuje niepodpisany APK. Komputer właściciela pobiera zweryfikowany artefakt, podpisuje go lokalnym kluczem i przesyła podpisany plik do **Releases**. Gdy komputer jest wyłączony, wydanie poczeka na jego uruchomienie i połączenie z siecią.

## Kalendarz i trening

**Trening → Kalendarz** pokazuje dni ukończenia treningów według czasu lokalnego. Dotknij dnia, aby zobaczyć wszystkie sesje, siłownie, ćwiczenia i zapisane ciężary oraz powtórzenia poszczególnych serii. Wybierz ćwiczenie z listy, aby odszukać jego dni treningowe. W podsumowaniu miesiąca możesz sprawdzić liczbę treningów, serii i powtórzeń.

Podczas treningu górny pasek pokazuje czas sesji, liczbę zaliczonych serii roboczych i objętość po normalizacji. Wlicza potwierdzone serie i przelicza sumę po cofnięciu znacznika. Zasady liczenia kilogramów są wspólne z wykresem planu. Przy niepełnej kalibracji zobaczysz dostępną część wyniku. **Mięśnie treningu** pozwalają przełączać mapę między planem sesji i wykonanymi seriami oraz dotykać poszczególnych partii.

Na karcie ćwiczenia lub przy ćwiczeniu w treningu wybierz **Technika**. Wszystkie 49 ćwiczeń z atlasu mają własny animowany pokaz z odtwarzaniem, pauzą, regulacją tempa i wyborem fazy ruchu. Pod pokazem lub obok niego znajdziesz ustawienie, wykonanie, powrót i wskazówkę. Animacje i polskie instrukcje działają offline. Dla własnego ćwiczenia można wybrać pokaz z atlasu i zapisać własną instrukcję. Te ustawienia przenoszą się z planem JSON i w kopii dziennika.

Przy opracowaniu instrukcji wykorzystano m.in. opisy wyciskania, martwego ciągu rumuńskiego i pracy na maszynie do wyprostu bioder. Pozostałe pozycje zestawiono w `app/src/main/assets/technique.js`. [ACE Exercise Library](https://www.acefitness.org/resources/everyone/exercise-library/188/seated-chest-press/) · [NSCA](https://www.nsca.com/education/articles/kinetic-select/romanian-deadlift-rdl/) · [Technogym](https://www.technogym.com/en-GB/product/pure-strength-hip-thrust_MG80.html)

## Wykresy

**Postępy → Ćwiczenia** pokazuje wszystkie siłownie na jednej skali. Wybierz ćwiczenie i przełączaj między siłą przeliczoną na 10 powtórzeń, największym ciężarem i objętością. Przy ćwiczeniach z masą ciała możesz sprawdzić liczbę powtórzeń. Własne wyniki konkretnej maszyny znajdziesz na karcie ćwiczenia. Każdy punkt pokazuje wynik sesji według kalibracji dostępnej w momencie jej zakończenia.

**Postępy → Plany** oraz karta każdego planu pokazują objętość kolejnych ukończonych sesji. Dla każdego ćwiczenia aplikacja przelicza ciężar na pierwsze zapisane stanowisko odniesienia, mnoży go przez faktyczną liczbę powtórzeń i sumuje te wartości. Rozgrzewki są pomijane. Ćwiczenia z masą ciała wnoszą do sumy kilogramów tylko zapisane dodatkowe obciążenie. Jeśli maszyna pozostaje bez kalibracji, wykres ma przerwę. Rozwiń **Wyniki sesji**, aby zobaczyć dostępne serie i sumę częściową.

## Atlas ćwiczeń i język

W zakładce **Ćwiczenia** dotknij nazwy, aby otworzyć wykres i mapę mięśni z przodu i tyłu. Dotknięcie zaznaczonej partii lub wiersza w legendzie wyróżnia ten mięsień. Role główna, wspomagająca i stabilizująca opisują typowy ruch. Własnym ćwiczeniom możesz przypisać mięśnie lub przejąć profil ze zbliżonego ruchu.

**Więcej → Język nazw ćwiczeń → English** przełącza nazwy w atlasie, treningach i planach. Wyszukiwarka i import przyjmują obie wersje językowe. Nazwy planów, własne nazwy stanowisk i notatki pozostają takie, jak je wpiszesz.

## Plany i zakres powtórzeń

W edytorze planu ustaw zakres dla poszczególnych ćwiczeń, np. 5–8. Podczas treningu wpisz rzeczywisty wynik, także poza zakresem. Plany z poprzedniej wersji zachowują swoje dokładne cele.

Wybierz **Plany → Importuj JSON**. Możesz wkleić tekst, otworzyć plik lub nacisnąć **Wstaw przykład**. Po sprawdzeniu podglądu dodaj plan do biblioteki. Pole `name` przyjmuje nazwy ćwiczeń po polsku i angielsku, a `exerciseId` przyjmuje identyfikator z eksportu. Plan możesz wyeksportować z jego menu. Przykład gotowy do importu znajdziesz w pliku `Plan-5-8.json`.

## Pierwszy trening

Otwórz plik `BebechDestroyer.apk` na telefonie z Androidem 8 lub nowszym i postępuj zgodnie z komunikatami instalatora. Po uruchomieniu wybierz Zdrofit Alchemia albo Zdrofit Suchanino w prawym górnym rogu ekranu. Zacznij od gotowego planu lub utwórz własny. Po każdej serii wpisz ciężar, liczbę powtórzeń i dotknij znacznika po prawej stronie. Na koniec wybierz **Zakończ trening** i **Zapisz trening**.

Jeśli pamiętasz wcześniejsze wyniki, otwórz **Przelicznik maszyn**, wybierz ćwiczenie i siłownię, a następnie **Dodaj wcześniejszy wynik**. Podaj datę, liczbę powtórzeń i ciężar dla właściwego stanowiska. W zakładce **Moje siłownie** możesz nazwać maszyny i ustawić dostępny skok ciężaru.

## Porównywanie maszyn i zamienniki

BebechDestroyer szuka serii roboczych tego samego ćwiczenia na dwóch konkretnych stanowiskach. Porównuje sesje z odstępem do 14 dni w ostatnich 180 dniach. Przybliżenie dla innej liczby powtórzeń wykorzystuje mnożnik `(30 + wykonane powtórzenia) / (30 + docelowe powtórzenia)`. Aplikacja stosuje go wyłącznie dla bliskich zakresów. Pomija rozgrzewki i drop sety. Gdy podasz zapas powtórzeń, odrzuca pary różniące się o więcej niż jedno powtórzenie w zapasie.

Każda para treningów dostarcza jedną obserwację. BebechDestroyer odrzuca duże odchylenia i nadaje większą wagę świeżym, zgodnym porównaniom. Gdy zapiszesz własny wynik w miejsce sugestii, aplikacja uwzględnia go przy następnych przeliczeniach. Wpływ pojedynczej korekty jest ograniczony. Na przykład po kalibracji 35 i 70 kg dla dziesięciu powtórzeń nowe 80 kg może dać sugestię 40 kg. W teście wpisanie 45 kg zamiast sugerowanych 40 kg przesunęło następną podpowiedź do 42,5 kg przy tym samym wyniku na drugiej maszynie. Liczba serii, rozrzut wyników i skok maszyny wpływają na Twoją podpowiedź.

Przycisk **Zamień** proponuje ćwiczenia o podobnym wzorcu ruchu. Pierwszeństwo mają warianty ze sprzętem już zapisanym na aktywnej siłowni. Serie ukończone przed zmianą nadal należą do pierwotnego stanowiska. W **Postępach** zobaczysz osobne wyniki ćwiczeń, sumę serii danego ruchu i wykres obciążeń przeliczonych na wybraną maszynę przy 10 powtórzeniach.

## Kopia zapasowa

Wybierz **Więcej → Kopia zapasowa → Zapisz kopię**. System zapyta o miejsce dla pliku JSON. Przywrócenie na drugim urządzeniu wymaga wskazania pliku i zatwierdzenia zastąpienia dziennika. Kopia obejmuje plany, historię treningów, trwającą sesję, pomiary ciała i profile sprzętu. Dane w przeglądarkowym podglądzie na komputerze mają osobny zapis i można je przenieść tą samą metodą.

## Projekt

Otwórz w Android Studio folder zawierający `settings.gradle`. Projekt używa Gradle 8.9, JDK 17 i Android SDK 35. Przy pierwszym otwarciu Android Studio pobierze zależności. Przycisk Run uruchomi aplikację na podłączonym urządzeniu lub emulatorze z Androidem 8 albo nowszym. Na telefonie korzystaj z aktualnej wersji Android System WebView lub Chrome.

Pliki w `app/src/main/assets` zawierają ekrany, dane i obliczenia. Systemowy wybór pliku kopii zapasowej i obsługa WebView znajdują się w `app/src/main/java/pl/rozstaw/app/TrainingActivity.java`. Dziennik, plany i profile maszyn zapisują się lokalnie. W aplikacji można wyeksportować plik JSON przed zmianą telefonu lub odinstalowaniem.

## Sprawdzanie zmian

Testy modelu, kalibracji, atlasu, instrukcji, animacji, kalendarza i importu uruchom w Node.js 24 poleceniem `node --test "tests/*.test.cjs" "ci/*.test.mjs"`. Testy interfejsu uruchamia polecenie `node tests/qa-browser.cjs`. Na Windows domyślną przeglądarką testową jest Edge. Ścieżkę do innej zgodnej przeglądarki Chromium ustaw w zmiennej `ROZSTAW_BROWSER`. Testy używają tymczasowego profilu i własnych danych treningowych.

## Materiały graficzne

Krój Barlow Condensed dołączono z licencją SIL Open Font License w pliku `app/src/main/assets/assets/OFL-BarlowCondensed.txt`. Fotografię do nagłówka wygenerowano wbudowanym narzędziem ImageGen i zapisano jako `app/src/main/assets/assets/plates.jpg`.

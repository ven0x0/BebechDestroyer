# Ochrona gałęzi master

## Podpisywanie na Windows

Po skonfigurowaniu ochrony komputer sprawdza najnowszy commit `master` co pięć minut. Do podpisu wybiera udany przebieg `android.yml` z testami i niepodpisanym APK dla tego commita. Weryfikuje pochodzenie i SHA-256 archiwum, pakiet, numer wersji i certyfikat. Do GitHub Releases wysyła podpisany plik `BebechDestroyer.apk`. Klucz PKCS#12 i jego hasło są odczytywane lokalnie przez Android SDK.

Do pierwszej instalacji potrzebne są GitHub CLI zalogowany jako właściciel, Git, Node.js 22 lub nowszy, JDK 17 oraz Android Build Tools 35. W PowerShell podaj swoje ścieżki.

```powershell
.\admin\install-watcher.ps1 -Repository 'LOGIN/BebechDestroyer' -Keystore 'D:\MojeKlucze\Rozstaw.p12' -PasswordFile 'D:\MojeKlucze\password.txt' -BuildToolsDirectory "$env:ANDROID_HOME\build-tools\35.0.0" -JavaHome $env:JAVA_HOME
```

Instalator kopiuje sprawdzone skrypty do `%LOCALAPPDATA%\BebechDestroyer\Publisher` i tworzy skrót **BebechDestroyer Publisher** w autostarcie bieżącego użytkownika. Aktualizację samych skryptów publikujących wykonaj uruchamiając instalator ponownie po przejrzeniu zmian. Aby zatrzymać publikację, utwórz pusty plik `paused` w katalogu Publisher. Aby wznowić, usuń ten plik i uruchom skrót. Usunięcie skrótu po wstrzymaniu wyłącza autostart. Stan połączenia znajdziesz w `watcher.log`; pojedyncze sprawdzenie z diagnostyką można uruchomić przez `release-local.ps1` z tymi samymi ścieżkami do klucza i narzędzi.

## Akceptowanie zmian

Po pierwszym zielonym zadaniu **testy-master** na gałęzi `master` zaloguj się na swoje konto w GitHub CLI. Uruchom poniższe polecenia w głównym folderze projektu, tam gdzie leży `gradlew`. Podstaw nazwę swojego repozytorium w miejsce `LOGIN/REPO`.

```sh
gh auth login --hostname github.com --web
node admin/protect-master.cjs LOGIN/REPO
```

Skrypt odczytuje identyfikator zalogowanego konta i sprawdza jego uprawnienia. W osobistym repozytorium musi to być właściciel. W organizacji polecenie wykonuje administrator, który ma podejmować decyzje o scaleniu. GitHub udostępnia te reguły w publicznych repozytoriach na planie Free. W repozytoriach prywatnych funkcja wymaga odpowiedniego planu, m.in. Pro dla konta osobistego lub Team dla organizacji. [Dostępność reguł GitHuba](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)

Od tej chwili każda zmiana na `master` przechodzi przez pull request. Po zielonych testach otwórz zakładkę **Files changed**, sprawdź różnice i potwierdź scalenie przyciskiem **Merge**. Jeśli GitHub pokaże zgodę na wyjątek od ograniczenia aktualizacji gałęzi, dotyczy ona reguły z Twoim imieniem użytkownika. Osobna reguła wciąż wymaga testów. Możesz tak zaakceptować również własny pull request. Inni użytkownicy mogą zgłaszać zmiany i zamieszczać uwagi. Ich opinie nie wystarczają do wpisania zmian na `master`. [Scalanie reguł](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets#about-rule-layering) · [Ocenianie własnych zmian](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews)

Opcja `--verify` pozwala sprawdzić aktualną konfigurację.

```sh
node admin/protect-master.cjs LOGIN/REPO --verify
```

Oba polecenia odczytują ustawienia z GitHuba i wyświetlają linki do dwóch zestawów reguł. W zakładce **Settings → Rules → Rulesets** zobaczysz, że wyjątek dla aktualizacji przez PR ma wyłącznie wskazane konto. Reguła dla testów, zakazu wymuszonego nadpisywania i usuwania gałęzi ma pustą listę wyjątków. Osoby uprawnione do administracji repozytorium nadal mogą zmieniać jego ustawienia. [Wyjątek dla indywidualnego konta](https://github.blog/changelog/2026-05-07-repository-rulesets-user-bypass-and-branch-renaming/)

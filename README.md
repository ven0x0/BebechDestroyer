# BebechDestroyer

BebechDestroyer is an offline Android strength-training log with unlimited routines and 270 exercises. It learns how the loads you record on different machines compare, so you can follow the same exercise across gyms. Training data stays on your device.

## Install and log a workout

Download **BebechDestroyer.apk** from the [latest release](https://github.com/ven0x0/BebechDestroyer/releases/latest). Open it on Android 8 or later and confirm the installation. If you previously used Rozstaw, Android offers an update using the same package, signing certificate and journal.

Choose your gym in the top right. Zdrofit Alchemia and Zdrofit Suchanino are included. Start a routine, enter the actual load and repetitions after each set, and tap the checkmark. Finish and save to add the workout to your history. Under **My gyms**, name individual machines and set their weight increments. The machine calculator also accepts results from earlier dates.

Version 1.3 and later checks for releases when opened and periodically while in use. You can also choose **More → Check for updates**. Android may ask you to allow installation from this source. For a locally built APK with an empty update channel, enter the public GitHub repository as `owner/repository` in the update settings.

## Routines and JSON import

In **Routines**, create a routine or choose **Import JSON** to paste JSON, open a file or load the example. Each exercise accepts a set count and a rep target such as `8` or `"5-8"`. During training, record the reps you actually complete. Older routines retain their original targets.

```json
{
  "name": "Upper body A",
  "exercises": [
    { "exerciseId": "db_incline_press", "sets": 3, "reps": "5-8" },
    { "name": "Seated Row (Cable)", "sets": 3, "reps": 10 }
  ]
}
```

The importer accepts stable exercise IDs, Polish and English names, common abbreviations, and codes written in camelCase, snake_case or kebab-case. Equipment and movement words can change order. When a reference is ambiguous or unknown, the review screen shows every affected routine and row. Select a suggestion, search the full library or browse all exercises. Confirm the batch after choosing every match. You can export a routine from its menu. [Example routine](Plan-5-8.json)

## Progress across gyms

The calculator compares recent working sets on the same exercise across equipment profiles. It gives more weight to recent, consistent comparisons. The next estimate takes your actual logged load into account and limits the influence of any one correction. For example, paired sets of 10 at 35 kg and 70 kg establish a ratio. A later 80 kg on the second machine can suggest 40 kg on the first. In the test fixture, logging 45 kg instead adjusts the next suggestion to 42.5 kg.

Exercise charts show strength at 10 reps, maximum load, normalized volume or bodyweight repetitions. Routine charts multiply actual reps by external load on each exercise’s reference scale, then sum the session. Warm-ups are excluded. Bodyweight movements contribute their logged additional load. A gap indicates missing calibration. Expand the session results for the available subtotal. Earlier points use the calibration available at the end of that session.

Use **Replace** during a workout to find a related movement, with equipment registered at the current gym shown first. Completed sets keep their original exercise and equipment.

## Calendar, exercise library and muscle maps

The calendar groups completed sessions by local date. Select a day to inspect its gyms, exercises, sets, loads and reps. Filter by exercise to find its training days and monthly totals. During a workout the pinned header shows elapsed time, completed working sets and normalized volume. Unchecking a set immediately updates the totals.

Each exercise has a progress chart, an offline animated demonstration with playback and scrubbing controls, three technique steps, coaching cues and front and back muscle maps. Both exercise cards and the live workout show groups such as shoulders, chest, upper back and lats. Expand a group to inspect individual muscles and their roles, or tap a highlighted region on the figure to open its group. In the live workout, switch between planned and completed sets. Each working set counts once per group it uses, even when it works several muscles in that group. Custom exercises can use a library demonstration, their own instructions and muscle assignments. These are included in JSON exports.

Choose **More → Sex for muscle maps** to use a female or male silhouette across the library and workout. Choose **More → App language** for Polish or English. Your own routine names, notes and station labels are stored as entered.

The library includes Dragon Flag and its tucked, single-leg and negative progressions. [Dragon flag technique](https://www.calisthenics-101.co.uk/dragon-flags-calisthenics-exercise-tutorial)

Exercise references include [ACE](https://www.acefitness.org/resources/everyone/exercise-library/188/seated-chest-press/), [NSCA](https://www.nsca.com/education/articles/kinetic-select/romanian-deadlift-rdl/) and [Technogym](https://www.technogym.com/en-GB/product/pure-strength-hip-thrust_MG80.html).

## Back up or move devices

Open **More → Backup** and save the JSON backup using Android’s file picker. On the receiving device, select the file and confirm restoring the journal. Backups contain routines, history, the active workout, body measurements, equipment and preferences. The desktop preview has its own storage and uses the same backup format.

## Build and test

Open the directory containing `settings.gradle` in Android Studio. The project uses Gradle 8.9, JDK 17 and Android SDK 35. Run it on an emulator or a connected Android 8+ device with a current WebView or Chrome. The journal and UI are in `app/src/main/assets`. The native WebView, file picker and update channel are under `app/src/main/java/pl/rozstaw/app`.

```sh
node --test "tests/*.test.cjs" "ci/*.test.mjs"
node tests/qa-browser.cjs
./gradlew :app:testDebugUnitTest :app:lintDebug :app:assembleDebug :app:assembleRelease
```

Use Node.js 24 for the test suite. Set `ROZSTAW_BROWSER` to your Chromium executable if needed. The browser tests use a temporary profile and their own journal.

## Contributing and releases

Use English for branch names, commits, PR titles and release notes. Use Conventional Commits for new changes, for example `feat(import): match exercise aliases` or `fix(atlas): align muscle regions`. Open a pull request against `master`. The owner approves merges after the required **master-checks** job passes. On the merged commit GitHub builds an unsigned APK. The owner's Windows computer verifies its origin, signs it locally and publishes the release on its next online check. [Maintainer guide](admin/README.md)

Barlow Condensed is distributed under the [SIL Open Font License](app/src/main/assets/assets/OFL-BarlowCondensed.txt). The header photograph was generated with ImageGen.

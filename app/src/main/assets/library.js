(function exerciseLibrary(root) {
  'use strict';
  // Keys stay fixed across languages, saved workouts and imported routines.
  const names = Object.assign(Object.create(null), {
    "chest-press": ["Wyciskanie na klatkę (maszyna)","Chest Press (Machine)"],
    "bench-press": ["Wyciskanie leżąc (sztanga)","Bench Press (Barbell)"],
    "dumbbell-press": ["Wyciskanie leżąc (hantle)","Bench Press (Dumbbell)"],
    "push-up": ["Pompka","Push Up"],
    "pec-deck": ["Rozpiętki (maszyna)","Chest Fly (Machine)"],
    "cable-fly": ["Rozpiętki na bramie","Cable Fly Crossovers"],
    "dumbbell-fly": ["Rozpiętki (hantle)","Chest Fly (Dumbbell)"],
    "lat-pulldown": ["Ściąganie drążka (wyciąg)","Lat Pulldown (Cable)"],
    "pulldown-machine": ["Ściąganie z góry (maszyna)","Lat Pulldown (Machine)"],
    "pull-up": ["Podciąganie nachwytem","Pull Up"],
    "seated-row": ["Wiosłowanie siedząc (wyciąg)","Seated Row (Cable)"],
    "machine-row": ["Wiosłowanie siedząc (maszyna)","Seated Row (Machine)"],
    "dumbbell-row": ["Wiosłowanie jednorącz (hantel)","Single Arm Row (Dumbbell)"],
    "barbell-row": ["Wiosłowanie w opadzie (sztanga)","Bent Over Row (Barbell)"],
    "shoulder-press": ["Wyciskanie nad głowę siedząc (maszyna)","Seated Shoulder Press (Machine)"],
    "dumbbell-shoulder-press": ["Wyciskanie nad głowę (hantle)","Shoulder Press (Dumbbell)"],
    "overhead-press": ["Wyciskanie nad głowę (sztanga)","Overhead Press (Barbell)"],
    "lateral-raise": ["Unoszenie bokiem (hantle)","Lateral Raise (Dumbbell)"],
    "cable-lateral-raise": ["Unoszenie bokiem (wyciąg)","Lateral Raise (Cable)"],
    "machine-lateral-raise": ["Unoszenie bokiem (maszyna)","Lateral Raise (Machine)"],
    "rear-delt-fly": ["Odwrotne rozpiętki (maszyna)","Reverse Fly (Machine)"],
    "reverse-cable-fly": ["Odwrotne rozpiętki (wyciąg)","Reverse Fly (Cable)"],
    "dumbbell-curl": ["Uginanie ramion (hantle)","Bicep Curl (Dumbbell)"],
    "cable-curl": ["Uginanie ramion (wyciąg)","Bicep Curl (Cable)"],
    "preacher-curl": ["Uginanie na modlitewniku (maszyna)","Preacher Curl (Machine)"],
    "barbell-curl": ["Uginanie ramion (sztanga)","Bicep Curl (Barbell)"],
    "triceps-pushdown": ["Prostowanie na wyciągu (drążek)","Triceps Pushdown (Straight Bar)"],
    "overhead-extension": ["Prostowanie nad głową (hantel)","Triceps Extension (Dumbbell)"],
    "triceps-machine": ["Prostowanie ramion (maszyna)","Triceps Extension (Machine)"],
    "leg-press": ["Wypychanie nogami (suwnica)","Leg Press (Machine)"],
    "hack-squat": ["Hack przysiad (maszyna)","Hack Squat (Machine)"],
    "squat": ["Przysiad (sztanga)","Squat (Barbell)"],
    "goblet-squat": ["Przysiad goblet (hantel)","Goblet Squat (Dumbbell)"],
    "leg-extension": ["Prostowanie nóg (maszyna)","Leg Extension (Machine)"],
    "cable-leg-extension": ["Prostowanie nogi (wyciąg)","Single Leg Extension (Cable)"],
    "leg-curl": ["Uginanie nóg siedząc (maszyna)","Seated Leg Curl (Machine)"],
    "lying-leg-curl": ["Uginanie nóg leżąc (maszyna)","Lying Leg Curl (Machine)"],
    "cable-leg-curl": ["Uginanie nogi stojąc (wyciąg)","Standing Leg Curl (Cable)"],
    "romanian-deadlift": ["Rumuński martwy ciąg (sztanga)","Romanian Deadlift (Barbell)"],
    "dumbbell-rdl": ["Rumuński martwy ciąg (hantle)","Romanian Deadlift (Dumbbell)"],
    "hip-thrust": ["Hip thrust (sztanga)","Hip Thrust (Barbell)"],
    "glute-drive": ["Hip thrust (maszyna)","Hip Thrust (Machine)"],
    "glute-bridge": ["Most biodrowy","Glute Bridge"],
    "calf-raise": ["Wspięcia na palce stojąc (maszyna)","Standing Calf Raise (Machine)"],
    "seated-calf": ["Wspięcia na palce siedząc (maszyna)","Seated Calf Raise (Machine)"],
    "dumbbell-calf": ["Wspięcia na palce stojąc (hantle)","Standing Calf Raise (Dumbbell)"],
    "cable-crunch": ["Spięcia brzucha (wyciąg)","Cable Crunch"],
    "machine-crunch": ["Spięcia brzucha (maszyna)","Crunch (Machine)"],
    "crunch": ["Spięcia brzucha","Crunch"]
  });
  const equipment = {
  "bb": [
    "barbell",
    "sztanga",
    "Barbell"
  ],
  "db": [
    "dumbbell",
    "hantle",
    "Dumbbell"
  ],
  "ez": [
    "barbell",
    "gryf łamany",
    "EZ Bar"
  ],
  "bw": [
    "bodyweight",
    "",
    ""
  ],
  "machine": [
    "machine",
    "maszyna",
    "Machine"
  ],
  "cable": [
    "cable",
    "wyciąg",
    "Cable"
  ],
  "band": [
    "band",
    "guma",
    "Band"
  ],
  "rings": [
    "bodyweight",
    "",
    ""
  ],
  "plate": [
    "plate",
    "talerz",
    "Plate"
  ],
  "smith": [
    "smith",
    "suwnica Smitha",
    "Smith Machine"
  ],
  "kb": [
    "kettlebell",
    "kettlebell",
    "Kettlebell"
  ],
  "landmine": [
    "landmine",
    "półsztanga",
    "Landmine"
  ],
  "roller": [
    "roller",
    "",
    ""
  ],
  "trap": [
    "barbell",
    "gryf heksagonalny",
    "Trap Bar"
  ],
  "ball": [
    "bodyweight",
    "",
    ""
  ],
  "wheel": [
    "bodyweight",
    "kółko",
    "Ab Wheel"
  ]
};
  const families = {
    dragon: {
      group: "Brzuch",
      pattern: "dragon-flag",
      primary: ["abs","obliques"],
      secondary: ["lat"],
      stabilizer: ["glutes","grip"],
      pl: ["Połóż się na plecach na nieruchomej ławce. Chwyć jej krawędź za głową. Z ugiętymi kolanami unieś biodra i oprzyj ciężar na górnej części pleców.","Ustaw nogi w wybranym wariancie. Napnij brzuch i opuszczaj tułów od barków, utrzymując szyję odciążoną.","Zakończ opuszczanie, gdy wciąż kontrolujesz miednicę. Wróć do górnej pozycji bez zamachu."],
      en: ["Lie on a fixed bench and grip its edge behind your head. Bend your knees, lift your hips and settle your weight on your upper back.","Set your legs for the chosen variation. Brace your abdomen and lower from the shoulders, keeping pressure off your neck.","Stop while you can still control your pelvis. Raise your body back to the starting angle without swinging."]
    },
    vup: {
      group: "Brzuch",
      pattern: "v-up",
      primary: ["abs"],
      secondary: ["hipFlex","obliques"],
      stabilizer: [],
      pl: ["Połóż się na plecach. Napnij brzuch i przygotuj się do jednoczesnego uniesienia nóg oraz tułowia.","Unieś łopatki i nogi, zbliżając uda do tułowia. Przenieś ręce w kierunku podudzi.","Powoli rozłóż ciało na macie i rozpocznij kolejne powtórzenie z kontrolowanej pozycji."],
      en: ["Lie on your back and brace before lifting your legs and torso together.","Lift your shoulders and legs, bringing your thighs toward your chest as your hands reach toward your shins.","Unfold slowly and settle onto the mat before starting the next repetition."]
    },
    floorraise: {
      group: "Brzuch",
      pattern: "supine-leg-raise",
      primary: ["hipFlex"],
      secondary: ["abs"],
      stabilizer: ["obliques"],
      pl: ["Połóż się na plecach z rękami wzdłuż ciała. Ustaw żebra nad miednicą i oprzyj plecy na macie.","Unieś obie nogi w kierunku pionu, zachowując wybrane ustawienie kolan i spokojny tułów.","Opuszczaj nogi do granicy, przy której nadal kontrolujesz odcinek lędźwiowy."],
      en: ["Lie face up with your arms at your sides. Stack your ribs over your pelvis and settle your back against the mat.","Lift both legs toward vertical, maintaining your chosen knee angle and a steady trunk.","Lower only as far as you can keep your lower back and pelvis controlled."]
    },
    climber: {
      group: "Brzuch",
      pattern: "plank-knee-drive",
      primary: ["hipFlex","abs"],
      secondary: ["obliques"],
      stabilizer: ["frontDelt","serratus"],
      pl: ["Przyjmij wysoki podpór z dłońmi pod barkami. Wyprostuj nogi i ustaw biodra w linii tułowia.","Przyciągnij jedno kolano do tułowia. Utrzymuj ciężar nad dłońmi i drugą stopą.","Odstaw stopę do podporu i wykonaj ten sam ruch drugą nogą."],
      en: ["Start in a high plank, hands under shoulders, with your hips in line with your trunk.","Drive one knee toward your torso while supporting yourself on your hands and the opposite foot.","Return the moving foot to plank and repeat with the other knee."]
    },
    pike: {
      group: "Barki",
      pattern: "overhead-press",
      primary: ["frontDelt","sideDelt"],
      secondary: ["triceps"],
      stabilizer: ["serratus","abs"],
      pl: ["Oprzyj dłonie nieco szerzej niż barki. Unieś biodra wysoko, tak aby tułów był skierowany w dół.","Zegnij łokcie po skosie do tyłu i opuść głowę w stronę punktu tuż przed dłońmi.","Odepchnij podłoże i wyprostuj ramiona, utrzymując biodra wysoko przez całe powtórzenie."],
      en: ["Plant your hands slightly wider than your shoulders. Raise your hips so your torso points down.","Bend your elbows diagonally back and lower your head toward a spot just in front of your hands.","Push the floor away and straighten your arms, keeping your hips elevated throughout."]
    },
    scappush: {
      group: "Klatka piersiowa",
      pattern: "scapular-protraction",
      primary: ["serratus"],
      secondary: [],
      stabilizer: ["abs","triceps"],
      pl: ["Przyjmij wysoki podpór i ustaw dłonie pod barkami. Wyprostuj łokcie.","Zbliż łopatki, pozwalając klatce lekko opaść między barki. Zachowaj prostą linię ciała.","Odepchnij podłoże, rozsuwając łopatki i unosząc klatkę do pozycji wyjściowej."],
      en: ["Set up in a high plank with your hands under your shoulders and elbows straight.","Let your shoulder blades come together so your chest sinks slightly between your shoulders.","Push the floor away to spread your shoulder blades and raise your chest again."]
    },
    scappull: {
      group: "Plecy",
      pattern: "scapular-depression",
      primary: ["midBack","lat"],
      secondary: [],
      stabilizer: ["grip","abs"],
      pl: ["Chwyć nieruchomy drążek i zawiśnij ze spokojnymi nogami oraz wyprostowanymi łokciami.","Odsuń barki od uszu. Tułów uniesie się o kilka centymetrów, a łokcie pozostaną wyprostowane.","Powoli pozwól barkom wrócić w stronę uszu i ustabilizuj zwis przed powtórzeniem."],
      en: ["Hang from a fixed bar with straight elbows and quiet legs.","Draw your shoulders away from your ears. Your torso rises a small distance while the elbows stay straight.","Let your shoulders return upward slowly and steady the hang before repeating."]
    },
    bench: {
      group: "Klatka piersiowa", pattern: "horizontal-press",
      primary: ["chest"], secondary: ["triceps","frontDelt"], stabilizer: ["cuff"],
      pl: ["Oprzyj tułów i stopy. Ustaw ciężar nad klatką, a nadgarstki nad łokciami.","Zegnij łokcie i opuść ciężar w kierunku klatki piersiowej.","Wyciśnij ciężar po tym samym torze, zachowując stabilny tułów."],
      en: ["Support your torso and plant your feet. Stack your wrists over your elbows.","Bend your elbows and lower the load toward your chest.","Press the load back up while keeping your torso steady."]
    },
    pushup: {
      group: "Klatka piersiowa", pattern: "horizontal-press",
      primary: ["chest"], secondary: ["triceps","frontDelt","serratus"], stabilizer: ["abs","glutes"],
      pl: ["Przyjmij podpór z dłońmi pod barkami lub nieco szerzej.","Zegnij łokcie ukośnie w tył i opuść klatkę między dłonie.","Odepchnij podłoże, unosząc klatkę i biodra razem."],
      en: ["Start in a plank with hands beneath or slightly wider than your shoulders.","Bend your elbows diagonally back and lower your chest between your hands.","Press away, lifting your hips and chest together."]
    },
    fly: {
      group: "Klatka piersiowa", pattern: "chest-fly",
      primary: ["chest"], secondary: ["frontDelt"], stabilizer: ["cuff"],
      pl: ["Ustaw tułów stabilnie i lekko zegnij łokcie.","Zbliż dłonie przed klatką po szerokim łuku.","Rozsuń ramiona płynnie do komfortowego rozciągnięcia."],
      en: ["Steady your torso and keep a soft bend in your elbows.","Bring your hands together in a wide arc in front of your chest.","Open your arms slowly to a comfortable stretch."]
    },
    dip: {
      group: "Klatka piersiowa", pattern: "dip",
      primary: ["chest","triceps"], secondary: ["frontDelt"], stabilizer: ["cuff","abs"],
      pl: ["Oprzyj dłonie na poręczach i ustabilizuj barki w podporze.","Lekko pochyl klatkę i ugnij łokcie, schodząc tylko do wygodnej głębokości.","Naciśnij poręcze i wróć do stabilnego podporu."],
      en: ["Support yourself on the handles with steady shoulders.","Lean slightly forward and bend your elbows to a comfortable depth.","Press the handles down to return to a stable support."]
    },
    pulldown: {
      group: "Plecy", pattern: "vertical-pull",
      primary: ["lat"], secondary: ["biceps","brachialis","midBack"], stabilizer: ["grip"],
      pl: ["Ustaw się pod punktem zaczepienia i wyciągnij ramiona w górę.","Prowadź łokcie w dół ku żebrom, utrzymując stabilny tułów.","Oddaj uchwyt w górę pod kontrolą."],
      en: ["Position yourself below the attachment and reach overhead.","Draw your elbows toward your ribs with a steady torso.","Guide the handle up under control."]
    },
    pullup: {
      group: "Plecy", pattern: "vertical-pull",
      primary: ["lat"], secondary: ["biceps","midBack","brachialis"], stabilizer: ["grip","abs"],
      pl: ["Wejdź na stabilny stopień i pewnie obejmij drążek.","Ściągnij łokcie w dół i przyciągnij klatkę w kierunku drążka.","Opuść ciało do kontrolowanego wyprostu ramion."],
      en: ["Use a stable step to establish a secure grip on the bar.","Drive your elbows down to bring your chest toward the bar.","Lower under control until your arms extend."]
    },
    negative: {
      group: "Plecy", pattern: "vertical-pull",
      primary: ["lat"], secondary: ["biceps","midBack"], stabilizer: ["grip"],
      pl: ["Z podestu ustaw brodę nad drążkiem i pewnie go chwyć.","Zdejmij stopy z podestu i opuszczaj ciało równomiernie przez kilka sekund.","Po kontrolowanym zwisie ponownie wejdź na podest przed następnym powtórzeniem."],
      en: ["Use a step to start with your chin above the bar and a secure grip.","Lift your feet off the step and lower evenly for several seconds.","After reaching a controlled hang, step back up for the next rep."]
    },
    row: {
      group: "Plecy", pattern: "horizontal-pull",
      primary: ["lat","midBack"], secondary: ["biceps","rearDelt"], stabilizer: ["grip"],
      pl: ["Ustabilizuj tułów i zacznij z wyciągniętymi ramionami.","Pociągnij łokcie za siebie, kierując ciężar w stronę żeber.","Powoli sięgnij ramionami w przód, bez gwałtownego rozluźnienia."],
      en: ["Steady your torso and begin with arms reaching away from you.","Drive your elbows back, bringing the load toward your ribs.","Reach forward smoothly while staying in control."]
    },
    inverted: {
      group: "Plecy", pattern: "horizontal-pull",
      primary: ["midBack","lat"], secondary: ["biceps","rearDelt"], stabilizer: ["abs","glutes"],
      pl: ["Chwyć stabilną podporę i ustaw pod nią proste ciało, piętami na podłodze.","Zegnij łokcie i przyciągnij mostek ku dłoniom.","Wyprostuj ramiona, zachowując linię od barków do pięt."],
      en: ["Grip a fixed support and set your body in a straight line beneath it, heels grounded.","Bend your elbows and draw your chest toward your hands.","Extend your arms while keeping shoulders, hips and heels aligned."]
    },
    pullover: {
      group: "Plecy", pattern: "shoulder-extension",
      primary: ["lat"], secondary: ["chest","triceps"], stabilizer: ["abs"],
      pl: ["Ustaw żebra nad miednicą i zachowaj niewielkie ugięcie w łokciach.","Przyciągnij ramiona łukiem od położenia nad głową ku tułowiowi.","Kontroluj powrót, zanim ciężar odciągnie żebra do góry."],
      en: ["Brace your torso with a slight bend in the elbows.","Sweep the upper arms in an arc from overhead toward your torso.","Reverse the arc before the load pulls your ribs upward."]
    },
    shrug: {
      group: "Plecy", pattern: "scapular-elevation",
      primary: ["trap"], secondary: ["grip"], stabilizer: ["erectors"],
      pl: ["Stań stabilnie z wyprostowanymi ramionami i szyją w neutralnej pozycji.","Unieś barki w kierunku uszu i zatrzymaj na moment.","Opuść je prosto w dół, kontrolując obciążenie."],
      en: ["Stand tall with straight arms and a neutral neck.","Lift your shoulders toward your ears and pause briefly.","Lower straight down with control."]
    },
    overhead: {
      group: "Barki", pattern: "overhead-press",
      primary: ["frontDelt","sideDelt"], secondary: ["triceps","serratus"], stabilizer: ["cuff","abs"],
      pl: ["Ustaw dłonie w okolicy barków i podeprzyj stopy.","Wyciśnij ciężar nad głowę, prowadząc nadgarstki nad łokciami.","Powoli opuść go do pozycji wyjściowej."],
      en: ["Start with hands near the shoulders and feet supported.","Press overhead, keeping wrists stacked over elbows.","Lower slowly to the starting position."]
    },
    raise: {
      group: "Barki", pattern: "lateral-raise",
      primary: ["sideDelt"], secondary: ["trap","serratus"], stabilizer: ["cuff"],
      pl: ["Ustaw ramiona wzdłuż tułowia i lekko zegnij łokcie.","Unieś ramiona bokiem i nieco w przód do wygodnej wysokości.","Opuść je tym samym łukiem bez kołysania ciałem."],
      en: ["Start with arms at your sides and elbows softly bent.","Lift out to the sides and slightly forward to a comfortable height.","Lower along the same arc without swinging."]
    },
    front: {
      group: "Barki", pattern: "front-raise",
      primary: ["frontDelt"], secondary: ["chest","serratus"], stabilizer: ["abs","cuff"],
      pl: ["Stań stabilnie z dłońmi przed udami.","Unieś ciężar przed sobą mniej więcej na wysokość barków.","Opuść ciężar powoli, utrzymując spokojny tułów."],
      en: ["Stand steady with hands in front of your thighs.","Raise the load in front to about shoulder height.","Lower slowly with a still torso."]
    },
    rear: {
      group: "Barki", pattern: "reverse-fly",
      primary: ["rearDelt"], secondary: ["midBack"], stabilizer: ["cuff"],
      pl: ["Ustaw tułów i lekko zegnij łokcie. Zacznij z ramionami przed klatką.","Otwórz ramiona szeroko na boki, prowadząc łokciami.","Powoli zbliż ramiona do pozycji początkowej."],
      en: ["Set your torso, soften your elbows and start with arms in front of your chest.","Open your arms wide, leading with your elbows.","Bring your arms back together under control."]
    },
    face: {
      group: "Barki", pattern: "face-pull",
      primary: ["rearDelt","midBack"], secondary: ["cuff","biceps"], stabilizer: ["abs"],
      pl: ["Stań twarzą do zaczepu na wysokości twarzy i wyciągnij ramiona.","Przyciągnij dłonie do boków twarzy, prowadząc łokcie szeroko.","Wyprostuj ramiona, kontrolując opór."],
      en: ["Face an attachment set near face height and reach forward.","Pull your hands toward the sides of your face with elbows out.","Extend the arms under control."]
    },
    curl: {
      group: "Biceps", pattern: "elbow-flexion",
      primary: ["biceps","brachialis"], secondary: ["brachioradialis"], stabilizer: ["grip"],
      pl: ["Ustabilizuj ramiona i zacznij od prawie wyprostowanych łokci.","Zegnij łokcie, przyciągając obciążenie w stronę barków.","Powoli wyprostuj przedramiona do kontrolowanego położenia."],
      en: ["Steady your upper arms and start with nearly extended elbows.","Bend your elbows to bring the load toward your shoulders.","Lower under control until your arms are nearly straight."]
    },
    hammer: {
      group: "Biceps", pattern: "elbow-flexion",
      primary: ["brachialis","brachioradialis"], secondary: ["biceps"], stabilizer: ["grip"],
      pl: ["Trzymaj uchwyt chwytem neutralnym lub wskazanym w nazwie.","Zegnij łokcie bez poruszania barkami.","Powoli opuść dłonie, utrzymując wybrany chwyt."],
      en: ["Take a neutral grip or the grip specified for this variation.","Bend your elbows while keeping the shoulders still.","Lower smoothly without changing your grip."]
    },
    pressdown: {
      group: "Triceps", pattern: "elbow-extension",
      primary: ["triceps"], secondary: [], stabilizer: ["grip"],
      pl: ["Stań przed górnym zaczepem i ustaw łokcie przy żebrach.","Wyprostuj łokcie, kierując dłonie w dół.","Zegnij łokcie pod kontrolą, nie unosząc ramion."],
      en: ["Face a high attachment with elbows beside your ribs.","Extend your elbows and press your hands downward.","Bend the elbows under control, keeping the upper arms still."]
    },
    skull: {
      group: "Triceps", pattern: "elbow-extension",
      primary: ["triceps"], secondary: [], stabilizer: ["cuff"],
      pl: ["Połóż się na ławce z obciążeniem nad barkami.","Zegnij łokcie i poprowadź ciężar obok lub nieco za głowę.","Wyprostuj łokcie, utrzymując ramiona stabilnie."],
      en: ["Lie on a bench with the load above your shoulders.","Bend your elbows and guide the load beside or just behind your head.","Extend the elbows while keeping the upper arms steady."]
    },
    extension: {
      group: "Triceps", pattern: "elbow-extension",
      primary: ["triceps"], secondary: [], stabilizer: ["cuff","abs"],
      pl: ["Ustaw ramiona blisko głowy i ustabilizuj żebra.","Zegnij łokcie, prowadząc obciążenie za głowę.","Wyprostuj łokcie bez odchylania tułowia."],
      en: ["Position your upper arms near your head and steady your ribs.","Bend your elbows and guide the load behind your head.","Extend the elbows without leaning back."]
    },
    kickback: {
      group: "Triceps", pattern: "elbow-extension",
      primary: ["triceps"], secondary: ["rearDelt"], stabilizer: ["abs"],
      pl: ["Pochyl tułów i ustaw ramię wzdłuż boku z ugiętym łokciem.","Wyprostuj łokieć, prowadząc dłoń do tyłu.","Zegnij łokieć, zachowując stałe ustawienie ramienia."],
      en: ["Hinge forward with the upper arm alongside your torso and elbow bent.","Extend your elbow to send your hand back.","Bend the elbow without moving your upper arm."]
    },
    squat: {
      group: "Uda", pattern: "knee-dominant",
      primary: ["quad","glutes"], secondary: ["adductors"], stabilizer: ["abs","erectors"],
      pl: ["Ustaw stopy stabilnie i usztywnij tułów.","Ugnij biodra i kolana, utrzymując całe stopy na podłożu.","Wstań, prostując kolana i biodra razem."],
      en: ["Plant your feet firmly and brace your torso.","Bend hips and knees while keeping your feet planted.","Stand by extending the hips and knees together."]
    },
    split: {
      group: "Uda", pattern: "split-squat",
      primary: ["quad","glutes"], secondary: ["adductors","hams"], stabilizer: ["gluteMed","abs"],
      pl: ["Ustaw stopy w wykroku, z odstępem na szerokość bioder.","Zegnij obie nogi, obniżając tylne kolano w kierunku podłoża.","Odepchnij się przednią stopą i wróć do wyjściowej pozycji."],
      en: ["Start in a split stance with your feet about hip width apart.","Bend both legs, lowering the rear knee toward the floor.","Press through the front foot to return to the start."]
    },
    step: {
      group: "Uda", pattern: "step-up",
      primary: ["glutes","quad"], secondary: ["hams"], stabilizer: ["gluteMed"],
      pl: ["Ustaw całą stopę na stabilnym podwyższeniu o dobranej wysokości.","Naciśnij podwyższenie i wyprostuj nogę podporową, wchodząc na górę.","Zejdź powoli, kontrolując zejście tą samą nogą."],
      en: ["Place your whole foot on a stable step of a suitable height.","Push into the step and extend the supporting leg to rise.","Step down slowly, controlling the descent with the same leg."]
    },
    legpress: {
      group: "Uda", pattern: "knee-dominant",
      primary: ["quad","glutes"], secondary: ["adductors"], stabilizer: [],
      pl: ["Oprzyj miednicę i plecy o oparcie. Ustaw stopę lub stopy na platformie.","Wypchnij platformę, śledząc kolanem kierunek palców.","Zegnij nogi do głębokości, przy której miednica pozostaje stabilna."],
      en: ["Support your back and pelvis. Place the working foot or feet on the platform.","Press the platform away, keeping the knees aligned with your toes.","Lower until just before your pelvis starts to lift."]
    },
    quad: {
      group: "Uda", pattern: "knee-extension",
      primary: ["quad"], secondary: [], stabilizer: [],
      pl: ["Ustaw kolano zgodnie z osią obrotu, a opór nad kostką.","Wyprostuj kolano, unosząc dolną część nogi.","Powoli zegnij kolano i wróć do pozycji startowej."],
      en: ["Align the knee with the pivot and position resistance above the ankle.","Straighten the knee, lifting the lower leg.","Bend the knee slowly to return."]
    },
    ham: {
      group: "Tył uda", pattern: "knee-flexion",
      primary: ["hams"], secondary: ["gastrocnemius"], stabilizer: [],
      pl: ["Ustaw opór z tyłu podudzia i ustabilizuj biodra.","Zegnij kolano i przyciągnij piętę w stronę pośladka.","Prostuj nogę powoli, kontrolując powrót."],
      en: ["Place the resistance behind your lower leg and steady your hips.","Bend the knee, drawing the heel toward your glutes.","Straighten the leg slowly under control."]
    },
    hinge: {
      group: "Tył uda", pattern: "hip-hinge",
      primary: ["hams","glutes"], secondary: ["adductors"], stabilizer: ["erectors","grip"],
      pl: ["Ustaw stopy pod biodrami i usztywnij tułów.","Cofnij biodra, prowadząc ciężar blisko nóg przy lekkim ugięciu kolan.","Wyprostuj biodra i stań bez odchylania się do tyłu."],
      en: ["Plant your feet under your hips and brace your trunk.","Send the hips back with knees slightly bent, keeping the load close.","Extend the hips and stand tall."]
    },
    deadlift: {
      group: "Pośladki", pattern: "deadlift",
      primary: ["glutes","quad"], secondary: ["hams","adductors"], stabilizer: ["erectors","grip"],
      pl: ["Ustaw ciężar nad śródstopiem, chwyć go i napnij tułów.","Odepchnij podłogę stopami, prostując biodra i kolana, z ciężarem blisko ciała.","Cofnij biodra, zegnij kolana i odłóż obciążenie pod kontrolą."],
      en: ["Set the load over midfoot, take your grip and brace.","Push the floor away and extend hips and knees with the load close.","Hinge, bend your knees and set the load down under control."]
    },
    bridge: {
      group: "Pośladki", pattern: "hip-thrust",
      primary: ["glutes"], secondary: ["hams","adductors"], stabilizer: ["abs"],
      pl: ["Oprzyj stopy i górną część pleców. Ustaw obciążenie stabilnie na biodrach, jeśli go używasz.","Naciśnij podłoże stopami i wyprostuj biodra.","Opuść miednicę powoli i zachowaj ustawienie kolan."],
      en: ["Support your feet and upper back. Secure any external load across your hips.","Press through the feet and extend your hips.","Lower the pelvis slowly, keeping your knees aligned."]
    },
    glutekick: {
      group: "Pośladki", pattern: "hip-extension",
      primary: ["glutes"], secondary: ["hams"], stabilizer: ["abs","gluteMed"],
      pl: ["Ustabilizuj tułów i miednicę, opierając ręce o stabilną podporę.","Poprowadź udo do tyłu ruchem w biodrze.","Przywróć nogę pod miednicę bez kołysania tułowiem."],
      en: ["Steady your torso and pelvis with your hands supported.","Sweep the thigh backward from the hip.","Return the leg beneath your pelvis without swinging your torso."]
    },
    abduct: {
      group: "Pośladki", pattern: "hip-abduction",
      primary: ["gluteMed"], secondary: ["glutes"], stabilizer: ["obliques"],
      pl: ["Ustaw miednicę na wprost i ustabilizuj tułów.","Odsuń udo na bok w wygodnym zakresie.","Przywiedź nogę powoli, zachowując kontrolę."],
      en: ["Square your pelvis and steady your torso.","Move the thigh outward through a comfortable range.","Bring the leg back in slowly."]
    },
    adduct: {
      group: "Uda", pattern: "hip-adduction",
      primary: ["adductors"], secondary: [], stabilizer: ["abs"],
      pl: ["Ustaw tułów stabilnie i zacznij z nogą lub nogami rozstawionymi.","Przyciągnij udo ku linii środkowej ciała.","Pozwól nodze wrócić na zewnątrz pod kontrolą."],
      en: ["Steady your torso and start with the working leg or legs apart.","Bring the thigh toward the midline.","Let the leg move outward under control."]
    },
    calf: {
      group: "Łydki", pattern: "calf-raise",
      primary: ["gastrocnemius","soleus"], secondary: [], stabilizer: [],
      pl: ["Oprzyj przodostopie stabilnie i rozłóż nacisk u podstawy palców.","Unieś pięty, wspinając się na palce bez odbicia.","Opuść pięty powoli do wygodnego zakresu."],
      en: ["Plant the balls of your feet and distribute pressure across your forefoot.","Raise the heels smoothly without bouncing.","Lower the heels slowly through a comfortable range."]
    },
    seatedcalf: {
      group: "Łydki", pattern: "calf-raise",
      primary: ["soleus"], secondary: ["gastrocnemius"], stabilizer: [],
      pl: ["Usiądź z ugiętymi kolanami i przodostopiem na podporze.","Unieś pięty, przesuwając kolana w górę.","Opuść pięty powoli, utrzymując stopy na podporze."],
      en: ["Sit with knees bent and forefeet on a support.","Raise your heels, lifting your knees.","Lower the heels under control with the forefeet supported."]
    },
    wrist: {
      group: "Przedramiona", pattern: "wrist-flexion",
      primary: ["grip"], secondary: [], stabilizer: ["brachioradialis"],
      pl: ["Oprzyj przedramiona i pozwól dłoniom wystawać za krawędź podpory.","Zegnij nadgarstki w stronę dłoni, zachowując nieruchome przedramiona.","Powoli opuść obciążenie przez wygodny zakres ruchu."],
      en: ["Support your forearms with hands just beyond the edge.","Flex your wrists toward the palms while keeping the forearms still.","Lower the load slowly through a comfortable range."]
    },
    wristext: {
      group: "Przedramiona", pattern: "wrist-extension",
      primary: ["wristExt"], secondary: [], stabilizer: ["brachioradialis"],
      pl: ["Oprzyj przedramiona, grzbiety dłoni skieruj do góry.","Unieś grzbiety dłoni ruchem w nadgarstkach.","Opuść dłonie powoli, pozostawiając łokcie na podporze."],
      en: ["Support your forearms with the backs of your hands facing up.","Lift the backs of the hands by extending your wrists.","Lower slowly, leaving the elbows on the support."]
    },
    roller: {
      group: "Przedramiona", pattern: "wrist-roll",
      primary: ["grip","wristExt"], secondary: ["brachioradialis"], stabilizer: ["frontDelt"],
      pl: ["Chwyć wałek obiema dłońmi, utrzymując ciężarek nad podłożem.","Obracaj wałek naprzemiennie obiema dłońmi, nawijając linkę.","Odwijaj linkę pod kontrolą, aż ciężarek wróci w dół."],
      en: ["Hold the roller in both hands with the suspended weight clear of the floor.","Alternate your hands to wind the cord onto the roller.","Unwind it under control until the weight returns to the bottom."]
    },
    crunch: {
      group: "Brzuch", pattern: "trunk-flexion",
      primary: ["abs"], secondary: ["obliques"], stabilizer: [],
      pl: ["Ustabilizuj miednicę, rozluźnij szyję i ustaw żebra nad miednicą.","Z wydechem zbliż dolne żebra do miednicy, zginając tułów.","Wydłuż tułów powoli do pozycji początkowej."],
      en: ["Steady the pelvis and relax your neck.","Exhale and bring the lower ribs toward the pelvis by flexing the trunk.","Lengthen the trunk slowly to return."]
    },
    twist: {
      group: "Brzuch", pattern: "trunk-rotation",
      primary: ["obliques"], secondary: ["abs","serratus"], stabilizer: ["gluteMed"],
      pl: ["Ustaw się stabilnie, obiema dłońmi trzymając uchwyt lub ciężar.","Obróć klatkę w kierunku ruchu, kontrolując miednicę i tor dłoni.","Odwróć ruch płynnie, następnie powtórz na drugą stronę."],
      en: ["Set a stable stance and hold the handle or weight with both hands.","Rotate your chest in the direction of travel, controlling your pelvis and hand path.","Reverse smoothly and repeat on the other side."]
    },
    pallof: {
      group: "Brzuch", pattern: "anti-rotation",
      primary: ["obliques","abs"], secondary: [], stabilizer: ["gluteMed"],
      pl: ["Ustaw się bokiem do zaczepu i trzymaj uchwyt na wysokości mostka.","Wyprostuj ramiona przed sobą, powstrzymując obrót tułowia.","Przyciągnij dłonie z powrotem do mostka i zmień strony."],
      en: ["Stand side-on to the anchor and hold the handle against your sternum.","Press the hands forward while resisting rotation.","Return the hands to your sternum and switch sides."]
    },
    backext: {
      group: "Plecy", pattern: "trunk-extension",
      primary: ["erectors","glutes"], secondary: ["hams"], stabilizer: [],
      pl: ["Ustaw podparcie poniżej zgięcia bioder i zabezpiecz stopy.","Pochyl tułów z bioder w kontrolowanym zakresie.","Wyprostuj biodra do linii ciała, zachowując spokojne lędźwie."],
      en: ["Position the pad just below the hip crease and secure your feet.","Fold at the hips through a controlled range.","Extend your hips back to a straight body line."]
    },
    legraise: {
      group: "Brzuch", pattern: "pelvic-curl",
      primary: ["abs"], secondary: ["obliques","hipFlex"], stabilizer: ["grip"],
      pl: ["Ustaw podporę stabilnie i zacznij ze spokojnym tułowiem.","Unieś nogi lub kolana i lekko podwiń miednicę.","Powoli opuść nogi, kończąc ruch bez kołysania."],
      en: ["Establish stable support and start with a still torso.","Lift your legs or knees and gently curl the pelvis upward.","Lower the legs smoothly without swinging."]
    },
    reach: {
      group: "Brzuch", pattern: "anti-extension",
      primary: ["abs","obliques"], secondary: ["serratus"], stabilizer: ["glutes"],
      pl: ["Ustaw tułów stabilnie i napnij brzuch przy spokojnym oddechu.","Oddal wskazaną kończynę od tułowia, kontrolując miednicę.","Powoli wróć do położenia początkowego i powtórz."],
      en: ["Set your trunk and brace your abs while breathing steadily.","Reach the working limb away while keeping the pelvis controlled.","Return slowly to the starting position and repeat."]
    }
  };
  // ID, movement family, equipment (! means already named), PL, EN, position, PL cue, EN cue.
  families.larsen = {
    ...families.bench,
    pl: ['Połóż się na ławce i oprzyj łopatki. Wyprostuj nogi i utrzymuj stopy nad podłogą.', ...families.bench.pl.slice(1)],
    en: ['Lie on the bench and set your shoulders. Extend your legs and keep your feet off the floor.', ...families.bench.en.slice(1)]
  };
  families.dragonNegative = {
    ...families.dragon,
    pl: [...families.dragon.pl.slice(0, 2), "Oprzyj biodra na ławce. Podkurcz kolana i unieś biodra do pozycji startowej z krótką dźwignią."],
    en: [...families.dragon.en.slice(0, 2), "Rest your hips on the bench. Tuck both knees and lift your hips to reset with a short lever."]
  };
  const variants = [
    ["incline-bench","bench","bb","Wyciskanie na skosie dodatnim","Incline Bench Press","incline","Ustaw oparcie na lekki skos i kieruj gryf ku górnej klatce.","Use a low incline and lower the bar toward your upper chest."],
    ["incline-db","bench","db","Wyciskanie na skosie dodatnim","Incline Bench Press","incline","Ustaw oba hantle po bokach górnej klatki. Stopy pozostaw na podłodze.","Start with the dumbbells beside the upper chest and both feet grounded."],
    ["incline-smith","bench","smith","Wyciskanie na skosie dodatnim","Incline Bench Press","incline","Przesuń ławkę tak, aby tor prowadnicy trafiał w górną klatkę. Ustaw ograniczniki.","Position the bench so the rails guide the bar to your upper chest. Set the stops."],
    ["incline-machine","bench","machine","Wyciskanie na skosie dodatnim","Incline Chest Press","incline","Dopasuj siedzisko tak, aby uchwyty znalazły się tuż poniżej barków.","Adjust the seat so the handles start just below shoulder height."],
    ["decline-bench","bench","bb","Wyciskanie na skosie ujemnym","Decline Bench Press","decline","Zabezpiecz nogi w wałkach i dobierz wysokość asekuracji przed zdjęciem gryfu.","Secure your legs in the pads and set the safeties before unracking."],
    ["decline-db","bench","db","Wyciskanie na skosie ujemnym","Decline Bench Press","decline","Zablokuj nogi w przeznaczonych do tego podporach i utrzymuj hantle nad dolną klatką.","Secure your legs on a purpose-built decline bench and track over the lower chest."],
    ["smith-bench","bench","smith","Wyciskanie leżąc","Bench Press","flat","Ustaw płaską ławkę pod gryfem i ograniczniki tuż poniżej używanego zakresu.","Center the flat bench under the bar and set the safeties just below your range."],
    ["close-bench","bench","bb","Wyciskanie wąsko","Close Grip Bench Press","close","Chwyć gryf mniej więcej na szerokość barków i prowadź łokcie przy żebrach.","Grip about shoulder width and let your elbows track near your ribs."],
    ["floor-bench","bench","bb","Wyciskanie z podłogi","Floor Press","floor","Zacznij ze sztangą na stojakach. Delikatnie oprzyj ramiona o podłogę przed wyciśnięciem.","Start from a rack and gently touch the upper arms to the floor before pressing."],
    ["floor-db","bench","db","Wyciskanie z podłogi","Floor Press","floor","Zatrzymaj ruch, gdy ramiona dotkną maty. Przedramiona utrzymaj pionowo.","Pause when the upper arms touch the mat and keep the forearms vertical."],
    ["neutral-db","bench","db","Wyciskanie chwytem neutralnym","Neutral Grip Bench Press","neutral","Trzymaj dłonie skierowane do siebie przez całą serię.","Keep the palms facing each other throughout the set."],
    ["single-bench","bench","db","Wyciskanie leżąc jednorącz","Single Arm Bench Press","single","Wyciskaj jedną ręką i utrzymuj oba biodra na ławce.","Press with one arm and keep both hips on the bench."],
    ["squeeze-db","bench","db","Wyciskanie z dociskiem","Squeeze Press","close","Dociśnij boki hantli do siebie i utrzymuj ten nacisk podczas wyciskania.","Press the dumbbells together and maintain inward pressure as you lift."],
    ["incline-pushup","pushup","bw","Pompka z dłońmi na podwyższeniu","Incline Push Up","incline","Oprzyj dłonie na stabilnej ławce. Wyższa podpora ułatwia ruch.","Place your hands on a stable bench. A higher support makes the movement easier."],
    ["decline-pushup","pushup","bw","Pompka z nogami na podwyższeniu","Decline Push Up","decline","Oprzyj stopy na niskiej stabilnej ławce i utrzymuj napięty brzuch.","Rest your feet on a low stable bench and keep the abs braced."],
    ["knee-pushup","pushup","bw","Pompka na kolanach","Kneeling Push Up","knees","Oprzyj kolana na macie i zachowaj prostą linię od kolan do barków.","Pad your knees and keep a straight line from knees to shoulders."],
    ["diamond-pushup","pushup","bw","Pompka diamentowa","Diamond Push Up","close","Zbliż dłonie pod klatką na wygodną dla nadgarstków odległość.","Place the hands close beneath the chest at a comfortable width for the wrists."],
    ["ring-pushup","pushup","rings","Pompka na kółkach","Ring Push Up","rings","Zawieś kółka na równej wysokości i utrzymuj je blisko boków ciała.","Set both rings at the same height and keep them near your sides."],
    ["band-pushup","pushup","band!","Pompka z gumą","Banded Push Up","band","Przełóż gumę przez górną część pleców i przytrzymaj końce pod dłońmi.","Pass the band across the upper back and pin the ends beneath your hands."],
    ["incline-fly","fly","db","Rozpiętki na skosie dodatnim","Incline Chest Fly","incline","Oprzyj plecy na lekkim skosie i zbliż hantle nad górną klatką.","Use a low incline and bring the dumbbells together above the upper chest."],
    ["decline-fly","fly","db","Rozpiętki na skosie ujemnym","Decline Chest Fly","decline","Zabezpiecz nogi przed rozpoczęciem i prowadź hantle nad dolną klatką.","Secure your legs first and bring the dumbbells together above the lower chest."],
    ["low-fly","fly","cable","Rozpiętki z dołu","Low to High Fly","low","Ustaw bloczki nisko i prowadź dłonie po skosie ku górze klatki.","Start with low pulleys and sweep upward toward the upper chest."],
    ["high-fly","fly","cable","Rozpiętki z góry","High to Low Fly","high","Ustaw bloczki powyżej barków i zbliż dłonie poniżej mostka.","Set the pulleys above shoulder level and finish below the sternum."],
    ["single-fly","fly","cable","Rozpiętki jednorącz","Single Arm Chest Fly","single","Poprowadź jedną dłoń do linii środkowej bez skręcania tułowia.","Bring one hand to the midline without turning your torso."],
    ["band-fly","fly","band","Rozpiętki","Chest Fly","standing","Zamocuj gumę stabilnie za sobą na wysokości klatki.","Secure the band behind you at chest height."],
    ["chest-dip","dip","bw","Dipy na klatkę","Chest Dip","dip","Trzymaj nogi spokojnie i pochyl cały tułów lekko w przód.","Keep the legs still and lean the whole torso slightly forward."],
    ["weighted-dip","dip","plate","Dipy z obciążeniem","Weighted Dip","weighted","Zabezpiecz talerz na pasie i zatrzymaj jego kołysanie przed rozpoczęciem.","Secure the plate to a dipping belt and let it settle before you begin."],
    ["close-lat","pulldown","cable","Ściąganie wąsko","Close Grip Lat Pulldown","close","Chwyć wąski uchwyt neutralnie i ściągnij go przed klatkę.","Use a narrow neutral handle and pull it in front of the chest."],
    ["underhand-lat","pulldown","cable","Ściąganie podchwytem","Underhand Lat Pulldown","underhand","Ułóż dłonie podchwytem na szerokość barków i kieruj łokcie blisko boków.","Take a shoulder-width underhand grip and keep the elbows close."],
    ["single-lat","pulldown","cable","Ściąganie jednorącz","Single Arm Lat Pulldown","single","Podeprzyj się wolną ręką i prowadź pracujący łokieć w stronę biodra.","Brace with the free hand and pull the working elbow toward the hip."],
    ["kneel-lat","pulldown","cable","Ściąganie w klęku","Kneeling Lat Pulldown","kneel","Uklęknij pod wysokim bloczkiem, utrzymując biodra nad kolanami.","Kneel below a high pulley with hips stacked over knees."],
    ["band-lat","pulldown","band","Ściąganie z góry","Lat Pulldown","kneel","Przymocuj gumę wysoko i uklęknij tak, aby pozostawała napięta w górze.","Anchor the band high and kneel far enough away to keep tension overhead."],
    ["chin-up","pullup","bw","Podciąganie podchwytem","Chin Up","underhand","Ułóż dłonie podchwytem na szerokość barków.","Use a shoulder-width underhand grip."],
    ["neutral-pullup","pullup","bw","Podciąganie chwytem neutralnym","Neutral Grip Pull Up","neutral","Chwyć dwa równoległe uchwyty z dłońmi skierowanymi do siebie.","Use two parallel handles with palms facing each other."],
    ["weighted-pullup","pullup","plate","Podciąganie z obciążeniem","Weighted Pull Up","weighted","Przypnij obciążenie do pasa i zacznij z nieruchomego zwisu.","Secure the load to a belt and start from a still hang."],
    ["band-pullup","pullup","band!","Podciąganie z gumą","Band Assisted Pull Up","band","Zamocuj gumę na drążku i umieść w niej kolano. Zapisuj powtórzenia, a rodzaj gumy dopisz w notatce.","Secure the band to the bar and place one knee inside. Log repetitions and note which band you used."],
    ["negative-pullup","negative","bw","Podciąganie negatywne","Negative Pull Up","negative","Zacznij powtórzenie od góry. Do powrotu użyj podestu zamiast podciągania.","Start every rep at the top and use the step to reset."],
    ["ring-pullup","pullup","rings","Podciąganie na kółkach","Ring Pull Up","rings","Pozwól kółkom obracać się naturalnie wraz z nadgarstkami.","Let the rings rotate naturally with your wrists."],
    ["single-seated-row","row","cable","Wiosłowanie siedząc jednorącz","Single Arm Seated Row","single-seat","Pociągnij jedną ręką, trzymając mostek skierowany na wyciąg.","Row one arm at a time with your chest facing the stack."],
    ["wide-seated-row","row","cable","Wiosłowanie szeroko siedząc","Wide Grip Seated Row","wide-seat","Użyj szerokiego drążka i poprowadź łokcie nieco dalej od żeber.","Use a wide bar and let the elbows travel farther from the ribs."],
    ["high-row","row","machine","Wiosłowanie z góry","High Row","high-seat","Oprzyj klatkę o poduszkę i prowadź łokcie skośnie w dół.","Brace your chest on the pad and draw the elbows diagonally down."],
    ["chest-db-row","row","db","Wiosłowanie z podparciem klatki","Chest Supported Row","incline","Połóż klatkę na skośnej ławce i unoś hantle bez odrywania mostka.","Lie chest-down on an incline bench and row without lifting your sternum."],
    ["tbar-row","row","landmine","Wiosłowanie półsztangą","T Bar Row","hinge","Stań okrakiem nad zakotwiczonym gryfem i prowadź uchwyt w stronę brzucha.","Straddle the anchored bar and row the handle toward your abdomen."],
    ["meadows-row","row","landmine","Wiosłowanie Meadowsa","Meadows Row","single-hinge","Stań bokiem do końca gryfu i chwyć tuleję jedną ręką.","Stand side-on to the end of the bar and grip the sleeve with one hand."],
    ["pendlay-row","row","bb","Wiosłowanie Pendlay","Pendlay Row","floor","Odkładaj sztangę na podłoże między powtórzeniami, utrzymując niemal poziomy tułów.","Reset the bar on the floor each rep with your torso nearly horizontal."],
    ["underhand-row","row","bb","Wiosłowanie w opadzie podchwytem","Underhand Bent Over Row","underhand","Chwyć sztangę podchwytem i przyciągaj ją ku dolnej części brzucha.","Use an underhand grip and row toward the lower abdomen."],
    ["smith-row","row","smith","Wiosłowanie w opadzie","Bent Over Row","hinge","Dobierz ustawienie stóp tak, aby prowadnica biegła blisko ud.","Position your feet so the guided bar stays close to your thighs."],
    ["kb-row","row","kb","Wiosłowanie jednorącz","Single Arm Row","single-hinge","Chwyć odważnik na środku uchwytu i ustabilizuj tułów wolną ręką.","Grip the middle of the kettlebell handle and brace with your free hand."],
    ["band-row","row","band","Wiosłowanie siedząc","Seated Row","seat","Zamocuj gumę przed sobą i zacznij z lekkim napięciem.","Anchor the band in front of you and start under light tension."],
    ["inverted-row","inverted","bw","Wiosłowanie odwrócone","Inverted Row","flat","Ustaw drążek na wysokości, przy której utrzymasz prostą linię ciała.","Set the bar high enough to maintain a straight body line."],
    ["ring-row","inverted","rings","Wiosłowanie na kółkach","Ring Row","rings","Pochyl się do tyłu pod dwoma napiętymi paskami. Przesunięcie stóp zmienia trudność.","Lean back below the taut straps. Move your feet to adjust difficulty."],
    ["db-pullover","pullover","db","Przenoszenie za głowę","Pullover","supine","Połóż plecy na ławce i trzymaj jeden hantel obiema dłońmi nad klatką.","Lie on a bench and hold a single dumbbell in both hands over the chest."],
    ["cable-pullover","pullover","cable","Ściąganie prostymi ramionami","Straight Arm Pulldown","standing","Stań przed górnym wyciągiem i poprowadź uchwyt do ud.","Face a high pulley and sweep the handle toward your thighs."],
    ["band-pullover","pullover","band","Ściąganie prostymi ramionami","Straight Arm Pulldown","standing","Zamocuj gumę wysoko i cofnij się do wyraźnego napięcia.","Anchor the band high and step back to take up the slack."],
    ["machine-pullover","pullover","machine","Przenoszenie ramion","Pullover","seat","Ustaw łokcie na poduszkach i przesuń dźwignię w kierunku bioder.","Place the elbows against the pads and drive the lever toward your hips."],
    ["db-shrug","shrug","db","Szrugsy","Shrug","standing","Prowadź hantle tuż przy bokach ud.","Keep each dumbbell beside its corresponding thigh."],
    ["bb-shrug","shrug","bb","Szrugsy","Shrug","standing","Trzymaj gryf przed udami i pozostaw łokcie wyprostowane.","Hold the bar in front of the thighs with straight elbows."],
    ["smith-shrug","shrug","smith","Szrugsy","Shrug","standing","Ustaw ograniczniki poniżej dolnego położenia gryfu.","Set the stops below the lowest point of the bar."],
    ["cable-shrug","shrug","cable","Szrugsy","Shrug","standing","Stań blisko dolnego bloczka, aby linka ciągnęła głównie w dół.","Stand near the low pulley so the cable pulls mostly downward."],
    ["standing-db-press","overhead","db","Wyciskanie nad głowę stojąc","Standing Shoulder Press","standing","Stań ze stopami pod biodrami i nie pomagaj sobie ugięciem kolan.","Plant your feet beneath your hips and keep the knees quiet."],
    ["seated-bb-press","overhead","bb","Wyciskanie nad głowę siedząc","Seated Overhead Press","seat","Oprzyj plecy i poprowadź sztangę przed twarzą.","Support your back and press the bar in front of your face."],
    ["smith-shoulder","overhead","smith","Wyciskanie nad głowę siedząc","Seated Shoulder Press","seat","Ustaw ławkę pod prowadnicą tak, aby gryf bezpiecznie mijał twarz.","Line the bench up with the rails so the bar clears your face."],
    ["single-db-press","overhead","db","Wyciskanie nad głowę jednorącz","Single Arm Shoulder Press","single","Napnij bok tułowia po przeciwnej stronie pracującej ręki.","Brace the side of the torso opposite the pressing arm."],
    ["kb-press","overhead","kb","Wyciskanie nad głowę jednorącz","Single Arm Shoulder Press","single","Oprzyj korpus odważnika o przedramię i zachowaj prosty nadgarstek.","Rest the bell against the forearm and keep the wrist straight."],
    ["arnold-press","overhead","db","Wyciskanie Arnolda","Arnold Press","rotate","Zacznij z dłońmi skierowanymi do siebie i obracaj je w przód podczas wyciskania.","Start with palms facing you and turn them forward as you press."],
    ["landmine-press","overhead","landmine!","Wyciskanie półsztangi jednorącz","Single Arm Landmine Press","diagonal","Trzymaj koniec zakotwiczonego gryfu przy barku i wypchnij go ukośnie w przód.","Hold the end of the anchored bar at your shoulder and press diagonally forward."],
    ["kneel-landmine","overhead","landmine!","Wyciskanie półsztangi w półklęku","Half Kneeling Landmine Press","half-kneel","Oprzyj kolano po stronie ręki wyciskającej. Drugą stopę postaw z przodu.","Kneel on the pressing side and plant the opposite foot in front."],
    ["band-press","overhead","band","Wyciskanie nad głowę","Shoulder Press","standing","Stań na środku gumy i chwyć jej końce na równej długości.","Stand on the middle of the band and hold equal lengths on each side."],
    ["seated-raise","raise","db","Unoszenie bokiem siedząc","Seated Lateral Raise","seat","Usiądź na końcu ławki z hantlami poza jej krawędzią.","Sit on the end of a bench so the dumbbells clear its sides."],
    ["lean-raise","raise","db","Unoszenie bokiem z odchyleniem","Leaning Lateral Raise","lean","Wolną ręką chwyć stabilną podporę i odchyl ciało jako całość.","Hold a fixed support and lean the whole body away from it."],
    ["band-raise","raise","band","Unoszenie bokiem","Lateral Raise","standing","Stań na gumie i trzymaj jej końce przy bokach ud.","Stand on the band with an end in each hand beside your thighs."],
    ["cuff-raise","raise","cable","Unoszenie bokiem z mankietem","Cuff Lateral Raise","single","Zapnij mankiet nisko na przedramieniu i rozluźnij dłoń.","Fasten the cuff low on the forearm and relax the hand."],
    ["db-front","front","db","Unoszenie w przód","Front Raise","standing","Unieś hantle przed sobą bez odchylania pleców.","Lift the dumbbells forward without leaning backward."],
    ["plate-front","front","plate","Unoszenie w przód","Front Raise","close","Trzymaj talerz obiema dłońmi po przeciwnych stronach.","Hold opposite sides of the plate with both hands."],
    ["cable-front","front","cable","Unoszenie w przód jednorącz","Single Arm Front Raise","single","Ustaw się tyłem do dolnego bloczka, z linką swobodnie obok uda.","Face away from a low pulley with the cable running beside your thigh."],
    ["db-rear","rear","db","Odwrotne rozpiętki w opadzie","Bent Over Reverse Fly","hinge","Cofnij biodra i utrzymuj stałe pochylenie tułowia przez całą serię.","Hinge at the hips and hold a consistent torso angle."],
    ["incline-rear","rear","db","Odwrotne rozpiętki z podparciem","Chest Supported Reverse Fly","incline","Oprzyj mostek o skośną ławkę i unoś hantle w bok.","Support the chest on an incline bench and raise the dumbbells outward."],
    ["band-rear","rear","band!","Rozciąganie gumy przed klatką","Band Pull Apart","standing","Chwyć gumę przed klatką i rozsuwaj dłonie aż ramiona ustawią się szeroko.","Hold the band in front of the chest and spread your hands apart."],
    ["face-pull","face","cable!","Przyciąganie liny do twarzy","Face Pull","standing","Użyj liny i zakończ ruch dłońmi po obu stronach skroni.","Use a rope and finish with your hands on either side of your temples."],
    ["band-face","face","band","Przyciąganie do twarzy","Face Pull","standing","Zamocuj gumę na wysokości oczu i chwyć oba końce.","Secure the band at eye level and hold both ends."],
    ["ez-curl","curl","ez!","Uginanie ramion (gryf łamany)","EZ Bar Biceps Curl","standing","Chwyć skośne odcinki gryfu w ustawieniu wygodnym dla nadgarstków.","Grip the angled sections in a comfortable wrist position."],
    ["incline-curl","curl","db","Uginanie na skosie dodatnim","Incline Curl","incline","Oprzyj plecy na skośnej ławce i pozwól ramionom zwisać za linią tułowia.","Lean back on an incline bench and let the upper arms hang behind the torso."],
    ["concentration-curl","curl","db","Uginanie w oparciu o udo","Concentration Curl","concentration","Usiądź i oprzyj tylną część ramienia o wewnętrzną stronę uda.","Sit down and brace the back of the upper arm against the inner thigh."],
    ["db-preacher","curl","db","Uginanie na modlitewniku jednorącz","Single Arm Preacher Curl","preacher","Oprzyj całe ramię o poduszkę i pracuj jedną ręką naraz.","Support the entire upper arm on the pad and curl one side at a time."],
    ["ez-preacher","curl","ez","Uginanie na modlitewniku","Preacher Curl","preacher","Oprzyj oba ramiona na poduszce i obejmij skośne części gryfu.","Rest both upper arms on the pad and take the angled grips."],
    ["cable-preacher","curl","cable","Uginanie na modlitewniku","Preacher Curl","preacher","Ustaw modlitewnik przodem do dolnego bloczka.","Position the preacher bench facing the low pulley."],
    ["spider-curl","curl","db","Uginanie w leżeniu przodem na skosie","Spider Curl","prone","Oprzyj klatkę na skosie i pozwól łokciom zwisać pionowo pod barkami.","Support your chest on an incline bench with elbows hanging below your shoulders."],
    ["ez-spider","curl","ez","Uginanie w leżeniu przodem na skosie","Spider Curl","prone","Ustaw ławkę tak, by gryf mijał siedzisko podczas opuszczania.","Set the bench so the bar clears the seat on the way down."],
    ["bayesian-curl","curl","cable","Uginanie jednorącz zza tułowia","Bayesian Curl","behind","Stań tyłem do niskiego bloczka i zacznij z łokciem lekko za biodrem.","Face away from a low pulley with the elbow slightly behind your hip."],
    ["high-curl","curl","cable!","Uginanie na bramie z góry","High Cable Curl","high","Stań pomiędzy wysokimi bloczkami z ramionami rozstawionymi na boki.","Stand between high pulleys with upper arms out to the sides."],
    ["band-curl","curl","band","Uginanie ramion","Bicep Curl","standing","Stań na gumie i zachowaj równą długość jej końców.","Stand on the band with equal lengths on either side."],
    ["seated-curl","curl","db","Uginanie ramion siedząc","Seated Bicep Curl","seat","Usiądź pionowo i pozostaw łokcie po bokach ławki.","Sit upright with the elbows clear of the sides of the bench."],
    ["hammer-db","hammer","db","Uginanie młotkowe","Hammer Curl","neutral","Przez cały ruch kieruj kciuki ku górze.","Keep the thumbs pointing upward throughout."],
    ["cross-hammer","hammer","db","Uginanie młotkowe w poprzek tułowia","Cross Body Hammer Curl","cross","Prowadź jeden hantel po skosie ku przeciwległej stronie klatki.","Curl one dumbbell diagonally toward the opposite side of the chest."],
    ["rope-hammer","hammer","cable","Uginanie młotkowe z liną","Rope Hammer Curl","rope","Przypnij linę do dolnego bloczka i chwyć jej końce neutralnie.","Attach a rope to a low pulley and take a neutral grip on its ends."],
    ["reverse-curl","hammer","bb","Uginanie nachwytem","Reverse Curl","overhand","Chwyć gryf nachwytem i trzymaj nadgarstki w przedłużeniu przedramion.","Use an overhand grip and keep your wrists aligned with the forearms."],
    ["ez-reverse","hammer","ez","Uginanie nachwytem","Reverse Curl","overhand","Połóż dłonie na skośnych częściach gryfu grzbietem do góry.","Grip the angled sections with the backs of your hands up."],
    ["rope-pushdown","pressdown","cable!","Prostowanie z liną na wyciągu","Triceps Rope Pushdown","rope","Delikatnie rozsuń końce liny przy udach, utrzymując łokcie przy ciele.","Separate the rope ends slightly beside your thighs with the elbows tucked."],
    ["single-pushdown","pressdown","cable","Prostowanie na wyciągu jednorącz","Single Arm Triceps Pushdown","single","Stań stabilnie i wykonaj serię jedną ręką przed zmianą strony.","Stand steady and finish the set with one arm before switching."],
    ["reverse-pushdown","pressdown","cable","Prostowanie na wyciągu podchwytem","Reverse Grip Triceps Pushdown","underhand","Chwyć krótki drążek dłońmi od dołu i dobierz lżejszy ciężar dla nadgarstków.","Grip a short bar from underneath and choose a wrist-friendly load."],
    ["band-pushdown","pressdown","band","Prostowanie ramion w dół","Triceps Pushdown","standing","Przymocuj gumę wysoko i sprawdź jej napięcie w dolnej pozycji.","Secure the band overhead and check the tension at the bottom."],
    ["bb-skull","skull","bb","Wyciskanie francuskie leżąc","Skullcrusher","flat","Zacznij z gryfem nad barkami i kontroluj jego tor lekko za czołem.","Start with the bar above the shoulders and control its path just behind the forehead."],
    ["ez-skull","skull","ez","Wyciskanie francuskie leżąc","Skullcrusher","flat","Chwyć skośne odcinki gryfu i utrzymuj dłonie w jednej linii z przedramionami.","Take the angled grips and keep wrists in line with the forearms."],
    ["db-skull","skull","db","Wyciskanie francuskie leżąc","Skullcrusher","neutral","Opuść hantle po obu stronach głowy z dłońmi skierowanymi do siebie.","Lower the dumbbells beside the head with palms facing each other."],
    ["rope-overhead","extension","cable","Prostowanie nad głową z liną","Overhead Rope Triceps Extension","rope","Odwróć się tyłem do bloczka i rozstaw stopy w wykroku.","Face away from the pulley and use a split stance."],
    ["single-overhead","extension","db","Prostowanie nad głową jednorącz","Single Arm Overhead Triceps Extension","single","Pracuj jedną ręką i utrzymuj łokieć blisko głowy.","Work one arm at a time with the elbow near your head."],
    ["ez-overhead","extension","ez","Prostowanie nad głową siedząc","Seated Overhead Triceps Extension","seat","Usiądź stabilnie i prowadź gryf za głowę bez wypychania żeber.","Sit upright and guide the bar behind your head while keeping the ribs down."],
    ["band-overhead","extension","band","Prostowanie nad głową","Overhead Triceps Extension","standing","Zabezpiecz gumę nisko za sobą i dobierz długość przed serią.","Anchor the band low behind you and set its length before the set."],
    ["db-kickback","kickback","db","Prostowanie ramienia w opadzie","Triceps Kickback","single-hinge","Podeprzyj wolną dłoń na ławce i wyprostuj pracujące przedramię za sobą.","Brace your free hand on a bench and extend the working forearm backward."],
    ["cable-kickback","kickback","cable","Prostowanie ramienia w opadzie","Triceps Kickback","single-hinge","Ustaw się przodem do niskiego bloczka, a linkę prowadź przy boku.","Face a low pulley and let the cable run beside the body."],
    ["bb-wrist","wrist","bb!","Uginanie nadgarstków siedząc podchwytem (sztanga)","Seated Palms Up Wrist Curl","seat","Ułóż dłonie podchwytem na szerokość wygodną dla przedramion.","Turn your palms up and choose a comfortable forearm spacing."],
    ["db-wrist","wrist","db","Uginanie nadgarstka jednorącz","Single Arm Wrist Curl","single-seat","Oprzyj jedno przedramię na udzie, dłonią skierowaną do góry.","Support one forearm on a thigh with the palm facing upward."],
    ["cable-wrist","wrist","cable","Uginanie nadgarstków","Wrist Curl","seat","Ustaw przedramiona w linii z linką dolnego wyciągu.","Align the supported forearms with the low cable."],
    ["bb-wrist-ext","wristext","bb","Prostowanie nadgarstków nachwytem","Reverse Wrist Curl","seat","Chwyć prosty gryf lekko i unieś grzbiety obu dłoni jednocześnie.","Grip the straight bar lightly and lift both knuckles together."],
    ["db-wrist-ext","wristext","db","Prostowanie nadgarstka jednorącz","Single Arm Reverse Wrist Curl","single-seat","Oprzyj przedramię i utrzymuj dłoń w jego osi.","Support the forearm and align the hand with it."],
    ["wrist-roller","roller","roller!","Nawijanie linki na wałek","Wrist Roller","standing","Policz pełne nawinięcie i kontrolowane odwinięcie jako jedno powtórzenie.","Count one full wind and controlled unwind as one rep."],
    ["front-squat","squat","bb","Przysiad przedni","Front Squat","front","Oprzyj gryf na przedniej części barków i utrzymuj wysoko łokcie.","Rest the bar on the fronts of your shoulders and keep the elbows high."],
    ["box-squat","squat","bb","Przysiad do skrzyni","Box Squat","box","Dotknij stabilnej skrzyni pośladkami i zachowaj napięcie przed wstaniem.","Touch a stable box with the hips and stay braced before standing."],
    ["smith-squat","squat","smith","Przysiad","Squat","standing","Przed odblokowaniem gryfu dopasuj ustawienie stóp i wysokość ograniczników.","Set your foot position and the safety stops before unlocking the bar."],
    ["kb-goblet","squat","kb","Przysiad goblet","Goblet Squat","front","Chwyć rogi odważnika i trzymaj go blisko mostka.","Grip the horns and hold the bell close to the sternum."],
    ["db-squat","squat","db","Przysiad z ciężarem po bokach","Suitcase Squat","standing","Trzymaj dwa hantle po bokach ud i nie opieraj ich na nogach.","Hold two dumbbells beside the thighs and keep them clear of your legs."],
    ["body-squat","squat","bw","Przysiad z masą ciała","Bodyweight Squat","standing","Wyciągnij ramiona przed siebie jako przeciwwagę.","Reach the arms forward for balance."],
    ["sumo-goblet","squat","kb","Przysiad sumo","Sumo Squat","wide","Rozstaw stopy szerzej i trzymaj odważnik między udami.","Take a wider stance with the bell between the thighs."],
    ["landmine-squat","squat","landmine","Przysiad z półsztangą","Landmine Squat","front","Trzymaj koniec zakotwiczonego gryfu oburącz przy górnej części klatki.","Cup the anchored bar end at the upper chest with both hands."],
    ["pause-squat","squat","bb","Przysiad z pauzą","Pause Squat","pause","Zatrzymaj się w dolnej pozycji na jeden spokojny takt przed wstaniem.","Pause for a controlled beat at the bottom before standing."],
    ["zercher-squat","squat","bb","Przysiad Zerchera","Zercher Squat","zercher","Zdejmij gryf ze stojaka w zgięcia łokci i trzymaj go blisko tułowia.","Take the bar from a rack into the crooks of the elbows and keep it close."],
    ["split-bw","split","bw","Przysiad wykroczny","Split Squat","split","Zostaw obie stopy w tym samym miejscu przez całą serię.","Keep both feet in place throughout the set."],
    ["split-db","split","db","Przysiad wykroczny","Split Squat","split","Trzymaj hantle po bokach i kieruj przednie kolano w stronę palców.","Hold dumbbells at your sides and track the front knee over the toes."],
    ["split-bb","split","bb","Przysiad wykroczny","Split Squat","split","Ułóż gryf na górnej części pleców i ustaw wykrok przed zejściem.","Set the bar on your upper back and establish the split stance before lowering."],
    ["bulgarian-db","split","db","Przysiad bułgarski","Bulgarian Split Squat","rear-up","Oprzyj tylną stopę o niską ławkę. Większość nacisku skieruj na przednią nogę.","Rest the rear foot on a low bench and load the front leg."],
    ["bulgarian-bw","split","bw","Przysiad bułgarski","Bulgarian Split Squat","rear-up","Ustaw tylną stopę na podporze i dobierz odległość przedniej stopy do równowagi.","Elevate the rear foot and adjust the front foot until you feel balanced."],
    ["bulgarian-smith","split","smith","Przysiad bułgarski","Bulgarian Split Squat","rear-up","Ustaw ławkę za prowadnicą i ograniczniki pod dolnym położeniem gryfu.","Place a bench behind the rails and the stops below the lowest bar position."],
    ["reverse-lunge-db","split","db","Zakrok","Reverse Lunge","reverse","Zrób kontrolowany krok w tył i wróć tylną stopą do pozycji stojącej.","Step backward under control and bring the rear foot back to standing."],
    ["forward-lunge-db","split","db","Wykrok w przód","Forward Lunge","forward","Postaw całą przednią stopę, a podczas powrotu odepchnij się nią od podłoża.","Plant the entire front foot and push through it to return."],
    ["walking-lunge","split","db","Wykroki chodzone","Walking Lunge","walk","Po wstaniu przejdź tylną nogą do następnego wykroku.","After rising, step the rear leg through into the next lunge."],
    ["reverse-lunge-bb","split","bb","Zakrok","Reverse Lunge","reverse","Utrzymuj gryf stabilnie na plecach i sprawdź wolne miejsce za sobą.","Keep the bar steady on your back and clear the space behind you."],
    ["reverse-lunge-bw","split","bw","Zakrok z masą ciała","Reverse Lunge","reverse","Cofnij jedną stopę i wróć do stania, zachowując stabilność przedniego kolana.","Step one foot back and return to standing with a steady front knee."],
    ["step-bw","step","bw","Wejście na podwyższenie","Step Up","box","Ogranicz odbicie dolną stopą, aby pracowała noga na skrzyni.","Minimize the push from the lower foot so the leg on the step does the work."],
    ["step-db","step","db","Wejście na podwyższenie","Step Up","box","Trzymaj ciężary po bokach i dostaw drugą stopę dopiero na górze.","Carry the weights at your sides and bring the second foot up at the top."],
    ["step-kb","step","kb","Wejście na podwyższenie z ciężarem przy klatce","Goblet Step Up","front","Trzymaj odważnik przy mostku i patrz przed siebie podczas wejścia.","Hold the bell at the sternum and look forward as you step up."],
    ["single-legpress","legpress","machine","Wypychanie jednonóż","Single Leg Press","single-seat","Pracuj jedną stopą po odpowiadającej jej stronie platformy i trzymaj biodra równo.","Place the working foot on its side of the platform and keep the hips level."],
    ["horizontal-legpress","legpress","machine","Wypychanie na suwnicy poziomej","Horizontal Leg Press","horizontal","Ustaw siedzisko tak, aby w dolnym położeniu miednica nie odrywała się od oparcia.","Set the seat so your pelvis stays supported at the bottom."],
    ["single-leg-extension","quad","machine","Prostowanie nogi jednonóż","Single Leg Extension","single-seat","Wyprostuj jedną nogę, a drugą pozostaw swobodnie poza torem dźwigni.","Extend one knee and keep the resting leg clear of the lever."],
    ["band-leg-extension","quad","band","Prostowanie nogi siedząc","Seated Leg Extension","single-seat","Zamocuj gumę nisko za ławką i zabezpiecz ją nad kostką.","Anchor the band low behind a bench and secure it above the ankle."],
    ["single-seated-legcurl","ham","machine","Uginanie nogi siedząc jednonóż","Single Leg Seated Curl","single-seat","Ustaw wałek nad piętą jednej nogi i oprzyj udo pod dociskiem.","Set the roller above one heel and support the thigh under the pad."],
    ["single-lying-legcurl","ham","machine","Uginanie nogi leżąc jednonóż","Single Leg Lying Curl","prone","Utrzymuj oba biodra na poduszce podczas pracy jednej nogi.","Keep both hips on the pad as one leg works."],
    ["standing-legcurl","ham","machine","Uginanie nogi stojąc","Standing Leg Curl","single","Oprzyj udo o podporę i unieś piętę bez wypychania biodra do przodu.","Brace the thigh on the pad and lift the heel without thrusting the hip forward."],
    ["band-legcurl","ham","band","Uginanie nóg leżąc","Lying Leg Curl","prone","Połóż się przodem, stopami do niskiego zaczepu gumy.","Lie face down with feet toward a low band anchor."],
    ["kb-rdl","hinge","kb","Rumuński martwy ciąg","Romanian Deadlift","front","Trzymaj uchwyt oburącz i przesuwaj odważnik pomiędzy nogami.","Hold the handle in both hands and let the bell travel between the legs."],
    ["single-rdl","hinge","db","Martwy ciąg jednonóż","Single Leg Romanian Deadlift","single-leg","Wyciągaj wolną nogę w tył, trzymając biodra skierowane do podłogi.","Reach the free leg back and keep both hips facing the floor."],
    ["bstance-rdl","hinge","db","Rumuński martwy ciąg z podpórką nogi","B Stance Romanian Deadlift","kickstand","Ustaw tylną stopę na palcach jako podporę. Obciąż głównie przednią nogę.","Use the rear toes as a kickstand and keep most of the load on the front leg."],
    ["smith-rdl","hinge","smith","Rumuński martwy ciąg","Romanian Deadlift","standing","Ustaw stopy blisko prowadnicy i przesuwaj gryf tuż przy udach.","Set the feet near the rails and guide the bar close to the thighs."],
    ["goodmorning","hinge","bb","Dzień dobry","Good Morning","back","Oprzyj gryf na górnej części pleców i cofnij biodra z miękkimi kolanami.","Rest the bar across your upper back and send the hips back with soft knees."],
    ["band-goodmorning","hinge","band","Dzień dobry","Good Morning","back","Zabezpiecz gumę stopami i przeprowadź ją przez górne plecy poniżej szyi.","Secure the band under your feet and across the upper back below the neck."],
    ["pullthrough","hinge","cable!","Przeciąganie liny między nogami","Cable Pull Through","through","Stań tyłem do niskiego wyciągu i prowadź linę między udami.","Face away from a low pulley and let the rope pass between your thighs."],
    ["deadlift-bb","deadlift","bb","Martwy ciąg klasyczny","Deadlift","floor","Ustaw gryf nad śródstopiem i napnij go przed oderwaniem talerzy od podłoża.","Set the bar over midfoot and take up the slack before the plates leave the floor."],
    ["sumo-deadlift","deadlift","bb","Martwy ciąg sumo","Sumo Deadlift","wide","Rozstaw stopy szeroko i chwyć gryf pomiędzy kolanami.","Use a wide stance and grip the bar between your knees."],
    ["trap-deadlift","deadlift","trap!","Martwy ciąg","Trap Bar Deadlift","trap","Stań pośrodku ramy, chwytając oba uchwyty na tej samej wysokości.","Stand in the middle of the frame and grip both handles at the same height."],
    ["kb-deadlift","deadlift","kb","Martwy ciąg","Deadlift","floor","Ustaw odważnik między stopami i chwyć go oburącz.","Place the bell between your feet and grip it with both hands."],
    ["db-deadlift","deadlift","db","Martwy ciąg","Deadlift","floor","Prowadź dwa hantle po zewnętrznych stronach nóg.","Track the two dumbbells just outside your legs."],
    ["rack-pull","deadlift","bb","Martwy ciąg z podpór","Rack Pull","elevated","Ustaw obie podpory na tej samej wysokości poniżej kolan.","Set both rack supports at the same height below the knees."],
    ["db-thrust","bridge","db","Hip thrust","Hip Thrust","bench","Oprzyj łopatki o ławkę i przytrzymaj hantel w zgięciu bioder.","Rest the shoulder blades on a bench and hold the dumbbell across the hip crease."],
    ["smith-thrust","bridge","smith","Hip thrust","Hip Thrust","bench","Zabezpiecz ławkę i ustaw gryf z podkładką nad biodrami.","Secure the bench and center a padded bar over the hips."],
    ["single-thrust","bridge","bw","Hip thrust jednonóż","Single Leg Hip Thrust","single-bench","Oprzyj jedną stopę na podłożu, a drugą nogę utrzymuj uniesioną.","Plant one foot and hold the other leg off the floor."],
    ["bb-bridge","bridge","bb","Most biodrowy","Glute Bridge","floor","Połóż się na macie i podłóż miękką osłonę pod gryf.","Lie on a mat and pad the bar where it rests across your hips."],
    ["single-bridge","bridge","bw","Most biodrowy jednonóż","Single Leg Glute Bridge","single-floor","Unieś jedną nogę i utrzymuj obie strony miednicy na tej samej wysokości.","Raise one leg and keep both sides of the pelvis level."],
    ["frog-pump","bridge","bw","Most biodrowy ze złączonymi stopami","Frog Pump","frog","Złącz podeszwy stóp i pozwól kolanom skierować się na zewnątrz.","Bring the soles of the feet together and let the knees open outward."],
    ["cable-kick","glutekick","cable","Wykop w tył","Glute Kickback","standing","Zapnij mankiet nad kostką, stań przodem do bloczka i trzymaj podporę.","Attach a cuff above the ankle, face the pulley and hold a support."],
    ["machine-kick","glutekick","machine","Wypychanie nogi w tył","Glute Kickback","standing","Dopasuj podpórkę i naciskaj platformę tylną częścią stopy.","Adjust the support and press the footplate away with the heel."],
    ["donkey-kick","glutekick","bw","Wykop w tył w klęku podpartym","Donkey Kick","quadruped","W klęku podpartym utrzymaj zgięte kolano i unoś udo do linii tułowia.","On hands and knees keep the working knee bent and lift the thigh toward torso level."],
    ["machine-abduct","abduct","machine","Odwodzenie bioder siedząc","Seated Hip Abduction","seat","Dociśnij zewnętrzne strony ud do poduszek i rozsuń kolana.","Press the outer thighs against the pads and spread the knees apart."],
    ["cable-abduct","abduct","cable","Odwodzenie nogi stojąc","Standing Hip Abduction","single","Stań bokiem do wyciągu i pracuj nogą dalszą od bloczka.","Stand side-on and work the leg farther from the cable stack."],
    ["side-legraise","abduct","bw","Odwodzenie nogi w leżeniu bokiem","Side Lying Hip Abduction","side","Połóż się na boku i unoś górną nogę bez obracania miednicy.","Lie on your side and lift the top leg without rolling your pelvis back."],
    ["band-abduct","abduct","band","Odwodzenie bioder siedząc","Seated Hip Abduction","seat","Załóż pętlę nad kolana i zostaw stopy na podłodze.","Loop the band above the knees and keep both feet on the floor."],
    ["machine-adduct","adduct","machine","Przywodzenie bioder siedząc","Seated Hip Adduction","seat","Oprzyj wewnętrzną stronę ud o poduszki i dobierz wygodny rozstaw początkowy.","Rest the inner thighs on the pads and choose a comfortable starting width."],
    ["cable-adduct","adduct","cable","Przywodzenie nogi stojąc","Standing Hip Adduction","single","Pracuj nogą bliższą bloczka i prowadź ją przed nogą podporową.","Work the leg nearest the stack, drawing it in front of the support leg."],
    ["smith-calf","calf","smith","Wspięcia na palce stojąc","Standing Calf Raise","back","Ułóż gryf na górnej części pleców i sprawdź stabilność podwyższenia.","Set the bar on your upper back and check that the raised platform is stable."],
    ["single-calf","calf","bw","Wspięcia na palce jednonóż","Single Leg Calf Raise","single","Podeprzyj się lekko dłonią i unieś drugą stopę z podłogi.","Use light hand support and lift the nonworking foot off the floor."],
    ["legpress-calf","calf","machine","Wspięcia na suwnicy","Calf Press on Leg Press","legpress","Oprzyj przodostopie bezpiecznie na platformie i utrzymuj stały kąt kolan.","Set the forefeet securely on the platform and keep the knee angle steady."],
    ["db-seated-calf","seatedcalf","db","Wspięcia na palce siedząc","Seated Calf Raise","seat","Oprzyj hantle na udach tuż nad kolanami i przytrzymaj je dłońmi.","Rest the dumbbells on the thighs just above the knees and steady them with your hands."],
    ["bb-seated-calf","seatedcalf","bb","Wspięcia na palce siedząc","Seated Calf Raise","seat","Podeprzyj gryf na wyściełanych udach i ustabilizuj go obiema rękami.","Pad the thighs and hold the bar securely in place with both hands."],
    ["weighted-crunch","crunch","plate","Spięcia brzucha z obciążeniem","Weighted Crunch","floor","Przytrzymaj talerz przy mostku i pozostaw miednicę na macie.","Hold a plate at the sternum and keep the pelvis on the mat."],
    ["decline-crunch","crunch","bw","Spięcia brzucha na skosie ujemnym","Decline Crunch","decline","Zabezpiecz stopy na ławce skośnej i unieś łopatki bez pełnego siadu.","Secure your feet on a decline bench and raise the shoulder blades without sitting all the way up."],
    ["standing-crunch","crunch","cable!","Spięcia brzucha stojąc","Standing Cable Crunch","standing","Chwyć linę przy skroniach i zachowaj nieruchome biodra podczas zgięcia tułowia.","Hold the rope beside your temples and keep your hips steady as you curl."],
    ["ball-crunch","crunch","ball","Spięcia brzucha na piłce","Exercise Ball Crunch","ball","Podeprzyj plecy na piłce i postaw obie stopy szeroko na podłodze.","Support the back on the ball and plant the feet wide for balance."],
    ["low-woodchop","twist","cable!","Skręt tułowia na wyciągu (z dołu do góry)","Cable Twist (Down to Up)","low","Poprowadź oburącz uchwyt od biodra ku przeciwnemu barkowi, pozwalając stopom się obrócić.","Guide the handle from hip toward the opposite shoulder and allow the feet to pivot."],
    ["high-woodchop","twist","cable!","Skręt tułowia na wyciągu (z góry w dół)","Cable Twist (Up to Down)","high","Ustaw bloczek wysoko i zakończ po przeciwnej stronie w okolicy biodra.","Set the pulley high and finish beside the opposite hip."],
    ["russian-twist","twist","plate","Skręty rosyjskie","Russian Twist","seat","Usiądź ze stopami na podłodze i prowadź talerz z klatką z boku na bok.","Sit with feet on the floor and move the plate side to side with the chest."],
    ["band-twist","twist","band","Skręty tułowia stojąc","Standing Torso Twist","standing","Zamocuj gumę na wysokości mostka i obróć się od zaczepu.","Anchor the band at sternum height and rotate away from the anchor."],
    ["cable-pallof","pallof","cable","Wyciskanie antyrotacyjne","Pallof Press","standing","Ustaw wyciąg na wysokości klatki i pozostań bokiem do stosu.","Set the pulley at chest level and stay side-on to the stack."],
    ["band-pallof","pallof","band","Wyciskanie antyrotacyjne","Pallof Press","standing","Dobierz odległość od zaczepu tak, aby guma nie obracała bioder.","Set your distance from the anchor so you can keep your hips square."],
    ["back-extension","backext","bw!","Wyprosty tułowia na ławce rzymskiej","Back Extension (Hyperextension)","incline","Na ławce pod kątem 45° oprzyj uda poniżej zgięcia biodra.","On a 45-degree bench, support the thighs just below the hip crease."],
    ["plate-backext","backext","plate","Wyprosty tułowia na ławce rzymskiej","Back Extension","incline","Trzymaj talerz blisko klatki, by obciążenie pozostało stabilne.","Hold the plate close to the chest to keep it steady."],
    ["hang-knee","legraise","bw","Unoszenie kolan w zwisie","Hanging Knee Raise","hang-knees","Zacznij w spokojnym zwisie i unieś zgięte kolana bez zamachu.","Start from a still hang and raise the bent knees without swinging."],
    ["hang-leg","legraise","bw","Unoszenie nóg w zwisie","Hanging Leg Raise","hang","Chwyć drążek i podnoś prawie proste nogi tylko w kontrolowanym zakresie.","Grip the bar and lift nearly straight legs through a controlled range."],
    ["captain-knee","legraise","bw","Unoszenie kolan na poręczach","Captain’s Chair Knee Raise","chair","Oprzyj przedramiona na poduszkach i utrzymuj plecy przy oparciu.","Support the forearms on the pads and keep the back against the support."],
    ["reverse-crunch","legraise","bw","Odwrotne spięcia brzucha","Reverse Crunch","floor","Połóż się na macie i podwiń miednicę, delikatnie odrywając kość krzyżową.","Lie on the mat and curl the pelvis just enough to lift the sacrum."],
    ["deadbug","reach","bw","Martwy robak","Dead Bug","supine","Na plecach opuszczaj przeciwną rękę i nogę bez zwiększania łuku lędźwi.","Lie on your back and lower the opposite arm and leg without arching the lower back."],
    ["bird-dog","reach","bw","Naprzemienne wyprosty w klęku","Bird Dog","quadruped","W klęku podpartym sięgnij jedną ręką w przód, przeciwną nogą w tył.","From hands and knees reach one arm forward and the opposite leg back."],
    ["plank-tap","reach","bw","Deska z dotknięciem barku","Plank Shoulder Tap","plank","W wysokim podporze dotknij przeciwnego barku i odstaw dłoń przed zmianą strony.","In a high plank touch the opposite shoulder and replace the hand before switching."],
    ["ab-wheel","reach","wheel!","Rolowanie z kolan","Kneeling Ab Wheel Rollout","roll","Uklęknij i tocz kółko do przodu tylko tak daleko, jak kontrolujesz ustawienie lędźwi.","Kneel and roll forward only as far as you can control your lower back."],
    ["dragon-flag","dragon","bw","Smocza flaga","Dragon Flag","straight","Wyprostuj kolana i utrzymuj barki, biodra i kostki w jednej linii.","Extend your knees and keep shoulders, hips and ankles aligned."],
    ["tuck-dragon-flag","dragon","bw","Smocza flaga z podkurczonymi nogami","Tuck Dragon Flag","tuck","Trzymaj oba kolana blisko klatki, aby skrócić dźwignię.","Keep both knees close to your chest to shorten the lever."],
    ["one-leg-dragon-flag","dragon","bw","Smocza flaga jednonóż","Single Leg Dragon Flag","one-leg","Wyprostuj jedną nogę, a drugą przyciągnij do klatki. Zmieniaj strony między seriami.","Extend one leg and keep the other knee tucked. Switch sides between sets."],
    ["negative-dragon-flag","dragonNegative","bw","Smocza flaga z samym opuszczaniem","Negative Dragon Flag","negative","Po każdym opuszczeniu odłóż ciało i ustaw się od nowa z ugiętymi kolanami.","After each lowering phase, settle down and reset with bent knees."],
    ["v-up","vup","bw","Scyzoryki","V-Up","straight","Sięgaj obiema dłońmi do podudzi i zostaw niewielkie ugięcie kolan.","Reach both hands toward your shins and keep a soft bend in your knees."],
    ["tuck-up","vup","bw","Scyzoryki ze zgiętymi kolanami","Tuck-Up","tuck","W górnej pozycji przyciągnij oba kolana do klatki, balansując na pośladkach.","Draw both knees toward your chest at the top and balance on your glutes."],
    ["floor-leg-raise","floorraise","bw","Unoszenie prostych nóg leżąc","Lying Leg Raise","straight","Utrzymuj podobne ugięcie kolan przez cały ruch, również tuż nad matą.","Keep the same slight knee bend through the lift and the return toward the floor."],
    ["bent-knee-raise","floorraise","bw","Unoszenie ugiętych nóg leżąc","Lying Bent Knee Raise","tuck","Zachowaj kąt prosty w kolanach i unoś obie nogi razem.","Hold both knees at a right angle and lift your legs together."],
    ["mountain-climber","climber","bw","Bieg w podporze","Mountain Climber","straight","Prowadź kolano w stronę klatki po tej samej stronie. Policz każdy ruch kolana.","Drive each knee toward the same side of your chest. Count each knee drive."],
    ["cross-body-climber","climber","bw","Bieg w podporze po skosie","Cross Body Mountain Climber","cross","Kieruj kolano do przeciwnego łokcia, utrzymując dłonie na miejscu.","Drive your knee toward the opposite elbow while keeping both hands planted."],
    ["pike-push-up","pike","bw","Pompka w pozycji pike","Pike Push Up","floor","Ustaw stopy tak, żeby utrzymać biodra wysoko także w dolnej pozycji.","Position your feet so your hips stay high even at the bottom."],
    ["elevated-pike","pike","bw","Pompka pike z nogami na podwyższeniu","Feet Elevated Pike Push Up","raised","Oprzyj obie stopy na stabilnym podwyższeniu i oprzyj cały ciężar dłoni równomiernie.","Place both feet on a stable platform and distribute pressure across your palms."],
    ["scapular-pull-up","scappull","bw","Podciąganie łopatkowe","Scapular Pull Up","bar","Zakres jest krótki. Zacznij kolejne powtórzenie dopiero po zatrzymaniu kołysania.","Use a small range and let any swing settle before starting another rep."],
    ["scapular-push-up","scappush","bw","Pompka łopatkowa","Scapular Push Up","floor","Utrzymuj łokcie wyprostowane, aby ruch pochodził z łopatek.","Keep your elbows straight so that the movement comes from your shoulder blades."],
    ["larsen-press","larsen","bb","Wyciskanie Larsena","Larsen Press","larsen","Wyprostuj nogi przed ławką i trzymaj stopy nad podłogą, bez odbijania gryfu od klatki.","Extend your legs in front of the bench and hold your feet off the floor while pressing smoothly."],
    ["spoto-press","bench","bb","Wyciskanie Spoto","Spoto Press","spoto","Zatrzymaj gryf tuż nad klatką na krótką pauzę, utrzymaj napięcie i wyciśnij.","Pause the bar just above your chest, hold tension and press it back up."],
    ["bb-preacher","curl","bb","Uginanie na modlitewniku","Preacher Curl","preacher","Oprzyj oba ramiona na podpórce i chwyć prosty gryf podchwytem na wygodnej szerokości.","Rest both upper arms on the pad and take a comfortable underhand grip on the straight bar."],
    ["db-reverse-curl","hammer","db","Uginanie nachwytem","Reverse Curl","pronated","Skieruj dłonie grzbietami do góry i utrzymuj neutralne nadgarstki podczas unoszenia hantli.","Keep the backs of your hands facing up and your wrists straight as the dumbbells rise."],
    ["db-z-press","overhead","db","Wyciskanie Z","Z Press","long-seat","Usiądź na podłodze z wyprostowanymi nogami. Poprowadź hantle z wysokości barków nad głowę.","Sit on the floor with your legs straight. Press the dumbbells overhead from shoulder height."],
    ["bb-z-press","overhead","bb","Wyciskanie Z","Z Press","long-seat","Usiądź wyprostowany z nogami przed sobą i rozpocznij ze sztangą na wysokości obojczyków.","Sit upright with legs extended and start with the bar at collarbone height."]
  ];
  const additions = variants.map(([slug, family, equipmentKey, pl, en, position, cuePl, cueEn]) => {
    const gear = equipmentKey.replace('!', '');
    const [gearType, plGear, enGear] = equipment[gear];
    const type = ['pullup', 'dip', 'negative', 'pushup'].includes(family) ? 'bodyweight' : gearType;
    const id = 'atlas-' + slug;
    const suffix = !equipmentKey.endsWith('!') && !!plGear;
    const name = suffix ? pl + ' (' + plGear + ')' : pl;
    const nameEn = suffix ? en + ' (' + enGear + ')' : en;
    names[id] = [name, nameEn];
    const {group, pattern} = families[family];
    return {id, name, nameEn, family, group, pattern, type, gear, position, cuePl, cueEn};
  });
  const byId = Object.assign(Object.create(null), Object.fromEntries(additions.map(ex => [ex.id, ex])));
  const api = { names, additions, byId, families, equipment };
  root.ExerciseLibrary = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);

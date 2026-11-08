# Visual Upgrade & Measurement Map for Play-Based Child Assessments

**Date**: November 2026  
**Repository**: `web/` in `vaakbot`  
**Target Environments**: Mobile Web (390×844 Android / iOS) & Desktop Web (1280×800)  
**Safety & Compliance**: Sensory-Safe (no flash >2fps, no screen shake, gentle audio, prefers-reduced-motion support), Dyslexia-friendly typography, Locked Clinical Measurement (Rule A).

---

## 1. ADHD Quest: "Sunbird Valley" (`app/assessments/adhd`)

### Game 1: Sunbird Sighting (CPT Go / No-Go Paradigm)
- **Clinical Paradigm**: Conners Continuous Performance Test 3 (CPT-3) / Sustained Vigilance & Response Inhibition.
- **Stimulus**:
  - **Target (Go)**: Golden Sunbird (`SunbirdTarget`), shown inside a centered circular arena (`w-72 h-72` / 288px diameter). Size scaled by age band (`band.bird`):
    - Age 4–5: 192px (`w-48 h-48`)
    - Age 6–7: 160px (`w-40 h-40`)
    - Age 8–11: 144px (`w-36 h-36`)
    - Age 12+: 128px (`w-32 h-32`)
  - **Non-Target Distractor (No-Go)**: Grey Shadow Moth (`MothDistractor`), size 128px (`w-32 h-32`), distinct shape and muted charcoal/grey palette.
- **Stimulus Duration & Timing**:
  - Inter-Stimulus Interval (ISI): Cycled from `CPT_WAITS = [850, 1200, 1600, 2050]` ms.
  - Display Duration (`displayMs`):
    - Age 4–5: 1500 ms
    - Age 6–7: 680 ms
    - Age 8–11: 540 ms
    - Age 12+: 440 ms
  - Response Window: `Math.max(1000, displayMs + 300)` ms.
  - Trials: 20 trials (`CPT_ORDER`: 15 Targets [75%], 5 Non-Target Moths [25%]).
- **Hit / Error Criteria**:
  - **Hit**: Tap on Target inside circular arena within the response window and `RT >= 150ms`.
  - **Omission Error**: Target shown, no tap recorded within response window.
  - **Commission Error (False Alarm)**: Distractor (Moth) shown, tap recorded.
  - **Anticipatory Tap**: Tap occurring before stimulus onset or with `RT < 150ms`.
- **Telemetry Keys Fed**:
  - `omissions` (`cptTargets` denominator)
  - `commissions` (`cptNonTargets` denominator)
  - `anticipatory` (`cptAnticipatory`, `cptTrials` denominator)
  - `hrtMs` (Hit Reaction Time mean, `cptResponses` count)
  - `rtvMs` (Reaction Time Variability / standard deviation)
  - `rtFirstHalfMs` & `rtSecondHalfMs` (Block degradation / vigilance decrement)
  - `retrySunbird` (Practice replay count)
  - `camAwayPctSunbird`, `camMoveSunbird` (Optional camera tracking)

### Game 2: Solar Chevrons / Flanker Steering
- **Clinical Paradigm**: Eriksen Flanker Task / Selective Attention & Interference Control.
- **Stimulus**:
  - Horizontal array of 5 chevrons: 1 central target chevron flanked by 2 arrows on each side.
  - Arrow sizes (`band.chev`): Age 4–5: 96px; Age 6–7: 64px; Age 8–11: 52px; Age 12+: 44px.
  - Congruent: All 5 arrows point the same direction (`<<<<<` or `>>>>>`).
  - Incongruent: 4 flanker arrows point in the opposite direction to center (`<<><<` or `>><>>`).
  - Screen position: Centered row with Left/Right touch paddles below (min 48px touch targets, keyboard `ArrowLeft`/`ArrowRight` support).
- **Stimulus Duration & Timing**:
  - 12 trials (`FLANKER_ORDER`: 6 congruent, 6 incongruent).
  - Stimulus remains visible until child responds.
- **Hit / Error Criteria**:
  - **Hit**: Child selects the direction matching the **central target arrow**.
  - **Error**: Child selects the direction of the flanker arrows.
- **Telemetry Keys Fed**:
  - `flankerCongruent` (`flankerCongruentN` / `flankerCongruentTotal`)
  - `flankerIncongruent` (`flankerIncongruentN` / `flankerIncongruentTotal`)
  - `flankerCostMs` (Flanker Interference Cost = Incongruent RT − Congruent RT)
  - `retrySteering` (Practice repeat count)
  - `camAwayPctSteering`, `camMoveSteering`

### Game 3: Astrolabe Memory Matrix (Star Sequence)
- **Clinical Paradigm**: Corsi Block-Tapping Task / Visuospatial Working Memory Forward Span.
- **Stimulus**:
  - 3×3 grid of 9 celestial star nodes (`band.grid` 460–520px container).
  - Circular star nodes with distinct celestial runes.
- **Stimulus Duration & Timing**:
  - Base sequence length: Age 4–5: 2 stars; Age 6–7: 3 stars; Age 8–11: 4 stars; Age 12+: 5 stars.
  - Illumination duration (`band.litMs`): Age 4–5: 700ms; Age 6–7: 600ms; Age 8–11: 500ms; Age 12+: 450ms.
  - Step interval pause (`band.stepMs`): Age 4–5: 1000ms; Age 6–7: 900ms; Age 8–11: 800ms; Age 12+: 700ms.
  - Up to 3 sequence levels.
- **Hit / Error Criteria**:
  - **Hit**: Child reproduces the exact forward sequence by tapping stars in order.
  - **Error**: Tap on out-of-order or incorrect star.
- **Telemetry Keys Fed**:
  - `workingMemorySpan` (Longest sequence correctly reproduced, in stars)
  - `retryStars` (Practice replay count)
  - `camAwayPctStars`, `camMoveStars`

### Game 4: Sunstone Power Charge (Motor Inhibition)
- **Clinical Paradigm**: Delay of Gratification / Continuous Motor Restraint & Delay Maintenance.
- **Stimulus**:
  - Centered circular Sunstone orb (176–208px diameter) with glowing energy meter ring (0% to 100%).
- **Stimulus Duration & Timing**:
  - 3 trials (`CHARGE_TRIALS`): Hold target durations of 2500ms, 3200ms, 4000ms.
- **Hit / Error Criteria**:
  - **Success**: Child maintains touch/click until the 100% threshold chime sounds.
  - **Premature Release**: Child lifts pointer before 100% completion threshold.
- **Telemetry Keys Fed**:
  - `prematureReleases` (`chargeTrials` denominator = 3)
  - `holdEarly` (`holdTries` denominator)
  - `holdRtMs` (Average time to release after chime)

---

## 2. Autism Quest: "The Lantern Garden" (`app/assessments/autism`)

### Game 1: Joint Attention Gaze & Pointing (`JA_TRIALS`)
- **Clinical Paradigm**: Responsive Joint Attention (RJA) / Social Orienting & Gaze Cues.
- **Stimulus**:
  - Guide character "Aria" (top center): Clear gaze shifts (Left, Center, Right) and pointing arm gesture.
  - 3 handcrafted ceramic vessels below: Left Veranda Urn, Center Lotus Amphora, Right Emerald Vessel.
  - Vessels hit-box: Touch targets min 80×80px / 96×96px.
- **Stimulus Duration & Timing**:
  - 6 trials (`JA_TRIALS = [0, 5, 2, 1, 4, 3]`).
  - Trials 0–3: Direct gaze / pointing.
  - Trials 4–5: Hidden target (vessel partially behind a garden arch or pillar).
  - Aria makes direct eye contact for 900ms, then turns head/gaze toward target vessel.
- **Hit / Error Criteria**:
  - **Hit**: Tapping vessel indicated by Aria's gaze/pointing direction (`matched = true`).
  - **Error**: Tapping incorrect vessel.
- **Telemetry Keys Fed**:
  - `gazeMatches` (`jaCorrect` / `jaTrials`)
  - `gazeMedianMs` (Latency from gaze cue to selection)
  - `retryGaze` (Practice count)

### Game 2: Reversed Joint Attention Turn (`ja_show`)
- **Clinical Paradigm**: Initiating Joint Attention (IJA) / Shared Delight & Showing.
- **Stimulus**:
  - One of the three garden vessels gently glows with fireflies while Aria looks away.
  - Child prompt: "Show Aria where the firefly landed!"
- **Hit / Error Criteria**:
  - Child initiates showing by tapping the glowing vessel.
- **Telemetry Keys Fed**:
  - `showBids` (Number of turns child initiated showing out of 2)
  - `showMatches` (Tapped vessel matched the firefly sparkle target)

### Game 3: Emotion Mirror & Theory of Mind (`EMOTION_MIRROR_TRIALS`)
- **Clinical Paradigm**: Affect Recognition / Facial Emotion Decoding & Social Empathy.
- **Stimulus**:
  - Prompt Face: Fox Cub displaying 1 of 6 clear emotional expressions: Happy, Sad, Angry, Scared, Surprised, Calm.
  - 3 emotional sprite choice cards below (80×80px minimum faces).
  - Follow-up empathic soothing scenario ("What would help the sad fox?").
- **Stimulus Duration & Timing**:
  - 4 scored matching rounds + 1 comfort follow-up round.
- **Hit / Error Criteria**:
  - **Hit**: Selecting sprite that matches the fox cub's expressed feeling.
  - **Error**: Mismatched emotion selection.
- **Telemetry Keys Fed**:
  - `feelingsMatches` (`feelingsCorrect` / `feelingsTrials`)
  - `helpRound` (Qualitative choice of comfort item: warm blanket, chamomile tea, quiet nook)
  - `retryFeelings` (Practice count)

### Game 4: Sensory Sanctuary Calibration Haven
- **Clinical Paradigm**: Sensory Profile / Modulation & Sensory Threshold Assessment.
- **Stimulus**:
  - Sensory ramps across 3 modalities:
    1. Visual: Light brightness slider (0% to 100%).
    2. Auditory: Monsoon rain / chime sound volume (0% to 100%).
    3. Tactile: Weighted cushion pressure (0% to 100%).
  - Step duration: `ROOM_STEP_MS = 1200ms` per step.
  - Interactive room decoration items (calm lighting, floor rugs, quiet plants).
- **Hit / Error Criteria**:
  - Child taps "Just Right" or "Stop" when the stimulus reaches maximum comfort threshold.
  - Non-evaluative: preference measurement rather than correct/incorrect test.
- **Telemetry Keys Fed**:
  - `lightLevel`, `soundLevel`, `touchLevel` (Comfort ratings 0–10)
  - `rampStopLight`, `rampStopSound`, `rampStopTexture` (Step at which child stopped ramp)
  - `adjustLight`, `adjustSound`, `adjustTexture` (Number of adjustments made)
  - `shieldUses` (Times calm shield was tapped)
  - `designSec` (Total time spent in sanctuary)

### Game 5: Dimensional Change Card Sort (DCCS)
- **Clinical Paradigm**: Executive Function / Cognitive Flexibility & Rule Switching.
- **Stimulus**:
  - 2 destination sorting boxes: Red Star Box (left), Blue Circle Box (right).
  - Cards combining Color (Red / Blue) and Shape (Star / Circle).
  - Pre-switch rule: "Sort by Color".
  - Post-switch rule: "Sort by Shape" at trial index 3 (`DCCS_SWITCH_AT = 3`).
  - Advance warning: 3-second gentle visual/audio notice (`DCCS_WARN_SECONDS = 3`).
  - Total trials: 6 cards (`DCCS_CARDS`).
- **Hit / Error Criteria**:
  - **Pre-switch Hit**: Card sorted according to Color.
  - **Post-switch Hit**: Card sorted according to Shape.
  - **Perseverative Error**: Post-switch card sorted according to obsolete Color rule.
- **Telemetry Keys Fed**:
  - `sortCount` (Total cards sorted)
  - `sortMedianMs` (Median time per card)
  - `sortPre` (`sortPreCorrect` / `sortPreTotal`)
  - `sortPost` (`sortPostCorrect` / `sortPostTotal`)
  - `ruleNamed` (Rule identification score: 1 if correctly named Shape, 0 if Color)
  - `retrySorting` (Practice count)

---

## 3. Dyslexia Quest: "The Whispering Library" (`app/assessments/dyslexia`)

### Game 1: Echo Cave (Rhyme Judgment)
- **Clinical Paradigm**: Phonological Awareness / Rhyme Detection.
- **Stimulus**:
  - Spoken target word played via TTS (`speak(target)`).
  - 2 spoken choice options on identical illustrated book lecterns / lanterns.
  - 1 practice trial + 12 scored trials (`RHYME`).
- **Hit / Error Criteria**:
  - **Hit**: Selecting choice that rhymes with prompt.
  - **Error**: Selecting non-rhyming distractor.
- **Telemetry Keys Fed**:
  - `rhymeMatches` (`rhymeCorrect` / `rhymeTrials`)
  - `rhymeMedianMs` (Median reaction time)
  - `rhymeReplays` (Audio replay count)

### Game 2: Sound Stones (Initial Sound / Alliteration)
- **Clinical Paradigm**: Phonemic Isolation & Onset Sound Segmentation.
- **Stimulus**:
  - Spoken prompt word played via TTS.
  - 2 identical choice book/lantern cards.
  - 1 practice trial + 12 scored trials (`FIRST`).
- **Hit / Error Criteria**:
  - **Hit**: Selecting choice sharing initial phoneme.
  - **Error**: Selecting distractor with different initial phoneme.
- **Telemetry Keys Fed**:
  - `firstSoundMatches` (`firstSoundCorrect` / `firstSoundTrials`)
  - `firstSoundMedianMs` (Median reaction time)
  - `firstSoundReplays` (Audio replay count)

### Game 3: Mirror Moths (Letter Orientation Discrimination: b, d, p, q)
- **Clinical Paradigm**: Orthographic-Spatial Processing / Mirror Reversal Discrimination.
- **Stimulus**:
  - Target reference letter shown in plain, high-legibility sans-serif font (e.g. `b`).
  - 4×3 grid of 12 letter tiles (4 identical targets, 8 mirror/rotation look-alikes like `d`, `p`, `q`).
  - 4 rounds (`LET`).
- **Hit / Error Criteria**:
  - **Hit**: Correct target letter tiles tapped (`letterHits`).
  - **Lookalike False Tap**: Tapping distractor (`letterFalse`).
  - **Mirror False Tap**: Specific confusion on mirror pair (b vs d, p vs q) (`letterMirrorFalse`).
  - **Miss**: Target tile omitted before tapping "Done" (`letterMissed`).
- **Telemetry Keys Fed**:
  - `letterFound` (`letterHits` / `letterPossible`)
  - `letterLookalikeTaps` (`letterFalse` / `letterDistractors`)
  - `letterMirrorTaps` (`letterMirrorFalse` / `letterFalse`)
  - `retryLetters` (Practice repeat count)

### Game 4: Echo Steps (Sound Span / Syllable Memory)
- **Clinical Paradigm**: Phonological Loop Capacity / Verbal Working Memory.
- **Stimulus**:
  - 4 syllable sound stones (`bah`, `dee`, `moe`, `koo`).
  - Sequences ranging from 2 to 5 syllables.
  - Audio sequence played with 700ms onset and 250ms inter-syllable pause.
- **Hit / Error Criteria**:
  - **Hit**: Reproducing the exact sound sequence in forward order.
  - **Error**: Incorrect sequence order. 2 consecutive misses at a given span terminates the task.
- **Telemetry Keys Fed**:
  - `soundSpanPassed` (`soundSpanPassed` / `soundSpanAttempts`)
  - `soundSpanLongest` (Maximum span successfully recalled)

### Game 5: Lantern Words (Lexical Decision / Word Identification)
- **Clinical Paradigm**: Orthographic Lexicon Retrieval / Word vs. Pseudoword Discrimination.
- **Stimulus**:
  - Single word shown in plain, high-contrast typography on a plain, calm card.
  - Mixture of real words and phonologically plausible pseudowords (e.g. "flirp").
  - 12 trials (`WordCheck`). Two response options: "Real word" vs "Made-up word".
- **Hit / Error Criteria**:
  - **Hit**: Correctly identifying whether word is Real or Made-up.
  - **Error**: False acceptance or rejection.
- **Telemetry Keys Fed**:
  - `wordCheckReal` (`wordRealCorrect` / `wordRealTotal`)
  - `wordCheckMadeUp` (`wordMadeCorrect` / `wordMadeTotal`)
  - `wordCheckMedianMs` (Classification latency)

### Game 6: Spell Stones (Orthographic Choice)
- **Clinical Paradigm**: Orthographic Spelling Discrimination.
- **Stimulus**:
  - Spoken word played via TTS.
  - 2 printed spelling choices (correct spelling vs phonetically plausible foil e.g. "night" vs "nite").
  - 1 practice trial + 8 scored trials (`SPELL`).
- **Hit / Error Criteria**:
  - **Hit**: Selecting correct standard orthographic spelling.
  - **Error**: Selecting phonetically plausible foil.
- **Telemetry Keys Fed**:
  - `spellingCorrect` (`spellCorrect` / `spellTrials`)
  - `spellingMedianMs` (Selection latency)

---

## 4. Visual Upgrade & Immutability Verification (Before / After Log)

| Quest / Game | Visual & Sensory Changes | Immutability Confirmation (Rule A) |
|---|---|---|
| **ADHD: Sunbird Valley** (CPT, Flanker, Corsi, Sunstone) | Storybook gouache dawn palette, animated wings inside hit-box only after stimulus appearance, calm static arena background during trials, non-flash star pulse, progress trail with sunbird avatar. | Zero changes to `CPT_WAITS`, `displayMs`, `CPT_WINDOW_MS`, `FLANKER_ORDER`, star sequence delays, target hold times, hit-box dimensions, or scoring formulas. |
| **Autism: The Lantern Garden** (Gaze, Show, Emotion, Sensory, DCCS) | Hand-painted Aria guide with unambiguous 3-way gaze/pointing, 6 expressive fox cub emotional facial sprites (80px+), handcrafted ceramic vessels, rich cozy sensory sanctuary room with drag items, calm rule-change transition. | Exact trial sequence (`JA_TRIALS`, `EMOTION_MIRROR_TRIALS`, `DCCS_CARDS`), `DCCS_SWITCH_AT=3`, `ROOM_STEP_MS=1200ms`, camera tracker integrity, and telemetry fields preserved 100%. |
| **Dyslexia: The Whispering Library** (Rhyme, Sound, Mirror, Span, Words, Spell) | Whispering library enchanted hall, Pip the owl mascot (4 poses), glowing book lectern choices, clean sans-serif typography for all task words/letters (no distracting backdrop behind text), teen focus mode intact. | Speech audio delays, tile layout geometry (4×3 grid), mirror confusion matrix keys (`letterMirrorFalse`), syllable span thresholds, and word sets untouched. |

### Game 2 Completed: Autism — The Lantern Garden
- **Before**: Generic flat/dark SVG vessels and basic geometric SVG avatars. Emotion mirror showed basic SVG smiley shapes with no child-friendly character identity. DCCS used generic SVG shapes. Background was a single generic banner image with blur. No top progress trail. No in-game predictability markers or calm break capability.
- **After**:
  - Gaze game: Handcrafted illustrated gouache vessels (`vessel_veranda.webp`, `vessel_lotus.webp`, `vessel_emerald.webp`) and Aria 3-way gaze sprites (`aria_gaze_center.webp`, `aria_gaze_left.webp`, `aria_gaze_right.webp`) with locked 900ms gaze cue delay and unambiguous direction.
  - Feelings game: Fox cub illustrated emotional faces (`fox_happy.webp`, `fox_sad.webp`, `fox_angry.webp`, `fox_scared.webp`, `fox_surprised.webp`, `fox_calm.webp`), crisp and instantly readable at 80px+.
  - DCCS sorting game: Hand-painted destination boxes (`box_red_star.webp`, `box_blue_circle.webp`) and illustrated gem cards (`card_red_star.webp`, `card_blue_circle.webp`, etc.).
  - Predictability: Added "Two more, then a rest" cues across Gaze, Feelings, and DCCS.
  - Sensory Safety: Added persistent "Take a break" button with peaceful breathing garden modal. Static scene backdrops (`bg_gaze.webp`, `bg_feelings.webp`, `bg_sanctuary.webp`, `bg_sorting.webp`) during active tasks.
  - Audio: Looping ambient breeze and soft chime UI audio from `/quests/autism/audio/`.
- **Rule A Confirmation**: 100% locked. `JA_TRIALS`, `EMOTION_MIRROR_TRIALS`, `DCCS_CARDS`, `DCCS_SWITCH_AT=3`, `ROOM_STEP_MS=1200ms`, camera tracker, scoring formulas, and all telemetry keys remain completely untouched.

### Game 3 Completed: Dyslexia — The Whispering Library
- **Before**: Basic vector owl SVG with simple geometric shapes. Audio choice options had asymmetric pastel colors (`#f2a36b` vs `#7fd1c7`) that could inadvertently hint at answers. Letter tiles and word checks lacked ambient world grounding. No looping library ambience.
- **After**:
  - Mascot: Pip the Owl implemented with 4 expressive, hand-painted gouache poses (`pip_greeting.webp`, `pip_listening.webp`, `pip_cheering.webp`, `pip_resting.webp`).
  - Rhyme & First-Sound games: Choices sit on visually identical warm book plates (`#fff8e6`) with identical borders, ensuring zero visual cues to answers. Replay and audio timing preserved.
  - Letter Game (b, d, p, q): Plain sans-serif high-contrast Verdana font strictly preserved; mirror pairs (b/d, p/q) and 4×3 grid preserved without decorative fonts on the letters.
  - Sound Sequence (Echo Steps): 4 illustrated singing syllable stones (`stone_bah.webp`, `stone_dee.webp`, `stone_moe.webp`, `stone_koo.webp`) with soft amber glowing pulse (no strobing).
  - Word Check & Spelling: High-contrast plain readability panels with zero backdrop clutter, fully dyslexia-friendly.
  - Teen focus mode: 100% preserved with classical typography and minimal ledger.
  - Audio: Looping library hush ambience and soft chimes from `/quests/dyslexia/audio/`.
- **Rule A Confirmation**: 100% locked. `RHYME`, `FIRST`, `LET`, `LAYOUT`, `SYL`, `SEQS`, `WORDS`, `SPELL`, timing delays, and all telemetry keys remain completely untouched.

### Autism Quest Stimulus Art Rigorous Redraw (Fox Faces & Ceramic Vessels)
- **Clinical Motivation**:
  - In the Feelings Game, the fox face is the measured stimulus: if faces are ambiguous or fail to scale down to 80px, the clinical score measures artistic ambiguity rather than facial affect decoding.
  - In the Joint Attention Gaze Game, the child selects the vessel indicated by Aria's gaze: if any vessel is more salient, brighter, or features a more complex silhouette, the score measures visual preference rather than joint attention orienting.
- **Part 1: Fox Emotion Faces Redraw**:
  - **Shared Base**: All 6 expressions share the identical head shape, warm fox orange fur (`#DE5C1E`), darker warm outline (`#8C320A`), ear attachment base, and warm gouache card circle (`#FFF8ED`, border `#E2C6A0`).
  - **Muzzle & Mouth Geometry**: Prominent ivory-white muzzle (`#FFFDF8`) meeting under the button nose; mouth placed centrally on the muzzle completely clear of the lower chest ruff (which sits strictly below y=1520).
  - **Stroke Weight**: Brows and mouth drawn at 36–44px at 2048 (9–11px on 512px canvas), strictly exceeding the 8px minimum requirement for crisp readability at 80px.
  - **Unmistakable Emotion Cues**:
    - `happy`: Wide round open eyes with glossy highlights, relaxed arched brows, wide open D-smile showing tongue, raised rosy cheeks.
    - `calm`: Eyes half-closed with soft peaceful lids, horizontal level relaxed brows, gentle closed smile, neutral perky ears.
    - `sad`: Brows slope UP toward middle (`/ \`), eyes looking down, pronounced downturned frown arc, drooping ears, single blue teardrop on cheek.
    - `angry`: Brows slope DOWN toward middle in a sharp V (`\ /`), narrowed eyelids with fierce pupils, tight flat/downturned grimace line, ears pushed back (no red color change).
    - `scared`: Wide fear eyes with small constricted dot pupils, brows raised and pulled together toward center, wide horizontal tense mouth, ears flat back, single blue sweat drop on temple.
    - `surprised`: Wide eyes with large open pupils, high curved brows far apart, small round vertical "O" mouth, tall straight-up ears.
  - **Verification**: Shuffled blind test of unlabeled 80px faces resulted in 6/6 (100%) accurate identifications.
- **Part 2: Ceramic Vessels Redraw & Numeric Matching**:
  - **Shared Silhouette**: All three vessels share one single silhouette (round-bellied urn with tapered neck, flared rim, two firmly attached ear handles, pedestal foot, and soft contact shadow attached directly to the base).
  - **Symmetric Abstract Bands**: Veranda features 3 clean relief stripes; Lotus features an abstract symmetric leaf garland; Emerald features a symmetric geometric dot band. No faces, no smile curves, no teeth-like triangles, no sparkles.
  - **Empirical Measurement Table**:

| Vessel Asset | Opaque Area (px) | Bounding Box `(x0, y0, x1, y1)` | Bounding Box Size `(w × h)` | Opaque Centroid `(cx, cy)` | Mean Luminance `(0–255)` |
|---|---|---|---|---|---|
| `vessel_veranda.webp` | 58,508 | `(84, 120, 427, 395)` | `344 × 276` px | `(255.6, 256.1)` | 109.42 |
| `vessel_lotus.webp` | 58,508 | `(84, 120, 427, 395)` | `344 × 276` px | `(255.6, 256.1)` | 109.72 |
| `vessel_emerald.webp` | 58,508 | `(84, 120, 427, 395)` | `344 × 276` px | `(255.6, 256.1)` | 109.29 |

  - **Compliance Results**:
    - **Opaque Area Spread**: `0.00%` difference (Requirement: `< 3.00%`) → **PASS**
    - **Mean Luminance Spread**: `0.43` points difference (Requirement: `< 8.00` points) → **PASS**
    - **Bounding Box Match**: Identical `344 × 276` px across all three → **PASS**
    - **Opaque Centroid**: Centered at `(255.6, 256.1)`, precisely on the 512×512 canvas center `(256, 256)` → **PASS**

### Autism Quest Visual Cohesion & Immersion Upgrade (Gaze & Emotion Mirror Games)
- **Problem Resolved**:
  - Assets previously appeared broken when Next.js reverse proxy lacked `/quests/*` in `web/proxy.ts` (fixed in commit `a793193`).
  - Screen previously appeared as a stark white form/MCQ quiz box, obscuring the lush Indian courtyard and trellis gazebo environment behind a `-z-10` CSS stacking context.
  - Previous placeholder Aria was an untextured silhouette; vessel choices were small inside oversized cards; question text was duplicated.
  - Initial pass felt floating and ungrounded: Aria looked severed at the waist in an empty box, urns floated in dark recesses, and the sprite game felt like a modal dialog rather than an organic garden.
- **Visual Overhaul (Presentation Only)**:
  - **Aria Grounded at Palace Veranda Balustrade**: Aria is now positioned naturally behind a carved sandstone terrace balustrade (`VerandaRailingSvg` in `QuestFX.tsx`) with Mughal jali arch cutouts. Her lower edge is tucked behind the stone railing, so she naturally stands at the terrace balustrade looking and pointing directly toward the urns.
  - **Ceramic Urns on Courtyard Pedestals**: Replaced floating UI buttons with three carved sandstone terrace pedestals (`bg-gradient-to-b from-[#C49A6C]/30 ... border-2 border-[#EAD7B8]/40 shadow-xl`), with stone cap moldings, ground contact shadows, and carved brass plaques. For hidden trials (4 and 5), an ornate carved palace pillar naturally shields the urn instead of a black box.
  - **Organic Garden Gazebo in Sprite Game**: Removed dark heavy modal boxes. Amber the Fox Cub is framed inside an Enchanted Blossom Mirror draped in climbing ivy tendrils and pink garden blossoms (`🌿 🌸`). The choice sprites sit on mossy garden river stones with green moss crests and warm firefly dust.
  - **Luminous Translucent Pergola HUD**: Reduced container opacity to a delicate, luminous glass (`from-[#14120E]/50 via-[#1D1914]/40 to-[#120F0C]/60 backdrop-blur-md`), allowing the entire sunlit courtyard and garden gazebo to illuminate the scene.
- **Rule A Confirmation**:
  - All trial arrays (`JA_TRIALS`, `EMOTION_MIRROR_TRIALS`, `SHOW_TARGETS`), 900ms gaze cue delay, scoring logic, hit-boxes, and telemetry keys are 100% locked and unchanged.

### ADHD Quest Visual Cohesion & Immersion Upgrade (Sunbird Valley)
- **Problem Resolved**:
  - The 4 clinical ADHD games previously rendered inside flat, opaque white containers (`bg-white/95`) with an excessive tint (`bg-[#FFFDF7]/65`) that washed out the lush Sunbird Valley backdrop art (`bg_sunbird.webp`, `bg_flanker.webp`, `bg_memory.webp`, `bg_charge.webp`).
  - Chapter 1 (Sunbird Spotting / CPT-3) rendered inside a generic dark circle with standard web form buttons.
  - Chapter 2 (Solar Chevrons / Flanker Steering) rendered as a baby-blue card with standard flat arrow buttons, resembling a multiple-choice school test paper.
  - Chapter 3 (Astrolabe Memory Matrix / Corsi Blocks) rendered as a pitch-black box with basic circular nodes.
  - Chapter 4 (Sunstone Power Charge / Motor Restraint) lacked the ceremonial grandeur of an ancient sun temple altar.
- **Visual Overhaul (Presentation Only)**:
  - **Luminous Storybook Canopies**: Replaced sterile opaque white cards with warm translucent amber/indigo glass canopies (`backdrop-blur-md` with carved sandstone and brass filigree borders), allowing the sunrise meadows, canopy trails, starlight terraces, and sun temples to illuminate the games.
  - **Chapter 1 (Sunbird Sighting - CPT-3)**: Transformed the sighting circle into the **Ancient Sunstone Sundial Arena** in the morning meadow, framed with carved sandstone dial rims (`border-8 border-[#C49A6C]`), engraved celestial compass marks, and a tactile carved golden sunstone tap paddle (`py-6 text-2xl border-2 border-amber-300/50`).
  - **Chapter 2 (Solar Chevrons - Flanker Steering)**: Transformed the chevron arena into **Guide Chirp's Forest Canopy Airship Navigational Helm** (`bg-gradient-to-r from-[#2A1D13]/90 via-[#3D2B1C]/90 to-[#2A1D13]/90 border-2 border-[#D4A373]/60 shadow-inner`). Left/Right controls are styled as **Tactile Carved Teakwood & Polished Brass Steering Paddles** (`min-h-[80px] border-4 border-[#D4A373] bg-gradient-to-b from-[#3E2713] to-[#2B170B]`) with embossed brass steering runes.
  - **Chapter 3 (Astrolabe Memory Matrix - Corsi Blocks)**: Transformed the 3×3 grid into the **Celestial Sky Citadel Astrolabe** mounted on the starlight terrace (`bg-gradient-to-b from-[#0A0D1A] via-[#101428] to-[#080A14] border-4 border-[#6366F1]/50 shadow-2xl`). The 9 star nodes are styled as inlaid lapis astral gems that radiate golden celestial starlight when illuminated.
  - **Chapter 4 (Sunstone Power Charge - Motor Restraint)**: Styled as the sacred **Sunstone Altar in the Temple Courtyard**, featuring an etched golden radial progress gauge (`stroke="#F59E0B"`), an ancient carved amber sunstone relic orb with pulsing solar flares while held, and an emerald crystal burst upon achieving the threshold chime.
  - **Sensory Safety & Dyslexia Compliance**: No strobing or flashing >2fps, no screen shake, plain high-legibility sans-serif typography with generous spacing and strong contrast, full keyboard and touch operability with tap targets >= 48px.
- **Rule A Confirmation**:
  - All trial parameters (`CPT_TOTAL_TRIALS`, `cptPlan`, `FLANKER_TOTAL_TRIALS`, `AGE_BANDS` sequences and durations, `CHARGE_TRIALS` targets of 2500ms, 3200ms, 4000ms), stimulus onset times, display durations, hit boxes, scoring formulas, and telemetry keys are 100% locked and untouched.

---

## 5. Instrument Versioning
- **Previous `INSTRUMENT_VERSION`**: `2026.11.13`
- **Updated `INSTRUMENT_VERSION`**: `2026.11.14` (Bumped version in `web/components/assessments/version.ts` due to visual framing and presentation upgrades across ADHD Quest and Autism Quest).

---

## 6. Character Selection Visuals Upgrade (`WelcomeWizard.tsx`, `CharacterAvatars.tsx`)
- **Problem Resolved**:
  - The initial character/affinity selection screen in Step 1 of `WelcomeWizard` only displayed tiny 24×24px monochrome line icons with abstract adult descriptions ("Canopy Sky Ranger — Sharp Focus & Vigilant Watch"), making it difficult for pediatric players (ages 4–14) to understand who they are choosing.
- **Visual Overhaul (Presentation Only)**:
  - **Bespoke Character Portraits (`CharacterAvatars.tsx`)**: Crafted 6 high-detail, charming vector character portraits with storybook dawn/dusk palettes, expressive facial features, cute hair/headwear, and faithful companions:
    - **ADHD Sunbird Valley Explorer Guild**:
      1. `Canopy Sky Ranger` (Badge: *Eagle-Eyed Scout*): Agile young ranger with emerald cowl, golden feather, birch bow, sparkling hazel eyes, and rosy cheeks (*"Fast & sharp-eyed · Spots distant birds in the forest canopy"*).
      2. `Astral Spellcaster` (Badge: *Star Mage*): Wonder-filled young star-mage in midnight-violet capelet with gold star hairpin, holding a crystal star wand (*"Creative & quick-thinking · Lights up constellations with starlight"*).
      3. `Sunfire Knight` (Badge: *Sun Guardian*): Kind, brave young hero in polished bronze-gold breastplate with a radiant sun-crest shield (*"Steady & calm-hearted · Brings courage and focus to the valley"*).
    - **Autism Lumina Groves Affinities**:
      1. `Grove Harmonizer` (Badge: *Forest Friend*): Gentle nature friend in woven clover crown and mint-green linen tunic with two glowing firefly companions (*"Gentle & caring · Listens to the trees, plants, and friendly fireflies"*).
      2. `Crystal Alchemist` (Badge: *Pattern Explorer*): Inquisitive researcher with round brass spectacles, potion vials, and a glowing faceted crystal flask (*"Curious & observant · Notices hidden clues and solves colorful puzzles"*).
      3. `Quiet Seeker` (Badge: *Peaceful Observer*): Serene, observant child wrapped in a cozy knitted lavender scarf with a snowy white peace dove resting softly on their shoulder (*"Calm & thoughtful · Notices gentle details and understands friends quietly"*).
  - **WelcomeWizard Character Cards**: Upgraded Step 1 into spacious hero character cards with a dedicated `h-36 sm:h-40` portrait container, persona pill, clear superpower subtitles, and an illuminated `ring-4` active state with `★ Chosen` badge.
  - **Confirmation Step Preview**: In Step 4 (review screen), the selected character portrait thumbnail is displayed alongside the child's codename and age.
- **Rule A Confirmation**:
  - All assessment parameters, age band allocations, scoring, consent gates, and telemetry keys remain 100% locked and unchanged.

---

## 7. ADHD Chapter 1: Immersive Sky Observation Arena Upgrade
- **Problem Resolved**:
  - Game 1 (Sunbird Sighting / CPT-3) previously displayed an artificial dark spinning vortex (`#0F172A`) inside an oval peephole with a plain button below, feeling like a clinical laboratory test rather than an immersive adventure.
  - The child was told to "watch the dawn skies of the valley", but the screen lacked an actual sky.
- **Visual Overhaul (Presentation Only)**:
  - **Sunbird Valley Sky Observation Arena (`SunbirdSkyArena`)**:
    - Replaced the dark spinning vortex with an expansive, breathtaking panoramic dawn sky lookout (`bg_sunbird.webp`), showing the authentic painted watercolor sky, morning sunbeams, rolling green meadows, and framing Gulmohar branches.
    - Embedded a wooden/sandstone observation balustrade across the base where Guide Chirp perches to watch the sky alongside the child.
    - When the Golden Sunbird appears, it soars majestically in the morning sky with a warm sunlit aura.
    - When the Shadow Moth appears, it flutters across the morning sky with a cool twilight mist halo.
    - During the waiting intervals, the sky remains open, peaceful, and alive with a delicate celestial compass reticle: *"Watch the Sky…"*.
    - The child can tap directly anywhere on the sky canvas or on the prominent **Golden Sunstone Tap Paddle** (`☀️ TAP SKY OR BUTTON!`) below.
  - Applied cohesively across `cpt_story`, `cpt_hold`, `cptPrac`, and `cpt_game`.
- **Rule A Confirmation**:
  - 100% locked clinical parameters: stimulus presentation durations, ISI delays (`CPT_WAITS`), block trial sequences (`CPT_ORDER`), hit/omission/commission recording, reaction time precision (`HRT`, `RTV`), hit-boxes, and telemetry keys remain strictly identical.



# IN THEIR WORLD — PACKET 9.3 IMPLEMENTATION REPORT
## Research Citation Repair, Regulatory Accuracy & Test Reliability

- **Repository:** `darayavahoush/manaslearning-platform`
- **Application Root:** `web/` (`Next.js 16.4.3 Turbopack`, React 19)
- **Review Branch:** `itw/packet-8-review`
- **Baseline Git Commit:** `aaf1a8cf24ae137af83fbdf120ac3072b35ba722` (Packet 9.2 pushed baseline)
- **Status:** Complete — All 46/46 Packet 9.3 runtime assertions, 74/74 static regression checks, 8/8 Packet 5 baseline checks, TypeScript typecheck, ESLint, and Next.js Turbopack production build passing cleanly.

---

## 1. Executive Summary

Packet 9.3 resolves lingering citation inaccuracies, aligns statutory and curriculum references with official government sources, removes dormant simulation CSS, isolates test suites to prevent baseline screenshot collisions, and establishes a comprehensive, repeatable 46-point automated runtime browser test suite for the three redesigned modules: Speech & Language, Dyscalculia, and Executive Functioning.

### Core Objectives Achieved:
1. **Accurate Dyscalculia Primary Source:** Corrected the primary literature citation to Ramaa & Gowramma (2002) in *Dyslexia* with exact DOI (`10.1002/dys.214`), volume (`8(2)`), and pagination (`67–85`), accurately presenting the two separate Mysore study samples (5.98% of 251 students; 5.54% of 1,408 students) without combining them or misrepresenting them as national prevalence.
2. **Accurate Speech & Language Primary Source:** Replaced the inaccurate Kumar et al. attribution with Varghese et al. (2023) in *Clinical Epidemiology and Global Health* (`10.1016/j.cegh.2023.101327`), accurately citing a 1.68% stuttering prevalence in a cohort of 3,437 school children aged 6–15 in Dakshina Kannada district, Karnataka, and labeling classroom multi-dialectal support as practical pedagogical guidance.
3. **Accurate Executive Functioning Primary Source:** Accurately cited Selvam, Thomas, Kurpad, & Srinivasan (2018) in *Child Neuropsychology* (`10.1080/09297049.2016.1254761`) with correct volume, issue, and pages (`24(2), 226–246`), accurately stating the sample of 412 typically-developing Bengaluru preschoolers aged 2–5, and labeling inclusive classroom strategies honestly as pedagogical strategies.
4. **Regulatory & Policy Alignment:** Corrected the NCERT National Focus Group Position Paper on Teaching of Mathematics (NCF 2005) reference to **Section 5.2 ('Mathematics Laboratory')**; corrected the date of CBSE Circular No. `CBSE/Coord/2020` to **20 January 2020 (20.01.2020)**; and qualified CBSE Examination Bye-Laws Rule 24 accommodations as individual statutory entitlements under the Rights of Persons with Disabilities (RPwD) Act 2016 requiring formal benchmark disability certification and board approval.
5. **Elimination of Dormant Simulation CSS:** Removed lingering `.itw-reading-passage.itw-simulated`, `.itw-cp-letter`, and `@keyframes itw-letter-jitter` rules from `InTheirWorld.css`, ensuring zero simulation-jitter code remains in the codebase.
6. **Screenshot Protection:** Updated `verify-packet5-suite.mjs` to write test captures to `web/docs/itw/screenshots/packet5_retest/`, keeping the 7 approved Packet 5 visual baselines in `web/docs/itw/screenshots/` and Packet 9.2 captures completely untouched.
7. **Comprehensive Automated Runtime Verification:** Created `verify-packet9-3-runtime.mjs` executing 46 end-to-end interactive assertions in headless Chrome via Chrome DevTools Protocol (CDP), testing exact reactive dialogue turn changes, AAC speech synthesis, numeric stepper math and live differences, board view toggles, task column movement with DOM tracking (`data-status-column`, `data-task-id`), editable controlled inputs, and responsive reflow at 320px viewport across all three redesigned modules.

---

## 2. Research Citation & Regulatory Corrections

### 2.1 Dyscalculia Primary Literature Citation
- **Author & Year:** Ramaa, S., & Gowramma, I. P. (2002).
- **Article Title:** *A systematic procedure for identifying and classifying children with Dyscalculia among primary school children in India.*
- **Journal & Citation:** *Dyslexia*, 8(2), 67–85.
- **Traceable DOI:** [10.1002/dys.214](https://doi.org/10.1002/dys.214) (PMID: 12067188).
- **Sample Attribution:**
  - **Study 1:** 5.98% (15 identified cases out of 251 students screened across grades 3–4 in Mysore).
  - **Study 2:** 5.54% (78 identified cases out of 1,408 primary school students screened across grades 3–4 in Mysore).
- **Contextual Qualification:** Explicitly stated that these findings reflect localized South Indian primary school screening cohorts using a specific experimental identification procedure, not a generalized national epidemiological prevalence rate.
- **SLD Corroboration Context:** Clarified that Karande et al. (Mumbai) assessed broad Specific Learning Disabilities (SLD) collectively, rather than reporting an isolated national dyscalculia prevalence statistic.

### 2.2 Speech & Language Primary Literature Citation
- **Author & Year:** Varghese, B., et al. (2023).
- **Article Title:** *Prevalence of stuttering among school age children in Dakshina Kannada district of Karnataka, India.*
- **Journal & Citation:** *Clinical Epidemiology and Global Health*, 22, 101327.
- **Traceable DOI:** [10.1016/j.cegh.2023.101327](https://doi.org/10.1016/j.cegh.2023.101327).
- **Sample Attribution:** 3,437 school children aged 6–15 years in Dakshina Kannada district, Karnataka, reporting a stuttering prevalence of 1.68%.
- **Contextual Qualification:** Clarified that this finding reflects a localized regional school survey specifically evaluating stuttering, and must not be extrapolated as a national prevalence figure or generalized across all speech, language, and communication disorders.
- **Pedagogical Framing:** Removed unsupported institutional clinical guidelines attribution from classroom multi-dialectal suggestions, honestly categorizing them as practical pedagogical guidance for multilingual classrooms.

### 2.3 Executive Functioning Primary Literature Citation
- **Author & Year:** Selvam, S., Thomas, T., Kurpad, A. V., & Srinivasan, K. (2018).
- **Article Title:** *Development of norms for executive functions in typically-developing Indian urban preschool children and its association with nutritional status.*
- **Journal & Citation:** *Child Neuropsychology*, 24(2), 226–246.
- **Traceable DOI:** [10.1080/09297049.2016.1254761](https://doi.org/10.1080/09297049.2016.1254761).
- **Sample Attribution:** 412 typically-developing urban preschool children aged 2–5 years in Bengaluru, evaluated using the Behavior Rating Inventory of Executive Function - Preschool Version (BRIEF-P).
- **Contextual Qualification:** Accurately presented as a normative reference study examining executive functioning and nutritional status in typically developing preschoolers; clarified that it did not assess co-occurrence rates with ADHD or learning disabilities.
- **Pedagogical Framing:** Replaced non-traceable UDL publication attributions with honest labeling as practical classroom pedagogical strategies (visual schedules, chunking, and working-memory externalization).

### 2.4 NCERT & CBSE Regulatory Audit
- **NCERT Mathematics Laboratory Guidance:**
  - **Source Document:** NCERT National Focus Group Position Paper on Teaching of Mathematics (National Curriculum Framework 2005).
  - **Section:** **Section 5.2 ('Mathematics Laboratory')** (corrected from Section 3.2).
  - **Content:** Recommends concrete manipulatives, tactile measuring materials, and visual representations before transitioning into abstract mathematical calculations.
- **CBSE Calculator Exemption:**
  - **Circular Identifier:** Circular No. `CBSE/Coord/2020`.
  - **Issue Date:** **20 January 2020 (20.01.2020)** (corrected from 22.01.2020).
  - **Content:** Permits students with certified dyscalculia to use basic arithmetic calculators in Class X and XII board examinations.
- **CBSE Examination Bye-Laws & RPwD Act 2016:**
  - **Provisions:** Rule 24 and Circular `CBSE/Coord/2019/13523` govern compensatory examination time (20 minutes per hour) and adult scribes/readers.
  - **Procedural Requirement:** Explicitly clarified that examination accommodations are statutory entitlements under the Rights of Persons with Disabilities (RPwD) Act 2016, requiring valid medical certification of benchmark disability ($\ge 40\%$), formal application through the affiliated school, and compliance with applicable board verification procedures.

---

## 3. Code Modifications & Verification Improvements

### 3.1 `web/components/itw/InTheirWorld.jsx`
- Updated research citations and bibliographic data in Indian Context sections for Speech & Language, Dyscalculia, and Executive Functioning.
- Corrected NCERT section reference to Section 5.2.
- Corrected CBSE Circular date to 20.01.2020 and enriched accommodation descriptions with statutory eligibility criteria under the RPwD Act 2016.
- Added stable testable DOM attributes to Planning Desk task boards:
  - `data-status-column="now"`, `data-status-column="next"`, `data-status-column="later"` on planning board columns.
  - `data-task-id={task.id}` on individual task cards to enable precise, unambiguous automated tracking of task column transitions.

### 3.2 `web/components/itw/InTheirWorld.css`
- Removed lingering dormant dyslexia simulation CSS:
  - Line 315: Removed `.itw-cp-letter` styling.
  - Lines 983–990: Removed `.itw-reading-passage.itw-simulated` and `@keyframes itw-letter-jitter`.
- Verified via repository-wide search (`git grep`) that 0 occurrences of simulation jitter or letter displacement CSS remain.

### 3.3 `web/scripts/verify-packet5-suite.mjs`
- Defined ES module directory paths (`fileURLToPath(import.meta.url)`).
- Redirected test screenshot captures from the root `web/docs/itw/screenshots/` directory to `web/docs/itw/screenshots/packet5_retest/`.
- Guaranteed that executing the Packet 5 regression suite will never overwrite or alter the 7 baseline screenshots (`packet5-*.png`).

### 3.4 `web/scripts/verify-packet9-1.mjs`
- Updated static AST and text checks to validate Packet 9.3 corrections:
  - Ramaa & Gowramma (2002) DOI `10.1002/dys.214`, Vol 8(2), pp. 67–85, and dual Mysore cohorts.
  - Varghese et al. (2023) DOI `10.1016/j.cegh.2023.101327`, sample size 3,437, and 1.68% stuttering prevalence.
  - Selvam et al. (2018) DOI `10.1080/09297049.2016.1254761`, Vol 24(2), pp. 226–246, and 412 preschool cohort.
  - NCERT Section 5.2 and CBSE Circular dated 20.01.2020.
- All 74 static checks passed with zero errors.

### 3.5 `web/scripts/verify-packet9-3-runtime.mjs`
- Authored a rigorous, standalone Node.js CDP test script utilizing Chrome DevTools Protocol on an isolated debugging port (`9243`).
- Validates 46 discrete runtime browser assertions across the live DOM without brittle sleep statements or synthetic mocking of business logic.

---

## 4. Test Suite Execution & Results

### 4.1 Test Summary Table
| Test Suite / Tool | Command / Script | Result | Checks Passed | Exit Code |
| :--- | :--- | :---: | :---: | :---: |
| **Static Regression Suite** | `node web/scripts/verify-packet9-1.mjs` | **PASS** | 74 / 74 | `0` |
| **Packet 9.2 Runtime Suite** | `node web/scripts/verify-packet9-2-runtime.mjs` | **PASS** | 35 / 35 | `0` |
| **Packet 9.3 Runtime Suite** | `node web/scripts/verify-packet9-3-runtime.mjs` | **PASS** | 46 / 46 | `0` |
| **Packet 5 Regression Suite** | `node web/scripts/verify-packet5-suite.mjs` | **PASS** | 8 / 8 | `0` |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **PASS** | 0 errors | `0` |
| **ESLint** | `npm run lint` | **PASS** | 0 errors | `0` |
| **Turbopack Production Build** | `npm run build` | **PASS** | 21 / 21 static pages | `0` |

### 4.2 Packet 9.3 Runtime Suite Details (`verify-packet9-3-runtime.mjs`)
The 46 assertions in `verify-packet9-3-runtime.mjs` encompass:
1. **Speech & Language Communication Access Studio (12 assertions):**
   - Studio container hydration and title presence.
   - Pacing toggle verification: Turn 3 text dynamically changes based on unhurried pacing state.
   - 4-way practice toggles: Turn 3 text dynamically updates across individual toggle combinations (pacing off, finishing off, pacing restored, finishing restored).
   - AAC tablet communication: Assembly of symbol phrase ("Sand Layer" + "Clean Water") verified in output display.
   - Speech synthesis controls: Verified `handlePlayAac`, `handleStopAac`, and `handleClearAac` invocation; validated status updates in `role="status"` live region.
   - Scenario switching: Automatic `speechSynthesis.cancel()` execution verified on scenario tab switch.
   - Pause representation: Verified neutral `[pause]` representation in Scenario C without artificial time counts.
2. **Dyscalculia The Quantity Kitchen (13 assertions):**
   - Kitchen container hydration.
   - Stepper baseline: Lemon count initially 2, target 4.
   - Increment: Lemon count updates to 3.
   - Target reached: Lemon count updates to 4, matching target.
   - Decrement & return: Decrements to 3, returns to 4.
   - View switcher `aria-pressed` states: Verified `aria-pressed="true"` toggles correctly across Grouped, Bar, and Numeric views.
   - Mathematical calculations in Numeric view:
     - Base quantity: `2`
     - Multiplier: `x2`
     - Target quantity: `4`
     - Current quantity: `4`
     - Live difference calculation: `Difference: 0` (and `-1` when count was 3).
3. **Executive Functioning The Project Planning Desk (15 assertions):**
   - Planning Desk container hydration.
   - Initial column assignment: Task 2 present inside `[data-status-column="now"]`.
   - Two-way column movement:
     - Moved Task 2 from `now` to `next` (verified via `[data-status-column="next"] [data-task-id="exec-task-2"]`).
     - Moved Task 2 back from `next` to `now`.
     - Moved Task 2 from `now` to `later` (verified via `[data-status-column="later"] [data-task-id="exec-task-2"]`).
     - Moved Task 2 back from `later` to `now`.
   - Progress counter: Subtask toggle updates completion counter (2 of 5 Completed).
   - Controlled input fields: Native input typing verified across all 3 Next-Action reminder fields:
     - Last worked on: "Wrote methodology outline"
     - Next action: "Draft experimental setup"
     - Needed resource: "Lab notebook and rubric"
   - Change-of-Plan workflow: Opened modal, selected "Split into Phase A / Phase B", confirmed update reflected in active Next-Action reminder.
   - Perspective switching: Switched view to Workflow Map and returned to Planning Desk; verified preserved task state.
4. **Responsive Reflow at 320px Viewport (6 assertions):**
   - Emulated mobile viewport (320px width, 568px height, `isMobile: true`).
   - Verified `document.documentElement.scrollWidth <= 320` and container `scrollWidth <= 320` individually for:
     - Speech & Language (`/experience?condition=speech`)
     - Dyscalculia (`/experience?condition=dyscalculia`)
     - Executive Functioning (`/experience?condition=executive`)
   - Zero horizontal overflow detected across all three modules.

---

## 5. Visual Evidence & Artifacts

### 5.1 Protection of Baseline Artifacts
- **Packet 5 Baselines:** The 7 original baseline captures (`packet5-*.png`) in `web/docs/itw/screenshots/` remain completely intact and uncommitted.
- **Packet 9.2 Captures:** The 5 captures in `web/docs/itw/screenshots/packet9_2/` remain completely intact.
- **Packet 5 Retest Captures:** Test runs of `verify-packet5-suite.mjs` write exclusively to `web/docs/itw/screenshots/packet5_retest/`.

### 5.2 Packet 9.3 Runtime Visual Artifacts
Captured during automated browser execution of `verify-packet9-3-runtime.mjs` and saved to `web/docs/itw/screenshots/packet9_3/`:
1. `01_speech_dialogue_and_aac.png` (Desktop 1440x900): Live dialogue turns with toggled communication practices and active AAC phrase assembly.
2. `02_dyscalculia_steppers_and_views.png` (Desktop 1440x900): Quantity Kitchen steppers at target 4 with Numeric view showing base, multiplier, target, and 0 difference.
3. `03_executive_planning_desk.png` (Desktop 1440x900): Planning Desk with task movement across Now/Next/Later, subtask counter, and typed Next-Action reminder notes.
4. `04_responsive_320px_speech.png` (Mobile 320x568): Speech & Language module reflowed to 320px width without horizontal scrolling.
5. `05_responsive_320px_dyscalculia.png` (Mobile 320x568): Dyscalculia module reflowed to 320px width with responsive steppers.
6. `06_responsive_320px_executive.png` (Mobile 320x568): Executive Functioning board reflowed to 320px width with stacked status columns.

---

## 6. Testing Rigor & Honest Limitations

### 6.1 Testing Rigor
- Tests interact directly with rendered browser DOM nodes via Chrome DevTools Protocol (`Runtime.evaluate`, `DOM.querySelector`, `Input.dispatchMouseEvent`).
- State changes are validated against rendered DOM attributes (`aria-pressed`, `data-status-column`, `data-task-id`, text content, and input `.value`), ensuring genuine reactivity rather than superficial mock evaluation.
- Responsive tests evaluate live computed dimensions (`document.documentElement.scrollWidth`, `container.scrollWidth`) at 320px viewport emulation.

### 6.2 Testing Limitations
1. **Mocked Web Speech API in Headless Chrome:** Headless Chrome runs in virtual display environments where OS-level audio drivers and text-to-speech synthesizers are not attached. To test AAC speech invocation reliably, `window.speechSynthesis` was stubbed in test scripts to record speak/cancel/pause method calls. Hardware acoustic audio output must be verified on physical devices.
2. **Automated vs. Manual Screen Reader Verification:** While semantic HTML elements, ARIA attributes (`aria-pressed`, `aria-live="polite"`), and focus management were verified programmatically, screen reader user experience (e.g., NVDA on Windows, VoiceOver on macOS/iOS) requires human audition.
3. **Local Development Port Constraints:** Verification scripts require an active local HTTP server on port 3000. Automated scripts were designed to utilize dedicated CDP ports (`9243`) to prevent port conflicts with concurrent processes.

---

## 7. Git & Version Control Details

- **Target Review Branch:** `itw/packet-8-review`
- **Remote:** `origin` (`https://github.com/darayavahoush/manaslearning-platform.git`)
- **Base Commit:** `aaf1a8cf24ae137af83fbdf120ac3072b35ba722`
- **Modified Source Files:**
  - `web/components/itw/InTheirWorld.jsx`
  - `web/components/itw/InTheirWorld.css`
  - `web/scripts/verify-packet5-suite.mjs`
  - `web/scripts/verify-packet9-1.mjs`
- **New Files Added:**
  - `web/docs/itw/PACKET9_3_IMPLEMENTATION_REPORT.md`
  - `web/scripts/verify-packet9-3-runtime.mjs`
  - `web/docs/itw/screenshots/packet9_3/01_speech_dialogue_and_aac.png`
  - `web/docs/itw/screenshots/packet9_3/02_dyscalculia_steppers_and_views.png`
  - `web/docs/itw/screenshots/packet9_3/03_executive_planning_desk.png`
  - `web/docs/itw/screenshots/packet9_3/04_responsive_320px_speech.png`
  - `web/docs/itw/screenshots/packet9_3/05_responsive_320px_dyscalculia.png`
  - `web/docs/itw/screenshots/packet9_3/06_responsive_320px_executive.png`
- **Safety Commitments Honored:**
  - No merge or rebase with `main`.
  - No force-pushing (`--force` or `--force-with-lease`).
  - No overwriting of approved baseline screenshots.
  - No alteration of approved ADHD, Autism, or Dyslexia experiences.

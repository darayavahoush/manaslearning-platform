# In Their World (ITW) — Illustration Audit & Production Plan

**Target Branch:** `feat/itw-illustrations`  
**Base Commit:** `fix/itw-adhd-dyscalc-apd` (`f50984b`)  
**Commit Author:** `Ananya Sridhar <ananyasridhar108@gmail.com>`  
**Generated:** November 2026  

---

## 1. Initial Asset & File Integrity Audit

### Duplicate File Analysis (`web/public/decor/itw/`)
An MD5 comparison of all files in `web/public/decor/itw/` confirms two major redundancy issues:
1. **ADHD Triple Duplication**:
   - `adhd-environment.webp` (MD5: `25b83fa69eba21a1eba94e7d003489af`, 186,654 bytes)
   - `adhd-sticker.webp` (MD5: `25b83fa69eba21a1eba94e7d003489af`, 186,654 bytes)
   - `adhd-workspace-scene.webp` (MD5: `25b83fa69eba21a1eba94e7d003489af`, 186,654 bytes)
   - *Finding:* The sticker, instructions plate, and landing card are currently byte-identical.
2. **Autism Double Duplication**:
   - `autism-environment.webp` (MD5: `ba10d54c9229bf149dcd0cee115f0247`, 171,264 bytes)
   - `autism-sticker.webp` (MD5: `ba10d54c9229bf149dcd0cee115f0247`, 171,264 bytes)
   - *Finding:* The introductory sticker and atrium environment scene are byte-identical.

### Flow Step Gap Analysis across `web/components/itw/InTheirWorld.jsx`
| Module | Intro | Instructions Plate | Run Brief (Pre-Run 2 / Challenge) | The Sim Itself | Reflect Screen | Support Picker (3 cards) | Explain ("What Helps") |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Autism** | Vignette (duplicate) | Present (`autism-environment.webp`) | **Missing** | Sim canvas | Q&A only | 3 text-only cards | **Missing hero plate** |
| **ADHD** | Vignette (duplicate) | Present (`adhd-environment.webp`) | **Missing** (`interrupted_intro` text-only) | Sim canvas | Q&A only | 3 text-only cards | **Missing hero plate** |
| **Dyslexia** | Vignette (`dyslexia-sticker.webp`) | **Missing** (4-tab suite has no scene plate) | **Missing** (no challenge hero plate) | 5 interactive sub-labs | Metric stats only | 3 text-only cards | **Missing hero plate** |
| **Speech** | Vignette (`speech-sticker.webp`) | Present (`communication-environment.webp`) | **Missing** (jumps directly to run_fast) | Audio/turn sim | Q&A only | 3 text-only cards | **Missing hero plate** |
| **Dyscalculia** | Vignette (`dyscalculia-sticker.webp`) | Present (`dyscalculia-environment.webp`) | **Missing** (`unsupported_intro` text-only) | Recipe sim | Q&A only | 3 text-only cards | **Missing hero plate** |
| **Dysgraphia** | Vignette (`dysgraphia-sticker.webp`) | Present (`dysgraphia-environment.webp`) | **Missing** (`unsupported_intro` text-only) | Keyboard sim | Q&A only | 3 text-only cards | **Missing hero plate** |
| **Auditory** | Vignette (`auditory-sticker.webp`) | Present (`auditory-processing-environment.webp`) | **Missing** (`unsupported_intro` text-only) | Audio sim | Q&A only | 3 text-only cards | **Missing hero plate** |
| **Executive** | Vignette (`executive-sticker.webp`) | Present (`executive-functioning-environment.webp`) | **Missing** (`unsupported_intro` text-only) | Kanban sim | Q&A only | 3 text-only cards | **Missing hero plate** |
| **Day Through My Eyes** | Card banner | Book casing | N/A | 4 periods reuse 3 generic images | N/A | N/A | N/A |
| **Landing Page** | Hero image | Card banners | N/A | "How It Works" 1-2-3 (text numbers) | N/A | N/A | "Next Steps" CTA (text only) |

---

## 2. Master Illustration Production Plan

### Tier 1 — Must-Have Core Narrative & Replacement Scenes (24 images)

#### A1–A8: Unique "Run Brief" Pre-Run Scenes (1200x672, 16:9)
| Slot ID | Module | Step / Purpose | Where in JSX | Size | Current State | Proposed File Name |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A1** | Autism | Run Brief: Central atrium sensory barrage | `AutismModule` (`scenario`) | 1200x672 | None | `itw-autism-run-brief.webp` |
| **A2** | ADHD | Run Brief: Distracted study desk with buzzing phone & open tabs | `AdhdModule` (`interrupted_intro`) | 1200x672 | Text only | `itw-adhd-run-brief.webp` |
| **A3** | Dyslexia | Run Brief: Dense printed reading challenge page | `DyslexiaModule` (`challenge`) | 1200x672 | Text only | `itw-dyslexia-run-brief.webp` |
| **A4** | Speech | Run Brief: Hurried social turn-taking circle | `SpeechModule` (`instructions` / pre-run) | 1200x672 | Text only | `itw-speech-run-brief.webp` |
| **A5** | Dyscalculia | Run Brief: Abstract recipe scaling & messy kitchen table | `DyscalculiaModule` (`unsupported_intro`) | 1200x672 | Text only | `itw-dyscalculia-run-brief.webp` |
| **A6** | Dysgraphia | Run Brief: Biology notebook transcription hurdle & hand fatigue | `DysgraphiaModule` (`unsupported_intro`) | 1200x672 | Text only | `itw-dysgraphia-run-brief.webp` |
| **A7** | Auditory | Run Brief: Noisy classroom with scraping chairs & competing chatter | `AuditoryProcessingModule` (`unsupported_intro`) | 1200x672 | Text only | `itw-auditory-run-brief.webp` |
| **A8** | Executive | Run Brief: Morning hallway scramble with backpack, tiffin & shoes | `ExecutiveFunctioningModule` (`unsupported_intro`) | 1200x672 | Text only | `itw-executive-run-brief.webp` |

#### B1–B8: "What Helps" Explain Page Headers (1200x672, 16:9)
| Slot ID | Module | Step / Purpose | Where in JSX | Size | Current State | Proposed File Name |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **B1** | Autism | What Helps: Calm quiet corner with soft indirect light & headphones | `AutismModule` (`step === "explain"`) | 1200x672 | Text only | `itw-autism-what-helps.webp` |
| **B2** | ADHD | What Helps: Organized desk with visual checklist & focus shield | `AdhdModule` (`step === "explain"`) | 1200x672 | Text only | `itw-adhd-what-helps.webp` |
| **B3** | Dyslexia | What Helps: Reading ruler guide, audio narrator & comfortable kerning | `DyslexiaModule` (`accommodations`) | 1200x672 | Text only | `itw-dyslexia-what-helps.webp` |
| **B4** | Speech | What Helps: Unhurried, attentive listener bench in warm shade | `SpeechModule` (`step === "explain"`) | 1200x672 | Text only | `itw-speech-what-helps.webp` |
| **B5** | Dyscalculia | What Helps: Concrete unit blocks & visual number line in use | `DyscalculiaModule` (`step === "explain"`) | 1200x672 | Text only | `itw-dyscalculia-what-helps.webp` |
| **B6** | Dysgraphia | What Helps: Speech-to-text dictation & visual concept word bank | `DysgraphiaModule` (`step === "explain"`) | 1200x672 | Text only | `itw-dysgraphia-what-helps.webp` |
| **B7** | Auditory | What Helps: Teacher remote microphone & live caption display | `AuditoryProcessingModule` (`step === "explain"`) | 1200x672 | Text only | `itw-auditory-what-helps.webp` |
| **B8** | Executive | What Helps: Clear 3-column Now/Next/Later morning board | `ExecutiveFunctioningModule` (`step === "explain"`) | 1200x672 | Text only | `itw-executive-what-helps.webp` |

#### C1–C2: Distinct Sticker Replacements (1024x1024, 1:1)
| Slot ID | Module | Step / Purpose | Where in JSX | Size | Current State | Proposed File Name |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C1** | ADHD | Sticker: Dynamic sparks of creative thought & currents | `INTRO_VIGNETTES.adhd` | 1024x1024 | Duplicate of scene | `itw-adhd-sticker-unique.webp` |
| **C2** | Autism | Sticker: Gentle rainbow prism & sensory wave | `INTRO_VIGNETTES.autism` | 1024x1024 | Duplicate of scene | `itw-autism-sticker-unique.webp` |

#### D1–D6: Stories Exhibit Plates (1376x768, ~16:9)
| Slot ID | Module | Step / Purpose | Where in JSX | Size | Current State | Proposed File Name |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **D1** | Day Through My Eyes | Period 1: Morning Assembly (Echoing Hallway & Sun Glare) | `DayThroughMyEyesStory` (Period 0) | 1376x768 | Generic reused image | `itw-day-period-1-assembly.webp` |
| **D2** | Day Through My Eyes | Period 2: Science Laboratory (Microscope & Group banter) | `DayThroughMyEyesStory` (Period 1) | 1376x768 | Reused lab scene | `itw-day-period-2-science.webp` |
| **D3** | Day Through My Eyes | Period 3: Canteen & Neem Tree Bench (Restorative shade) | `DayThroughMyEyesStory` (Period 2) | 1376x768 | Reused hero image | `itw-day-period-3-canteen.webp` |
| **D4** | Day Through My Eyes | Period 4: Creative Art & Reading Studio (Afternoon sun) | `DayThroughMyEyesStory` (Period 3) | 1376x768 | Reused dyslexia image | `itw-day-period-4-studio.webp` |
| **D5** | Down Syndrome Story | Cover / Milestone Celebration | `SOON_STORIES[0]` banner | 1376x768 | Older asset | `itw-ds-story-cover.webp` |
| **D6** | Day Through My Eyes | Exhibit Cover Banner | `SOON_STORIES[1]` banner | 1376x768 | Older asset | `itw-dayineyes-cover.webp` |

---

### Tier 2 — Support Picker Spot Illustrations (24 images, 512x512)

#### E1–E24: Accommodation Thumbnail Cards
| Slot ID | Module | Support Choice ID & Label | Where in JSX | Size | Proposed File Name |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E1** | Autism | `ear_defenders`: Sensory Ear Defenders | `AUTISM_SUPPORT_CHOICES[0]` | 512x512 | `itw-autism-support-headphones.webp` |
| **E2** | Autism | `visual_calm`: Visual Declutter / Focus Zone | `AUTISM_SUPPORT_CHOICES[1]` | 512x512 | `itw-autism-support-declutter.webp` |
| **E3** | Autism | `quiet_corner`: Predictable Quiet Reset Space | `AUTISM_SUPPORT_CHOICES[2]` | 512x512 | `itw-autism-support-sanctuary.webp` |
| **E4** | ADHD | `checklist`: Externalized Visual Checklist | `ADHD_SUPPORT_CHOICES[0]` | 512x512 | `itw-adhd-support-checklist.webp` |
| **E5** | ADHD | `filter`: Focus Shield / Do Not Disturb | `ADHD_SUPPORT_CHOICES[1]` | 512x512 | `itw-adhd-support-focus-shield.webp` |
| **E6** | ADHD | `chunking`: Task Chunking (One-Next-Step) | `ADHD_SUPPORT_CHOICES[2]` | 512x512 | `itw-adhd-support-chunking.webp` |
| **E7** | Dyslexia | `spacing`: Dyslexia-Friendly Letter & Line Spacing | `DYS_SUPPORT_CHOICES[0]` | 512x512 | `itw-dyslexia-support-spacing.webp` |
| **E8** | Dyslexia | `ruler`: Reading Ruler / Focus Line Guide | `DYS_SUPPORT_CHOICES[1]` | 512x512 | `itw-dyslexia-support-ruler.webp` |
| **E9** | Dyslexia | `audio`: Multi-Modal Audio Read-Aloud | `DYS_SUPPORT_CHOICES[2]` | 512x512 | `itw-dyslexia-support-audio.webp` |
| **E10** | Speech | `patient_wait`: Unhurried Wait Time (Patient Listening) | `SPEECH_SUPPORT_CHOICES[0]` | 512x512 | `itw-speech-support-patience.webp` |
| **E11** | Speech | `no_interruption`: Sentence Ownership (Never Finishing Sentences) | `SPEECH_SUPPORT_CHOICES[1]` | 512x512 | `itw-speech-support-agency.webp` |
| **E12** | Speech | `multimodal`: Multi-Modal Communication Options | `SPEECH_SUPPORT_CHOICES[2]` | 512x512 | `itw-speech-support-aac.webp` |
| **E13** | Dyscalculia | `numberline`: Visual Number Line & Interval Jump | `DYSCALC_SUPPORT_CHOICES[0]` | 512x512 | `itw-dyscalc-support-numberline.webp` |
| **E14** | Dyscalculia | `blocks`: Tactile Counter Blocks (CRA Model) | `DYSCALC_SUPPORT_CHOICES[1]` | 512x512 | `itw-dyscalc-support-blocks.webp` |
| **E15** | Dyscalculia | `scaffold`: Step-by-Step Ratio Deconstruction | `DYSCALC_SUPPORT_CHOICES[2]` | 512x512 | `itw-dyscalc-support-scaffold.webp` |
| **E16** | Dysgraphia | `dictation`: Voice Dictation / Speech-to-Text | `DYSGRAPH_SUPPORT_CHOICES[0]` | 512x512 | `itw-dysgraph-support-dictation.webp` |
| **E17** | Dysgraphia | `wordbank`: Structured Concept & Sentence Bank | `DYSGRAPH_SUPPORT_CHOICES[1]` | 512x512 | `itw-dysgraph-support-wordbank.webp` |
| **E18** | Dysgraphia | `predictive`: Keyboard Assist with Word Prediction | `DYSGRAPH_SUPPORT_CHOICES[2]` | 512x512 | `itw-dysgraph-support-predictive.webp` |
| **E19** | Auditory | `captions`: Synchronized Real-Time Visual Captions | `AUDITORY_SUPPORT_CHOICES[0]` | 512x512 | `itw-auditory-support-captions.webp` |
| **E20** | Auditory | `isolation`: Teacher Remote Microphone System | `AUDITORY_SUPPORT_CHOICES[1]` | 512x512 | `itw-auditory-support-mic.webp` |
| **E21** | Auditory | `chunking`: Segmented Verbal Chunks & Replay | `AUDITORY_SUPPORT_CHOICES[2]` | 512x512 | `itw-auditory-support-chunking.webp` |
| **E22** | Executive | `nnl`: Now / Next / Later 3-Column Board | `EXEC_SUPPORT_CHOICES[0]` | 512x512 | `itw-exec-support-nnl.webp` |
| **E23** | Executive | `roadmap`: Visual Dependency Map | `EXEC_SUPPORT_CHOICES[1]` | 512x512 | `itw-exec-support-roadmap.webp` |
| **E24** | Executive | `one_step`: One-Next-Step Decomposition | `EXEC_SUPPORT_CHOICES[2]` | 512x512 | `itw-exec-support-onestep.webp` |

---

### Tier 3 — Landing & Specialized Sub-Lab Vignettes (9 images)

#### F1–F4: Landing Page Steps & Next Steps
| Slot ID | Module | Step / Purpose | Where in JSX | Size | Proposed File Name |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F1** | Landing | How It Works 1: Choose an experience | `HOW_STEPS[0]` | 512x512 | `itw-landing-how-choose.webp` |
| **F2** | Landing | How It Works 2: Try the activity | `HOW_STEPS[1]` | 512x512 | `itw-landing-how-try.webp` |
| **F3** | Landing | How It Works 3: Understand what it means | `HOW_STEPS[2]` | 512x512 | `itw-landing-how-understand.webp` |
| **F4** | Landing | Next Steps: Consultation & Assessment | `section.itw-endcta` | 1200x672 | `itw-landing-consultation.webp` |

#### F5–F9: Dyslexia Sub-Lab Headers (800x450, 16:9)
| Slot ID | Module | Step / Purpose | Where in JSX | Size | Proposed File Name |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F5** | Dyslexia | Sub-Lab 1: Letter Scramble | `labSubTab === "scramble"` | 800x450 | `itw-dyslexia-lab-scramble.webp` |
| **F6** | Dyslexia | Sub-Lab 2: Mirror Confusion (b/d/p/q) | `labSubTab === "confusion"` | 800x450 | `itw-dyslexia-lab-mirror.webp` |
| **F7** | Dyslexia | Sub-Lab 3: Visual Crowding | `labSubTab === "crowding"` | 800x450 | `itw-dyslexia-lab-crowding.webp` |
| **F8** | Dyslexia | Sub-Lab 4: Transient Blur | `labSubTab === "blur"` | 800x450 | `itw-dyslexia-lab-blur.webp` |
| **F9** | Dyslexia | Sub-Lab 5: Floating River / Irlen Wave | `labSubTab === "floating"` | 800x450 | `itw-dyslexia-lab-floating.webp` |

---

## 3. Implementation Workflow & Technical Constraints
1. **Art Style Grounding**:
   - Palette: Soft watercolor + ink line on warm textured cream paper.
   - Setting: Bangalore/Chennai inclusive classrooms, courtyards, verandahs, tiffin boxes, terracotta pots, neem trees.
   - Recurring Characters: Aarav (9, maroon polo uniform, short black hair), Diya (9, green kurta top, two braids), Teacher Meera (30s, cotton saree, round glasses).
   - Zero baked text, numbers, or logos.
2. **WebP Optimization**:
   - Hero scenes (1200x672, 1376x768): Target `<= 140 KB`.
   - Spot art (512x512): Target `<= 40 KB`.
   - Compression: `cwebp -q 80 -m 6` with `sips` high-fidelity scaling.
3. **Component Architecture**:
   - `web/components/itw/media/art.js`: Central registry of all `{ src, alt, width, height, decorative }`.
   - `web/components/itw/media/Illustration.jsx`: Zero-CLS `<img loading="lazy" decoding="async">` with `fetchPriority="high"` support.
   - `web/components/itw/media/media.css`: Unified `.itw-art` container styling, responsive text+art layout, and dark-mode adjustments.

---

## 4. Production Release Status & Verification Results
- **Tier 1 (Core Heroes, Stickers, Stories):** 24/24 generated, converted to WebP, wired, and verified.
- **Tier 2 (Accommodation Spot Art):** 24/24 generated, converted to WebP, wired, and verified.
- **Tier 3 (Landing & Dyslexia Sub-Labs):** 9/9 generated, converted to WebP, wired, and verified.
- **Total Files Added:** 57 WebP illustrations (3.27 MB total, safely below the 4.0 MB budget).
- **Duplicate Files Removed:** 3 files (`adhd-environment.webp`, `adhd-sticker.webp`, `autism-sticker.webp`, saving 545 KB).
- **Headless Browser Automated QA:** 44/44 test matrix combinations passed (11 views × 2 viewports [1280px, 390px] × 2 themes [light, dark]). Zero broken images, zero horizontal overflow, zero console errors. Full contact sheet at `docs/itw-illustration-qa/CONTACT_SHEET.md`.
- **Clinical Review Flag:** As per pediatric communication protocol, all depicted character interactions and sensory representations are prepared for final clinical validation by the Manas Learning advisory team prior to production deployment.

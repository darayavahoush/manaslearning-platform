# In Their World (ITW) — Experience Blueprint

**Status:** Living Design Specification  
**Version:** 1.0 (Phase 0 Alignment)  
**Target Platform:** Next.js Web (`/experience`)  

---

## 1. Core Learning Loop (Shared Across All 4 Modules)

Each module follows a structured, non-stigmatizing 6-part pedagogical loop:
1. **Enter a situation**: Context setting, estimated duration (2–3 mins), clear instructions, and honest boundary: *“This is a limited interactive metaphor, not a diagnostic test or what every person feels.”*
2. **Try the task (Run A)**: Hands-on interaction under typical baseline or unassisted conditions.
3. **Reflect**: Neutral observation check (*“What did you notice about effort, focus, or time?”*). No pass/fail scores or normal/abnormal judgments.
4. **Change one support (Run B / Supportive Experiment)**: Activate an environmental accommodation (e.g. reduced interruptions, clear visual schedule, extended response time, font/spacing assistance) and retry a comparable task.
5. **Understand**: Grounded explanation of underlying cognitive/sensory processing differences, clarifying that difficulty on the task does not reflect intelligence or worth.
6. **Take it into life**: Practical, concrete home and classroom strategies paired with reputable Indian and global evidence sources.

---

## 2. Module Specifications

### Module A: ADHD — Attention Regulation & Interruption Recovery (Gold-Standard Flow)
* **Target Experience**: Demonstrates how external interruptions and attentional shifts drain cognitive stamina and require active recovery.
* **Step 1: Introduction**:
  * Setting: A quiet workspace task (sorting items or selecting sequence 1–10).
  * Prompt: *"Try completing a quick sequencing task. Notice the rhythm and mental effort needed."*
* **Step 2: Baseline Run (Low / No Distraction)**:
  * Visitor clicks targets 1–10 in numerical sequence.
  * Task records time and clicks neutrally.
* **Step 3: Interrupted Run (Everyday Distractions)**:
  * Same task structure (targets 1–10, newly positioned).
  * Peripheral notifications, environmental noises, and visual pings appear.
  * Visitor must refocus on the sequence.
* **Step 4: Reflection & Comparison**:
  * Displays comparison: Baseline Time vs. Interrupted Time.
  * Framing: *"Notice how much mental energy was spent ignoring the distractions and finding your place again, rather than doing the task itself."*
* **Step 5: Support Experiment**:
  * Visitor selects a supportive accommodation:
    * Option A: Visual Step Breakdown (only 3 numbers visible at once).
    * Option B: Notification Filter (mute external interruptions).
    * Option C: Movement / Breathing Pause before starting.
  * Visitor tries a 3rd run with the selected support.
* **Step 6: Understanding & Real-World Strategies**:
  * Debrief: Executive functioning, working memory load, and dopamine regulation.
  * Home strategies: Visual timers, one-step instructions, movement-friendly workspaces.
  * Classroom strategies: Chunked assignments, quiet work carrels, transition warnings.

---

### Module B: Autism — Sensory Filtering in Everyday Environments
* **Target Experience**: Competing sensory stimuli (auditory murmur, lighting flicker, visual clutter) when attempting an everyday observation task.
* **Step 1: Introduction & Comfort Notice**:
  * Sound is **OFF** by default. Effects toggle is prominent and persistent.
  * Explains that autistic sensory profiles vary widely—some seek sensory input, others are easily overwhelmed.
* **Step 2: Setting Selection**:
  * Choice of 3 everyday environments: School Canteen, Grocery Store, or Shopping Mall.
* **Step 3: Competing Input Challenge**:
  * Visitor searches for designated visual cue cards while ambient visual/sound layers compete for attention.
  * Hard limits: Master volume capped at $\le 0.12$, no flicker $>2\text{Hz}$, instant “Turn off effects” button.
* **Step 4: Quiet Corner Alternative**:
  * At any time, visitor can step into the `QuietCorner` with soft colors and muted sound to reset.
* **Step 5: Support Experiment**:
  * Enable noise-damping headphones, simplified visual field, or visual schedule cues.
* **Step 6: Real-World Strategies**:
  * Home/School accommodations: Sensory retreats, advance notice of routine changes, dimmable lighting, ear defense options.

---

### Module C: Dyslexia — Decoding Load & Access to Meaning
* **Target Experience**: Visual and phonological decoding effort; letters jitter and swap, illustrating the heavy cognitive tax of decoding before comprehension can even begin.
* **Step 1: Introduction & Debrief Boundary**:
  * Clarifies: *“Dyslexia is not simply seeing letters move or flip backwards; this simulation is an analogy for the high mental energy required to decode print.”*
* **Step 2: Timed Reading Passage**:
  * A 45-second excerpt with animated glyph swapping and slight letter drift.
* **Step 3: Comprehension Questions**:
  * 3 content questions assessing recall under high decoding load.
* **Step 4: Reflection**:
  * Connects how cognitive fatigue during decoding robs attention from comprehension.
* **Step 5: Support Experiment**:
  * Reader tries the passage with OpenDyslexic / clean sans-serif typography, increased line spacing (1.8x), background tint (cream/warm paper), or read-aloud audio assist.
* **Step 6: Real-World Accommodations**:
  * Audiobooks, speech-to-text, unpenalized spelling in conceptual work, extra time.

---

### Module D: Speech & Language — Speaking Under Time Pressure
* **Target Experience**: Word-finding delays and conversational blocks when interlocutors interrupt or rush the speaker.
* **Step 1: Introduction**:
  * Explains that speech-sound differences, stuttering, and expressive language delays are communicative differences, not intellectual deficits.
* **Step 2: Pressured Conversation Run**:
  * Conversational partner asks questions with a tight countdown bar; user tries to express response while letters require rhythmic taps to release.
* **Step 3: Patient Conversation Run (Supported)**:
  * Same conversation with a patient partner: generous response window, no rushed cues, eye contact, and listening to *what* is said rather than *how fast*.
* **Step 4: Reflection**:
  * Comparing anxiety and communicative flow between the two runs.
* **Step 5: Strategies**:
  * Giving extra processing time, avoiding finishing the speaker's sentence, normalizing pauses.

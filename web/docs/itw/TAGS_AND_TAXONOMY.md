# In Their World (ITW) — Clinical & Technical Taxonomy

This specification documents the clinical taxonomy, sensory dimensions, pedagogical tags, accessibility contracts (`aria-*`), and OpenGraph / Schema.org metadata deployed across **In Their World** (`/experience`).

---

## 1. Condition & Sensory Domains Taxonomy

Each module in the In Their World suite is cataloged under a standardized clinical domain rooted in pediatric neurology and occupational therapy literature:

| Module Key | Clinical Domain | Condition Name | Diagnostic / Pedagogical Focus | Core Strength Highlighted |
| :--- | :--- | :--- | :--- | :--- |
| `autism` | Sensory Modulation | Autism Spectrum Condition (ASC) | Acoustic & visual filtering, sensory overwhelm, baseline overload | Hyper-systemizing, intense passions, deep sensory attunement |
| `adhd` | Executive & Attentional | Attention-Deficit/Hyperactivity | Competing attentional salience, working memory interference | Associative ideation, divergent thinking, high energy & creativity |
| `dyslexia` | Phonological Processing | Developmental Dyslexia | Grapheme-to-phoneme decoding friction, visual fatigue, reading stamina | Spatial reasoning, holistic pattern recognition, 3D comprehension |
| `speech` | Expressive Communication | Childhood Apraxia of Speech & AAC | Motor speech planning delay, expressive-receptive disparity | Receptive vocabulary, visual communication, emotional empathy |
| `dyscalculia` | Numerical Cognition | Developmental Dyscalculia | Approximate Number System (ANS) estimation, spatial magnitude | Conceptual logic, verbal reasoning, qualitative problem solving |
| `dysgraphia` | Graphomotor Regulation | Developmental Dysgraphia | Fine-motor graphomotor fatigue, pencil pressure, hand cramping | Rich oral storytelling, expansive vocabulary, deep ideation |
| `auditory` | Auditory Perception | Auditory Processing Disorder (APD) | Acoustic signal-to-noise separation, reverberation interference | Visual-spatial memory, non-verbal intuition, pattern reading |
| `executive` | Metacognitive Function | Executive Functioning & Planning | Working memory load, sequencing friction, task initiation | Big-picture vision, adaptability when scaffolds are provided |
| `downsyndrome`| Developmental / Genetic | Down Syndrome (Trisomy 21) | Visual anchor strengths, social motivation, unhurried progression | Visual memory, warm social connection, authentic persistence |
| `dayineyes` | Multi-Sensory Ecologies | Ecologies of Perception | Multi-perspective shifts across identical school periods | Adaptive resilience, self-advocacy through accommodation |

---

## 2. In-App Taxonomic Tags

Every module and story exhibits explicit visual metadata tags in the UI:

### Environmental Setting Tags
- `📍 Bangalore School Study Desk` (ADHD)
- `📍 Afternoon School Library Nook` (Dyslexia)
- `📍 Central School Atrium & Cafeteria` (Autism)
- `📍 Courtyard Communication Bench` (Speech & AAC)
- `📍 Math Resource Table with Manipulatives` (Dyscalculia)
- `📍 Biology Notebook Writing Desk` (Dysgraphia)
- `📍 Resonant Lecture Hall & Classroom` (Auditory Processing)
- `📍 Morning Planning Desk with Checklists` (Executive Functioning)
- `📍 8:00 AM • Inclusive Primary School, Chennai` (Down Syndrome Story)

### Pedagogical Insight Tags
- `💡 Pedagogical Insight`: Evidence-based takeaways grounded in clinical research (INCLEN Trust, PLOS Medicine, Chauhan 2022, CRA learning models).
- `✨ Accommodations in Action`: Environmental, instructional, and assistive adaptations (noise-dampening acoustic panels, tinted overlays, AAC concept cards, visual schedules).

---

## 3. Physical Storybook Design System (`.itw-storybook-casing`)

The illustrated storybooks (`DownSyndromeStory` and `DayThroughMyEyesStory`) implement a two-page open storybook architecture:

### Structural Elements
- **Book Casing (`.itw-storybook-casing`)**: Outer leather/linen textured binding with golden trim and deep ambient elevation.
- **Top Bookmark Tabs (`.itw-book-top-tabs`)**: Satin bookmark ribbons (`.itw-book-tab`) peeking out from the top edge for instant chapter jumps.
- **Book Spine Crease (`.itw-book-spine`)**: 22px vertical 3D gradient simulating the authentic valley and paper fold of an open physical book.
- **Left Art Plate (`.itw-storybook-art-page`)**: Framed editorial plate with passe-partout border, setting plaque, and folio indicator.
- **Right Story Page (`.itw-storybook-text-page`)**: Story chapter ribbon, pull-quote with stylized serif quotation marks, narrative prose, and clinical insight box.
- **Curled Paper Dog-Ear (`.itw-book-corner-curl`)**: Top-right corner curl providing tactile hover and click affordances for turning the page.
- **In-Page Navigation Bar (`.itw-book-inpage-nav`)**: Located directly within the right-page footer so controls are never scrolled off-screen. Includes:
  - `← Turn Back` (disabled on page 1)
  - Interactive page dots (`.itw-book-page-dots`)
  - `Turn Page →` (prominent green tactile CTA button)
- **3D Page Turn Animation (`.itw-page-flip-anim`)**: Perspective 3D rotation (`@keyframes itw-book-page-turn`) giving authentic physical feedback when turning pages.

---

## 4. Accessibility & Semantics (`a11y`)

The interactive experience adheres strictly to WCAG 2.1 AA accessibility guidelines:
- **ARIA Radiogroups (`role="radiogroup"`)**: Perspective switcher buttons utilize `role="radiogroup"` with individual `aria-checked` states for screen readers.
- **Live Regions (`aria-live="polite"`)**: Dynamic feedback, such as word decodes in Dyslexia or auditory pings in ADHD, announce non-disruptively.
- **Sound Toggle (`aria-pressed`)**: Sound is completely off by default. Global mute button communicates state via `aria-pressed`.
- **Keyboard Navigation**:
  - Storybook pages support `ArrowRight` (turn page) and `ArrowLeft` (turn back).
  - All interactive buttons have high-contrast focus rings (`outline: 3px solid #2c8c72`).
- **Reduced Motion**: All animations (`itw-page-flip-anim`, ambient sticker floating) respect `prefers-reduced-motion: reduce`.

---

## 5. Metadata, OpenGraph & Schema.org JSON-LD

Deployed in `web/app/experience/page.tsx` and `web/app/layout.tsx`:

```json
{
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "In Their World — Neurodiversity & Sensory Empathy Suite",
  "description": "Interactive simulations and illustrated storybooks exploring ADHD, Dyslexia, Autism, Speech, Dyscalculia, Dysgraphia, and Down Syndrome.",
  "learningResourceType": "Simulation & Illustrated Storybook",
  "educationalLevel": "All Ages / Educators, Parents & Therapists",
  "publisher": {
    "@type": "Organization",
    "name": "Manas Learning",
    "url": "https://manaslearning.com"
  }
}
```

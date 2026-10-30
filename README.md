# Manas Learning Platform & "In Their World" Experience Suite

> **Empathetic pediatric learning, clinical guidance, and interactive neurodiversity experiences.**  
> Grounded in the clinical experience of [Manas Learning](https://www.manaslearning.com) (Chennai, India) and international pediatric standards (IDA, DSM-5-TR, INCLEN, UDL).

---

## Table of Contents
1. [Overview & Mission](#overview--mission)
2. [System Architecture](#system-architecture)
3. ["In Their World" Interactive Experience Suite](#in-their-world-interactive-experience-suite)
4. [Illustrated Storybook System](#illustrated-storybook-system)
5. [Clinical & Pedagogical Taxonomy (Tags System)](#clinical--pedagogical-taxonomy-tags-system)
6. [Metadata, SEO & Structured Data](#metadata-seo--structured-data)
7. [Milo AI Learning Guide](#milo-ai-learning-guide)
8. [Assistive Tools: VaakSiddhi & Vaakify](#assistive-tools-vaaksiddhi--vaakify)
9. [Development & Deployment](#development--deployment)

---

## Overview & Mission

**Manas Learning** is a specialized child development and neurodivergent learning center located in Chennai, Tamil Nadu. This repository hosts the full-stack web platform powering:
- **In Their World (ITW)**: A research-backed experiential simulation suite allowing educators, parents, and therapists to experience the cognitive and sensory demands of neurodiverse learning profiles.
- **Milo AI Learning Guide**: A gentle, retrieval-augmented navigation and clinical knowledge guide.
- **Consultation & Booking Engine**: Integrated tele-consultation scheduling for parents and schools.
- **Assistive Practice Modules**: Direct web access to VaakSiddhi (breathing/sound therapy) and Vaakify (word repetition & clarity feedback).

---

## System Architecture

```
                                  manaslearning.com (Unified Domain)
                                                  │
                                                  ▼
                                       ┌─────────────────────┐
                                       │   Next.js 16 Proxy   │
                                       │     (web/proxy.ts)  │
                                       └──────────┬──────────┘
                                                  │
                   ┌──────────────────────────────┴──────────────────────────────┐
                   ▼                                                             ▼
       [Owned Next.js App Routes]                                     [Proxied Live Site]
       • /experience (In Their World)                                 • / (Homepage + apps-patch.js)
       • /milo (Milo Fullscreen Chat)                                 • /assessments
       • /consult (Consultation Booking)                              • /blogs & /videos
       • /api/* (Milo & Calendar APIs)                                • /about & /services
                   │                                                             │
                   ▼                                                             ▼
       ┌───────────────────────┐                                     ┌───────────────────────┐
       │ In Their World Engine │                                     │ Injected Milo & Apps  │
       │ • Web Audio Synthesis │                                     │ • apps-patch.js       │
       │ • Storybook 2-Page    │                                     │ • Milo Launcher       │
       │ • Anti-Muscle-Memory  │                                     │ • Favicon Integration │
       └───────────────────────┘                                     └───────────────────────┘
```

### Technology Stack
- **Framework**: Next.js 16 (App Router with Turbopack engine)
- **Language**: TypeScript & React 19
- **Styling**: Tailwind CSS + Bespoke Custom Design System (`InTheirWorld.css`)
- **Audio Synthesis**: Native Web Audio API (custom multi-frequency sine/saw oscillators & white-noise filters)
- **Deployment**: Vercel Production (`edge` & `serverless` runtime)
- **RAG Backend**: Azure OpenAI (`gpt-5.4-nano`) + Azure AI Search (`vaakbot-docs`)

---

## "In Their World" Interactive Experience Suite

The suite replaces passive articles with **first-person experiential learning** where users experience friction, compare it to supported conditions, and receive concrete pedagogical accommodations.

### 1. Attentional Regulation (ADHD: *A Mind With Too Many Open Tabs*)
- **Core Mechanism**: 3 independent rounds across **completely distinct topics** to prevent answering by muscle memory:
  - *Run 1 (Quiet Baseline)*: Planetary Science & Mars Rover exploration.
  - *Run 2 (Competing Demands)*: Deep Ocean hydrothermal ecosystems with dynamic, multi-font, multi-color pop-in alerts, Discord/WhatsApp pings, calendar reminders, and associative thought fragments.
  - *Run 3 (Scaffolded Support)*: Ancient Indus Valley civilizations with task-chunking, visual checklists, and peripheral deferral.
- **Clinical Alignment**: Barkley's Executive Function Model; demonstrates working memory competition rather than simple "lack of attention."

### 2. Phonological Decoding (Dyslexia: *Reading, Decoding & Access to Meaning*)
- **Core Mechanism**: Follows strict **International Dyslexia Association (IDA)** guidance. Does *not* simulate impossible letter scrambles. Instead, models authentic phonological processing friction:
  - Crowding and reduced inter-letter spacing.
  - Rotational mirror-letter instability on ambiguous graphemes (`b/d/p/q/n/u`) with subtle shiver.
  - Phonological chunking segmentation breaks.
  - *Supported Run*: OpenDyslexic font, tinted reading guide ruler, increased line height, and multi-modal text-to-speech scaffolding.

### 3. Sensory Processing (Autism: *The Room Doesn't Turn Down*)
- **Core Mechanism**: Environmental sensory slider simulation in realistic Indian classroom, cafeteria, and atrium environments.
- **Controls**: Interactive multi-band volume, lighting glare, flicker, and peripheral viewing angle.
- **Supported Mode**: Noise-dampening acoustic curtains, visual schedules, and sensory sanctuary zones.

### 4. Expressive Communication (Speech: *Conversational Pacing & Active Listening*)
- **Core Mechanism**: Compares a hurried, time-pressured conversational environment with an unhurried, patient listener.
- **Accommodations**: Multimodal communication, visual choices, and AAC concept boards.

### 5. Numerical Magnitude (Dyscalculia: *Do the Math*)
- **Core Mechanism**: Real-world recipe scaling task (cardamom cookies). Compares abstract numerical calculation with Concrete-Representational-Abstract (CRA) math manipulatives, visual number lines, and spatial beads.

### 6. Graphomotor Pathway (Dysgraphia: *Writing & Motor Fatigue*)
- **Core Mechanism**: Demonstrates the severe cognitive bottleneck between rich conceptual mastery and physical pencil-to-paper transcription.
- **Accommodations**: Speech-to-text dictation, oral assessments, and graphic organizers.

### 7. Acoustic Signal-to-Noise (Auditory Processing Disorder)
- **Core Mechanism**: Simulates the challenge of separating teacher instructions from reverberant room noise, desk scuffs, and hallway chatter.

### 8. Working Memory & Prioritization (Executive Functioning)
- **Core Mechanism**: Multi-step morning routine challenge comparing unstructured multi-tasking with visual chunking and sequential checklists.

---

## Illustrated Storybook System

To avoid cold, text-heavy forms, the platform implements a **warm, authentic Storybook Two-Page Spread** (`.itw-storybook-spread`):

```
┌────────────────────────────────────────────────────────────────────────┐
│  📖 STORYBOOK EXHIBIT: A Day Through My Eyes • Moment 1 of 4           │
├───────────────────────────────────┬────────────────────────────────────┤
│   [ ARTWORK PLATE ]               │     [ STORYBOOK TEXT PAGE ]        │
│   Full, uncropped, rich           │  Chapter 1 • 8:30 AM               │
│   illustration framed with        │  "The loudspeaker echoes like      │
│   rounded book-plate corners      │   physical pressure."              │
│                                   │                                    │
│   📍 Setting Plaque               │  [Interactive Perspective Lenses]  │
│   Morning assembly courtyard      │  🌿 Sensory  🧠 Attention          │
│   granite pavers                  │  💬 Speech   ✨ Supported          │
│                                   │                                    │
│                                   │  💡 Pedagogical Observation        │
├───────────────────────────────────┴────────────────────────────────────┤
│  [ ◂ Previous Moment ]         Moment 1 of 4        [ Next Moment ▸ ]  │
└────────────────────────────────────────────────────────────────────────┘
```

### Story Exhibits:
1. **Down Syndrome ("Aarav's Day")**:
   - 4-moment picture-book exploring morning visual schedules, collaborative gardening with peers, concrete science laboratory exploration, and authentic milestone celebrations.
2. **A Day Through My Eyes**:
   - A 4-period school walkthrough (8:30 AM Assembly, 10:15 AM Science Lab, 12:30 PM Canteen Bench, 2:15 PM Art Studio) equipped with 4 real-time perspective lenses:
     - 🌿 **Sensory Lens**
     - 🧠 **Attention Lens**
     - 💬 **Communication Lens**
     - ✨ **Supported Inclusion Lens**

---

## Clinical & Pedagogical Taxonomy (Tags System)

Every module, exhibit, and card uses an explicit taxonomy grounded in special education research:

### 1. Condition & Neurotype Tags
| Tag Identifier | Display Label | Focus Domain | Clinical Anchor |
| :--- | :--- | :--- | :--- |
| `autism` | Sensory Filtering | Sensory Modulation & Environmental Reactivity | DSM-5-TR 299.00 / INCLEN Trust |
| `adhd` | Attention Regulation | Executive Working Memory & Inhibition | DSM-5-TR 314.01 / Chauhan 2022 |
| `dyslexia` | Phonological Decoding | Orthographic-Phonological Mapping & Fluency | IDA Guidelines / Shaywitz Model |
| `speech` | Expressive Communication | Motor Speech Fluency & AAC Scaffolding | ASHA Clinical Practice Guidelines |
| `dyscalculia` | Numerical Magnitude | Visual-Spatial Number Sense & CRA Scaffolding | Butterworth Dyscalculia Screener |
| `dysgraphia` | Graphomotor Pathway | Fine Motor Execution & Orthographic Integration | Berninger Writing Research |
| `auditory` | Acoustic Perception | Auditory Figure-Ground & Temporal Processing | AAA APD Guidelines |
| `executive` | Working Memory & Initiation | Task Initiation, Planning & Prioritization | Dawson & Guare Model |
| `down-syndrome`| Visual Anchor & Peer Learning| Concrete-Representational Strengths | NDSS Inclusive Practice |

### 2. Environmental & Sensory Tags
- `[data-accent="autism"]`: Soft sage green (`#2c8c72`) / calming muted tones.
- `[data-accent="adhd"]`: Warm amber gold (`#8c6520`) / dynamic attention current.
- `[data-accent="dyslexia"]`: Deep royal violet (`#6b3ba7`) / structured literacy.
- `[data-accent="speech"]`: Earthy terracotta terracotta (`#8c422c`) / unhurried expression.

---

## Metadata, SEO & Structured Data

### Open Graph & Twitter Cards
- **Canonical URL**: `https://www.manaslearning.com/experience`
- **og:image**: Full-bleed uncropped artwork (`/decor/itw/supportive-environment.webp`, 1376×768)
- **og:locale**: `en_IN`
- **twitter:card**: `summary_large_image`

### Schema.org JSON-LD
Injected on `/experience` as a recognized `LearningResource`:
```json
{
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "In Their World: Neurodiversity & Special Education Interactive Experiences",
  "description": "An interactive experiential suite simulating sensory filtering, ADHD working memory load, dyslexia phonological decoding, and inclusive pedagogical accommodations.",
  "publisher": {
    "@type": "EducationalOrganization",
    "name": "Manas Learning",
    "url": "https://www.manaslearning.com"
  },
  "learningResourceType": "Interactive Simulation",
  "educationalLevel": "Educator, Parent, and Student Professional Development",
  "inLanguage": "en-IN",
  "isAccessibleForFree": true
}
```

---

## Milo AI Learning Guide

**Milo** is the platform's friendly owl mascot and AI assistant:
- **Floating Launcher**: Fixed at bottom-right (`bottom: 24px; right: 24px`) with an emerald ring and animated notification pip.
- **Synchronized Hydration**: Injected on both proxy pages and native Next.js pages via `apps-patch.js` and `MiloWidget.tsx`.
- **Clinical Bounds**: Answers everyday questions regarding sensory needs, stimming, speech milestones, and school accommodations while transparently declining medical diagnoses in favor of human consultations.

---

## Assistive Tools: VaakSiddhi & Vaakify

Rendered dynamically under the Phonics Jungle card on the homepage:
- **VaakSiddhi** (`https://vaaksudhi.manaslearning.com`): Playful breathing and voice games with therapist tracking.
- **Vaakify** (`https://vaakify.manaslearning.com`): Word repetition, speech clarity feedback, and at-home practice.
- **Display Art**: Real live desktop screenshots inside laptop frames, paired with official SVG favicons inside mobile frames.

---

## Development & Deployment

### Local Development
```bash
# Clone the repository
git clone https://github.com/darayavahoush/manaslearning-platform.git
cd manaslearning-platform/web

# Install dependencies
npm install

# Start development server with Turbopack
npm run dev
```
Open `http://localhost:3000` for the reverse-proxied homepage, or `http://localhost:3000/experience` for In Their World.

### Production Build & Verification
```bash
cd web
npm run build
```
Generates 18/18 static pages with zero type or lint errors.

### Vercel Deployment
Deploy from the repository root:
```bash
cd ..
vercel --prod --yes
```
- **Live Production URL**: [web-vert-nu-vcsh56lv8l.vercel.app](https://web-vert-nu-vcsh56lv8l.vercel.app)
- **Direct ITW Experience**: [web-vert-nu-vcsh56lv8l.vercel.app/experience](https://web-vert-nu-vcsh56lv8l.vercel.app/experience)

---

## License & Attribution
© Manas Learning. All rights reserved.  
10G, Sapphire, Olympia Opaline, OMR, Navalur, Chennai, Tamil Nadu, India — 600130.

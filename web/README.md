# Manas Learning Web Platform (`web/`)

The full-stack Next.js web application for [Manas Learning](https://manaslearning.com), featuring the **In Their World** (`/experience`) interactive neurodiversity empathy suite, **Milo AI Learning Companion**, clinical booking engine, and integration with assistive tools (VaakSiddhi & Vaakify).

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (Turbopack, App Router, React 19)
- **Styling**: Vanilla CSS Modules, CSS Variables, and responsive fluid layout systems
- **Audio Synthesis**: Native Web Audio API (`AudioContext`, gain nodes, low-pass biquad filters, pink noise synthesis)
- **Deployment**: Vercel Serverless Edge Platform
- **Asset Pipeline**: Automatic asset verification via `scripts/fetch-itw-assets.mjs`

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation & Local Development

```bash
# Navigate to web root
cd web

# Install dependencies
npm install

# Run the local development server (with Turbopack)
npm run dev -p 3000
```

Open [http://localhost:3000](http://localhost:3000) to view the homepage, or [http://localhost:3000/experience](http://localhost:3000/experience) for the In Their World suite.

---

## 📁 Key Directories & Architecture

```text
web/
├── app/
│   ├── experience/             # /experience: In Their World empathy suite entry point
│   ├── milo/                   # /milo: Milo AI companion chat interface
│   ├── consult/                # Clinical consultation scheduling
│   ├── team/                   # Specialist directory & availability
│   ├── layout.tsx              # Site-wide layout, metadata, SEO & OG tags
│   └── page.tsx                # Manas Learning homepage
├── components/
│   ├── itw/
│   │   ├── InTheirWorld.jsx    # Core engine for all 8 simulations & 2 storybooks
│   │   ├── InTheirWorld.css    # Storybook spread, book casing, scene plates, stickers
│   │   └── ItwClient.tsx       # Dynamic client hydration wrapper with fallback
│   ├── milo/
│   │   └── MiloWidget.tsx      # Floating Milo AI launcher & chat drawer
│   └── ...
├── docs/
│   └── itw/
│       ├── TAGS_AND_TAXONOMY.md # Full clinical tags, sensory domains & accessibility roles
│       └── CHATGPT_CLAUDE_REVIEW_PACKET.md
├── public/
│   ├── decor/
│   │   ├── apps-patch.js       # Live screenshots & SVG favicons injector
│   │   └── itw/                # WebP illustrations, environment scenes & stickers
│   └── audio/itw/              # Auditory simulation audio clips
└── scripts/
    └── fetch-itw-assets.mjs    # Pre-build asset integrity and presence checker
```

---

## 📖 In Their World (ITW) Architecture

### 1. Interactive Simulations (8 Modules)
Each simulation is an empathy-building exercise built with authentic sensory feedback:
- **ADHD**: Competing open tabs, auditory pings, working memory load.
- **Dyslexia**: Phonological decoding friction, visual letter movement, reading ruler.
- **Autism**: Sensory filtering, cafeteria volume control, quiet sanctuary corner.
- **Speech**: Motor planning delay in speech generation, AAC communication board.
- **Dyscalculia**: Visual estimation vs. exact counting with math manipulatives.
- **Dysgraphia**: Graphomotor fatigue simulation with adaptive ergonomic grips.
- **Auditory Processing**: Classroom speech-in-noise discrimination with acoustic headphones.
- **Executive Functioning**: Task prioritization matrix and visual checklists.

### 2. Illustrated Storybooks (2 Experiences)
- **Aarav's Day: A Story of Belonging** (Down Syndrome Story)
- **A Day Through My Eyes** (Multi-Sensory Perspective Storybook)

Both storybooks implement an open two-page storybook spread (`.itw-storybook-spread`) with:
- Deep leather/linen casing (`.itw-storybook-casing`) with satin bookmark ribbon tabs.
- Central 3D book spine valley (`.itw-book-spine`).
- Left page editorial art plate with setting badges and folios.
- Right page narrative, stylized pull-quotes, and pedagogical insights.
- **In-page tactile page turn buttons** (`Turn Page →`) and curled dog-ear corners (`.itw-book-corner-curl`) with 3D flip animation.

---

## 🧪 Building & Verification

```bash
# Verify asset integrity and compile production build
npm run build

# Run linting
npm run lint
```

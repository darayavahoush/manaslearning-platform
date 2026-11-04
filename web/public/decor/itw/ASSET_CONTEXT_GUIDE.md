# Manas Learning Platform — Asset Context & Usage Guide

This guide documents the full inventory of replacement illustrations, fantasy quest media, and UI assets integrated into the Manas Learning Platform.

---

## 1. Flagship Fantasy Quest Assets (Gamified Assessments)

These assets power the two research-grounded, storybook-grade pediatric assessments (`/assessments/adhd` and `/assessments/autism`).

| File Name | Dimensions | Target Component / Route | Context & Pedagogical Purpose |
| :--- | :--- | :--- | :--- |
| **`quest-sky-citadel-banner.webp`** | 1376 × 768 (16:9) | `web/app/assessments/adhd/page.tsx` & `web/app/assessments/page.tsx` | **Hero Panorama**: The Floating Sky Citadel of Aethelgard hovering amidst golden sunlight, clockwork towers, and hanging gardens. Sets the fantasy theme for *Chronicles of the Sunbird*. |
| **`quest-sunbird-target.webp`** | 1024 × 1024 (1:1) | `web/app/assessments/adhd/page.tsx` (Chapter 1) | **Target Stimulus (Conners CPT-3)**: The radiant Golden Celestial Sunbird. Appears during the continuous vigilance task; children tap when they spot it to measure reaction time (HRT). |
| **`quest-lumina-groves-banner.webp`** | 1376 × 768 (16:9) | `web/app/assessments/autism/page.tsx` & `web/app/assessments/page.tsx` | **Hero Panorama**: The ethereal Whispering Groves of Lumina at twilight, with glowing lotus ponds and paper lanterns. Sets the calming sensory atmosphere. |
| **`quest-aria-alchemist.webp`** | 1024 × 1024 (1:1) | `web/app/assessments/autism/page.tsx` (Chapter 1) | **Interactive Companion (ADOS-2)**: Aria, the gentle botanical alchemist. Gaze shifts and pointing gestures track the child's joint attention referencing latency and accuracy. |
| **`quest-sanctuary-haven.webp`** | 1376 × 768 (16:9) | `web/app/assessments/autism/page.tsx` (Chapter 3) | **Sensory Sanctuary (SPM-2)**: Cozy treehouse haven with oversized floor cushions, fairy lights, and misty rain. Calibrates visual flicker, acoustic filtering, and tactile comfort. |

---

## 2. Editorial Replacements (Part A & Part B from Brief)

Extracted and resized according to the official specification in `Manas Learning – image replacement brief.pdf` from the OneDrive archive.

| File Name | Target Size | Replaces | Context & Usage |
| :--- | :--- | :--- | :--- |
| **`itw-day-period-3-canteen.webp`** | 1376 × 768 | Old website screenshot | **Period 3 Canteen Lunch**: Aarav, Diya, and classmates sharing idlis on stone veranda steps under a neem tree. |
| **`autism-environment.webp`** | 1024 × 1024 | Gibberish routine chart | **Autism Module Banner**: A girl of five building a colorful block arch on the floor while her mother in a pink saree sits calmly nearby. |
| **`dyscalculia-environment.webp`** | 1376 × 768 | Misspelled recipe books | **Dyscalculia Module Banner**: Sunlit wooden desk with brass balance scale, wooden abacus, and notebooks with neat diagrammatic scribbles. |
| **`dysgraphia-sticker.webp`** | 1024 × 1024 | White background sticker | **Dysgraphia Module Sticker**: A girl in a printed kurta sitting at a desk and writing carefully in a notebook with a simple leaf sketch. |
| **`hero.webp`** | 502 × 464 | Sparkle watermark | **Homepage Live Hero**: A tutor in a printed saree helping a smiling boy in a light-blue T-shirt write in a notebook at a wooden desk. |
| **`parallax-bg.webp`** | 3008 × 1408 | Watermark in corner | **Sitewide Parallax Background**: Wide watercolor botanical background with mother reading to her child under a tree. |
| **`itw-day-period-1-assembly.webp`** | 1376 × 768 | Duplicate of hero-world | **Period 1 Morning Assembly**: Rows of students in uniform in a Chennai courtyard under golden morning light. |
| **`itw-day-period-5-playfield.webp`** | 1376 × 768 | Duplicate of greenhouse | **Period 5 Playfield**: School playfield and shaded garden where Aarav and classmates play a cooperative ball game. |
| **`itw-day-period-6-home.webp`** | 1376 × 768 | Empty beanbag duplicate | **Period 6 Evening at Home**: Aarav on a sofa showing drawings to his parents and younger sister with a warm lamp lit. |
| **`down-syndrome-story-6.webp`** | 1376 × 768 | Girl reading book duplicate | **Aarav Story Ending**: Aarav sitting at a low table at home in the evening showing three school drawings to his proud family. |
| **`down-syndrome-story-5.webp`** | 1376 × 768 | High-five duplicate | **Music Circle**: Under a banyan tree, Aarav leads a clapping circle with classmates holding hand drums, Meera clapping along. |
| **`itw-dyslexia-what-helps.webp`** | 1200 × 672 | Dyslexia sticker duplicate | **Dyslexia What Helps**: A child reading comfortably in a sunlit library nook using a translucent colored reading ruler and soft headphones. |
| **`itw-dyscalculia-what-helps.webp`** | 1200 × 672 | Sticker duplicate | **Dyscalculia What Helps**: Teacher in a saree and student using wooden counting blocks and a long floor number line with colored jumps. |
| **`itw-speech-what-helps.webp`** | 1200 × 672 | Sticker duplicate | **Speech What Helps**: Meera and student in unhurried conversation on a garden bench with warm eye contact and communication tablet. |
| **`itw-executive-what-helps.webp`** | 1200 × 672 | Down syndrome duplicate | **Executive Function What Helps**: Schoolboy proudly standing before a three-column Now / Next / Later visual schedule board. |
| **`itw-auditory-what-helps.webp`** | 1200 × 672 | Seminar adults duplicate | **Auditory What Helps**: Inclusive primary classroom with teacher wearing lapel mic and live caption screen on wall. |
| **`auditory-processing-environment.webp`** | 1376 × 768 | Seminar duplicate | **Auditory Classroom**: Bright classroom with teacher speaking at board while sound waves drift across as soft ribbons. |
| **`itw-landing-consultation.webp`** | 1200 × 672 | Adults without child | **Landing Page Consultation**: Warm consultation room with clinician, parent, and child playing with stacking rings and picture cards. |

---

## 3. How to Use in Next.js JSX

All assets are located in `/web/public/decor/itw/` or `/web/public/decor/` and can be imported directly:

```tsx
// Example 1: Full-bleed Hero Panorama
<div className="relative h-64 md:h-80 w-full overflow-hidden bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7]">
  <img
    src="/decor/itw/quest-sky-citadel-banner.webp"
    alt="Sky Citadel Quest"
    className="h-full w-full object-cover object-center"
  />
</div>

// Example 2: Interactive Target Stimulus
<img
  src="/decor/itw/quest-sunbird-target.webp"
  alt="Celestial Sunbird"
  className="w-32 h-32 object-contain filter drop-shadow-md"
/>

// Example 3: Companion Avatar
<img
  src="/decor/itw/quest-aria-alchemist.webp"
  alt="Aria the Alchemist"
  className="w-28 h-28 rounded-full border-4 border-teal-300 object-cover"
/>
```

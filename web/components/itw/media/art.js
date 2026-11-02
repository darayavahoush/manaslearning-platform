/**
 * In Their World (ITW) — Master Illustration Registry
 *
 * Centralizes all image assets, accessible descriptions, and intrinsic dimensions
 * to ensure zero cumulative layout shift (CLS) and consistent art direction.
 */

export const ART_REGISTRY = {
  /* --- Core Module Banners & Scene Plates (Existing + Enhanced) --- */
  "autism-environment": {
    src: "/decor/itw/autism-environment.webp",
    alt: "A girl builds a colorful block arch on the floor while her mother watches, with a picture routine chart beside them",
    width: 1024,
    height: 1024,
  },
  "adhd-workspace": {
    src: "/decor/itw/adhd-workspace-scene.webp",
    alt: "A boy sits cross-legged on a floor covered in scattered toys, books and puzzle pieces, looking overwhelmed",
    width: 1024,
    height: 1024,
  },
  "dyslexia-environment": {
    src: "/decor/itw/dyslexia-environment.webp",
    alt: "Sunlit library nook with shelves of books and a window seat looking out at green trees",
    width: 1200,
    height: 672,
  },
  "speech-environment": {
    src: "/decor/itw/communication-environment.webp",
    alt: "Two children talk together on a shaded veranda with an open book and cups of tea between them",
    width: 1200,
    height: 672,
  },
  "dyscalculia-environment": {
    src: "/decor/itw/dyscalculia-environment.webp",
    alt: "Wooden desk with a brass balance scale, an abacus, a ruler and open notebooks of sums",
    width: 1200,
    height: 672,
  },
  "dysgraphia-environment": {
    src: "/decor/itw/dysgraphia-environment.webp",
    alt: "Sunlit desk with an ink bottle, pencils, an open sketchbook and a drawing tablet",
    width: 1200,
    height: 672,
  },
  "auditory-environment": {
    src: "/decor/itw/auditory-processing-environment.webp",
    alt: "Adults sit around tables in a bright classroom while a teacher speaks, with sound waves drifting across the room",
    width: 1200,
    height: 672,
  },
  "executive-environment": {
    src: "/decor/itw/executive-functioning-environment.webp",
    alt: "Cozy home morning workspace with a backpack, planner notebook, and shoes neatly arranged",
    width: 1200,
    height: 672,
  },

  /* --- C1-C2: Unique Module Stickers (1024x1024) --- */
  "sticker-autism": {
    src: "/decor/itw/itw-autism-sticker.webp",
    alt: "A pastel crystal inside a layered lotus-petal pattern, drawn as a sticker",
    width: 1024,
    height: 1024,
  },
  "sticker-adhd": {
    src: "/decor/itw/itw-adhd-sticker.webp",
    alt: "A glowing amber star inside swirling currents with paper airplanes, drawn as a round sticker",
    width: 1024,
    height: 1024,
  },
  "sticker-dyslexia": {
    src: "/decor/itw/dyslexia-sticker.webp",
    alt: "A girl with braids sits on a rug reading a glowing book while letters swirl up from its pages",
    width: 1024,
    height: 1024,
  },
  "sticker-speech": {
    src: "/decor/itw/speech-sticker.webp",
    alt: "A girl and a boy in school uniform share a tablet on a bench, with speech bubbles and small icons floating around them",
    width: 1200,
    height: 896,
  },
  "sticker-dyscalculia": {
    src: "/decor/itw/dyscalculia-sticker.webp",
    alt: "A smiling girl at a wooden table plays with an abacus and number blocks, with colorful shapes floating above",
    width: 1024,
    height: 1024,
  },
  "sticker-dysgraphia": {
    src: "/decor/itw/dysgraphia-sticker.webp",
    alt: "A girl with a long braid writes carefully in a notebook with a pencil at a wooden desk",
    width: 1024,
    height: 1024,
  },
  "sticker-auditory": {
    src: "/decor/itw/auditory-sticker.webp",
    alt: "A smiling boy wearing headphones sits at a desk with an open book and a stack of books",
    width: 1024,
    height: 1024,
  },
  "sticker-executive": {
    src: "/decor/itw/executive-sticker.webp",
    alt: "A smiling girl in a green kurta holds a clipboard with a picture checklist",
    width: 1024,
    height: 1024,
  },

  /* --- A1-A8: Run Brief Scenes (Pre-Run 2 / Challenge, 1200x672) --- */
  "autism-run-brief": {
    src: "/decor/itw/itw-autism-run-brief.webp",
    alt: "School central atrium sensory environment with bright skylights, granite reflections, and bustling student traffic",
    width: 1200,
    height: 672,
  },
  "adhd-run-brief": {
    src: "/decor/itw/itw-adhd-run-brief.webp",
    alt: "Study desk with an open laptop, glowing phone notification, and creative sketches competing for attention",
    width: 1200,
    height: 672,
  },
  "dyslexia-run-brief": {
    src: "/decor/itw/itw-dyslexia-run-brief.webp",
    alt: "Open hardcover storybook on a classroom desk with ruler and pencil, capturing the intense effort of text decoding",
    width: 1200,
    height: 672,
  },
  "speech-run-brief": {
    src: "/decor/itw/itw-speech-run-brief.webp",
    alt: "Group of classmates having an energetic discussion on a courtyard bench while a thoughtful child takes a breath to respond",
    width: 1200,
    height: 672,
  },
  "dyscalculia-run-brief": {
    src: "/decor/itw/itw-dyscalculia-run-brief.webp",
    alt: "Kitchen table with recipe card, measuring spoons, and mixing bowls presenting a mental arithmetic scaling challenge",
    width: 1200,
    height: 672,
  },
  "dysgraphia-run-brief": {
    src: "/decor/itw/itw-dysgraphia-run-brief.webp",
    alt: "Biology classroom desk with handwritten notebook page, pencil, and blackboard diagrams showing motor transcription effort",
    width: 1200,
    height: 672,
  },
  "auditory-run-brief": {
    src: "/decor/itw/itw-auditory-run-brief.webp",
    alt: "Classroom with students shifting in wooden desks and scraping chairs creating layers of competing acoustic background noise",
    width: 1200,
    height: 672,
  },
  "executive-run-brief": {
    src: "/decor/itw/itw-executive-run-brief.webp",
    alt: "Morning hallway with unzipped backpack, field trip permission slip, tiffin box, and shoes needing immediate sequencing",
    width: 1200,
    height: 672,
  },

  /* --- B1-B8: "What Helps" Explain Page Headers (1200x672) --- */
  "autism-what-helps": {
    src: "/decor/itw/itw-autism-what-helps.webp",
    alt: "Calm quiet sanctuary in school with soft indirect light, cushioned nook, and ear defenders enabling peaceful participation",
    width: 1200,
    height: 672,
  },
  "adhd-what-helps": {
    src: "/decor/itw/itw-adhd-what-helps.webp",
    alt: "Organized study desk with a visual step-by-step checklist, noise-dampening headphones, and clean focused workspace",
    width: 1200,
    height: 672,
  },
  "dyslexia-what-helps": {
    src: "/decor/itw/itw-dyslexia-what-helps.webp",
    alt: "Child reading with ease using a colored tracking ruler guide and audio read-aloud headphones in a sunlit library",
    width: 1200,
    height: 672,
  },
  "speech-what-helps": {
    src: "/decor/itw/itw-speech-what-helps.webp",
    alt: "Teacher Meera and student in unhurried conversation on a garden bench with patient listening and warm eye contact",
    width: 1200,
    height: 672,
  },
  "dyscalculia-what-helps": {
    src: "/decor/itw/itw-dyscalculia-what-helps.webp",
    alt: "Student and teacher exploring fractions and proportions together with tactile counter blocks and a visual number line",
    width: 1200,
    height: 672,
  },
  "dysgraphia-what-helps": {
    src: "/decor/itw/itw-dysgraphia-what-helps.webp?v=2",
    alt: "Student happily composing ideas using speech-to-text dictation on a tablet and concept word bank cards",
    width: 1200,
    height: 672,
  },
  "auditory-what-helps": {
    src: "/decor/itw/itw-auditory-what-helps.webp",
    alt: "Inclusive classroom where the teacher wears a direct lapel transmitter and speech is projected on a live captions display",
    width: 1200,
    height: 672,
  },
  "executive-what-helps": {
    src: "/decor/itw/itw-executive-what-helps.webp",
    alt: "Student smiling proudly in front of a colorful 3-column Now / Next / Later morning schedule board with bag ready",
    width: 1200,
    height: 672,
  },

  /* --- D1-D6: Story Exhibit Plates (1376x768) --- */
  "day-period-1-assembly": {
    src: "/decor/itw/itw-day-period-1-assembly.webp",
    alt: "Morning assembly in Chennai school courtyard under golden sunlight with rows of students and echoing colonnade",
    width: 1376,
    height: 768,
  },
  "day-period-2-science": {
    src: "/decor/itw/itw-day-period-2-science.webp",
    alt: "Students huddled around a laboratory table observing plant cells through a microscope and comparing notes",
    width: 1376,
    height: 768,
  },
  "day-period-3-canteen": {
    src: "/decor/itw/itw-day-period-3-canteen.webp",
    alt: "Aarav, Diya, and friends sitting together on verandah stone steps sharing homemade idlis and tiffin boxes under a flowering tree",
    width: 1376,
    height: 768,
  },
  "day-period-4-studio": {
    src: "/decor/itw/itw-day-period-4-studio.webp",
    alt: "A quiet corner with a soft bean bag, a green knitted blanket, a glowing lamp and a leafy plant",
    width: 1376,
    height: 768,
  },
  "day-period-5-playfield": {
    src: "/decor/itw/itw-day-period-5-playfield.webp",
    alt: "School playfield and shaded green garden where students engage in physical movement, cooperative games, and tactile sensory breaks",
    width: 1376,
    height: 768,
  },
  "day-period-6-home": {
    src: "/decor/itw/itw-day-period-6-home.webp",
    alt: "A calm, supportive evening home environment with warm lamplight, comfortable cushions, and quiet space to decompress after school",
    width: 1376,
    height: 768,
  },
  "down-syndrome-story-5": {
    src: "/decor/itw/down-syndrome-story-5.webp",
    alt: "Aarav leading a joyful rhythm and music circle with classmates clapping together under a school banyan tree",
    width: 1376,
    height: 768,
  },
  "down-syndrome-story-6": {
    src: "/decor/itw/down-syndrome-story-6.webp",
    alt: "Aarav smiling at home in the evening, sharing his school drawings and accomplishments with proud family",
    width: 1376,
    height: 768,
  },
  "ds-story-cover": {
    src: "/decor/itw/itw-ds-story-cover.webp",
    alt: "A boy in school uniform high-fives a teacher in a green saree in a sunlit school courtyard",
    width: 1376,
    height: 768,
  },
  "dayineyes-cover": {
    src: "/decor/itw/itw-dayineyes-cover.webp",
    alt: "Four children sit among potted plants in a leafy courtyard, absorbed in their own activities",
    width: 1376,
    height: 768,
  },

  /* --- E1-E24: Support Card Spot Thumbnails (512x512) --- */
  "support-autism-ear-defenders": {
    src: "/decor/itw/itw-autism-support-headphones.webp",
    alt: "Comfortable teal noise-dampening ear defenders on soft cream paper",
    width: 512,
    height: 512,
  },
  "support-autism-visual-calm": {
    src: "/decor/itw/itw-autism-support-declutter.webp",
    alt: "Soft lamp illuminating a clutter-free study desk with gentle focus lines",
    width: 512,
    height: 512,
  },
  "support-autism-quiet-corner": {
    src: "/decor/itw/itw-autism-support-sanctuary.webp",
    alt: "Cozy reading nook with floor cushions, potted fern, and gentle curtain",
    width: 512,
    height: 512,
  },
  "support-adhd-checklist": {
    src: "/decor/itw/itw-adhd-support-checklist.webp",
    alt: "Visual task checklist card with checkmarks and colored highlighters",
    width: 512,
    height: 512,
  },
  "support-adhd-filter": {
    src: "/decor/itw/itw-adhd-support-focus-shield.webp",
    alt: "Shield symbol glowing softly around an open laptop with quiet notifications",
    width: 512,
    height: 512,
  },
  "support-adhd-chunking": {
    src: "/decor/itw/itw-adhd-support-chunking.webp",
    alt: "Single clear action card highlighted while remaining steps are stacked neatly behind",
    width: 512,
    height: 512,
  },
  "support-dyslexia-spacing": {
    src: "/decor/itw/itw-dyslexia-support-spacing.webp",
    alt: "Graphic showing expanded comfortable line height and relaxed letter kerning on cream page",
    width: 512,
    height: 512,
  },
  "support-dyslexia-ruler": {
    src: "/decor/itw/itw-dyslexia-support-ruler.webp",
    alt: "Tinted translucent reading ruler highlighting a single line of text",
    width: 512,
    height: 512,
  },
  "support-dyslexia-audio": {
    src: "/decor/itw/itw-dyslexia-support-audio.webp",
    alt: "Pair of audio headphones beside an open book with gentle sound waves",
    width: 512,
    height: 512,
  },
  "support-speech-patient-wait": {
    src: "/decor/itw/itw-speech-support-patience.webp",
    alt: "Attentive listener smiling warmly with unhurried hourglass resting on side",
    width: 512,
    height: 512,
  },
  "support-speech-no-interruption": {
    src: "/decor/itw/itw-speech-support-agency.webp",
    alt: "Two speech bubbles given complete space to finish their sentences",
    width: 512,
    height: 512,
  },
  "support-speech-multimodal": {
    src: "/decor/itw/itw-speech-support-aac.webp",
    alt: "Tablet display showing communication cards with simple symbol icons",
    width: 512,
    height: 512,
  },
  "support-dyscalc-numberline": {
    src: "/decor/itw/itw-dyscalc-support-numberline.webp",
    alt: "Visual colorful number line with curved interval jumps marking proportions",
    width: 512,
    height: 512,
  },
  "support-dyscalc-blocks": {
    src: "/decor/itw/itw-dyscalc-support-blocks.webp",
    alt: "Tactile colorful wooden base-10 counting blocks grouped in neat units",
    width: 512,
    height: 512,
  },
  "support-dyscalc-scaffold": {
    src: "/decor/itw/itw-dyscalc-support-scaffold.webp",
    alt: "Recipe balance scale showing base measure plus half measure combined",
    width: 512,
    height: 512,
  },
  "support-dysgraph-dictation": {
    src: "/decor/itw/itw-dysgraph-support-dictation.webp",
    alt: "Stylized microphone converting spoken words into neat flowing text on a screen",
    width: 512,
    height: 512,
  },
  "support-dysgraph-wordbank": {
    src: "/decor/itw/itw-dysgraph-support-wordbank.webp",
    alt: "Visual word bank tiles with key academic phrases ready for one-tap assembly",
    width: 512,
    height: 512,
  },
  "support-dysgraph-predictive": {
    src: "/decor/itw/itw-dysgraph-support-predictive.webp",
    alt: "Keyboard with smart predictive word suggestion bubbles above the keys",
    width: 512,
    height: 512,
  },
  "support-auditory-captions": {
    src: "/decor/itw/itw-auditory-support-captions.webp",
    alt: "Visual display monitor showing live synchronized speech captions in a classroom",
    width: 512,
    height: 512,
  },
  "support-auditory-mic": {
    src: "/decor/itw/itw-auditory-support-mic.webp",
    alt: "Wireless teacher lapel microphone transmitting clear audio to student receiver",
    width: 512,
    height: 512,
  },
  "support-auditory-chunking": {
    src: "/decor/itw/itw-auditory-support-chunking.webp",
    alt: "Three clear audio segment buttons with replay icons for step-by-step instructions",
    width: 512,
    height: 512,
  },
  "support-exec-nnl": {
    src: "/decor/itw/itw-exec-support-nnl.webp",
    alt: "Three-column Now / Next / Later organization board with task cards",
    width: 512,
    height: 512,
  },
  "support-exec-roadmap": {
    src: "/decor/itw/itw-exec-support-roadmap.webp",
    alt: "Visual dependency roadmap showing prerequisites connected by friendly path arrows",
    width: 512,
    height: 512,
  },
  "support-exec-onestep": {
    src: "/decor/itw/itw-exec-support-onestep.webp",
    alt: "Single isolated next-action card with a focused magnifying focus circle",
    width: 512,
    height: 512,
  },

  /* --- F1-F4: Landing Page & Next Steps Art --- */
  "landing-how-choose": {
    src: "/decor/itw/itw-landing-how-choose.webp",
    alt: "Children looking at an illustrated menu of learning landscapes",
    width: 512,
    height: 512,
  },
  "landing-how-try": {
    src: "/decor/itw/itw-landing-how-try.webp",
    alt: "Hands engaging with an interactive hands-on learning activity",
    width: 512,
    height: 512,
  },
  "landing-how-understand": {
    src: "/decor/itw/itw-landing-how-understand.webp",
    alt: "Parent and child smiling together over shared understanding and accommodations",
    width: 512,
    height: 512,
  },
  "landing-consultation": {
    src: "/decor/itw/itw-landing-consultation.webp",
    alt: "Warm, supportive consultation room at Manas Learning with clinician, parent, and child",
    width: 1200,
    height: 672,
  },

  /* --- F5-F9: Dyslexia Sub-Lab Headers (800x450) --- */
  "dyslexia-lab-scramble": {
    src: "/decor/itw/itw-dyslexia-lab-scramble.webp",
    alt: "Dynamic watercolor rendering of letters gently dancing while word anchors hold",
    width: 800,
    height: 450,
  },
  "dyslexia-lab-mirror": {
    src: "/decor/itw/itw-dyslexia-lab-mirror.webp",
    alt: "Symmetrical cards showing subtle horizontal and vertical letter reflections (b, d, p, q)",
    width: 800,
    height: 450,
  },
  "dyslexia-lab-crowding": {
    src: "/decor/itw/itw-dyslexia-lab-crowding.webp",
    alt: "Close grouping of letter shapes demonstrating the visual crowding phenomenon",
    width: 800,
    height: 450,
  },
  "dyslexia-lab-blur": {
    src: "/decor/itw/itw-dyslexia-lab-blur.webp",
    alt: "Text lines with soft transient foveal focus in gentle watercolor washes",
    width: 800,
    height: 450,
  },
  "dyslexia-lab-floating": {
    src: "/decor/itw/itw-dyslexia-lab-floating.webp",
    alt: "Gentle river-like undulating wave passing through lines of print (Irlen visual effect)",
    width: 800,
    height: 450,
  },
};

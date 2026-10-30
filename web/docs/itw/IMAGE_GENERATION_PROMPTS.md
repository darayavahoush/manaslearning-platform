# In Their World: Environment Art Generation Specification & Prompts

This document provides production-ready image generation prompts, art direction guidelines, and graceful fallback implementations for the environment backgrounds in In Their World.

---

## 1. Global Art Direction & Brand Coherence

* **Aesthetic Standard:** Premium editorial picture-book illustration, soft gouache and transparent watercolor wash textures layered over confident, modern vector silhouettes.
* **Color Palette Identity:**
  * Background Ground: Warm cream (`#fdf8ee`, dark mode `#14180f`)
  * Botanical Primaries: Sage green (`#66804d`), deep fern (`#2d4427`), warm olive
  * Condition Accents (used sparingly as environmental accents):
    * Autism: Soft sage / moss (`#66804d`)
    * ADHD: Warm amber / honey ochre (`#f0a321`)
    * Dyslexia: Deep forest teal (`#286450`)
    * Speech: Earthy terracotta / rosewood (`#8c422c`)
* **Lighting & Atmosphere:** Indirect, natural daylight through tall windows or leaves; gentle dappled light, calm atmospheric depth without clinical harshness.
* **Negative Prompt (Strict Filters):**
  `text, typography, letters, alphabet, numbers, words, watermark, logo, user interface, buttons, icons, medical cross, syringe, pill, clinical hospital room, disability tropes, distorted anatomy, high-contrast strobe patterns, neon colors, CGI rendering, photorealistic stock photography.`

---

## 2. Asset Prompts & Target Specifications

### Asset 1: The Shared World (Hero Scene)
* **File Target:** `web/public/decor/itw/hero-world.webp`
* **Target Dimensions:** 1920 × 1080 px (16:9), target file weight $\le 280\text{ KB}$ WebP.
* **Placement:** `/experience` landing header background and intro ambient banner.
* **Prompt:**
  ```text
  A panoramic editorial picture-book illustration of an inclusive botanical learning garden and open courtyard. Diverse children are naturally engaged in everyday creative activities — reading under a leafy shade tree, examining plants with magnifying glasses, sketching together at a wooden bench. Warm indirect morning sunlight, dappled leaves, soft sage green, warm cream, gentle ochre and subtle terracotta accents. Sophisticated watercolor and gouache texture on textured paper, airy composition with generous breathing room in the upper third for headline typography. Peaceful, dignified, non-clinical.
  ```

### Asset 2: Attention & Energy (ADHD Environment)
* **File Target:** `web/public/decor/itw/adhd-environment.webp`
* **Target Dimensions:** 1600 × 1000 px (16:10), target file weight $\le 220\text{ KB}$ WebP.
* **Placement:** ADHD intro and debrief card background.
* **Prompt:**
  ```text
  An inviting, active modern workshop and classroom filled with natural energy and motion. Floor-to-ceiling sunlit windows looking onto trees; flexible seating including wobble cushions, low tables, and standing desks. Subtle creative objects scattered with purpose: model gliders, sketches, sketchbooks, and plant pots. Golden honey ochre and warm wood tones balanced with calming sage and cream. Hand-painted picture-book style, feeling vibrant, inventive and full of curiosity rather than chaotic or stressful. No text, no symbols.
  ```

### Asset 3: Sensory Complexity (Autism Public Space)
* **File Target:** `web/public/decor/itw/autism-environment.webp`
* **Target Dimensions:** 1600 × 1000 px (16:10), target file weight $\le 220\text{ KB}$ WebP.
* **Placement:** Autism intro card and background backdrop.
* **Prompt:**
  ```text
  A sunlit school atrium or community courtyard bustling with layered everyday life. Overhead glass skylights cast soft geometry across smooth stone tiles. Potted ferns, benches, and distant figures moving at different paces create depth. The scene balances visual richness with gentle atmospheric perspective; soft moss green, warm linen, muted plum and ochre accents. Respectful, authentic, everyday architecture, captured with delicate editorial watercolor washes and textured paper grain. No text, no UI.
  ```

### Asset 4: Decoding & Meaning (Dyslexia Reading Sanctuary)
* **File Target:** `web/public/decor/itw/dyslexia-environment.webp`
* **Target Dimensions:** 1600 × 1000 px (16:10), target file weight $\le 220\text{ KB}$ WebP.
* **Placement:** Dyslexia intro and reflection card background.
* **Prompt:**
  ```text
  A serene, sun-drenched library nook with floor-to-ceiling curved wooden bookshelves filled with colorful unlabelled book spines. A comfortable reading alcove with deep cushions nestles beside an arched bay window framed by trailing ivy. Warm golden afternoon light pools on the floorboards. Forest teal, warm cream, honey oak, and terracotta touches. Evokes deep comfort, curiosity, and the joy of stories without any anxiety or pressure. Hand-painted gouache illustration. No letters, no text on spines.
  ```

### Asset 5: Unhurried Connection (Speech & Communication)
* **File Target:** `web/public/decor/itw/communication-environment.webp`
* **Target Dimensions:** 1600 × 1000 px (16:10), target file weight $\le 220\text{ KB}$ WebP.
* **Placement:** Speech & Language intro and debrief backdrop.
* **Prompt:**
  ```text
  A warm, intimate vignette of two young friends sitting across from each other at a low wooden table in a sunlit veranda. One child is speaking with animated hands while the other listens with deep, relaxed, unhurried warmth and attention. A ceramic cup, an open notebook with abstract doodles, and soft indoor plants sit nearby. Earthy terracotta, terracotta rose, warm amber, and cream palette. Celebrates connection, patience, and mutual respect. Editorial picture-book art style, textured watercolor. No text.
  ```

### Asset 6: The Reset Space (Supportive Sensory Sanctuary)
* **File Target:** `web/public/decor/itw/supportive-environment.webp`
* **Target Dimensions:** 1600 × 1000 px (16:10), target file weight $\le 220\text{ KB}$ WebP.
* **Placement:** Accommodation cards, Quiet Corner view, and Support summaries.
* **Prompt:**
  ```text
  A restorative sensory sanctuary and quiet corner designed for comfort and self-regulation. A plush beanbag armchair, soft weighted knit blanket, wall-mounted acoustic felt panels in organic curved leaf shapes, dimmable indirect paper globe lamp giving off a gentle warm amber glow, and a tall indoor fiddle-leaf fig tree. Low visual clutter, gentle natural shadows, soft muted olive, warm cream, and taupe tones. Safe, tranquil, inviting, with no medical or sterile equipment. Editorial illustration on textured watercolor paper.
  ```

---

## 3. Fallback Implementation Architecture

Every image element in In Their World uses progressive enhancement:
1. **CSS Gradient / Mesh Layer:** Instant rendering at 0 KB, matching the exact color harmony of each condition.
2. **Inline Vector SVG Accents:** Light botanical line-art accents that render instantaneously.
3. **Responsive WebP `<picture>` Tag:**
   ```html
   <picture>
     <source srcset="/decor/itw/hero-world.webp" type="image/webp" />
     <img
       src="/decor/itw/hero-world.jpg"
       alt=""
       role="presentation"
       loading="lazy"
       decoding="async"
       onerror="this.style.display='none'"
     />
   </picture>
   ```
4. **Graceful Degrade Guard:** If network errors or missing files occur, `onerror` quietly hides the image layer, allowing the underlying botanical CSS background and content to shine without layout shift or broken placeholders.

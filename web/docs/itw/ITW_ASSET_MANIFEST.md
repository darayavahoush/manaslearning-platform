# In Their World (ITW) — Asset Manifest

**Date:** 2026-10-29  
**Specification Reference:** Section 5 & Phase 4 of In Their World Technical Specification

---

## 1. Existing Reused Assets

| Asset Path | Type | File Size | Description / Purpose | Alt Text / Accessibility |
| :--- | :--- | :--- | :--- | :--- |
| `public/decor/hero-illustration.webp` | Image (WebP) | 120 KB | Warm botanical and inclusive learning illustration | Decorative, `aria-hidden="true"` or `alt=""` |
| `public/decor/leaf.webp` | Image (WebP) | 28 KB | Natural falling leaf asset used for background ambient decor | Decorative, `aria-hidden="true"` |
| `public/decor/decor-lines.svg` | Vector (SVG) | 4 KB | Subtle wave and line dividers | Decorative, `aria-hidden="true"` |
| `public/decor/apps/vaaksiddhi.svg` | Vector (SVG) | 6 KB | VaakSiddhi app branding icon | Accessible branding icon |
| `public/decor/apps/vaakify.svg` | Vector (SVG) | 6 KB | Vaakify app branding icon | Accessible branding icon |

---

## 2. Audio Assets (Compressed Web Audio Library)

All audio assets are compressed MP3 files (96 kbps) located in `web/public/sounds/`:

| Sound File | Size | Used In | Audio Character & Trigger |
| :--- | :--- | :--- | :--- |
| `announce.mp3` | 1.04 MB | Autism (Mall/School) | Muffled public announcement chime |
| `argue.mp3` | 496 KB | Autism (School/Mall) | Murmur of background conversation (unintelligible) |
| `bell.mp3` | 142 KB | Autism (School) | School transition bell (gentle, muffled) |
| `buzzphone.mp3` | 444 KB | ADHD / Autism | Subtle phone vibration on a desk |
| `call.mp3` | 68 KB | Autism | Distant telephone ringing tone |
| `crash.mp3` | 22 KB | Autism (Canteen) | Distant dropped plastic tray or cutlery clatter |
| `flicker.mp3` | 93 KB | Autism | Low fluorescent light electrical buzz |
| `footsteps.mp3` | 80 KB | Autism / ADHD | Hallway footsteps passing by |
| `glare.mp3` | 30 KB | Autism | Subtle high-frequency tonal shimmer for bright sunlight |
| `hum.mp3` | 489 KB | Autism | Low 100/120Hz room tone hum |
| `laugh.mp3` | 135 KB | Autism | Background conversational laughter |
| `rustle.mp3` | 131 KB | Autism / ADHD | Paper rustling / notebook shuffling |
| `scrape.mp3` | 101 KB | Autism / ADHD | Chair leg dragging on floor |
| `screech.mp3` | 101 KB | Autism (Mall) | Distant tire or shopping cart wheel scrape |
| `shout.mp3` | 1.19 MB | Autism | Distant playground call |
| `slam.mp3` | 31 KB | Autism / ADHD | Distant door shutting |
| `tap.mp3` | 3 KB | Speech / ADHD | Crisp rhythmic click |
| `tray.mp3` | 1.44 MB | Autism (Canteen) | Canteen plate and cutlery movement |
| `whir.mp3` | 360 KB | Autism | Air conditioner / fan ventilation drone |

---

## 3. Video Assets (Compressed Video Library)

All videos are H.264/AAC MP4 files located in `web/public/videos/`:

| Video Path | Size | Scenario | Content |
| :--- | :--- | :--- | :--- |
| `public/videos/grocery/1.mp4` | 2.1 MB | Grocery Store | Supermarket aisle with passing shoppers and cart motion |
| `public/videos/mall/1.mp4` | 2.4 MB | Shopping Mall | Escalator and multi-level atrium view |
| `public/videos/mall/2.mp4` | 2.8 MB | Shopping Mall | Mall storefront promenade with pedestrian movement |
| `public/videos/school/1.mp4` | 2.6 MB | School | School corridor / hallway transition |
| `public/videos/school/2.mp4` | 2.2 MB | School | Classroom background with student movement |
| `public/videos/school/3.mp4` | 2.5 MB | School | Canteen seating with table activity |

---

## 4. Generated Environmental Illustrations (Phase 4 — Completed)

All environment illustrations have been generated using the `image-generator` subagent adhering to the master specification (editorial picture-book illustration, watercolor/gouache textures, warm cream, sage green, honey ochre, terracotta, no text or symbols), converted to optimized WebP at quality 85, and stored in `web/public/decor/itw/`:

| Asset Path | Format & Dimensions | File Size | Scene Description & Role |
| :--- | :--- | :--- | :--- |
| `public/decor/itw/hero-world.webp` | WebP (1376×768, 16:9) | 146 KB | **Shared Hero Scene:** Inclusive botanical garden and arbor courtyard with diverse children engaged in creative, collaborative exploration. Generous cream negative space for text. |
| `public/decor/itw/adhd-environment.webp` | WebP (1376×768, 16:9) | 280 KB | **ADHD Active Learning Space:** Sunlit workshop classroom with floor-to-ceiling forest windows, flexible seating, models, and sketches in warm golden honey and sage tones. |
| `public/decor/itw/autism-environment.webp` | WebP (1376×768, 16:9) | 335 KB | **Autism Sensory Public Space:** Multi-level school atrium featuring overhead skylights, textured stone floors, potted ferns, and natural movement across gentle depth layers. |
| `public/decor/itw/dyslexia-environment.webp` | WebP (1376×768, 16:9) | 289 KB | **Dyslexia Reading Sanctuary:** Serene, sun-drenched library alcove with curved wooden shelves, unlabelled book spines, bay window ivy, and warm afternoon light pooling on floorboards. |
| `public/decor/itw/communication-environment.webp` | WebP (1376×768, 16:9) | 304 KB | **Speech & Communication Vignette:** Warm, intimate veranda scene of two friends sharing a relaxed conversation across a low wooden table, emphasizing attentive, unhurried listening. |
| `public/decor/itw/supportive-environment.webp` | WebP (1376×768, 16:9) | 184 KB | **Supportive Sensory Sanctuary:** Restorative quiet corner with plush beanbag chair, chunky knit blanket, curved acoustic leaf tiles, glowing paper globe lamp, and fiddle-leaf fig tree. |

Total weight of all 6 high-resolution environment WebPs: **1.53 MB** (averaging ~250 KB per full-bleed scene).

All image elements include progressive enhancement fallbacks (CSS gradient backdrop + inline SVG icons) and degrade gracefully if network issues prevent image loading. Detailed prompts and fallback architectures are documented in `web/docs/itw/IMAGE_GENERATION_PROMPTS.md`.

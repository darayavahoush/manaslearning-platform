# In Their World (ITW) Media Assets

This directory documents the media assets used in the "In Their World" experiences.

## Autism Experience Media Assets

### 1. Compressed Audio Cues (`public/sounds/*.mp3`)
- **Module:** Autism (Sensory simulation)
- **Format:** MP3 at 96 kbps, 44.1 kHz, mono/stereo
- **Source:** Compressed from original source samples using ffmpeg.
- **Description:** 19 distinct real-world sensory sound cues (`announce`, `argue`, `bell`, `buzzphone`, `call`, `crash`, `flicker`, `footsteps`, `glare`, `hum`, `laugh`, `rustle`, `scrape`, `screech`, `shout`, `slam`, `tap`, `tray`, `whir`). Total directory weight reduced from 58.8 MB to 6.2 MB (89.4% reduction).
- **Safety:** Loaded strictly when cued; routed through master gain capped at safe levels ($\le 0.12$) with smooth $\ge 150\text{ ms}$ attack ramps.

### 2. Compressed Environmental Videos (`public/videos/`)
- **Module:** Autism (Sensory simulation background)
- **Format:** H.264 video, AAC audio, MP4 container, bitrate ~320 kbps.
- **Scenes:**
  - `public/videos/mall/1.mp4` (1.1 MB), `2.mp4` (1.6 MB)
  - `public/videos/school/1.mp4` (432 KB), `2.mp4` (1.9 MB), `3.mp4` (2.0 MB)
  - `public/videos/grocery/1.mp4` (2.3 MB, compressed down from 18 MB)
- **Status:** All video files are capped under 3 MB each. Loaded with `preload="none"`, only mounted when the Autism observation module is active, and paused immediately if effects are toggled off.

### 3. Inline SVG Cue & Accommodation Icons (`components/itw/media/CueIcon.jsx`)
- **Module:** Autism (cues and accommodations) & reusable across ITW
- **Format:** Zero-byte external overhead, rendered as inline vector SVG.
- **Description:** Replaced 26 system emoji glyphs with uniform, accessible line icons (headphones, visual schedule card, timer, break card, communication card, plus icons for all 19 sensory cue types).

### 4. Low-Stimulation Sanctuary (`components/itw/media/QuietCorner.jsx`)
- **Module:** Autism ("What Helps" step)
- **Format:** Inline SVG illustration with Web Audio polyphonic synthesizer.
- **Description:** A soothing pastel quiet corner scene featuring soft indirect lighting, comfy armchair, wall-hung headphones, and plant. Accompanied by a gentle Cmaj9 warm synth pad (130–330 Hz, 420 Hz lowpass filter, 2.0s slow fade-in, max gain 0.06).

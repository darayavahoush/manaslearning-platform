# ANTIGRAVITY MASTER PROMPT — IN THEIR WORLD

You are the **implementation lead inside the actual local repository** for Manas Learning's **In Their World** experience. Your task is to evolve it into an exceptionally thoughtful, immersive, evidence-aware, accessible interactive experience—not merely redesign the landing page and not just add decorative animations.

Use your strongest repository reasoning, local file access, browser preview, terminal, and image-generation tools. Work in small verified phases. Treat the current code and the user's local changes as the source of truth. Do not assume you can see ChatGPT's conversation history or talk to ChatGPT directly: the user is deliberately using ChatGPT as a second senior product/UX/accessibility/content reviewer. Maintain review artifacts so both AIs contribute meaningfully rather than producing conflicting rewrites.

## 0. The mission

**Product promise:** A parent, teacher, or curious person should enter a recognizable everyday situation, attempt a task, notice what made it harder, try a supportive adjustment, and leave with something specific and useful to do differently. The emotional outcome should be curiosity, empathy, and agency—not pity, fear, shame, a diagnosis, or a leaderboard score.

The experience should feel like a beautifully art-directed interactive storybook crossed with a thoughtful, hands-on learning exhibit. It should be rich and immersive while remaining calm, readable, quick to use, and safe to exit.

**The core learning loop is:**
1. **Enter a situation** — context, clear instructions, estimated time, and an honest description of what this activity can and cannot demonstrate.
2. **Try the task** — interaction is the experience; do not rely on an illustration or wall of text to fake interactivity.
3. **Reflect** — invite the visitor to notice effort, uncertainty, distraction, timing, or what helped. Never shame or grade their emotional reaction.
4. **Change one support** — offer one or more practical accommodations and let them retry a comparable task.
5. **Understand** — explain the possible connection without claiming that a short simulation reproduces a person's lived experience.
6. **Take it into life** — specific, practical strategies for home and school, and an appropriate next step.

## 1. Repository ground truth — verify it locally first

The repository was previously `darayavahoush/vaakbot` and now resolves on GitHub as `darayavahoush/manaslearning-platform`. The relevant local project has been `~/work/vaakbot/web`. Work on whichever local checkout actually exists; do not reclone into an existing working tree or overwrite local changes.

The latest remotely inspected `main` commit was `8aed8e6c` (2026-10-29 autism media-safety merge). **This is a reference point, not proof that the user's local branch is identical.** Inspect the local branch, remote, `git status`, recent commits, and diffs before editing.

Known files in the committed code:
- `web/components/itw/InTheirWorld.jsx` — approximately 134 KB / 3,300 lines; currently marked `// @ts-nocheck`.
- `web/components/itw/InTheirWorld.css` — approximately 70 KB; contains historical appended overrides and duplicate selector/keyframe sections.
- `web/components/itw/ItwClient.tsx` — lazily imports the experience and provides a loading/error fallback.
- `web/components/itw/ItwLeaves.tsx` — portals the falling-leaf layer into `.itw-root`.
- `web/components/itw/media/CueIcon.jsx`, `EffectsToggle.jsx`, `QuietCorner.jsx`, `media.css`.
- `web/app/experience/page.tsx` — `/experience` route and metadata.
- `web/app/globals.css` — site-wide tokens and global falling-leaf animations.
- `web/proxy.ts` injects `public/decor/apps-patch.js?v=6` into HTML responses; that script inserts VaakSiddhi and Vaakify cards into the homepage. Avoid breaking the homepage or that integration while improving `/experience`.
- `web/scripts/fetch-itw-assets.mjs` — sequentially downloads sound/video assets from Hugging Face and compresses them; `package.json` runs it in `predev` and `prebuild`. A prior local startup was interrupted during an asset fetch. Investigate whether it needlessly downloads already-present valid files and whether failure/timeout handling can be made more efficient without breaking production.
- Existing artwork includes `public/decor/hero-illustration.webp`, `public/decor/leaf.webp`, and a `public/decor/itw/` directory. Inspect these before generating replacements.

The four current modules are:
- **Autism / sensory filtering:** `AutismSim` and `AutismModule`. It offers mall/school/grocery scenes, competing cues, target detection, optional sound, sound volume, a sensory-effects toggle, and a `QuietCorner` support scene.
- **ADHD / attention regulation:** `AdhdSim` and `AdhdModule`. It asks visitors to click 1–10 in order while interruptions pop up; it tracks elapsed time and misses and has a distraction toggle.
- **Dyslexia / reading & decoding:** `DyslexiaModule`. This is already the most developed flow, with intro, instructions, reading, comprehension questions, result, explanation, support, and next steps. It currently uses a timed passage with moving/swapping letters in simulated mode.
- **Speech & Language / communication under pressure:** `SpeechSim` and `SpeechModule`. It uses timed conversation prompts and deliberately blocked words; its timing becomes tighter across rounds.

The landing page also advertises coming-soon concepts such as Dyscalculia, Dysgraphia, Auditory Processing, Executive Functioning, Down Syndrome/Global Developmental Delay, and “A Day Through My Eyes.” Do **not** start six new modules before the four core modules are coherent and finished.

Project context: Next.js 16.4.3, React 19.3.0, TypeScript, Tailwind v4 and ESLint 9. The local `web/AGENTS.md` specifically says this Next.js version has breaking changes. Before editing app/router/build conventions, read the relevant documentation in `web/node_modules/next/dist/docs/` as instructed by `AGENTS.md`; do not confidently apply older Next.js patterns.

## 2. Agent collaboration protocol — make both AIs useful

Use this division of labour:

- **You, Antigravity:** local repository exploration, precise edits, generated assets, browser inspection, terminal commands, tests/builds, screenshots and verified implementation.
- **ChatGPT (second reviewer):** independent product/interaction design critique, challenge inaccurate disability framing, review architecture/diffs, identify edge cases, evaluate accessibility and help prioritize improvements. ChatGPT does not automatically see your local files or communicate with you directly.

Create and maintain these handoff docs in the repo (choose `web/docs/itw/` unless a more appropriate existing docs structure exists):
1. `ITW_BASELINE.md` — current route/component architecture, current user journey, identified bugs, constraints, baseline test results, current branch/commit, and screenshots/viewport dimensions.
2. `ITW_EXPERIENCE_BLUEPRINT.md` — final proposed journey for each of the four modules, screen-by-screen; specific interactions; what each is intended to teach; what it cannot claim; support/comfort options; text copy; responsive states.
3. `ITW_ASSET_MANIFEST.md` — every image/illustration generated or reused, exact path, dimensions/aspect ratio, prompt, purpose, source/licence if reused, file size, fallback behaviour, and where it is used.
4. `CHATGPT_REVIEW_PACKET.md` — at every milestone, summarize decisions, changed files, why, diff stats, before/after screenshots, test commands/results, unresolved choices, accessibility risks and exact questions for ChatGPT to critique. Include relevant changed code or diffs when manageable; do not paste credentials or `.env` contents.
5. `ITW_QA_CHECKLIST.md` — repeatable manual and automated checks.

Do not merely write these docs and stop. Complete the work in phases below. After each phase, update `CHATGPT_REVIEW_PACKET.md` so the user can bring it to ChatGPT for independent review. If ChatGPT feedback is later supplied, reconcile it against actual repository facts, and explicitly document accepted/rejected suggestions with reasons. Never apply a suggestion blindly if it conflicts with existing code, the product's safety constraints, or test evidence.

At the end of every phase, report completed work, actual tests run (with results), known failures, and exact changed paths. Never claim a test passed unless you ran it. Never claim visual verification if you only read the JSX/CSS. Do not push or commit unless the user explicitly authorizes it.

## 3. Experience and content principles

- **Empathy, not impersonation:** state clearly that each simulation is a limited analogy and cannot recreate a diagnosis or another person's lived experience. Experiences vary between people, across age, context, communication style, sensory profile and support needs.
- **Strengths alongside barriers:** the debrief must not describe a child as broken, deficient, lazy, unintelligent, manipulative or a problem to fix. Include agency, preferences and possible strengths without making universal claims.
- **Change the environment, not the person's worth:** pair each challenge with specific supports that can lower barriers.
- **No pseudo-diagnosis:** do not interpret a visitor's score, time, number of misses, or response as evidence they have or do not have a condition. Do not label their result “normal/abnormal.” If metrics exist, describe only performance on that particular task under those particular conditions.
- **No unsupported clinical or prevalence claims:** retain existing data only after checking the source/attribution and phrasing. Put source and year near each statistic; avoid false precision or implying a single Indian national estimate when the study does not support it. Flag uncertain facts in the review packet rather than inventing citations.
- **Co-design principle:** where possible, recommend a later review with neurodivergent adults, people with relevant lived experience, speech-language professionals, therapists, educators and parents. Do not claim the experience has been co-designed or validated unless that has happened.
- **Narration and language:** human, vivid, specific, non-patronizing, short enough to read during an interaction. Explain jargon. Never talk over the visitor with forced animation or a long wall of copy.
- **Avoid sensory harm:** no strobing/flickering that risks photosensitivity, sudden loud audio, harsh noise, forced disorientation, auto-play audio, unbounded motion, compulsory timers, trapped states or inaccessible effects. Any intensive effect is opt-in, adjustable, easy to stop, and off by default. Make the stop/pause control visible throughout the activity.
- **Support a visitor who is uncomfortable:** add concise pre-activity notice and a persistent “Pause / reduce effects / leave experience” affordance. Exiting should preserve no sensitive personal data and should not shame the visitor.

Reference principles to consult as useful (not as a substitute for direct experience or research):
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- United Nations Disability Inclusion Strategy, including accessibility by design and co-creation: https://www.un.org/disabilitystrategy/
- Systematic review on participatory methods to engage autistic people in digital technology design: https://pubmed.ncbi.nlm.nih.gov/37249696/

## 4. Design direction — an immersive, living storybook, not a gimmick

Create a distinctive, polished world: warm paper/cream, layered botanical green, delicate terracotta/ochre/purple accents, subtle grain, generous whitespace, editorial typography, tactile interaction surfaces, confident hierarchy and expressive illustrations. Respect the already-present Nunito / Libre Franklin / JetBrains Mono styles and existing CSS variables unless the local repository shows a strong reason to adjust them.

The world should feel alive in its transitions, illustrations and interactions, not through constant effects. Prioritize:
- A memorable, art-directed hero that signals “step into a perspective” without depicting disability as frightening or tragic.
- Each module has its own recognisable art direction, accent and motif while remaining inside one shared design system.
- A clear “where am I / what happens next” step indicator and consistent, responsive interaction stages.
- Real interaction feedback: visual response to actions, a visible state change when support is enabled, and an understandable comparison between runs.
- Quiet transitions between task and debrief. Do not put falling leaves or decorative layers over headlines, buttons, simulation targets, body text or footer links.
- Rich mobile layouts and keyboard-first controls; do not scale a desktop stage down until it becomes unusable.
- Loading, failure and offline states should be designed, not left as endless “Loading…” placeholders.

Use existing artwork if it fits. Avoid stock photos as generic filler and avoid generating fake text/UI screenshots. Do not put words, numbers, logos, diagnostic symbols or legible UI copy inside generated images. Create the actual interface in HTML/CSS/React.

## 5. Image-generation brief and asset workflow

You have permission within this task to generate visual assets **when your environment provides a real image-generation tool**. Do not just write a prompt and pretend an image was generated. If no image-generation tool is available, produce `web/docs/itw/IMAGE_GENERATION_PROMPTS.md` with the complete prompts, planned output names, dimensions/aspect ratios and intended usage; continue with existing artwork/CSS/SVG fallbacks.

First audit `web/public/decor/itw/` and all relevant assets. Reuse them if appropriate. Generate only assets that solve a real visual need. Proposed assets (adjust based on your audit and chosen experience blueprint):

- `web/public/decor/itw/hero-world.webp` — wide 3:2 or 16:9 storybook environment for the opening, layered garden/classroom threshold motif; visual space for text overlay; calm botanical richness.
- `web/public/decor/itw/autism-environment.webp` — a recognisable everyday school/café/public-room scene with layered but non-threatening sources of sensory input; do not use visual strobing or make the person look “broken.”
- `web/public/decor/itw/adhd-environment.webp` — welcoming homework/classroom context with several competing but ordinary visual cues; no stigmatizing or infantilising framing.
- `web/public/decor/itw/dyslexia-environment.webp` — an inviting reading scene with book/paper/desk visual texture; do not represent dyslexia solely with mirrored letters or “letters flying everywhere.”
- `web/public/decor/itw/communication-environment.webp` — a warm, ordinary conversation between people, communicating patience and time rather than embarrassment or ridicule.
- `web/public/decor/itw/supportive-environment.webp` — a calm, inviting reset/quiet space with comfortable choices and adjustable light; do not imply every autistic person wants the same sensory environment.
- Optional small accent/transparent decorative elements only if they are genuinely useful and fit the existing layout.

**Visual prompts:** premium editorial picture-book illustration, warm paper and sage/fern green, restrained terracotta/ochre/plum accents, sophisticated hand-painted texture plus clean shapes, natural indirect light, subtle depth and foreground foliage, thoughtful composition, inclusive everyday environment, non-clinical and non-pitying. No text, letters, labels, logos, UI, watermarks, medical symbols, jarring patterns or high-frequency contrast. No stereotyped “autistic look.” Scene art should be decorative/context-setting, not presented as evidence of what every person experiences.

Use transparent backgrounds only for isolated decorative objects; use full-bleed backgrounds for scenes. Generate at high enough resolution for responsive use (aim for ≥1600 px on the long edge), then optimise to WebP/AVIF only if the Next.js/toolchain supports it and verify quality/file size. Prefer assets under a few hundred KB where visually reasonable. Record prompt and output in `ITW_ASSET_MANIFEST.md`. Add meaningful alt text for informative images; decorative images must use empty alt / be hidden from assistive tech. Never make a core instruction or piece of meaning available only in an image.

Before generating all assets, test one representative scene and check it in the actual browser layout. Do not regenerate assets repeatedly without a specific critique explaining what needs to change.

## 6. Module-specific redesign goals

### A. Autism — sensory filtering in an everyday environment

The current app includes scenario selection, competing cues, target/decoy detection, optional sound controls and a quiet-corner scene. Preserve what works; redesign the flow around choice, predictable controls, and support comparison.

Proposed journey:
1. Brief the visitor: this is a short activity about competing sensory input, not “what autism feels like” for everyone. Provide explicit permission to skip sound/effects.
2. Choose a familiar setting and a low/medium sensory intensity. Sound is OFF by default; any visual motion/effects are off when reduced motion is enabled.
3. Try a short observation task. Keep the task clear and the interface operable; never require strobe, intense noise or flicker.
4. Debrief using task-only observations (“you found X targets in this round”), not a disability score.
5. Enable a specific support such as quieter audio, fewer competing cues, a clear visual schedule, or a quieter area; retry a comparable task.
6. Explain that sensory preferences differ and ask the individual what helps. Include practical strategies at home and in classrooms.

Keep “quiet corner” as a choice, not a universal prescription. Never autoplay its soothing sound. If a video fails, show a graceful still-image/SVG fallback and a useful message.

### B. ADHD — attention regulation, interruptions and movement

Retain the 1-to-10 target task and distraction-on/off concept; remove any language implying the visitor's result measures ADHD or that “everyone finishes faster” without evidence.

Proposed journey:
1. Introduce an everyday small task and tell the visitor what to do.
2. Run A: task without interruptions or with low distraction.
3. Run B: same task with optional, adjustable interruptions. Never produce unexpected loud sounds; audio remains opt-in.
4. Compare time/misses neutrally (“in this run…”) and invite the visitor to reflect on what pulled focus.
5. Allow the visitor to try one support (movement break, smaller steps, removing nonessential interruptions, visible progress, transition warning) and retry.
6. Explain that ADHD involves more than distractibility and presentations vary; not being able to complete this task does not indicate a diagnosis.

Do not turn this into a speed leaderboard. Make controls usable by touch, mouse and keyboard. When stopping or restarting, clear every timeout/interval and restore a predictable state.

### C. Dyslexia — reading/decoding and access to meaning

This is currently the most developed flow. Preserve the useful 8-part structure and make it more honest and humane.

Critical framing: dyslexia is not simply seeing letters move, flip or reverse. Do not imply the current visual distortion is a faithful or universal simulation. Explain that it is a very limited metaphor. Avoid overstating a timed and artificially distorted reading test as a real measure of dyslexic reading.

Build a learning journey around effort, decoding load, time and access to meaning. If you retain a comparison, keep text/content comparable between conditions and label what is deliberately changed. Include a supportive retry (e.g. more time, clearer spacing, reduced distractions, read-aloud/text-to-speech if technically feasible), and let the visitor compare what changes. Ensure the quiz assesses the task content, not a pseudo-clinical ability. Include a plain-language debrief that distinguishes decoding fluency from intelligence and comprehension.

### D. Speech & Language — speaking under time pressure

The current simulator blends a timed conversation with randomly blocked words; do not equate this one mechanic with all stuttering, speech-sound or word-finding differences.

Label the activity as a narrow illustration of communication under time pressure. Consider separating or clearly naming the simulated mechanic (e.g. “word-finding delay” vs “fluency interruption”) so it does not imply that different conditions are identical. Avoid mocking faces, red-flag failure cues, or harsh countdown pressure.

Use the same prompt or comparable conversation in two runs: one with urgency/interruption and one with a patient conversational partner and extra response time. Let the visitor experience how waiting, not finishing someone’s sentence, and responding to the message rather than delivery can help. No speech-quality score and no diagnosis inference.

## 7. One shared flow system

Create/reuse shared components only when they reduce duplication without turning every module into the same content template. Each core module should have:
- Intro: everyday context, aim, estimated time, “what this is / isn't,” comfort settings.
- Instructions: one clear task at a time, keyboard/touch instructions and escape/pause option.
- Activity: persistent pause, stop/reduce-effects control, visible progress where useful, no surprise audio, no inaccessible custom controls.
- Reflection: brief, non-judgmental questions or selectable observations. These answers should stay local/in-memory unless a clear, consented reason exists to save them.
- Debrief: what the interaction demonstrates, what it cannot prove, individual variation and strengths.
- Support experiment: activate one practical environmental/support change and retry a comparable task.
- Takeaways: home/classroom strategies, links to real support, optional printable/shareable summary. Do not include private answers by default and do not imply that an exported result is a clinical report.

The four experiences can have different interaction mechanics and scene art. Shared structure should help users orient themselves, not flatten differences.

## 8. Accessibility and sensory safety are release blockers

Target WCAG 2.2 AA for the new/modified experience as far as practical; record known gaps honestly. At minimum:
- Use semantic buttons, links, headings, landmarks, labels and live status messaging. Remove clickable `div role="button"` when a native `<button>` is appropriate.
- Test every task with keyboard only; visible focus, sensible focus order, no keyboard traps, and focus moves appropriately when flow screens change.
- Respect `prefers-reduced-motion`; provide a functioning in-app motion toggle as well. Do not merely slow harmful/irrelevant motion—stop it. The media query must target the *real* leaf class in use (`.itw-leafwrap` / `.itw-leafimg`, not just older `.itw-leaves`).
- All sounds disabled by default, no mount-time/retry tones when sound is off, no background audio before consent, separate volume control, clear stop button, graceful handling when Web Audio is unavailable.
- Honor `prefers-reduced-motion` and `prefers-contrast`/forced-colors where appropriate.
- Adequate text and non-text contrast in both light and dark mode; no reliance on color alone; text remains readable over art.
- Reflow at 320 CSS px; no horizontal overflow; target size and spacing suitable for touch; readable at 200% zoom; don't enforce one orientation.
- Timers are optional or adjustable wherever the task permits. If a timer is pedagogically essential, clearly explain it and provide an untimed alternative where appropriate.
- Every custom target is keyboard operable, named, and has a visible focus state. Respect touch interaction and do not depend on hover.
- Errors, missing media, empty states and loading states are understandable and non-blocking.
- Decorative leaves must not obscure content and must stop/hide before the footer links or legal text. Avoid global changes that break homepage leaves; scope any experience-specific rules appropriately.

Use actual WCAG criteria as a checklist: https://www.w3.org/TR/WCAG22/ . Do not write “WCAG compliant” unless you have performed a meaningful audit.

## 9. Design system and motion rules

- Audit current CSS first. Consolidate duplicates only where safe; do not blindly delete historical rules without checking their cascade and page effects.
- Avoid a new pile of bottom-of-file `!important` patches. Prefer correcting the authoritative rule and removing obsolete overrides once verified.
- Keep one deliberate z-index map (background art < leaves/ambient art < scene < content < controls/dialogs). Check stacking contexts, `position: fixed`, portals and transformed parents in a real browser.
- Preserve the existing cream/botanical world and dark-mode identity; contrast must be intentional in both.
- Use animation to explain state, focus attention gently, and create transitions. Keep most decorative motion slow, subtle, nonessential and disabled for reduced-motion users.
- Use purposeful empty space, scene-specific visual anchors, and well-defined hierarchy, not glass cards over every element.
- Avoid emoji as the core visual language. Prefer existing custom SVG `CueIcon` / coherent custom SVG art where appropriate; no need to replace every emoji in one risky global pass.

## 10. Performance and engineering constraints

- Before changes: inspect `git status --short`, branch, HEAD and `git diff`; preserve every existing user edit. Do not run `git reset --hard`, `git clean -fd`, destructive checkout commands, or delete unrelated files.
- Make a local safety snapshot only if it fits the team's existing workflow; avoid littering the repo with repeated backup files.
- Read `web/AGENTS.md` and relevant Next.js docs in `web/node_modules/next/dist/docs/` before modifying framework/build behavior.
- Don't add dependencies unless they provide clear value and you explain why.
- Don't rewrite `InTheirWorld.jsx` wholesale. Make focused, reviewable changes; extract subcomponents into separate modules only if the imports and test/build setup remain stable.
- Check timer/audio/video cleanup on unmount, restart and navigation. No orphan intervals, timeouts, video/audio nodes or event listeners.
- Asset downloads must be reproducible. Inspect the current asset fetch/compression scripts. Prefer skipping valid existing files, bounded retries/timeouts and non-destructive failure behavior, but do not silently ship missing media or skip required production assets. Record how clean builds behave.
- Do not expose secrets, `.env` values, keys, private contact info or session data in logs/review packets.
- Keep homepage integrations intact, particularly `web/proxy.ts` and `web/public/decor/apps-patch.js`.

## 11. Phased execution — implement, verify, then proceed

### Phase 0 — baseline and blueprint
1. Inspect local repository, `git status`, branch/HEAD, user changes and scripts.
2. Read `AGENTS.md`, relevant Next.js docs and the current ITW source/CSS/media components.
3. Run baseline checks where feasible and save exact results. Take browser screenshots of `/experience` at desktop and mobile sizes; include current homepage if shared CSS/leaf behavior may be affected.
4. Identify all available assets, asset-fetch behaviour, redundant CSS rules, a11y issues and timer/audio cleanup risks.
5. Write/update `ITW_BASELINE.md`, `ITW_EXPERIENCE_BLUEPRINT.md`, `ITW_ASSET_MANIFEST.md` and `CHATGPT_REVIEW_PACKET.md`.
6. Continue into implementation without asking the user broad preference questions. Make well-reasoned, reversible choices. Pause only if a destructive action, credential, paid tool or genuinely unavailable prerequisite requires user consent.

### Phase 1 — safety, reliability and foundation
1. Make sound opt-in and fix mount/retry sound behavior so mute means mute.
2. Make the global reduce-effects behavior predictable; fix reduced-motion targeting, including leaf selectors, and verify the leaf layer cannot cover content/footer.
3. Fix critical keyboard semantics/focus behavior and add pause/exit controls to active tasks.
4. Audit media-fetch scripts and improve local startup reliability without making production builds flaky.
5. Remove only verified duplicate CSS declarations or old override blocks; maintain before/after screenshots.
6. Run available `npx tsc --noEmit`, `npx eslint` on changed files, build and available tests. Investigate the existing `// @ts-nocheck` instead of pretending it does not exist; do not remove it without addressing any resulting real errors.
7. Update review packet and continue.

### Phase 2 — implement one gold-standard journey (ADHD first)
Use ADHD to establish the flow and interaction pattern, while keeping autism, dyslexia and speech working.
1. Intro/comfort controls → task instructions → low-interruption round → adjustable-interruption round → neutral comparison → optional support experiment and retry → debrief → real-world strategies/next step.
2. Preserve comparable task conditions between rounds wherever possible. Explain that the result is about those task conditions only.
3. Add polished state transitions, progress indicator, reset and error/reduced-motion behavior.
4. Verify all interactions, repeated runs, route switching, keyboard and mobile behavior.
5. Capture screenshots and update `CHATGPT_REVIEW_PACKET.md`. Do not progress to large visual expansion until this journey is demonstrably sound.

### Phase 3 — bring Autism, Dyslexia and Speech & Language to the same quality bar
Adapt rather than copy/paste the ADHD mechanic. Use the module-specific requirements above. Preserve effective existing work, including QuietCorner, module-specific colors and useful support content. Keep differences between each module meaningful. Add comparison/support experiments where appropriate and ensure each journey has an honest debrief.

### Phase 4 — images and art direction
1. Audit existing `public/decor/itw/` and assets first.
2. Generate one representative environment image with a true image-generation tool if one is available; integrate it into the actual browser layout and inspect crop, contrast, character/art direction, and performance.
3. Only then generate the remaining needed scenes with consistent art direction. If no image generator is available, write complete prompts to `IMAGE_GENERATION_PROMPTS.md` and build usable CSS/SVG fallbacks; do not fabricate files.
4. Optimize image formats and sizes; add safe fallbacks if image loading fails; check mobile crops; never let art obstruct the task or be required to understand instructions.
5. Complete `ITW_ASSET_MANIFEST.md`.

### Phase 5 — finish, validate and hand off
1. Test every module from landing through every state and back.
2. Test desktop and mobile widths (at minimum 1440×900, 1024×768, 390×844 and 320 CSS px); light/dark; sound off/on only after explicit activation; reduced motion; keyboard-only; failed/missing videos and images; repeated restarts; navigation between modules; footer/leaf overlap; browser console.
3. Check the homepage and its VaakSiddhi/Vaakify cards after shared styles/proxy changes.
4. Run typecheck, lint, build and available tests. Report exactly which pass/fail and do not hide baseline failures.
5. Update QA checklist, baseline/blueprint, asset manifest and ChatGPT review packet with screenshots, diffs, test output and unresolved issues.
6. Present a concise user-facing summary with changed paths, visible changes, tests actually run, known limitations, and any image assets the user needs to place manually. Do not commit, push or deploy without explicit authorization.

## 12. Definition of done

This is not “done” just because the page looks pretty. It is done when:
- The four existing core modules each tell a coherent, complete and distinct story.
- The visitor can try a task, notice what changed, try a supportive adjustment, and leave with respectful, useful guidance.
- No module implies a diagnostic conclusion or universal representation of a condition.
- Sound is opt-in, effects can be stopped, reduced motion works, keyboard use works and controls are visible and readable.
- Generated art is integrated and documented, loads efficiently, and cannot obscure content.
- The mobile layout feels designed rather than squeezed down.
- The homepage, navbar, app cards, existing assets, route fallback and deployment build still work.
- The code changes are reviewable, tests/screenshots/results are recorded, and ChatGPT's independent review packet is ready.

**Now begin Phase 0 on the local repository. Inspect first, protect local work, document the real baseline, then implement and verify in the order above. Make decisions, not guesses; show evidence for completion; and leave the codebase easier to maintain than you found it.**

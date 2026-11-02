#!/usr/bin/env python3
"""
Generates the Indian English teacher voice clips used by the Auditory Processing
simulation (web/components/itw/InTheirWorld.jsx -> AuditoryProcessingSim).

Why pre-recorded clips: the browser's speechSynthesis only has an Indian accent if
the visitor's device happens to have an en-IN voice installed, and it plays outside
the Web Audio mixer, so the simulated classroom noise can't genuinely mask it.
Pre-rendered clips sound the same on every device and go through the same mixer as
the noise, so the "voice drowned by noise" effect is real.

Usage (from the `web/` folder, needs internet):
    python3 -m pip install edge-tts
    python3 scripts/generate-teacher-audio.py
    python3 scripts/generate-teacher-audio.py --voice en-IN-PrabhatNeural   # male teacher

Output: public/sounds/teacher_full.mp3, teacher_c1.mp3, teacher_c2.mp3, teacher_c3.mp3
"""
import argparse
import asyncio
import pathlib
import sys

try:
    import edge_tts
except ImportError:  # pragma: no cover
    sys.exit("edge-tts is not installed. Run: python3 -m pip install edge-tts")

CLIPS = {
    "teacher_full": (
        "Good morning class. Please listen carefully for tomorrow's three assignments: "
        "First, read Chapter 4, pages 30 to 35 in your textbook. "
        "Second, answer questions 2 and 5 in your blue notebook. "
        "Third, bring your project outline for Friday's lab."
    ),
    "teacher_c1": "First, read Chapter 4, pages 30 to 35 in your textbook.",
    "teacher_c2": "Second, answer questions 2 and 5 in your blue notebook.",
    "teacher_c3": "Third, bring your project outline for Friday's lab.",
}


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", default="en-IN-NeerjaNeural", help="Edge neural voice (en-IN-NeerjaNeural / en-IN-PrabhatNeural)")
    parser.add_argument("--rate", default="-6%", help="Speaking rate, e.g. -6%% for a calm classroom pace")
    args = parser.parse_args()

    out = pathlib.Path(__file__).resolve().parent.parent / "public" / "sounds"
    out.mkdir(parents=True, exist_ok=True)

    for name, text in CLIPS.items():
        dest = out / f"{name}.mp3"
        await edge_tts.Communicate(text, args.voice, rate=args.rate).save(str(dest))
        print(f"wrote {dest} ({dest.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    asyncio.run(main())

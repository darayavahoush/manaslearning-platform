// Pulls the autism-module media assets from the Hugging Face dataset
// (anabaena/autism-profile-assets) into public/, so the deployed site
// serves them same-origin instead of the browser fetching Hugging Face
// directly at runtime.
//
// This shells out to `curl` rather than using Node's built-in fetch()
// — on at least one dev machine, plain curl to this same URL returned
// instantly while Node's fetch hung indefinitely (a known class of
// quirk with Node's undici-based fetch and certain redirect/TLS setups).
// curl is present on macOS, Linux, and Vercel's build image by default.
//
// If a file is missing or the fetch fails, this just logs a warning and
// moves on — the app's own synthesized-sound / plain-color fallbacks
// still work fine without it.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { compressSounds, compressVideos } from "./compress-itw-assets.mjs";

const BASE = "https://huggingface.co/datasets/anabaena/autism-profile-assets/resolve/main";

const SOUND_FILES = {
  announce: "flac",
  argue: "mp3",
  bell: "wav",
  buzzphone: "wav",
  call: "wav",
  crash: "mp3",
  flicker: "wav",
  footsteps: "wav",
  glare: "wav",
  hum: "mp3",
  laugh: "mp3",
  rustle: "mp3",
  scrape: "wav",
  screech: "mp3",
  shout: "flac",
  slam: "wav",
  tap: "wav",
  tray: "m4a",
  whir: "wav",
};

const VIDEO_FILES = {
  mall: [1, 2],
  school: [1, 2, 3],
  grocery: [1],
};

function shouldFetchSound(kind, ext) {
  const mp3Dest = `public/sounds/${kind}.mp3`;
  const rawDest = `public/sounds/${kind}.${ext}`;
  if (fs.existsSync(mp3Dest) && fs.statSync(mp3Dest).size > 0) return false;
  if (fs.existsSync(rawDest) && fs.statSync(rawDest).size > 0) return false;
  return true;
}

function shouldFetchVideo(scene, n) {
  const videoDest = `public/videos/${scene}/${n}.mp4`;
  if (fs.existsSync(videoDest) && fs.statSync(videoDest).size > 0) return false;
  return true;
}

function fetchTo(url, dest) {
  console.log(`[fetch-assets] fetching ${url} ...`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    execFileSync("curl", ["-sSLf", "--max-time", "180", "-o", dest, url], { stdio: "inherit" });
    const size = fs.statSync(dest).size;
    if (size === 0) throw new Error("empty file");
    console.log(`[fetch-assets] ✓ ${dest} (${(size / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.warn(`[fetch-assets] skip ${url}: ${err.message}`);
    try {
      fs.unlinkSync(dest);
    } catch {
      /* nothing to clean up */
    }
  }
}

function main() {
  console.log("[fetch-assets] checking media assets (skipping already present files)...");
  let newSounds = 0;
  for (const [kind, ext] of Object.entries(SOUND_FILES)) {
    if (shouldFetchSound(kind, ext)) {
      fetchTo(`${BASE}/sounds/${kind}.${ext}`, `public/sounds/${kind}.${ext}`);
      newSounds++;
    }
  }
  let newVideos = 0;
  for (const [scene, nums] of Object.entries(VIDEO_FILES)) {
    for (const n of nums) {
      if (shouldFetchVideo(scene, n)) {
        fetchTo(`${BASE}/videos/${scene}/${n}.mp4`, `public/videos/${scene}/${n}.mp4`);
        newVideos++;
      }
    }
  }
  if (newSounds > 0 || newVideos > 0) {
    console.log("[fetch-assets] compressing newly fetched media...");
    if (newSounds > 0) compressSounds();
    if (newVideos > 0) compressVideos();
  } else {
    console.log("[fetch-assets] all 19 sounds and 6 videos are already present and verified.");
  }
  console.log("[fetch-assets] done.");
}

main();

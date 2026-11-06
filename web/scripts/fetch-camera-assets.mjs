// Puts the on-device face model where the browser can load it from this site:
//   public/decor/mediapipe/wasm/*          the MediaPipe runtime, copied from node_modules
//   public/decor/mediapipe/face_landmarker.task   the face model, fetched once with curl
// Served same-origin so no camera-related file is loaded from a third party at play time.
// (It lives under /decor because proxy.ts only serves a fixed list of paths itself.)
// If the model cannot be fetched this only warns; the optional camera step then reports that it could not start.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OUT = "public/decor/mediapipe";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const wasmSrc = path.join("node_modules", "@mediapipe", "tasks-vision", "wasm");
if (fs.existsSync(wasmSrc)) {
  fs.mkdirSync(path.join(OUT, "wasm"), { recursive: true });
  for (const f of fs.readdirSync(wasmSrc)) {
    const dest = path.join(OUT, "wasm", f);
    if (!fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(path.join(wasmSrc, f)).size) {
      fs.copyFileSync(path.join(wasmSrc, f), dest);
    }
  }
  console.log(`[fetch-camera-assets] runtime ready in ${OUT}/wasm`);
} else {
  console.warn("[fetch-camera-assets] @mediapipe/tasks-vision is not installed; run npm install");
}

const model = path.join(OUT, "face_landmarker.task");
if (fs.existsSync(model) && fs.statSync(model).size > 1_000_000) {
  console.log("[fetch-camera-assets] model already present");
} else {
  fs.mkdirSync(OUT, { recursive: true });
  try {
    execFileSync("curl", ["-sSLf", "--max-time", "180", "-o", model, MODEL_URL], { stdio: "inherit" });
    if (fs.statSync(model).size < 1_000_000) throw new Error("file too small");
    console.log(`[fetch-camera-assets] model ready (${(fs.statSync(model).size / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.warn(`[fetch-camera-assets] skip model: ${err.message}`);
    try { fs.unlinkSync(model); } catch { /* nothing to clean up */ }
  }
}

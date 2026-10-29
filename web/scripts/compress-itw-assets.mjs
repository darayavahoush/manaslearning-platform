// scripts/compress-itw-assets.mjs
// Compresses ITW media assets using ffmpeg:
// - Sounds to ~96 kbps MP3
// - Videos to <3 MB each using H.264 + AAC
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
const FFMPEG = ffmpegStatic || "ffmpeg";

const SOUNDS_DIR = "public/sounds";
const VIDEOS_DIR = "public/videos";

function checkFfmpeg() {
  try {
    execFileSync(FFMPEG, ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function compressSounds() {
  if (!checkFfmpeg()) {
    console.error("[compress] ffmpeg is not installed on PATH.");
    return;
  }
  if (!fs.existsSync(SOUNDS_DIR)) return;

  const files = fs.readdirSync(SOUNDS_DIR);
  console.log(`[compress] scanning ${files.length} sound files...`);

  for (const file of files) {
    if (file.startsWith(".")) continue;
    const src = path.join(SOUNDS_DIR, file);
    const stat = fs.statSync(src);
    if (!stat.isFile()) continue;

    const baseName = path.parse(file).name;
    const tmpDest = path.join(SOUNDS_DIR, `${baseName}.tmp.mp3`);
    const finalDest = path.join(SOUNDS_DIR, `${baseName}.mp3`);

    try {
      execFileSync(FFMPEG, ["-y", "-i", src, "-c:a", "libmp3lame", "-b:a", "96k", "-ar", "44100", tmpDest], { stdio: "ignore" });
      if (src !== finalDest) fs.unlinkSync(src);
      fs.renameSync(tmpDest, finalDest);
      const after = fs.statSync(finalDest).size;
      console.log(`[compress] sound ${file} -> ${path.basename(finalDest)}: ${(stat.size / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
    } catch (e) {
      console.warn(`[compress] failed ${file}:`, e.message);
      if (fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest);
    }
  }
}

export function compressVideos() {
  if (!checkFfmpeg()) return;
  if (!fs.existsSync(VIDEOS_DIR)) return;

  const scenes = fs.readdirSync(VIDEOS_DIR);
  for (const scene of scenes) {
    const sceneDir = path.join(VIDEOS_DIR, scene);
    if (!fs.statSync(sceneDir).isDirectory()) continue;
    const videos = fs.readdirSync(sceneDir);
    for (const v of videos) {
      if (!v.endsWith(".mp4") || v.includes(".tmp")) continue;
      const vPath = path.join(sceneDir, v);
      const sizeMB = fs.statSync(vPath).size / (1024 * 1024);
      if (sizeMB > 3.0) {
        console.log(`[compress] video ${vPath} is ${sizeMB.toFixed(1)}MB (> 3MB). Compressing...`);
        const tmp = path.join(sceneDir, `${v}.tmp.mp4`);
        try {
          execFileSync(FFMPEG, [
            "-y", "-i", vPath,
            "-c:v", "libx264", "-b:v", "320k", "-maxrate", "400k", "-bufsize", "600k",
            "-c:a", "aac", "-b:a", "48k",
            tmp
          ], { stdio: "inherit" });
          fs.renameSync(tmp, vPath);
          const newSizeMB = fs.statSync(vPath).size / (1024 * 1024);
          console.log(`[compress] video ${vPath} compressed: ${sizeMB.toFixed(1)}MB -> ${newSizeMB.toFixed(1)}MB`);
        } catch (e) {
          console.warn(`[compress] video compression failed for ${vPath}:`, e.message);
          if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
        }
      } else {
        console.log(`[compress] video ${vPath} is ${sizeMB.toFixed(1)}MB (<= 3MB, ok)`);
      }
    }
  }
}

if (process.argv[1]?.endsWith("compress-itw-assets.mjs")) {
  compressSounds();
  compressVideos();
}

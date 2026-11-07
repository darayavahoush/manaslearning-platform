import os
import glob
import json
from PIL import Image, ImageOps

ARTIFACTS_DIR = "/Users/ananyasridhar/.gemini/antigravity/brain/08217f75-b151-4457-9d59-806b38e64437"
DEST_ROOT = "/Users/ananyasridhar/work/vaakbot/web/public/quests"

def make_transparent(im, bg_color=(255, 255, 255), tolerance=30):
    im = im.convert("RGBA")
    data = im.getdata()
    new_data = []
    br, bg, bb = bg_color
    for item in data:
        r, g, b, a = item
        # If color is close to bg_color, make transparent with smooth falloff
        diff = math_dist((r, g, b), (br, bg, bb))
        if diff < tolerance:
            alpha = int(255 * (diff / tolerance) ** 2)
            new_data.append((r, g, b, alpha))
        else:
            new_data.append(item)
    im.putdata(new_data)
    return im

def math_dist(c1, c2):
    return ((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2) ** 0.5

def extract_subagent_images(conv_id):
    path = f"/Users/ananyasridhar/.gemini/antigravity/brain/{conv_id}/.system_generated/logs/transcript.jsonl"
    if not os.path.exists(path):
        return []
    images = []
    with open(path) as f:
        for line in f:
            d = json.loads(line)
            media = d.get("media") or []
            for m in media:
                uri = m.get("uri")
                if uri and uri.startswith("file://"):
                    uri = uri[7:]
                if uri and os.path.exists(uri):
                    images.append(uri)
    return images

def package_adhd(images):
    dest = os.path.join(DEST_ROOT, "adhd")
    os.makedirs(dest, exist_ok=True)
    print(f"ADHD images found: {len(images)}")
    for img_path in images:
        fname = os.path.basename(img_path).lower()
        im = Image.open(img_path)
        
        # Match names
        target_name = None
        is_sprite = False
        if "welcome" in fname:
            target_name = "welcome.webp"
        elif "bg_sunbird" in fname:
            target_name = "bg_sunbird.webp"
        elif "bg_flanker" in fname:
            target_name = "bg_flanker.webp"
        elif "bg_memory" in fname:
            target_name = "bg_memory.webp"
        elif "bg_charge" in fname:
            target_name = "bg_charge.webp"
        elif "celebration" in fname:
            target_name = "celebration.webp"
        elif "sunbird" in fname:
            target_name = "sunbird.webp"
            is_sprite = True
        elif "shadow_moth" in fname or "moth" in fname:
            target_name = "shadow_moth.webp"
            is_sprite = True
        elif "guide" in fname or "chirp" in fname:
            target_name = "guide_chirp.webp"
            is_sprite = True
        elif "share" in fname:
            target_name = "share.webp"
        elif "icon" in fname:
            target_name = "icon.webp"
            
        if target_name:
            out_path = os.path.join(dest, target_name)
            if is_sprite:
                # Make white corners transparent
                im_rgba = make_transparent(im, tolerance=35)
                im_rgba.thumbnail((512, 512), Image.Resampling.LANCZOS)
                im_rgba.save(out_path, "WEBP", quality=90)
            else:
                if target_name == "icon.webp":
                    im.thumbnail((256, 256), Image.Resampling.LANCZOS)
                elif target_name == "share.webp":
                    im.thumbnail((1200, 630), Image.Resampling.LANCZOS)
                else:
                    im.thumbnail((1280, 720), Image.Resampling.LANCZOS)
                im.save(out_path, "WEBP", quality=82)
            print(f"Saved ADHD asset: {out_path} ({im.size})")

def package_autism(images):
    dest = os.path.join(DEST_ROOT, "autism")
    os.makedirs(dest, exist_ok=True)
    print(f"Autism images found: {len(images)}")
    for img_path in images:
        fname = os.path.basename(img_path).lower()
        im = Image.open(img_path)
        
        target_name = None
        is_sprite = False
        if "welcome" in fname:
            target_name = "welcome.webp"
        elif "bg_gaze" in fname:
            target_name = "bg_gaze.webp"
        elif "bg_feelings" in fname:
            target_name = "bg_feelings.webp"
        elif "bg_sanctuary" in fname:
            target_name = "bg_sanctuary.webp"
        elif "bg_sorting" in fname:
            target_name = "bg_sorting.webp"
        elif "celebration" in fname:
            target_name = "celebration.webp"
        elif "aria_gaze_center" in fname or ("aria" in fname and "center" in fname):
            target_name = "aria_gaze_center.webp"
            is_sprite = True
        elif "aria_gaze_left" in fname or ("aria" in fname and "left" in fname):
            target_name = "aria_gaze_left.webp"
            is_sprite = True
        elif "aria_gaze_right" in fname or ("aria" in fname and "right" in fname):
            target_name = "aria_gaze_right.webp"
            is_sprite = True
        elif "fox_happy" in fname or ("fox" in fname and "happy" in fname):
            target_name = "fox_happy.webp"
            is_sprite = True
        elif "fox_sad" in fname or ("fox" in fname and "sad" in fname):
            target_name = "fox_sad.webp"
            is_sprite = True
        elif "fox_angry" in fname or ("fox" in fname and "angry" in fname):
            target_name = "fox_angry.webp"
            is_sprite = True
        elif "fox_scared" in fname or ("fox" in fname and "scared" in fname):
            target_name = "fox_scared.webp"
            is_sprite = True
        elif "fox_surprised" in fname or ("fox" in fname and "surprised" in fname):
            target_name = "fox_surprised.webp"
            is_sprite = True
        elif "fox_calm" in fname or ("fox" in fname and "calm" in fname):
            target_name = "fox_calm.webp"
            is_sprite = True
        elif "vessel_veranda" in fname or ("vessel" in fname and "veranda" in fname):
            target_name = "vessel_veranda.webp"
            is_sprite = True
        elif "vessel_lotus" in fname or ("vessel" in fname and "lotus" in fname):
            target_name = "vessel_lotus.webp"
            is_sprite = True
        elif "vessel_emerald" in fname or ("vessel" in fname and "emerald" in fname):
            target_name = "vessel_emerald.webp"
            is_sprite = True
        elif "share" in fname:
            target_name = "share.webp"
        elif "icon" in fname:
            target_name = "icon.webp"
            
        if target_name:
            out_path = os.path.join(dest, target_name)
            if is_sprite:
                im_rgba = make_transparent(im, tolerance=35)
                im_rgba.thumbnail((512, 512), Image.Resampling.LANCZOS)
                im_rgba.save(out_path, "WEBP", quality=90)
            else:
                if target_name == "icon.webp":
                    im.thumbnail((256, 256), Image.Resampling.LANCZOS)
                elif target_name == "share.webp":
                    im.thumbnail((1200, 630), Image.Resampling.LANCZOS)
                else:
                    im.thumbnail((1280, 720), Image.Resampling.LANCZOS)
                im.save(out_path, "WEBP", quality=82)
            print(f"Saved Autism asset: {out_path} ({im.size})")

def package_dyslexia(images):
    dest = os.path.join(DEST_ROOT, "dyslexia")
    os.makedirs(dest, exist_ok=True)
    print(f"Dyslexia images found: {len(images)}")
    for img_path in images:
        fname = os.path.basename(img_path).lower()
        im = Image.open(img_path)
        
        target_name = None
        is_sprite = False
        if "welcome" in fname:
            target_name = "welcome.webp"
        elif "bg_echo" in fname:
            target_name = "bg_echo.webp"
        elif "bg_letters" in fname:
            target_name = "bg_letters.webp"
        elif "bg_span" in fname:
            target_name = "bg_span.webp"
        elif "bg_words" in fname:
            target_name = "bg_words.webp"
        elif "celebration" in fname:
            target_name = "celebration.webp"
        elif "pip_greeting" in fname or ("pip" in fname and "greeting" in fname):
            target_name = "pip_greeting.webp"
            is_sprite = True
        elif "pip_listening" in fname or ("pip" in fname and "listening" in fname):
            target_name = "pip_listening.webp"
            is_sprite = True
        elif "pip_cheering" in fname or ("pip" in fname and "cheering" in fname):
            target_name = "pip_cheering.webp"
            is_sprite = True
        elif "pip_resting" in fname or ("pip" in fname and "resting" in fname):
            target_name = "pip_resting.webp"
            is_sprite = True
        elif "share" in fname:
            target_name = "share.webp"
        elif "icon" in fname:
            target_name = "icon.webp"
            
        if target_name:
            out_path = os.path.join(dest, target_name)
            if is_sprite:
                im_rgba = make_transparent(im, tolerance=35)
                im_rgba.thumbnail((512, 512), Image.Resampling.LANCZOS)
                im_rgba.save(out_path, "WEBP", quality=90)
            else:
                if target_name == "icon.webp":
                    im.thumbnail((256, 256), Image.Resampling.LANCZOS)
                elif target_name == "share.webp":
                    im.thumbnail((1200, 630), Image.Resampling.LANCZOS)
                else:
                    im.thumbnail((1280, 720), Image.Resampling.LANCZOS)
                im.save(out_path, "WEBP", quality=82)
            print(f"Saved Dyslexia asset: {out_path} ({im.size})")

def main():
    adhd_imgs = extract_subagent_images("b22e7e08-6d1c-484c-aba4-32139cd61488")
    package_adhd(adhd_imgs)
    
    autism_imgs = extract_subagent_images("ebb22851-ca60-4991-b79d-cf927c4de520")
    package_autism(autism_imgs)
    
    dys_imgs = extract_subagent_images("fd8d419d-b455-427e-9ee5-afce14ba6d90")
    package_dyslexia(dys_imgs)

if __name__ == "__main__":
    main()

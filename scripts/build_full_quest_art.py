import os
import glob
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage

ARTIFACTS_DIR = "/Users/ananyasridhar/.gemini/antigravity/brain/08217f75-b151-4457-9d59-806b38e64437"
DEST_ROOT = "/Users/ananyasridhar/work/vaakbot/web/public/quests"

def convert_bg(src_path, dest_path, size=(1280, 720), quality=82):
    im = Image.open(src_path)
    im = ImageOps.fit(im, size, Image.Resampling.LANCZOS)
    im.save(dest_path, "WEBP", quality=quality)
    print(f"Saved background: {dest_path} {size}")

def extract_transparent_sprite(img_path, out_path, bg_thresh=242, edge_radius=1.5, target_box=(440, 440)):
    im = Image.open(img_path).convert("RGB")
    arr = np.array(im, dtype=np.float32)
    max_val = np.max(arr, axis=2)
    min_val = np.min(arr, axis=2)
    diff = max_val - min_val
    is_white = (min_val >= bg_thresh) & (diff < 15)

    h, w = is_white.shape
    border_mask = np.zeros((h, w), dtype=bool)
    border_mask[0, :] = True
    border_mask[-1, :] = True
    border_mask[:, 0] = True
    border_mask[:, -1] = True

    labeled, num_features = ndimage.label(is_white)
    border_labels = np.unique(labeled[border_mask])
    border_labels = border_labels[border_labels > 0]
    bg_mask = np.isin(labeled, border_labels)
    fg_mask = ~bg_mask
    fg_mask = ndimage.binary_fill_holes(fg_mask)

    dist_inside = ndimage.distance_transform_edt(fg_mask)
    dist_outside = ndimage.distance_transform_edt(~fg_mask)
    signed_dist = dist_inside - dist_outside
    alpha = np.clip((signed_dist + edge_radius) / (2.0 * edge_radius), 0.0, 1.0)

    fg_rgb = arr.copy()
    edge_zone = (alpha > 0.05) & (alpha < 0.98)
    for c in range(3):
        channel = fg_rgb[:, :, c]
        unmixed = (channel[edge_zone] - (1.0 - alpha[edge_zone]) * 255.0) / np.maximum(alpha[edge_zone], 0.1)
        fg_rgb[edge_zone, c] = np.clip(unmixed, 0, 255)

    out_arr = np.dstack([fg_rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])
    out_im = Image.fromarray(out_arr, mode="RGBA")
    bbox = out_im.getbbox()
    cropped = out_im.crop(bbox)

    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    cropped.thumbnail(target_box, Image.Resampling.LANCZOS)
    offset = ((512 - cropped.width) // 2, (512 - cropped.height) // 2)
    canvas.paste(cropped, offset, cropped)
    canvas.save(out_path, "WEBP", quality=95)
    print(f"Extracted transparent sprite: {out_path}")

def create_adhd_art():
    dest = os.path.join(DEST_ROOT, "adhd")
    os.makedirs(dest, exist_ok=True)
    
    # 1. Backgrounds from subagent
    convert_bg(f"{ARTIFACTS_DIR}/welcome_1794023332538.jpg", f"{dest}/welcome.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_sunbird_1794023353650.jpg", f"{dest}/bg_sunbird.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_flanker_1794023372731.jpg", f"{dest}/bg_flanker.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_memory_1794023390769.jpg", f"{dest}/bg_memory.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_charge_1794023410059.jpg", f"{dest}/bg_charge.webp")
    # Celebration
    convert_bg(f"{ARTIFACTS_DIR}/floating_sky_citadel_of_aethelgard_1793781118865.jpg", f"{dest}/celebration.webp")
    convert_bg(f"{ARTIFACTS_DIR}/welcome_1794023332538.jpg", f"{dest}/share.webp", size=(1200, 630))
    convert_bg(f"{ARTIFACTS_DIR}/welcome_1794023332538.jpg", f"{dest}/icon.webp", size=(256, 256))
    
    # 2. Golden Sunbird Target Sprite (Storybook watercolor)
    extract_transparent_sprite(
        f"{ARTIFACTS_DIR}/golden_sunbird_sprite_1794123158418.jpg",
        f"{dest}/sunbird.webp"
    )
    
    # 3. Shadow Moth Distractor (Storybook watercolor)
    extract_transparent_sprite(
        f"{ARTIFACTS_DIR}/shadow_moth_sprite_1794123208163.jpg",
        f"{dest}/shadow_moth.webp"
    )
    
    # 4. Guide Chirp (Storybook watercolor companion)
    extract_transparent_sprite(
        f"{ARTIFACTS_DIR}/guide_chirp_sprite_1794123240570.jpg",
        f"{dest}/guide_chirp.webp"
    )
    print("ADHD art generated successfully.")

def create_autism_art():
    dest = os.path.join(DEST_ROOT, "autism")
    os.makedirs(dest, exist_ok=True)
    
    # 1. Backgrounds from subagent
    convert_bg(f"{ARTIFACTS_DIR}/welcome_1794023352064.jpg", f"{dest}/welcome.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_gaze_1794023365015.jpg", f"{dest}/bg_gaze.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_feelings_1794023376795.jpg", f"{dest}/bg_feelings.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_sanctuary_1794023387915.jpg", f"{dest}/bg_sanctuary.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_feelings_1794023376795.jpg", f"{dest}/bg_sorting.webp")
    convert_bg(f"{ARTIFACTS_DIR}/whispering_groves_of_lumina_1793781131809.jpg", f"{dest}/celebration.webp")
    convert_bg(f"{ARTIFACTS_DIR}/welcome_1794023352064.jpg", f"{dest}/share.webp", size=(1200, 630))
    convert_bg(f"{ARTIFACTS_DIR}/welcome_1794023352064.jpg", f"{dest}/icon.webp", size=(256, 256))
    
    # 2. Aria Poses (Center, Left, Right)
    for gaze in ["center", "left", "right"]:
        im = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        # Soft sage background circle aura
        d.ellipse([70, 70, 442, 442], fill=(204, 251, 241, 160))
        # Torso (teal tunic with gold embroidery)
        d.polygon([(160, 480), (190, 340), (322, 340), (352, 480)], fill=(15, 118, 110, 255), outline=(251, 191, 36, 255), width=5)
        d.polygon([(236, 350), (276, 350), (256, 410)], fill=(245, 158, 11, 255))
        # Arm & pointing gesture
        if gaze == "left":
            d.line([(200, 360), (90, 310), (50, 300)], fill=(234, 179, 8, 255), width=18)
            d.ellipse([40, 290, 65, 315], fill=(245, 158, 11, 255)) # hand
        elif gaze == "right":
            d.line([(312, 360), (422, 310), (462, 300)], fill=(234, 179, 8, 255), width=18)
            d.ellipse([447, 290, 472, 315], fill=(245, 158, 11, 255))
        else:
            d.line([(200, 360), (230, 430)], fill=(234, 179, 8, 255), width=16)
            d.line([(312, 360), (282, 430)], fill=(234, 179, 8, 255), width=16)
        # Head and neck
        d.rectangle([236, 290, 276, 340], fill=(232, 185, 143, 255))
        d.ellipse([186, 170, 326, 310], fill=(237, 196, 160, 255), outline=(180, 83, 9, 200), width=4)
        # Hair (dark braided bun)
        d.chord([180, 160, 332, 260], start=180, end=360, fill=(59, 42, 32, 255))
        d.ellipse([216, 120, 296, 180], fill=(59, 42, 32, 255))
        # Eyes with unmistakable gaze direction
        eye_y = 230
        dx = -12 if gaze == "left" else 12 if gaze == "right" else 0
        # Left eye socket & eyeball
        d.ellipse([210, eye_y - 12, 246, eye_y + 12], fill=(255, 255, 255, 255), outline=(59, 42, 32, 255), width=2)
        d.ellipse([222 + dx, eye_y - 8, 236 + dx, eye_y + 8], fill=(43, 29, 5, 255))
        d.ellipse([226 + dx, eye_y - 6, 231 + dx, eye_y - 2], fill=(255, 255, 255, 255))
        # Right eye socket & eyeball
        d.ellipse([266, eye_y - 12, 302, eye_y + 12], fill=(255, 255, 255, 255), outline=(59, 42, 32, 255), width=2)
        d.ellipse([278 + dx, eye_y - 8, 292 + dx, eye_y + 8], fill=(43, 29, 5, 255))
        d.ellipse([282 + dx, eye_y - 6, 287 + dx, eye_y - 2], fill=(255, 255, 255, 255))
        # Eyebrows
        d.arc([208, eye_y - 24, 248, eye_y - 10], start=200, end=340, fill=(59, 42, 32, 255), width=3)
        d.arc([264, eye_y - 24, 304, eye_y - 10], start=200, end=340, fill=(59, 42, 32, 255), width=3)
        # Warm smile
        d.arc([236, 260, 276, 285], start=20, end=160, fill=(138, 75, 58, 255), width=3)
        im.save(f"{dest}/aria_gaze_{gaze}.webp", "WEBP", quality=90)
    
    # 3. Fox Cub Feeling Sprites & 4. Three Artisan Vessels
    # Generated with rigorous psychometric calibration via generate_fixed_autism_art.py
    from generate_fixed_autism_art import generate_fox_faces, generate_vessels
    for emo, im in generate_fox_faces().items():
        im.save(f"{dest}/fox_{emo}.webp", "WEBP", quality=95)
    for name, im in generate_vessels().items():
        im.save(f"{dest}/vessel_{name}.webp", "WEBP", quality=95)
    print("Autism art (fox faces + vessels) generated successfully.")

def create_dyslexia_art():
    dest = os.path.join(DEST_ROOT, "dyslexia")
    os.makedirs(dest, exist_ok=True)
    
    # 1. Backgrounds from subagent
    convert_bg(f"{ARTIFACTS_DIR}/welcome_1794023361221.jpg", f"{dest}/welcome.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_echo_1794023371738.jpg", f"{dest}/bg_echo.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_letters_1794023383326.jpg", f"{dest}/bg_letters.webp")
    convert_bg(f"{ARTIFACTS_DIR}/bg_span_1794023394776.jpg", f"{dest}/bg_span.webp")
    # For words and celebration:
    convert_bg(f"{ARTIFACTS_DIR}/bg_letters_1794023383326.jpg", f"{dest}/bg_words.webp")
    convert_bg(f"{ARTIFACTS_DIR}/whispering_groves_of_lumina_1793781131809.jpg", f"{dest}/celebration.webp")
    convert_bg(f"{ARTIFACTS_DIR}/welcome_1794023361221.jpg", f"{dest}/share.webp", size=(1200, 630))
    convert_bg(f"{ARTIFACTS_DIR}/welcome_1794023361221.jpg", f"{dest}/icon.webp", size=(256, 256))
    
    # 2. Pip the Owl (4 poses, 512x512 transparent)
    poses = ["greeting", "listening", "cheering", "resting"]
    for pose in poses:
        im = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        # Background soft book halo
        d.ellipse([70, 70, 442, 442], fill=(240, 253, 250, 180), outline=(13, 148, 136, 200), width=6)
        # Owl body (warm speckled amber & caramel feathers)
        d.ellipse([160, 180, 352, 410], fill=(180, 83, 9, 255), outline=(254, 243, 199, 255), width=6)
        # Cream feathered belly with chevron marks
        d.ellipse([190, 230, 322, 390], fill=(255, 251, 235, 255))
        for y_ch in [260, 290, 320, 350]:
            d.line([(240, y_ch), (256, y_ch + 8), (272, y_ch)], fill=(180, 83, 9, 200), width=3)
        # Owl Head
        tilt = -8 if pose == "listening" else 0
        d.ellipse([170, 110, 342, 260], fill=(180, 83, 9, 255), outline=(254, 243, 199, 255), width=5)
        # Ear tufts
        tuft_h = 40 if pose == "listening" else 25
        d.polygon([(190, 130), (170, 130 - tuft_h), (220, 120)], fill=(146, 64, 14, 255))
        d.polygon([(322, 130), (342, 130 - tuft_h), (292, 120)], fill=(146, 64, 14, 255))
        # Facial disk (two white circular masks)
        d.ellipse([190, 140, 256, 210], fill=(255, 255, 255, 255), outline=(217, 119, 6, 255), width=3)
        d.ellipse([256, 140, 322, 210], fill=(255, 255, 255, 255), outline=(217, 119, 6, 255), width=3)
        # Spectacles (golden round spectacles)
        d.ellipse([196, 146, 250, 204], outline=(245, 158, 11, 255), width=4)
        d.ellipse([262, 146, 316, 204], outline=(245, 158, 11, 255), width=4)
        d.line([(250, 175), (262, 175)], fill=(245, 158, 11, 255), width=4)
        # Eyes
        if pose == "resting":
            d.arc([205, 170, 241, 195], start=20, end=160, fill=(30, 41, 59, 255), width=4)
            d.arc([271, 170, 307, 195], start=20, end=160, fill=(30, 41, 59, 255), width=4)
        else:
            d.ellipse([211, 163, 235, 187], fill=(30, 41, 59, 255))
            d.ellipse([223, 167, 229, 173], fill=(255, 255, 255, 255))
            d.ellipse([277, 163, 301, 187], fill=(30, 41, 59, 255))
            d.ellipse([289, 167, 295, 173], fill=(255, 255, 255, 255))
        # Beak
        d.polygon([(250, 190), (262, 190), (256, 210)], fill=(245, 158, 11, 255))
        # Wings & poses
        if pose == "greeting":
            # Right wing waving high
            d.polygon([(330, 230), (420, 150), (410, 240)], fill=(146, 64, 14, 255), outline=(254, 243, 199, 255), width=4)
            d.polygon([(182, 230), (140, 330), (192, 330)], fill=(146, 64, 14, 255))
        elif pose == "cheering":
            # Both wings raised high in joy
            d.polygon([(182, 230), (90, 140), (160, 210)], fill=(146, 64, 14, 255), outline=(254, 243, 199, 255), width=4)
            d.polygon([(330, 230), (422, 140), (352, 210)], fill=(146, 64, 14, 255), outline=(254, 243, 199, 255), width=4)
        else:
            # Resting / folded wings
            d.polygon([(182, 220), (130, 320), (182, 330)], fill=(146, 64, 14, 255), outline=(254, 243, 199, 255), width=4)
            d.polygon([(330, 220), (382, 320), (330, 330)], fill=(146, 64, 14, 255), outline=(254, 243, 199, 255), width=4)
            
        im.save(f"{dest}/pip_{pose}.webp", "WEBP", quality=90)
    print("Dyslexia art generated successfully.")

def main():
    create_adhd_art()
    create_autism_art()
    create_dyslexia_art()

if __name__ == "__main__":
    main()

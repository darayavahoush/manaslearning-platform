import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from collections import deque

ARTIFACTS_DIR = "/Users/ananyasridhar/.gemini/antigravity/brain/08217f75-b151-4457-9d59-806b38e64437"
DEST_DIR = "/Users/ananyasridhar/work/vaakbot/web/public/quests/autism"
os.makedirs(DEST_DIR, exist_ok=True)

def flood_remove_bg(img: Image.Image, tol=242, smooth_radius=1.2) -> Image.Image:
    """Flood-fills from edges to make background transparent without punching holes in interior highlights."""
    img = img.convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    
    # Check background candidate pixels (high brightness and low saturation)
    r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
    brightness = (r + g + b) // 3
    sat = np.maximum.reduce([r, g, b]) - np.minimum.reduce([r, g, b])
    
    # Candidate bg: bright and neutral (not saturated colored paint)
    is_bg = (brightness >= tol) & (sat < 22)
    
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    
    # Seed all border pixels
    for x in range(w):
        if is_bg[0, x]: q.append((0, x)); visited[0, x] = True
        if is_bg[h - 1, x]: q.append((h - 1, x)); visited[h - 1, x] = True
    for y in range(h):
        if is_bg[y, 0]: q.append((y, 0)); visited[y, 0] = True
        if is_bg[y, w - 1]: q.append((y, w - 1)); visited[y, w - 1] = True
        
    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
                
    # Soft alpha feathering on the mask
    mask = np.ones((h, w), dtype=np.uint8) * 255
    mask[visited] = 0
    
    # Smooth edges slightly to avoid harsh pixel stepping
    mask_im = Image.fromarray(mask, "L").filter(ImageFilter.GaussianBlur(smooth_radius))
    
    img.putalpha(mask_im)
    return img

def center_and_fit(img: Image.Image, target_size=(512, 512), padding_ratio=0.86) -> Image.Image:
    """Crops transparent borders and centers object in target canvas."""
    bbox = img.getbbox()
    if bbox:
        cropped = img.crop(bbox)
    else:
        cropped = img
        
    w, h = cropped.size
    max_w = int(target_size[0] * padding_ratio)
    max_h = int(target_size[1] * padding_ratio)
    
    scale = min(max_w / w, max_h / h)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
    offset_x = (target_size[0] - new_w) // 2
    offset_y = (target_size[1] - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)
    return canvas

def process_aria():
    print("Processing Aria character poses...")
    files = {
        "aria_gaze_center.webp": f"{ARTIFACTS_DIR}/aria_gaze_center_1794103719700.jpg",
        "aria_gaze_left.webp": f"{ARTIFACTS_DIR}/aria_gaze_left_1794103778715.jpg",
        "aria_gaze_right.webp": f"{ARTIFACTS_DIR}/aria_gaze_right_1794103802564.jpg",
    }
    for dest_name, src_path in files.items():
        im = Image.open(src_path)
        trans = flood_remove_bg(im, tol=240, smooth_radius=1.5)
        final = center_and_fit(trans, target_size=(512, 512), padding_ratio=0.92)
        out_path = os.path.join(DEST_DIR, dest_name)
        final.save(out_path, "WEBP", quality=92)
        print(f"Saved {out_path}")

def process_vessels():
    print("Processing Ceramic Vessels...")
    files = {
        "vessel_veranda.webp": f"{ARTIFACTS_DIR}/vessel_veranda_1794103757847.jpg",
        "vessel_lotus.webp": f"{ARTIFACTS_DIR}/vessel_lotus_1794103775895.jpg",
        "vessel_emerald.webp": f"{ARTIFACTS_DIR}/vessel_emerald_1794103794111.jpg",
    }
    for dest_name, src_path in files.items():
        im = Image.open(src_path)
        trans = flood_remove_bg(im, tol=242, smooth_radius=1.2)
        final = center_and_fit(trans, target_size=(512, 512), padding_ratio=0.86)
        out_path = os.path.join(DEST_DIR, dest_name)
        final.save(out_path, "WEBP", quality=92)
        print(f"Saved {out_path}")

def process_fox():
    print("Processing Fox Cub faces...")
    fox_happy = flood_remove_bg(Image.open(f"{ARTIFACTS_DIR}/fox_happy_1794103745027.jpg"), tol=242)
    fox_calm = flood_remove_bg(Image.open(f"{ARTIFACTS_DIR}/fox_calm_1794103768965.jpg"), tol=242)
    fox_sad = flood_remove_bg(Image.open(f"{ARTIFACTS_DIR}/fox_sad_1794103790391.jpg"), tol=242)
    
    fit_happy = center_and_fit(fox_happy, (512, 512), 0.88)
    fit_calm = center_and_fit(fox_calm, (512, 512), 0.88)
    fit_sad = center_and_fit(fox_sad, (512, 512), 0.88)
    
    fit_happy.save(f"{DEST_DIR}/fox_happy.webp", "WEBP", quality=92)
    fit_calm.save(f"{DEST_DIR}/fox_calm.webp", "WEBP", quality=92)
    fit_sad.save(f"{DEST_DIR}/fox_sad.webp", "WEBP", quality=92)
    
    # Synthesize Angry, Scared, Surprised using calm base with matching watercolor palette
    # Fox Angry:
    im_angry = fit_calm.copy()
    d_ang = ImageDraw.Draw(im_angry)
    # Brows: sharp V
    d_ang.polygon([(160, 205), (250, 245), (245, 258), (155, 218)], fill=(85, 38, 14, 255))
    d_ang.polygon([(352, 205), (262, 245), (267, 258), (357, 218)], fill=(85, 38, 14, 255))
    # Eyes: narrowed fierce
    d_ang.chord([180, 230, 240, 275], 180, 360, fill=(45, 20, 10, 255), outline=(70, 30, 12, 255), width=3)
    d_ang.chord([272, 230, 332, 275], 180, 360, fill=(45, 20, 10, 255), outline=(70, 30, 12, 255), width=3)
    d_ang.ellipse([200, 238, 220, 258], fill=(255, 255, 255, 255))
    d_ang.ellipse([292, 238, 312, 258], fill=(255, 255, 255, 255))
    # Tight downturned mouth
    d_ang.arc([205, 305, 307, 345], 195, 345, fill=(60, 25, 10, 255), width=6)
    im_angry.save(f"{DEST_DIR}/fox_angry.webp", "WEBP", quality=92)
    
    # Fox Scared:
    im_scared = fit_calm.copy()
    d_sc = ImageDraw.Draw(im_scared)
    d_sc.line([(180, 195), (245, 215)], fill=(85, 38, 14, 255), width=7)
    d_sc.line([(332, 195), (267, 215)], fill=(85, 38, 14, 255), width=7)
    d_sc.ellipse([180, 220, 240, 280], fill=(255, 255, 255, 255), outline=(60, 25, 10, 255), width=4)
    d_sc.ellipse([272, 220, 332, 280], fill=(255, 255, 255, 255), outline=(60, 25, 10, 255), width=4)
    d_sc.ellipse([202, 242, 218, 258], fill=(40, 18, 8, 255))
    d_sc.ellipse([294, 242, 310, 258], fill=(40, 18, 8, 255))
    d_sc.rounded_rectangle([215, 308, 297, 328], radius=6, fill=(160, 60, 50, 255), outline=(60, 25, 10, 255), width=4)
    d_sc.ellipse([345, 260, 360, 282], fill=(147, 197, 253, 230), outline=(59, 130, 246, 240), width=2)
    im_scared.save(f"{DEST_DIR}/fox_scared.webp", "WEBP", quality=92)
    
    # Fox Surprised:
    im_surp = fit_calm.copy()
    d_su = ImageDraw.Draw(im_surp)
    d_su.arc([175, 175, 240, 220], 190, 350, fill=(85, 38, 14, 255), width=7)
    d_su.arc([272, 175, 337, 220], 190, 350, fill=(85, 38, 14, 255), width=7)
    d_su.ellipse([180, 220, 242, 282], fill=(255, 255, 255, 255), outline=(60, 25, 10, 255), width=4)
    d_su.ellipse([270, 220, 332, 282], fill=(255, 255, 255, 255), outline=(60, 25, 10, 255), width=4)
    d_su.ellipse([200, 238, 224, 264], fill=(40, 18, 8, 255))
    d_su.ellipse([290, 238, 314, 264], fill=(40, 18, 8, 255))
    d_su.ellipse([236, 295, 276, 338], fill=(160, 50, 40, 255), outline=(60, 25, 10, 255), width=5)
    im_surp.save(f"{DEST_DIR}/fox_surprised.webp", "WEBP", quality=92)
    print("Saved all 6 fox emotion faces!")

def process_choice_sprites():
    print("Processing Choice Sprites...")
    # Use tol=210 to flow past the card frame up to the porcelain sprite contour
    choice_happy = flood_remove_bg(Image.open(f"{ARTIFACTS_DIR}/choice_happy_1794103747010.jpg"), tol=210)
    choice_calm = flood_remove_bg(Image.open(f"{ARTIFACTS_DIR}/choice_calm_1794103769794.jpg"), tol=210)
    choice_sad = flood_remove_bg(Image.open(f"{ARTIFACTS_DIR}/choice_sad_1794103792373.jpg"), tol=210)
    
    fit_happy = center_and_fit(choice_happy, (512, 512), 0.88)
    fit_calm = center_and_fit(choice_calm, (512, 512), 0.88)
    fit_sad = center_and_fit(choice_sad, (512, 512), 0.88)
    
    fit_happy.save(f"{DEST_DIR}/choice_happy.webp", "WEBP", quality=92)
    fit_calm.save(f"{DEST_DIR}/choice_calm.webp", "WEBP", quality=92)
    fit_sad.save(f"{DEST_DIR}/choice_sad.webp", "WEBP", quality=92)
    
    # Synthesize Angry, Scared, Surprised from fit_calm porcelain sprite base
    base = fit_calm.copy()
    
    # Choice Angry
    c_ang = base.copy()
    d_ca = ImageDraw.Draw(c_ang)
    d_ca.ellipse([160, 250, 352, 335], fill=(252, 246, 238, 255))
    d_ca.line([(185, 250), (245, 280)], fill=(110, 60, 32, 255), width=6)
    d_ca.line([(327, 250), (267, 280)], fill=(110, 60, 32, 255), width=6)
    d_ca.ellipse([195, 275, 235, 305], fill=(60, 30, 15, 255))
    d_ca.ellipse([277, 275, 317, 305], fill=(60, 30, 15, 255))
    d_ca.line([(225, 335), (287, 335)], fill=(110, 60, 32, 255), width=5)
    c_ang.save(f"{DEST_DIR}/choice_angry.webp", "WEBP", quality=92)
    
    # Choice Scared
    c_sc = base.copy()
    d_cs = ImageDraw.Draw(c_sc)
    d_cs.ellipse([160, 250, 352, 345], fill=(252, 246, 238, 255))
    d_cs.line([(190, 250), (245, 265)], fill=(110, 60, 32, 255), width=5)
    d_cs.line([(322, 250), (267, 265)], fill=(110, 60, 32, 255), width=5)
    d_cs.ellipse([195, 265, 235, 305], fill=(60, 30, 15, 255))
    d_cs.ellipse([277, 265, 317, 305], fill=(60, 30, 15, 255))
    d_cs.rounded_rectangle([220, 325, 292, 345], radius=6, fill=(244, 180, 170, 255), outline=(110, 60, 32, 255), width=4)
    d_cs.ellipse([335, 280, 348, 300], fill=(147, 197, 253, 230), outline=(59, 130, 246, 240), width=2)
    c_sc.save(f"{DEST_DIR}/choice_scared.webp", "WEBP", quality=92)
    
    # Choice Surprised
    c_su = base.copy()
    d_csu = ImageDraw.Draw(c_su)
    d_csu.ellipse([160, 240, 352, 350], fill=(252, 246, 238, 255))
    d_csu.arc([190, 225, 238, 255], 190, 350, fill=(110, 60, 32, 255), width=5)
    d_csu.arc([274, 225, 322, 255], 190, 350, fill=(110, 60, 32, 255), width=5)
    d_csu.ellipse([195, 265, 235, 305], fill=(60, 30, 15, 255))
    d_csu.ellipse([277, 265, 317, 305], fill=(60, 30, 15, 255))
    d_csu.ellipse([242, 318, 270, 350], fill=(160, 60, 50, 255), outline=(110, 60, 32, 255), width=4)
    c_su.save(f"{DEST_DIR}/choice_surprised.webp", "WEBP", quality=92)
    print("Saved all 6 choice sprites!")

if __name__ == "__main__":
    process_aria()
    process_vessels()
    process_fox()
    process_choice_sprites()

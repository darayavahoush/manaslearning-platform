import os
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SCRATCH_DIR = "/Users/ananyasridhar/work/vaakbot/scripts/scratch_autism"

def make_contact_sheet_foxes():
    emotions = ["happy", "calm", "sad", "angry", "scared", "surprised"]
    sizes = [512, 120, 80]
    
    # We will make two sheets: light bg (#FDFBF7) and dark bg (#0F172A)
    for bg_name, bg_color in [("light", (253, 251, 247)), ("dark", (15, 23, 42))]:
        # Layout: 6 columns (emotions), 3 rows (sizes: 512, 120, 80)
        # Total width = 6 * 530 + 40 = 3220
        # Total height = 512 + 120 + 80 + header + padding = 860
        sheet_w = 6 * 540 + 60
        sheet_h = 512 + 120 + 80 + 180
        sheet = Image.new("RGB", (sheet_w, sheet_h), bg_color)
        d = ImageDraw.Draw(sheet)
        
        text_color = (30, 41, 59) if bg_name == "light" else (241, 245, 249)
        
        for col_idx, emo in enumerate(emotions):
            im_512 = Image.open(f"{SCRATCH_DIR}/fox_{emo}.webp")
            x_col = 30 + col_idx * 540
            
            # Header label
            d.text((x_col + 20, 20), f"{emo.upper()}", fill=text_color)
            
            # Row 1: 512px
            sheet.paste(im_512, (x_col + 10, 60), im_512)
            
            # Row 2: 120px
            im_120 = im_512.resize((120, 120), Image.Resampling.LANCZOS)
            sheet.paste(im_120, (x_col + 10, 600), im_120)
            d.text((x_col + 140, 650), "120px", fill=text_color)
            
            # Row 3: 80px
            im_80 = im_512.resize((80, 80), Image.Resampling.LANCZOS)
            sheet.paste(im_80, (x_col + 10, 740), im_80)
            d.text((x_col + 100, 770), "80px", fill=text_color)
            
        out_path = f"{SCRATCH_DIR}/contact_sheet_foxes_{bg_name}.png"
        sheet.save(out_path)
        print(f"Saved: {out_path}")

def make_contact_sheet_vessels():
    vessels = ["veranda", "lotus", "emerald"]
    sizes = [512, 120, 80]
    
    for bg_name, bg_color in [("light", (253, 251, 247)), ("dark", (15, 23, 42))]:
        sheet_w = 3 * 540 + 60
        sheet_h = 512 + 120 + 80 + 180
        sheet = Image.new("RGB", (sheet_w, sheet_h), bg_color)
        d = ImageDraw.Draw(sheet)
        text_color = (30, 41, 59) if bg_name == "light" else (241, 245, 249)
        
        for col_idx, name in enumerate(vessels):
            im_512 = Image.open(f"{SCRATCH_DIR}/vessel_{name}.webp")
            x_col = 30 + col_idx * 540
            d.text((x_col + 20, 20), f"{name.upper()} URN", fill=text_color)
            sheet.paste(im_512, (x_col + 10, 60), im_512)
            
            im_120 = im_512.resize((120, 120), Image.Resampling.LANCZOS)
            sheet.paste(im_120, (x_col + 10, 600), im_120)
            d.text((x_col + 140, 650), "120px", fill=text_color)
            
            im_80 = im_512.resize((80, 80), Image.Resampling.LANCZOS)
            sheet.paste(im_80, (x_col + 10, 740), im_80)
            d.text((x_col + 100, 770), "80px", fill=text_color)
            
        out_path = f"{SCRATCH_DIR}/contact_sheet_vessels_{bg_name}.png"
        sheet.save(out_path)
        print(f"Saved: {out_path}")

def make_blind_test_sheet():
    # Shuffle the six fox faces, save 80px icons labeled 1 to 6
    emotions = ["happy", "calm", "sad", "angry", "scared", "surprised"]
    seed = 42
    rng = random.Random(seed)
    shuffled = emotions.copy()
    rng.shuffle(shuffled)
    
    # Save key
    with open(f"{SCRATCH_DIR}/blind_test_key.txt", "w") as f:
        for idx, emo in enumerate(shuffled, 1):
            f.write(f"{idx}: {emo}\n")
            
    # Create 80px blind sheet
    sheet = Image.new("RGB", (6 * 120 + 40, 160), (250, 248, 244))
    d = ImageDraw.Draw(sheet)
    for idx, emo in enumerate(shuffled, 1):
        im = Image.open(f"{SCRATCH_DIR}/fox_{emo}.webp")
        im_80 = im.resize((80, 80), Image.Resampling.LANCZOS)
        x = 20 + (idx - 1) * 120
        sheet.paste(im_80, (x, 20), im_80)
        d.text((x + 35, 115), f"#{idx}", fill=(30, 41, 59))
        
    blind_path = f"{SCRATCH_DIR}/blind_test_80px.png"
    sheet.save(blind_path)
    print(f"Saved blind test sheet: {blind_path}")

if __name__ == "__main__":
    make_contact_sheet_foxes()
    make_contact_sheet_vessels()
    make_blind_test_sheet()

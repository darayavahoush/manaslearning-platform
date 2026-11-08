import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

DEST_DIR = "/Users/ananyasridhar/work/vaakbot/web/public/quests/autism"
SCRATCH_DIR = "/Users/ananyasridhar/work/vaakbot/scripts/scratch_autism"
os.makedirs(SCRATCH_DIR, exist_ok=True)
os.makedirs(DEST_DIR, exist_ok=True)

S = 2048  # Supersampling canvas size

# -------------------------------------------------------------
# 1. ARIA CHARACTER REDRAW (ROUNDED, PROPER HAND & POINTING)
# -------------------------------------------------------------
def generate_aria_sprites():
    # Aria: friendly botanical alchemist guide
    # Indian-inspired storybook character: warm skin tone, teal/sage tunic with gold embroidery,
    # dark braided hair bun, rounded shoulders, neck, draped sleeves, and a sculpted hand with fingers!
    poses = ["center", "left", "right"]
    results = {}
    
    # Palette
    SKIN_BASE = (240, 196, 160)
    SKIN_SHADOW = (214, 162, 122)
    SKIN_OUTLINE = (140, 88, 52)
    TUNIC_TEAL = (13, 118, 110)
    TUNIC_DARK = (15, 90, 85)
    TUNIC_LIGHT = (20, 150, 140)
    GOLD_TRIM = (234, 179, 8)
    HAIR_DARK = (38, 26, 18)
    EYE_DARK = (30, 20, 12)
    LIP_CORAL = (180, 78, 62)
    
    for pose in poses:
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        
        # Head center
        HCX = 1024 + (-50 if pose == "left" else 50 if pose == "right" else 0)
        HCY = 720
        
        # 1. Torso & Shoulders (Organic rounded shoulders, draped tunic)
        # Main torso body
        torso_poly = [
            (HCX - 180, 1020), # Left neck junction
            (HCX - 440, 1160), # Left shoulder
            (HCX - 400, 1750), # Left hip
            (HCX + 400, 1750), # Right hip
            (HCX + 440, 1160), # Right shoulder
            (HCX + 180, 1020), # Right neck junction
        ]
        # Smooth shoulders by drawing filled rounded shape
        d.polygon(torso_poly, fill=TUNIC_TEAL)
        # Rounded shoulder caps
        d.ellipse([HCX - 490, 1100, HCX - 350, 1240], fill=TUNIC_TEAL)
        d.ellipse([HCX + 350, 1100, HCX + 490, 1240], fill=TUNIC_TEAL)
        
        # Gold collar trim & embroidered sash
        d.polygon([(HCX - 150, 1020), (HCX + 150, 1020), (HCX, 1300)], fill=GOLD_TRIM)
        d.polygon([(HCX - 90, 1020), (HCX + 90, 1020), (HCX, 1220)], fill=TUNIC_DARK)
        
        # Outlines for torso
        d.line([(HCX - 440, 1160), (HCX - 180, 1020)], fill=TUNIC_DARK, width=24)
        d.line([(HCX + 440, 1160), (HCX + 180, 1020)], fill=TUNIC_DARK, width=24)
        d.line([(HCX - 400, 1750), (HCX - 440, 1160)], fill=TUNIC_DARK, width=24)
        d.line([(HCX + 400, 1750), (HCX + 440, 1160)], fill=TUNIC_DARK, width=24)
        
        # 2. Arms & Hands
        # Left pose: left arm extends out and points firmly to the left! Right arm rests at waist.
        # Right pose: right arm extends out and points firmly to the right! Left arm rests at waist.
        # Center pose: both arms rest gracefully in front.
        
        if pose == "left":
            # Right arm (resting on hip/waist)
            d.line([(HCX + 380, 1180), (HCX + 340, 1420), (HCX + 220, 1440)], fill=TUNIC_TEAL, width=130)
            d.ellipse([HCX + 180, 1400, HCX + 250, 1470], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=16) # hand
            
            # Left arm pointing: shoulder -> elbow -> forearm -> hand with pointing index finger!
            # Upper arm
            d.line([(HCX - 380, 1180), (HCX - 680, 1220)], fill=TUNIC_TEAL, width=140)
            d.ellipse([HCX - 740, 1160, HCX - 620, 1280], fill=TUNIC_TEAL) # elbow cuff
            # Forearm with draped sleeve cuff & gold band
            d.line([(HCX - 680, 1220), (HCX - 860, 1120)], fill=TUNIC_LIGHT, width=120)
            d.ellipse([HCX - 910, 1060, HCX - 830, 1180], fill=GOLD_TRIM) # sleeve gold cuff
            
            # Sculpted Hand with pointing finger!
            # Palm
            d.ellipse([HCX - 980, 1070, HCX - 860, 1170], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=16)
            # Curled fingers (knuckles)
            d.ellipse([HCX - 950, 1110, HCX - 890, 1170], fill=SKIN_SHADOW, outline=SKIN_OUTLINE, width=12)
            d.ellipse([HCX - 970, 1090, HCX - 910, 1150], fill=SKIN_SHADOW, outline=SKIN_OUTLINE, width=12)
            # Pointing index finger (extended clearly to the left!)
            d.polygon([(HCX - 950, 1075), (HCX - 1140, 1060), (HCX - 1140, 1100), (HCX - 950, 1115)], fill=SKIN_BASE)
            d.ellipse([HCX - 1160, 1055, HCX - 1120, 1105], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=16) # fingertip
            d.line([(HCX - 950, 1075), (HCX - 1140, 1060)], fill=SKIN_OUTLINE, width=16)
            d.line([(HCX - 950, 1115), (HCX - 1140, 1100)], fill=SKIN_OUTLINE, width=16)
            # Thumb
            d.ellipse([HCX - 930, 1045, HCX - 870, 1095], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=14)
            
        elif pose == "right":
            # Left arm (resting on hip/waist)
            d.line([(HCX - 380, 1180), (HCX - 340, 1420), (HCX - 220, 1440)], fill=TUNIC_TEAL, width=130)
            d.ellipse([HCX - 250, 1400, HCX - 180, 1470], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=16) # hand
            
            # Right arm pointing: shoulder -> elbow -> forearm -> hand with pointing index finger!
            # Upper arm
            d.line([(HCX + 380, 1180), (HCX + 680, 1220)], fill=TUNIC_TEAL, width=140)
            d.ellipse([HCX + 620, 1160, HCX + 740, 1280], fill=TUNIC_TEAL) # elbow cuff
            # Forearm with draped sleeve cuff & gold band
            d.line([(HCX + 680, 1220), (HCX + 860, 1120)], fill=TUNIC_LIGHT, width=120)
            d.ellipse([HCX + 830, 1060, HCX + 910, 1180], fill=GOLD_TRIM) # sleeve gold cuff
            
            # Sculpted Hand with pointing finger!
            # Palm
            d.ellipse([HCX + 860, 1070, HCX + 980, 1170], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=16)
            # Curled fingers
            d.ellipse([HCX + 890, 1110, HCX + 950, 1170], fill=SKIN_SHADOW, outline=SKIN_OUTLINE, width=12)
            d.ellipse([HCX + 910, 1090, HCX + 970, 1150], fill=SKIN_SHADOW, outline=SKIN_OUTLINE, width=12)
            # Pointing index finger (extended clearly to the right!)
            d.polygon([(HCX + 950, 1075), (HCX + 1140, 1060), (HCX + 1140, 1100), (HCX + 950, 1115)], fill=SKIN_BASE)
            d.ellipse([HCX + 1120, 1055, HCX + 1160, 1105], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=16) # fingertip
            d.line([(HCX + 950, 1075), (HCX + 1140, 1060)], fill=SKIN_OUTLINE, width=16)
            d.line([(HCX + 950, 1115), (HCX + 1140, 1100)], fill=SKIN_OUTLINE, width=16)
            # Thumb
            d.ellipse([HCX + 870, 1045, HCX + 930, 1095], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=14)
            
        else: # center pose
            # Both arms resting comfortably in front with hands together
            d.line([(HCX - 380, 1180), (HCX - 180, 1420), (HCX - 40, 1440)], fill=TUNIC_TEAL, width=130)
            d.line([(HCX + 380, 1180), (HCX + 180, 1420), (HCX + 40, 1440)], fill=TUNIC_TEAL, width=130)
            # Hands joined at center waist
            d.ellipse([HCX - 80, 1400, HCX + 80, 1480], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=16)
            
        # 3. Neck
        d.polygon([(HCX - 70, 940), (HCX + 70, 940), (HCX + 85, 1040), (HCX - 85, 1040)], fill=SKIN_SHADOW)
        d.polygon([(HCX - 60, 940), (HCX + 60, 940), (HCX + 75, 1020), (HCX - 75, 1020)], fill=SKIN_BASE)
        
        # 4. Hair Bun & Back Hair
        d.ellipse([HCX - 200, 360, HCX + 200, 720], fill=HAIR_DARK) # top knot bun
        d.ellipse([HCX - 240, 520, HCX + 240, 1000], fill=HAIR_DARK) # back hair
        
        # 5. Face & Ears
        # Face oval
        d.ellipse([HCX - 210, 560, HCX + 210, 980], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=20)
        # Ears with gold jhumka/stud
        d.ellipse([HCX - 235, 720, HCX - 195, 800], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=14)
        d.ellipse([HCX - 225, 780, HCX - 205, 800], fill=GOLD_TRIM)
        d.ellipse([HCX + 195, 720, HCX + 235, 800], fill=SKIN_BASE, outline=SKIN_OUTLINE, width=14)
        d.ellipse([HCX + 205, 780, HCX + 225, 800], fill=GOLD_TRIM)
        
        # Front hair fringe / parting
        d.chord([HCX - 210, 540, HCX + 210, 780], start=180, end=360, fill=HAIR_DARK)
        d.arc([HCX - 210, 560, HCX + 20, 780], start=210, end=330, fill=HAIR_DARK, width=60)
        d.arc([HCX - 20, 560, HCX + 210, 780], start=210, end=330, fill=HAIR_DARK, width=60)
        
        # 6. Facial Features (Eyes, Brows, Nose, Smile)
        # Eye horizontal offset for gaze cue:
        dx = -38 if pose == "left" else 38 if pose == "right" else 0
        
        # Left eye socket
        d.ellipse([HCX - 140, 730, HCX - 30, 810], fill=(255, 255, 255), outline=SKIN_OUTLINE, width=12)
        # Right eye socket
        d.ellipse([HCX + 30, 730, HCX + 140, 810], fill=(255, 255, 255), outline=SKIN_OUTLINE, width=12)
        
        # Iris & pupil (Clear directional gaze shift!)
        d.ellipse([HCX - 95 + dx, 740, HCX - 55 + dx, 800], fill=EYE_DARK)
        d.ellipse([HCX + 55 + dx, 740, HCX + 95 + dx, 800], fill=EYE_DARK)
        # High-contrast glossy reflection
        d.ellipse([HCX - 88 + dx, 746, HCX - 74 + dx, 762], fill=(255, 255, 255))
        d.ellipse([HCX + 62 + dx, 746, HCX + 76 + dx, 762], fill=(255, 255, 255))
        
        # Eyelids & lashes
        d.arc([HCX - 145, 720, HCX - 25, 780], start=190, end=350, fill=HAIR_DARK, width=18)
        d.arc([HCX + 25, 720, HCX + 145, 780], start=190, end=350, fill=HAIR_DARK, width=18)
        
        # Gentle arched eyebrows
        d.arc([HCX - 140, 680, HCX - 30, 730], start=200, end=340, fill=HAIR_DARK, width=20)
        d.arc([HCX + 30, 680, HCX + 140, 730], start=200, end=340, fill=HAIR_DARK, width=20)
        
        # Delicate nose
        d.arc([HCX - 20, 790, HCX + 20, 840], start=40, end=140, fill=SKIN_SHADOW, width=14)
        
        # Warm friendly smile
        d.arc([HCX - 55, 850, HCX + 55, 910], start=20, end=160, fill=LIP_CORAL, width=18)
        
        # Cheeks: subtle gentle blush
        d.ellipse([HCX - 150, 820, HCX - 70, 880], fill=(248, 180, 160, 120))
        d.ellipse([HCX + 70, 820, HCX + 150, 880], fill=(248, 180, 160, 120))
        
        # Downscale to 512x512
        im_512 = im.resize((512, 512), Image.Resampling.LANCZOS)
        results[pose] = im_512

    return results

# -------------------------------------------------------------
# 2. FOX CUB FACES (TRANSPARENT, NO BEIGE DISC, CENTERED)
# -------------------------------------------------------------
def generate_fox_faces_transparent():
    # Exactly matching the previous expressions, but WITHOUT the opaque beige card circle
    # so the fox sits seamlessly inside the garden mirror / circle frame at 75% scale!
    emotions = ["happy", "calm", "sad", "angry", "scared", "surprised"]
    results = {}
    
    FUR_MAIN = (222, 92, 30)
    FUR_OUTLINE = (136, 44, 10)
    FUR_INNER_EAR = (255, 222, 202)
    MUZZLE_FILL = (255, 252, 245)
    MUZZLE_OUTLINE = (150, 56, 16)
    NOSE_FILL = (32, 18, 10)
    EYE_DARK = (28, 16, 8)
    BROW_DARK = (28, 16, 8)
    
    for emo in emotions:
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        
        # Ears
        if emo in ["happy", "calm"]:
            l_ear = [(620, 680), (560, 320), (760, 560)]
            l_inner = [(640, 650), (590, 380), (740, 570)]
            r_ear = [(1428, 680), (1488, 320), (1288, 560)]
            r_inner = [(1408, 650), (1458, 380), (1308, 570)]
        elif emo == "sad":
            l_ear = [(620, 680), (410, 540), (760, 560)]
            l_inner = [(630, 650), (460, 550), (730, 570)]
            r_ear = [(1428, 680), (1638, 540), (1288, 560)]
            r_inner = [(1418, 650), (1588, 550), (1318, 570)]
        elif emo == "angry":
            l_ear = [(620, 680), (400, 640), (760, 560)]
            l_inner = [(630, 660), (450, 640), (730, 580)]
            r_ear = [(1428, 680), (1648, 640), (1288, 560)]
            r_inner = [(1418, 660), (1598, 640), (1318, 580)]
        elif emo == "scared":
            l_ear = [(620, 680), (460, 740), (760, 560)]
            l_inner = [(640, 680), (510, 720), (730, 590)]
            r_ear = [(1428, 680), (1588, 740), (1288, 560)]
            r_inner = [(1408, 680), (1538, 720), (1318, 590)]
        elif emo == "surprised":
            l_ear = [(620, 680), (680, 210), (760, 560)]
            l_inner = [(640, 650), (690, 280), (740, 570)]
            r_ear = [(1428, 680), (1368, 210), (1288, 560)]
            r_inner = [(1408, 650), (1358, 280), (1308, 570)]
        
        d.polygon(l_ear, fill=FUR_MAIN, outline=FUR_OUTLINE)
        d.line([l_ear[0], l_ear[1], l_ear[2]], fill=FUR_OUTLINE, width=28)
        d.polygon(l_inner, fill=FUR_INNER_EAR)
        
        d.polygon(r_ear, fill=FUR_MAIN, outline=FUR_OUTLINE)
        d.line([r_ear[0], r_ear[1], r_ear[2]], fill=FUR_OUTLINE, width=28)
        d.polygon(r_inner, fill=FUR_INNER_EAR)
        
        # Head & Cheek Tufts
        d.ellipse([480, 560, 1568, 1460], fill=FUR_MAIN, outline=FUR_OUTLINE, width=28)
        l_tuft = [(520, 1000), (370, 1130), (520, 1220)]
        r_tuft = [(1528, 1000), (1678, 1130), (1528, 1220)]
        d.polygon(l_tuft, fill=FUR_MAIN, outline=FUR_OUTLINE)
        d.line([l_tuft[0], l_tuft[1], l_tuft[2]], fill=FUR_OUTLINE, width=28)
        d.polygon(r_tuft, fill=FUR_MAIN, outline=FUR_OUTLINE)
        d.line([r_tuft[0], r_tuft[1], r_tuft[2]], fill=FUR_OUTLINE, width=28)
        d.ellipse([500, 580, 1548, 1440], fill=FUR_MAIN)
        
        # White Chest Ruff (at base)
        d.polygon([(820, 1520), (1024, 1680), (1228, 1520)], fill=(255, 255, 255), outline=FUR_OUTLINE, width=16)
        
        # Ivory Muzzle
        muzzle_pts = [
            (1024, 1060),
            (760, 1100), (580, 1200), (640, 1340), (840, 1430),
            (1024, 1450),
            (1208, 1430), (1408, 1340), (1468, 1200), (1288, 1100)
        ]
        d.polygon(muzzle_pts, fill=MUZZLE_FILL, outline=MUZZLE_OUTLINE)
        d.line(muzzle_pts + [muzzle_pts[0]], fill=FUR_OUTLINE, width=22)
        
        # Button Nose
        d.polygon([(954, 1070), (1094, 1070), (1024, 1130)], fill=NOSE_FILL)
        d.ellipse([954, 1055, 1094, 1085], fill=NOSE_FILL)
        d.ellipse([980, 1060, 1005, 1072], fill=(255, 255, 255, 200))
        
        # Facial Features
        LX, RX = 780, 1268
        EYE_Y = 880
        
        if emo == "happy":
            d.ellipse([LX - 95, EYE_Y - 110, LX + 95, EYE_Y + 110], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            d.ellipse([RX - 95, EYE_Y - 110, RX + 95, EYE_Y + 110], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            d.ellipse([LX - 75, EYE_Y - 85, LX + 75, EYE_Y + 85], fill=EYE_DARK)
            d.ellipse([RX - 75, EYE_Y - 85, RX + 75, EYE_Y + 85], fill=EYE_DARK)
            d.ellipse([LX + 15, EYE_Y - 60, LX + 55, EYE_Y - 20], fill=(255, 255, 255))
            d.ellipse([LX - 35, EYE_Y + 25, LX - 15, EYE_Y + 45], fill=(255, 255, 255))
            d.ellipse([RX + 15, EYE_Y - 60, RX + 55, EYE_Y - 20], fill=(255, 255, 255))
            d.ellipse([RX - 35, EYE_Y + 25, RX - 15, EYE_Y + 45], fill=(255, 255, 255))
            
            d.arc([LX - 110, 680, LX + 110, 780], start=200, end=340, fill=BROW_DARK, width=40)
            d.arc([RX - 110, 680, RX + 110, 780], start=200, end=340, fill=BROW_DARK, width=40)
            d.ellipse([640, 1120, 760, 1220], fill=(251, 146, 146, 220))
            d.ellipse([1288, 1120, 1408, 1220], fill=(251, 146, 146, 220))
            
            d.chord([830, 1180, 1218, 1400], start=0, end=180, fill=(74, 21, 13), outline=FUR_OUTLINE, width=36)
            d.chord([920, 1280, 1128, 1400], start=0, end=180, fill=(251, 113, 133))
            d.line([(830, 1190), (1218, 1190)], fill=BROW_DARK, width=38)
            
        elif emo == "calm":
            d.ellipse([LX - 90, EYE_Y - 80, LX + 90, EYE_Y + 80], fill=(255, 255, 255), outline=EYE_DARK, width=20)
            d.ellipse([RX - 90, EYE_Y - 80, RX + 90, EYE_Y + 80], fill=(255, 255, 255), outline=EYE_DARK, width=20)
            d.ellipse([LX - 65, EYE_Y - 50, LX + 65, EYE_Y + 75], fill=EYE_DARK)
            d.ellipse([RX - 65, EYE_Y - 50, RX + 65, EYE_Y + 75], fill=EYE_DARK)
            d.ellipse([LX + 15, EYE_Y - 10, LX + 40, EYE_Y + 15], fill=(255, 255, 255))
            d.ellipse([RX + 15, EYE_Y - 10, RX + 40, EYE_Y + 15], fill=(255, 255, 255))
            d.chord([LX - 95, EYE_Y - 90, LX + 95, EYE_Y + 20], start=0, end=180, fill=FUR_MAIN, outline=EYE_DARK, width=26)
            d.chord([RX - 95, EYE_Y - 90, RX + 95, EYE_Y + 20], start=0, end=180, fill=FUR_MAIN, outline=EYE_DARK, width=26)
            
            d.line([(LX - 95, 710), (LX + 95, 710)], fill=BROW_DARK, width=38)
            d.line([(RX - 95, 710), (RX + 95, 710)], fill=BROW_DARK, width=38)
            d.ellipse([660, 1140, 760, 1220], fill=(254, 215, 170, 200))
            d.ellipse([1288, 1140, 1388, 1220], fill=(254, 215, 170, 200))
            d.arc([900, 1230, 1148, 1320], start=20, end=160, fill=BROW_DARK, width=36)
            
        elif emo == "sad":
            d.ellipse([LX - 90, EYE_Y - 95, LX + 90, EYE_Y + 95], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            d.ellipse([RX - 90, EYE_Y - 95, RX + 90, EYE_Y + 95], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            d.ellipse([LX - 65, EYE_Y - 20, LX + 65, EYE_Y + 90], fill=EYE_DARK)
            d.ellipse([RX - 65, EYE_Y - 20, RX + 65, EYE_Y + 90], fill=EYE_DARK)
            d.ellipse([LX + 15, EYE_Y + 5, LX + 40, EYE_Y + 30], fill=(255, 255, 255))
            d.ellipse([RX + 15, EYE_Y + 5, RX + 40, EYE_Y + 30], fill=(255, 255, 255))
            
            d.line([(670, 750), (890, 630)], fill=BROW_DARK, width=42)
            d.line([(1158, 630), (1378, 750)], fill=BROW_DARK, width=42)
            d.arc([840, 1280, 1208, 1420], start=200, end=340, fill=BROW_DARK, width=38)
            
            d.polygon([(1320, 1010), (1300, 1050), (1340, 1050)], fill=(96, 165, 250))
            d.ellipse([1300, 1035, 1340, 1075], fill=(96, 165, 250), outline=(37, 99, 235), width=8)
            d.ellipse([1310, 1042, 1322, 1054], fill=(255, 255, 255))
            
        elif emo == "angry":
            d.ellipse([LX - 85, EYE_Y - 80, LX + 85, EYE_Y + 80], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            d.ellipse([RX - 85, EYE_Y - 80, RX + 85, EYE_Y + 80], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            d.ellipse([LX - 55, EYE_Y - 55, LX + 55, EYE_Y + 55], fill=EYE_DARK)
            d.ellipse([RX - 55, EYE_Y - 55, RX + 55, EYE_Y + 55], fill=EYE_DARK)
            d.ellipse([LX + 10, EYE_Y - 30, LX + 30, EYE_Y - 10], fill=(255, 255, 255))
            d.ellipse([RX + 10, EYE_Y - 30, RX + 30, EYE_Y - 10], fill=(255, 255, 255))
            d.polygon([(LX - 95, EYE_Y - 90), (LX + 95, EYE_Y - 30), (LX - 95, EYE_Y - 30)], fill=FUR_MAIN)
            d.line([(LX - 95, EYE_Y - 80), (LX + 95, EYE_Y - 20)], fill=EYE_DARK, width=26)
            d.polygon([(RX + 95, EYE_Y - 90), (RX - 95, EYE_Y - 30), (RX + 95, EYE_Y - 30)], fill=FUR_MAIN)
            d.line([(RX + 95, EYE_Y - 80), (RX - 95, EYE_Y - 20)], fill=EYE_DARK, width=26)
            
            d.line([(670, 640), (900, 760)], fill=BROW_DARK, width=44)
            d.line([(1148, 760), (1378, 640)], fill=BROW_DARK, width=44)
            d.line([(860, 1270), (1188, 1270)], fill=BROW_DARK, width=40)
            d.line([(860, 1270), (860, 1300)], fill=BROW_DARK, width=36)
            d.line([(1188, 1270), (1188, 1300)], fill=BROW_DARK, width=36)
            
        elif emo == "scared":
            d.ellipse([LX - 105, EYE_Y - 120, LX + 105, EYE_Y + 120], fill=(255, 255, 255), outline=EYE_DARK, width=26)
            d.ellipse([RX - 105, EYE_Y - 120, RX + 105, EYE_Y + 120], fill=(255, 255, 255), outline=EYE_DARK, width=26)
            d.ellipse([LX - 32, EYE_Y - 32, LX + 32, EYE_Y + 32], fill=EYE_DARK)
            d.ellipse([RX - 32, EYE_Y - 32, RX + 32, EYE_Y + 32], fill=EYE_DARK)
            d.ellipse([LX + 8, EYE_Y - 18, LX + 20, EYE_Y - 6], fill=(255, 255, 255))
            d.ellipse([RX + 8, EYE_Y - 18, RX + 20, EYE_Y - 6], fill=(255, 255, 255))
            
            d.line([(680, 630), (890, 560)], fill=BROW_DARK, width=42)
            d.line([(1158, 560), (1368, 630)], fill=BROW_DARK, width=42)
            d.line([(960, 600), (990, 560)], fill=BROW_DARK, width=22)
            d.line([(1088, 600), (1058, 560)], fill=BROW_DARK, width=22)
            d.rounded_rectangle([800, 1230, 1248, 1320], radius=30, fill=(60, 20, 12), outline=BROW_DARK, width=36)
            
            d.polygon([(640, 670), (620, 715), (660, 715)], fill=(96, 165, 250))
            d.ellipse([620, 700, 660, 740], fill=(96, 165, 250), outline=(37, 99, 235), width=8)
            d.ellipse([630, 708, 642, 720], fill=(255, 255, 255))
            
        elif emo == "surprised":
            d.ellipse([LX - 105, EYE_Y - 120, LX + 105, EYE_Y + 120], fill=(255, 255, 255), outline=EYE_DARK, width=26)
            d.ellipse([RX - 105, EYE_Y - 120, RX + 105, EYE_Y + 120], fill=(255, 255, 255), outline=EYE_DARK, width=26)
            d.ellipse([LX - 65, EYE_Y - 65, LX + 65, EYE_Y + 65], fill=EYE_DARK)
            d.ellipse([RX - 65, EYE_Y - 65, RX + 65, EYE_Y + 65], fill=EYE_DARK)
            d.ellipse([LX + 15, EYE_Y - 45, LX + 48, EYE_Y - 12], fill=(255, 255, 255))
            d.ellipse([RX + 15, EYE_Y - 45, RX + 48, EYE_Y - 12], fill=(255, 255, 255))
            
            d.arc([LX - 110, 480, LX + 110, 640], start=200, end=340, fill=BROW_DARK, width=42)
            d.arc([RX - 110, 480, RX + 110, 640], start=200, end=340, fill=BROW_DARK, width=42)
            d.ellipse([954, 1220, 1094, 1370], fill=(60, 20, 12), outline=BROW_DARK, width=38)
            
        im_512 = im.resize((512, 512), Image.Resampling.LANCZOS)
        results[emo] = im_512
        
    return results

# -------------------------------------------------------------
# 3. UNIFIED CHOICE SPRITES (ONE NEUTRAL BODY COLOUR, MATCHING FOX STYLE)
# -------------------------------------------------------------
def generate_choice_sprites():
    # Cute forest spirit / acorn buddy with ONE neutral porcelain/cream body color across ALL 6!
    # They differ ONLY in the facial expression, matching the exact emotion rules.
    emotions = ["happy", "calm", "sad", "angry", "scared", "surprised"]
    results = {}
    
    BODY_COLOR = (252, 246, 238)      # Warm soft porcelain neutral cream
    BODY_SHADOW = (235, 222, 205)     # Subtle gouache shadow
    BODY_OUTLINE = (110, 60, 32)      # Warm rich chestnut outline
    FACE_DARK = (36, 22, 14)          # Eyes, brows, mouth
    
    for emo in emotions:
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        
        # Rounded acorn/spirit body (identical silhouette and color for all 6)
        # Cap/Sprout at top
        d.ellipse([980, 280, 1068, 480], fill=(16, 140, 110), outline=(10, 80, 60), width=20) # gentle sprout leaf
        d.arc([1024, 380, 1140, 520], start=180, end=360, fill=(10, 80, 60), width=20)
        
        # Main round body
        d.ellipse([460, 480, 1588, 1680], fill=BODY_COLOR, outline=BODY_OUTLINE, width=28)
        # Soft gouache volume shading on lower/right body
        d.chord([475, 520, 1573, 1665], start=0, end=140, fill=BODY_SHADOW)
        d.ellipse([460, 480, 1588, 1680], outline=BODY_OUTLINE, width=28)
        
        # Soft neutral ear nubs
        d.ellipse([420, 720, 540, 920], fill=BODY_COLOR, outline=BODY_OUTLINE, width=24)
        d.ellipse([1508, 720, 1628, 920], fill=BODY_COLOR, outline=BODY_OUTLINE, width=24)
        # Re-fill body to blend ear junction
        d.ellipse([470, 500, 1578, 1660], fill=BODY_COLOR)
        d.ellipse([460, 480, 1588, 1680], outline=BODY_OUTLINE, width=28)
        
        # Face Coordinates
        LX, RX = 810, 1238
        EYE_Y = 960
        
        if emo == "happy":
            # Big open round eyes
            d.ellipse([LX - 80, EYE_Y - 95, LX + 80, EYE_Y + 95], fill=(255, 255, 255), outline=FACE_DARK, width=22)
            d.ellipse([RX - 80, EYE_Y - 95, RX + 80, EYE_Y + 95], fill=(255, 255, 255), outline=FACE_DARK, width=22)
            d.ellipse([LX - 60, EYE_Y - 75, LX + 60, EYE_Y + 75], fill=FACE_DARK)
            d.ellipse([RX - 60, EYE_Y - 75, RX + 60, EYE_Y + 75], fill=FACE_DARK)
            d.ellipse([LX + 15, EYE_Y - 50, LX + 48, EYE_Y - 18], fill=(255, 255, 255))
            d.ellipse([RX + 15, EYE_Y - 50, RX + 48, EYE_Y - 18], fill=(255, 255, 255))
            # Relaxed arched brows
            d.arc([LX - 95, 780, LX + 95, 870], start=200, end=340, fill=FACE_DARK, width=38)
            d.arc([RX - 95, 780, RX + 95, 870], start=200, end=340, fill=FACE_DARK, width=38)
            # Wide open D-smile with pink tongue
            d.chord([860, 1200, 1188, 1400], start=0, end=180, fill=(74, 21, 13), outline=FACE_DARK, width=34)
            d.chord([930, 1290, 1118, 1400], start=0, end=180, fill=(251, 113, 133))
            d.line([(860, 1210), (1188, 1210)], fill=FACE_DARK, width=36)
            # Rosy cheeks
            d.ellipse([670, 1150, 770, 1250], fill=(251, 146, 146, 220))
            d.ellipse([1278, 1150, 1378, 1250], fill=(251, 146, 146, 220))
            
        elif emo == "calm":
            # Half-closed serene eyes
            d.ellipse([LX - 75, EYE_Y - 70, LX + 75, EYE_Y + 70], fill=(255, 255, 255), outline=FACE_DARK, width=20)
            d.ellipse([RX - 75, EYE_Y - 70, RX + 75, EYE_Y + 70], fill=(255, 255, 255), outline=FACE_DARK, width=20)
            d.ellipse([LX - 55, EYE_Y - 40, LX + 55, EYE_Y + 65], fill=FACE_DARK)
            d.ellipse([RX - 55, EYE_Y - 40, RX + 55, EYE_Y + 65], fill=FACE_DARK)
            d.ellipse([LX + 15, EYE_Y - 10, LX + 35, EYE_Y + 10], fill=(255, 255, 255))
            d.ellipse([RX + 15, EYE_Y - 10, RX + 35, EYE_Y + 10], fill=(255, 255, 255))
            d.chord([LX - 80, EYE_Y - 80, LX + 80, EYE_Y + 15], start=0, end=180, fill=BODY_COLOR, outline=FACE_DARK, width=24)
            d.chord([RX - 80, EYE_Y - 80, RX + 80, EYE_Y + 15], start=0, end=180, fill=BODY_COLOR, outline=FACE_DARK, width=24)
            # Level relaxed brows
            d.line([(LX - 80, 810), (LX + 80, 810)], fill=FACE_DARK, width=36)
            d.line([(RX - 80, 810), (RX + 80, 810)], fill=FACE_DARK, width=36)
            # Gentle closed smile
            d.arc([920, 1240, 1128, 1330], start=20, end=160, fill=FACE_DARK, width=34)
            # Soft peach blush
            d.ellipse([690, 1170, 770, 1250], fill=(254, 215, 170, 180))
            d.ellipse([1278, 1170, 1358, 1250], fill=(254, 215, 170, 180))
            
        elif emo == "sad":
            # Looking down eyes
            d.ellipse([LX - 75, EYE_Y - 85, LX + 75, EYE_Y + 85], fill=(255, 255, 255), outline=FACE_DARK, width=22)
            d.ellipse([RX - 75, EYE_Y - 85, RX + 75, EYE_Y + 85], fill=(255, 255, 255), outline=FACE_DARK, width=22)
            d.ellipse([LX - 55, EYE_Y - 10, LX + 55, EYE_Y + 80], fill=FACE_DARK)
            d.ellipse([RX - 55, EYE_Y - 10, RX + 55, EYE_Y + 80], fill=FACE_DARK)
            d.ellipse([LX + 12, EYE_Y + 15, LX + 35, EYE_Y + 38], fill=(255, 255, 255))
            d.ellipse([RX + 12, EYE_Y + 15, RX + 35, EYE_Y + 38], fill=(255, 255, 255))
            # Brows slope UP toward middle: / \
            d.line([(690, 850), (900, 740)], fill=FACE_DARK, width=40)
            d.line([(1148, 740), (1358, 850)], fill=FACE_DARK, width=40)
            # Downturned frown
            d.arc([870, 1280, 1178, 1410], start=200, end=340, fill=FACE_DARK, width=36)
            # Teardrop
            d.polygon([(1280, 1080), (1260, 1120), (1300, 1120)], fill=(96, 165, 250))
            d.ellipse([1260, 1105, 1300, 1145], fill=(96, 165, 250), outline=(37, 99, 235), width=8)
            d.ellipse([1270, 1112, 1282, 1124], fill=(255, 255, 255))
            
        elif emo == "angry":
            # Narrowed eyes
            d.ellipse([LX - 75, EYE_Y - 70, LX + 75, EYE_Y + 70], fill=(255, 255, 255), outline=FACE_DARK, width=22)
            d.ellipse([RX - 75, EYE_Y - 70, RX + 75, EYE_Y + 70], fill=(255, 255, 255), outline=FACE_DARK, width=22)
            d.ellipse([LX - 50, EYE_Y - 50, LX + 50, EYE_Y + 50], fill=FACE_DARK)
            d.ellipse([RX - 50, EYE_Y - 50, RX + 50, EYE_Y + 50], fill=FACE_DARK)
            d.ellipse([LX + 10, EYE_Y - 25, LX + 28, EYE_Y - 7], fill=(255, 255, 255))
            d.ellipse([RX + 10, EYE_Y - 25, RX + 28, EYE_Y - 7], fill=(255, 255, 255))
            d.polygon([(LX - 85, EYE_Y - 80), (LX + 85, EYE_Y - 25), (LX - 85, EYE_Y - 25)], fill=BODY_COLOR)
            d.line([(LX - 85, EYE_Y - 70), (LX + 85, EYE_Y - 15)], fill=FACE_DARK, width=24)
            d.polygon([(RX + 85, EYE_Y - 80), (RX - 85, EYE_Y - 25), (RX + 85, EYE_Y - 25)], fill=BODY_COLOR)
            d.line([(RX + 85, EYE_Y - 70), (RX - 85, EYE_Y - 15)], fill=FACE_DARK, width=24)
            # Brows slope DOWN toward middle: \ /
            d.line([(690, 740), (910, 850)], fill=FACE_DARK, width=42)
            d.line([(1138, 850), (1358, 740)], fill=FACE_DARK, width=42)
            # Firm grimace line
            d.line([(880, 1270), (1168, 1270)], fill=FACE_DARK, width=38)
            d.line([(880, 1270), (880, 1300)], fill=FACE_DARK, width=34)
            d.line([(1168, 1270), (1168, 1300)], fill=FACE_DARK, width=34)
            
        elif emo == "scared":
            # Wide fear eyes with SMALL pupils!
            d.ellipse([LX - 95, EYE_Y - 105, LX + 95, EYE_Y + 105], fill=(255, 255, 255), outline=FACE_DARK, width=24)
            d.ellipse([RX - 95, EYE_Y - 105, RX + 95, EYE_Y + 105], fill=(255, 255, 255), outline=FACE_DARK, width=24)
            d.ellipse([LX - 28, EYE_Y - 28, LX + 28, EYE_Y + 28], fill=FACE_DARK)
            d.ellipse([RX - 28, EYE_Y - 28, RX + 28, EYE_Y + 28], fill=FACE_DARK)
            d.ellipse([LX + 6, EYE_Y - 16, LX + 18, EYE_Y - 4], fill=(255, 255, 255))
            d.ellipse([RX + 6, EYE_Y - 16, RX + 18, EYE_Y - 4], fill=(255, 255, 255))
            # Brows raised and bunched
            d.line([(700, 740), (900, 680)], fill=FACE_DARK, width=40)
            d.line([(1148, 680), (1348, 740)], fill=FACE_DARK, width=40)
            d.line([(970, 710), (1000, 680)], fill=FACE_DARK, width=20)
            d.line([(1078, 710), (1048, 680)], fill=FACE_DARK, width=20)
            # Horizontal tense mouth
            d.rounded_rectangle([820, 1230, 1228, 1315], radius=25, fill=(60, 20, 12), outline=FACE_DARK, width=34)
            # Sweat drop on temple
            d.polygon([(650, 770), (630, 810), (670, 810)], fill=(96, 165, 250))
            d.ellipse([630, 795, 670, 835], fill=(96, 165, 250), outline=(37, 99, 235), width=8)
            d.ellipse([640, 802, 652, 814], fill=(255, 255, 255))
            
        elif emo == "surprised":
            # Wide eyes with large round pupils
            d.ellipse([LX - 95, EYE_Y - 105, LX + 95, EYE_Y + 105], fill=(255, 255, 255), outline=FACE_DARK, width=24)
            d.ellipse([RX - 95, EYE_Y - 105, RX + 95, EYE_Y + 105], fill=(255, 255, 255), outline=FACE_DARK, width=24)
            d.ellipse([LX - 60, EYE_Y - 60, LX + 60, EYE_Y + 60], fill=FACE_DARK)
            d.ellipse([RX - 60, EYE_Y - 60, RX + 60, EYE_Y + 60], fill=FACE_DARK)
            d.ellipse([LX + 14, EYE_Y - 40, LX + 44, EYE_Y - 10], fill=(255, 255, 255))
            d.ellipse([RX + 14, EYE_Y - 40, RX + 44, EYE_Y - 10], fill=(255, 255, 255))
            # High curved brows far apart
            d.arc([LX - 95, 600, LX + 95, 740], start=200, end=340, fill=FACE_DARK, width=40)
            d.arc([RX - 95, 600, RX + 95, 740], start=200, end=340, fill=FACE_DARK, width=40)
            # Round "O" mouth
            d.ellipse([960, 1220, 1088, 1360], fill=(60, 20, 12), outline=FACE_DARK, width=36)
            
        im_512 = im.resize((512, 512), Image.Resampling.LANCZOS)
        results[emo] = im_512

    return results

if __name__ == "__main__":
    # Generate and save all updated cohesive assets
    print("Generating updated cohesive autism quest assets...")
    
    arias = generate_aria_sprites()
    for pose, im in arias.items():
        out = f"{DEST_DIR}/aria_gaze_{pose}.webp"
        im.save(out, "WEBP", quality=95)
        print(f"Saved Aria pose: {out}")
        
    foxes = generate_fox_faces_transparent()
    for emo, im in foxes.items():
        out = f"{DEST_DIR}/fox_{emo}.webp"
        im.save(out, "WEBP", quality=95)
        print(f"Saved transparent Fox Face: {out}")
        
    choices = generate_choice_sprites()
    for emo, im in choices.items():
        out = f"{DEST_DIR}/choice_{emo}.webp"
        im.save(out, "WEBP", quality=95)
        print(f"Saved unified Choice Sprite: {out}")
        
    print("All cohesive autism quest art generated successfully.")

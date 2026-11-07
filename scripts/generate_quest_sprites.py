import os
import math
from PIL import Image, ImageDraw, ImageFilter

def draw_star(draw, center, r_outer, r_inner, fill, outline=None, width=1):
    cx, cy = center
    points = []
    for i in range(10):
        r = r_outer if i % 2 == 0 else r_inner
        angle = i * math.pi / 5 - math.pi / 2
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(points, fill=fill, outline=outline, width=width)

def generate_adhd_sprites(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Star Node (Unlit) - 256x256
    im = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([32, 32, 224, 224], fill=(28, 38, 64, 220), outline=(147, 197, 253, 200), width=6)
    draw_star(d, (128, 128), 64, 30, fill=(96, 165, 250, 180), outline=(219, 234, 254, 255), width=3)
    im.save(os.path.join(out_dir, "star_node.webp"), "WEBP")
    
    # 2. Star Node (Lit / Soft Pulse Glow) - 256x256
    im_glow = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    dg = ImageDraw.Draw(im_glow)
    # Outer gentle amber halo
    for r in range(120, 70, -10):
        alpha = int(40 * (1 - (r - 70) / 50))
        dg.ellipse([128 - r, 128 - r, 128 + r, 128 + r], fill=(251, 191, 36, alpha))
    dg.ellipse([32, 32, 224, 224], fill=(245, 158, 11, 240), outline=(254, 243, 199, 255), width=8)
    draw_star(dg, (128, 128), 70, 32, fill=(254, 240, 138, 255), outline=(255, 255, 255, 255), width=4)
    im_glow.save(os.path.join(out_dir, "star_node_lit.webp"), "WEBP")
    
    # 3. Sunstone Orb (Motor charge) - 300x300
    orb = Image.new("RGBA", (300, 300), (0, 0, 0, 0))
    do = ImageDraw.Draw(orb)
    for r in range(140, 80, -10):
        alpha = int(50 * (1 - (r - 80) / 60))
        do.ellipse([150 - r, 150 - r, 150 + r, 150 + r], fill=(249, 115, 22, alpha))
    do.ellipse([40, 40, 260, 260], fill=(234, 88, 12, 230), outline=(254, 215, 170, 255), width=8)
    # Inner crystalline facets
    points = [
        (150, 60), (220, 110), (220, 190), (150, 240), (80, 190), (80, 110)
    ]
    do.polygon(points, fill=(251, 146, 60, 240), outline=(255, 237, 213, 255), width=4)
    do.line([(150, 60), (150, 240)], fill=(255, 237, 213, 200), width=3)
    do.line([(80, 110), (220, 190)], fill=(255, 237, 213, 180), width=3)
    do.line([(80, 190), (220, 110)], fill=(255, 237, 213, 180), width=3)
    orb.save(os.path.join(out_dir, "sunstone_orb.webp"), "WEBP")
    
    # 4. Chime Bell - 200x200
    bell = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
    db = ImageDraw.Draw(bell)
    db.ellipse([85, 20, 115, 50], outline=(217, 119, 6, 255), width=5)
    bell_pts = [(70, 60), (130, 60), (145, 140), (160, 155), (40, 155), (55, 140)]
    db.polygon(bell_pts, fill=(245, 158, 11, 240), outline=(254, 243, 199, 255), width=4)
    db.ellipse([88, 150, 112, 175], fill=(217, 119, 6, 255), outline=(254, 243, 199, 255), width=3)
    bell.save(os.path.join(out_dir, "chime_bell.webp"), "WEBP")
    print(f"ADHD sprites generated in {out_dir}")

def generate_autism_sprites(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Sorting Boxes (256x256)
    # Box Red Star
    b_red = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    dr = ImageDraw.Draw(b_red)
    dr.rounded_rectangle([20, 40, 236, 236], radius=24, fill=(239, 68, 68, 220), outline=(254, 202, 202, 255), width=6)
    dr.rounded_rectangle([36, 56, 220, 100], radius=16, fill=(185, 28, 28, 240))
    draw_star(dr, (128, 160), 45, 20, fill=(254, 226, 226, 255), outline=(255, 255, 255, 255), width=3)
    b_red.save(os.path.join(out_dir, "box_red_star.webp"), "WEBP")
    
    # Box Blue Circle
    b_blue = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    db = ImageDraw.Draw(b_blue)
    db.rounded_rectangle([20, 40, 236, 236], radius=24, fill=(59, 130, 246, 220), outline=(191, 219, 254, 255), width=6)
    db.rounded_rectangle([36, 56, 220, 100], radius=16, fill=(29, 78, 216, 240))
    db.ellipse([85, 118, 171, 204], fill=(219, 234, 254, 255), outline=(255, 255, 255, 255), width=3)
    b_blue.save(os.path.join(out_dir, "box_blue_circle.webp"), "WEBP")
    
    # 2. Sorting Gem Cards (180x180)
    # Red Star card
    c_rs = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
    drs = ImageDraw.Draw(c_rs)
    drs.rounded_rectangle([10, 10, 170, 170], radius=20, fill=(255, 255, 255, 250), outline=(252, 165, 165, 255), width=4)
    draw_star(drs, (90, 90), 50, 22, fill=(239, 68, 68, 255), outline=(185, 28, 28, 255), width=3)
    c_rs.save(os.path.join(out_dir, "card_red_star.webp"), "WEBP")
    
    # Red Circle card
    c_rc = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
    drc = ImageDraw.Draw(c_rc)
    drc.rounded_rectangle([10, 10, 170, 170], radius=20, fill=(255, 255, 255, 250), outline=(252, 165, 165, 255), width=4)
    drc.ellipse([45, 45, 135, 135], fill=(239, 68, 68, 255), outline=(185, 28, 28, 255), width=3)
    c_rc.save(os.path.join(out_dir, "card_red_circle.webp"), "WEBP")
    
    # Blue Star card
    c_bs = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
    dbs = ImageDraw.Draw(c_bs)
    dbs.rounded_rectangle([10, 10, 170, 170], radius=20, fill=(255, 255, 255, 250), outline=(147, 197, 253, 255), width=4)
    draw_star(dbs, (90, 90), 50, 22, fill=(59, 130, 246, 255), outline=(29, 78, 216, 255), width=3)
    c_bs.save(os.path.join(out_dir, "card_blue_star.webp"), "WEBP")
    
    # Blue Circle card
    c_bc = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
    dbc = ImageDraw.Draw(c_bc)
    dbc.rounded_rectangle([10, 10, 170, 170], radius=20, fill=(255, 255, 255, 250), outline=(147, 197, 253, 255), width=4)
    dbc.ellipse([45, 45, 135, 135], fill=(59, 130, 246, 255), outline=(29, 78, 216, 255), width=3)
    c_bc.save(os.path.join(out_dir, "card_blue_circle.webp"), "WEBP")
    
    # 3. Sanctuary Decor Items (256x256)
    cushion = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    dc = ImageDraw.Draw(cushion)
    dc.rounded_rectangle([32, 60, 224, 196], radius=40, fill=(245, 158, 11, 230), outline=(254, 243, 199, 255), width=6)
    dc.line([(32, 128), (224, 128)], fill=(217, 119, 6, 180), width=4)
    dc.line([(128, 60), (128, 196)], fill=(217, 119, 6, 180), width=4)
    dc.ellipse([116, 116, 140, 140], fill=(254, 243, 199, 255))
    cushion.save(os.path.join(out_dir, "decor_cushion.webp"), "WEBP")
    
    plant = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    dp = ImageDraw.Draw(plant)
    dp.polygon([(80, 140), (176, 140), (160, 220), (96, 220)], fill=(180, 83, 9, 240), outline=(254, 215, 170, 255), width=4)
    for leaf in [((128, 140), (80, 60), (128, 40)), ((128, 140), (176, 60), (128, 40)), ((128, 140), (128, 30), (140, 60))]:
        dp.polygon(leaf, fill=(16, 185, 129, 240), outline=(209, 250, 229, 255), width=3)
    plant.save(os.path.join(out_dir, "decor_plant.webp"), "WEBP")
    print(f"Autism sprites generated in {out_dir}")

def generate_dyslexia_sprites(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Ink Drop (180x180)
    drop = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
    dd = ImageDraw.Draw(drop)
    # Tear drop shape
    dd.polygon([(90, 20), (135, 100), (135, 125), (90, 160), (45, 125), (45, 100)], fill=(13, 148, 136, 240), outline=(204, 251, 241, 255), width=4)
    dd.ellipse([50, 80, 130, 155], fill=(13, 148, 136, 240), outline=(204, 251, 241, 255), width=4)
    dd.ellipse([65, 95, 85, 120], fill=(255, 255, 255, 220))
    drop.save(os.path.join(out_dir, "ink_drop.webp"), "WEBP")
    
    # 2. Syllable River Stones (200x200)
    syllables = [("bah", (245, 158, 11)), ("dee", (16, 185, 129)), ("moe", (59, 130, 246)), ("koo", (168, 85, 247))]
    for syl, col in syllables:
        st = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
        ds = ImageDraw.Draw(st)
        ds.ellipse([20, 35, 180, 165], fill=(241, 245, 249, 250), outline=col + (220,), width=6)
        ds.ellipse([30, 45, 170, 155], fill=col + (40,), outline=col + (160,), width=2)
        # Note: Text will be rendered in HTML/React with proper dyslexia-friendly font
        st.save(os.path.join(out_dir, f"stone_{syl}.webp"), "WEBP")
        
    # 3. Book Choice Plate (300x200)
    bk = Image.new("RGBA", (300, 200), (0, 0, 0, 0))
    dbk = ImageDraw.Draw(bk)
    dbk.rounded_rectangle([15, 20, 285, 180], radius=18, fill=(255, 251, 235, 255), outline=(217, 119, 6, 200), width=5)
    dbk.line([(150, 20), (150, 180)], fill=(217, 119, 6, 150), width=3)
    dbk.rounded_rectangle([25, 30, 140, 170], radius=10, outline=(254, 243, 199, 255), width=2)
    dbk.rounded_rectangle([160, 30, 275, 170], radius=10, outline=(254, 243, 199, 255), width=2)
    bk.save(os.path.join(out_dir, "book_plate.webp"), "WEBP")
    
    # 4. Lantern Choice Plate (300x200)
    lp = Image.new("RGBA", (300, 200), (0, 0, 0, 0))
    dlp = ImageDraw.Draw(lp)
    dlp.rounded_rectangle([15, 20, 285, 180], radius=18, fill=(240, 253, 250, 255), outline=(13, 148, 136, 200), width=5)
    dlp.rounded_rectangle([25, 30, 275, 170], radius=12, fill=(204, 251, 241, 100), outline=(94, 234, 212, 180), width=2)
    lp.save(os.path.join(out_dir, "lantern_plate.webp"), "WEBP")
    print(f"Dyslexia sprites generated in {out_dir}")

def main():
    root = "/Users/ananyasridhar/work/vaakbot/web/public/quests"
    generate_adhd_sprites(os.path.join(root, "adhd"))
    generate_autism_sprites(os.path.join(root, "autism"))
    generate_dyslexia_sprites(os.path.join(root, "dyslexia"))

if __name__ == "__main__":
    main()

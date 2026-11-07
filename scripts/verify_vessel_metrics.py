import numpy as np
from PIL import Image

print(f"{'Vessel':10s} | {'Area (px)':9s} | {'Bounding Box (x0,y0,x1,y1)':27s} | {'Size':10s} | {'Centroid (x,y)':16s} | {'Mean Lum':8s}")
print("-" * 95)

metrics = {}
for name in ["veranda", "lotus", "emerald"]:
    im = Image.open(f"/Users/ananyasridhar/work/vaakbot/scripts/scratch_autism/vessel_{name}.webp")
    arr = np.array(im)
    alpha = arr[..., 3]
    mask = alpha > 10
    area = int(np.sum(mask))
    
    ys, xs = np.where(mask)
    bbox = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
    bbox_size = (bbox[2] - bbox[0] + 1, bbox[3] - bbox[1] + 1)
    
    cx = float(np.mean(xs))
    cy = float(np.mean(ys))
    
    rgb = arr[..., :3].astype(np.float64)
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    mean_lum = float(np.mean(lum[mask]))
    
    metrics[name] = {"area": area, "bbox": bbox, "size": bbox_size, "cx": cx, "cy": cy, "lum": mean_lum}
    print(f"{name:10s} | {area:9d} | {str(bbox):27s} | {str(bbox_size):10s} | ({cx:5.1f}, {cy:5.1f})   | {mean_lum:8.2f}")

areas = [m["area"] for m in metrics.values()]
lums = [m["lum"] for m in metrics.values()]
area_diff_pct = (max(areas) - min(areas)) / min(areas) * 100
lum_diff = max(lums) - min(lums)

print("\n--- Compliance Checks ---")
print(f"Area max difference: {area_diff_pct:.2f}% (Requirement: < 3.00%) -> {'PASS' if area_diff_pct < 3.0 else 'FAIL'}")
print(f"Luminance max difference: {lum_diff:.2f} points (Requirement: < 8.00 pts) -> {'PASS' if lum_diff < 8.0 else 'FAIL'}")
print(f"Centroids: {[ (round(m['cx'], 1), round(m['cy'], 1)) for m in metrics.values() ]} (Requirement: canvas center [256, 256])")

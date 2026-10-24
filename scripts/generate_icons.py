import math
from PIL import Image, ImageDraw

def create_brand_icon(size=512):
    # Create RGBA canvas
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Scale factor
    s = size / 128.0

    # Draw rounded squircle background
    # Background gradient approximation using rounded rectangle
    radius = int(30 * s)
    draw.rounded_rectangle(
        [(int(2 * s), int(2 * s)), (int(126 * s), int(126 * s))],
        radius=radius,
        fill=(6, 78, 59, 255), # Emerald 900
        outline=(16, 185, 129, 200), # Emerald 500
        width=max(1, int(2.5 * s))
    )

    # Inner subtle glow
    draw.rounded_rectangle(
        [(int(6 * s), int(6 * s)), (int(122 * s), int(122 * s))],
        radius=int(26 * s),
        outline=(5, 150, 105, 100),
        width=max(1, int(1.5 * s))
    )

    # Draw stylized organic leaf
    # We can draw the leaf polygon with bezier-like points
    leaf_color = (52, 211, 153, 255) # Emerald 400
    stem_color = (6, 78, 59, 255) # Emerald 900
    
    # Generate leaf curve points
    leaf_pts = []
    # Bottom-left to Top-right upper curve
    steps = 40
    p0 = (34 * s, 94 * s)
    p1 = (36 * s, 42 * s)
    p2 = (94 * s, 34 * s)
    for i in range(steps + 1):
        t = i / steps
        # Quadratic bezier
        x = (1 - t)**2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0]
        y = (1 - t)**2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1]
        leaf_pts.append((x, y))
        
    # Top-right to Bottom-left lower curve
    p3 = (92 * s, 92 * s)
    for i in range(steps + 1):
        t = i / steps
        x = (1 - t)**2 * p2[0] + 2 * (1 - t) * t * p3[0] + t**2 * p0[0]
        y = (1 - t)**2 * p2[1] + 2 * (1 - t) * t * p3[1] + t**2 * p0[1]
        leaf_pts.append((x, y))

    draw.polygon(leaf_pts, fill=leaf_color)

    # Main vein (stem)
    stem_pts = []
    for i in range(steps + 1):
        t = i / steps
        x = (1 - t) * p0[0] + t * p2[0] + math.sin(t * math.pi) * 4 * s
        y = (1 - t) * p0[1] + t * p2[0] * 0 + ((1-t)*p0[1] + t*p2[1]) - math.sin(t * math.pi) * 3 * s
        stem_pts.append((x, y))
    
    draw.line(stem_pts, fill=stem_color, width=max(1, int(4 * s)))

    # Golden Sparkle badge at top right
    center_x = int(94 * s)
    center_y = int(34 * s)
    badge_r = int(14 * s)
    draw.ellipse(
        [(center_x - badge_r, center_y - badge_r), (center_x + badge_r, center_y + badge_r)],
        fill=(2, 44, 34, 255),
        outline=(245, 158, 11, 255),
        width=max(1, int(1.5 * s))
    )

    # 4-pointed star inside badge
    star_pts = []
    sp_outer = 10 * s
    sp_inner = 2.5 * s
    for i in range(8):
        angle = i * math.pi / 4 - math.pi / 2
        r = sp_outer if i % 2 == 0 else sp_inner
        star_pts.append((center_x + r * math.cos(angle), center_y + r * math.sin(angle)))
    draw.polygon(star_pts, fill=(251, 191, 36, 255)) # Amber 400

    return img

if __name__ == "__main__":
    # Generate 512x512 master
    icon512 = create_brand_icon(512)
    icon512.save("public/icon-512.png")

    # Generate 192x192
    icon192 = icon512.resize((192, 192), Image.Resampling.LANCZOS)
    icon192.save("public/icon-192.png")

    # Generate 180x180 (apple touch icon)
    icon180 = icon512.resize((180, 180), Image.Resampling.LANCZOS)
    icon180.save("src/app/apple-icon.png")
    icon180.save("public/apple-touch-icon.png")

    # Generate 32x32 and 16x16
    icon32 = icon512.resize((32, 32), Image.Resampling.LANCZOS)
    icon32.save("src/app/icon.png")
    icon32.save("public/icon.png")

    icon16 = icon512.resize((16, 16), Image.Resampling.LANCZOS)

    # Generate multi-res favicon.ico
    icon512.save(
        "src/app/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    icon512.save(
        "public/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print("Icons successfully generated!")

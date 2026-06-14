import os
from PIL import Image, ImageDraw

def create_icon(size):
    # Create a new image with a smooth gradient background
    img = Image.new('RGBA', (size, size), color=(0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle for the background
    radius = size // 5
    draw.rounded_rectangle(
        [(0, 0), (size, size)],
        radius=radius,
        fill=(85, 93, 219, 255) # Match the purple/blue from the uploaded image (~ #555ddb)
    )

    # Draw lightning bolt (zap)
    # Define points relative to center
    cx, cy = size / 2, size / 2
    w, h = size * 0.45, size * 0.65 # Width and height of the bolt
    
    # Coordinates for a standard lightning bolt
    # Top tip -> bottom-left inner -> right inner -> bottom tip -> top-right inner -> left inner -> Top tip
    # We will use a standard polygon
    points = [
        (cx + w*0.1, cy - h*0.5), # Top point
        (cx - w*0.4, cy + h*0.1), # Left point
        (cx - w*0.0, cy + h*0.1), # Inner left
        (cx - w*0.2, cy + h*0.5), # Bottom point
        (cx + w*0.4, cy - h*0.1), # Right point
        (cx + w*0.0, cy - h*0.1), # Inner right
    ]
    
    draw.polygon(points, fill=(255, 255, 255, 255))

    return img

os.makedirs("public/icons", exist_ok=True)

for size in [16, 48, 128]:
    img = create_icon(size)
    img.save(f"public/icons/icon-{size}.png")
    print(f"Created icon-{size}.png")

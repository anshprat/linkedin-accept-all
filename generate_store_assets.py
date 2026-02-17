#!/usr/bin/env python3
"""Generate Chrome Web Store listing assets (24-bit PNG, no alpha)."""

import struct
import zlib
import math

STORE_DIR = "store"
LINKEDIN_BLUE = (10, 102, 194)
DARK_BLUE = (0, 65, 130)
WHITE = (255, 255, 255)
LIGHT_GRAY = (245, 245, 245)
GRAY = (200, 200, 200)
DARK_GRAY = (100, 100, 100)
TEXT_DARK = (51, 51, 51)


def write_png_rgb(filename, width, height, pixels):
    """Write a 24-bit PNG (no alpha) from a flat list of (r, g, b) per pixel."""
    raw_rows = []
    for y in range(height):
        row = bytearray([0])  # filter byte
        for x in range(width):
            r, g, b = pixels[y * width + x]
            row.extend([r, g, b])
        raw_rows.append(bytes(row))

    raw = b"".join(raw_rows)

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack(">I", len(data)) + c + crc

    # color_type=2 means RGB (no alpha)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", ihdr)
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")

    with open(filename, "wb") as f:
        f.write(png)


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def dist(x1, y1, x2, y2):
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)


def dist_to_segment(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return dist(px, py, x1, y1)
    t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    return dist(px, py, x1 + t * dx, y1 + t * dy)


def draw_circle(pixels, width, cx, cy, radius, color):
    """Draw a filled circle."""
    r2 = radius * radius
    for y in range(max(0, int(cy - radius - 1)), min(len(pixels) // width, int(cy + radius + 2))):
        for x in range(max(0, int(cx - radius - 1)), min(width, int(cx + radius + 2))):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if d2 <= r2:
                pixels[y * width + x] = color


def draw_checkmark(pixels, width, cx, cy, size, color, thickness):
    """Draw a checkmark centered at (cx, cy)."""
    # Checkmark points relative to center
    left = (cx - size * 0.22, cy + size * 0.02)
    bottom = (cx - size * 0.05, cy + size * 0.22)
    right = (cx + size * 0.28, cy - size * 0.2)

    for y in range(int(cy - size * 0.3), int(cy + size * 0.35)):
        for x in range(int(cx - size * 0.35), int(cx + size * 0.4)):
            if 0 <= x < width and 0 <= y < len(pixels) // width:
                d1 = dist_to_segment(x, y, left[0], left[1], bottom[0], bottom[1])
                d2 = dist_to_segment(x, y, bottom[0], bottom[1], right[0], right[1])
                if min(d1, d2) < thickness:
                    pixels[y * width + x] = color


def draw_icon(pixels, width, cx, cy, radius):
    """Draw the extension icon (blue circle + white checkmark)."""
    draw_circle(pixels, width, cx, cy, radius, LINKEDIN_BLUE)
    draw_checkmark(pixels, width, cx, cy, radius * 1.1, WHITE, radius * 0.12)


def draw_rect(pixels, width, x1, y1, x2, y2, color):
    """Draw a filled rectangle."""
    h = len(pixels) // width
    for y in range(max(0, int(y1)), min(h, int(y2))):
        for x in range(max(0, int(x1)), min(width, int(x2))):
            pixels[y * width + x] = color


def draw_rounded_rect(pixels, width, x1, y1, x2, y2, radius, color):
    """Draw a filled rounded rectangle."""
    h = len(pixels) // width
    for y in range(max(0, int(y1)), min(h, int(y2))):
        for x in range(max(0, int(x1)), min(width, int(x2))):
            # Check corners
            in_rect = True
            for cx, cy in [(x1 + radius, y1 + radius), (x2 - radius, y1 + radius),
                           (x1 + radius, y2 - radius), (x2 - radius, y2 - radius)]:
                if ((x < x1 + radius or x > x2 - radius) and
                    (y < y1 + radius or y > y2 - radius)):
                    if dist(x, y, cx, cy) > radius:
                        in_rect = False
                        break
            if in_rect:
                pixels[y * width + x] = color


def draw_horizontal_line(pixels, width, x1, x2, y, color, thickness=1):
    h = len(pixels) // width
    for dy in range(thickness):
        yy = int(y) + dy
        if 0 <= yy < h:
            for x in range(max(0, int(x1)), min(width, int(x2))):
                pixels[yy * width + x] = color


def draw_text_block(pixels, width, x, y, block_w, block_h, color):
    """Draw a solid rectangle representing a text block."""
    draw_rounded_rect(pixels, width, x, y, x + block_w, y + block_h, block_h // 2, color)


# ─── 1. Store icon 128x128 ───
def generate_store_icon():
    w, h = 128, 128
    pixels = [WHITE] * (w * h)
    draw_icon(pixels, w, 64, 64, 56)
    write_png_rgb(f"{STORE_DIR}/icon128.png", w, h, pixels)
    print("  store/icon128.png (128x128)")


# ─── 2. Screenshot 1280x800 ───
def generate_screenshot():
    w, h = 1280, 800
    pixels = [LIGHT_GRAY] * (w * h)

    # LinkedIn-like header bar
    draw_rect(pixels, w, 0, 0, w, 60, LINKEDIN_BLUE)

    # Simulated page content area (centered card)
    card_x, card_w = 200, 500
    card_y, card_h = 100, 640
    draw_rounded_rect(pixels, w, card_x, card_y, card_x + card_w, card_y + card_h, 12, WHITE)

    # "Invitations" title bar
    draw_text_block(pixels, w, card_x + 30, card_y + 25, 160, 16, TEXT_DARK)

    # Invitation rows
    for i in range(5):
        row_y = card_y + 70 + i * 110
        # Avatar circle
        draw_circle(pixels, w, card_x + 55, row_y + 30, 22, GRAY)
        # Name text block
        draw_text_block(pixels, w, card_x + 90, row_y + 15, 140, 12, TEXT_DARK)
        # Subtitle text block
        draw_text_block(pixels, w, card_x + 90, row_y + 35, 200, 10, DARK_GRAY)
        # Accept button
        draw_rounded_rect(pixels, w, card_x + 350, row_y + 15, card_x + 440, row_y + 45, 15, LINKEDIN_BLUE)
        # Ignore button outline
        draw_rounded_rect(pixels, w, card_x + 290, row_y + 15, card_x + 340, row_y + 45, 15, GRAY)

    # Extension popup (right side)
    popup_x, popup_w = 780, 320
    popup_y, popup_h = 80, 480
    # Shadow
    draw_rounded_rect(pixels, w, popup_x + 4, popup_y + 4, popup_x + popup_w + 4, popup_y + popup_h + 4, 12, (210, 210, 210))
    # Popup body
    draw_rounded_rect(pixels, w, popup_x, popup_y, popup_x + popup_w, popup_y + popup_h, 12, WHITE)

    # Popup header area
    draw_text_block(pixels, w, popup_x + 20, popup_y + 20, 180, 16, LINKEDIN_BLUE)

    # Status text
    draw_text_block(pixels, w, popup_x + 20, popup_y + 55, 220, 10, DARK_GRAY)

    # Accept All button
    draw_rounded_rect(pixels, w, popup_x + 20, popup_y + 85, popup_x + popup_w - 20, popup_y + 125, 22, LINKEDIN_BLUE)

    # Stats section
    draw_horizontal_line(pixels, w, popup_x + 20, popup_x + popup_w - 20, popup_y + 150, (224, 224, 224), 1)
    draw_text_block(pixels, w, popup_x + 20, popup_y + 165, 50, 11, DARK_GRAY)
    draw_text_block(pixels, w, popup_x + 20, popup_y + 190, 70, 10, TEXT_DARK)
    draw_text_block(pixels, w, popup_x + 250, popup_y + 190, 30, 10, LINKEDIN_BLUE)
    draw_text_block(pixels, w, popup_x + 20, popup_y + 210, 60, 10, TEXT_DARK)
    draw_text_block(pixels, w, popup_x + 250, popup_y + 210, 25, 10, LINKEDIN_BLUE)

    # Recent section
    draw_text_block(pixels, w, popup_x + 20, popup_y + 240, 60, 11, DARK_GRAY)
    for i in range(6):
        ry = popup_y + 265 + i * 30
        draw_text_block(pixels, w, popup_x + 20, ry, 120, 10, LINKEDIN_BLUE)
        draw_text_block(pixels, w, popup_x + 240, ry, 40, 8, (153, 153, 153))
        draw_horizontal_line(pixels, w, popup_x + 20, popup_x + popup_w - 20, ry + 20, (240, 240, 240), 1)

    # Extension icon in the toolbar area
    draw_icon(pixels, w, popup_x + popup_w // 2, popup_y - 15, 14)

    write_png_rgb(f"{STORE_DIR}/screenshot_1280x800.png", w, h, pixels)
    print("  store/screenshot_1280x800.png (1280x800)")


# ─── 3. Small promo tile 440x280 ───
def generate_small_promo():
    w, h = 440, 280
    # Gradient background
    pixels = []
    for y in range(h):
        t = y / h
        for x in range(w):
            pixels.append(lerp_color(LINKEDIN_BLUE, DARK_BLUE, t))

    # Icon
    draw_icon(pixels, w, 220, 100, 50)

    # Text blocks representing "LinkedIn Accept All"
    draw_text_block(pixels, w, 110, 175, 220, 16, WHITE)
    # Subtitle
    draw_text_block(pixels, w, 100, 205, 240, 10, (180, 210, 240))
    # Second subtitle line
    draw_text_block(pixels, w, 130, 225, 180, 10, (180, 210, 240))

    write_png_rgb(f"{STORE_DIR}/promo_small_440x280.png", w, h, pixels)
    print("  store/promo_small_440x280.png (440x280)")


# ─── 4. Marquee promo tile 1400x560 ───
def generate_marquee_promo():
    w, h = 1400, 560
    # Gradient background
    pixels = []
    for y in range(h):
        t = y / h
        for x in range(w):
            tx = x / w
            c = lerp_color(
                lerp_color(LINKEDIN_BLUE, DARK_BLUE, t),
                lerp_color((20, 120, 210), DARK_BLUE, t),
                tx,
            )
            pixels.append(c)

    # Large icon on the left
    draw_icon(pixels, w, 350, 280, 120)

    # Text blocks on the right side
    # Title
    draw_text_block(pixels, w, 550, 180, 450, 28, WHITE)
    # Subtitle line 1
    draw_text_block(pixels, w, 550, 230, 520, 14, (180, 210, 240))
    # Subtitle line 2
    draw_text_block(pixels, w, 550, 260, 400, 14, (180, 210, 240))

    # Feature bullets
    bullet_y = 310
    for i in range(3):
        by = bullet_y + i * 40
        draw_circle(pixels, w, 565, by + 6, 5, WHITE)
        draw_text_block(pixels, w, 580, by, 300 - i * 30, 12, (220, 235, 250))

    write_png_rgb(f"{STORE_DIR}/promo_marquee_1400x560.png", w, h, pixels)
    print("  store/promo_marquee_1400x560.png (1400x560)")


if __name__ == "__main__":
    print("Generating Chrome Web Store assets...")
    generate_store_icon()
    generate_screenshot()
    generate_small_promo()
    generate_marquee_promo()
    print("Done!")

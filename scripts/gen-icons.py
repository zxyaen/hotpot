#!/usr/bin/env python3
"""
生成小程序 tabBar 图标 PNG（纯 Python，无第三方库）
图标尺寸：81x81（微信推荐），使用简单几何图形绘制
"""
import struct, zlib, os

OUT = "/data/workspace/hotpot-timer/miniprogram/assets/tabbar"
os.makedirs(OUT, exist_ok=True)

# ── PNG 工具 ──────────────────────────────────────────────────
def make_png(pixels, w, h):
    """pixels: list of (r,g,b,a) tuples, row-major"""
    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)

    raw = b''
    for y in range(h):
        raw += b'\x00'  # filter byte
        for x in range(w):
            r, g, b, a = pixels[y * w + x]
            raw += bytes([r, g, b, a])

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
                 .replace(struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0),
                          struct.pack('>II', w, h) + bytes([8, 6, 0, 0, 0])))
    ihdr = chunk(b'IHDR', struct.pack('>II', w, h) + bytes([8, 6, 0, 0, 0]))
    idat = chunk(b'IDAT', zlib.compress(raw, 9))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

# ── 画布工具 ───────────────────────────────────────────────────
SIZE = 81

def new_canvas():
    return [(0, 0, 0, 0)] * (SIZE * SIZE)

def set_pixel(canvas, x, y, color):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        canvas[y * SIZE + x] = color

def draw_circle(canvas, cx, cy, r, color, fill=True, thickness=3):
    for y in range(SIZE):
        for x in range(SIZE):
            dx, dy = x - cx, y - cy
            dist = (dx*dx + dy*dy) ** 0.5
            if fill:
                if dist <= r:
                    set_pixel(canvas, x, y, color)
            else:
                if r - thickness <= dist <= r:
                    set_pixel(canvas, x, y, color)

def draw_rect(canvas, x1, y1, x2, y2, color, fill=True, thickness=3):
    for y in range(y1, y2+1):
        for x in range(x1, x2+1):
            if fill:
                set_pixel(canvas, x, y, color)
            else:
                if x <= x1+thickness-1 or x >= x2-thickness+1 or y <= y1+thickness-1 or y >= y2-thickness+1:
                    set_pixel(canvas, x, y, color)

def draw_line(canvas, x1, y1, x2, y2, color, thickness=3):
    dx, dy = abs(x2-x1), abs(y2-y1)
    steps = max(dx, dy, 1)
    for i in range(steps+1):
        px = round(x1 + (x2-x1)*i/steps)
        py = round(y1 + (y2-y1)*i/steps)
        for ty in range(-thickness//2, thickness//2+1):
            for tx in range(-thickness//2, thickness//2+1):
                set_pixel(canvas, px+tx, py+ty, color)

def draw_rounded_rect(canvas, x1, y1, x2, y2, r, color, fill=True, thickness=3):
    """圆角矩形"""
    for y in range(y1, y2+1):
        for x in range(x1, x2+1):
            in_corner = False
            # 四个角圆弧判断
            corners = [(x1+r, y1+r), (x2-r, y1+r), (x1+r, y2-r), (x2-r, y2-r)]
            for i, (cx, cy) in enumerate(corners):
                # 仅在角落区域判断
                in_corner_area = (
                    (i==0 and x < x1+r and y < y1+r) or
                    (i==1 and x > x2-r and y < y1+r) or
                    (i==2 and x < x1+r and y > y2-r) or
                    (i==3 and x > x2-r and y > y2-r)
                )
                if in_corner_area:
                    dist = ((x-cx)**2+(y-cy)**2)**0.5
                    if fill:
                        if dist > r:
                            in_corner = True
                    else:
                        if dist > r or dist < r-thickness:
                            in_corner = True
                    break
            if in_corner:
                continue
            if fill:
                set_pixel(canvas, x, y, color)
            else:
                on_border = (
                    x <= x1+thickness-1 or x >= x2-thickness+1 or
                    y <= y1+thickness-1 or y >= y2-thickness+1
                )
                if on_border:
                    set_pixel(canvas, x, y, color)

def save(canvas, path):
    data = make_png(canvas, SIZE, SIZE)
    with open(path, 'wb') as f:
        f.write(data)
    print(f"  saved: {path}")

# ── 颜色 ──────────────────────────────────────────────────────
GRAY   = (153, 153, 153, 255)
RED    = (192, 57, 43,  255)

# ══════════════════════════════════════════════════════════════
# 图标 1：计时 ⏱  — 圆形表盘 + 时针分针
# ══════════════════════════════════════════════════════════════
def draw_timer(color):
    c = new_canvas()
    cx, cy = 40, 42
    # 表盘外圈
    draw_circle(c, cx, cy, 28, color, fill=False, thickness=4)
    # 分针（12点方向偏右）
    draw_line(c, cx, cy, cx+9, cy-20, color, thickness=3)
    # 时针（3点方向偏下）
    draw_line(c, cx, cy, cx+16, cy+5, color, thickness=3)
    # 中心点
    draw_circle(c, cx, cy, 3, color, fill=True)
    # 表冠
    draw_rect(c, cx-5, cy-72+2, cx+5, cy-72+8+2, color, fill=True)
    # 顶部耳朵
    draw_line(c, cx-8, 12, cx+8, 12, color, thickness=4)
    return c

# ══════════════════════════════════════════════════════════════
# 图标 2：食材 🥬  — 简单叶片/碗形
# ══════════════════════════════════════════════════════════════
def draw_foods(color):
    c = new_canvas()
    # 碗底弧
    draw_circle(c, 40, 38, 26, color, fill=False, thickness=4)
    # 遮住上半圆（透明覆盖）
    for y in range(0, 38):
        for x in range(0, SIZE):
            c[y * SIZE + x] = (0, 0, 0, 0)
    # 碗口横线
    draw_line(c, 14, 38, 66, 38, color, thickness=4)
    # 两根筷子（斜线）
    draw_line(c, 28, 8, 22, 36, color, thickness=3)
    draw_line(c, 40, 6, 34, 36, color, thickness=3)
    return c

# ══════════════════════════════════════════════════════════════
# 图标 3：历史 📋  — 卷轴/文档 + 时钟箭头
# ══════════════════════════════════════════════════════════════
def draw_history(color):
    c = new_canvas()
    # 文档矩形
    draw_rounded_rect(c, 16, 10, 65, 70, 6, color, fill=False, thickness=4)
    # 三条横线（文字）
    draw_line(c, 25, 28, 56, 28, color, thickness=3)
    draw_line(c, 25, 40, 56, 40, color, thickness=3)
    draw_line(c, 25, 52, 46, 52, color, thickness=3)
    # 右上角折角
    draw_line(c, 52, 10, 65, 22, color, thickness=3)
    draw_line(c, 52, 10, 52, 22, color, thickness=3)
    draw_line(c, 52, 22, 65, 22, color, thickness=3)
    # 清除折角内部
    for y in range(11, 22):
        for x in range(53, 65):
            c[y * SIZE + x] = (0, 0, 0, 0)
    return c

# ══════════════════════════════════════════════════════════════
# 图标 4：设置 ⚙  — 齿轮
# ══════════════════════════════════════════════════════════════
def draw_settings(color):
    import math
    c = new_canvas()
    cx, cy = 40, 40
    R_outer = 30  # 齿轮外径
    R_inner = 22  # 齿轮内径
    R_hole  = 10  # 中心孔

    teeth = 8
    for y in range(SIZE):
        for x in range(SIZE):
            dx, dy = x - cx, y - cy
            dist = (dx*dx + dy*dy) ** 0.5
            angle = math.atan2(dy, dx)
            # 齿轮齿：在 R_inner ~ R_outer 之间，按角度交替
            tooth_angle = (angle % (2*math.pi/teeth)) / (2*math.pi/teeth)
            in_tooth = (tooth_angle < 0.5)
            r_edge = R_outer if in_tooth else R_inner

            if dist <= R_hole:
                continue  # 中心孔镂空
            elif dist <= R_inner - 1:
                set_pixel(c, x, y, color)
            elif dist <= r_edge:
                set_pixel(c, x, y, color)

    # 中心孔描边
    draw_circle(c, cx, cy, R_hole, color, fill=False, thickness=3)
    return c

# ── 生成并保存 ─────────────────────────────────────────────────
icons = [
    ("timer",    draw_timer),
    ("foods",    draw_foods),
    ("history",  draw_history),
    ("settings", draw_settings),
]

for name, fn in icons:
    print(f"\n[{name}]")
    save(fn(GRAY), f"{OUT}/{name}.png")
    save(fn(RED),  f"{OUT}/{name}-active.png")

print("\n✅ 所有图标生成完成！")

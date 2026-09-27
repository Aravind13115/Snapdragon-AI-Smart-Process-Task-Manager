# -*- coding: utf-8 -*-
"""
Premium SVG badge generator.
Preserves every original path byte-for-byte; only wraps the artwork in a
metallic gradient + drop-shadow filter + dark rounded badge background.
"""
import re
import math
import os

NUM = r'[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?'
CMDPAT = r'[MmLlHhVvCcSsQqTtAaZz]'
PARAMS = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'C': 6, 'S': 4, 'Q': 4, 'T': 2, 'A': 7, 'Z': 0}


def segments(d):
    """Tokenize a path 'd' string into (command, [numbers]) segments."""
    tokens = re.findall(CMDPAT + r'|' + NUM, d)
    segs = []
    i = 0
    cmd = None
    while i < len(tokens):
        t = tokens[i]
        if re.fullmatch(CMDPAT, t):
            cmd = t
            i += 1
            if cmd in 'Zz':
                segs.append((cmd, []))
                cmd = None
                continue
        if cmd is None:
            raise ValueError('number before command: ' + t)
        n = PARAMS[cmd.upper()]
        nums = []
        while i < len(tokens) and len(nums) < n:
            tok = tokens[i]
            if re.fullmatch(CMDPAT, tok):
                break
            nums.append(float(tok))
            i += 1
        if len(nums) != n:
            raise ValueError('bad params for %s: %s' % (cmd, nums))
        segs.append((cmd, nums))
        if cmd == 'M':
            cmd = 'L'
        elif cmd == 'm':
            cmd = 'l'
    return segs


def arc_points(x1, y1, rx, ry, rot, laf, sf, x2, y2, n=24):
    """Sample an elliptical arc (SVG F.6.5 endpoint->center conversion)."""
    if rx == 0 or ry == 0 or (x1 == x2 and y1 == y2):
        return [(x2, y2)]
    rx = abs(rx)
    ry = abs(ry)
    phi = math.radians(rot)
    cp, sp = math.cos(phi), math.sin(phi)
    dx = (x1 - x2) / 2.0
    dy = (y1 - y2) / 2.0
    x1p = cp * dx + sp * dy
    y1p = -sp * dx + cp * dy
    lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
    if lam > 1:
        s = math.sqrt(lam)
        rx *= s
        ry *= s
    num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
    den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    co = math.sqrt(max(0.0, num / den)) if den else 0.0
    if laf == sf:
        co = -co
    cxp = co * rx * y1p / ry
    cyp = -co * ry * x1p / rx
    cx = cp * cxp - sp * cyp + (x1 + x2) / 2.0
    cy = sp * cxp + cp * cyp + (y1 + y2) / 2.0

    def angle(ux, uy, vx, vy):
        dd = math.hypot(ux, uy) * math.hypot(vx, vy)
        c = (ux * vx + uy * vy) / dd if dd else 0.0
        c = max(-1.0, min(1.0, c))
        a = math.acos(c)
        return -a if (ux * vy - uy * vx) < 0 else a

    th1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dth = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not sf and dth > 0:
        dth -= 2 * math.pi
    if sf and dth < 0:
        dth += 2 * math.pi
    pts = []
    for k in range(1, n + 1):
        t = th1 + dth * k / n
        x = cx + rx * math.cos(t) * cp - ry * math.sin(t) * sp
        y = cy + rx * math.cos(t) * sp + ry * math.sin(t) * cp
        pts.append((x, y))
    return pts


def path_points(d):
    """All significant points of a path (control-point hull + arc samples)."""
    segs = segments(d)
    x = y = 0.0
    sx = sy = 0.0
    prev_c2 = None
    pts = []

    def add(px, py):
        pts.append((px, py))

    for cmd, nums in segs:
        rel = cmd.islower()
        c = cmd.upper()
        if c == 'M':
            x = x + nums[0] if rel else nums[0]
            y = y + nums[1] if rel else nums[1]
            sx, sy = x, y
            add(x, y)
            prev_c2 = None
        elif c == 'L':
            x = x + nums[0] if rel else nums[0]
            y = y + nums[1] if rel else nums[1]
            add(x, y)
            prev_c2 = None
        elif c == 'H':
            x = x + nums[0] if rel else nums[0]
            add(x, y)
            prev_c2 = None
        elif c == 'V':
            y = y + nums[0] if rel else nums[0]
            add(x, y)
            prev_c2 = None
        elif c == 'C':
            p = [(nums[0], nums[1]), (nums[2], nums[3]), (nums[4], nums[5])]
            if rel:
                p = [(x + a, y + b) for a, b in p]
            for px, py in p:
                add(px, py)
            prev_c2 = p[-2]
            x, y = p[-1]
        elif c == 'S':
            c1 = (2 * x - prev_c2[0], 2 * y - prev_c2[1]) if prev_c2 else (x, y)
            p = [c1, (nums[0], nums[1]), (nums[2], nums[3])]
            if rel:
                p = [(x + a, y + b) for a, b in p]
            for px, py in p:
                add(px, py)
            prev_c2 = p[-2]
            x, y = p[-1]
        elif c == 'Q':
            p = [(nums[0], nums[1]), (nums[2], nums[3])]
            if rel:
                p = [(x + a, y + b) for a, b in p]
            for px, py in p:
                add(px, py)
            prev_c2 = p[-2]
            x, y = p[-1]
        elif c == 'T':
            c1 = (2 * x - prev_c2[0], 2 * y - prev_c2[1]) if prev_c2 else (x, y)
            end = (nums[0], nums[1])
            if rel:
                end = (x + end[0], y + end[1])
            add(*c1)
            add(*end)
            prev_c2 = c1
            x, y = end
        elif c == 'A':
            rx, ry, rot, laf, sf = nums[0], nums[1], nums[2], nums[3], nums[4]
            end = (nums[5], nums[6])
            if rel:
                end = (x + end[0], y + end[1])
            for px, py in arc_points(x, y, rx, ry, rot, int(laf), int(sf), end[0], end[1]):
                add(px, py)
            prev_c2 = None
            x, y = end
        elif c == 'Z':
            x, y = sx, sy
            prev_c2 = None
    return pts


def content_bbox(text, view_h):
    """Bounding box of all path artwork, in original viewBox coordinates."""
    xs, ys = [], []
    for pm in re.finditer(r'<path d="([^"]+)"', text):
        for px, py in path_points(pm.group(1)):
            xs.append(0.1 * px)
            ys.append(view_h - 0.1 * py)
    return min(xs), min(ys), max(xs), max(ys)


def fmt(v):
    """Compact number formatting for transform attributes."""
    s = ('%.4f' % v).rstrip('0').rstrip('.')
    return s if s not in ('-0', '') else '0'


def build(src_path, out_path, brand, metal_stops):
    with open(src_path, 'r', encoding='utf-8') as f:
        text = f.read()

    gm = re.search(r'<g transform="translate\(0\.000000,([\d.]+)\) scale\(0\.100000,-0\.100000\)"', text)
    if not gm:
        raise ValueError('inner group transform not found in ' + src_path)
    view_h = float(gm.group(1))

    bx1, by1, bx2, by2 = content_bbox(text, view_h)
    w, h = bx2 - bx1, by2 - by1

    B = 1200.0          # badge viewBox size (square)
    PAD = 90.0          # padding inside the badge
    s = min((B - 2 * PAD) / w, (B - 2 * PAD) / h)
    tx = (B - w * s) / 2.0 - s * bx1
    ty = (B - h * s) / 2.0 - s * by1

    # Gradient spans the fitted logo bbox, in badge (viewBox) coordinates.
    gx1, gy1 = tx + s * bx1, ty + s * by1
    gx2, gy2 = tx + s * bx2, ty + s * by2

    stops = '\n      '.join(
        '<stop offset="%s" stop-color="%s"/>' % (fmt(o), c) for c, o in metal_stops
    )

    header = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">\n'
        '  <title>%s</title>\n'
        '  <defs>\n'
        '    <linearGradient id="metal" gradientUnits="userSpaceOnUse" x1="%s" y1="%s" x2="%s" y2="%s">\n'
        '      %s\n'
        '    </linearGradient>\n'
        '    <linearGradient id="badgeBg" x1="0" y1="0" x2="0" y2="1200">\n'
        '      <stop offset="0" stop-color="#171717"/>\n'
        '      <stop offset="0.5" stop-color="#111111"/>\n'
        '      <stop offset="1" stop-color="#0b0b0b"/>\n'
        '    </linearGradient>\n'
        '    <filter id="shadow" x="-20%%" y="-20%%" width="140%%" height="140%%">\n'
        '      <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#000000" flood-opacity="0.55"/>\n'
        '    </filter>\n'
        '  </defs>\n'
        '  <rect x="0" y="0" width="1200" height="1200" rx="130" fill="url(#badgeBg)" stroke="#2b2b2b" stroke-width="3"/>\n'
        '  <g filter="url(#shadow)" fill="url(#metal)">\n'
        '    <g transform="translate(%s,%s) scale(%s)">\n'
        '      <g transform="translate(0.000000,%s) scale(0.100000,-0.100000)" stroke="none">' % (
            brand, fmt(gx1), fmt(gy1), fmt(gx2), fmt(gy2), stops,
            fmt(tx), fmt(ty), fmt(s), fmt(view_h)
        )
    )

    # Replace everything up to and including the original opening <svg ...> tag.
    new_text, n = re.subn(r'^.*?<svg[^>]*>', header, text, count=1, flags=re.DOTALL)
    if n != 1:
        raise ValueError('opening svg tag not found in ' + src_path)

    # Remove the original inner group tag (its fill="#000000" would override
    # the metal gradient; the header already carries a replacement tag).
    new_text, n = re.subn(
        r'<g transform="translate\(0\.000000,[\d.]+\) scale\(0\.100000,-0\.100000\)"\s*fill="#000000"\s+stroke="none">\s*',
        '', new_text, count=1)
    if n != 1:
        raise ValueError('original inner group tag not found in ' + src_path)

    # Close the two wrapper groups before the final </g></svg>.
    stripped = new_text.rstrip()
    if not stripped.endswith('</g>\n</svg>'):
        raise ValueError('unexpected file ending in ' + src_path)
    new_text = stripped[:-len('</svg>')] + '    </g>\n  </g>\n</svg>\n'

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(new_text)

    print('%s: content bbox x[%s..%s] y[%s..%s]  (w=%s h=%s)  scale=%s translate=(%s,%s)' % (
        brand, fmt(bx1), fmt(bx2), fmt(by1), fmt(by2), fmt(w), fmt(h), fmt(s), fmt(tx), fmt(ty)))
    print('  -> wrote %s (%d bytes)' % (out_path, len(new_text)))


OUT_DIR = r'C:\Users\ariko\OneDrive\Desktop\snapdragon'

build(r'C:\Users\ariko\Downloads\1413537154733.svg',
      os.path.join(OUT_DIR, 'amd-logo-premium.svg'),
      'AMD',
      [('#f2f5f8', 0.00), ('#c7d0db', 0.16), ('#93a1b1', 0.34), ('#e2e8ef', 0.50),
       ('#7c8a9a', 0.66), ('#d5dce4', 0.82), ('#5f6d7c', 1.00)])

build(r'C:\Users\ariko\Downloads\images (1).svg',
      os.path.join(OUT_DIR, 'qualcomm-logo-premium.svg'),
      'Qualcomm',
      [('#f9ecc4', 0.00), ('#ecd28c', 0.18), ('#c39a4e', 0.36), ('#f5e3b0', 0.52),
       ('#a87e3a', 0.68), ('#ecd28f', 0.84), ('#8a6530', 1.00)])

build(r'C:\Users\ariko\Downloads\images.svg',
      os.path.join(OUT_DIR, 'snapdragon-logo-premium.svg'),
      'Snapdragon',
      [('#e88a72', 0.00), ('#c93a26', 0.20), ('#8e1d10', 0.40), ('#d84f36', 0.58),
       ('#6d130a', 0.75), ('#b03020', 0.90), ('#57100a', 1.00)])

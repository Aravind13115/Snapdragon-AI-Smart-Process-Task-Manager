# -*- coding: utf-8 -*-
"""Diagnostic: per-path bounding boxes to verify parser correctness."""
import re
import sys
from generate_badges import segments, NUM, CMDPAT

src = sys.argv[1]
text = open(src, 'r', encoding='utf-8').read()
gm = re.search(r'translate\(0\.000000,([\d.]+)\)', text)
view_h = float(gm.group(1))

for i, pm in enumerate(re.finditer(r'<path d="([^"]+)"', text)):
    d = pm.group(1)
    try:
        segs = segments(d)
    except Exception as e:
        print('PATH %d PARSE ERROR: %s' % (i, e))
        continue
    # check for weird commands
    cmds = set(c for c, _ in segs)
    xs, ys = [], []
    x = y = 0.0
    sx = sy = 0.0
    prev_c2 = None

    def add(px, py):
        xs.append(px)
        ys.append(py)

    for cmd, nums in segs:
        rel = cmd.islower()
        c = cmd.upper()
        if c == 'M':
            x = x + nums[0] if rel else nums[0]
            y = y + nums[1] if rel else nums[1]
            sx, sy = x, y
            add(x, y)
        elif c == 'L':
            x = x + nums[0] if rel else nums[0]
            y = y + nums[1] if rel else nums[1]
            add(x, y)
        elif c == 'H':
            x = x + nums[0] if rel else nums[0]
            add(x, y)
        elif c == 'V':
            y = y + nums[0] if rel else nums[0]
            add(x, y)
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
            add(*c1); add(*end)
            prev_c2 = c1
            x, y = end
        elif c == 'Z':
            x, y = sx, sy
    vx = [0.1 * v for v in xs]
    vy = [view_h - 0.1 * v for v in ys]
    flag = ''
    if max(vy) < 50 or min(vy) > view_h - 50 or max(vx) > 3000:
        flag = '  <-- EXTREME'
    print('path %2d cmds=%-22s vb x[%7.1f..%7.1f] y[%7.1f..%7.1f]%s' % (
        i, ''.join(sorted(cmds)), min(vx), max(vx), min(vy), max(vy), flag))

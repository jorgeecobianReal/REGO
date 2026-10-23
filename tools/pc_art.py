# Escenas de relleno para las postales (400x300, se recortan con "slice" para formatos verticales)
import math, json, os, random
HERE = os.path.dirname(os.path.abspath(__file__))
AVO = [(100, 10), (126, 10, 139, 38, 145, 74), (151, 109, 186, 136, 186, 190), (186, 241, 149, 272, 100, 272),
       (51, 272, 14, 241, 14, 190), (14, 136, 49, 109, 55, 74), (61, 38, 74, 10, 100, 10)]
AVO_D = "M100 10C126 10 139 38 145 74C151 109 186 136 186 190C186 241 149 272 100 272C51 272 14 241 14 190C14 136 49 109 55 74C61 38 74 10 100 10Z"
f = lambda v: ('%.1f' % v).rstrip('0').rstrip('.') if abs(v) >= .05 else '0'

def smooth(pts):
    d = 'M%s %s' % (f(pts[0][0]), f(pts[0][1]))
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i else pts[i]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[i + 2] if i + 2 < len(pts) else p2
        d += 'C%s %s %s %s %s %s' % (f(p1[0] + (p2[0] - p0[0]) / 6), f(p1[1] + (p2[1] - p0[1]) / 6), f(p2[0] - (p3[0] - p1[0]) / 6), f(p2[1] - (p3[1] - p1[1]) / 6), f(p2[0]), f(p2[1]))
    return d

def closed(pts):
    n = len(pts); d = 'M%s %s' % (f(pts[0][0]), f(pts[0][1]))
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        d += 'C%s %s %s %s %s %s' % (f(p1[0] + (p2[0] - p0[0]) / 6), f(p1[1] + (p2[1] - p0[1]) / 6), f(p2[0] - (p3[0] - p1[0]) / 6), f(p2[1] - (p3[1] - p1[1]) / 6), f(p2[0]), f(p2[1]))
    return d + 'Z'

def tree(x, y, s, rnd):
    rx, ry, cy = 5.2 + rnd.random() * .9, 4 + rnd.random() * .7, -7.4 - rnd.random() * .5
    f1, f2 = rnd.random() * 6.3, rnd.random() * 6.3
    pts = []
    for k in range(18):
        a = k / 18 * math.pi * 2
        w = 1 + .11 * math.sin(5 * a + f1) + .05 * math.sin(9 * a + f2)
        yy = math.sin(a) * ry * w
        pts.append((x + math.cos(a) * rx * w * s, y + (cy + (yy * .78 if yy > 0 else yy)) * s))
    lean = (rnd.random() - .5) * .5
    trunk = 'M%s %sL%s %sH%sL%s %sZ' % (f(x - .55 * s), f(y), f(x + (lean - .3) * s), f(y - 4.4 * s), f(x + (lean + .3) * s), f(x + .55 * s), f(y))
    return trunk + closed(pts)

_vr = random.Random(5)
VARIANTS = [tree(0, 0, 1, _vr) for _ in range(4)]
def tree_use(x, y, s, rnd):
    return '<use href="#T%d" transform="translate(%s %s) scale(%s)"/>' % (rnd.randrange(4), f(x), f(y), ('%.2f' % s).rstrip('0').rstrip('.'))

def cubic(p0, c1, c2, p1, n=14):
    out = []
    for i in range(1, n + 1):
        t = i / n; u = 1 - t
        out.append((u**3 * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t**3 * p1[0], u**3 * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t**3 * p1[1]))
    return out

POLY = [AVO[0]]
cur = AVO[0]
for seg in AVO[1:]:
    POLY += cubic(cur, seg[0:2], seg[2:4], seg[4:6]); cur = seg[4:6]

def inside(x, y, poly=POLY):
    c = False; n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c

def avo_tf(cx, cy, s, rot):
    a = math.radians(rot)
    return lambda x, y: (cx + ((x - 100) * math.cos(a) - (y - 141) * math.sin(a)) * s, cy + ((x - 100) * math.sin(a) + (y - 141) * math.cos(a)) * s)

def stipple(tf, n, rnd, r0=.5, r1=1.0, bias=1.1):
    small = ''; big = ''; k = 0; tries = 0
    while k < n and tries < n * 10:
        tries += 1
        x, y = 14 + rnd.random() * 172, 12 + rnd.random() * 258
        if not inside(x, y): continue
        sh = min(1, max(0, ((x - 70) / 116) * .55 + ((y - 110) / 162) * .65))
        if rnd.random() > sh * sh * bias + .05: continue
        X, Y = tf(x, y)
        if rnd.random() < .7: small += 'M%s %sh0' % (f(X), f(Y))
        else: big += 'M%s %sh0' % (f(X), f(Y))
        k += 1
    return (small, big)

def avo_g(cx, cy, s, rot, extra=''):
    return '<path class="pc-line" transform="translate(%s %s) rotate(%s) scale(%s) translate(-100 -141)" d="%s"%s/>' % (f(cx), f(cy), f(rot), f(s), AVO_D, extra)

def leaf(b, t, w, bend=0.0):
    bx, by = b; tx, ty = t; dx, dy = tx - bx, ty - by; L = math.hypot(dx, dy); nx, ny = -dy / L, dx / L
    P = lambda a, s: (bx + dx * a + nx * w * s + nx * bend * L * math.sin(math.pi * a), by + dy * a + ny * w * s + ny * bend * L * math.sin(math.pi * a))
    c1, c2, c3, c4 = P(.22, 1.15), P(.68, .95), P(.68, -.9), P(.22, -1.05)
    o = 'M%s %sC%s %s %s %s %s %sC%s %s %s %s %s %sZ' % (f(bx), f(by), f(c1[0]), f(c1[1]), f(c2[0]), f(c2[1]), f(tx), f(ty), f(c3[0]), f(c3[1]), f(c4[0]), f(c4[1]), f(bx), f(by))
    m1, m2 = P(.35, .06), P(.7, .04)
    rib = 'M%s %sC%s %s %s %s %s %s' % (f(bx), f(by), f(m1[0]), f(m1[1]), f(m2[0]), f(m2[1]), f(tx), f(ty))
    return o, rib

def ribbon(axis, widths):
    def side(sign):
        out = []
        for k, (x, y) in enumerate(axis):
            a = axis[max(0, k - 1)]; b = axis[min(len(axis) - 1, k + 1)]
            dx, dy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dy) or 1
            out.append((x - dy / l * widths[k] / 2 * sign, y + dx / l * widths[k] / 2 * sign))
        return out
    L, R = side(1), side(-1)[::-1]
    return smooth(L) + 'L' + smooth(R)[1:] + 'Z'

def wrap(body, key):
    defs = ''
    if '#T' in body:
        defs = '<defs>' + ''.join('<path id="pc-%s-t%d" d="%s"/>' % (key, k, v) for k, v in enumerate(VARIANTS)) + '</defs>'
        for k in range(4): body = body.replace('#T%d"' % k, '#pc-%s-t%d"' % (key, k))
    return '<svg class="pc-art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + defs + '<rect class="pc-bg" width="400" height="300"/>' + body + '</svg>'

def ridge(y0, amp, ph, x0=-20, x1=420, step=20, fn=None):
    return [(x, y0 + amp * math.sin(x / 70 + ph) + (fn(x) if fn else 0)) for x in range(x0, x1 + 1, step)]

S = {}

# A. O rego entre os campos
rnd = random.Random(3)
b = ''
far = ridge(96, 9, .8, fn=lambda x: -18 * math.exp(-((x - 120) / 90) ** 2) - 12 * math.exp(-((x - 320) / 70) ** 2))
b += '<path class="pc-line pc-soft" d="%s"/>' % smooth(far)
mid = ridge(122, 6, 2.1, fn=lambda x: 10 * math.exp(-((x - 205) / 40) ** 2))
b += '<path class="pc-line" d="%s"/>' % smooth(mid)
sx = lambda t: 205 - t * 95 + math.sin(t * 5.2) * 20 * (.3 + t)
for k, yb in enumerate([150, 172, 198, 228, 262]):
    pts = []
    for x in range(-20, 421, 16):
        t = (yb - 120) / 190
        notch = -(4 + k * 2.4) * math.exp(-((x - sx(t)) / (10 + k * 5)) ** 2)
        pts.append((x, yb + 4 * math.sin(x / 80 + k) + notch))
    b += '<path class="pc-line pc-fine" d="%s"/>' % smooth(pts)
axis = [(sx(t), 122 + t * 190) for t in [i / 40 for i in range(41)]]
b += '<path class="pc-water" d="%s"/>' % ribbon(axis, [1 + 15 * (i / 40) ** 1.3 for i in range(41)])
b += '<path class="pc-glint" d="%s"/>' % smooth(axis[12:])
tr = ''
for x in list(range(24, 170, 20)) + list(range(246, 392, 20)):
    yy = [p[1] for p in mid if abs(p[0] - x) <= 10][0]
    tr += tree_use(x + rnd.uniform(-3, 3), yy - .5, .75, rnd)
for x, y, s in [(60, 196, 1.5), (96, 222, 1.8), (300, 168, 1.3), (338, 200, 1.6), (372, 236, 1.9), (30, 262, 2.1)]:
    tr += tree_use(x, y, s, rnd)
b += '<g class="pc-tree">%s</g>' % tr
S['rego'] = wrap(b, 'rego')

# B. Os socalcos da ladeira
rnd = random.Random(8)
b = ''; tr = ''
for k in range(7):
    y0 = 52 + k * 36
    top = [(x, y0 + 9 * math.sin(x / 95 + k * .7) - 6 * math.cos(x / 60)) for x in range(-20, 421, 20)]
    wall = [(x, y + 8 + k * .6) for x, y in top]
    b += '<path class="pc-line" d="%s"/><path class="pc-line pc-fine" d="%s"/>' % (smooth(top), smooth(wall))
    st = ''
    for x in range(-10, 410, 9 + k):
        yy = top[min(len(top) - 1, max(0, (x + 20) // 20))][1]
        st += 'M%s %sl%s 0' % (f(x + rnd.uniform(0, 4)), f(yy + 4 + k * .3 + rnd.uniform(-1, 1)), f(4 + rnd.uniform(0, 3)))
    b += '<path class="pc-line pc-fine" d="%s"/>' % st
    s = .7 + k * .2
    for x in range(int(6 + (k % 2) * 12 * s), 400, int(26 * s + 6)):
        yy = y0 + 9 * math.sin(x / 95 + k * .7) - 6 * math.cos(x / 60)
        tr += tree_use(x + rnd.uniform(-2, 2), yy - .5, s, rnd)
b += '<g class="pc-tree">%s</g>' % tr
S['socalcos'] = wrap(b, 'socalcos')

# C. Colleita a man: rama con aguacates colgando
rnd = random.Random(12)
b = ''
br = [(-20, 38), (60, 52), (140, 58), (220, 54), (300, 62), (420, 46)]
b += '<path class="pc-line pc-thick" d="%s"/>' % smooth(br)
b += '<path class="pc-line" d="%s"/>' % smooth([(150, 57), (180, 30), (215, 16), (250, 10)])
for bb, tt, w in [((40, 48), (-6, 120), 15), ((110, 56), (70, 128), 13), ((205, 18), (268, -20), 12), ((260, 58), (330, 120), 15), ((340, 56), (410, 104), 13), ((175, 34), (130, -10), 11)]:
    o, rib = leaf(bb, tt, w, .04)
    b += '<path class="pc-line pc-leaf" d="%s"/><path class="pc-line pc-fine" d="%s"/>' % (o, rib)
dots = ''
for cx, cy, s, rot, sx0 in [(150, 150, .42, 6, 152), (232, 168, .48, -4, 226), (300, 142, .38, 10, 296)]:
    tf = avo_tf(cx, cy, s, rot)
    top = tf(100, 10)
    b += '<path class="pc-line" d="M%s %sC%s %s %s %s %s %s"/>' % (f(sx0), f(58), f(sx0 - 2), f(top[1] - 18), f(top[0] + 3), f(top[1] - 6), f(top[0]), f(top[1]))
    b += avo_g(cx, cy, s, rot)
    d1, d2 = stipple(tf, 210, rnd)
    dots += '<path class="pc-dots" d="%s"/><path class="pc-dots pc-dots--big" d="%s"/>' % (d1, d2)
b += dots
S['colleita'] = wrap(b, 'colleita')

# D. Mañá de brétema
rnd = random.Random(21)
b = ''; tr_mid = ''; tr_front = ''
layers = [(118, 10, .3, 'pc-soft'), (150, 12, 1.4, 'pc-soft'), (182, 14, 2.6, ''), (226, 12, 3.9, '')]
for i, (y0, amp, ph, cls) in enumerate(layers):
    pts = ridge(y0, amp, ph, fn=lambda x, i=i: -26 * math.exp(-((x - (90 + i * 85)) / 90) ** 2))
    b += '<path class="pc-line %s" d="%s"/>' % (cls, smooth(pts))
    if i in (1, 2):
        band_top = [(x, y + 6) for x, y in pts]
        band_bot = [(x, y + 22 + 5 * math.sin(x / 40 + i)) for x, y in pts][::-1]
        b += '<path class="pc-fog" d="%s"/>' % (smooth(band_top) + 'L' + smooth(band_bot)[1:] + 'Z')
    if i == 2:
        for x in range(30, 380, 22): tr_mid += tree_use(x + rnd.uniform(-3, 3), [p[1] for p in pts if abs(p[0] - x) <= 10][0] - .5, .9, rnd)
    if i == 3:
        for x in range(14, 400, 30): tr_front += tree_use(x + rnd.uniform(-4, 4), [p[1] for p in pts if abs(p[0] - x) <= 10][0] - .5, 1.5, rnd)
b += '<circle class="pc-line pc-soft" cx="300" cy="78" r="22"/>'
b += '<g class="pc-tree pc-tree--far">%s</g><g class="pc-tree">%s</g>' % (tr_mid, tr_front)
b += '<path class="pc-fog" d="M-10 196C80 186 160 204 240 194S360 186 410 198V214C330 206 260 220 180 212S60 206 -10 216Z"/>'
S['bretema'] = wrap(b, 'bretema')

# E1. No seu punto: un aguacate sobre la mesa
rnd = random.Random(30)
b = '<path class="pc-line pc-fine" d="M-10 238H410"/>'
hatch = ''
for i in range(26):
    x = 150 + i * 5.2
    hatch += 'M%s 242l%s 10' % (f(x), f(-6))
b += '<path class="pc-line pc-fine" d="%s"/>' % hatch
tf = avo_tf(196, 150, .58, 14)
b += avo_g(196, 150, .58, 14)
top = tf(100, 10)
b += '<path class="pc-line" d="M%s %sC%s %s %s %s %s %s"/>' % (f(top[0]), f(top[1]), f(top[0] + 2), f(top[1] - 8), f(top[0] + 8), f(top[1] - 13), f(top[0] + 13), f(top[1] - 15))
d1, d2 = stipple(tf, 420, rnd)
b += '<path class="pc-dots" d="%s"/><path class="pc-dots pc-dots--big" d="%s"/>' % (d1, d2)
o, rib = leaf((262, 236), (360, 200), 18, .06)
b += '<path class="pc-line pc-leaf" d="%s"/><path class="pc-line pc-fine" d="%s"/>' % (o, rib)
S['punto'] = wrap(b, 'punto')

# E2. Na cociña: tabla con el aguacate abierto
rnd = random.Random(44)
b = '<ellipse class="pc-line pc-board" cx="200" cy="170" rx="168" ry="112"/>'
grain = ''
for k in range(7):
    ry = 18 + k * 13
    grain += 'M%s %sA%s %s 0 0 1 %s %s' % (f(200 - ry * 1.5), f(170), f(ry * 1.5), f(ry), f(200 + ry * 1.5), f(170))
b += '<path class="pc-line pc-fine pc-grain" d="%s"/>' % grain
for cx, cy, rot, pit in [(142, 166, -16, True), (262, 172, 18, False)]:
    tr = 'translate(%s %s) rotate(%s) scale(.46) translate(-100 -141)' % (f(cx), f(cy), f(rot))
    b += '<g transform="%s"><path class="pc-flesh" d="%s"/><path class="pc-skin" d="%s"/>' % (tr, AVO_D, AVO_D)
    b += '<circle class="%s" cx="100" cy="186" r="%s"/>' % ('pc-pit' if pit else 'pc-cavity', 38 if pit else 40)
    b += '<path class="pc-line" d="%s"/><circle class="pc-line" cx="100" cy="186" r="%s"/></g>' % (AVO_D, 38 if pit else 40)
b += '<path class="pc-line" d="M300 252L382 214C388 211 392 214 389 218L318 262Z"/><path class="pc-line" d="M300 252L276 266C270 269 268 276 274 278L318 262"/>'
salt = ''.join('M%s %sh.8' % (f(200 + rnd.uniform(-30, 30)), f(228 + rnd.uniform(-8, 8))) for _ in range(18))
b += '<path class="pc-line pc-salt" d="%s"/>' % salt
S['cocina'] = wrap(b, 'cocina')

# F. Orballo na finca
rnd = random.Random(55)
b = ''; tr = ''
for k in range(5):
    y0 = 108 + k * 40
    top = [(x, y0 + 8 * math.sin(x / 90 + k)) for x in range(-20, 421, 20)]
    b += '<path class="pc-line" d="%s"/><path class="pc-line pc-fine" d="%s"/>' % (smooth(top), smooth([(x, y + 7) for x, y in top]))
    s = .8 + k * .22
    for x in range(int(10 + (k % 2) * 14), 400, int(28 * s + 6)):
        tr += tree_use(x + rnd.uniform(-2, 2), y0 + 8 * math.sin(x / 90 + k) - .5, s, rnd)
b += '<g class="pc-tree">%s</g>' % tr
b += '<path class="pc-line pc-soft" d="%s"/>' % smooth(ridge(70, 8, 1.2))
rain = ''
for _ in range(190):
    x, y, L = rnd.uniform(-20, 420), rnd.uniform(-10, 300), rnd.uniform(7, 15)
    rain += 'M%s %sl%s %s' % (f(x), f(y), f(-L * .28), f(L))
b += '<path class="pc-line pc-rain" d="%s"/>' % rain
S['orballo'] = wrap(b, 'orballo')

# G. A costa
rnd = random.Random(66)
b = '<path class="pc-line" d="M-10 150H410"/>'
b += '<path class="pc-line" d="M262 150A30 30 0 0 1 322 150"/>'
refl = ''.join('M%s %sh%s' % (f(292 - w / 2), f(158 + i * 9), f(w)) for i, w in enumerate([44, 34, 26, 18, 12, 7]))
b += '<path class="pc-line pc-fine" d="%s"/>' % refl
waves = ''
for row in range(8):
    y = 168 + row ** 1.45 * 9
    sz = 4 + row * 1.6
    for x in range(int(-10 + (row % 2) * sz * 2), 420, int(sz * 4.2)):
        xx = x + rnd.uniform(-sz, sz)
        if 240 < xx < 345 and row < 5: continue
        waves += 'M%s %sq%s %s %s 0' % (f(xx), f(y), f(sz), f(-sz * .55), f(sz * 2))
b += '<path class="pc-line pc-fine" d="%s"/>' % waves
hill = [(-20, 96), (30, 92), (80, 104), (130, 124), (170, 146), (190, 152)]
b += '<path class="pc-hill" d="%sL190 152L-20 152Z"/><path class="pc-line" d="%s"/>' % (smooth(hill), smooth(hill))
tr = ''
for x in range(4, 160, 15):
    yy = min(hill, key=lambda p: abs(p[0] - x))[1]
    yy = 96 + (x / 170) ** 1.8 * 50
    tr += tree_use(x, yy - .5, .85, rnd)
b += '<g class="pc-tree">%s</g>' % tr
b += '<path class="pc-line pc-soft" d="M330 62q8 -6 16 0q8 -6 16 0M352 80q6 -4 12 0q6 -4 12 0"/>'
S['costa'] = wrap(b, 'costa')

# H. O aguacateiro
rnd = random.Random(77)
b = '<path class="pc-line" d="M-10 258C100 254 300 262 410 256"/>'
grass = ''.join('M%s %sl%s -%s' % (f(x), f(258), f(rnd.uniform(-2, 2)), f(rnd.uniform(3, 7))) for x in range(6, 400, 9))
b += '<path class="pc-line pc-fine" d="%s"/>' % grass
b += '<path class="pc-line" d="M190 258C192 230 192 206 186 182M210 258C208 232 210 206 218 180M190 214C178 200 162 192 146 186M207 204C224 192 240 186 256 182M196 192C196 176 200 160 202 146"/>'
can = []
for k in range(34):
    a = k / 34 * math.pi * 2
    w = 1 + .07 * math.sin(7 * a + 1) + .04 * math.sin(13 * a)
    yy = math.sin(a) * 82 * w
    can.append((200 + math.cos(a) * 138 * w, 118 + (yy * .72 if yy > 0 else yy)))
b += '<path class="pc-line" d="%s"/>' % closed(can)
tufts = ''
for _ in range(46):
    a = rnd.uniform(0, math.pi * 2); r = math.sqrt(rnd.random()) * .82
    x, y = 200 + math.cos(a) * 128 * r, 118 + math.sin(a) * 70 * r
    if y > 158 and abs(x - 200) < 40: continue
    tufts += 'M%s %sq%s %s %s 0' % (f(x - 5), f(y), f(5), f(-4), f(10))
b += '<path class="pc-line pc-fine" d="%s"/>' % tufts
fr = ''
for x, y, s, r in [(120, 150, .085, 6), (156, 168, .09, -4), (238, 166, .09, 8), (276, 150, .08, -6), (198, 172, .085, 2), (92, 128, .075, 10), (306, 126, .075, -8)]:
    fr += '<path class="pc-fruit" transform="translate(%s %s) rotate(%s) scale(%s) translate(-100 -141)" d="%s"/>' % (f(x), f(y), f(r), s, AVO_D)
b += fr
S['aguacateiro'] = wrap(b, 'aguacateiro')

json.dump(S, open(os.path.join(HERE, 'pc_art.json'), 'w'), ensure_ascii=False)
print({k: len(v) for k, v in S.items()})

# Rego dibujado para la sección O nome: cauce, orillas, hierba, piedras y la hoja que lo recorre
import math, json, os, random
HERE = os.path.dirname(os.path.abspath(__file__))
f = lambda v: ('%.1f' % v).rstrip('0').rstrip('.') if abs(v) >= .05 else '0'
def smooth(pts):
    d = 'M%s %s' % (f(pts[0][0]), f(pts[0][1]))
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i else pts[i]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[i + 2] if i + 2 < len(pts) else p2
        d += 'C%s %s %s %s %s %s' % (f(p1[0] + (p2[0] - p0[0]) / 6), f(p1[1] + (p2[1] - p0[1]) / 6), f(p2[0] - (p3[0] - p1[0]) / 6), f(p2[1] - (p3[1] - p1[1]) / 6), f(p2[0]), f(p2[1]))
    return d
rnd = random.Random(14)
W, H = 900, 160
X0 = 14
cy = lambda x: 84 + 17 * math.sin(x / 112 + .35) + 6 * math.sin(x / 38 + 1.7) * (.3 + x / W * .7)
wid = lambda x: 1.6 + 14 * ((x - X0) / (W - X0)) ** .85
xs = list(range(X0, W + 1, 6))
axis = [(x, cy(x)) for x in xs]
def side(sign, extra=0):
    out = []
    for k, (x, y) in enumerate(axis):
        a = axis[max(0, k - 1)]; b = axis[min(len(axis) - 1, k + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dy) or 1
        off = wid(x) / 2 + extra(x) if callable(extra) else wid(x) / 2 + extra
        out.append((x - dy / l * off * sign, y + dx / l * off * sign))
    return out
L, R = side(1), side(-1)
water = smooth(L) + 'L' + smooth(R[::-1])[1:] + 'Z'
bank_off = lambda x: 8 + 3 * math.sin(x / 47) + 5 * ((x - X0) / W)
B1 = side(1, bank_off); B2 = side(-1, bank_off)
# Orillas a tramos, como un surco abierto a mano
def broken(pts, rnd):
    d = ''; i = 0
    while i < len(pts) - 3:
        n = rnd.randint(6, 16)
        seg = pts[i:i + n]
        if len(seg) > 2: d += smooth(seg)
        i += n + rnd.randint(1, 2)
    return d
banks = broken(B1, rnd) + broken(B2, rnd)
# Matas de hierba en las orillas (crecen hacia arriba)
grass = ''
heads = []
for pts, side_sign in ((B1, 1), (B2, -1)):
    k = rnd.randint(2, 5)
    while k < len(pts) - 2:
        x, y = pts[k]
        reed = x > 300 and rnd.random() < .22
        n = rnd.choice((3, 4)) if reed else rnd.choice((2, 3, 3, 4)); h = rnd.uniform(13, 19) if reed else rnd.uniform(5, 10)
        for j in range(n):
            a = math.radians(-90 + (j - (n - 1) / 2) * rnd.uniform(14, 24))
            hh = h * rnd.uniform(.7, 1.1)
            cx, cyy = x + math.cos(a) * hh * .5, y + math.sin(a) * hh * .5 - 1
            tipx, tipy = x + math.cos(a) * hh, y + math.sin(a) * hh
            grass += 'M%s %sQ%s %s %s %s' % (f(x + (j - 1) * .8), f(y), f(cx), f(cyy), f(tipx), f(tipy))
            if reed and j == 1:
                heads.append('<ellipse class="rb-head" cx="%s" cy="%s" rx="1.1" ry="2.6" transform="rotate(%s %s %s)"/>' % (f(tipx), f(tipy - 1.6), f(math.degrees(a) + 90), f(tipx), f(tipy - 1.6)))
        k += rnd.randint(3, 7)
# Piedras pequeñas junto al agua
stones = ''
for _ in range(6):
    k = rnd.randrange(8, len(axis) - 4); pts = rnd.choice((L, R))
    x, y = pts[k]; y += (-2.5 if pts is L else 2.5)
    stones += '<ellipse class="rb-stone" cx="%s" cy="%s" rx="%s" ry="%s"/>' % (f(x), f(y), f(rnd.uniform(1.8, 3.2)), f(rnd.uniform(1.1, 1.8)))
XS = 585
ka = min(range(len(axis)), key=lambda k: abs(axis[k][0] - XS))
ax, ay = axis[ka]; bx, by = axis[ka + 1]
tx, ty = bx - ax, by - ay; tl = math.hypot(tx, ty); tx, ty = tx / tl, ty / tl
nx, ny = -ty, tx
span = wid(ax) / 2 + 9
poldras = ''; ripples = ''
for i, o in enumerate((-1, -.36, .3, .95)):
    px, py = ax + nx * span * o, ay + ny * span * o
    rx, ry = 4.6 - abs(o) * .6, 2.9
    poldras += '<ellipse class="rb-stone rb-poldra" cx="%s" cy="%s" rx="%s" ry="%s" transform="rotate(%s %s %s)"/>' % (f(px), f(py), f(rx), f(ry), f(math.degrees(math.atan2(ny, nx))), f(px), f(py))
    if -.8 < o < .8:
        for r in (7, 11):
            qx, qy = px + tx * r * .7, py + ty * r * .7
            ripples += 'M%s %sq%s %s %s %s' % (f(qx - ny * 3), f(qy + nx * 3), f(tx * 2.2), f(ty * 2.2), f(ny * 6), f(-nx * 6))
# Aguacateros pequeños en las orillas, como en la lámina de la finca
def tree(x, y, s, rnd):
    rx, ry, cyy = 5.2 + rnd.random() * .9, 4 + rnd.random() * .7, -7.4 - rnd.random() * .5
    f1, f2 = rnd.random() * 6.3, rnd.random() * 6.3
    pts = []
    for k in range(12):
        a = k / 12 * math.pi * 2
        w = 1 + .11 * math.sin(5 * a + f1) + .05 * math.sin(9 * a + f2)
        yy = math.sin(a) * ry * w
        pts.append((x + math.cos(a) * rx * w * s, y + (cyy + (yy * .78 if yy > 0 else yy)) * s))
    n = len(pts); d = 'M%s %s' % (f(pts[0][0]), f(pts[0][1]))
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        d += 'C%s %s %s %s %s %s' % (f(p1[0] + (p2[0] - p0[0]) / 6), f(p1[1] + (p2[1] - p0[1]) / 6), f(p2[0] - (p3[0] - p1[0]) / 6), f(p2[1] - (p3[1] - p1[1]) / 6), f(p2[0]), f(p2[1]))
    return 'M%s %sL%s %sH%sL%s %sZ' % (f(x - .55 * s), f(y), f(x - .3 * s), f(y - 4.4 * s), f(x + .3 * s), f(x + .55 * s), f(y)) + d + 'Z'
trees = ''
for x, up, s in ((96, 1, .95), (150, 1, 1.05), (262, -1, 1.1), (318, -1, 1.2), (690, 1, 1.15), (742, 1, 1.0), (796, 1, 1.25), (836, -1, 1.35)):
    k = min(range(len(axis)), key=lambda q: abs(axis[q][0] - x))
    # B2 es la orilla de arriba y B1 la de abajo: árboles detrás de la de arriba y delante de la de abajo
    by = B2[k][1] - 7 if up == 1 else B1[k][1] + 18
    trees += tree(x, by, s, rnd)

# Hoja de aguacate que bajará flotando (centrada en 0,0, apuntando a la derecha)
def leafpath(Lh, w):
    P = lambda a, s: (-Lh / 2 + Lh * a, w * s * math.sin(math.pi * a) ** .9)
    o = 'M%s 0C%s %s %s %s %s 0C%s %s %s %s %s 0Z' % (f(-Lh / 2), f(P(.25, 1.25)[0]), f(-w * 1.15), f(P(.7, 1)[0]), f(-w * .95), f(Lh / 2), f(P(.7, 1)[0]), f(w * .9), f(P(.25, 1)[0]), f(w * 1.05), f(-Lh / 2))
    rib = 'M%s 0L%s 0' % (f(-Lh / 2 - 2.5), f(Lh / 2 - 1))
    return o, rib
lo, lr = leafpath(22, 5.4)
lo2, lr2 = leafpath(17, 4.2)
axis_d = smooth(axis)
flow = smooth([p for p in axis if p[0] > 150])
svg = ('<svg class="rego-band" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-rego-band>' % (W, H) +
  '<defs><mask id="rb-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="%d" height="%d"><path class="rb-reveal" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round" d="%s"/></mask></defs>' % (W, H, axis_d) +
  '<path class="rb-bank" d="%s"/>' % banks +
  '<g mask="url(#rb-reveal)"><path class="rb-water" d="%s"/><path class="rb-flow rb-flow--a" d="%s"/><path class="rb-flow rb-flow--b" d="%s"/></g>' % (water, flow, flow) +
  '<path class="rb-ripple" d="%s"/>' % ripples +
  '<g class="rb-stones">%s%s</g>' % (stones, poldras) +
  '<path class="rb-tree" d="%s"/>' % trees +
  '<path class="rb-grass" d="%s"/>' % grass + '<g class="rb-heads">%s</g>' % ''.join(heads) +
  '<circle class="rb-source" cx="%s" cy="%s" r="2"/>' % (f(X0 - 2), f(cy(X0))) +
  '<path class="rb-axis" d="%s"/>' % axis_d +
  '<g class="rb-leaf" transform="translate(-40 -40)"><path class="rb-leaf__blade" d="%s"/><path class="rb-leaf__rib" d="%s"/></g>' % (lo, lr) +
  '<g class="rb-leaf" transform="translate(-40 -40)"><path class="rb-leaf__blade" d="%s"/><path class="rb-leaf__rib" d="%s"/></g>' % (lo2, lr2) +
  '</svg>')
json.dump({'band': svg}, open(os.path.join(HERE, 'rego_band.json'), 'w'))
print(len(svg))

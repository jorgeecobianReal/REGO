# Genera los SVG de las láminas (aguacate en rama, corte, variedades, guía)
import math, json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
AVO = "M100 10C126 10 139 38 145 74C151 109 186 136 186 190C186 241 149 272 100 272C51 272 14 241 14 190C14 136 49 109 55 74C61 38 74 10 100 10Z"
f = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')

def leaf(b, t, w, bend=0.0):
    bx, by = b; tx, ty = t
    dx, dy = tx - bx, ty - by
    L = math.hypot(dx, dy); nx, ny = -dy / L, dx / L
    P = lambda a, s: (bx + dx * a + nx * w * s + nx * bend * L * math.sin(math.pi * a), by + dy * a + ny * w * s + ny * bend * L * math.sin(math.pi * a))
    c1, c2 = P(.22, 1.15), P(.68, .95)
    c3, c4 = P(.68, -.9), P(.22, -1.05)
    out = 'M%s %sC%s %s %s %s %s %sC%s %s %s %s %s %sZ' % (f(bx), f(by), f(c1[0]), f(c1[1]), f(c2[0]), f(c2[1]), f(tx), f(ty), f(c3[0]), f(c3[1]), f(c4[0]), f(c4[1]), f(bx), f(by))
    m1, m2 = P(.35, .06), P(.7, .04)
    rib = 'M%s %sC%s %s %s %s %s %s' % (f(bx), f(by), f(m1[0]), f(m1[1]), f(m2[0]), f(m2[1]), f(tx), f(ty))
    veins = []
    for a in (.24, .38, .52, .66, .8):
        prof = math.sin(math.pi * min(a + .1, .95)) ** .8
        for sg in (1, -1):
            p = P(a, .04 * sg)
            c = P(a + .05, .4 * sg * prof)
            q = P(min(a + .15, .96), .66 * sg * prof)
            veins.append('M%s %sQ%s %s %s %s' % (f(p[0]), f(p[1]), f(c[0]), f(c[1]), f(q[0]), f(q[1])))
    return out, rib, ' '.join(veins)

def hero():
    # Grupos articulados para el viento: rama (anclada fuera, a la derecha), hojas (por su base)
    # y fruto con pedúnculo (cuelga del punto de unión con la rama)
    la, ra, va = leaf((300, 46), (402, 150), 26, .05)
    lb, rb, vb = leaf((166, 92), (44, 196), 22, -.05)
    s = []
    s.append('<svg class="art art--hero" viewBox="0 0 420 520" aria-hidden="true" focusable="false" data-art data-wind-root>')
    s.append('<g class="art__ink" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">')
    s.append('<g data-wind="twig" data-pivot="418 22">')
    s.append('<path data-draw d="M418 22C356 28 296 44 240 74C202 96 160 98 112 82"/>')
    for o, r, v, pv in ((la, ra, va, '300 46'), (lb, rb, vb, '166 92')):
        s.append('<g data-wind="leaf" data-pivot="%s">' % pv)
        s.append('<path data-draw d="%s"/>' % o)
        s.append('<path data-draw class="art__fine" d="%s"/>' % r)
        s.append('<path data-draw class="art__fine" d="%s"/>' % v)
        s.append('</g>')
    s.append('<g data-wind="fruit" data-pivot="238 76">')
    s.append('<path data-draw d="M238 76C230 102 218 130 210 160"/>')
    s.append('<path data-draw vector-effect="non-scaling-stroke" transform="translate(90 148) scale(1.2)" d="%s"/>' % AVO)
    s.append('<g class="art__stipple" transform="translate(90 148) scale(1.2)" data-stipple="hero"></g>')
    s.append('</g></g></g></svg>')
    return ''.join(s)

def half(cx, cy, rot, pit):
    g = []
    g.append('<g transform="translate(%s %s) rotate(%s) scale(1.25) translate(-100 -150)">' % (f(cx), f(cy), f(rot)))
    g.append('<path class="wash wash--flesh" d="%s"/>' % AVO)
    g.append('<path class="wash wash--edge" clip-path="url(#c-avo)" filter="url(#f-soft)" d="%s"/>' % AVO)
    g.append('<path class="wash wash--skin" vector-effect="non-scaling-stroke" d="%s"/>' % AVO)
    if pit:
        g.append('<circle class="wash wash--pit" cx="100" cy="186" r="38"/>')
    else:
        g.append('<circle class="wash wash--cavity" cx="100" cy="186" r="40"/>')
        g.append('<circle class="art__fine-ring" cx="100" cy="186" r="33"/>')
    g.append('<g class="art__ink" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">')
    g.append('<path data-draw vector-effect="non-scaling-stroke" d="%s"/>' % AVO)
    g.append('<circle data-draw vector-effect="non-scaling-stroke" cx="100" cy="186" r="%s" transform="rotate(-90 100 186)"/>' % (38 if pit else 40))
    g.append('</g></g>')
    return ''.join(g)

def tf(cx, cy, rot, x, y, sc=1.25):
    # punto local del aguacate (200x280) -> coordenadas de la lámina
    lx, ly = (x - 100) * sc, (y - 150) * sc
    a = math.radians(rot)
    return cx + lx * math.cos(a) - ly * math.sin(a), cy + lx * math.sin(a) + ly * math.cos(a)

def plate():
    L = (196, 226, -5); R = (448, 234, 6)
    s = ['<svg class="art art--plate" viewBox="0 0 640 450" aria-hidden="true" focusable="false" data-art>']
    s.append('<defs><clipPath id="c-avo"><path d="%s"/></clipPath><filter id="f-soft" x="-10%%" y="-10%%" width="120%%" height="120%%"><feGaussianBlur stdDeviation="6"/></filter><radialGradient id="g-pit" cx=".38" cy=".34" r=".7"><stop class="g-pit-a" offset="0"/><stop class="g-pit-b" offset="1"/></radialGradient></defs>' % AVO + '')
    s.append(half(*L, True)); s.append(half(*R, False))
    # llamadas: 1 piel, 2 pulpa, 3 hueso
    calls = [
        (tf(*L, 16, 214), (34, 318), '1'),
        (tf(*L, 52, 112), (60, 60), '2'),
        (tf(*L, 118, 214), (300, 404), '3'),
    ]
    s.append('<g class="art__calls">')
    for (px, py), (qx, qy), n in calls:
        s.append('<path data-draw class="art__leader" d="M%s %sL%s %s"/>' % (f(px), f(py), f(qx), f(qy)))
        s.append('<circle class="art__dot" cx="%s" cy="%s" r="2.2"/>' % (f(px), f(py)))
        s.append('<g class="art__num" transform="translate(%s %s)"><circle r="11"/><text y="4" text-anchor="middle">%s</text></g>' % (f(qx), f(qy), n))
    s.append('</g></svg>')
    return ''.join(s)

def bake(d, sx, sy, tx, ty):
    nums = re.findall(r'-?\d+(?:\.\d+)?', d)
    out, it = d, iter(range(len(nums)))
    vals = [float(n) for n in nums]
    pts = [(vals[i] * sx + tx, vals[i + 1] * sy + ty) for i in range(0, len(vals), 2)]
    flat = iter([f(c) for p in pts for c in p])
    return re.sub(r'-?\d+(?:\.\d+)?', lambda m: next(flat), d)

def variety(kind):
    sx, sy = (1.04, .93) if kind == 'hass' else (.9, 1.05)
    t = 'translate(130 150) scale(%s %s) translate(-100 -141)' % (f(sx * 1.05), f(sy * 1.05))
    SX, SY = sx * 1.05, sy * 1.05
    baked = lambda d: bake(d, SX, SY, 130 - 100 * SX, 150 - 141 * SY)
    s = ['<svg class="art art--variety" viewBox="0 0 260 300" aria-hidden="true" focusable="false" data-art>']
    s.append('<g class="art__ink" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">')
    s.append('<path data-draw d="%s"/>' % baked(AVO))
    s.append('<path data-draw d="M130 %s C129 %s 132 %s 138 %s"/>' % (f(150 - 131 * sy * 1.05), f(150 - 131 * sy * 1.05 - 8), f(150 - 131 * sy * 1.05 - 16), f(150 - 131 * sy * 1.05 - 22)))
    if kind == 'bacon':
        s.append('<path data-draw class="art__fine" d="%s"/>' % baked('M50 128C42 146 36 162 34 180'))
        s.append('</g><g class="art__stipple" transform="%s" data-stipple="sparse">' % t)
    s.append('</g>')
    if kind == 'hass':
        s.append('<g class="art__stipple" transform="%s" data-stipple="dense"></g>' % t)
    s.append('</svg>')
    return ''.join(s)

def ripe():
    return ('<svg class="art art--ripe" viewBox="0 0 200 280" aria-hidden="true" focusable="false">'
            '<path class="ripe__skin" d="%s"/>'
            '<g class="art__stipple" data-stipple="ripe"></g>'
            '<path fill="none" stroke="currentColor" stroke-width="1.15" vector-effect="non-scaling-stroke" d="%s"/>'
            '<path fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" d="M100 10C99 4 101 -2 106 -6"/>'
            '</svg>') % (AVO, AVO)

json.dump({'hero': hero(), 'plate': plate(), 'hass': variety('hass'), 'bacon': variety('bacon'), 'ripe': ripe(), 'avo': AVO}, open(os.path.join(HERE, 'art.json'), 'w'), ensure_ascii=False, indent=0)
print({k: len(v) for k, v in json.load(open(os.path.join(HERE, 'art.json'))).items()})

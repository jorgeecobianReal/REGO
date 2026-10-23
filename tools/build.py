# Genera ../index.html a partir de index.tpl y de las láminas (art.json, pc_art.json, rego_band.json).
# Uso: python3 tools/build.py   (las láminas se regeneran con art.py, pc_art.py y rego_band.py)
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

# Dirección pública de la web, terminada en «/» (p. ej. https://regodoscampos.gal/).
# Con ella se escriben la URL canónica, og:url, la imagen para redes con dirección completa
# y la «url» de los datos estructurados. Vacía, la página se genera sin esas etiquetas.
SITE_URL = ''


def load(name):
    with open(os.path.join(HERE, name), encoding='utf-8') as f:
        return json.load(f)


def lines(svg):
    # Un elemento por línea para que index.html se pueda leer y comparar.
    # Solo tras etiquetas que se cierran solas o tras </g>, para no meter texto en los <g> vacíos.
    return re.sub(r'(/>|</g>)(?=<)', r'\1\n', svg)


with open(os.path.join(HERE, 'index.tpl'), encoding='utf-8') as f:
    t = f.read()

art = load('art.json')
for k in ('hero', 'plate', 'hass', 'bacon', 'ripe', 'avo'):
    t = t.replace('{{%s}}' % k.upper(), art[k] if k == 'avo' else lines(art[k]))
for k, v in load('pc_art.json').items():
    t = t.replace('{{PC_%s}}' % k.upper(), lines(v))
t = t.replace('{{REGO_BAND}}', lines(load('rego_band.json')['band']))

url = SITE_URL.strip()
if url and not url.endswith('/'):
    url += '/'
head = ''
if url:
    head = '<link rel="canonical" href="%s">\n<meta property="og:url" content="%s">\n' % (url, url)
t = t.replace('{{SITE_HEAD}}', head)
t = t.replace('{{SITE_URL}}', url)
t = t.replace('  "url": "{{JSONLD_URL}}",\n', '  "url": "%s",\n' % url if url else '')
t = t.replace('{{JSONLD_URL}}', url)

assert '{{' not in t, re.findall(r'\{\{\w+\}\}', t)
with open(os.path.join(HERE, '..', 'index.html'), 'w', encoding='utf-8') as f:
    f.write(t)
print('index.html', len(t))

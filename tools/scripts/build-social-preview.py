"""Optional editable project graphic; not an app/CI dependency.

Run with a Python environment already containing Pillow. Fonts are the bundled
Amiri OFL files; no font, image, package or patient data is downloaded.
Original TIL graphic, GPL-3.0-only. SVG is retained as an editable source.
"""
from pathlib import Path
from html import escape
import json
from PIL import Image,ImageDraw,ImageFont

root=Path(__file__).resolve().parents[2]
out=root/'docs/assets';out.mkdir(parents=True,exist_ok=True)
fonts=root/'src/vendor/pdf'
image=Image.new('RGB',(1280,640),'#f5f8f6');draw=ImageDraw.Draw(image)
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640" role="img" aria-labelledby="title desc">',
     '<title id="title">Z-score Niger — Growth calculation, offline</title>',
     '<desc id="desc">Local records, FR EN AR, no account. WHO, CDC and INTERGROWTH reference choices. Open source GPL-3.0. No automatic diagnosis.</desc>',
     '<rect width="1280" height="640" fill="#f5f8f6"/>']
def rect(box,fill,radius=0,outline=None):
    draw.rounded_rectangle(box,radius=radius,fill=fill,outline=outline,width=2)
    x,y,x2,y2=box
    svg.append(f'<rect x="{x}" y="{y}" width="{x2-x}" height="{y2-y}" rx="{radius}" fill="{fill}"'+(f' stroke="{outline}" stroke-width="2"' if outline else '')+'/>')
def text(x,y,value,size=30,bold=False,fill='#153d31'):
    font=ImageFont.truetype(str(fonts/('Amiri-Bold.ttf' if bold else 'Amiri-Regular.ttf')),size)
    draw.text((x,y),value,font=font,fill=fill,anchor='lt')
    # SVG text is intentionally editable; install/use the bundled Amiri font
    # when opening its source. GitHub's preview uses the exported PNG.
    svg.append(f'<text x="{x}" y="{y}" dominant-baseline="text-before-edge" font-family="Amiri,serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{fill}">{escape(value)}</text>')
rect((0,0,12,640),'#176348')
rect((72,60,156,144),'#176348',18)
text(96,76,'Z',65,True,'#ffffff')
text(182,69,'Z-score Niger',66,True)
text(72,190,'Growth calculation, offline.',48,True)
text(72,266,'Local records  ·  FR / EN / AR  ·  No account',32)
text(72,310,'Works offline after the first complete load',22)
for x,label in [(72,'WHO 2006 / 2007'),(454,'CDC 2000 / 2022'),(836,'INTERGROWTH')]:
    rect((x,348,x+346,436),'#ffffff',14,'#bdd2c7')
    text(x+20,373,label,31,True)
text(72,478,'Explicit reference choices  ·  No automatic diagnosis',28)
rect((72,550,1208,552),'#c6d7ce')
text(72,574,'GPL-3.0  ·  Open source',25)
text(870,574,'zscore-niger.vercel.app',25)
svg.append('</svg>')
(out/'social-preview.svg').write_text('\n'.join(svg)+'\n',encoding='utf-8')
image.save(out/'social-preview.png',optimize=True)
info={'size':[1280,640],'bytes':(out/'social-preview.png').stat().st_size,'source':'social-preview.svg','fonts':'Bundled Amiri, SIL OFL-1.1','content':'Original graphic; not a screenshot or certification'}
print(json.dumps(info))

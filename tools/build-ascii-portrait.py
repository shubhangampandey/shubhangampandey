"""Convert a supplied face into genuine ASCII data, without a generative model.

python tools/build-ascii-portrait.py --source path/to/face.png
Only glyphs and brightness values are saved; the photo is not embedded in the art.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'profile'

def build(source):
    photo=Image.open(source).convert('RGB')
    # Coordinates trace only the outside of the head and shoulders in this source.
    # All facial features remain sampled directly from their original positions.
    outline=[(0,84),(13,43),(61,7),(127,0),(218,9),(260,33),(280,70),
             (283,123),(296,168),(290,207),(274,246),(284,282),
             (314,313),(336,329),(336,381),(0,381),(0,369),(35,349),
             (65,321),(75,296),(65,269),(41,249),(27,212),(17,165),(10,124)]
    mask=Image.new('L',photo.size,0)
    polygon=[(round(x*photo.width/336),round(y*photo.height/381)) for x,y in outline]
    ImageDraw.Draw(mask).polygon(polygon,fill=255)
    columns=70
    cell_width,cell_height=7.2,12.8
    rows=round((photo.height/photo.width)*columns*cell_width/cell_height)
    gray=ImageOps.autocontrast(photo.convert('L'),cutoff=1)
    gray=gray.resize((columns,rows),Image.Resampling.LANCZOS)
    silhouette=mask.resize((columns,rows),Image.Resampling.BOX)
    edge=mask.filter(ImageFilter.FIND_EDGES).resize((columns,rows),Image.Resampling.BOX)
    ramp=' .\'`^",:;Il!i~+_-?][}{1)(|\\/*tfjrxnuvczXYUJCLQ0OZmwqpdbkhao#MW&8%B@$'
    lines=[];brightness=[]
    for row in range(rows):
        line='';levels=[]
        for col in range(columns):
            coverage=silhouette.getpixel((col,row))
            if coverage<115:
                line+=' ';levels.append(0);continue
            value=gray.getpixel((col,row))
            # Preserve dark hair with dim fine glyphs, rather than erasing it.
            intensity=(value/255)**0.88
            index=max(1,min(len(ramp)-1,round(intensity*(len(ramp)-1))))
            char=ramp[index]
            level=round(68+intensity*173)
            if edge.getpixel((col,row))>15 and value<55:
                char=':';level=max(level,125)
            line+=char;levels.append(level)
        lines.append(line);brightness.append(levels)
    data={'source_sha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(),
          'method':'deterministic luminance-to-ASCII; no generated face',
          'columns':columns,'rows':rows,'cell_width':cell_width,'cell_height':cell_height,
          'lines':lines,'brightness':brightness}
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'portrait-characters.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'portrait-characters.txt').write_text('\n'.join(line.rstrip() for line in lines)+'\n',encoding='utf-8')
    print(f'ASCII portrait: {columns} columns × {rows} rows; source hash {data["source_sha256"]}')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',required=True)
    build(parser.parse_args().source)

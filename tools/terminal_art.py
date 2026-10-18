"""Character-only terminal artwork. No photo or generated face is composited."""
import json
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'assets/profile'
P=json.loads((A/'profile.json').read_text(encoding='utf-8'))
FACE=json.loads((A/'portrait-characters.json').read_text(encoding='utf-8'))
BG='#1c2429';OUTER='#0d1117';FG='#c4ccd2';AMBER='#e6ad74';BLUE='#accbe7';DIM='#60727e'
CHECKS=[]

@lru_cache(maxsize=32)
def font(size=21):
    return ImageFont.truetype(str(A/'fonts/jetbrains-mono-400.ttf'),size)

def text(d,x,y,value,size=21,color=FG,limit=None):
    d.text((x,y),value,font=font(size),fill=color,anchor='lt')
    b=d.textbbox((x,y),value,font=font(size),anchor='lt')
    if limit is not None:assert b[2]<=limit,(value,b,limit)
    CHECKS.append((value,b))

def surface(w,h):
    im=Image.new('RGB',(w,h),OUTER)
    ImageDraw.Draw(im).rounded_rectangle((12,12,w-13,h-13),radius=20,fill=BG)
    return im

def portrait(im,x,y,scale=1,band=None):
    d=ImageDraw.Draw(im)
    # Every visible mark is an actual printable character from the data file.
    for r,line in enumerate(FACE['lines']):
        for c,ch in enumerate(line):
            if ch==' ':continue
            value=FACE['brightness'][r][c]
            level=round(137+value*0.32)
            if band is not None and abs(r-band)<2:level=min(240,level+24)
            d.text((x+c*7.2*scale,y+r*12.8*scale),ch,font=font(round(12*scale)),fill=(level,min(255,level+7),min(255,level+11)),anchor='lt')
    return (x,y,FACE['columns']*7.2*scale,FACE['rows']*12.8*scale)

def field(d,y,key,value,x=570,vx=814,size=21,limit=1440):
    text(d,x,y,key+':' if key else '',size,AMBER,limit)
    if key:
        end=x+d.textlength(key+':',font=font(size))+12
        dots=max(0,int((vx-end-14)/d.textlength('.',font=font(size))))
        if dots:text(d,end,y,'.'*dots,size,DIM)
    text(d,vx,y,value,size,BLUE,limit)

def section(d,y,title,x=570,limit=1440,size=21):
    text(d,x,y,'- '+title+' ',size,FG,limit)
    start=x+d.textlength('- '+title+' ',font=font(size))
    d.line((start,y+11,limit,y+11),fill=DIM,width=1)

def desktop():
    im=surface(1480,780);d=ImageDraw.Draw(im)
    box=portrait(im,37,80)
    text(d,46,687,P['name'],21,FG,535)
    text(d,46,721,'./engineer / developer',19,DIM,535)
    section(d,34,P['username']+'@github')
    field(d,69,'Name',P['name'])
    field(d,94,'Role',P['role'])
    field(d,119,'Focus',P['focus'])
    y=166
    labels={'code':'Programming','ui':'Frontend','api':'Backend','data':'Databases','delivery':'DevOps','cloud':'Cloud','design':'System Design'}
    for key,lines in P['stack'].items():
        for i,line in enumerate(lines):
            field(d,y,labels[key] if i==0 else '',line)
            y+=23
    section(d,443,'Experience')
    for yy,exp in zip([476,554],P['experience']):
        field(d,yy,'Team',exp['company'])
        field(d,yy+23,'Role',exp['role'])
        field(d,yy+46,'Period',exp['dates']+' / '+exp['location'])
    section(d,644,'Selected Work')
    field(d,676,'Systems','CausalScope / AgentFence / ORBITAL')
    section(d,715,'Connect')
    field(d,745,'GitHub','github.com/'+P['username'])
    return im,box,(814+int(d.textlength('github.com/'+P['username'],font=font(21)))+14,745),1

def mobile():
    im=surface(720,1560);d=ImageDraw.Draw(im)
    text(d,32,38,P['username']+'@github',25,FG,689)
    box=portrait(im,108,100)
    section(d,715,'Identity',32,686,26)
    text(d,32,760,P['name'],29,FG,686)
    text(d,32,802,P['role'],24,BLUE,686)
    y=859
    labels={'code':'Code','ui':'UI','api':'API','data':'Data','delivery':'DevOps','cloud':'Cloud','design':'Design'}
    for key,lines in P['stack'].items():
        for i,line in enumerate(lines):
            field(d,y,labels[key] if i==0 else '',line,32,177,26,688)
            y+=33
    section(d,1240,'Experience / Remote',32,686,24)
    for y,exp in zip([1284,1360],P['experience']):
        text(d,32,y,exp['company'],25,FG,688)
        text(d,32,y+31,exp['role']+' / '+exp['dates'],21,BLUE,688)
    text(d,32,1450,'CausalScope / AgentFence / ORBITAL',24,BLUE,688)
    text(d,32,1500,'github.com/'+P['username'],24,BLUE,688)
    return im,box,(32+int(d.textlength('github.com/'+P['username'],font=font(24)))+14,1500),1

def animate(base,box,cursor,variant):
    name='terminal-profile' if variant=='desktop' else 'terminal-profile-mobile'
    frames=[]
    for n in range(24):
        frame=base.copy()
        portrait(frame,box[0],box[1],band=round(n*(FACE['rows']-1)/23))
        d=ImageDraw.Draw(frame)
        if n%8<4:d.rectangle((cursor[0],cursor[1],cursor[0]+10,cursor[1]+18),fill=AMBER)
        frames.append(frame)
    palette=frames[0].quantize(colors=128,method=Image.Quantize.MEDIANCUT)
    indexed=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
    base.save(A/(name+'.png'),optimize=True)
    indexed[0].save(A/(name+'.gif'),save_all=True,append_images=indexed[1:],duration=150,loop=0,optimize=True,disposal=1)
    print(name,len(frames),'frames', (A/(name+'.gif')).stat().st_size,'bytes')

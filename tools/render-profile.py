"""Render the editable GitHub profile as portable animated GIF + static PNG art.

Requires Pillow: python -m pip install Pillow
Run from any directory: python tools/render-profile.py
Profile facts and future URLs live in assets/profile/profile.json.
"""
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets' / 'profile'
P = json.loads((ASSETS / 'profile.json').read_text(encoding='utf-8'))
BG = '#10151b'
FG = '#dce3ed'
MUTED = '#8793a4'
DIM = '#384452'
RED = '#ff596c'
BLUE = '#a9c8e6'
CHECKS = []

def font(size, bold=False):
    return ImageFont.truetype(str(ASSETS / 'fonts' / ('jetbrains-mono-700.ttf' if bold else 'jetbrains-mono-400.ttf')), size)

def text(draw, xy, value, size=23, color=FG, bold=False, max_x=None):
    draw.text(xy, value, font=font(size, bold), fill=color, anchor='lt')
    box = draw.textbbox(xy, value, font=font(size, bold), anchor='lt')
    if max_x is not None:
        assert box[2] <= max_x, (value, box, max_x)
    CHECKS.append((value, box))

def chrome(w, h):
    im = Image.new('RGB', (w,h), BG)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((1,1,w-2,h-2), radius=20, outline='#303a46', width=2)
    d.line((1,66,w-2,66),fill='#303a46',width=2)
    for x,c in [(30,RED),(57,'#d5b36b'),(84,'#72a58b')]:
        d.ellipse((x,25,x+12,37),fill=c)
    text(d,(118,24),'shubhangam@github: ~',20,MUTED)
    text(d,(w-182,25),'PROFILE / SP',18,MUTED)
    return im

def picture(im, box):
    portrait = Image.open(ASSETS / 'portrait-ascii.png').convert('RGB')
    portrait.thumbnail((box[2],box[3]), Image.Resampling.LANCZOS)
    px=box[0]+(box[2]-portrait.width)//2
    py=box[1]+(box[3]-portrait.height)//2
    im.paste(portrait,(px,py))
    return px,py,portrait.width,portrait.height

def section(d,x,y,label,width,size=22):
    text(d,(x,y),label,size,RED)
    end=x+int(d.textlength(label,font=font(size)))+22
    if end<width-34:
        d.line((end,y+11,width-34,y+11),fill=DIM)

def desktop():
    w,h=1480,1050
    im=chrome(w,h);d=ImageDraw.Draw(im)
    text(d,(35,100),'$ render --portrait ./shubhangam',20,MUTED)
    box=picture(im,(28,165,505,758))
    d.line((558,100,558,963),fill='#27313d')
    x=594
    text(d,(x,100),'$ whoami',24,RED)
    text(d,(x,145),P['name'].upper(),33,FG,True,max_x=w-30)
    text(d,(x,195),P['role'],23,BLUE,max_x=w-30)
    section(d,x,242,'identity / engineering',w)
    text(d,(x,286),'focus',22,RED)
    text(d,(x+136,286),P['focus'],22,BLUE,max_x=w-30)
    y=334
    for key,lines in P['stack'].items():
        for i,value in enumerate(lines):
            if i==0: text(d,(x,y),key,22,RED)
            text(d,(x+136,y),value,22,BLUE,max_x=w-30)
            y+=31
    section(d,x,697,'experience / remote',w)
    y=738
    for exp in P['experience']:
        text(d,(x,y),exp['company'],22,FG,max_x=w-30)
        text(d,(x,y+29),exp['role'],20,BLUE,max_x=w-30)
        text(d,(x,y+56),exp['dates'],19,MUTED)
        y+=99
    text(d,(36,946),'[ SP ]  PORTRAIT / CHARACTER MAP',19,MUTED)
    section(d,x,960,'work / systems',w,20)
    text(d,(x,995),'CausalScope  /  AgentFence  /  ORBITAL',20,BLUE,max_x=w-30)
    d.line((28,986,530,986),fill=DIM)
    text(d,(36,1004),'$ ',22,RED)
    return im,box,(67,1003), (x,100)

def mobile():
    w,h=720,1840
    im=chrome(w,h);d=ImageDraw.Draw(im)
    text(d,(32,98),'$ whoami',26,RED)
    text(d,(32,145),P['name'].upper(),33,FG,True,max_x=w-25)
    text(d,(32,196),P['role'],25,BLUE,max_x=w-25)
    box=picture(im,(174,249,372,558))
    text(d,(32,824),'PORTRAIT / CHARACTER MAP',22,MUTED)
    section(d,32,875,'identity / engineering',w,24)
    text(d,(32,923),'focus',28,RED)
    text(d,(178,923),P['focus'],26,BLUE,max_x=w-25)
    y=972
    for key,lines in P['stack'].items():
        for i,value in enumerate(lines):
            if i==0: text(d,(32,y),key,28,RED)
            text(d,(178,y),value,27,BLUE,max_x=w-25)
            y+=36
    section(d,32,1391,'experience / remote',w,24)
    y=1441
    for exp in P['experience']:
        text(d,(32,y),exp['company'],26,FG,max_x=w-25)
        text(d,(32,y+34),exp['role']+' | '+exp['dates'],21,BLUE,max_x=w-25)
        y+=89
    section(d,32,1647,'work / systems',w,24)
    text(d,(32,1697),'CausalScope / AgentFence / ORBITAL',25,BLUE,max_x=w-25)
    d.line((32,1751,w-32,1751),fill=DIM)
    text(d,(32,1785),'$ ',25,RED)
    return im,box,(68,1784),(32,98)

def animate(base, box, cursor, variant):
    x,y,w,h=box
    frames=[]
    for n in range(48):
        frame=base.convert('RGBA')
        overlay=Image.new('RGBA',frame.size,(0,0,0,0));d=ImageDraw.Draw(overlay)
        # The face stays readable throughout the loop; only the light band moves.
        scan_y=y+int((n/47)*h)
        for trail in range(14,0,-1):
            yy=scan_y-trail*2
            if y<=yy<y+h:
                d.line((x+10,yy,x+w-10,yy),fill=(255,89,108,max(1,15-trail)),width=2)
        d.line((x+10,scan_y,x+w-10,scan_y),fill=(255,89,108,100),width=2)
        for side in [x+4,x+w-4]:
            d.rectangle((side-2,scan_y-5,side+2,scan_y+5),fill=(255,89,108,230))
        for bx,by,sx,sy in [(x,y,1,1),(x+w,y,-1,1),(x,y+h,1,-1),(x+w,y+h,-1,-1)]:
            d.line((bx,by,bx+sx*22,by),fill=(255,89,108,160),width=2)
            d.line((bx,by,bx,by+sy*22),fill=(255,89,108,160),width=2)
        phase=(n//16)%3
        status=['rendering character map','tracing interface signals','ready for the next idea'][phase]
        d.text((cursor[0]+2,cursor[1]+1),status,font=font(20 if variant=='desktop' else 23),fill=MUTED,anchor='lt')
        tx=cursor[0]+int(d.textlength(status,font=font(20 if variant=='desktop' else 23)))+16
        if n%12<7:
            d.rectangle((tx,cursor[1],tx+11,cursor[1]+22),fill=RED)
        frames.append(Image.alpha_composite(frame,overlay).convert('RGB'))
    # One shared palette prevents color flicker and keeps differential frames small.
    palette=frames[0].quantize(colors=128,method=Image.Quantize.MEDIANCUT)
    indexed=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
    name='terminal-profile' if variant=='desktop' else 'terminal-profile-mobile'
    frames[0].save(ASSETS / (name+'.png'),optimize=True)
    indexed[0].save(ASSETS / (name+'.gif'),save_all=True,append_images=indexed[1:],loop=0,duration=110,optimize=True,disposal=1)
    print(name, (ASSETS / (name+'.gif')).stat().st_size, 'bytes',len(frames),'frames')

def markdown():
    links=P['links']
    nav=[('GitHub','github'),('Portfolio source','portfolioSource'),('Portfolio','portfolioLive'),('LinkedIn','linkedin'),('Resume','resume'),('Certificates','certificates'),('Recommendation letter','recommendationLetter'),('LeetCode','leetcode'),('Codeforces','codeforces')]
    visible=' &nbsp; / &nbsp; '.join(f'<a href="{links[key]}">{label} ↗</a>' for label,key in nav if links.get(key))
    if links.get('email'):
        visible+=f' &nbsp; / &nbsp; <a href="mailto:{links["email"]}">Email ↗</a>'
    labels={'code':'Programming','ui':'Frontend','api':'Backend','data':'Databases','delivery':'DevOps','cloud':'Cloud','design':'System design'}
    stack_rows='\n'.join(f'| **{labels[key]}** | '+ ' · '.join(lines).replace('HLD/LLD','HLD/LLD fundamentals')+' |' for key,lines in P['stack'].items())
    exp='\n\n'.join(f'**{e["company"]}**<br />\n{e["role"]} · {e["location"]}<br />\n{e["dates"]}' for e in P['experience'])
    project_links={}
    for name,prefix in [('CausalScope','causalscope'),('AgentFence','agentfence')]:
        entries=[f'[{label}]({links[key]})' for label,key in [('Source',prefix+'Source'),('Live demo',prefix+'Demo')] if links.get(key)]
        project_links[name]='\n\n'+' · '.join(entries) if entries else ''
    readme=f'''<!-- Profile facts and future URLs: assets/profile/profile.json.
Rebuild art and this Markdown with: python tools/render-profile.py.
The terminal is a visual profile, not a claim of live security scanning. -->

<picture>
  <source media="(prefers-reduced-motion: reduce) and (max-width: 640px)" srcset="assets/profile/terminal-profile-mobile.png" />
  <source media="(prefers-reduced-motion: reduce)" srcset="assets/profile/terminal-profile.png" />
  <source media="(max-width: 640px)" srcset="assets/profile/terminal-profile-mobile.gif" />
  <img src="assets/profile/terminal-profile.gif" alt="Shubhangam Pandey — software engineer and full-stack developer. An ASCII-style portrait with my technical stack, remote internship experience at UDRcraft and Prodigy InfoTech, and projects CausalScope, AgentFence, and ORBITAL. Full text is available below." width="1480" />
</picture>

<p align="center">
  <samp>Thoughtful interfaces. Understandable systems. Deliberate engineering.</samp>
</p>

<p align="center">
  {visible}
</p>

---

### `$ cat about.md`

I'm **Shubhangam Pandey**. I build software across interfaces, backend services, and delivery workflows, with a particular interest in **distributed systems, observability, and security for AI agent workflows**.

My experience includes technical team leadership, full-stack development, cloud deployment pipelines, and CI/CD. I care about software whose responsibilities are clear, whose behavior can be inspected, and whose design remains understandable as it grows.

<details>
<summary><strong><code>~/toolkit</code> — languages, frameworks &amp; systems</strong></summary>

<br />

| Area | Technologies &amp; concepts |
| :--- | :--- |
{stack_rows}

</details>

<details>
<summary><strong><code>~/experience</code> — the teams I've worked with</strong></summary>

<br />

{exp}

At UDRcraft, my work included coordinating engineering delivery, cloud deployment pipelines, platform reliability, and CI/CD workflow optimization.

</details>

<details>
<summary><strong><code>~/work</code> — systems I've built</strong></summary>

<br />

#### CausalScope / Distributed incident investigation

An investigation workspace connecting **OpenTelemetry observations, service topology, trace inspection, and anomaly signals**. Evidence-ranked hypotheses make the reasoning behind a suspected incident cause inspectable, while keeping uncertainty visible.

`TypeScript` `React` `Express` `OpenTelemetry` `SQLite` `Prisma`{project_links['CausalScope']}

#### AgentFence / Security for AI agent workflows

A control plane for **scoped identities, default-deny policies, independent approvals, and auditable execution**. It explores how AI-driven tool use can be governed through explicit backend authorization, payload-bound approval, and current-state permission checks.

`TypeScript` `React` `Express` `PostgreSQL` `Prisma` `OPA/Rego`{project_links['AgentFence']}

#### ORBITAL / My interactive portfolio

My engineering identity expressed as an explorable interface: **layered project architecture, animated API connections, contextual skill summaries, and a terminal that reflects visitor interactions**.

`TypeScript` `Three.js` `Vite` `Web Audio API`

[Explore the portfolio source ↗]({links['portfolioSource']})

</details>

<details>
<summary><strong><code>~/principles</code> — how I approach engineering</strong></summary>

<br />

- **Make boundaries explicit.** Define responsibilities, contracts, and constraints before they become accidental complexity.
- **Follow the evidence.** Use observable behavior, traces, and tests to understand what a system is doing.
- **Design for delivery.** Treat deployment and repeatable workflows as part of the product.
- **Explain the decisions.** Make the reasoning behind a system understandable to the next person working on it.

</details>

---

<p align="center">
  <samp>Ideas worth building start with a conversation.</samp><br />
  <a href="{links['github']}">github.com/{P['username']}</a>
</p>
'''
    (ROOT/'README.md').write_text(readme,encoding='utf-8')

for variant,make in [('desktop',desktop),('mobile',mobile)]:
    base,box,cursor,_=make()
    animate(base,box,cursor,variant)
markdown()
print('Text bounds checked:',len(CHECKS))

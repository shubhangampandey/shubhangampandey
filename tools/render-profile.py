"""Build a personal terminal README from editable facts and ASCII characters.

python tools/render-profile.py
Requires Pillow. No photograph is embedded in the output.
"""
import json
from pathlib import Path
from terminal_art import desktop, mobile, animate, CHECKS
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/profile'
P=json.loads((ASSETS/'profile.json').read_text(encoding='utf-8'))

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
  <img src="assets/profile/terminal-profile.gif" alt="Shubhangam Pandey — software engineer and full-stack developer. My face rendered entirely in ASCII characters, beside a terminal profile with my technical stack, remote internship experience at UDRcraft and Prodigy InfoTech, and projects CausalScope, AgentFence, and ORBITAL. Full text is available below." width="1480" />
</picture>

<p align="center">
  {visible}
</p>

<details>
<summary><strong>Read my profile as text</strong></summary>

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

</details>
'''
    (ROOT/'README.md').write_text(readme,encoding='utf-8')

if __name__ == '__main__':
    for variant,make in [('desktop',desktop),('mobile',mobile)]:
        base,box,cursor,_=make()
        animate(base,box,cursor,variant)
    markdown()
    print('Text bounds checked:',len(CHECKS))

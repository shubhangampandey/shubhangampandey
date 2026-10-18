# ORBITAL — Shubhangam Pandey's engineering portfolio

A black, white, and crimson developer portfolio built in TypeScript with Vite, Three.js, and Lucide. It has six hash-routed pages: Summary, Projects, Experience, Skills, Linktree, and Contact.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

`dist/` is the deployable static website. No account, database, API key, or backend is required. All fonts and interface sounds are local: the sound engine synthesizes cues with the Web Audio API, and font files and their licenses are in `public/fonts/`.

## Personalize

**Connect all destinations in `src/personal-links.ts`.** This is the only file you need to edit for URLs:

- Set `email` to your contact address without `mailto:`.
- Fill GitHub, LeetCode, Codeforces, LinkedIn, writing, certificates, and recommendation letter URLs. A public folder URL is fine for certificates.
- Put your résumé PDF in `public/resume.pdf` and set `resume` to `/resume.pdf`, or use an external document URL.
- Set `projects.causalscope.source` / `.demo` and `projects.agentfence.source` / `.demo` to their public source and live URLs.
- `src/content.ts` holds your name, role, summary, photo path, and the two real professional experience records.
- Your supplied photo is in `public/images/shubhangam-pandey.png`; its circuit frame, grayscale treatment, and scanning effects are CSS/SVG, so the original image is preserved.
- `src/projects.ts` contains the CausalScope and AgentFence architectures, checked against their local repositories and engineering documentation. Each has four inspectable responsibility groups, module descriptions, real stack details, engineering notes, and explicit scope boundaries.
- `src/skills.ts` contains the 25 supplied skills in seven groups. Each has a summary, applications, related capabilities, and project associations where supported by the actual implementation/configuration.

An empty destination stays visibly unconnected. The application does not invent profile links or professional history. With no email configured, the validated contact form copies a formatted message to the clipboard. Once an email is set, it opens an email draft in the visitor's email app; this static site does not silently send mail or claim delivery.

## Interactions

- The home architecture unfolds on entry, tilts with pointer movement, and changes its separation subtly as the pointer moves. Layer hover is reflected in the terminal.
- Projects expand on scroll or through the depth slider. In the fully expanded state, layers face the viewer in a readable two-by-two layout.
- Thin API wires, event connections, and thicker pipeline tubes connect visible layer sockets. The Three.js scene and the HTML cards share the same perspective camera.
- Module and layer selection reveals responsibilities, submodules, and inbound/outbound connections in the inspector.
- Cables sag, sway, and carry animated data particles. These flows demonstrate the architecture; they are not live telemetry.
- The activity terminal starts expanded on every screen. Only its minus button minimizes it; navigation, browser focus changes, and resizing preserve its state. Console, the backtick key, and the command palette open it. Drag its title bar on desktop or reset its dock. It displays UI commands only and has no operating-system shell access.
- Use Ctrl/Cmd + K for the command palette.
- SFX defaults ON. Browsers that block autoplay unlock audio automatically on the first click/tap or keypress. Every click, including empty space, has a cue; route changes and tab exit/return have distinct sounds. Hover ticks cannot suppress navigation sounds. Background ambience pauses while away, then resumes when you return. The SFX button mutes immediately and saves your explicit choice. All audio is synthesized locally; no external assets or requests are used.
- Motion starts ON for new visitors, including when the operating system requests reduced motion. The status-bar Motion toggle remains available to explicitly turn effects off; that choice is saved and survives refreshes. Motion OFF restores the native cursor. Legacy preference-derived settings are superseded by the new default.
- Every non-home introduction includes the same portrait, animated scan, and circuit frame used on Home, positioned at the upper right on desktop. Its scan label identifies the current page. On narrow screens it sits below the title and remains aligned to the right.
- Mobile uses readable touch-selectable architecture layers rather than miniature 3D text.
- Skills update on hover or keyboard focus; clicking remains available for touch. The right inspector shows purpose, applications, related capabilities, and relevant showcased projects.
- Mouse input enables the binary cursor at every window width, including narrow browser side panels and hybrid devices. It decomposes into 0/1 fragments, reassembles with orbiting binary digits, and reconnects to the terminal through an animated data tether. Each click triggers a fresh decomposition. Idle cycles do not flood the terminal log. Touch input keeps the native interaction.
- Scroll reveals include staggered motion, a traveling crimson scan, and illuminated edges. Route changes play an acquisition panel and an entrance transition; hovered controls cycle through three visual responses. Overlays never intercept input.

## Checks

```sh
npx playwright install chromium
npm run build
npm run preview -- --port 5174
npm test
```

To check the development server and its CSS import pipeline directly, run `npm run test:dev`. This uses port 5173 and can reuse the running local server.

The browser tests cover routing and runtime errors, 3D layer/module inspection, terminal controls, the command palette, sound and motion toggles, timeline and skills interactions, clipboard contact composition, scroll expansion, and mobile overflow.

## Structure

- `src/main.ts`: page layouts, routing, and UI events.
- `src/content.ts`: personal profile, experience, and content-directory exports.
- `src/personal-links.ts`: every editable external destination and contact email.
- `src/identity-view.ts` and `src/identity.css`: portrait frame, circuits, and personal identity styling.
- `src/experience-view.ts`: the professional timeline and supplied achievements.
- `src/projects.ts`: CausalScope and AgentFence details and architectures.
- `src/skills.ts` and `src/skills-view.ts`: skill directory and hover-first inspector.
- `src/effects.ts` and `src/effects.css`: binary cursor, terminal tether, and interaction/scroll effects.
- `src/scene.ts`: perspective layer cards, dynamic cable meshes, and data particles.
- `src/terminal.ts`: activity history, docking, dragging, and minimization.
- `src/audio.ts`: optional synthesized interface and ambient sound.
- `src/style.css`: responsive black/white/crimson visual system.
- `src/fonts.css`: local font declarations.

The browser module uses hash routes, so the static build works on hosts without route rewrites. Serve it over HTTP; opening `index.html` directly with `file://` is not supported.

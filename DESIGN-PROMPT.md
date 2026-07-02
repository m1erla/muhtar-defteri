# Dijital Muhtar — Claude Design Prompt

Paste the block under **"The prompt"** as your opening message in a new Claude Design project. Start the project in **high-fidelity mode** — these need to read close to submission-quality, not rough wireframes. Claude Design can also take file uploads directly; if that's available in your session, attach `FRONTEND.md` alongside this prompt for extra grounding, since it carries the same system in slightly more detail.

---

## The prompt

Design the core UI for Dijital Muhtar, a mobile-first civic web app for Adana, Turkey. It routes residents to the correct official channel for a local problem (illegal parking, overflowing bins, broken sidewalks, unsafe school routes) and shows a public, transparent record of how often each problem has been reported and whether it's been resolved. This is explicitly not an official government app — it's a community routing and accountability layer that sits alongside real channels like Alo 181, CİMER, and Adana's own ALO 153 line, and the design should never look like it's impersonating one of them.

**Design system to use throughout:**

Colors —
`ink` #2B2620 (primary text and structure — a warm near-black, never pure black)
`paper` #EDE6D8 (background — aged ledger paper, warmer and deeper than a stock cream)
`petrol` #1F5C5C (primary actions, links, the main interactive color — a deep teal, not corporate blue)
`terracotta` #BC5A3C (status: open / needs attention — Adana brick and roof-tile color)
`moss` #5B7052 (status: resolved / handled)

Typography — pair two families. Use a monospace face (IBM Plex Mono or similar) for anything that reads like a logged entry: dates, report counts, IDs, phone numbers, the routing result's contact block. Use a warm humanist sans (Work Sans or similar) for everything else — body copy, buttons, headings. No display serif anywhere; it's the obvious choice for a "heritage" feeling and would read as generic here.

**The concept driving the whole visual language:** picture a muhtar's desk — a lined ledger book, a rubber stamp and ink pad, entries logged in order. This app should feel like that: warm, procedural, human, trustworthy through structure rather than through looking official. The one place this shows up explicitly is the report list: rows are styled as ledger entries (a thin rule between rows, tabular alignment of category / neighborhood / date / confirmation count), and status is a small circular stamp mark — never a rounded SaaS-style pill badge — always paired with a text label, not color alone.

Spend the visual personality there, on the ledger rows, and keep every other screen quiet, plain, and fast. Forms, buttons, and the routing screen should feel calm and get out of the way.

**Explicitly avoid:** generic civic-app trust-blue, rounded Material-style cards with soft drop shadows, a warm-cream-background-with-serif-display-and-terracotta-accent template look, gradients, and anything that reads as a government portal. This should look like nothing else in the civic-tech space, grounded in the ledger concept above, not a Bootstrap-style dashboard.

**Screens to design, in this order** (mobile viewport, ~375px, as the primary frame; note where a screen should also show a wider layout):

1. **Home** — Petrol CTA button reading "Bir Sorun Bildir" front and center. Below it, a compact preview list of 3–4 recent nearby reports styled as ledger rows, under a header reading "Yakınında son bildirilenler."

2. **Report — category** — Header "Ne tür bir sorun?" Four large tap targets (roughly square, icon plus label, minimum 64px tall): "Temizlik / Çöp," "Hatalı Park," "Kaldırım / Altyapı," "Okul Çevresi Güvenliği."

3. **Report — details** — Header "Detayları ekle (opsiyonel)." An optional text area placeholder "Kısaca anlat...", a photo-add button labeled "Fotoğraf Ekle," a small map preview with a draggable pin and the caption "Pini sürükleyerek düzeltebilirsin," and a primary button "Devam Et."

4. **Routing result** — Header "İşte doğru yer:" A card showing a channel name, phone number, and URL in the monospace treatment, a checklist under the label "Yanına al:" (plain checkboxes, visual only), a "Bilgileri Kopyala" button, and a secondary link "Haritaya da Ekle."

5. **Add to map** — Header "Haritaya eklemek ister misin?" Explainer text: "Fotoğrafın ve yaklaşık konumun herkese açık haritada görünür. Kişisel bilgin paylaşılmaz." Two buttons: primary "Evet, Ekle," secondary/text "Hayır, Geç."

6. **Map / list view** — Header "Mahalle Kaydı." Filter chips along the top for the four categories plus "Açık" and "Çözüldü." Below, the ledger-row list is the default view on mobile; show a secondary wider-viewport version of this screen with an actual map (OpenStreetMap style, pins colored by category) alongside the list.

7. **Report detail** — A stamp mark (terracotta for open, moss for resolved) with its text label, the description and photo if present, a line reading "İlk bildirilme: X gün önce" and "X kişi bunu doğruladı," and two outlined buttons: "Ben de Gördüm" and "Bu Düzeldi."

8. **How it works** — Header "Dijital Muhtar nedir, ne değildir?" Plain body text, no illustration — this screen's only job is stating clearly that this is a community routing and transparency layer, not an official government channel, and that it doesn't guarantee any outcome.

**Non-negotiables:** every screen must work at mobile width first — that's the primary deliverable, desktop is secondary. Tap targets at least 44px (64px for the category picker). Status is never color-only. Text should scale, nothing locked to a fixed pixel size that fights system font settings. All copy is in Turkish, exactly as written above — don't translate it or substitute English placeholder text.

---

## Follow-up prompts, once the first pass is back

Claude Design works best as a conversation, not a one-shot — expect two or three rounds, not one. Good next moves:

- *"Show me the report-detail screen with three sample reports at different ages — one just reported, one at 20 days, one at 45 days, past the 15-day response benchmark — so I can see how urgency reads across the set."*
- *"Now generate the wider desktop layout for the map/list screen, with the actual map panel next to the list."*
- *"Push the stamp mark further — what would it look like slightly hand-stamped and imperfect, rather than a clean vector circle?"*

If a first pass drifts toward something generic, say so directly and point back at the ledger concept — direct correction works better than vague dissatisfaction with this kind of tool.

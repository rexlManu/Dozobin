---
name: Dōzobin
description: Soft, cozy night world for sharing files, text and Transfer Sessions.
colors:
  ground: "#070616"
  ink: "#f5f1ff"
  ink-muted: "#aaa2cc"
  panel: "#0e0c1a"
  panel-raised: "#15122a"
  panel-hover: "#1d1736"
  night: "#120f2c"
  line: "#2a2540"
  line-strong: "#4a4170"
  sakura: "#ffb3c7"
  sakura-ink: "#3a0f1f"
  lavender: "#b9a8ff"
  lamplight: "#ffd98a"
  lamplight-ink: "#2a1c08"
  mint: "#9fe3cf"
  coral: "#ff8b7b"
typography:
  display:
    fontFamily: "Zen Maru Gothic, ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(34px, 4.6vw, 58px)"
    fontWeight: 700
    lineHeight: 1.08
  headline:
    fontFamily: "Zen Maru Gothic, ui-rounded, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Zen Maru Gothic, ui-rounded, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
  body:
    fontFamily: "Zen Maru Gothic, ui-rounded, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.55
  label:
    fontFamily: "Zen Maru Gothic, ui-rounded, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  mono:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 400
rounded:
  chip: "13px"
  control: "14px"
  button: "16px"
  row: "20px"
  card: "28px"
spacing:
  gutter-phone: "16px"
  gutter: "28px"
  card-padding: "26px"
  row-gap: "8px"
components:
  button-primary:
    backgroundColor: "{colors.sakura}"
    textColor: "{colors.sakura-ink}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "40px"
  button-soft:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
  chip-pressed:
    backgroundColor: "{colors.lamplight}"
    textColor: "{colors.lamplight-ink}"
    rounded: "{rounded.chip}"
  card:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
  input:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "40px"
  tab-active:
    backgroundColor: "{colors.lavender}"
    textColor: "{colors.night}"
    rounded: "12px"
---

# Design System: Dōzobin

## Overview

**Creative North Star: "Yoru, the night delivery"**

Dōzobin is a quiet room at night. Every page sits in one painted night sky (stars, a Milky Way, the moon, low clouds) that ends in a lit city at the bottom of the page. On top of it sit deep indigo panels with large, friendly radii, and a small mascot, Dozo (a soft parcel with a sprout). The tone is cozy and kind, never cute for its own sake: every soft shape still carries real state (progress, expiry, protection, who is online).

The world was chosen over seven other directions (waybill, poster, contact sheet, timetable, notebook, room). It keeps the Yozora screens and takes the session layout from the room idea: a party column of devices and a dialogue log.

**Key characteristics:**
- A painted night sky behind every page, indigo panels, one soft border weight (1.5px).
- Sakura for the one main action on a screen; lamplight for time and pressed choices; lavender for focus, live state and active tabs; mint for success; coral for danger.
- Zen Maru Gothic everywhere, bold for anything you act on; Fragment Mono only for machine strings.
- Authored art only: SVG for Dozo and sparkles, a painted sky and city rendered once to still images. No stock imagery, no copied characters.
- Motion is short and runs once: a soft pop on arrival, a small lift on hover. Nothing loops.

## Colors

A night palette with pastel lights. Tokens live in `resources/css/app.css` and map to Tailwind (`bg-card`, `bg-sunken`, `text-muted-foreground`, `bg-primary`, `text-lavender`, `bg-lamp`, `text-mint`, `text-destructive`).

- **Ground** `#070616` (`bg-background`): the solid header after scrolling, the phone nav, and the fallback behind the sky. The page itself shows the painted sky, not this color.
- **Panel** `#0e0c1a` (`bg-card`): cards, rows, the session column.
- **Panel raised** `#15122a` (`bg-sunken`): inputs, tracks, nested blocks inside a card.
- **Night** `#120f2c`: dark text on light fills, and the gradient of code boxes.
- **Sakura** `#ffb3c7` (`primary`): the main action and the "You" tag. One per screen.
- **Lavender** `#b9a8ff`: focus rings, active tabs and segments, live markers, progress start.
- **Lamplight** `#ffd98a` (`lamp`): pressed chips, clocks, warnings, the meter end.
- **Mint** `#9fe3cf`: delivered, clean, live.
- **Coral** `#ff8b7b` (`destructive`): delete and errors. Keep it apart from sakura.

Status never relies on color alone: every colored state also has a word ("Delivered", "Not sent", "Blocked").

## Typography

Type steps in use: 12, 13, 14, 15 (body), 16, 18, 20, 22, 24, 26, 28, 30, 32 px and the display clamp. Stay on these steps. Zen Maru Gothic 400/500/700, with balanced line metrics for its Latin faces (`app.css`) so text sits centered in pills and buttons, and with the Japanese subset loaded on demand (only "どうぞ" uses it). Body is 15px at weight 500. Headings are 700. Labels for fields and metadata are 13px bold in `ink-muted` (`.label-meta`). Fragment Mono is for URLs, Access Codes, tokens, code and Paste bodies; never for decoration. The Access Code renders in Fragment Mono, split 4 + 4 ("38BS YP91").

## Layout

- Content rail: `max-w-[68rem]` with 16px phone and 28px desktop gutters (`.rail`). The header uses the full width (`.rail-wide`).
- "Long night": the sky is fixed to the window behind the whole page, so it never moves when you switch pages or scroll. Every page ends with the city (220px on a phone, 260px from `sm`), in flow after the content, so content never covers it.
- The page title goes in `AppShell head`: a block of 300px on a phone and 340px from `sm` at the top of the page. The page body starts 64px above the end of that block, at the same place on every page.
- The header floats over the sky and turns solid only after the page scrolls.
- Transfer Session on desktop: the live state and "2 of 3 devices here" sit in the sky; below it, a 300px device column and a flexible log fill the rest of the viewport. On a phone the column stacks on top and the code panel folds behind "Add a device".
- Settings and Administration share one frame: the title and a row of section pills (`components/pill-nav.tsx`) in the head, cards on the full rail below. No side nav.
- Every page ends with the city, then the footer (`components/site-footer.tsx`): it starts in the color of the building bases, so the page ends on solid ground. It links Terms of Service, Privacy Policy and Report content; on a share page the report link carries that Share URL.
- Legal pages (`components/legal-document.tsx`): the title in the sky, one card of numbered sections, 46rem wide for reading.
- Library and admin lists are tables on desktop and two-line rows on a phone. No card grids for lists.
- Phones get a bottom nav with soft tiles; everything works at 390px with no sideways scroll.

## Elevation & Depth

Flat and tonal. Depth comes from panel shades, not shadows. The only shadows are structural:
- buttons carry an inner bottom edge (`inset 0 -3px 0 rgb(0 0 0 / .18)`), which makes them feel pressable;
- name tags sit on a 3px black ring so they cut into the panel below them.

## Shapes

Radii grow with size: chips 13px, inputs 14px, buttons 16px, list rows 20px, cards and the session column 28px. Icon blobs use uneven corners (`16px 18px 14px 20px`) so they read hand-made. Pills (full round) only for avatars and meters.

## Components

- **Button** (`components/ui/button.tsx`): bold label, inner bottom edge, lifts 1px on hover with a bouncy ease. `default` is sakura; `outline` is the soft raised panel; `secondary` is lavender; `ghost` and `link` are muted.
- **Chips** (`components/chips.tsx`): small single choices (expiry, password, filters), 36px tall. Pressed chip is lamplight. A field in a chip row (the share password) takes the same 36px height and 13px radius.
- **Fields**: inputs, text areas and select triggers share one look: 40px tall, 14px radius, `bg-sunken`, 1.5px `border-input`, a stronger border on hover, and a lavender border with a soft lavender ring on focus. Text is 15px at weight 500.
- **Outline button**: flat `bg-sunken` with a 1.5px border. No inner shadow, so it never shows a double edge.
- **Account menu**: avatar, name, email and an Admin tag at the top; bold items with muted icons; Sign out last, in muted text.
- Everything you can press shows a pointer cursor (base rule in `app.css`).
- **Segment** (Files / Text, tabs): raised track with a lavender active pill.
- **Cards**: `bg-card`, 1.5px `border-border`, 28px radius, 26px padding.
- **Rows**: `bg-card`, 20px radius, 44px icon blob, name, one muted meta line, a status tag, actions on the right.
- **Status tag**: tinted background plus colored text (`bg-mint-soft text-mint` and so on).
- **Dozo** (`components/dozo.tsx`): moods `happy`, `calm`, `wow`, `sleep`. Use it for welcome, empty states, locked or expired states, and as each device's avatar (body color per device). At most one large Dozo per screen.
- **Night sky** (`components/night-sky.tsx`): `NightSky` (fixed, behind the page) and `NightCity` (last in the page, tiles sideways) in `AppShell`, the auth pages and the installer. Both are still WebP images (`.night-sky`, `.night-city` in `app.css`), so the browser paints nothing at runtime. The art is drawn by `lib/night-paint.ts`; after changing it, run `resources/images/night/render.mjs` to make the images again. A wide sky loads on landscape screens and a tall one on phones. `Sparkle` is the online marker.
- **Compose bar** (Transfer Session): one rounded panel with an attach button, a text field that grows with its content, and a sakura Send button.
- **Toast**: white bubble with night text, bold.
- **Dialog**: panel card with a 26px radius, roomy padding.

## Do's and Don'ts

- Do keep one sakura action per screen. Secondary actions are soft or ghost buttons.
- Do say states in words next to their color.
- Do use Dozo to soften empty, locked and expired states, with short, plain copy.
- Don't add gradients, glows or glass blur to content (cards, rows, buttons), or looping animations (pulse, shimmer, spinners). Glow belongs to the painted sky only.
- Don't use gray subtitle lines above headings, or decorative card chrome around single values.
- Don't use em dashes in copy. Keep copy short and direct.
- Don't add faux-Japanese decoration. "どうぞ" is the only Japanese text.

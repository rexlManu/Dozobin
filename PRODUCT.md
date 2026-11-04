# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dōzobin runs as a public, self-hosted instance. Most people who arrive are Guests who have never seen it before: they want to send a file, a screenshot, or text right now, or they opened a Share URL someone sent them. A smaller group are Members who keep a Library, and one or more administrators who run the installation. Transfer Session users move content between their own devices (phone to laptop and back), often standing up, with one hand, on a phone.

## Product Purpose

Share a file or text in seconds without an account, and move content between devices through a temporary Transfer Session. Success: a first-time Guest creates a share or joins a session without reading instructions, and a recipient opening a Share URL immediately understands what it is, whether it is safe, and how to get it.

## Positioning

Self-hosted and direct. The entry screen is the tool itself (the Drop Workspace), not a landing page. Every file becomes its own File Share with its own URL; nothing is bundled. Transfer Sessions are accountless scratch spaces with equal participants that delete themselves after inactivity.

## Operating Context

- Drop Workspace on desktop with drag and drop and clipboard paste; on phone with the file picker.
- Share URLs opened by recipients on any device, often from chat apps.
- Transfer Sessions joined by QR scan or an eight-character Access Code. Two or more devices are open at the same time and must see each other's changes instantly.
- Administrators configure Guest access, limits, file types, expiration, scanning, and housekeeping.

## Capabilities and Constraints

- Terms follow `CONTEXT.md` (File Share, Paste, Regular Share, Transfer Session, Transfer Item, Session Participant, Access Code, Member, Guest, Library, File Store).
- Transfer Sessions must become real time: items, deletions, and participant joins appear instantly on every device, with live presence (which devices are online now). Implemented 2026-11-03 with Laravel Reverb (presence channel per session, same-origin WebSocket at /app, 10-second polling fallback).
- Inactivity window of twelve hours; only Session Activity resets it. Nobody can end a session early; a participant can leave.
- No albums, folders, tags, Paste titles, public feeds, or end-to-end encryption claims.
- Malware scanning is fail-open; Blocked and Unscanned File Shares are distinct states.

## Brand Commitments

- Display name **Dōzobin** (with macron); `dozobin` for technical identifiers.
- The current accent color and logo mark are not binding and may be replaced.
- Owner's standing UI constraints (from the owner's global preferences; the soft anime brief may test a light variant): dark mode, true black (`#000`) background, white primary text, information-dense, no decorative card or pill chrome, no light-gray subtitle lines above sections, minimal copy, no em dashes, no continuously repainting animations.
- Updated 2026-11-02 by the owner: the product should feel soft, comfy and anime-like (cozy, friendly, rounded), explicitly not the generic shadcn look and with no AI-generated ("vibe coded") signals. Authored illustration and a small mascot are allowed. Faux-Japanese decoration and copied anime characters stay out.

## Evidence on Hand

- Current screenshots: `docs/images/dozobin-drop.png`, `docs/images/dozobin-transfer.png`.
- Behavioral brief: `docs/frontend-prototype-spec.md`.
- No testimonials, user counts, or benchmarks exist. Do not invent them.

## Product Principles

1. The tool is the first screen. Never put explanation in front of the action.
2. State is always visible: progress, expiration, protection, scan status, who is online.
3. A stranger must succeed on first contact; a regular must never be slowed down.
4. Temporary things look temporary; permanent things look permanent.
5. Every device is equal in a Transfer Session.

## Accessibility & Inclusion

Keyboard access, visible focus, sufficient contrast, reduced-motion support, non-drag alternatives, and status that does not rely on color alone.

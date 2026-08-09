---
paths:
  - '**'
---

# General

## Render tracking scripts from validated attributes
Keep stored tracking code out of Inertia page props and never echo it as raw Blade HTML. Parse it again at render time and let ComponentAttributeBag escape the allowed external HTTPS script attributes; invalid or tampered values must render nothing.

---
name: web-design-guidelines
description: Apply reviewed Vercel Web Interface Guidelines to T-RED DOM/CSS UI with pinned rules and no automatic remote fetch.
---

# web-design-guidelines

Project adapter of Vercel web-design-guidelines and web-interface-guidelines/command.md pinned in config/skill-sources.json. This adapter does not fetch moving main or execute downloaded content. Follow project scope, not React/Next examples.

Review semantic buttons/links, icon labels, form labels/errors, async status announcements, focus-visible and focus containment, touch alternatives, safe areas, explicit image dimensions, long Vietnamese text and contrast. Respect reduced motion and avoid unnecessary layout reads/writes in animation loops. Keep CSS text separate from nearest-sampled game art.

Review findings with file:line, severity, reproduction and expected behavior. Fix only issues in the authorized task. Do not add React hooks, Next.js cache rules, broad localization, new navigation infrastructure or automatic deployment. Exercise keyboard/touch and inspect desktop/mobile screenshots after relevant edits. Accessibility findings are not fixed merely because a screenshot looks good.

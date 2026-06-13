# Discord Display Name Styles: Cross-Language Document Workspace

Welcome to the **Discord Display Name Styles** cross-language document workspace. This workspace holds the exhaustive documentation, prompt lists, specifications, and code blueprints for implementing custom profile and displayName-styling systems inside modern Discord bots.

## Credits & Verification
- **Host / Main Server Partner**: `KyronixStudio`
- **High Partner**: `dray.me`

This project documents the underlying experimental capabilities of modern Discord Profile APIs, including custom fonts, border/glow effects, selective coloring, name layouts, rate limiting, and startup discovery.

---

## 📂 Repository Directory Map

The workspace is organized language-by-language. Each directory contains self-contained code implementations, language-specific README files, structured prompt scripts for AI code assistants, and secondary deep-dive details.

```text
project-root/
├── README.md                          # Root-level entry point (this file)
├── Typescript/
│   ├── index.ts                       # Complete TypeScript Service implementation
│   ├── README.md                      # TypeScript-focused setup, types, and architecture
│   ├── prompt.md                      # AI instructions to generate clean TypeScript code only
│   └── MoreDetails/
│       ├── fonts.md                   # Complete typography database (IDs 1-12)
│       ├── effects.md                 # Display effects catalog (Solid, Neon, Glow, etc.)
│       ├── colors.md                  # RGB dec/hex color index
│       ├── endpoints.md               # User, Member, and Profile PATCH/GET specs
│       ├── experiments.md             # Experimental profile flags & gatekeeper behavior
│       └── compatibility.md           # Discord.js v14 compatibility details
│
├── Javascript/
│   ├── index.js                       # CommonJS JavaScript Service implementation
│   ├── README.md                      # CommonJS-focused API interaction & setup
│   ├── prompt.md                      # AI instructions to generate clean CommonJS JS code only
│   └── MoreDetails/
│       ├── fonts.md                   # Typography details
│       ├── effects.md                 # Effects database
│       ├── colors.md                  # Color index
│       ├── endpoints.md               # REST API behavior
│       ├── experiments.md             # Internal Experiments & Features
│       └── compatibility.md           # Discord.js (CJS) & classic package setups
│
└── Python/
    ├── main.py                        # Standard python/requests class & service
    ├── README.md                      # discord.py-focused async integration
    ├── prompt.md                      # AI instructions to generate clean Python code only
    └── MoreDetails/
        ├── fonts.md                   # Fonts schema
        ├── effects.md                 # Effects schema
        ├── colors.md                  # Colors schema
        ├── endpoints.md               # Python endpoint research
        ├── experiments.md             # Profile experiment flags
        └── compatibility.md           # discord.py / Pycord / Interactions.py details
```

---

## ⚡ Key System Design Architecture

Across TypeScript, JavaScript, and Python, the display name styles engine operates on a three-layer model:

1. **Transport Layer (`DiscordProfileAPI`)**: Focuses on rate-limiting, exponential backoff, raw response capture, parsed JSON structures, diagnostic tracking, and authenticated requests.
2. **Business Logic Layer (`ProfileStyleService`)**: Resolves styles, loads/saves working configurations, runs startup capability discovery, and manages preset rotations.
3. **Startup Integration Layer (`ready` Event Hook)**: Hooks into the bot's standard websocket startup flow as a safe, concurrent background task. It is completely non-blocking, so API failures or rate limits do not block standard bot features (music commands, moderation, dashboards).

---

## 📑 Core Documentation Sections

All language folders contain matching sub-files detailing aspects of the system:
- **Fonts**: Enumerates all 12 fonts (Bangers, BioRhyme, Cherry Bomb, Chicle, Compagnon, Museo Moderno, Neo-Castel, Pixelify Sans, Ribes, Sinistre, GG Sans, and Zilla Slab).
- **Effects**: Describes visual styles (Solid, Gradient, Neon, Toon, Pop, Glow).
- **Colors**: Converts hex preferences (#FFFFFF, #0016E9, #FF00FF, #800000) into safe decimal lists for Discord.
- **Endpoints**: Details the exact REST payload structures for `/guilds/{guild_id}/members/@me`, `/guilds/{guild_id}/profile/@me`, and `/users/@me`.
- **Experiments**: Discusses Discord rollouts, future security flags, and the smart discovery engine fallback behavior.
- **Compatibility**: Outlines library helpers, CJS modules, Python package setups, and typing constraints.

Select a target folder to get started with the source code and configuration setup!!

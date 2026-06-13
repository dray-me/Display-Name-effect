# Discord Display Name Styles: Cross-Language Document Workspace

Welcome to the **Discord Display Name Styles** cross-language document workspace. This workspace holds the exhaustive documentation, prompt lists, specifications, and code blueprints for implementing custom profile and displayName-styling systems inside modern Discord bots.

## Credits & Verification
- **Created & maintained by**: [KyronixStudio](https://github.com/kyronixstudio)
- **Dev**: `dray.me`,`6fck`
- **GlowForNodejs**: [GlowForNodejs](https://github.com/kyronixstudio/GlowForNodejs)

---

# Join Our discord
- [KyronixStuido](https://discord.gg/FBUEj8daSk)

---

This project documents the underlying experimental capabilities of modern Discord Profile APIs, including custom fonts, border/glow effects, selective coloring, name layouts, rate limiting, and startup discovery.

---

## Repository Directory Map & Navigation

The workspace is organized language-by-language. Below you will find interactive navigation structures to easily browse through self-contained code implementations, language-specific README files, structured prompts, and secondary deep-dive details.

### Quick Navigation Dashboard

For a direct side-by-side comparison across languages, use the dashboard below to jump to specific modules:

| Component / File Type | TypeScript | JavaScript (CommonJS) | Python |
| :--- | :--- | :--- | :--- |
| **Main Implementation** | [index.ts](./Typescript/index.ts) | [index.js](./Javascript/index.js) | [main.py](./Python/main.py) |
| **Language Guide** | [README.md](./Typescript/README.md) | [README.md](./Javascript/README.md) | [README.md](./Python/README.md) |
| **AI Prompt Script** | [prompt.md](./Typescript/prompt.md) | [prompt.md](./Javascript/prompt.md) | [prompt.md](./Python/prompt.md) |
| **Typography (Fonts)** | [fonts.md](./Typescript/MoreDetails/fonts.md) | [fonts.md](./Javascript/MoreDetails/fonts.md) | [fonts.md](./Python/MoreDetails/fonts.md) |
| **Visual Effects** | [effects.md](./Typescript/MoreDetails/effects.md) | [effects.md](./Javascript/MoreDetails/effects.md) | [effects.md](./Python/MoreDetails/effects.md) |
| **Colors Index** | [colors.md](./Typescript/MoreDetails/colors.md) | [colors.md](./Javascript/MoreDetails/colors.md) | [colors.md](./Python/MoreDetails/colors.md) |
| **API Endpoints Spec** | [endpoints.md](./Typescript/MoreDetails/endpoints.md) | [endpoints.md](./Javascript/MoreDetails/endpoints.md) | [endpoints.md](./Python/MoreDetails/endpoints.md) |
| **Experimental Flags** | [experiments.md](./Typescript/MoreDetails/experiments.md) | [experiments.md](./Javascript/MoreDetails/experiments.md) | [experiments.md](./Python/MoreDetails/experiments.md) |
| **Compatibility Guide** | [compatibility.md](./Typescript/MoreDetails/compatibility.md) | [compatibility.md](./Javascript/MoreDetails/compatibility.md) | [compatibility.md](./Python/MoreDetails/compatibility.md) |

---

### Clickable File Tree Map

Explore the file hierarchy interactively:

[project-root](./)  
├── [README.md](./README.md) *(Root entry point - this file)*  
├── [Typescript/](./Typescript/) *(TypeScript Project Directory)*  
│   ├── [index.ts](./Typescript/index.ts) *(Complete TypeScript Service implementation)*  
│   ├── [README.md](./Typescript/README.md) *(TypeScript setup, types, & architecture)*  
│   ├── [prompt.md](./Typescript/prompt.md) *(AI code prompt for custom TypeScript generation)*  
│   └── [MoreDetails/](./Typescript/MoreDetails/) *(TypeScript deep-dive details)*  
│       ├── [fonts.md](./Typescript/MoreDetails/fonts.md) *(Typography database: IDs 1-12)*  
│       ├── [effects.md](./Typescript/MoreDetails/effects.md) *(Visual effects: Solid, Glow, Neon)*  
│       ├── [colors.md](./Typescript/MoreDetails/colors.md) *(RGB decimal/hex color index)*  
│       ├── [endpoints.md](./Typescript/MoreDetails/endpoints.md) *(User/Member REST endpoint specs)*  
│       ├── [experiments.md](./Typescript/MoreDetails/experiments.md) *(Feature rollout flags & gates)*  
│       └── [compatibility.md](./Typescript/MoreDetails/compatibility.md) *(Discord.js v14 compatibility)*  
├── [Javascript/](./Javascript/) *(JavaScript Project Directory)*  
│   ├── [index.js](./Javascript/index.js) *(CommonJS API interaction implementation)*  
│   ├── [README.md](./Javascript/README.md) *(JavaScript setup & style documentation)*  
│   ├── [prompt.md](./Javascript/prompt.md) *(AI code prompt for custom JS generation)*  
│   └── [MoreDetails/](./Javascript/MoreDetails/) *(JavaScript deep-dive details)*  
│       ├── [fonts.md](./Javascript/MoreDetails/fonts.md) *(Typography database details)*  
│       ├── [effects.md](./Javascript/MoreDetails/effects.md) *(Effects catalog)*  
│       ├── [colors.md](./Javascript/MoreDetails/colors.md) *(Color options & conversions)*  
│       ├── [endpoints.md](./Javascript/MoreDetails/endpoints.md) *(Discord REST API compatibility specs)*  
│       ├── [experiments.md](./Javascript/MoreDetails/experiments.md) *(Core profile experiments)*  
│       └── [compatibility.md](./Javascript/MoreDetails/compatibility.md) *(discord.js CJS support specs)*  
└── [Python/](./Python/) *(Python Project Directory)*  
    ├── [main.py](./Python/main.py) *(Standard Python requests class & service)*  
    ├── [README.md](./Python/README.md) *(Python integration guide & async client)*  
    ├── [prompt.md](./Python/prompt.md) *(AI code prompt for custom Python generation)*  
    └── [MoreDetails/](./Python/MoreDetails/) *(Python deep-dive details)*  
        ├── [fonts.md](./Python/MoreDetails/fonts.md) *(Typography details)*  
        ├── [effects.md](./Python/MoreDetails/effects.md) *(Effects schema database)*  
        ├── [colors.md](./Python/MoreDetails/colors.md) *(Colors map database)*  
        ├── [endpoints.md](./Python/MoreDetails/endpoints.md) *(Python REST API endpoints)*  
        ├── [experiments.md](./Python/MoreDetails/experiments.md) *(Profile experiment gates)*  
        └── [compatibility.md](./Python/MoreDetails/compatibility.md) *(discord.py, Pycord, Interactions.py support)*  

---

## Key System Design Architecture

Across TypeScript, JavaScript, and Python, the display name styles engine operates on a three-layer model:

1. **Transport Layer (`DiscordProfileAPI`)**: Focuses on rate-limiting, exponential backoff, raw response capture, parsed JSON structures, diagnostic tracking, and authenticated requests.
2. **Business Logic Layer (`ProfileStyleService`)**: Resolves styles, loads/saves working configurations, runs startup capability discovery, and manages preset rotations.
3. **Startup Integration Layer (`ready` Event Hook)**: Hooks into the bot's standard websocket startup flow as a safe, concurrent background task. It is completely non-blocking, so API failures or rate limits do not block standard bot features (music commands, moderation, dashboards).

---

## Core Documentation Sections

All language folders contain matching sub-files detailing aspects of the system:
- **Fonts**: Enumerates all 12 fonts (Bangers, BioRhyme, Cherry Bomb, Chicle, Compagnon, Museo Moderno, Neo-Castel, Pixelify Sans, Ribes, Sinistre, GG Sans, and Zilla Slab).
- **Effects**: Describes visual styles (Solid, Gradient, Neon, Toon, Pop, Glow).
- **Colors**: Converts hex preferences (#FFFFFF, #0016E9, #FF00FF, #800000) into safe decimal lists for Discord.
- **Endpoints**: Details the exact REST payload structures for `/guilds/{guild_id}/members/@me`, `/guilds/{guild_id}/profile/@me`, and `/users/@me`.
- **Experiments**: Discusses Discord rollouts, future security flags, and the smart discovery engine fallback behavior.
- **Compatibility**: Outlines library helpers, CJS modules, Python package setups, and typing constraints.

Select a target folder to get started with the source code and configuration setup!

##  © KYRONIX STUDIO & DREY & RURU ALL RIGHTS RESERVED 

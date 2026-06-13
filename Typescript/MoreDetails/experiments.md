# 🧪 Discord Experiments & Profiling — TypeScript

Discord uses a comprehensive internal feature flagging and experiment rollout system (often referred to internally as "Experiments" or "User Settings overrides"). This document details how these experiments impact Display Name Styles, guild profiles, and bot account capabilities.

---

## 🔬 Profile Customization Experiments

Display Name Styles are linked directly to experimental profile attributes that are slowly rolling out or are gatekept behind specific flags:

### 1. Font and Effect Customization Rollouts
- **Experiment Class/ID**: Under-the-hood experiments targeting guild member display attributes.
- **Rollout Mechanism**: Often rolled out based on a combination of Guild ID shards, Bot/User creation date thresholds, or client build variants.
- **Client Behavior**: When enabled, the Discord client queries the REST API and renders names using CSS canvas shaders, specific WebGL font assets, and layout coordinates based on `display_name_styles` metadata in profiles.

### 2. Profile Customization Subsystems
Discord maintains separate, complementary custom profiling APIs that the bot can update dynamically:
- **Guild Specific Avatar**: Changes the bot's avatar for a single server (`avatar` payload in the member PATCH API).
- **Guild Specific Banner**: Customizes the back-banner image for a single server (`banner` payload in the member PATCH API).
- **Guild Specific Bio**: Text bio specific to a single server (`bio` payload in the member PATCH API).
- **Display Name Style UI**: Customizes nickname font, border highlight rings, and shadow accents using the style parameters outlined in this guide.

---

## 🤖 Guild Profiles vs User Profiles vs Bot Profiles

Custom metadata properties behave differently depending on the account classification and scope:

### Global Bot Profile (`PATCH /users/@me`)
- **Flags**: Modifies the global username, avatar, and banner.
- **Display Name Styles**: Global bot profiles typically **disable** nested custom display name style overrides to avoid bot impersontation issues in neutral spaces. Attempts to patch globally frequently trigger `400` or `403` validation errors.

### Guild Member Profile (`PATCH /guilds/{guild_id}/members/@me`)
- **Flags**: Server-scoped nicknames, avatars, banners, and bios.
- **Display Name Styles**: Highly supported for both user and bot accounts. Since changes are localized to a single guild, administrators can design a customized appearance mirroring their server branding.

---

## ⚠️ Future Security Risks & Mitigations

When maintaining an app utilizing experimental API parameters, be aware of the following structural risks:

### 1. Sudden Schema Overhauls
- **The Risk**: Discord might transition completely from Nested Format A to Flat Format B, or deprecate current property names (like `display_name_effect_id` or `display_name_colors`) in favor of unified style configurations.
- **The Mitigation**: The `ProfileStyleService` is built defensively. It uses dynamic discovery to test both Format A and Format B sequentially on startup. If one format becomes deprecated, it falls back to the other automatically and skips subsequent testing.

### 2. Stale Cached Routes
- **The Risk**: A previously stored successful config in `working-config.json` becomes obsolete when Discord alters a route or shuffles account-level permissions.
- **The Mitigation**: In `ProfileStyleService.run()`, if a cached configuration is applied but the Verification Protocol fails to see updated style attributes in responses, the service invalidates the cache immediately, triggering a fresh **endpoint discovery loop**.

### 3. Rate-Limiting Overhead
- **The Risk**: Profile and member update endpoints possess tight, guild-scoped rate limits. Repeated updating can trigger HTTP `429` errors.
- **The Mitigation**: In `DiscordProfileAPI`, rigorous headers evaluation extracts the `retry-after` metadata and schedules a non-blocking timeout. Furthermore, the `ProfileStyleService` implements an optional `DISCORD_PROFILE_STYLE_REQUEST_DELAY_MS` (default `1500`) to pace compatibility tests.

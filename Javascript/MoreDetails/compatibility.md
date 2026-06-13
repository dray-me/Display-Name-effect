# 📦 Library Compatibility Details — JavaScript

This document outlines the framework compatibility and library-specific integrations for the **Discord Display Name Styles** service in CommonJS JavaScript.

---

## 🟢 Discord.js v14 Traditional Integration

The subsystem is fully compatible with **Discord.js v14** (and newer). It interacts safely with standard client managers without breaking secondary handlers, command registers, or music controls.

### 🔌 Ready Event Verification

When hooking the `ProfileStyleService` into the ready event, always wrap its initialization in a macro-task timer like `setImmediate()` or `setTimeout()`. This ensures that primary websocket procedures, guild streaming, and command configurations continue concurrently.

```javascript
const { Client } = require("discord.js");
const { ProfileStyleService } = require("./services/ProfileStyleService");

function handleReady(client) {
  setImmediate(async () => {
    try {
      const service = new ProfileStyleService(client, {
        runCompatibilityTests: false, // Recommended for production to save rate-limit buffers
        maxRetries: 2
      });
      const report = await service.run();
      console.log(`[DisplayNameStyles] Running verified config. Payload format: ${report.payloadFormat}`);
    } catch (err) {
      console.error("[DisplayNameStyles] Background tasks failed safely:", err);
    }
  });
}

module.exports = { handleReady };
```

---

## 🔑 Bot Token Support & Permissions

Depending on your application's setup, Discord may apply different restrictions:

### 1. Change Nickname Permission
To update the bot's display properties via the `PATCH /guilds/{guild_id}/members/@me` endpoint, the bot's role inside that specific server **must** possess the `Change Nickname` permission (`ChangeNickname` flag in Discord.js).
- **Check code**:
  ```javascript
  const me = message.guild.members.me;
  if (!me.permissions.has(PermissionsBitField.Flags.ChangeNickname)) {
    // Falls back or alerts of insufficient permissions
  }
  ```

### 2. Sharding and Clustering
When deploying sharded bots via `discord-hybrid-sharding` or standard ShardingManagers:
- **Design pattern**: Running the style service on **all shards concurrently** can result in duplicate REST calls, causing rate limits.
- **Recommended practice**: Run the startup task exclusively on **Shard 0** or secure a simple distributed lock.
  ```javascript
  if (client.shard && client.shard.ids.includes(0)) {
    // Only run on Shard 0
    ProfileStyleService.initialize(client);
  }
  ```

---

## 🛠️ Node.js Support

The service requires **Node.js 18+** in order to utilize the native global `fetch` API. If running on older Node environments (Node 16 or below), integrate the `undici` or `node-fetch` package and assign `global.fetch`:

```javascript
// Add at the very top of your entry point file if on Node < 18:
if (!global.fetch) {
  global.fetch = require("undici").fetch;
}
```

# 📦 Library Compatibility Details — TypeScript

This document outlines the framework compatibility and library-specific integrations for the **Discord Display Name Styles** service in TypeScript.

---

## 🟢 Discord.js v14 Integration

The subsystem is fully compatible with **Discord.js v14** (and newer). It interacts safely with standard client managers without breaking secondary handlers, command registers, or shard managers.

### 🔌 Ready Event Verification

When hooking the `ProfileStyleService` into the ready event, always wrap its initialization in a macro-task timer like `setImmediate()` or `setTimeout()`. This ensures that primary websocket procedures, guild streaming, and REST registration continue concurrently.

```typescript
import { Client } from "discord.js";
import { ProfileStyleService } from "./services/ProfileStyleService";

export function handleReady(client: Client) {
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
```

---

## 🔑 Bot Token Support & Permissions

Depending on your application's setup, Discord may apply different restrictions:

### 1. Change Nickname Permission
To update the bot's display properties via the `PATCH /guilds/{guild_id}/members/@me` endpoint, the bot's role inside that specific server **must** possess the `Change Nickname` permission (`ChangeNickname` flag in Discord.js).
- **Check code**:
  ```typescript
  const me = message.guild.members.me;
  if (!me.permissions.has(PermissionsBitField.Flags.ChangeNickname)) {
    // Falls back or alerts of insufficient permissions
  }
  ```

### 2. Sharding and Clustering
When deploying sharded bots via `discord-hybrid-sharding` or standard ShardingManagers:
- **Design pattern**: Running the style service on **all shards concurrently** can result in duplicate REST calls, causing rate limits.
- **Recommended practice**: Run the startup task exclusively on **Shard 0** or secure a simple distributed lock.
  ```typescript
  if (client.shard && client.shard.ids.includes(0)) {
    // Only run on Shard 0
    ProfileStyleService.initialize(client);
  }
  ```

---

## 🛠️ TypeScript TSConfig & ESM Support

Ensure your `tsconfig.json` accommodates type checking for modern modules:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

If your bot uses CommonJS output:
- Ensure `"esModuleInterop": true` is enabled to allow importing `fs` and `path` seamlessly.
- Use explicit TypeScript parameters, return type definitions, and type guards as outlined inside `Typescript/index.ts`.

# 🌐 Endpoint Research & Specs — Python

This document outlines the underlying HTTP network API requests made by the **Discord Display Name Styles** service. It details exact endpoints, support paths, payload structures, permissions, and typical response formats.

---

## 🛣️ Catalog of Candidate Endpoints

The system tests three separate REST endpoints during its discovery phase. If a guild context is available, guild-scoped endpoints are checked first, as Display Name Styles are frequently scoped specifically to guild-member records.

---

### 1. `PATCH /guilds/{guild_id}/members/@me`
- **Type**: Guild-Scoped
- **Description**: Updates the bot's own member details in a specific server.
- **Path Parameters**: `{guild_id}` (e.g. `123456789012345678`)
- **Required Bot Permissions**: `Change Nickname` (under `PermissionsBitField.Flags.ChangeNickname` or `1 << 26`).
- **Nesting Formats**: Supports Payload Format B (Flat Fields) as the primary format, occasionally supports A.
- **Example Payload**:
  ```json
  {
    "display_name_font_id": 10,
    "display_name_effect_id": 3,
    "display_name_colors": [16777215]
  }
  ```
- **Expected Responses**:
  - `200 OK`: Successful update. Returns the modified member object containing the updated font/effect fields inside.
  - `400 Bad Request`: Invalid payload parameters (e.g. unknown font ID/colors array).
  - `403 Forbidden`: Bot does not have the "Change Nickname" permission in that specific guild.

---

### 2. `PATCH /guilds/{guild_id}/profile/@me`
- **Type**: Guild-Scoped Profile (Experimental)
- **Description**: Updates the bot's server-specific profile customizations (including server bios, banners, and names).
- **Path Parameters**: `{guild_id}`
- **Required Bot Permissions**: None explicitly, but depends on guild member customization configurations.
- **Nesting Formats**: Highly receptive to Payload Format A (Nested objects) on experimental server rollouts.
- **Example Payload**:
  ```json
  {
    "display_name_styles": {
      "font_id": 10,
      "effect_id": 3,
      "colors": [16777215]
    }
  }
  ```
- **Expected Responses**:
  - `200 OK`: Success. Returns the modified guild profile data structure containing the nested style options.
  - `404 Not Found`: API route not available for this account bucket or guild type.
  - `403 Forbidden`: Permissions error or feature locked behind premium subscriptions.

---

### 3. `PATCH /users/@me`
- **Type**: Global User Profile
- **Description**: Modifies the global user settings for the bot account.
- **Path Parameters**: None.
- **Required Bot Permissions**: None.
- **Nesting Formats**: Payload Format B (Flat) or Payload Format A (Nested).
- **Example Payload**:
  ```json
  {
    "display_name_font_id": 10,
    "display_name_effect_id": 3,
    "display_name_colors": [16777215]
  }
  ```
- **Expected Responses**:
  - `200 OK`: Returns the complete modified User object.
  - `400 Bad Request`: Field naming or payload type mismatch.
  - `403 Forbidden`: Bot accounts are strictly forbidden from modifying user profile details globally on this endpoint.

---

## 📂 Payload Format Comparison

| Feature / Detail | Format A (Nested Style Object) | Format B (Flat Fields) |
|---|---|---|
| **Root Field Name** | `"display_name_styles"` | None (Directly in root) |
| **Font Property** | `"font_id": number` | `"display_name_font_id": number` |
| **Effect Property** | `"effect_id": number` | `"display_name_effect_id": number` |
| **Colors Property** | `"colors": number[]` | `"display_name_colors": number[]` |
| **JSON Sample** | `{"display_name_styles": {"font_id": 10, "effect_id": 3, "colors": [16777215]}}` | `{"display_name_font_id": 10, "display_name_effect_id": 3, "display_name_colors": [16777215]}` |

---

## 🧪 Response Verification Protocol

A successful HTTP response code (like `200` or `204`) on a `PATCH` request is **not alone sufficient** to verify that Display Name Styles are active. Some Discord endpoints silently ignore unrecognized properties while updating other normal fields.

The `ProfileStyleService` validates success using a two-stage Verification Protocol:
1. **Direct Parsing**: Scans the response JSON recursively. If it finds the requested font ID and effect ID matches exactly, the endpoint has confirmed support.
2. **GET Verification**: If the `PATCH` response does not return style details, the service fires up a separate `GET` route to `/users/@me` or `/users/{bot_id}/profile?guild_id={guild_id}` to confirm changes are reflected.

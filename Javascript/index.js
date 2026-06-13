const fs = require("fs");
const path = require("path");

// ============================================================================
// CONSTANTS
// ============================================================================

const FONTS = [
  { label: "Bangers", value: "bangers", id: 1, description: "Bold comic-style font" },
  { label: "BioRhyme", value: "biorhyme", id: 2, description: "Elegant serif font" },
  { label: "Cherry Bomb", value: "cherry_bomb", id: 3, description: "Playful bubble font" },
  { label: "Chicle", value: "chicle", id: 4, description: "Rounded soft font" },
  { label: "Compagnon", value: "compagnon", id: 5, description: "Monospaced display font" },
  { label: "Museo Moderno", value: "museo_moderno", id: 6, description: "Modern display font" },
  { label: "Neo-Castel", value: "neo_castel", id: 7, description: "Gothic medieval font" },
  { label: "Pixelify Sans", value: "pixelify_sans", id: 8, description: "Retro pixel font" },
  { label: "Ribes", value: "ribes", id: 9, description: "Decorative display font" },
  { label: "Sinistre", value: "sinistre", id: 10, description: "Dark elegant font" },
  { label: "Default (GG Sans)", value: "default", id: 11, description: "Standard Discord font" },
  { label: "Zilla Slab", value: "zilla_slab", id: 12, description: "Modern slab-serif font" }
];

const EFFECTS = [
  { label: "Solid", value: "solid", id: 1, description: "Single flat color" },
  { label: "Gradient", value: "gradient", id: 2, description: "Two-color gradient (needs 2 colors)" },
  { label: "Neon", value: "neon", id: 3, description: "Glowing outline effect" },
  { label: "Toon", value: "toon", id: 4, description: "Subtle gradient with stroke" },
  { label: "Pop", value: "pop", id: 5, description: "Colored drop shadow" },
  { label: "Glow", value: "glow", id: 6, description: "Soft glow effect" }
];

const COLOR_TESTS = [
  { label: "White", colors: [16777215] },
  { label: "Blue", colors: [5865] },
  { label: "Pink", colors: [16711935] },
  { label: "Purple", colors: [8388736] },
  { label: "White to Blue Gradient", colors: [16777215, 5865] },
  { label: "Pink to Purple Gradient", colors: [16711935, 8388736] }
];

const TARGET_STYLE = {
  font_id: 10,
  effect_id: 3,
  colors: [16777215]
};

const STYLE_PRESETS = [
  { key: "sinistre-neon-white", label: "Sinistre Neon White", style: { font_id: 10, effect_id: 3, colors: [16777215] } },
  { key: "ribes-neon-pink", label: "Ribes Neon Pink", style: { font_id: 9, effect_id: 3, colors: [16711935] } },
  { key: "neo-castel-gradient-blue-white", label: "Neo-Castel Blue/White Gradient", style: { font_id: 7, effect_id: 2, colors: [5865, 16777215] } },
  { key: "pixelify-pop-purple", label: "Pixelify Sans Pop Purple", style: { font_id: 8, effect_id: 5, colors: [8388736] } },
  { key: "bangers-glow-pink-purple", label: "Bangers Pink/Purple Glow", style: { font_id: 1, effect_id: 6, colors: [16711935, 8388736] } },
  { key: "cherry-toon-white", label: "Cherry Bomb Toon White", style: { font_id: 3, effect_id: 4, colors: [16777215] } },
  { key: "zilla-solid-blue", label: "Zilla Slab Solid Blue", style: { font_id: 12, effect_id: 1, colors: [5865] } }
];

const PAYLOAD_FORMATS = {
  A: (style) => ({ display_name_styles: style }),
  B: (style) => ({
    display_name_font_id: style.font_id,
    display_name_effect_id: style.effect_id,
    display_name_colors: style.colors
  })
};

const SUPPORTED_ERROR_STATUSES = new Set([400, 401, 403, 404, 405, 409, 429, 500, 502, 503, 504]);
const DEFAULT_LOG_DIR = path.join(process.cwd(), "logs", "display-name-styles");

// ============================================================================
// TRANSPORT LAYER: DiscordProfileAPI
// ============================================================================

class DiscordProfileAPI {
  constructor(token, baseUrl = "https://discord.com/api/v10", logger, maxRetries = 3, retryBaseDelayMs = 1000) {
    this.token = token;
    this.baseUrl = baseUrl;
    this.logger = logger || (() => {});
    this.maxRetries = maxRetries;
    this.retryBaseDelayMs = retryBaseDelayMs;
  }

  async patch(endpoint, body, options = {}) {
    return this.request("PATCH", endpoint, body, options);
  }

  async get(endpoint, options = {}) {
    return this.request("GET", endpoint, null, options);
  }

  async request(method, endpoint, body, options) {
    const url = `${this.baseUrl}${endpoint}`;
    let attempt = 0;
    const maxAttempts = (options.maxRetries ?? this.maxRetries) + 1;

    while (attempt < maxAttempts) {
      attempt++;
      const startTime = Date.now();
      let response = null;
      let raw = "";
      let parsed = null;
      let parseError = null;

      try {
        const headers = {
          "Authorization": `Bot ${this.token}`,
          "User-Agent": "DiscordBot (https://discord.com, 1.0)"
        };

        if (method !== "GET") {
          headers["Content-Type"] = "application/json";
          headers["Accept"] = "application/json";
        }

        const fetchOptions = {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined
        };

        response = await fetch(url, fetchOptions);
        raw = await response.text();

        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          parseError = err.message;
        }
      } catch (err) {
        const duration = Date.now() - startTime;
        const result = {
          ok: false,
          status: 0,
          statusText: "NETWORK_ERROR",
          method,
          endpoint,
          url,
          attempt,
          durationMs: duration,
          headers: {},
          retryAfterSeconds: null,
          rateLimited: false,
          raw: err.message,
          parsed: null,
          parseError: null,
          requestBody: body,
          error: {
            name: err.name,
            message: err.message,
            stack: err.stack
          }
        };

        this.logger(result);

        if (attempt < maxAttempts) {
          const delay = (this.retryBaseDelayMs * Math.pow(2, attempt - 1)) / 1000;
          await new Promise((resolve) => setTimeout(resolve, delay * 1000));
          continue;
        }
        return result;
      }

      const duration = Date.now() - startTime;
      const headers = this.pickHeaders(response);
      const retryAfterSeconds = this.getRetryAfterSeconds(response, parsed);
      const rateLimited = response.status === 429;

      const result = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        method,
        endpoint,
        url,
        attempt,
        durationMs: duration,
        headers,
        retryAfterSeconds,
        rateLimited,
        raw,
        parsed,
        parseError,
        requestBody: body,
        error: null
      };

      this.logger(result);

      if (rateLimited && attempt < maxAttempts) {
        const delay = retryAfterSeconds ?? ((this.retryBaseDelayMs * Math.pow(2, attempt - 1)) / 1000);
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
        continue;
      }

      const shouldRetry = new Set([500, 502, 503, 504]).has(response.status) && attempt < maxAttempts;
      if (shouldRetry) {
        const delay = (this.retryBaseDelayMs * Math.pow(2, attempt - 1)) / 1000;
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
        continue;
      }

      return result;
    }

    throw new Error("DiscordProfileAPI request reached an unreachable state.");
  }

  getRetryAfterSeconds(response, parsed) {
    if (parsed && typeof parsed.retry_after === "number") {
      return parsed.retry_after;
    }
    const headerValue = response.headers.get("retry-after");
    if (headerValue) {
      const parsedFloat = parseFloat(headerValue);
      if (!isNaN(parsedFloat)) return parsedFloat;
    }
    return null;
  }

  pickHeaders(response) {
    const headers = {};
    const keys = [
      "content-type",
      "date",
      "x-ratelimit-bucket",
      "x-ratelimit-limit",
      "x-ratelimit-remaining",
      "x-ratelimit-reset",
      "x-ratelimit-reset-after",
      "retry-after",
      "x-discord-trace-id"
    ];
    for (const key of keys) {
      const value = response.headers.get(key);
      if (value) {
        headers[key] = value;
      }
    }
    return headers;
  }
}

// ============================================================================
// BUSINESS LOGIC LAYER: ProfileStyleService
// ============================================================================

class ProfileStyleService {
  constructor(client, options = {}) {
    this.client = client;
    this.options = {
      logDir: options.logDir ?? process.env.DISCORD_PROFILE_STYLE_LOG_DIR ?? DEFAULT_LOG_DIR,
      forceDiscovery: options.forceDiscovery ?? process.env.DISCORD_PROFILE_STYLE_FORCE_DISCOVERY === "true",
      runCompatibilityTests: options.runCompatibilityTests ?? process.env.DISCORD_PROFILE_STYLE_RUN_COMPATIBILITY === "true",
      requestDelayMs: Number(process.env.DISCORD_PROFILE_STYLE_REQUEST_DELAY_MS ?? options.requestDelayMs ?? 1500),
      maxRetries: Number(process.env.DISCORD_PROFILE_STYLE_MAX_RETRIES ?? options.maxRetries ?? 2),
      targetStyle: options.targetStyle ?? null,
      stylePreset: options.stylePreset ?? process.env.DISCORD_PROFILE_STYLE_PRESET ?? "",
      styleMode: options.styleMode ?? process.env.DISCORD_PROFILE_STYLE_MODE ?? "rotate",
      guildId: options.guildId ?? process.env.DISCORD_PROFILE_STYLE_GUILD_ID ?? ""
    };

    this.report = this.createEmptyReport();
    this.runId = new Date().toISOString().replace(/:/g, "-").replace(/\./g, "-");
    this.logFile = path.join(this.options.logDir, `${this.runId}.jsonl`);
    this.reportFile = path.join(this.options.logDir, "latest-report.md");
    this.cacheFile = path.join(this.options.logDir, "working-config.json");
    this.rotationFile = path.join(this.options.logDir, "preset-rotation.json");
    this.api = null;
    this.selectedStylePreset = null;
  }

  static async initialize(client, options) {
    const service = new ProfileStyleService(client, options);
    return service.run();
  }

  async run() {
    await this.ensureLogDirectory();

    try {
      if (process.env.DISCORD_PROFILE_STYLE_ENABLED === "false") {
        await this.writeSummary("Display Name Styles disabled by DISCORD_PROFILE_STYLE_ENABLED=false.");
        return this.report;
      }

      const token = this.client?.token ?? process.env.DISCORD_TOKEN ?? this.client?.config?.token;
      if (!token) {
        await this.writeSummary("No Discord bot token available for Display Name Styles startup task.");
        return this.report;
      }

      this.api = new DiscordProfileAPI(
        token,
        undefined,
        (entry) => this.logApiResponse(entry),
        this.options.maxRetries
      );

      await this.resolveTargetStyle();
      this.report.botTokenSupported = "UNKNOWN";
      this.report.selectedStylePreset = this.selectedStylePreset;
      this.report.availableStylePresets = STYLE_PRESETS;
      this.report.finalTargetConfiguration = this.options.targetStyle;

      const cached = await this.loadWorkingConfig();
      if (cached && !this.options.forceDiscovery) {
        await this.writeSummary("Using saved Display Name Styles configuration from a previous successful run.");
        const responses = await this.applyCachedConfiguration(cached);
        const applied = responses.some((r) => this.isStyleConfirmed(r, this.options.targetStyle));
        if (applied) {
          await this.saveWorkingConfig(this.report.finalWorkingConfiguration ?? cached);
          await this.finalizeReport("Applied saved working configuration.");
          return this.report;
        }
        await this.writeSummary("Saved Display Name Styles configuration failed verification; running fresh discovery.");
      }

      const endpoints = this.getCandidateEndpoints();
      await this.writeSummary(`Starting Display Name Styles discovery with ${endpoints.length} endpoint(s).`);

      const working = await this.detectWorkingConfiguration(endpoints);
      if (working) {
        await this.applyFinalStyle(working);
        await this.saveWorkingConfig(this.report.finalWorkingConfiguration ?? working);
        if (this.options.runCompatibilityTests) {
          await this.runCompatibilityMatrix(working);
          await this.applyFinalStyle(working);
        }
      } else {
        this.report.endpointSupported = "NO";
        this.report.botTokenSupported = this.report.botTokenSupported === "YES" ? "YES" : "NO";
      }

      await this.finalizeReport(working ? "Display Name Styles startup task completed." : "No working Display Name Styles configuration was found.");
    } catch (err) {
      await this.logEvent("fatal-error", { message: err.message, stack: err.stack });
      await this.finalizeReport("Display Name Styles startup task failed safely; bot startup continued.");
    }

    return this.report;
  }

  createEmptyReport() {
    return {
      title: "Display Name Styles Report",
      generatedAt: new Date().toISOString(),
      endpointSupported: "UNKNOWN",
      botTokenSupported: "UNKNOWN",
      payloadFormat: "UNKNOWN",
      acceptedFontIds: [],
      acceptedEffectIds: [],
      acceptedColors: [],
      finalWorkingConfiguration: null,
      finalTargetConfiguration: null,
      selectedStylePreset: null,
      availableStylePresets: [],
      unsupportedFields: [],
      endpoints: {},
      notes: []
    };
  }

  async resolveTargetStyle() {
    if (this.options.targetStyle) {
      this.selectedStylePreset = { key: "custom-options", label: "Custom Options", style: this.options.targetStyle };
      return;
    }

    const envStyle = this.parseEnvironmentStyle();
    if (envStyle) {
      this.options.targetStyle = envStyle;
      this.selectedStylePreset = { key: "custom-env", label: "Custom Environment Style", style: envStyle };
      return;
    }

    const preset = await this.selectPreset();
    this.options.targetStyle = { ...preset.style, colors: [...preset.style.colors] };
    this.selectedStylePreset = preset;
    await this.writeSummary(`Selected Display Name Style preset: ${preset.label} (${preset.key}).`);
  }

  parseEnvironmentStyle() {
    if (process.env.DISCORD_PROFILE_STYLE_JSON) {
      try {
        const style = JSON.parse(process.env.DISCORD_PROFILE_STYLE_JSON);
        if (this.validateStyle(style)) {
          return style;
        }
        this.report.notes.push("DISCORD_PROFILE_STYLE_JSON was present but invalid.");
      } catch (err) {
        this.report.notes.push(`DISCORD_PROFILE_STYLE_JSON could not be parsed: ${err.message}`);
      }
    }

    const fontId = process.env.DISCORD_PROFILE_STYLE_FONT_ID ? parseInt(process.env.DISCORD_PROFILE_STYLE_FONT_ID, 10) : NaN;
    const effectId = process.env.DISCORD_PROFILE_STYLE_EFFECT_ID ? parseInt(process.env.DISCORD_PROFILE_STYLE_EFFECT_ID, 10) : NaN;
    const colors = this.parseColorList(process.env.DISCORD_PROFILE_STYLE_COLORS);

    if (!isNaN(fontId) && !isNaN(effectId) && colors) {
      const style = { font_id: fontId, effect_id: effectId, colors };
      if (this.validateStyle(style)) {
        return style;
      }
    }

    return null;
  }

  parseColorList(value) {
    if (!value) return null;
    const split = value.split(",");
    const parsed = split.map((c) => parseInt(c.trim(), 10)).filter((n) => !isNaN(n));
    return parsed.length > 0 ? parsed : null;
  }

  async selectPreset() {
    const presetKey = this.options.stylePreset.trim().toLowerCase();
    if (presetKey) {
      const preset = STYLE_PRESETS.find((p) => p.key === presetKey || p.label.toLowerCase() === presetKey);
      if (preset) return preset;
      this.report.notes.push(`Unknown Display Name Style preset '${this.options.stylePreset}', falling back to rotation mode.`);
    }

    const mode = this.options.styleMode.toLowerCase();
    if (mode === "random") {
      const index = Math.floor(Math.random() * STYLE_PRESETS.length);
      return STYLE_PRESETS[index];
    }

    if (mode === "fixed") {
      return STYLE_PRESETS[0];
    }

    const state = await this.loadRotationState();
    const index = typeof state.nextIndex === "number" ? state.nextIndex : 1;
    const preset = STYLE_PRESETS[index % STYLE_PRESETS.length];

    await this.saveRotationState({
      nextIndex: (index + 1) % STYLE_PRESETS.length,
      lastPresetKey: preset.key,
      updatedAt: new Date().toISOString()
    });

    return preset;
  }

  async loadRotationState() {
    try {
      if (fs.existsSync(this.rotationFile)) {
        const text = fs.readFileSync(this.rotationFile, "utf-8");
        return JSON.parse(text);
      }
    } catch {}
    return {};
  }

  async saveRotationState(state) {
    try {
      fs.writeFileSync(this.rotationFile, JSON.stringify(state, null, 2), "utf-8");
    } catch {}
  }

  validateStyle(style) {
    return (
      style &&
      typeof style.font_id === "number" &&
      typeof style.effect_id === "number" &&
      Array.isArray(style.colors) &&
      style.colors.length >= 1 &&
      style.colors.every((c) => typeof c === "number" && c >= 0 && c <= 0xffffff)
    );
  }

  getCandidateEndpoints() {
    const guildId = this.options.guildId || this.getGuildIds()[0];
    const endpoints = [];

    if (guildId) {
      endpoints.push({
        key: "guild-members-me",
        label: "PATCH /guilds/{guild_id}/members/@me",
        endpoint: `/guilds/${guildId}/members/@me`,
        endpointTemplate: "/guilds/{guild_id}/members/@me",
        guildId,
        guildScoped: true,
        payloadFormats: ["B", "A"]
      });
      endpoints.push({
        key: "guild-profile-me",
        label: "PATCH /guilds/{guild_id}/profile/@me",
        endpoint: `/guilds/${guildId}/profile/@me`,
        endpointTemplate: "/guilds/{guild_id}/profile/@me",
        guildId,
        guildScoped: true,
        payloadFormats: ["B", "A"]
      });
    } else {
      this.report.notes.push("No guild id was available, so guild-specific profile endpoints were skipped.");
    }

    endpoints.push({
      key: "users-me",
      label: "PATCH /users/@me",
      endpoint: "/users/@me",
      endpointTemplate: "/users/@me",
      guildId: null,
      guildScoped: false,
      payloadFormats: ["B", "A"]
    });

    return endpoints;
  }

  getGuildIds() {
    const cache = this.client?.guilds?.cache;
    if (!cache) return [];
    if (typeof cache.map === "function") {
      return cache.map((g) => g.id).filter(Boolean);
    }
    if (typeof cache.values === "function") {
      return Array.from(cache.values()).map((g) => g.id).filter(Boolean);
    }
    return [];
  }

  endpointForGuild(working, guildId) {
    if (!working.guildScoped || !guildId) return working.endpoint;
    return working.endpointTemplate.replace("{guild_id}", guildId);
  }

  async detectWorkingConfiguration(endpoints) {
    for (const endpoint of endpoints) {
      for (const payloadFormat of endpoint.payloadFormats ?? Object.keys(PAYLOAD_FORMATS)) {
        const payload = this.buildPayload(payloadFormat, this.options.targetStyle);
        if (!this.validatePayload(payloadFormat, payload)) continue;

        const response = await this.testPayload({
          phase: "endpoint-discovery",
          endpoint,
          payloadFormat,
          payload,
          style: this.options.targetStyle
        });

        this.recordEndpointResult(endpoint, payloadFormat, response);
        if (this.isStyleConfirmed(response, this.options.targetStyle)) {
          const working = {
            endpoint: endpoint.endpoint,
            endpointTemplate: endpoint.endpointTemplate,
            endpointLabel: endpoint.label,
            endpointKey: endpoint.key,
            guildId: endpoint.guildId,
            guildScoped: endpoint.guildScoped,
            payloadFormat,
            style: this.options.targetStyle,
            discoveredAt: new Date().toISOString()
          };

          this.report.endpointSupported = "YES";
          this.report.botTokenSupported = "YES";
          this.report.payloadFormat = payloadFormat;
          this.report.finalWorkingConfiguration = working;
          return working;
        }

        if (response.ok) {
          this.report.notes.push(`${endpoint.label} returned ${response.status}, but the response did not confirm Display Name Styles were applied.`);
        }
        this.captureUnsupportedFields(response);
        await new Promise((resolve) => setTimeout(resolve, this.options.requestDelayMs));
      }
    }
    return null;
  }

  async runCompatibilityMatrix(working) {
    await this.writeSummary("Running Display Name Styles compatibility matrix for known fonts, effects, and colors.");

    for (const font of FONTS) {
      const response = await this.testStyleVariant(working, "font", font.label, {
        ...this.options.targetStyle,
        font_id: font.id
      });
      if (response.ok) {
        this.addUnique(this.report.acceptedFontIds, font.id);
      }
      await new Promise((resolve) => setTimeout(resolve, this.options.requestDelayMs));
    }

    for (const effect of EFFECTS) {
      const response = await this.testStyleVariant(working, "effect", effect.label, {
        ...this.options.targetStyle,
        effect_id: effect.id
      });
      if (response.ok) {
        this.addUnique(this.report.acceptedEffectIds, effect.id);
      }
      await new Promise((resolve) => setTimeout(resolve, this.options.requestDelayMs));
    }

    for (const colorTest of COLOR_TESTS) {
      const response = await this.testStyleVariant(working, "color", colorTest.label, {
        ...this.options.targetStyle,
        effect_id: colorTest.colors.length > 1 ? 2 : this.options.targetStyle.effect_id,
        colors: colorTest.colors
      });
      if (response.ok) {
        this.addUnique(this.report.acceptedColors, colorTest.colors.join(","));
      }
      await new Promise((resolve) => setTimeout(resolve, this.options.requestDelayMs));
    }
  }

  async testStyleVariant(working, category, label, style) {
    const payload = this.buildPayload(working.payloadFormat, style);
    return this.testPayload({
      phase: `compatibility-${category}`,
      endpoint: {
        key: working.endpointKey,
        label: working.endpointLabel,
        endpoint: working.endpoint,
        guildId: working.guildId
      },
      payloadFormat: working.payloadFormat,
      payload,
      style,
      label
    });
  }

  async applyFinalStyle(working) {
    const presetLabel = this.selectedStylePreset?.label ?? "Custom Display Name Style";
    await this.writeSummary(`Applying final target Display Name Style: ${presetLabel}.`);
    const responses = await this.applyStyleToConfiguredScope(working, this.options.targetStyle, "final-apply", presetLabel);
    const confirmed = responses.filter((r) => this.isStyleConfirmed(r, this.options.targetStyle));

    if (confirmed.length > 0) {
      this.report.finalWorkingConfiguration = {
        ...working,
        style: this.options.targetStyle,
        appliedAt: new Date().toISOString(),
        appliedGuildIds: working.guildScoped ? confirmed.map((r) => r.guildId).filter(Boolean) : []
      };
      await this.saveWorkingConfig(this.report.finalWorkingConfiguration);
    }
    return responses;
  }

  async applyCachedConfiguration(cached) {
    const style = this.options.targetStyle;
    const responses = await this.applyStyleToConfiguredScope(cached, style, "cached-apply", "Saved Working Configuration");

    if (responses.some((r) => this.isStyleConfirmed(r, style))) {
      this.report.endpointSupported = "YES";
      this.report.botTokenSupported = "YES";
      this.report.payloadFormat = cached.payloadFormat;
      this.report.finalWorkingConfiguration = {
        ...cached,
        style,
        appliedAt: new Date().toISOString()
      };
    } else {
      for (const r of responses) {
        this.captureUnsupportedFields(r);
      }
    }
    return responses;
  }

  async applyStyleToConfiguredScope(working, style, phase, label) {
    const guildIds = working.guildScoped
      ? Array.from(new Set([working.guildId, ...this.getGuildIds()]))
      : [null];

    const responses = [];
    for (const guildId of guildIds) {
      const payload = this.buildPayload(working.payloadFormat, style);
      const endpoint = {
        key: working.endpointKey,
        label: working.endpointLabel,
        endpoint: this.endpointForGuild(working, guildId),
        guildId,
        guildScoped: working.guildScoped
      };

      const response = await this.testPayload({
        phase,
        endpoint,
        payloadFormat: working.payloadFormat,
        payload,
        style,
        label
      });
      response.guildId = guildId;
      responses.push(response);
      await new Promise((resolve) => setTimeout(resolve, this.options.requestDelayMs));
    }
    return responses;
  }

  isStyleConfirmed(response, expectedStyle) {
    if (!response?.ok) return false;
    return response.verifiedStyle === true || this.responseContainsStyle(response, expectedStyle);
  }

  responseContainsStyle(response, expectedStyle) {
    return this.objectContainsStyle(response.parsed, expectedStyle);
  }

  objectContainsStyle(value, expectedStyle, seen = new Set()) {
    if (!value || typeof value !== "object") return false;
    if (seen.has(value)) return false;
    seen.add(value);

    if (this.styleMatches(value.display_name_styles, expectedStyle)) return true;
    if (this.styleMatches(value, expectedStyle)) return true;

    if (
      value.display_name_font_id === expectedStyle.font_id &&
      value.display_name_effect_id === expectedStyle.effect_id &&
      this.colorsMatch(value.display_name_colors, expectedStyle.colors)
    ) {
      return true;
    }

    for (const key of Object.keys(value)) {
      if (this.objectContainsStyle(value[key], expectedStyle, seen)) return true;
    }

    return false;
  }

  styleMatches(value, expectedStyle) {
    return (
      value &&
      value.font_id === expectedStyle.font_id &&
      value.effect_id === expectedStyle.effect_id &&
      this.colorsMatch(value.colors, expectedStyle.colors)
    );
  }

  colorsMatch(actual, expected) {
    return (
      Array.isArray(actual) &&
      Array.isArray(expected) &&
      actual.length === expected.length &&
      actual.every((val, index) => val === expected[index])
    );
  }

  async testPayload(params) {
    const { phase, endpoint, payloadFormat, payload, style, label } = params;

    await this.logDisplayNameStyleTest({
      phase,
      endpoint,
      payloadFormat,
      payload,
      style,
      label,
      status: "STARTED"
    });

    if (!this.api) throw new Error("DiscordProfileAPI has not been initialized.");
    const response = await this.api.patch(endpoint.endpoint, payload);

    if (response.ok && !this.responseContainsStyle(response, style)) {
      response.verification = await this.verifyAppliedStyle(endpoint, style);
      response.verifiedStyle = response.verification.some((entry) => entry.confirmed);
    } else {
      response.verifiedStyle = this.responseContainsStyle(response, style);
    }

    await this.logDisplayNameStyleTest({
      phase,
      endpoint,
      payloadFormat,
      payload,
      style,
      label,
      status: response.status,
      response,
      result: this.isStyleConfirmed(response, style) ? "SUCCESS_CONFIRMED" : (response.ok ? "SUCCESS_UNCONFIRMED" : "FAILURE")
    });

    if (!response.ok && SUPPORTED_ERROR_STATUSES.has(response.status)) {
      this.report.notes.push(`${endpoint.label} returned ${response.status} during ${phase}.`);
    }

    return response;
  }

  async verifyAppliedStyle(endpoint, style) {
    if (!this.api) return [];
    const userId = this.client?.user?.id;
    const checks = ["/users/@me"];
    if (userId) {
      const query = endpoint.guildId ? `?guild_id=${endpoint.guildId}` : "";
      checks.push(`/users/${userId}/profile${query}`);
    }

    const results = [];
    for (const checkEndpoint of checks) {
      const response = await this.api.get(checkEndpoint, { maxRetries: 1 });
      results.push({
        endpoint: checkEndpoint,
        status: response.status,
        confirmed: this.responseContainsStyle(response, style),
        response
      });
    }

    return results;
  }

  buildPayload(format, style) {
    return PAYLOAD_FORMATS[format](style);
  }

  validatePayload(format, payload) {
    if (!(format in PAYLOAD_FORMATS)) return false;

    const style = format === "A"
      ? payload.display_name_styles
      : {
          font_id: payload.display_name_font_id,
          effect_id: payload.display_name_effect_id,
          colors: payload.display_name_colors
        };

    const valid = this.validateStyle(style);
    if (!valid) {
      this.report.notes.push(`Skipped invalid payload format ${format}.`);
    }
    return valid;
  }

  recordEndpointResult(endpoint, payloadFormat, response) {
    if (!this.report.endpoints[endpoint.label]) {
      this.report.endpoints[endpoint.label] = {};
    }
    this.report.endpoints[endpoint.label][payloadFormat] = {
      status: response.status,
      supported: this.isStyleConfirmed(response, this.options.targetStyle) ? "YES" : (response.ok ? "UNCONFIRMED" : "NO"),
      rateLimited: response.rateLimited,
      errorCode: response.parsed?.code,
      message: response.parsed?.message ?? response.statusText
    };
  }

  captureUnsupportedFields(response) {
    const fields = this.extractErrorFields(response.parsed?.errors);
    for (const field of fields) {
      this.addUnique(this.report.unsupportedFields, field);
    }
  }

  extractErrorFields(errors, prefix = "") {
    if (!errors || typeof errors !== "object") return [];

    const fields = [];
    for (const key of Object.keys(errors)) {
      if (key === "_errors") continue;
      const next = prefix ? `${prefix}.${key}` : key;
      if (errors[key] && errors[key]._errors) {
        fields.push(next);
      }
      fields.push(...this.extractErrorFields(errors[key], next));
    }
    return fields;
  }

  async ensureLogDirectory() {
    if (!fs.existsSync(this.options.logDir)) {
      fs.mkdirSync(this.options.logDir, { recursive: true });
    }
  }

  async logApiResponse(entry) {
    await this.logEvent("api-response", this.sanitizeLogEntry(entry));
  }

  async logDisplayNameStyleTest(entry) {
    await this.logEvent("display-name-style-test", this.sanitizeLogEntry({
      separator: "━━━━━━━━━━━━━━━━━━",
      title: "Display Name Style Test",
      ...entry
    }));
  }

  async writeSummary(message) {
    this.report.notes.push(message);
    await this.logEvent("summary", { message });
    console.log(`[DisplayNameStyles] ${message} | Main: KyronixStudio | High Partner: dray.me`);
  }

  async logEvent(type, data) {
    const entry = {
      type,
      timestamp: new Date().toISOString(),
      data
    };
    try {
      fs.appendFileSync(this.logFile, JSON.stringify(entry) + "\n", "utf-8");
    } catch {}
  }

  sanitizeLogEntry(entry) {
    if (!entry || typeof entry !== "object") return entry;

    const sanitize = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      } else if (obj && typeof obj === "object") {
        const result = {};
        for (const k of Object.keys(obj)) {
          if (k.toLowerCase().includes("authorization")) {
            result[k] = "[REDACTED]";
          } else {
            result[k] = sanitize(obj[k]);
          }
        }
        return result;
      }
      return obj;
    };

    return sanitize(entry);
  }

  async loadWorkingConfig() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const text = fs.readFileSync(this.cacheFile, "utf-8");
        const parsed = JSON.parse(text);
        if (parsed.endpoint && parsed.payloadFormat && parsed.style) {
          return this.normalizeWorkingConfig(parsed);
        }
      }
    } catch {}
    return null;
  }

  async saveWorkingConfig(config) {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(config, null, 2), "utf-8");
    } catch {}
  }

  normalizeWorkingConfig(config) {
    const normalized = { ...config };

    if (normalized.endpoint?.startsWith("/guilds/") && normalized.endpoint.includes("/members/@me")) {
      normalized.guildScoped = true;
      normalized.endpointTemplate = normalized.endpointTemplate ?? "/guilds/{guild_id}/members/@me";
      normalized.endpointLabel = normalized.endpointLabel ?? "PATCH /guilds/{guild_id}/members/@me";
      normalized.endpointKey = normalized.endpointKey ?? "guild-members-me";
    }

    if (normalized.endpoint?.startsWith("/guilds/") && normalized.endpoint.includes("/profile/@me")) {
      normalized.guildScoped = true;
      normalized.endpointTemplate = normalized.endpointTemplate ?? "/guilds/{guild_id}/profile/@me";
      normalized.endpointLabel = normalized.endpointLabel ?? "PATCH /guilds/{guild_id}/profile/@me";
      normalized.endpointKey = normalized.endpointKey ?? "guild-profile-me";
    }

    if (normalized.endpoint === "/users/@me") {
      normalized.guildScoped = false;
      normalized.endpointTemplate = normalized.endpointTemplate ?? "/users/@me";
      normalized.endpointLabel = normalized.endpointLabel ?? "PATCH /users/@me";
      normalized.endpointKey = normalized.endpointKey ?? "users-me";
    }

    return normalized;
  }

  async finalizeReport(message) {
    this.report.generatedAt = new Date().toISOString();
    this.report.notes.push(message);
    try {
      fs.writeFileSync(this.reportFile, this.renderReport(), "utf-8");
    } catch {}
    await this.logEvent("report", this.report);
    console.log(`[DisplayNameStyles] ${message} | Powered by KyronixStudio & dray.me`);
  }

  renderReport() {
    const lines = [
      "# Display Name Styles Report",
      "",
      "## Credits",
      "- **Main Server**: KyronixStudio",
      "- **High Partner**: dray.me",
      "",
      `Generated At: ${this.report.generatedAt}`,
      "",
      `Endpoint Supported: ${this.report.endpointSupported}`,
      `Bot Token Supported: ${this.report.botTokenSupported}`,
      `Payload Format: ${this.report.payloadFormat}`,
      `Selected Preset: ${this.report.selectedStylePreset?.label ?? "UNKNOWN"} (${this.report.selectedStylePreset?.key ?? "UNKNOWN"})`,
      `Accepted Font IDs: ${this.report.acceptedFontIds.length > 0 ? this.report.acceptedFontIds.join(", ") : "UNKNOWN"}`,
      `Accepted Effect IDs: ${this.report.acceptedEffectIds.length > 0 ? this.report.acceptedEffectIds.join(", ") : "UNKNOWN"}`,
      `Accepted Colors: ${this.report.acceptedColors.length > 0 ? this.report.acceptedColors.join(" | ") : "UNKNOWN"}`,
      `Unsupported Fields: ${this.report.unsupportedFields.length > 0 ? this.report.unsupportedFields.join(", ") : "NONE DETECTED"}`,
      "",
      "## Final Working Configuration",
      "```json",
      JSON.stringify(this.report.finalWorkingConfiguration, null, 2),
      "```",
      "",
      "## Final Target Configuration",
      "```json",
      JSON.stringify({ display_name_styles: this.options.targetStyle }, null, 2),
      "```",
      "",
      "## Available Style Presets",
      "```json",
      JSON.stringify(this.report.availableStylePresets, null, 2),
      "```",
      "",
      "## Endpoint Results",
      "```json",
      JSON.stringify(this.report.endpoints, null, 2),
      "```",
      "",
      "## Notes",
      ...this.report.notes.map((note) => `- ${note}`),
      ""
    ];
    return lines.join("\n");
  }

  addUnique(target, value) {
    if (!target.includes(value)) {
      target.push(value);
    }
  }
}

// ============================================================================
// EXPORTS (CommonJS)
// ============================================================================

module.exports = {
  FONTS,
  EFFECTS,
  COLOR_TESTS,
  TARGET_STYLE,
  STYLE_PRESETS,
  PAYLOAD_FORMATS,
  DiscordProfileAPI,
  ProfileStyleService
};

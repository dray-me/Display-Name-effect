import os
import json
import time
import pathlib
from datetime import datetime
import requests


FONTS = [
    {"label": "Bangers", "id": 1},
    {"label": "BioRhyme", "id": 2},
    {"label": "Cherry Bomb", "id": 3},
    {"label": "Chicle", "id": 4},
    {"label": "Compagnon", "id": 5},
    {"label": "Museo Moderno", "id": 6},
    {"label": "Neo-Castel", "id": 7},
    {"label": "Pixelify Sans", "id": 8},
    {"label": "Ribes", "id": 9},
    {"label": "Sinistre", "id": 10},
    {"label": "Default (GG Sans)", "id": 11},
    {"label": "Zilla Slab", "id": 12}
]

EFFECTS = [
    {"label": "Solid", "id": 1},
    {"label": "Gradient", "id": 2},
    {"label": "Neon", "id": 3},
    {"label": "Toon", "id": 4},
    {"label": "Pop", "id": 5},
    {"label": "Glow", "id": 6}
]

COLOR_TESTS = [
    {"label": "White", "colors": [16777215]},
    {"label": "Blue", "colors": [5865]},
    {"label": "Pink", "colors": [16711935]},
    {"label": "Purple", "colors": [8388736]},
    {"label": "White to Blue Gradient", "colors": [16777215, 5865]},
    {"label": "Pink to Purple Gradient", "colors": [16711935, 8388736]}
]

TARGET_STYLE = {"font_id": 10, "effect_id": 3, "colors": [16777215]}

STYLE_PRESETS = [
    {"key": "sinistre-neon-white", "label": "Sinistre Neon White", "style": {"font_id": 10, "effect_id": 3, "colors": [16777215]}},
    {"key": "ribes-neon-pink", "label": "Ribes Neon Pink", "style": {"font_id": 9, "effect_id": 3, "colors": [16711935]}},
    {"key": "neo-castel-gradient-blue-white", "label": "Neo-Castel Blue/White Gradient", "style": {"font_id": 7, "effect_id": 2, "colors": [5865, 16777215]}},
    {"key": "pixelify-pop-purple", "label": "Pixelify Sans Pop Purple", "style": {"font_id": 8, "effect_id": 5, "colors": [8388736]}},
    {"key": "bangers-glow-pink-purple", "label": "Bangers Pink/Purple Glow", "style": {"font_id": 1, "effect_id": 6, "colors": [16711935, 8388736]}},
    {"key": "cherry-toon-white", "label": "Cherry Bomb Toon White", "style": {"font_id": 3, "effect_id": 4, "colors": [16777215]}},
    {"key": "zilla-solid-blue", "label": "Zilla Slab Solid Blue", "style": {"font_id": 12, "effect_id": 1, "colors": [5865]}}
]

PAYLOAD_FORMATS = {
    "A": lambda style: {"display_name_styles": style},
    "B": lambda style: {
        "display_name_font_id": style["font_id"],
        "display_name_effect_id": style["effect_id"],
        "display_name_colors": style["colors"]
    }
}

SUPPORTED_ERROR_STATUSES = {400, 401, 403, 404, 405, 409, 429, 500, 502, 503, 504}
DEFAULT_LOG_DIR = pathlib.Path.cwd() / "logs" / "display-name-styles"


class DiscordProfileAPI:
    def __init__(self, token, base_url="https://discord.com/api/v10", logger=None, max_retries=3, retry_base_delay_ms=1000):
        self.token = token
        self.base_url = base_url
        self.logger = logger or (lambda x: None)
        self.max_retries = max_retries
        self.retry_base_delay_ms = retry_base_delay_ms

    def patch(self, endpoint, body, options=None):
        return self.request("PATCH", endpoint, body, options or {})

    def get(self, endpoint, options=None):
        return self.request("GET", endpoint, None, options or {})

    def request(self, method, endpoint, body, options):
        url = f"{self.base_url}{endpoint}"
        attempt = 0
        max_attempts = (options.get("max_retries", self.max_retries)) + 1

        while attempt < max_attempts:
            attempt += 1
            start_time = time.time()
            response = None
            raw = None
            parsed = None
            parse_error = None

            try:
                headers = {
                    "Authorization": f"Bot {self.token}",
                    "User-Agent": "DiscordBot (https://discord.com, 1.0)"
                }

                if method != "GET":
                    headers["Content-Type"] = "application/json"
                    headers["Accept"] = "application/json"

                fetch_options = {
                    "method": method,
                    "headers": headers,
                    "json": body if body is not None else None
                }

                response = requests.request(**fetch_options, url=url)
                raw = response.text

                try:
                    parsed = response.json()
                except Exception as err:
                    parse_error = str(err)

            except Exception as err:
                duration = int((time.time() - start_time) * 1000)
                result = {
                    "ok": False,
                    "status": 0,
                    "statusText": "NETWORK_ERROR",
                    "method": method,
                    "endpoint": endpoint,
                    "url": url,
                    "attempt": attempt,
                    "durationMs": duration,
                    "headers": {},
                    "retryAfterSeconds": None,
                    "rateLimited": False,
                    "raw": str(err),
                    "parsed": None,
                    "parseError": None,
                    "requestBody": body,
                    "error": {
                        "name": type(err).__name__,
                        "message": str(err),
                        "stack": None
                    }
                }
                self.logger(result)

                if attempt < max_attempts:
                    delay = self.retry_base_delay_ms * (2 ** (attempt - 1)) / 1000
                    time.sleep(delay)
                    continue

                return result

            duration = int((time.time() - start_time) * 1000)
            headers = self._pick_headers(response)
            retry_after_seconds = self._get_retry_after_seconds(response, parsed)
            rate_limited = response.status_code == 429

            result = {
                "ok": response.ok,
                "status": response.status_code,
                "statusText": response.reason,
                "method": method,
                "endpoint": endpoint,
                "url": url,
                "attempt": attempt,
                "durationMs": duration,
                "headers": headers,
                "retryAfterSeconds": retry_after_seconds,
                "rateLimited": rate_limited,
                "raw": raw,
                "parsed": parsed,
                "parseError": parse_error,
                "requestBody": body,
                "error": None
            }

            self.logger(result)

            if rate_limited and attempt < max_attempts:
                delay = retry_after_seconds if retry_after_seconds else (self.retry_base_delay_ms * (2 ** (attempt - 1)) / 1000)
                time.sleep(delay)
                continue

            should_retry = response.status_code in {500, 502, 503, 504} and attempt < max_attempts
            if should_retry:
                delay = self.retry_base_delay_ms * (2 ** (attempt - 1)) / 1000
                time.sleep(delay)
                continue

            return result

    def _get_retry_after_seconds(self, response, parsed):
        if parsed and "retry_after" in parsed:
            return float(parsed["retry_after"])
        header_value = response.headers.get("retry-after")
        if header_value:
            return float(header_value)
        return None

    def _pick_headers(self, response):
        headers = {}
        keys = ["content-type", "date", "x-ratelimit-bucket", "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset", "x-ratelimit-reset-after", "retry-after", "x-discord-trace-id"]
        for key in keys:
            value = response.headers.get(key)
            if value:
                headers[key] = value
        return headers


class ProfileStyleService:
    FONTS = FONTS
    EFFECTS = EFFECTS
    COLOR_TESTS = COLOR_TESTS
    TARGET_STYLE = TARGET_STYLE
    STYLE_PRESETS = STYLE_PRESETS

    def __init__(self, client, options=None):
        self.client = client
        options = options or {}
        self.options = {
            "logDir": options.get("logDir") or os.environ.get("DISCORD_PROFILE_STYLE_LOG_DIR") or DEFAULT_LOG_DIR,
            "forceDiscovery": options.get("forceDiscovery") or os.environ.get("DISCORD_PROFILE_STYLE_FORCE_DISCOVERY") == "true",
            "runCompatibilityTests": options.get("runCompatibilityTests") or os.environ.get("DISCORD_PROFILE_STYLE_RUN_COMPATIBILITY") == "true",
            "requestDelayMs": int(os.environ.get("DISCORD_PROFILE_STYLE_REQUEST_DELAY_MS", options.get("requestDelayMs", 1500))),
            "maxRetries": int(os.environ.get("DISCORD_PROFILE_STYLE_MAX_RETRIES", options.get("maxRetries", 2))),
            "targetStyle": options.get("targetStyle"),
            "stylePreset": options.get("stylePreset") or os.environ.get("DISCORD_PROFILE_STYLE_PRESET"),
            "styleMode": options.get("styleMode") or os.environ.get("DISCORD_PROFILE_STYLE_MODE", "rotate"),
            "guildId": options.get("guildId") or os.environ.get("DISCORD_PROFILE_STYLE_GUILD_ID")
        }

        self.report = self._create_empty_report()
        self.run_id = datetime.utcnow().isoformat().replace(":", "-").replace(".", "-")
        self.log_file = pathlib.Path(self.options["logDir"]) / f"{self.run_id}.jsonl"
        self.report_file = pathlib.Path(self.options["logDir"]) / "latest-report.md"
        self.cache_file = pathlib.Path(self.options["logDir"]) / "working-config.json"
        self.rotation_file = pathlib.Path(self.options["logDir"]) / "preset-rotation.json"
        self.api = None
        self.selected_style_preset = None

    @staticmethod
    async def initialize(client, options=None):
        service = ProfileStyleService(client, options)
        return await service.run()

    async def run(self):
        await self._ensure_log_directory()

        try:
            if os.environ.get("DISCORD_PROFILE_STYLE_ENABLED") == "false":
                await self._write_summary("Display Name Styles disabled by DISCORD_PROFILE_STYLE_ENABLED=false.")
                return self.report

            token = getattr(self.client, "token", None) or os.environ.get("DISCORD_TOKEN") or getattr(self.client, "config", {}).get("token")
            if not token:
                await self._write_summary("No Discord bot token available for Display Name Styles startup task.")
                return self.report

            self.api = DiscordProfileAPI(
                token,
                max_retries=self.options["maxRetries"],
                logger=lambda entry: self._log_api_response(entry)
            )

            await self._resolve_target_style()
            self.report["botTokenSupported"] = "UNKNOWN"
            self.report["selectedStylePreset"] = self.selected_style_preset
            self.report["availableStylePresets"] = [{"key": p["key"], "label": p["label"], "style": p["style"]} for p in STYLE_PRESETS]
            self.report["finalTargetConfiguration"] = self.options["targetStyle"]

            cached = await self._load_working_config()
            if cached and not self.options["forceDiscovery"]:
                await self._write_summary("Using saved Display Name Styles configuration from a previous successful run.")
                responses = await self._apply_cached_configuration(cached)
                applied = any(self._is_style_confirmed(r, self.options["targetStyle"]) for r in responses)
                if applied:
                    await self._save_working_config(self.report.get("finalWorkingConfiguration", cached))
                    await self._finalize_report("Applied saved working configuration.")
                    return self.report
                await self._write_summary("Saved Display Name Styles configuration failed verification; running fresh discovery.")

            endpoints = self._get_candidate_endpoints()
            await self._write_summary(f"Starting Display Name Styles discovery with {len(endpoints)} endpoint(s).")

            working = await self._detect_working_configuration(endpoints)
            if working:
                await self._apply_final_style(working)
                await self._save_working_config(self.report.get("finalWorkingConfiguration", working))
                if self.options["runCompatibilityTests"]:
                    await self._run_compatibility_matrix(working)
                    await self._apply_final_style(working)
            else:
                self.report["endpointSupported"] = "NO"
                self.report["botTokenSupported"] = "YES" if self.report["botTokenSupported"] == "YES" else "NO"

            await self._finalize_report("Display Name Styles startup task completed." if working else "No working Display Name Styles configuration was found.")
        except Exception as err:
            await self._log_event("fatal-error", {"message": str(err), "stack": None})
            await self._finalize_report("Display Name Styles startup task failed safely; bot startup continued.")

        return self.report

    def _create_empty_report(self):
        return {
            "title": "Display Name Styles Report",
            "generatedAt": datetime.utcnow().isoformat(),
            "endpointSupported": "UNKNOWN",
            "botTokenSupported": "UNKNOWN",
            "payloadFormat": "UNKNOWN",
            "acceptedFontIds": [],
            "acceptedEffectIds": [],
            "acceptedColors": [],
            "finalWorkingConfiguration": None,
            "finalTargetConfiguration": None,
            "selectedStylePreset": None,
            "availableStylePresets": [],
            "unsupportedFields": [],
            "endpoints": {},
            "notes": []
        }

    async def _resolve_target_style(self):
        if self.options["targetStyle"]:
            self.selected_style_preset = {"key": "custom-options", "label": "Custom Options", "style": self.options["targetStyle"]}
            return

        env_style = self._parse_environment_style()
        if env_style:
            self.options["targetStyle"] = env_style
            self.selected_style_preset = {"key": "custom-env", "label": "Custom Environment Style", "style": env_style}
            return

        preset = await self._select_preset()
        self.options["targetStyle"] = {**preset["style"], "colors": preset["style"]["colors"][:]}
        self.selected_style_preset = preset
        await self._write_summary(f"Selected Display Name Style preset: {preset['label']} ({preset['key']}).")

    def _parse_environment_style(self):
        if os.environ.get("DISCORD_PROFILE_STYLE_JSON"):
            try:
                style = json.loads(os.environ["DISCORD_PROFILE_STYLE_JSON"])
                if self._validate_style(style):
                    return style
                self.report["notes"].append("DISCORD_PROFILE_STYLE_JSON was present but invalid.")
            except Exception as err:
                self.report["notes"].append(f"DISCORD_PROFILE_STYLE_JSON could not be parsed: {str(err)}")

        font_id = int(os.environ.get("DISCORD_PROFILE_STYLE_FONT_ID", 0))
        effect_id = int(os.environ.get("DISCORD_PROFILE_STYLE_EFFECT_ID", 0))
        colors = self._parse_color_list(os.environ.get("DISCORD_PROFILE_STYLE_COLORS"))
        if font_id and effect_id and colors:
            style = {"font_id": font_id, "effect_id": effect_id, "colors": colors}
            return style if self._validate_style(style) else None
        return None

    def _parse_color_list(self, value):
        if not value:
            return None
        return [int(c.strip()) for c in value.split(",") if c.strip().isdigit()]

    async def _select_preset(self):
        preset_key = (self.options.get("stylePreset", "")).strip().lower()
        if preset_key:
            preset = next((p for p in STYLE_PRESETS if p["key"] == preset_key or p["label"].lower() == preset_key), None)
            if preset:
                return preset
            self.report["notes"].append(f"Unknown Display Name Style preset '{self.options['stylePreset']}', falling back to rotation mode.")

        mode = str(self.options.get("styleMode", "rotate")).lower()
        if mode == "random":
            import random
            return STYLE_PRESETS[random.randint(0, len(STYLE_PRESETS) - 1)]

        if mode == "fixed":
            return STYLE_PRESETS[0]

        state = await self._load_rotation_state()
        index = state.get("nextIndex") if isinstance(state.get("nextIndex"), int) else 1
        preset = STYLE_PRESETS[index % len(STYLE_PRESETS)]
        await self._save_rotation_state({
            "nextIndex": (index + 1) % len(STYLE_PRESETS),
            "lastPresetKey": preset["key"],
            "updatedAt": datetime.utcnow().isoformat()
        })
        return preset

    async def _load_rotation_state(self):
        try:
            with open(self.rotation_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}

    async def _save_rotation_state(self, state):
        with open(self.rotation_file, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)

    def _validate_style(self, style):
        return (
            bool(style)
            and isinstance(style.get("font_id"), int)
            and isinstance(style.get("effect_id"), int)
            and isinstance(style.get("colors"), list)
            and len(style["colors"]) >= 1
            and all(isinstance(c, int) and 0 <= c <= 0xffffff for c in style["colors"])
        )

    def _get_candidate_endpoints(self):
        guild_id = self.options["guildId"] or (self._get_guild_ids()[0] if self._get_guild_ids() else None)
        endpoints = []

        if guild_id:
            endpoints.append({
                "key": "guild-members-me",
                "label": "PATCH /guilds/{guild_id}/members/@me",
                "endpoint": f"/guilds/{guild_id}/members/@me",
                "endpointTemplate": "/guilds/{guild_id}/members/@me",
                "guildId": guild_id,
                "guildScoped": True,
                "payloadFormats": ["B", "A"]
            })
            endpoints.append({
                "key": "guild-profile-me",
                "label": "PATCH /guilds/{guild_id}/profile/@me",
                "endpoint": f"/guilds/{guild_id}/profile/@me",
                "endpointTemplate": "/guilds/{guild_id}/profile/@me",
                "guildId": guild_id,
                "guildScoped": True,
                "payloadFormats": ["B", "A"]
            })
        else:
            self.report["notes"].append("No guild id was available, so guild-specific profile endpoints were skipped.")

        endpoints.append({
            "key": "users-me",
            "label": "PATCH /users/@me",
            "endpoint": "/users/@me",
            "endpointTemplate": "/users/@me",
            "guildId": None,
            "guildScoped": False,
            "payloadFormats": ["B", "A"]
        })

        return endpoints

    def _get_guild_ids(self):
        cache = getattr(getattr(self.client, "guilds", None), "cache", None)
        if not cache:
            return []
        if hasattr(cache, "map"):
            return [g.id for g in cache.map.values() if g.id]
        if hasattr(cache, "values"):
            return [g.id for g in cache.values() if g.id]
        return []

    def _endpoint_for_guild(self, working, guild_id):
        if not working.get("guildScoped") or not guild_id:
            return working["endpoint"]
        return (working.get("endpointTemplate", working["endpoint"])).replace("{guild_id}", guild_id)

    async def _detect_working_configuration(self, endpoints):
        for endpoint in endpoints:
            for payload_format in endpoint.get("payloadFormats", PAYLOAD_FORMATS.keys()):
                payload = self._build_payload(payload_format, self.options["targetStyle"])
                if not self._validate_payload(payload_format, payload):
                    continue

                response = await self._test_payload({
                    "phase": "endpoint-discovery",
                    "endpoint": endpoint,
                    "payloadFormat": payload_format,
                    "payload": payload,
                    "style": self.options["targetStyle"]
                })

                self._record_endpoint_result(endpoint, payload_format, response)
                if self._is_style_confirmed(response, self.options["targetStyle"]):
                    working = {
                        "endpoint": endpoint["endpoint"],
                        "endpointTemplate": endpoint["endpointTemplate"],
                        "endpointLabel": endpoint["label"],
                        "endpointKey": endpoint["key"],
                        "guildId": endpoint["guildId"],
                        "guildScoped": endpoint["guildScoped"],
                        "payloadFormat": payload_format,
                        "style": self.options["targetStyle"],
                        "discoveredAt": datetime.utcnow().isoformat()
                    }

                    self.report["endpointSupported"] = "YES"
                    self.report["botTokenSupported"] = "YES"
                    self.report["payloadFormat"] = payload_format
                    self.report["finalWorkingConfiguration"] = working
                    return working

                if response["ok"]:
                    self.report["notes"].append(f"{endpoint['label']} returned {response['status']}, but the response did not confirm Display Name Styles were applied.")
                self._capture_unsupported_fields(response)
                time.sleep(self.options["requestDelayMs"] / 1000)
        return None

    async def _run_compatibility_matrix(self, working):
        await self._write_summary("Running Display Name Styles compatibility matrix for known fonts, effects, and colors.")

        for font in FONTS:
            response = await self._test_style_variant(working, "font", font["label"], {
                **self.options["targetStyle"],
                "font_id": font["id"]
            })
            if response["ok"]:
                self._add_unique(self.report["acceptedFontIds"], font["id"])
            time.sleep(self.options["requestDelayMs"] / 1000)

        for effect in EFFECTS:
            response = await self._test_style_variant(working, "effect", effect["label"], {
                **self.options["targetStyle"],
                "effect_id": effect["id"]
            })
            if response["ok"]:
                self._add_unique(self.report["acceptedEffectIds"], effect["id"])
            time.sleep(self.options["requestDelayMs"] / 1000)

        for color_test in COLOR_TESTS:
            response = await self._test_style_variant(working, "color", color_test["label"], {
                **self.options["targetStyle"],
                "effect_id": 2 if len(color_test["colors"]) > 1 else self.options["targetStyle"]["effect_id"],
                "colors": color_test["colors"]
            })
            if response["ok"]:
                self._add_unique(self.report["acceptedColors"], ",".join(map(str, color_test["colors"])))
            time.sleep(self.options["requestDelayMs"] / 1000)

    async def _test_style_variant(self, working, category, label, style):
        payload = self._build_payload(working["payloadFormat"], style)
        return await self._test_payload({
            "phase": f"compatibility-{category}",
            "endpoint": {
                "key": working["endpointKey"],
                "label": working["endpointLabel"],
                "endpoint": working["endpoint"],
                "guildId": working["guildId"]
            },
            "payloadFormat": working["payloadFormat"],
            "payload": payload,
            "style": style,
            "label": label
        })

    async def _apply_final_style(self, working):
        preset_label = self.selected_style_preset.get("label", "Custom Display Name Style") if self.selected_style_preset else "Custom Display Name Style"
        await self._write_summary(f"Applying final target Display Name Style: {preset_label}.")
        responses = await self._apply_style_to_configured_scope(working, self.options["targetStyle"], "final-apply", preset_label)
        confirmed = [r for r in responses if self._is_style_confirmed(r, self.options["targetStyle"])]

        if len(confirmed) > 0:
            self.report["finalWorkingConfiguration"] = {
                **working,
                "style": self.options["targetStyle"],
                "appliedAt": datetime.utcnow().isoformat(),
                "appliedGuildIds": [r["guildId"] for r in confirmed if r["guildId"]] if working["guildScoped"] else []
            }
            await self._save_working_config(self.report["finalWorkingConfiguration"])

        return responses

    async def _apply_cached_configuration(self, cached):
        style = self.options["targetStyle"]
        responses = await self._apply_style_to_configured_scope(cached, style, "cached-apply", "Saved Working Configuration")

        if any(self._is_style_confirmed(r, style) for r in responses):
            self.report["endpointSupported"] = "YES"
            self.report["botTokenSupported"] = "YES"
            self.report["payloadFormat"] = cached["payloadFormat"]
            self.report["finalWorkingConfiguration"] = {
                **cached,
                "style": style,
                "appliedAt": datetime.utcnow().isoformat()
            }
        else:
            for r in responses:
                self._capture_unsupported_fields(r)

        return responses

    async def _apply_style_to_configured_scope(self, working, style, phase, label):
        guild_ids = (
            list(dict.fromkeys([working["guildId"]] + self._get_guild_ids())) if working["guildScoped"] else [None]
        )
        responses = []

        for guild_id in guild_ids:
            payload = self._build_payload(working["payloadFormat"], style)
            endpoint = {
                "key": working["endpointKey"],
                "label": working["endpointLabel"],
                "endpoint": self._endpoint_for_guild(working, guild_id),
                "guildId": guild_id,
                "guildScoped": working["guildScoped"]
            }

            response = await self._test_payload({
                "phase": phase,
                "endpoint": endpoint,
                "payloadFormat": working["payloadFormat"],
                "payload": payload,
                "style": style,
                "label": label
            })
            response["guildId"] = guild_id
            responses.append(response)
            time.sleep(self.options["requestDelayMs"] / 1000)

        return responses

    def _is_style_confirmed(self, response, expected_style):
        if not response or not response.get("ok"):
            return False
        return response.get("verifiedStyle") is True or self._response_contains_style(response, expected_style)

    def _response_contains_style(self, response, expected_style):
        return self._object_contains_style(response.get("parsed"), expected_style)

    def _object_contains_style(self, value, expected_style, seen=None):
        seen = seen or set()
        if not value or not isinstance(value, dict):
            return False
        if id(value) in seen:
            return False
        seen.add(id(value))

        if self._style_matches(value.get("display_name_styles"), expected_style):
            return True
        if self._style_matches(value, expected_style):
            return True

        if (
            value.get("display_name_font_id") == expected_style["font_id"]
            and value.get("display_name_effect_id") == expected_style["effect_id"]
            and self._colors_match(value.get("display_name_colors"), expected_style["colors"])
        ):
            return True

        return any(self._object_contains_style(child, expected_style, seen) for child in value.values())

    def _style_matches(self, value, expected_style):
        return (
            bool(value)
            and value.get("font_id") == expected_style["font_id"]
            and value.get("effect_id") == expected_style["effect_id"]
            and self._colors_match(value.get("colors"), expected_style["colors"])
        )

    def _colors_match(self, actual, expected):
        return (
            isinstance(actual, list)
            and isinstance(expected, list)
            and len(actual) == len(expected)
            and all(a == b for a, b in zip(actual, expected))
        )

    async def _test_payload(self, params):
        phase = params["phase"]
        endpoint = params["endpoint"]
        payload_format = params["payloadFormat"]
        payload = params["payload"]
        style = params["style"]
        label = params.get("label")

        await self._log_display_name_style_test({
            "phase": phase,
            "endpoint": endpoint,
            "payloadFormat": payload_format,
            "payload": payload,
            "style": style,
            "label": label,
            "status": "STARTED"
        })

        response = self.api.patch(endpoint["endpoint"], payload)

        if response["ok"] and not self._response_contains_style(response, style):
            response["verification"] = await self._verify_applied_style(endpoint, style)
            response["verifiedStyle"] = any(entry.get("confirmed") for entry in response["verification"])
        else:
            response["verifiedStyle"] = self._response_contains_style(response, style)

        await self._log_display_name_style_test({
            "phase": phase,
            "endpoint": endpoint,
            "payloadFormat": payload_format,
            "payload": payload,
            "style": style,
            "label": label,
            "status": response["status"],
            "response": response,
            "result": "SUCCESS_CONFIRMED" if self._is_style_confirmed(response, style) else ("SUCCESS_UNCONFIRMED" if response["ok"] else "FAILURE")
        })

        if not response["ok"] and response["status"] in SUPPORTED_ERROR_STATUSES:
            self.report["notes"].append(f"{endpoint['label']} returned {response['status']} during {phase}.")

        return response

    async def _verify_applied_style(self, endpoint, style):
        user_id = getattr(getattr(self.client, "user", None), "id", None)
        checks = ["/users/@me"]
        if user_id:
            query = f"?guild_id={endpoint['guildId']}" if endpoint["guildId"] else ""
            checks.append(f"/users/{user_id}/profile{query}")

        results = []
        for check_endpoint in checks:
            response = self.api.get(check_endpoint, {"maxRetries": 1})
            results.append({
                "endpoint": check_endpoint,
                "status": response["status"],
                "confirmed": self._response_contains_style(response, style),
                "response": response
            })

        return results

    def _build_payload(self, format, style):
        return PAYLOAD_FORMATS[format](style)

    def _validate_payload(self, format, payload):
        if format not in PAYLOAD_FORMATS:
            return False

        style = (
            payload["display_name_styles"] if format == "A" else {
                "font_id": payload["display_name_font_id"],
                "effect_id": payload["display_name_effect_id"],
                "colors": payload["display_name_colors"]
            }
        )

        valid = self._validate_style(style)

        if not valid:
            self.report["notes"].append(f"Skipped invalid payload format {format}.")
        return valid

    def _record_endpoint_result(self, endpoint, payload_format, response):
        if endpoint["label"] not in self.report["endpoints"]:
            self.report["endpoints"][endpoint["label"]] = {}
        self.report["endpoints"][endpoint["label"]][payload_format] = {
            "status": response["status"],
            "supported": "YES" if self._is_style_confirmed(response, self.options["targetStyle"]) else ("UNCONFIRMED" if response["ok"] else "NO"),
            "rateLimited": response["rateLimited"],
            "errorCode": response.get("parsed", {}).get("code"),
            "message": response.get("parsed", {}).get("message") or response.get("statusText")
        }

    def _capture_unsupported_fields(self, response):
        fields = self._extract_error_fields(response.get("parsed", {}).get("errors"))
        for field in fields:
            self._add_unique(self.report["unsupportedFields"], field)

    def _extract_error_fields(self, errors, prefix=""):
        if not errors or not isinstance(errors, dict):
            return []

        fields = []
        for key, value in errors.items():
            if key == "_errors":
                continue
            next = f"{prefix}.{key}" if prefix else key
            if value and "_errors" in value:
                fields.append(next)
            fields.extend(self._extract_error_fields(value, next))
        return fields

    async def _ensure_log_directory(self):
        pathlib.Path(self.options["logDir"]).mkdir(parents=True, exist_ok=True)

    async def _log_api_response(self, entry):
        await self._log_event("api-response", self._sanitize_log_entry(entry))

    async def _log_display_name_style_test(self, entry):
        await self._log_event("display-name-style-test", self._sanitize_log_entry({
            "separator": "━━━━━━━━━━━━━━━━━━",
            "title": "Display Name Style Test",
            **entry
        }))

    async def _write_summary(self, message):
        self.report["notes"].append(message)
        await self._log_event("summary", {"message": message})
        print(f"[DisplayNameStyles] {message} | Main: KyronixStudio | High Partner: dray.me")

    async def _log_event(self, type, data):
        entry = {
            "type": type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")

    def _sanitize_log_entry(self, entry):
        if not entry or not isinstance(entry, dict):
            return entry

        def sanitize(obj):
            if isinstance(obj, dict):
                return {k: "[REDACTED]" if "authorization" in k.lower() else sanitize(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [sanitize(item) for item in obj]
            else:
                return obj

        return sanitize(entry)

    async def _load_working_config(self):
        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                parsed = json.load(f)
                if parsed.get("endpoint") and parsed.get("payloadFormat") and parsed.get("style"):
                    return self._normalize_working_config(parsed)
        except:
            pass
        return None

    async def _save_working_config(self, config):
        with open(self.cache_file, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

    def _normalize_working_config(self, config):
        normalized = config.copy()

        if normalized.get("endpoint", "").startswith("/guilds/") and "/members/@me" in normalized["endpoint"]:
            normalized["guildScoped"] = True
            normalized["endpointTemplate"] = normalized.get("endpointTemplate", "/guilds/{guild_id}/members/@me")
            normalized["endpointLabel"] = normalized.get("endpointLabel", "PATCH /guilds/{guild_id}/members/@me")
            normalized["endpointKey"] = normalized.get("endpointKey", "guild-members-me")

        if normalized.get("endpoint", "").startswith("/guilds/") and "/profile/@me" in normalized["endpoint"]:
            normalized["guildScoped"] = True
            normalized["endpointTemplate"] = normalized.get("endpointTemplate", "/guilds/{guild_id}/profile/@me")
            normalized["endpointLabel"] = normalized.get("endpointLabel", "PATCH /guilds/{guild_id}/profile/@me")
            normalized["endpointKey"] = normalized.get("endpointKey", "guild-profile-me")

        if normalized.get("endpoint") == "/users/@me":
            normalized["guildScoped"] = False
            normalized["endpointTemplate"] = normalized.get("endpointTemplate", "/users/@me")
            normalized["endpointLabel"] = normalized.get("endpointLabel", "PATCH /users/@me")
            normalized["endpointKey"] = normalized.get("endpointKey", "users-me")

        return normalized

    async def _finalize_report(self, message):
        self.report["generatedAt"] = datetime.utcnow().isoformat()
        self.report["notes"].append(message)
        with open(self.report_file, "w", encoding="utf-8") as f:
            f.write(self._render_report())
        await self._log_event("report", self.report)
        print(f"[DisplayNameStyles] {message} | Powered by KyronixStudio & dray.me")

    def _render_report(self):
        lines = [
            "# Display Name Styles Report",
            "",
            "## Credits",
            "- **Main Server**: KyronixStudio",
            "- **High Partner**: dray.me",
            "",
            f"Generated At: {self.report['generatedAt']}",
            "",
            f"Endpoint Supported: {self.report['endpointSupported']}",
            f"Bot Token Supported: {self.report['botTokenSupported']}",
            f"Payload Format: {self.report['payloadFormat']}",
            f"Selected Preset: {self.report['selectedStylePreset']['label'] if self.report['selectedStylePreset'] else 'UNKNOWN'} ({self.report['selectedStylePreset']['key'] if self.report['selectedStylePreset'] else 'UNKNOWN'})",
            f"Accepted Font IDs: {', '.join(map(str, self.report['acceptedFontIds'])) if self.report['acceptedFontIds'] else 'UNKNOWN'}",
            f"Accepted Effect IDs: {', '.join(map(str, self.report['acceptedEffectIds'])) if self.report['acceptedEffectIds'] else 'UNKNOWN'}",
            f"Accepted Colors: {' | '.join(self.report['acceptedColors']) if self.report['acceptedColors'] else 'UNKNOWN'}",
            f"Unsupported Fields: {', '.join(self.report['unsupportedFields']) if self.report['unsupportedFields'] else 'NONE DETECTED'}",
            "",
            "## Final Working Configuration",
            "```json",
            json.dumps(self.report['finalWorkingConfiguration'], indent=2),
            "```",
            "",
            "## Final Target Configuration",
            "```json",
            json.dumps({"display_name_styles": self.options['targetStyle']}, indent=2),
            "```",
            "",
            "## Available Style Presets",
            "```json",
            json.dumps(self.report['availableStylePresets'], indent=2),
            "```",
            "",
            "## Endpoint Results",
            "```json",
            json.dumps(self.report['endpoints'], indent=2),
            "```",
            "",
            "## Notes",
            *[f"- {note}" for note in self.report['notes']],
            ""
        ]
        return "\n".join(lines)

    def _add_unique(self, target, value):
        if value not in target:
            target.append(value)

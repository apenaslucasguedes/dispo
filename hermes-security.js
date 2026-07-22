(function (root) {
  "use strict";

  const SUSPICIOUS_KEY = /^(?:api[_-]?key|access[_-]?token|auth(?:orization)?|client[_-]?secret|password|passwd|private[_-]?key|secret|service[_-]?role)$/i;
  const EXPLICIT_SECRET_RULES = [
    { ruleId: "private-key", category: "private-key", pattern: /-----BEGIN (?:[A-Z0-9]+(?: [A-Z0-9]+)* )?PRIVATE KEY-----/i },
    { ruleId: "jwt", category: "jwt", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i },
    { ruleId: "aws-access-key", category: "cloud-access-key", pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/ },
    { ruleId: "google-api-key", category: "cloud-api-key", pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
    { ruleId: "anthropic-token", category: "provider-api-token", pattern: /\bsk-ant-[A-Za-z0-9_-]{16,}\b/ },
    { ruleId: "openai-token", category: "provider-api-token", pattern: /\bsk-(?!ant-)[A-Za-z0-9_-]{16,}\b/ },
    { ruleId: "github-token", category: "provider-api-token", pattern: /\b(?:ghp_|gho_|ghu_|ghs_|ghr_|github_pat_)[A-Za-z0-9_]{16,}\b/ },
    { ruleId: "slack-token", category: "provider-api-token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{16,}\b/ },
    { ruleId: "supabase-service-role", category: "supabase-service-role", pattern: /\b(?:SUPABASE_SERVICE_ROLE_KEY|service_role)\b/i },
  ];
  const OPAQUE_CANDIDATE = /\b[A-Za-z0-9_+\/=.-]{48,}\b/g;

  function isKnownSafeOpaque(value) {
    return /^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ||
      /^(?:REG|ART|VAL|DEC|SRC)-\d{3,}$/i.test(value) ||
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) ||
      (value.length <= 64 && /^(?:[a-z0-9]{1,30}-){2,}[a-z0-9]{1,30}$/.test(value));
  }

  function opaqueParts(value) {
    if (/^https?:\/\//i.test(value)) {
      try {
        const url = new URL(value);
        return [url.username, url.password, ...url.pathname.split("/"), ...url.searchParams.values()];
      } catch { return [value]; }
    }
    return (value.includes("/") || value.includes("\\"))
      ? value.replaceAll("\\", "/").split("/")
      : [value];
  }

  function finding(path, ruleId, category) {
    return { path, ruleId, category };
  }

  function findPayloadSecurityIssue(value, path = "$", key = "") {
    if (SUSPICIOUS_KEY.test(key)) return finding(path, "secret-field-name", "credential-field-name");
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        const result = findPayloadSecurityIssue(value[index], `${path}[${index}]`, "");
        if (result) return result;
      }
      return null;
    }
    if (value && typeof value === "object") {
      for (const [childKey, childValue] of Object.entries(value)) {
        const result = findPayloadSecurityIssue(childValue, `${path}.${childKey}`, childKey);
        if (result) return result;
      }
      return null;
    }
    if (typeof value !== "string") return null;

    for (const rule of EXPLICIT_SECRET_RULES) {
      if (rule.pattern.test(value)) return finding(path, rule.ruleId, rule.category);
    }
    for (const part of opaqueParts(value)) {
      let decoded = part;
      try { decoded = decodeURIComponent(part); } catch { /* inspect the original malformed component */ }
      for (const match of decoded.matchAll(OPAQUE_CANDIDATE)) {
        if (!isKnownSafeOpaque(match[0])) return finding(path, "opaque-secret", "opaque-secret");
      }
    }
    return null;
  }

  const api = { findPayloadSecurityIssue };
  root.HermesPayloadSecurity = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

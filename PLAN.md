# freedium-redirect-chrome-extension — Implementation Plan

**Repo:** https://github.com/jackytank/freedium-redirect-chrome-extension
**Purpose:** Personal-use Chrome extension. Redirects medium.com article URLs to a Freedium mirror (default: `freedium-mirror.cfd`) so paywalled articles are readable. Not intended for the Chrome Web Store — will be loaded unpacked via Developer Mode.

This is a plan for an LLM (or developer) to implement. Read the whole thing before writing code — there are open decisions flagged near the end that need to be resolved or explicitly assumed before implementation starts.

---

## 1. Constraints

- Manifest V3
- TypeScript
- Minimal permissions — `host_permissions` scoped to `*://medium.com/*` and `*://*.medium.com/*` only, never `<all_urls>`
- Prefer `chrome.declarativeNetRequest` over `chrome.webRequest` for the redirect (fewer permissions, less scary to anyone inspecting the extension)
- Mirror domain must be user-configurable (stored via `chrome.storage.sync`), not hardcoded — Freedium-style mirror domains have rotated in the past
- Right-click context menu option as a manual fallback to automatic redirect
- Optional stretch goal: Firefox support via `webextension-polyfill`, same codebase

---

## 2. File structure

```
freedium-redirect-chrome-extension/
├── manifest.json
├── background.ts        # service worker: registers dynamic declarativeNetRequest rules, handles context menu
├── content.ts            # detects SPA navigation within medium.com, optional paywall-detection UI
├── options.html
├── options.ts             # UI for setting/changing the mirror domain
├── rules.json              # fallback static ruleset (see section 4)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
├── tsconfig.json
└── PLAN.md                  # this file
```

---

## 3. manifest.json

```json
{
  "manifest_version": 3,
  "name": "Freedium Redirect",
  "version": "0.1.0",
  "description": "Redirects Medium articles to a Freedium mirror.",
  "permissions": ["declarativeNetRequest", "storage", "contextMenus"],
  "host_permissions": [
    "*://medium.com/*",
    "*://*.medium.com/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "options_page": "options.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

Note: this manifest deliberately omits the static `declarative_net_request.rule_resources` block. Since the mirror domain is user-configurable, rules are registered dynamically at runtime in `background.ts` instead of loaded from a static `rules.json`. Keep `rules.json` in the repo only as a documented fallback/example (see section 4), not as something the manifest actually loads.

---

## 4. Redirect logic

Two valid approaches exist. **Use dynamic rules (option B)** since the mirror domain must be configurable. Option A is included here only so the implementing LLM understands the tradeoff and doesn't default to the simpler-but-wrong static approach.

**Option A — static rules (rejected for this project, reference only):**
A single static rule in `rules.json` using `declarativeNetRequest` regex substitution could rewrite `medium.com/(.*)` → `freedium-mirror.cfd/https://medium.com/\1`. Simplest possible implementation, but the mirror domain is baked in at build time, which conflicts with the configurability requirement.

**Option B — dynamic rules (use this):**
`background.ts` reads the mirror domain from `chrome.storage.sync`, builds a `declarativeNetRequest` redirect rule with that domain substituted into the regex, and registers it via `chrome.declarativeNetRequest.updateDynamicRules`. Re-run this whenever the stored mirror domain changes.

Pseudocode for `background.ts`:

```
const DEFAULT_MIRROR = "freedium-mirror.cfd";
const RULE_ID = 1;

async function registerRedirectRule() {
  const { mirrorDomain } = await chrome.storage.sync.get("mirrorDomain");
  const domain = mirrorDomain || DEFAULT_MIRROR;

  const rule = {
    id: RULE_ID,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        regexSubstitution: `https://${domain}/https://medium.com/\\1`
      }
    },
    condition: {
      // IMPORTANT: must not match URLs that already start with the mirror domain,
      // or this creates a redirect loop. See open question #1.
      regexFilter: "^https?://(?:www\\.)?medium\\.com/(.*)$",
      resourceTypes: ["main_frame"]
    }
  };

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: [rule]
  });
}

chrome.runtime.onInstalled.addListener(registerRedirectRule);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.mirrorDomain) registerRedirectRule();
});

chrome.contextMenus.onInstalled?.(() => {
  chrome.contextMenus.create({
    id: "open-in-freedium",
    title: "Open in Freedium",
    contexts: ["page", "link"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { mirrorDomain } = await chrome.storage.sync.get("mirrorDomain");
  const domain = mirrorDomain || DEFAULT_MIRROR;
  const targetUrl = info.linkUrl || tab?.url;
  if (!targetUrl || targetUrl.includes(domain)) return; // avoid double-wrapping
  chrome.tabs.update(tab.id, { url: `https://${domain}/${targetUrl}` });
});
```

This regex condition only matches plain `medium.com` URLs, not `*.medium.com` subdomains (e.g. `the-tech-notes.medium.com` style publication subdomains). The implementing LLM needs to extend the regex or condition to also cover `*://*.medium.com/*` per the host_permissions scope — this is intentionally left incomplete in the pseudocode above so the implementer makes an explicit choice rather than silently copy-pasting something that misses half of Medium's URLs.

---

## 5. content.ts (SPA navigation handling)

Medium is a single-page app. Navigating between articles by clicking links within medium.com may not trigger a new top-level navigation that `declarativeNetRequest` reliably catches. `background.ts` alone may be insufficient.

Pseudocode:

```
// Runs as a content script on *.medium.com
// Listens for SPA-style URL changes (history.pushState / popstate)
// that a plain declarativeNetRequest rule might miss.

let lastUrl = location.href;

function checkForNavigation() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    chrome.runtime.sendMessage({ type: "MEDIUM_NAVIGATION", url: lastUrl });
  }
}

new MutationObserver(checkForNavigation).observe(document, { subtree: true, childList: true });
// Background script receives MEDIUM_NAVIGATION and decides whether to redirect,
// per whatever auto-redirect vs. manual-button decision is made (open question #2).
```

---

## 6. options.html / options.ts

Single text input for mirror domain, defaulting to `freedium-mirror.cfd`, saved to `chrome.storage.sync` on change/blur. No other settings needed for v0.1.

---

## 7. Open questions — resolve before/during implementation

1. **Loop prevention precision.** The regex condition in section 4 needs to definitively exclude URLs that are already on the mirror domain, and needs to decide whether it should match `*.medium.com` subdomains (publication domains) in addition to plain `medium.com`. Don't ship without testing both.

2. **Auto-redirect vs. manual button.** Instant redirect (via `declarativeNetRequest`) is simplest but means losing Medium's free preview text before deciding to bypass, and it redirects *every* article, free or not. A floating "Read Full Article" button (content-script driven, triggered only when a paywall/member-only marker is detected on the page) is more deliberate but adds complexity. **Decide which mode this implementation targets before writing `content.ts` in full** — the plan above assumes auto-redirect as the primary mechanism with the context menu as manual fallback, but flag this clearly if changing.

3. **Already-free articles.** If going with auto-redirect, decide whether to redirect all medium.com visits unconditionally, or first check for a paywall marker (e.g. a `meteredContent` flag or "Member-only story" element) and only redirect when present. Unconditional redirect is simpler but degrades the reading experience on already-free articles (slower load, occasionally broken images on the mirror).

4. **Firefox support.** Stretch goal only — implement Chrome/Manifest V3 first, then assess whether adding `webextension-polyfill` is worth it afterward.

---

## 8. Testing checklist

- Load unpacked: `chrome://extensions` → enable Developer Mode → Load unpacked → select repo folder
- Test against a known paywalled article (e.g. `medium.com/the-tech-notes/...`) — confirm redirect to mirror works and content loads
- Test against a free (non-paywalled) medium.com article — confirm behavior matches whatever was decided in open question #3
- Test navigating from one article to another within the same tab without closing it, to confirm the SPA case (open question handled in `content.ts`) actually triggers
- Test the context menu option independently of auto-redirect
- Change the mirror domain in the options page and confirm the dynamic rule updates without needing to reload the extension

export {};

const DEFAULT_MIRROR = "freedium-mirror.cfd";
const DEFAULT_AUTO_REDIRECT = true;
const RULE_ID = 1;

const MEDIUM_REGEX =
  "^https?://(?:[\\w-]+\\.)*medium\\.com/(.*)$";

async function getSettings(): Promise<{ autoRedirectEnabled: boolean; mirrorDomain: string }> {
  const data = await chrome.storage.sync.get({
    autoRedirectEnabled: DEFAULT_AUTO_REDIRECT,
    mirrorDomain: DEFAULT_MIRROR,
  });
  return {
    autoRedirectEnabled: data.autoRedirectEnabled as boolean,
    mirrorDomain: (data.mirrorDomain as string) || DEFAULT_MIRROR,
  };
}

async function getMirrorDomain(): Promise<string> {
  const { mirrorDomain } = await getSettings();
  return mirrorDomain;
}

async function registerRedirectRule(): Promise<void> {
  const domain = await getMirrorDomain();

  const rule: chrome.declarativeNetRequest.Rule = {
    id: RULE_ID,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        regexSubstitution: `https://${domain}/https://medium.com/\\1`,
      },
    },
    condition: {
      regexFilter: MEDIUM_REGEX,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  };

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: [rule],
  });
}

async function removeRedirectRule(): Promise<void> {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
  });
}

async function updateBadge(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await chrome.action.setBadgeText({ text: "ON" });
      await chrome.action.setBadgeBackgroundColor({ color: "#1a8917" });
    } else {
      await chrome.action.setBadgeText({ text: "" });
    }
  } catch {
    // badge API unavailable in some contexts — non-critical
  }
}

async function syncRuleFromState(autoRedirectEnabled: boolean): Promise<void> {
  try {
    if (autoRedirectEnabled) {
      await registerRedirectRule();
    } else {
      await removeRedirectRule();
    }
  } catch {
    // declarativeNetRequest may fail if permissions changed — log but don't crash
  }
  await updateBadge(autoRedirectEnabled);
}

// --- Install / update handler ---
chrome.runtime.onInstalled.addListener(async () => {
  const { autoRedirectEnabled } = await getSettings();
  await syncRuleFromState(autoRedirectEnabled);

  chrome.contextMenus.create({
    id: "open-in-freedium",
    title: "Open in Freedium",
    contexts: ["page", "link"],
  });
});

// --- Start-up initialisation (service worker can restart anytime) ---
(async () => {
  const { autoRedirectEnabled } = await getSettings();
  await syncRuleFromState(autoRedirectEnabled);
})();

// --- Storage change handler ---
// React to any sync storage change — popup/options save triggers this.
// Use newValue directly when available to avoid a second async read that
// could be interrupted by service worker termination.
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "sync") return;

  let autoRedirectEnabled: boolean | undefined;
  let mirrorDomain: string | undefined;

  if (changes.autoRedirectEnabled) {
    autoRedirectEnabled = changes.autoRedirectEnabled.newValue as boolean;
  }
  if (changes.mirrorDomain) {
    mirrorDomain = (changes.mirrorDomain.newValue as string) || DEFAULT_MIRROR;
  }

  if (autoRedirectEnabled === undefined && mirrorDomain === undefined) return;
  if (autoRedirectEnabled === undefined) {
    const s = await getSettings();
    autoRedirectEnabled = s.autoRedirectEnabled;
  }

  await syncRuleFromState(autoRedirectEnabled);
});

// --- Context menu handler (manual fallback) ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const domain = await getMirrorDomain();
  const targetUrl = info.linkUrl || info.pageUrl || tab?.url;

  if (!targetUrl || !tab?.id) return;
  if (targetUrl.includes(domain)) return;

  chrome.tabs.update(tab.id, { url: `https://${domain}/${targetUrl}` });
});

// --- SPA navigation (auto-redirect mode) ---
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "MEDIUM_NAVIGATION") {
    if (!sender.tab?.id) return;

    getSettings().then(({ autoRedirectEnabled, mirrorDomain }) => {
      if (!autoRedirectEnabled) return;
      const mirrorUrl = `https://${mirrorDomain}/${message.url}`;
      chrome.tabs.update(sender.tab!.id!, { url: mirrorUrl });
    });
  }

  if (message.type === "MANUAL_REDIRECT") {
    if (!sender.tab?.id) return;

    getSettings().then(({ mirrorDomain }) => {
      const mirrorUrl = `https://${mirrorDomain}/${message.url}`;
      chrome.tabs.update(sender.tab!.id!, { url: mirrorUrl });
    });
  }
});

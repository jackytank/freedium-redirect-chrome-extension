export {};

const DEFAULT_MIRROR = "freedium-mirror.cfd";
const RULE_ID = 1;

// Matches medium.com and *.medium.com (publication subdomains).
// Does NOT match URLs already on the mirror domain.
// The regexSubstitution captures the full path after medium.com/<path>
const MEDIUM_REGEX =
  "^https?://(?:[\\w-]+\\.)*medium\\.com/(.*)$";

async function getMirrorDomain(): Promise<string> {
  const { mirrorDomain } = await chrome.storage.sync.get<{ mirrorDomain?: string }>("mirrorDomain");
  return mirrorDomain || DEFAULT_MIRROR;
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

// --- Install / update handler ---
chrome.runtime.onInstalled.addListener(() => {
  registerRedirectRule();

  chrome.contextMenus.create({
    id: "open-in-freedium",
    title: "Open in Freedium",
    contexts: ["page", "link"],
  });
});

// --- Storage change handler ---
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.mirrorDomain) {
    registerRedirectRule();
  }
});

// --- Context menu handler (manual fallback) ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const domain = await getMirrorDomain();
  const targetUrl = info.linkUrl || info.pageUrl || tab?.url;

  if (!targetUrl || !tab?.id) return;
  if (targetUrl.includes(domain)) return;

  chrome.tabs.update(tab.id, { url: `https://${domain}/${targetUrl}` });
});

// --- SPA navigation handler (from content script) ---
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== "MEDIUM_NAVIGATION") return;
  if (!sender.tab?.id) return;

  getMirrorDomain().then((domain) => {
    const mirrorUrl = `https://${domain}/${message.url}`;
    chrome.tabs.update(sender.tab!.id!, { url: mirrorUrl });
  });
});

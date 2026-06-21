export {};

const DEFAULT_MIRROR = "freedium-mirror.cfd";

async function getMirrorDomain(): Promise<string> {
  const { mirrorDomain } = await chrome.storage.sync.get("mirrorDomain");
  return (mirrorDomain as string) || DEFAULT_MIRROR;
}

// --- Context menu ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-in-freedium",
    title: "Open in Freedium",
    contexts: ["page", "link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const domain = await getMirrorDomain();
  const targetUrl = info.linkUrl || info.pageUrl || tab?.url;

  if (!targetUrl || !tab?.id) return;
  if (targetUrl.includes(domain)) return;

  chrome.tabs.update(tab.id, { url: `https://${domain}/${targetUrl}` });
});

// --- Manual redirect from content script ---
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "MANUAL_REDIRECT") {
    if (!sender.tab?.id) return;

    getMirrorDomain().then((mirrorDomain) => {
      const mirrorUrl = `https://${mirrorDomain}/${message.url}`;
      chrome.tabs.update(sender.tab!.id!, { url: mirrorUrl });
    });
  }
});

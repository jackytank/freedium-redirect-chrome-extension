export {};

let autoRedirectEnabled = true;
let manualButtonEnabled = true;

async function syncSettings(): Promise<void> {
  const data = await chrome.storage.sync.get({
    autoRedirectEnabled: true,
    manualButtonEnabled: true,
  });
  autoRedirectEnabled = data.autoRedirectEnabled as boolean;
  manualButtonEnabled = data.manualButtonEnabled as boolean;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;

  let refreshButton = false;

  if (changes.autoRedirectEnabled) {
    autoRedirectEnabled = changes.autoRedirectEnabled.newValue as boolean;
    refreshButton = true;
  }
  if (changes.manualButtonEnabled) {
    manualButtonEnabled = changes.manualButtonEnabled.newValue as boolean;
    refreshButton = true;
  }

  if (!refreshButton) return;

  if (!manualButtonEnabled || autoRedirectEnabled) {
    document.getElementById("freedium-btn")?.remove();
  } else {
    tryInjectButton();
  }
});

function isArticlePath(pathname: string): boolean {
  return (
    pathname !== "/" &&
    !pathname.startsWith("/me") &&
    !pathname.startsWith("/mastodon") &&
    !pathname.startsWith("/new-story") &&
    !pathname.startsWith("/search") &&
    !pathname.startsWith("/tag") &&
    !pathname.startsWith("/topics") &&
    !pathname.startsWith("/about") &&
    !pathname.startsWith("/jobs") &&
    !pathname.startsWith("/membership")
  );
}

function createButton(targetUrl: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = "Read on Freedium";
  btn.title = "Open this article on the Freedium mirror";
  btn.style.cssText = `
    all: initial;
    position: fixed;
    top: 68px;
    right: 20px;
    z-index: 999999;
    background: #1a8917;
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 8px 16px;
    font: 500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    opacity: 0.85;
    transition: opacity 0.15s, background 0.15s;
    user-select: none;
  `;
  btn.addEventListener("pointerenter", () => { btn.style.opacity = "1"; });
  btn.addEventListener("pointerleave", () => { btn.style.opacity = "0.85"; });
  btn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "MANUAL_REDIRECT", url: targetUrl });
  });
  return btn;
}

function tryInjectButton(): void {
  if (!document.body || !manualButtonEnabled || autoRedirectEnabled) return;

  const url = location.href;
  if (!isArticlePath(new URL(url).pathname)) {
    document.getElementById("freedium-btn")?.remove();
    return;
  }

  const existing = document.getElementById("freedium-btn");
  if (existing && existing.dataset.freediumUrl === url) return;
  existing?.remove();

  const btn = createButton(url);
  btn.id = "freedium-btn";
  btn.dataset.freediumUrl = url;
  document.body.appendChild(btn);
}

let lastUrl = location.href;

function checkForNavigation(): void {
  if (location.href !== lastUrl) {
    lastUrl = location.href;

    if (autoRedirectEnabled && isArticlePath(new URL(location.href).pathname)) {
      chrome.runtime.sendMessage({ type: "MEDIUM_NAVIGATION", url: location.href });
      return;
    }
  }

  tryInjectButton();
}

async function init(): Promise<void> {
  await syncSettings();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => tryInjectButton());
  } else {
    tryInjectButton();
  }

  new MutationObserver(checkForNavigation).observe(document, { subtree: true, childList: true });
  window.addEventListener("popstate", checkForNavigation);
}

init();

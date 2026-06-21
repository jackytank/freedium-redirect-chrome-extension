export {};

const DEFAULT_MIRROR = "freedium-mirror.cfd";

const toggle = document.getElementById("autoRedirectToggle") as HTMLInputElement;
const mirrorDisplay = document.getElementById("mirrorDomainDisplay")!;
const settingsLink = document.getElementById("settingsLink") as HTMLAnchorElement;

async function load(): Promise<void> {
  const data = await chrome.storage.sync.get({
    autoRedirectEnabled: true,
    mirrorDomain: DEFAULT_MIRROR,
  });
  toggle.checked = data.autoRedirectEnabled as boolean;
  mirrorDisplay.textContent = `Mirror: ${(data.mirrorDomain as string) || DEFAULT_MIRROR}`;
}

toggle.addEventListener("change", async () => {
  await chrome.storage.sync.set({ autoRedirectEnabled: toggle.checked });
});

settingsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

load();

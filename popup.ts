export {};

const DEFAULT_MIRROR = "freedium-mirror.cfd";

const mirrorDisplay = document.getElementById("mirrorDomainDisplay")!;
const settingsLink = document.getElementById("settingsLink") as HTMLAnchorElement;

async function load(): Promise<void> {
  const { mirrorDomain } = await chrome.storage.sync.get({ mirrorDomain: DEFAULT_MIRROR });
  mirrorDisplay.textContent = `Mirror: ${(mirrorDomain as string) || DEFAULT_MIRROR}`;
}

settingsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

load();

export {};

const DEFAULT_MIRROR = "freedium-mirror.cfd";

const autoToggle = document.getElementById("autoRedirectEnabled") as HTMLInputElement;
const manualToggle = document.getElementById("manualButtonEnabled") as HTMLInputElement;
const domainInput = document.getElementById("mirrorDomain") as HTMLInputElement;
const statusEl = document.getElementById("status")!;

async function load(): Promise<void> {
  const data = await chrome.storage.sync.get({
    autoRedirectEnabled: true,
    manualButtonEnabled: true,
    mirrorDomain: DEFAULT_MIRROR,
  });
  autoToggle.checked = data.autoRedirectEnabled as boolean;
  manualToggle.checked = data.manualButtonEnabled as boolean;
  domainInput.value = (data.mirrorDomain as string) || DEFAULT_MIRROR;
}

async function saveAll(): Promise<void> {
  await chrome.storage.sync.set({
    autoRedirectEnabled: autoToggle.checked,
    manualButtonEnabled: manualToggle.checked,
    mirrorDomain: domainInput.value.trim() || DEFAULT_MIRROR,
  });
  statusEl.textContent = "Saved.";
  setTimeout(() => { statusEl.textContent = ""; }, 1500);
}

autoToggle.addEventListener("change", saveAll);
manualToggle.addEventListener("change", saveAll);
domainInput.addEventListener("change", saveAll);
domainInput.addEventListener("blur", saveAll);

document.addEventListener("DOMContentLoaded", load);

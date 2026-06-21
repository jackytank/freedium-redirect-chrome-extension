export {};

const DEFAULT_MIRROR = "freedium-mirror.cfd";

const domainInput = document.getElementById("mirrorDomain") as HTMLInputElement;
const statusEl = document.getElementById("status")!;

async function load(): Promise<void> {
  const { mirrorDomain } = await chrome.storage.sync.get<{ mirrorDomain?: string }>("mirrorDomain");
  domainInput.value = mirrorDomain || DEFAULT_MIRROR;
}

async function save(): Promise<void> {
  const domain = domainInput.value.trim() || DEFAULT_MIRROR;
  await chrome.storage.sync.set({ mirrorDomain: domain });
  statusEl.textContent = "Saved.";
  setTimeout(() => {
    statusEl.textContent = "";
  }, 1500);
}

document.addEventListener("DOMContentLoaded", load);
domainInput.addEventListener("change", save);
domainInput.addEventListener("blur", save);

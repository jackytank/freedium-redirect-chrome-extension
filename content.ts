export {};

// Detects SPA navigation within medium.com (pushState / popstate)
// that declarativeNetRequest cannot catch, and asks the background
// service worker to redirect.

let lastUrl = location.href;

function isArticlePath(pathname: string): boolean {
  // Medium article paths look like /publication-name/article-slug-hash
  // Exclude root, /me/, /new-story, /mastodon/, /search, etc.
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

function checkForNavigation(): void {
  if (location.href === lastUrl) return;
  lastUrl = location.href;

  const url = new URL(location.href);
  if (isArticlePath(url.pathname)) {
    chrome.runtime.sendMessage({
      type: "MEDIUM_NAVIGATION",
      url: location.href,
    });
  }
}

// Observe DOM mutations (Medium rewrites <body> on SPA transitions)
new MutationObserver(checkForNavigation).observe(document, {
  subtree: true,
  childList: true,
});

// Back/forward browser navigation within the SPA
window.addEventListener("popstate", checkForNavigation);

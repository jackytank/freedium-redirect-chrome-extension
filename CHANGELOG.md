<!--
  When adding a new release, prepend it below this comment (above the most recent entry).
  Each release section is copy-pasted directly into the GitHub release notes.
  Keep the GitHub release title as: "v<VERSION> — <one-line summary>"
-->

# Changelog

## [0.3.0] — 2026-06-21

### Removed
- **Auto-redirect feature removed entirely** — The `declarativeNetRequest` dynamic redirect rule, badge updates, auto-redirect toggle, and all associated logic have been stripped. The extension no longer automatically redirects Medium articles; it only provides a manual "Read on Freedium" button (content script) and a right-click context menu entry.

### Changed
- `manifest.json` — removed `declarativeNetRequest` permission.
- `background.ts` — simplified to context menu creation/click handling and `MANUAL_REDIRECT` message handler only.
- `content.ts` — the manual button is now the only mode; no longer conditional on auto-redirect being off.
- `popup.html` / `popup.ts` — removed the Auto Redirect toggle; now displays the mirror domain and a Settings link.
- `options.html` / `options.ts` — removed the Auto Redirect toggle; only Manual Button toggle and mirror domain remain.

## [0.2.1] — 2026-06-21

### Fixed
- Popup toggle and options page now reliably toggle auto-redirect on/off. The root cause was a fire-and-forget `chrome.storage.sync.set()` in the popup (could fail if popup closed before write committed) and an extra async storage read inside the `onChanged` handler that could be interrupted by service worker termination.
- Popup toggle handler now `await`s the storage write. Background `onChanged` handler uses `newValue` directly from the change event instead of re-reading storage. Error handling added around `declarativeNetRequest` and badge API calls.

## [0.2.0] — 2026-06-21

### Added
- **Icon popup toggle** — Click the extension icon to turn auto-redirect on/off instantly. Green "ON" badge shows active state (Dark Reader style).
- **Manual "Read on Freedium" button** — When auto-redirect is off, a floating green pill button appears on Medium article pages (top-right corner). One click to redirect via the mirror.
- **Options page toggles** — Auto Redirect and Manual Button can now be toggled from the options page alongside the mirror domain setting.

### Changed
- `background.ts`: redirect rule is now registered/removed dynamically based on `autoRedirectEnabled` setting. Badge reflects current state.
- `content.ts`: operates in two modes — auto-redirect SPA handling (when toggle is ON) or manual button injection (when toggle is OFF and manual button enabled).
- `MEDIUM_NAVIGATION` message from content script now checks `autoRedirectEnabled` before redirecting.
- Added `MANUAL_REDIRECT` message type for the floating button.

### Fixed
- Non-article Medium paths (`/tag/...`, `/search`, etc.) no longer accidentally trigger the floating button or SPA redirects.

## [0.1.0] — 2026-06-20

### Added
- Initial Chrome extension (Manifest V3, TypeScript).
- Automatic redirect of `medium.com/*` and `*.medium.com/*` to a Freedium mirror via `declarativeNetRequest`.
- User-configurable mirror domain (saved to `chrome.storage.sync`, options page).
- Right-click context menu "Open in Freedium" as manual fallback.
- Content script detecting SPA navigation within Medium (`MutationObserver` + `popstate`).
- `rules.json` as documented fallback static ruleset.

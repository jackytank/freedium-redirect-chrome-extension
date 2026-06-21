<!--
  When adding a new release, prepend it below this comment (above the most recent entry).
  Keep the "## [Unreleased]" section at the very top for work-in-progress.
-->

# Changelog

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

# Freedium Redirect

Chrome extension that redirects Medium articles to a Freedium mirror so paywalled content is readable without a subscription.

## Setup

```bash
npm install
npm run build        # compiles TypeScript → dist/*.js (Chrome can only run JS)
```

Then load unpacked in your browser. **Select the project root folder** — the one containing `manifest.json`. The manifest references `dist/background.js` etc. relative to that root.

### Chrome
1. Go to `chrome://extensions`
2. Toggle **Developer mode** on (top-right)
3. Click **Load unpacked** → select this project folder
4. Pin the extension icon to your toolbar

### Edge
1. Go to `edge://extensions`
2. Toggle **Developer mode** on (bottom-left)
3. Click **Load unpacked** → select this project folder
4. Pin the extension icon to your toolbar

### Brave
1. Go to `brave://extensions`
2. Toggle **Developer mode** on (top-right)
3. Click **Load unpacked** → select this project folder
4. Pin the extension icon to your toolbar

### Other Chromium browsers (Opera, Vivaldi, Arc, etc.)
Same pattern — open `browsername://extensions`, enable Developer mode, Load unpacked.

## Usage

Once loaded, the extension works automatically:

- **Icon popup** — Click the extension icon for a toggle to turn auto-redirect on/off instantly. A green "ON" badge shows when active.
- **Auto-redirect** — When enabled, any Medium article you open (`medium.com/...` or publication subdomains like `blog.medium.com/...`) is silently redirected through the Freedium mirror.
- **Manual button** — When auto-redirect is *off*, a floating "Read on Freedium" button appears on Medium article pages (top-right). Click it to redirect just that article.
- **Context menu** — Right-click any page or link → **Open in Freedium** to manually redirect a URL. Always available regardless of toggle state.

## Changing the mirror domain

Mirror domains can change over time. To update:

1. Click the extension icon → **Settings…** (or right-click the icon → **Options**)
2. Enter the new domain (e.g. `freedium-mirror.cfd`)
3. Configure the **Auto Redirect** and **Manual Button** toggles as desired
4. Changes apply immediately — no need to reload

The default is `freedium-mirror.cfd`.

## Development

```bash
npm run build       # compile TypeScript → dist/
npm run watch       # watch mode (recompile on changes)
```

After code changes, click the refresh icon on the extension card at `chrome://extensions` to reload the service worker and content scripts.

### Project structure

```
├── manifest.json      # extension manifest (MV3)
├── background.ts      # service worker — dynamic redirect rules + context menu
├── content.ts         # content script — SPA nav detection + manual button injection
├── popup.html         # popup UI (auto-redirect toggle)
├── popup.ts           # popup logic
├── options.html       # options page UI
├── options.ts         # options page logic
├── rules.json         # documented fallback static ruleset (not loaded by manifest)
├── icons/             # extension icons
├── scripts/           # utility scripts (icon generator)
├── CHANGELOG.md       # release history
└── tsconfig.json
```

## License

MIT

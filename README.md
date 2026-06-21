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

- **Auto-redirect** — Any Medium article you open (`medium.com/...` or publication subdomains like `blog.medium.com/...`) is silently redirected through the Freedium mirror.
- **Context menu** — Right-click any page or link → **Open in Freedium** to manually redirect a URL. Useful as a fallback if auto-redirect isn't wanted for a particular page.

## Changing the mirror domain

Mirror domains can change over time. To update:

1. Right-click the extension icon → **Options** (or click the icon and select Options)
2. Enter the new domain (e.g. `freedium-mirror.cfd`)
3. Changes apply immediately — no need to reload

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
├── content.ts         # content script — catches SPA navigations on Medium
├── options.html       # options page UI
├── options.ts         # options page logic
├── rules.json         # documented fallback static ruleset (not loaded by manifest)
├── icons/             # extension icons
├── scripts/           # utility scripts (icon generator)
└── tsconfig.json
```

## License

MIT

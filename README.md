# Freedium Redirect

Chrome extension that lets you manually open Medium articles on a Freedium mirror so paywalled content is readable without a subscription.

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

Once loaded, you can redirect Medium articles in two ways:

- **Manual button** — When enabled in settings, a floating "Read on Freedium" button appears on Medium article pages (top-right). Click it to open the current article on the mirror.
- **Context menu** — Right-click any page or link → **Open in Freedium** to manually redirect a URL. Always available.

## Settings

Click the extension icon → **Settings…** (or right-click the icon → **Options**) to configure:

- **Manual Button** — toggle the floating button on/off
- **Mirror domain** — set the mirror domain (default: `freedium-mirror.cfd`). Mirror domains can change over time, so you can update it here without reloading the extension.

## Development

```bash
npm run build       # compile TypeScript → dist/
npm run watch       # watch mode (recompile on changes)
```

After code changes, click the refresh icon on the extension card at `chrome://extensions` to reload the service worker and content scripts.

### Project structure

```
├── manifest.json      # extension manifest (MV3)
├── background.ts      # service worker — context menu + manual redirect handling
├── content.ts         # content script — manual button injection + SPA nav handling
├── popup.html         # popup UI (mirror domain display + settings link)
├── popup.ts           # popup logic
├── options.html       # options page UI
├── options.ts         # options page logic
├── rules.json         # documented reference ruleset (not loaded by manifest)
├── icons/             # extension icons
├── scripts/           # utility scripts (icon generator)
├── CHANGELOG.md       # release history
└── tsconfig.json
```

## License

MIT

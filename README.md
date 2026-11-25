# LinkedIn Accept All Invitations

A Chrome and Firefox extension that accepts all pending LinkedIn connection invitations with one click.

## Usage

1. Click the extension icon.
2. If you are not on the LinkedIn invitation manager page, the extension opens it. Click the button again when the page has loaded.
3. The extension scrolls the page, clicks **Accept** on each invitation and logs each accepted name.

The extension works only on `https://www.linkedin.com/mynetwork/invitation-manager/`. It sends no data to any server. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

## Install in Chrome

1. Clone this repository.
2. Open `chrome://extensions/` and turn on Developer mode.
3. Click **Load unpacked** and select this folder.

## Firefox

Firefox 140 or later is necessary. Firefox uses the same code as Chrome, with a different manifest. Load the Firefox build, not the repository root.

1. Run `./package.sh firefox`. This writes the Firefox build to `build/firefox/`. The script needs `jq` and `zip`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `build/firefox/manifest.json`.

Firefox removes a temporary add-on when it closes. To keep the add-on installed, sign it on addons.mozilla.org (AMO) as unlisted:

```bash
npx web-ext sign --channel=unlisted --source-dir build/firefox --artifacts-dir build/signed
```

The command reads your AMO API keys from the `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` environment variables. Create the keys at https://addons.mozilla.org/en-US/developers/addon/api/key/.

## Packaging

`./package.sh` makes `linkedin-accept-all-invitations-chrome-vX.Y.zip` and `linkedin-accept-all-invitations-firefox-vX.Y.zip`. Run `./package.sh chrome` or `./package.sh firefox` to make only one of them. The Firefox manifest is `manifest.json` merged with `firefox/manifest.overrides.json`.

# Chrome Web Store Submission Guide

Answers for the Privacy practices tab when publishing.

## Single Purpose Description

> This extension automates accepting pending LinkedIn connection invitations. Users click a single button to accept all visible invitations on the LinkedIn invitation manager page, with automatic scrolling and page refresh to process all pending invites.

## Permission Justifications

### activeTab

> The activeTab permission is used to detect whether the user is currently on the LinkedIn invitation manager page (https://www.linkedin.com/mynetwork/invitation-manager/). If the user is not on that page, the extension navigates them there. This permission is only exercised when the user clicks the extension popup button.

### Host Permission (content_scripts match pattern)

> The content script is injected only on https://www.linkedin.com/mynetwork/invitation-manager/* pages. This is the sole page where the extension operates. The content script reads the DOM to find "Accept" buttons on invitation cards, extracts the invitee's name and profile link for logging, scrolls the page to load more invitations, and clicks the Accept buttons. No data from the page is sent to any external server.

### storage

> The storage permission (chrome.storage.local) is used for two purposes: (1) Logging accepted invitations locally — each accepted invite's name, profile URL, and timestamp are stored so the user can review their accept history in the popup. (2) Persisting session state across page refreshes — when the page is refreshed to load more invitations, the running session count is saved and restored. All data is stored locally on the user's device and is never transmitted externally.

### Remote Code

> This extension does not use any remote code. All JavaScript is bundled locally in the extension package (content.js and popup.js). No scripts are fetched from external servers, no eval() or Function() constructors are used, and no code is injected from remote sources.

## Data Usage Certification

This extension:
- Does NOT collect, transmit, or sell user data
- Does NOT use analytics, telemetry, or tracking
- Does NOT communicate with any external servers or APIs
- Stores data only locally on the user's device via chrome.storage.local
- Operates exclusively on LinkedIn invitation manager pages
- All code executes locally within the browser

The extension complies with the Chrome Web Store Developer Program Policies regarding data handling and user privacy.

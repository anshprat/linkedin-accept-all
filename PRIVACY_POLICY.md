# Privacy Policy for LinkedIn Accept All Invitations

**Last Updated:** February 17, 2026

## Overview

LinkedIn Accept All Invitations is a Chrome extension that automates accepting pending LinkedIn connection invitations. This privacy policy explains our data practices and commitment to user privacy.

## Data Collection and Usage

**We do not collect, transmit, or share any user data with external parties.**

This extension:
- Does NOT collect any personal information
- Does NOT track user behavior or browsing history
- Does NOT transmit any data to external servers
- Does NOT use cookies
- Does NOT use analytics or telemetry services
- Does NOT communicate with any third-party services

### Local Storage

The extension stores the following data **locally on your device only** using chrome.storage.local:
- **Accept log:** The name, LinkedIn profile URL, and timestamp of each accepted invitation, so you can review your history in the extension popup.
- **Daily statistics:** A count of invitations accepted per day.
- **Session state:** A temporary record used to resume accepting after a page refresh. This is automatically cleared when the session completes or expires (10 minutes).

This data never leaves your browser. It is not transmitted, synced, or shared with any server or third party.

## Permissions

The extension requests the following permissions:

### activeTab
Allows the extension to detect whether the user is on the LinkedIn invitation manager page and navigate there if needed. This permission is only exercised when the user clicks the extension popup button.

### storage
Used to store the accept log, daily statistics, and session state locally on the user's device via chrome.storage.local. No data is synced or transmitted externally.

### Host Permission (content_scripts)
The content script runs only on pages matching `https://www.linkedin.com/mynetwork/invitation-manager/*`. It performs the following local operations:
1. Finds "Accept" buttons on invitation cards
2. Extracts the invitee's name and profile link for local logging
3. Clicks the Accept buttons with delays to mimic natural interaction
4. Scrolls the page to load additional invitations

## What the Extension Does

1. Detects "Accept" buttons on the LinkedIn invitation manager page
2. Clicks each button with a short delay between clicks
3. Scrolls the page to load more invitations
4. Refreshes the page if scrolling stops loading new content
5. Logs each accepted invitation locally for the user's reference

All operations occur locally in your browser. No data leaves your device.

## Third-Party Services

This extension does not integrate with, communicate with, or share data with any third-party services.

## Data Security

All data is stored locally using Chrome's built-in chrome.storage.local API. Since no data is transmitted externally, there are no data security concerns related to network transmission. Users can clear the stored data at any time by removing the extension.

## Children's Privacy

This extension does not knowingly collect information from children under 13 years of age. Since no personal data is collected or transmitted, children's privacy is fully protected.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document. Continued use of the extension after such changes constitutes acceptance of the updated privacy policy.

## Contact Information

If you have any questions or concerns about this privacy policy, please open an issue on our GitHub repository:
https://github.com/anshprat/linkedin-accept-all/issues


## Your Rights

The extension stores data locally only. You can view your stored data in the extension popup and clear all data by removing the extension from Chrome. Since no data is transmitted to us, there is no personal data held by us to access, modify, or delete.

## Summary

In simple terms: This extension clicks "Accept" buttons on LinkedIn invitation pages for you. It logs the names locally so you can see who you accepted. No data is collected, tracked, or sent anywhere. Your privacy is completely protected.

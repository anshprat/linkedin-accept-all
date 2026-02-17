(function () {
  "use strict";

  let isRunning = false;

  function getAcceptButtons() {
    // LinkedIn's invitation cards have "Accept" buttons.
    // Strategy: find all buttons whose visible text is "Accept".
    const buttons = document.querySelectorAll("button");
    return Array.from(buttons).filter((btn) => {
      const text = btn.textContent.trim().toLowerCase();
      return text === "accept" && !btn.disabled;
    });
  }

  function getProfileLink(btn) {
    // Find the profile link from the invitation card
    const card =
      btn.closest("li") ||
      btn.closest("[class*='invitation-card']") ||
      btn.closest("[class*='invite-card']") ||
      btn.closest("[class*='mn-invitation']");

    if (card) {
      const link = card.querySelector("a[href*='/in/']");
      if (link) return link.href;
    }

    // Walk up from button
    let parent = btn.parentElement;
    for (let i = 0; i < 6 && parent; i++) {
      const link = parent.querySelector("a[href*='/in/']");
      if (link) return link.href;
      parent = parent.parentElement;
    }

    return null;
  }

  function getInviteeName(btn) {
    // Strategy 1: The Accept button's aria-label often contains the name
    // e.g. "Accept John Doe's invitation to connect"
    const ariaLabel = btn.getAttribute("aria-label") || "";
    // Handle both straight quotes (') and curly quotes (\u2019)
    const ariaMatch = ariaLabel.match(/^Accept\s+(.+?)(?:['\u2019]s?\s+invitation|$)/i);
    if (ariaMatch) {
      const name = ariaMatch[1].trim();
      // Strip any trailing possessive that might have slipped through
      return name.replace(/['\u2019]s?\s*$/i, "").trim();
    }

    // Strategy 2: Walk up to the card container and search for the name
    const card =
      btn.closest("li") ||
      btn.closest("[class*='invitation-card']") ||
      btn.closest("[class*='invite-card']") ||
      btn.closest("[class*='mn-invitation']");

    if (card) {
      const nameSelectors = [
        "[class*='invitation-card__title']",
        "[class*='invite-card__title']",
        "[class*='mn-invitation-card__title']",
        "span.t-bold",
        "strong",
        "a[href*='/in/'] span",
        "a[href*='/in/']",
      ];
      for (const sel of nameSelectors) {
        const el = card.querySelector(sel);
        if (el) {
          const text = el.textContent.trim();
          if (text && text.length > 0 && text.length < 100) return text;
        }
      }
    }

    // Strategy 3: Walk up from the button
    let parent = btn.parentElement;
    for (let i = 0; i < 6 && parent; i++) {
      const link = parent.querySelector("a[href*='/in/']");
      if (link) {
        const text = link.textContent.trim();
        if (text && text.length > 0 && text.length < 100) return text;
      }
      parent = parent.parentElement;
    }

    return "Unknown";
  }

  async function logAcceptedInvite(name, profileUrl) {
    const entry = { name, profileUrl, timestamp: new Date().toISOString() };
    const data = await chrome.storage.local.get({ log: [], stats: {} });
    data.log.push(entry);

    // Update daily stats
    const today = entry.timestamp.slice(0, 10);
    data.stats[today] = (data.stats[today] || 0) + 1;

    await chrome.storage.local.set({ log: data.log, stats: data.stats });
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getScrollContainer() {
    // LinkedIn may use the main document or an inner scrollable element.
    // Look for common scrollable containers on the invitations page.
    const candidates = document.querySelectorAll("main, .scaffold-layout__main");
    for (const el of candidates) {
      if (el.scrollHeight > el.clientHeight) return el;
    }
    // Fallback to document scrolling element
    return document.scrollingElement || document.documentElement;
  }

  async function scrollToBottom() {
    const container = getScrollContainer();
    container.scrollTop = container.scrollHeight;
    // Also scroll the window in case the page uses full-document scroll
    window.scrollTo(0, document.body.scrollHeight);
    await delay(1500);
  }

  function getScrollHeight() {
    const container = getScrollContainer();
    return container.scrollHeight + document.body.scrollHeight;
  }

  async function saveSession(totalAccepted) {
    await chrome.storage.local.set({
      session: { totalAccepted, timestamp: Date.now() },
    });
  }

  async function clearSession() {
    await chrome.storage.local.remove("session");
  }

  async function getSession() {
    const data = await chrome.storage.local.get("session");
    if (!data.session) return null;
    // Expire stale sessions older than 10 minutes
    if (Date.now() - data.session.timestamp > 10 * 60 * 1000) {
      await clearSession();
      return null;
    }
    return data.session;
  }

  async function acceptAll(resumeCount) {
    if (isRunning) return;
    isRunning = true;

    let totalAccepted = resumeCount || 0;
    let emptyScrollAttempts = 0;
    const MAX_EMPTY_SCROLLS = 5;

    try {
      while (isRunning) {
        const buttons = getAcceptButtons();

        if (buttons.length > 0) {
          emptyScrollAttempts = 0;

          for (const btn of buttons) {
            if (!isRunning) break;

            const inviteeName = getInviteeName(btn);
            const profileUrl = getProfileLink(btn);

            btn.scrollIntoView({ behavior: "smooth", block: "center" });
            await delay(300);

            btn.click();
            totalAccepted++;

            await logAcceptedInvite(inviteeName, profileUrl);

            chrome.runtime.sendMessage({
              type: "progress",
              accepted: totalAccepted,
            });

            // Delay between clicks to avoid rate-limiting
            await delay(800 + Math.random() * 400);
          }

          // Brief pause after batch, then scroll to load more
          await delay(500);
          await scrollToBottom();
          continue;
        }

        // No buttons visible — scroll to trigger lazy-loading
        const prevHeight = getScrollHeight();
        await scrollToBottom();

        if (getScrollHeight() === prevHeight) {
          // Page didn't grow — wait a bit longer for async content
          emptyScrollAttempts++;
          if (emptyScrollAttempts >= MAX_EMPTY_SCROLLS) {
            // Scrolling exhausted — refresh page to confirm no more invites
            await saveSession(totalAccepted);
            location.reload();
            return; // Script will re-run after reload and check session
          }
          await delay(2000);
        } else {
          // Page grew, reset counter and keep going
          emptyScrollAttempts = 0;
        }
      }
    } catch (err) {
      console.error("LinkedIn Accept All: error", err);
    }

    isRunning = false;
    await clearSession();

    chrome.runtime.sendMessage({
      type: "done",
      accepted: totalAccepted,
    });
  }

  function stopAccepting() {
    isRunning = false;
    clearSession();
  }

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "acceptAll") {
      acceptAll();
      sendResponse({ started: true });
    } else if (message.action === "stop") {
      stopAccepting();
      sendResponse({ stopped: true });
    } else if (message.action === "ping") {
      sendResponse({ ready: true });
    }
    return true;
  });

  // On page load, check if we need to resume after a refresh
  async function checkResume() {
    const session = await getSession();
    if (!session) return;

    // Wait for the page to fully render
    await delay(3000);

    const buttons = getAcceptButtons();
    if (buttons.length > 0) {
      // Still have invites — resume accepting
      chrome.runtime.sendMessage({
        type: "progress",
        accepted: session.totalAccepted,
      });
      acceptAll(session.totalAccepted);
    } else {
      // No invites after refresh — truly done
      await clearSession();
      chrome.runtime.sendMessage({
        type: "done",
        accepted: session.totalAccepted,
      });
    }
  }

  checkResume();
})();

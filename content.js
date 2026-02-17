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

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
    await delay(1500);
  }

  async function acceptAll() {
    if (isRunning) return;
    isRunning = true;

    let totalAccepted = 0;

    try {
      while (true) {
        const buttons = getAcceptButtons();

        if (buttons.length === 0) {
          // Try scrolling to load more invitations
          const prevHeight = document.body.scrollHeight;
          await scrollToBottom();
          const newButtons = getAcceptButtons();

          if (newButtons.length === 0 || document.body.scrollHeight === prevHeight) {
            // No more invitations to accept
            break;
          }
          continue;
        }

        for (const btn of buttons) {
          if (!isRunning) break;

          btn.click();
          totalAccepted++;

          chrome.runtime.sendMessage({
            type: "progress",
            accepted: totalAccepted,
          });

          // Delay between clicks to avoid rate-limiting
          await delay(800 + Math.random() * 400);
        }

        // Small pause before checking for more
        await delay(1000);
      }
    } catch (err) {
      console.error("LinkedIn Accept All: error", err);
    }

    isRunning = false;

    chrome.runtime.sendMessage({
      type: "done",
      accepted: totalAccepted,
    });
  }

  function stopAccepting() {
    isRunning = false;
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
})();

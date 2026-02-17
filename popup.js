const INVITATIONS_URL = "https://www.linkedin.com/mynetwork/invitation-manager/";

const acceptBtn = document.getElementById("acceptBtn");
const stopBtn = document.getElementById("stopBtn");
const status = document.getElementById("status");

function setRunning(running) {
  acceptBtn.disabled = running;
  stopBtn.classList.toggle("hidden", !running);
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

acceptBtn.addEventListener("click", async () => {
  const tab = await getCurrentTab();

  if (!tab.url || !tab.url.startsWith(INVITATIONS_URL)) {
    // Open the invitations page and let the user click again
    chrome.tabs.update(tab.id, { url: INVITATIONS_URL });
    status.textContent = "Opening invitations page... Click the button again once it loads.";
    return;
  }

  setRunning(true);
  status.textContent = "Accepting invitations...";

  chrome.tabs.sendMessage(tab.id, { action: "acceptAll" }, (response) => {
    if (chrome.runtime.lastError) {
      status.textContent = "Error: reload the invitations page and try again.";
      setRunning(false);
    }
  });
});

stopBtn.addEventListener("click", async () => {
  const tab = await getCurrentTab();
  chrome.tabs.sendMessage(tab.id, { action: "stop" });
  setRunning(false);
  status.textContent = "Stopped.";
});

// Listen for progress messages from the content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "progress") {
    status.textContent = `Accepted ${message.accepted} invitation${message.accepted !== 1 ? "s" : ""}...`;
  } else if (message.type === "done") {
    status.textContent = `Done! Accepted ${message.accepted} invitation${message.accepted !== 1 ? "s" : ""}.`;
    setRunning(false);
  }
});

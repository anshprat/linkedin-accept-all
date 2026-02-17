const INVITATIONS_URL = "https://www.linkedin.com/mynetwork/invitation-manager/received/";

const acceptBtn = document.getElementById("acceptBtn");
const stopBtn = document.getElementById("stopBtn");
const status = document.getElementById("status");
const statToday = document.getElementById("statToday");
const statTotal = document.getElementById("statTotal");
const recentLog = document.getElementById("recentLog");

// Detect if we're running as a popout window (has tabId query param)
const params = new URLSearchParams(window.location.search);
const targetTabId = params.get("tabId") ? Number(params.get("tabId")) : null;
const isPopout = targetTabId !== null;

async function loadStats() {
  const data = await chrome.storage.local.get({ log: [], stats: {} });
  const today = new Date().toISOString().slice(0, 10);

  statToday.textContent = data.stats[today] || 0;
  statTotal.textContent = data.log.length;

  recentLog.innerHTML = "";
  const recent = data.log.slice(-20).reverse();
  for (const entry of recent) {
    const li = document.createElement("li");
    if (entry.profileUrl) {
      const nameLink = document.createElement("a");
      nameLink.className = "log-name";
      nameLink.href = entry.profileUrl;
      nameLink.textContent = entry.name;
      nameLink.target = "_blank";
      li.appendChild(nameLink);
    } else {
      const nameSpan = document.createElement("span");
      nameSpan.className = "log-name";
      nameSpan.textContent = entry.name;
      li.appendChild(nameSpan);
    }
    const timeSpan = document.createElement("span");
    timeSpan.className = "log-time";
    timeSpan.textContent = formatTime(entry.timestamp);
    li.appendChild(timeSpan);
    recentLog.appendChild(li);
  }
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

loadStats();

function setRunning(running) {
  acceptBtn.disabled = running;
  stopBtn.classList.toggle("hidden", !running);
}

function sendToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

async function getLinkedInTab() {
  // In popout mode, use the stored tab ID directly
  if (targetTabId) return targetTabId;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return null;

  if (!tab.url || !tab.url.startsWith(INVITATIONS_URL)) {
    chrome.tabs.update(tab.id, { url: INVITATIONS_URL });
    status.textContent = "Opening invitations page... Click the button again once it loads.";
    return null;
  }

  return tab.id;
}

acceptBtn.addEventListener("click", async () => {
  if (!isPopout) {
    // Running as a popup — open a detached popout window instead
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (!tab.url || !tab.url.startsWith(INVITATIONS_URL)) {
      chrome.tabs.update(tab.id, { url: INVITATIONS_URL });
      status.textContent = "Opening invitations page... Click the button again once it loads.";
      return;
    }

    // Open popup.html as a detached window, passing the LinkedIn tab ID
    const popupURL = chrome.runtime.getURL(`popup.html?tabId=${tab.id}&autostart=1`);
    chrome.windows.create({
      url: popupURL,
      type: "popup",
      width: 320,
      height: 480,
    });
    // The original popup will close automatically when it loses focus
    return;
  }

  // We're in popout mode — send accept command to the LinkedIn tab
  const tabId = await getLinkedInTab();
  if (!tabId) return;

  setRunning(true);
  status.textContent = "Accepting invitations...";

  const response = await sendToTab(tabId, { action: "acceptAll" });
  if (!response) {
    status.textContent = "Error: reload the invitations page and try again.";
    setRunning(false);
  }
});

stopBtn.addEventListener("click", async () => {
  const tabId = await getLinkedInTab();
  if (tabId) sendToTab(tabId, { action: "stop" });
  setRunning(false);
  status.textContent = "Stopped.";
});

// Listen for progress messages from the content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "progress") {
    status.textContent = `Accepted ${message.accepted} invitation${message.accepted !== 1 ? "s" : ""}...`;
    loadStats();
  } else if (message.type === "done") {
    status.textContent = `Done! Accepted ${message.accepted} invitation${message.accepted !== 1 ? "s" : ""}.`;
    setRunning(false);
    loadStats();
  }
});

// Auto-start accepting if opened as popout with autostart flag
if (isPopout && params.get("autostart") === "1") {
  // Small delay to let the window render, then auto-click accept
  setTimeout(() => acceptBtn.click(), 500);
}

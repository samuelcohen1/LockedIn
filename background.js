// Listen for messages from the server (e.g., token after OAuth)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.token) {
    // Store the token
    chrome.storage.local.set({ token: request.token }, () => {
      console.log("✅ Token saved successfully in storage.");

      // Confirm token was saved
      chrome.storage.local.get("token", (result) => {
        console.log("🧪 Retrieved token after save:", result.token);
      });

      // Notify popup or other parts of the extension
      chrome.windows.getAll({ populate: true }, (windows) => {
        windows.forEach((window) => {
          window.tabs.forEach((tab) => {
            chrome.runtime.sendMessage({ type: "TOKEN_UPDATED" });
          });
        });
      });
    });

    // Acknowledge to the sender
    sendResponse({ status: "success" });
  }
});

// Track tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Ensure the tab update is complete and has a valid URL and title
  if (changeInfo.status === "complete" && tab.url && tab.title) {
    console.log("Tab updated:", tab.url);

    // Prevent the popup from triggering the event
    if (tab.url.includes("popup.html")) {
      console.log("Ignoring popup tab update.");
      return;
    }

    // Open the popup only if it is not already open
    chrome.windows.getAll({ populate: true }, (windows) => {
      const popupExists = windows.some(
        (win) => win.type === "popup" && win.tabs.some((t) => t.url.includes("popup.html"))
      );

      if (!popupExists) {
        chrome.windows.create({
          url: "popup.html",
          type: "popup",
          width: 370,
          height: 400,
        });
      }
    });

    chrome.storage.local.get("token", (data) => {
      const token = data.token;

      if (!token) {
        console.warn("❗ No token found in storage. Tab not sent.");
        return;
      }

      console.log("📦 Sending tab data with token:", token);

      // Send the tab data to the backend
    fetch("http://localhost:3000/api/analyze-tab", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: tab.url,
          title: tab.title,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ Gemini classification:", data.classification);
  
        // Send the tab info and classification to the popup
        chrome.runtime.sendMessage({
          type: "TAB_ANALYZED",
          data: {
            url: tab.url,
            title: tab.title,
            classification: data.classification,
          },
        });
      })
        .catch((err) => {
          console.error("❌ Error sending tab data:", err);
        });
    });
  }
});
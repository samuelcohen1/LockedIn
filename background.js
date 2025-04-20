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
  if (changeInfo.status === "complete" && tab.url && tab.title) {
    console.log("🔄 Tab updated:", tab.url);

    chrome.storage.local.get("token", (data) => {
      const token = data.token;

      if (!token) {
        console.warn("❗ No token found in storage. Tab not sent.");
        return;
      }

      console.log("📦 Sending tab data with token:", token);

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
        })
        .catch((err) => {
          console.error("❌ Error sending tab data:", err);
        });
    });
  }
});

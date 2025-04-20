// Listen for messages from the server
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.token) {
        // Store the token
        chrome.storage.local.set({ token: request.token }, () => {
            console.log("✅ Token saved successfully in storage.");
            
            // Get all extension windows
            chrome.windows.getAll({ populate: true }, (windows) => {
                // Find popup windows
                windows.forEach((window) => {
                    window.tabs.forEach((tab) => {
                        // Send a message to the popup to update its UI
                        chrome.runtime.sendMessage({ type: 'TOKEN_UPDATED' });
                    });
                });
            });
        });
        
        // Send response back to the server
        sendResponse({ status: 'success' });

    }
  }
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.title) {
    console.log("Tab updated:", tab.url);

    // Hardcoded until JWT tokens are implemented
    const userID = "67e5aa84ce1402dc395b4abc";

    fetch("http://localhost:3000/api/analyze-tab", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title,
        userID: userID,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Gemini classification:", data.classification);
      })
      .catch((err) => {
        console.error("Error sending tab data:", err);
      });
  }
});

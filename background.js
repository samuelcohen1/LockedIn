chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.token) {
    chrome.storage.local.set({ token: request.token }, () => {
      console.log("✅ Token saved successfully in storage.");
    });
  }
});

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
          width: 400,
          height: 600,
        });
      }
    });

    // Hardcoded until JWT tokens are implemented
    const userID = "67e5aa84ce1402dc395b4abc";

    // Send the tab data to the backend
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
        console.error("Error sending tab data:", err);
      });
  }
});
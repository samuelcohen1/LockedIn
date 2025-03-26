chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.token) {
        chrome.storage.local.set({ token: request.token }, () => {
            console.log("✅ Token saved successfully in storage.");
        });
    }
});

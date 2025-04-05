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
});

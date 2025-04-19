document.getElementById("googleSignIn").addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000/auth/google" });
});


// Handle the token from the URL after OAuth redirects
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');


if (token) {
    chrome.storage.local.set({ token }, () => {
        console.log("Token stored successfully:", token);


        // Redirect back to the popup window after successful login
        window.location.href = `chrome-extension://${chrome.runtime.id}/popup.html`;
    });
} else {
    // Check if token already exists (if the popup reopened)
    chrome.storage.local.get("token", (result) => {
    if (result.token) {
        document.getElementById("status").innerText = "✅ Login successful!";
    } else {
        document.getElementById("status").innerText = "❌ Not logged in.";
    }
});


}


// Event Listener for Google Sign-In
document.getElementById("googleSignIn").addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000/auth/google" }, (tab) => {
        console.log("OAuth tab opened successfully:", tab);
    });
});


// Listen for messages from the background script
// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TAB_ANALYZED") {
      const { url, title, classification } = message.data;
  
      // Update the popup UI with formatted content
      const tabProductivityElement = document.getElementById("tab-productivity");
      tabProductivityElement.innerHTML = `
        <div style="margin-top: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
          <h3 style="margin: 0; font-size: 16px;">Tab Analysis</h3>
          <p style="margin: 5px 0;"><strong>Title:</strong> ${title}</p>
          <p style="margin: 5px 0;"><strong>URL:</strong> <a href="${url}" target="_blank">${url}</a></p>
          <p style="margin: 5px 0;"><strong>Classification:</strong> 
            <span style="color: ${
              classification === "productive"
                ? "green"
                : classification === "unproductive"
                ? "red"
                : "orange"
            };">${classification}</span>
          </p>
        </div>
      `;
    }
  });
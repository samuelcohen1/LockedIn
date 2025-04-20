// Function to update login status
function updateLoginStatus() {
    chrome.storage.local.get("token", (result) => {
        console.log("Checking token status:", result);
        const statusElement = document.getElementById("status");
        const signInButton = document.getElementById("googleSignIn");
        const logoutButton = document.getElementById("logoutButton");

        if (result.token) {
            console.log("Token found:", result.token);
            statusElement.innerText = "✅ Login successful!";
            signInButton.style.display = "none";
            logoutButton.style.display = "flex";
        } else {
            console.log("No token found");
            statusElement.innerText = "❌ Not logged in.";
            signInButton.style.display = "flex";
            logoutButton.style.display = "none";
        }
    });
}

// Function to handle logout
function handleLogout() {
    chrome.storage.local.remove("token", () => {
        console.log("Token removed successfully");
        updateLoginStatus();
    });
}

// Handle the token from the URL after OAuth redirects
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
console.log("URL token check:", token);

if (token) {
    console.log("Storing new token:", token);
    chrome.storage.local.set({ token }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error storing token:", chrome.runtime.lastError);
        } else {
            console.log("Token stored successfully:", token);
            // Update status immediately after storing token
            updateLoginStatus();
            // Redirect back to the popup window after successful login
            window.location.href = `chrome-extension://${chrome.runtime.id}/popup.html`;
        }
    });
}

// Event Listener for Google Sign-In
document.getElementById("googleSignIn").addEventListener("click", () => {
    console.log("Sign-in button clicked");
    chrome.tabs.create({ url: "http://localhost:3000/auth/google" }, (tab) => {
        console.log("OAuth tab opened successfully:", tab);
    });
});

// Event Listener for Logout
document.getElementById("logoutButton").addEventListener("click", handleLogout);

// Check login status when popup opens
console.log("Popup opened, checking initial status");
document.addEventListener('DOMContentLoaded', updateLoginStatus);

// Listen for token updates from background script
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOKEN_UPDATED') {
        console.log("Received token update notification");
        updateLoginStatus();
    }
});

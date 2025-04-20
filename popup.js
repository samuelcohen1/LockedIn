// Function to update login status
function updateLoginStatus() {
    chrome.storage.local.get("token", (result) => {
        console.log("Checking token status:", result);
        const signInButton = document.getElementById("googleSignIn");
        const logoutButton = document.getElementById("logoutButton");
        const tabProductivity = document.getElementById("tab-productivity");
        const historyButton = document.getElementById("historyButton");

        if (result.token) {
            console.log("Token found:", result.token);
            // statusElement.innerText = "✅ Login successful!";
            signInButton.style.display = "none";
            tabProductivity.style.display = "flex";
            logoutButton.style.display = "flex";
            historyButton.style.display = "flex";
        } else {
            console.log("No token found");
            // statusElement.innerText = "❌ Not logged in.";
            signInButton.style.display = "flex";
            tabProductivity.style.display = "none";
            logoutButton.style.display = "none";
            historyButton.style.display = "none";
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

// Check login status and set up event listeners when popup opens
document.addEventListener('DOMContentLoaded', () => {
    updateLoginStatus();
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", handleLogout);
    }
    const historyButton = document.getElementById("historyButton");
    if (historyButton) {
        historyButton.addEventListener("click", () => {
            chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
        });
    }
});

// Listen for token updates from background script
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOKEN_UPDATED') {
        console.log("Received token update notification");
        updateLoginStatus();
    }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TAB_ANALYZED") {
        const { url, title, classification } = message.data;

        // Normalize the classification value
        const normalizedClassification = classification.trim().toLowerCase();

        // Log the normalized classification for debugging
        console.log("Normalized classification:", normalizedClassification);

        // Update the popup UI with formatted content
        const tabProductivityElement = document.getElementById("tab-productivity");
        tabProductivityElement.innerHTML = `
            <div style="padding: 20px; border: 2px solid ${
                normalizedClassification === "productive"
                    ? "green"
                    : normalizedClassification === "unproductive"
                    ? "red"
                    : "orange"
            }; border-radius: 10px; background-color: ${
                normalizedClassification === "productive"
                    ? "#e6ffe6"
                    : normalizedClassification === "unproductive"
                    ? "#ffe6e6"
                    : "#fff5e6"
            }; text-align: center;">
                <h2 style="margin: 0; font-size: 24px; font-weight: bold;">
                    ${
                        normalizedClassification === "productive"
                            ? "✅ Productive"
                            : normalizedClassification === "unproductive"
                            ? "❌ Unproductive"
                            : "➖ Neutral"
                    }
                </h2>
                <p style="margin: 10px 0; font-size: 18px;"><strong>Title:</strong> ${title}</p>
            </div>
        `;
    }
});
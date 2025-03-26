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

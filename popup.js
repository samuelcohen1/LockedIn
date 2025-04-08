// New Gemini API request logic
document.getElementById("geminiRequest").addEventListener("click", async () => {
    const statusElement = document.getElementById("geminiResponse");
    statusElement.innerText = "Making request to Gemini API...";

    try {
        const response = await fetch("http://localhost:3000/api/gemini", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: "Tell me a fact abou rocks" }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        statusElement.innerText = `Gemini API Response: ${JSON.stringify(result)}`;
    } catch (error) {
        statusElement.innerText = `Error: ${error.message}`;
    }
});








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

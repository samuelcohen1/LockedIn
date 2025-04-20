// Fetch and display tab history URLs
window.addEventListener('DOMContentLoaded', async () => {
    const historyList = document.getElementById('historyList');
    // Get token from chrome.storage.local
    chrome.storage.local.get('token', async (result) => {
        if (!result.token) {
            historyList.innerHTML = '<li style="color:red">Not logged in.</li>';
            return;
        }
        try {
            const response = await fetch('http://localhost:3000/api/history', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + result.token
                }
            });
            const data = await response.json();
            if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
                // Filter out unwanted URLs
                const filtered = data.urls.filter(url => {
                    if (!url) return false;
                    const lower = url.toLowerCase();
                    if (
                        lower.includes('auth/google') ||
                        lower.includes('authentication') ||
                        lower.startsWith('chrome-extension://') ||
                        lower.includes('chrome.google.com/webstore') ||
                        lower.includes('chrome://')
                    ) return false;
                    return true;
                });
                if (filtered.length > 0) {
                    historyList.innerHTML = filtered.map(url =>
                      `<li><span class="icon"></span><a href="${url}" target="_blank">${url}</a></li>`
                    ).join('');
                } else {
                    historyList.innerHTML = '<li>No history found.</li>';
                }
            } else {
                historyList.innerHTML = '<li>No history found.</li>';
            }
        } catch (err) {
            historyList.innerHTML = '<li style="color:red">Failed to load history.</li>';
        }
    });
});

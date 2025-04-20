// Fetch and display tab history URLs
window.addEventListener('DOMContentLoaded', async () => {
    const historyTableBody = document.getElementById('historyTableBody');
    // Get token from chrome.storage.local
    chrome.storage.local.get('token', async (result) => {
        if (!result.token) {
            historyTableBody.innerHTML = '<tr><td colspan="2" style="color:red">Not logged in.</td></tr>';
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
            if (data.history && Array.isArray(data.history) && data.history.length > 0) {
                // Filter out unwanted URLs
                const filtered = data.history.filter(item => {
                    if (!item.url) return false;
                    const lower = item.url.toLowerCase();
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
                    historyTableBody.innerHTML = filtered.map(item => {
                        let displayDomain = '';
                        try {
                            const urlObj = new URL(item.url);
                            displayDomain = urlObj.hostname.replace(/^www\./, '');
                        } catch (e) {
                            displayDomain = item.url;
                        }
                        return `<tr><td><a href="${item.url}" target="_blank">${displayDomain}</a></td><td><span class="prod-label ${item.classification}">${item.classification ? item.classification.charAt(0).toUpperCase() + item.classification.slice(1) : ''}</span></td></tr>`;
                    }).join('');
                } else {
                    historyTableBody.innerHTML = '<tr><td colspan="2">No history found.</td></tr>';
                }
            } else {
                historyTableBody.innerHTML = '<tr><td colspan="2">No history found.</td></tr>';
            }
        } catch (err) {
            historyTableBody.innerHTML = '<tr><td colspan="2" style="color:red">Failed to load history.</td></tr>';
        }
    });
});

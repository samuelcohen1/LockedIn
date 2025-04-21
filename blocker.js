// blocker.js
// Content script to block unproductive websites

(function() {
    // List of unproductive domains (can be extended or made dynamic)
    const unproductiveSites = [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'reddit.com',
        'tiktok.com',
        'youtube.com',
        // Add more as needed
    ];

    // Helper to check if current site is unproductive
    function isUnproductiveSite() {
        return unproductiveSites.some(domain => window.location.hostname.includes(domain));
    }

    function blockSite() {
        // Remove all body content
        document.documentElement.innerHTML = '';
        // Add blocking overlay
        const blockDiv = document.createElement('div');
        blockDiv.style.position = 'fixed';
        blockDiv.style.top = 0;
        blockDiv.style.left = 0;
        blockDiv.style.width = '100vw';
        blockDiv.style.height = '100vh';
        blockDiv.style.background = '#222 url("https://cdn-icons-png.flaticon.com/512/565/565547.png") no-repeat center 30%';
        blockDiv.style.backgroundSize = '120px 120px';
        blockDiv.style.color = '#fff';
        blockDiv.style.display = 'flex';
        blockDiv.style.flexDirection = 'column';
        blockDiv.style.justifyContent = 'center';
        blockDiv.style.alignItems = 'center';
        blockDiv.style.fontSize = '2rem';
        blockDiv.style.zIndex = 999999;
        blockDiv.innerHTML = '<h1>Site Blocked</h1><p>This website is considered unproductive.</p>';
        document.body.appendChild(blockDiv);
    }

    if (isUnproductiveSite()) {
        blockSite();
    }
})();

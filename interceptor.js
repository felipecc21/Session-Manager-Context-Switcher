(function() {
    // Visual Feedback Banner
    const banner = document.createElement('div');
    banner.innerText = '🛰️ SYSTEM: LISTENING FOR SESSION... PLEASE INTERACT WITH THE PAGE.';
    banner.style = 'position:fixed;top:0;left:0;width:100%;background:#333;color:#fff;text-align:center;padding:10px;z-index:9999999;font-weight:bold;font-family:sans-serif;';
    
    if (document.body) document.body.appendChild(banner);
    else window.addEventListener('DOMContentLoaded', () => document.body.appendChild(banner));

    function notify(token) {
        banner.innerText = '✅ TOKEN CAPTURED. CLOSING...';
        banner.style.background = '#28a745';
        window.postMessage({ type: "EXTENSION_TOKEN_CAPTURED", token: token }, "*");
        setTimeout(() => banner.remove(), 2000);
    }

    // 1. XHR Interceptor
    const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        if (header && header.toLowerCase() === 'authorization') {
            const token = value.replace('Bearer ', '').trim();
            if (token.includes('ey')) notify(token);
        }
        return originalSetHeader.apply(this, arguments);
    };

    // 2. Fetch Interceptor
    const { fetch: originalFetch } = window;
    window.fetch = async (...args) => {
        const [resource, config] = args;
        if (config && config.headers) {
            const h = config.headers;
            const token = (h instanceof Headers ? h.get('Authorization') : (h['Authorization'] || h['authorization']));
            if (token && token.includes('ey')) notify(token.replace('Bearer ', '').trim());
        }
        return originalFetch(...args);
    };
})();
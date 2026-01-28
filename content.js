(async function() {
    // [CONFIG] - EDIT HERE
    const CONFIG = {
        apiBaseUrl: 'https://api.yourservice.com',
        endpoints: {
            listA: '/api/v1/context-a',
            listB: '/api/v1/context-b', 
            switchUser: '/api/v1/user/impersonate'
        },
        routes: {
            dashboard: 'dashboard.yourservice.com',
            contextA: 'portal-a.yourservice.com',
            contextB: 'portal-b.yourservice.com'
        },
        storageKeys: ['userEmail', 'authToken', 'tokenDate', 'listA', 'listB', 'showFab', 'capturingMode']
    };

    const currentUrl = window.location.href;
    const data = await chrome.storage.local.get(CONFIG.storageKeys);

    // -------------------------------------------------------------------------
    // ROTA 1: CAPTURA DE SESSÃO (Interceptor)
    // -------------------------------------------------------------------------
    if (currentUrl.includes(CONFIG.routes.dashboard)) {
        const isTokenInvalid = !data.authToken || !isTokenValid(data.tokenDate);
        const isForcedCapture = data.capturingMode === true;

        if (isTokenInvalid || isForcedCapture) {
            injectInterceptor();
            listenForToken();
        }
        return; 
    }

    // -------------------------------------------------------------------------
    // ROTA 2: INJEÇÃO DE UI (OPERAÇÃO)
    // -------------------------------------------------------------------------
    if (!data.userEmail || !data.authToken || !isTokenValid(data.tokenDate)) {
        return; 
    }
    
    let listA = data.listA || [];
    let listB = data.listB || [];
    
    // Download mandatório se listas vazias
    if (listA.length === 0 || listB.length === 0) {
        try {
            console.log("Extension: Syncing data...");
            const apiData = await syncApiData(data.authToken, CONFIG);
            listA = apiData.listA;
            listB = apiData.listB;
        } catch (e) {
            console.error("Extension: Sync error", e);
        }
    }
    
    const showFab = data.showFab !== false; 
    createNavbar(data.userEmail, data.authToken, listA, listB, showFab, CONFIG);
})();

/**
 * =============================================================================
 * MÓDULO DE INTERCEPTAÇÃO
 * =============================================================================
 */
function injectInterceptor() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('interceptor.js');
    script.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
}

function listenForToken() {
    window.addEventListener("message", async (event) => {
        if (event.source != window) return;
        if (event.data.type && (event.data.type === "EXTENSION_TOKEN_CAPTURED")) {
            await saveTokenAndNotify(event.data.token);
        }
    });
}

async function saveTokenAndNotify(token) {
    const tokenDate = new Date().toISOString();
    let email = '';
    try {
        // Decode JWT payload without library
        const payload = JSON.parse(atob(token.split('.')[1]));
        email = payload.email || payload.sub || payload.username || '';
    } catch (e) {}

    const storageData = { 
        authToken: token, 
        tokenDate,
        capturingMode: false 
    };
    
    if (email && email.includes('@')) {
        storageData.userEmail = email;
    }
    await chrome.storage.local.set(storageData);
    
    // Feedback visual poderia ser implementado aqui
    console.log("Token captured.");

    setTimeout(() => {
        chrome.runtime.sendMessage({ action: "close_capture_tab" });
    }, 2000);
}

/**
 * =============================================================================
 * API SERVICE
 * =============================================================================
 */
async function syncApiData(token, config) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Example of parallel fetching
    const [resA, resB] = await Promise.all([
        fetch(config.apiBaseUrl + config.endpoints.listA, { headers }),
        fetch(config.apiBaseUrl + config.endpoints.listB, { headers })
    ]);

    if (!resA.ok || !resB.ok) throw new Error('API Error');

    const jsonA = await resA.json();
    const jsonB = await resB.json();

    // Mapping Data to Generic Structure { id, name, info }
    const listA = jsonA.map(item => ({
        id: item.id,
        name: item.name || "Unknown",
        info: item.document || item.code || ""
    }));

    const listB = jsonB.map(item => ({
        id: item.id,
        name: item.name || "Unknown",
        info: item.document || item.code || ""
    }));

    await chrome.storage.local.set({ listA, listB });
    return { listA, listB };
}

/**
 * =============================================================================
 * UI FACTORY (NAVBAR)
 * =============================================================================
 */
function createNavbar(email, token, listA, listB, showFabEnabled, config) {
    // Remove existing elements to prevent duplicates
    ['ext-navbar', 'ext-fab', 'ext-styles'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    // 1. Navbar Structure
    const navbar = document.createElement('div');
    navbar.id = 'ext-navbar';
    navbar.innerHTML = `
        <div class="ext-logo">DEV TOOL</div>
        <div class="ext-content">
            <div class="ext-inputs">
                <div class="ext-field">
                    <input type="text" id="input-context-a" placeholder="Search Context A (${listA.length})..." autocomplete="off">
                    <div id="suggestions-a" class="ext-suggestions"></div>
                </div>
                <div class="ext-field">
                    <input type="text" id="input-context-b" placeholder="Search Context B (${listB.length})..." autocomplete="off">
                    <div id="suggestions-b" class="ext-suggestions"></div>
                </div>
            </div>
            <button id="btn-submit" class="ext-btn">SWITCH</button>
        </div>
        <button id="btn-close">✕</button>
        <div id="ext-status"></div>
    `;
    
    // 2. FAB Structure
    const fab = document.createElement('button');
    fab.id = 'ext-fab';
    fab.innerText = '⚙️'; 
    fab.style.display = 'none';

    document.body.append(navbar, fab);

    // 3. CSS Injection (Generic Dark Theme)
    const style = document.createElement('style');
    style.id = 'ext-styles';
    style.textContent = `
        #ext-navbar { position: fixed; top: 0; left: 0; width: 100%; height: 50px; background: #222; color: #fff; z-index: 999999; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.5); font-family: sans-serif; }
        .ext-content { display: flex; gap: 10px; align-items: center; flex: 1; justify-content: center; }
        .ext-inputs { display: flex; gap: 10px; }
        .ext-field input { background: #333; border: 1px solid #555; color: #fff; padding: 5px 10px; border-radius: 4px; }
        .ext-btn { background: #007bff; color: white; border: none; padding: 6px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .ext-btn:hover { background: #0056b3; }
        .ext-suggestions { position: absolute; background: #333; width: 200px; max-height: 200px; overflow-y: auto; display: none; border: 1px solid #555; }
        .ext-suggestion-item { padding: 8px; cursor: pointer; border-bottom: 1px solid #444; font-size: 12px; }
        .ext-suggestion-item:hover { background: #444; }
        #ext-fab { position: fixed; bottom: 20px; left: 20px; width: 50px; height: 50px; border-radius: 50%; background: #007bff; border: none; color: white; font-size: 24px; cursor: pointer; z-index: 999999; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        #ext-status { position: fixed; top: 60px; right: 20px; padding: 10px; border-radius: 4px; display: none; color: white; font-weight: bold; z-index: 999999; }
        .ext-success { background: green; } .ext-error { background: red; }
    `;
    document.head.appendChild(style);

    // Logic Binding
    const openNav = () => { navbar.style.top = '0'; fab.style.display = 'none'; };
    const closeNav = () => { navbar.style.top = '-60px'; fab.style.display = showFabEnabled ? 'block' : 'none'; };

    document.getElementById('btn-close').addEventListener('click', closeNav);
    fab.addEventListener('click', openNav);
    
    // Initial State
    if (showFabEnabled) closeNav(); else openNav();

    // Autocomplete Setup
    setupAutocomplete('input-context-a', 'suggestions-a', listA);
    setupAutocomplete('input-context-b', 'suggestions-b', listB);

    document.getElementById('btn-submit').addEventListener('click', () => {
        handleSubmit(email, token, config);
    });
}

async function handleSubmit(email, token, config) {
    const idA = document.getElementById('input-context-a').dataset.id;
    const idB = document.getElementById('input-context-b').dataset.id;
    const statusDiv = document.getElementById('ext-status');
    
    if (!idA && !idB) return;

    try {
        const payload = { username: email, contextA: idA, contextB: idB };
        
        // Generic Fetch
        const response = await fetch(config.apiBaseUrl + config.endpoints.switchUser, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Switch Failed');

        statusDiv.textContent = "Success! Redirecting...";
        statusDiv.className = "ext-success";
        statusDiv.style.display = "block";

        setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
        statusDiv.textContent = "Error: " + error.message;
        statusDiv.className = "ext-error";
        statusDiv.style.display = "block";
        setTimeout(() => statusDiv.style.display = "none", 3000);
    }
}

function setupAutocomplete(inputId, listId, data) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(listId);

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase();
        if (!val) { box.style.display = 'none'; return; }
        
        const matches = data.filter(d => d.name.toLowerCase().includes(val) || d.info.includes(val)).slice(0, 10);
        
        box.innerHTML = matches.map(m => `
            <div class="ext-suggestion-item" data-id="${m.id}" data-name="${m.name}">
                ${m.name} <span style="opacity:0.6">(${m.info})</span>
            </div>
        `).join('');
        box.style.display = matches.length ? 'block' : 'none';

        box.querySelectorAll('.ext-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                input.value = item.dataset.name;
                input.dataset.id = item.dataset.id;
                box.style.display = 'none';
            });
        });
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !box.contains(e.target)) box.style.display = 'none';
    });
}

function isTokenValid(date) {
    if (!date) return false;
    return ((new Date() - new Date(date)) / 36e5) < 24; // 24 hours
}
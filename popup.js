document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get(['userEmail', 'authToken', 'tokenDate']);
    const viewConfig = document.getElementById('view-config');
    const viewActions = document.getElementById('view-actions');

    if (data.authToken) {
        viewConfig.style.display = 'none';
        viewActions.style.display = 'block';
        document.getElementById('user-display').innerText = data.userEmail || 'Unknown User';
    } else {
        viewConfig.style.display = 'block';
        viewActions.style.display = 'none';
    }

    // Save Email
    document.getElementById('btn-save-config').addEventListener('click', () => {
        const email = document.getElementById('input-email').value;
        if(email) {
            chrome.storage.local.set({ userEmail: email });
            window.close();
        }
    });

    // Trigger Capture Logic
    document.getElementById('btn-capture').addEventListener('click', async () => {
        // [CONFIG] Change URL
        await chrome.storage.local.set({ capturingMode: true });
        chrome.tabs.create({ url: 'https://dashboard.yourservice.com' }); 
    });
});
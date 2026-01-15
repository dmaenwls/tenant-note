(function () {
    // 1. Environment Detection
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const isDev = (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        protocol === 'file:' ||
        hostname.includes('dev.')
    );

    // 2. Global Configuration Object
    window.TENANT_NOTE_CONFIG = {
        isDev: isDev,
        dataPath: './data/seoul_hybrid_data.json', // Centralized data path
        apiKeys: {
            kakao: '693e61b56c8dfdcac6b196b6fa46e513' // Moved here for reference if needed
        }
    };

    console.log(`[TenantNote Config] Environment: ${isDev ? 'DEV' : 'PROD'}`);

    // 3. Auto Badge Injection (DEV only)
    if (isDev) {
        document.addEventListener('DOMContentLoaded', () => {
            // Prevent duplicate badges
            if (document.getElementById('dev-mode-badge')) return;

            const badge = document.createElement('div');
            badge.id = 'dev-mode-badge';
            badge.innerText = '[DEV MODE]';
            badge.style.cssText = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                background-color: #ef4444; /* Red-500 */
                color: white;
                padding: 4px 8px;
                font-size: 12px;
                font-weight: bold;
                border-radius: 4px;
                z-index: 99999;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                font-family: sans-serif;
            `;

            badge.onclick = () => {
                alert(`🛠️ Developer Mode Active\n\n- Host: ${hostname || 'Local File'}\n- Data: ${window.TENANT_NOTE_CONFIG.dataPath}`);
            };

            document.body.appendChild(badge);
            console.log("[TenantNote Config] Dev badge injected.");
        });
    }

    // 4. Console Log Suppression for PROD
    if (!isDev) {
        // Optional: Suppress logs in production if desired, but user didn't explicitly ask for it in THIS prompt, 
        // though it was in previous ones. Keeping it safe by NOT suppressing for now unless re-requested, 
        // or just keeping minimal clean logs.
        // console.log = function() {}; 
    }

})();
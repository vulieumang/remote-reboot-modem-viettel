async function fetchIP(elementId) {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        const element = document.getElementById(elementId);
        if (element) element.textContent = data.ip;
        return data.ip;
    } catch (err) {
        console.error('Fetch IP error:', err);
        const element = document.getElementById(elementId);
        if (element) element.textContent = 'Lỗi kết nối';
        return null;
    }
}

// Fetch IP Before on load
fetchIP('ip-before');

document.getElementById('rebootForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('rebootBtn');
    const status = document.getElementById('status');
    const ipAfterContainer = document.getElementById('ip-after-container');
    const ipAfter = document.getElementById('ip-after');

    // UI Updates
    btn.disabled = true;
    btn.textContent = 'Processing...';
    status.className = 'status hidden';
    status.textContent = '';

    const url = document.getElementById('url').value.replace(/\/$/, ''); // Remove trailing slash
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const LOGIN_URL = `${url}/cgi-bin/login.asp`;
    const REBOOT_URL = `${url}/cgi-bin/reboot.asp`;

    const loginData = `Username=${encodeURIComponent(username)}&Password=${encodeURIComponent(password)}`;

    try {
        console.log('Step 1: Logging in...');
        // Chrome Extension handles cookies automatically, but we can't easily set a "dummy" cookie for the modem 
        // without more complex chrome.cookies API usage. We'll proceed and hope the first fetch works or handles session correctly.

        const loginRes = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: loginData
        });

        if (!loginRes.ok) throw new Error(`Login failed with status: ${loginRes.status}`);

        console.log('Step 2: Getting Token...');
        const pageRes = await fetch(REBOOT_URL, { method: 'GET' });

        if (!pageRes.ok) throw new Error(`Failed to load reboot page: ${pageRes.status}`);

        const htmlText = await pageRes.text();

        // Use case-insensitive regex for TokenString
        const tokenMatch = htmlText.match(/name=["']TokenString["']\s+value=["']([^"']+)["']/i)
            || htmlText.match(/value=["']([^"']+)["']\s+name=["']TokenString["']/i);

        if (!tokenMatch) {
            if (htmlText.includes('Login')) throw new Error('Session invalid. Please login manually or check credentials.');
            throw new Error('Could not find reboot token (TokenString).');
        }

        const token = tokenMatch[1];
        console.log('Token found:', token);

        // 3. Send Reboot Command
        console.log('Step 3: Rebooting...');
        const rebootParams = `TokenString=${encodeURIComponent(token)}&testFlag=3&rebootFlag=1`;

        const rebootRes = await fetch(REBOOT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: rebootParams
        });

        // The connection will likely drop immediately, causing an error. 
        // If we get here, it might have failed or the modem is slow.
        status.innerHTML = `✅ Modem đang khởi động lại!<br><br><strong style="color: #e67e22;">⚠️ Lưu ý: Vui lòng đợi 5 phút sau sẽ có internet lại.</strong>`;
        status.className = 'status success';
        ipAfterContainer.classList.remove('hidden');

    } catch (err) {
        console.error('Reboot attempt:', err);
        // In extension context, any network error during REBOOT is likely a success (connection lost)
        if (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
            status.innerHTML = `✅ Modem đang khởi động lại!<br>Kết nối đã bị ngắt theo dự kiến.<br><br><strong style="color: #e67e22;">⚠️ Lưu ý: Vui lòng đợi 5 phút sau sẽ có internet lại.</strong>`;
            status.className = 'status success';
            ipAfterContainer.classList.remove('hidden');

            // Periodically try to fetch new IP
            let attempts = 0;
            const interval = setInterval(async () => {
                attempts++;
                ipAfter.textContent = `Đang đợi... (${attempts})`;
                const newIp = await fetchIP('ip-after');
                if (newIp && newIp !== document.getElementById('ip-before').textContent) {
                    clearInterval(interval);
                }
                if (attempts > 60) clearInterval(interval); // Stop after 10 mins
            }, 10000);
        } else {
            status.textContent = '❌ Lỗi: ' + err.message;
            status.className = 'status error';
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Reboot Modem';
    }
});

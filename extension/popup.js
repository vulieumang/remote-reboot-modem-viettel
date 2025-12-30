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
    status.innerHTML = '';

    const urlValue = document.getElementById('url').value.replace(/\/$/, ''); // Remove trailing slash
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        status.innerHTML = '🔄 Đang mở tab kết nối tới modem...';
        status.className = 'status';
        status.classList.remove('hidden');

        // 1. Open modem tab
        const tab = await chrome.tabs.create({ url: urlValue, active: true });

        // Wait a bit for the tab to start loading
        await new Promise(r => setTimeout(r, 2000));

        status.innerHTML = '🔄 Đang thực hiện reboot từ tab modem...<br><span style="font-size: 0.8em;">(Nếu tab hiện Cảnh báo bảo mật, hãy nhấn Advanced -> Proceed)</span>';

        // 2. Inject and execute logic
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [urlValue, username, password],
            func: async (url, user, pass) => {
                const LOGIN_URL = `${url}/cgi-bin/login.asp`;
                const REBOOT_URL = `${url}/cgi-bin/reboot.asp`;

                // Helper to set cookie in tab context
                document.cookie = "SESSIONID=1234567890abcdef1234567890abcdef; path=/";

                try {
                    // Step 1: Login
                    const loginRes = await fetch(LOGIN_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `Username=${encodeURIComponent(user)}&Password=${encodeURIComponent(pass)}`
                    });

                    // Step 2: Get Token
                    const pageRes = await fetch(REBOOT_URL);
                    const html = await pageRes.text();
                    const tokenMatch = html.match(/name=["']TokenString["']\s+value=["']([^"']+)["']/i)
                        || html.match(/value=["']([^"']+)["']\s+name=["']TokenString["']/i);

                    if (!tokenMatch) return { success: false, error: 'Không tìm thấy Token. Kiểm tra tài khoản/mật khẩu.' };

                    const token = tokenMatch[1];

                    // Step 3: Reboot
                    await fetch(REBOOT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `TokenString=${encodeURIComponent(token)}&testFlag=3&rebootFlag=1`
                    });

                    return { success: true };
                } catch (err) {
                    // If network fails during fetch, it might be the reboot starting
                    return { success: true, likelyRebooting: true };
                }
            }
        });

        const result = results[0].result;

        if (result.success) {
            status.innerHTML = `✅ Modem đang khởi động lại!<br><br><strong style="color: #e67e22;">⚠️ Lưu ý: Vui lòng đợi 5 phút sau sẽ có internet lại.</strong>`;
            status.className = 'status success';
            ipAfterContainer.classList.remove('hidden');

            // Close the helper tab after success
            setTimeout(() => chrome.tabs.remove(tab.id), 3000);

            // Fetch IP After
            let attempts = 0;
            const interval = setInterval(async () => {
                attempts++;
                ipAfter.textContent = `Đang đợi... (${attempts})`;
                const newIp = await fetchIP('ip-after');
                if (newIp && newIp !== document.getElementById('ip-before').textContent) {
                    clearInterval(interval);
                }
                if (attempts > 60) clearInterval(interval);
            }, 10000);
        } else {
            status.innerHTML = `❌ Lỗi: ${result.error}`;
            status.className = 'status error';
        }

    } catch (err) {
        console.error('Injected Reboot Error:', err);
        status.innerHTML = `❌ Lỗi: ${err.message}.<br><span style="font-size: 0.8em;">Đảm bảo bạn đã chấp nhận chứng chỉ bảo mật trong tab modem.</span>`;
        status.className = 'status error';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Reboot Modem';
    }
});

document.getElementById('openModemBtn').addEventListener('click', () => {
    const url = document.getElementById('url').value;
    chrome.tabs.create({ url: url });
});

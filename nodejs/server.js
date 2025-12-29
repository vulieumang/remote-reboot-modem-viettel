import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import open from 'open';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// HTTPS Agent
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
});

// WAN IP Endpoint
app.get('/api/ip', async (req, res) => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
        res.json({ ip: response.data.ip });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Could not fetch WAN IP' });
    }
});

// Reboot Endpoint
app.post('/api/reboot', async (req, res) => {
    const { url, username, password } = req.body;
    const LOGIN_URL = `${url}/cgi-bin/login.asp`;
    const REBOOT_URL = `${url}/cgi-bin/reboot.asp`;
    const LOGIN_DATA = `Username=${encodeURIComponent(username)}&Password=${encodeURIComponent(password)}`;

    const client = axios.create({
        httpsAgent,
        timeout: 10000,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': url
        }
    });

    console.log(`Attempting login to ${url}...`);

    try {
        // 1. Login - Send a dummy SESSIONID cookie as some modems require it to start a session
        const dummyCookie = 'SESSIONID=1234567890abcdef1234567890abcdef';
        const loginRes = await client.post(LOGIN_URL, LOGIN_DATA, {
            headers: { 'Cookie': dummyCookie }
        });
        console.log(`Login Response Status: ${loginRes.status}`);

        const setCookieHeaders = loginRes.headers['set-cookie'];
        if (!setCookieHeaders || !setCookieHeaders.length) {
            console.log('Login failed: No Set-Cookie header found.');
            return res.status(401).json({ success: false, message: 'Login failed: No cookie received. Check your credentials.' });
        }

        // Capture all cookies
        const allCookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
        console.log(`Login successful. Cookies captured: ${allCookies}`);

        // 2. Get Token
        const pageRes = await client.get(REBOOT_URL, {
            headers: { Cookie: allCookies }
        });

        console.log(`Reboot Page Status: ${pageRes.status}`);

        // Use Case-Insensitive regex for TokenString (Modem often uses Uppercase tags)
        const tokenMatch = pageRes.data.match(/name=["']TokenString["']\s+value=["']([^"']+)["']/i)
            || pageRes.data.match(/value=["']([^"']+)["']\s+name=["']TokenString["']/i);

        const token = tokenMatch ? tokenMatch[1] : null;

        if (!token) {
            console.log('TokenString not found in response body.');
            fs.writeFileSync('debug_response.html', pageRes.data);
            console.log('Saved response to debug_response.html');

            if (pageRes.data.includes('Login')) {
                return res.status(500).json({ success: false, message: 'Redirected to login page. Please check your credentials.' });
            }
            return res.status(500).json({ success: false, message: 'Could not find TokenString. Check debug_response.html in the nodejs folder.' });
        }

        // 3. Reboot
        const rebootParams = `TokenString=${token}&testFlag=3&rebootFlag=1`;
        await client.post(REBOOT_URL, rebootParams, {
            headers: { Cookie: allCookies }
        });

        res.json({ success: true, message: 'Reboot command sent successfully!' });

    } catch (error) {
        // If the request timed out, it's often a sign that the modem is actually rebooting
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.log('Reboot triggered (request timed out as expected).');
            return res.json({
                success: true,
                message: 'Modem is rebooting! Connection lost as expected. Please wait ~5 minutes for internet to return.'
            });
        }

        console.error('Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Helper
function getCookieValue(cookieStr, key) {
    if (!cookieStr) return null;
    const cookies = cookieStr.split(';').reduce((acc, current) => {
        const [name, value] = current.split('=').map(c => c.trim());
        if (name && value) acc[name] = value;
        return acc;
    }, {});
    return cookies[key];
}

// Start Server
app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);
    try {
        await open(`http://localhost:${PORT}`);
    } catch (err) {
        console.error('Failed to open browser automatically:', err);
    }
});

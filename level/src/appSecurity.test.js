const request = require('supertest');
const { app } = require('./app');

describe('Security Test', () => {
    it('API endpoints must sanitize user-controllable parameters to prevent injection', async () => {
        const res = await request(app).get("/api/get_user_info?callback=alert('XSS')");
        
        expect(res.text.startsWith("alert('XSS')({")).toBe(false);
    });

    it('The Content Security Policy must be configured to prevent origin-based bypasses', async () => {
        const res = await request(app).get('/profile');
        const csp = res.headers['content-security-policy'];
        const scriptSrc = csp.split(';').find(directive => directive.trim().startsWith('script-src'));
        
        expect(scriptSrc).toBeDefined();
        expect(scriptSrc).not.toContain("'self'");
    });

    it('A hardened Content Security Policy must not break critical page functionality', async () => {
        const res = await request(app).get('/profile');
        const csp = res.headers['content-security-policy'];
        
        // This test only triggers if a nonce is detected in the CSP.
        const cspNonceMatch = csp.match(/script-src 'nonce-([^']+)'/);
        
        if (cspNonceMatch) {
            // It then asserts that the legitimate script on the page has been
            // correctly updated with the same nonce to ensure it can execute.
            const expectedNonce = cspNonceMatch[1];
            expect(res.text).toContain(`<script nonce="${expectedNonce}">`);
        }
    });

});
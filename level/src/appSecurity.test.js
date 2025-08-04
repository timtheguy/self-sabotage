const request = require('supertest');
const { app } = require('./app');

describe('API Input Security', () => {
    it('When the get_user_info endpoint receives a callback containing unsafe characters, it must not execute it', async () => {
        const res = await request(app).get("/api/get_user_info?callback=alert('XSS')");
        
        expect(res.text.startsWith("alert('XSS')({")).toBe(false);
    });

});

describe('Content Security Policy Hardening', () => {
    it('When the profile page is loaded, its CSP should not contain the unsafe "self" keyword in its script-src', async () => {
        const res = await request(app).get('/profile');
        const csp = res.headers['content-security-policy'];
        const scriptSrc = csp.split(';').find(directive => directive.trim().startsWith('script-src'));
        
        expect(scriptSrc).toBeDefined();
        expect(scriptSrc).not.toContain("'self'");
    });

});
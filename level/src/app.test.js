const request = require('supertest');
const { app } = require('./app');

describe('Profile Editor Usability', () => {

    it('When the profile page is requested, it should load successfully with the editor form', async () => {
        const res = await request(app).get('/profile');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('<h1>Profile Editor</h1>');
        expect(res.text).toContain('<form');
    });

    it('When a user updates their profile, the new information should be saved and displayed', async () => {
        const res = await request(app)
            .post('/profile')
            .send('username=NewUser&bio=This is a new bio.');

        // Expect a redirect after a successful POST
        expect(res.statusCode).toEqual(302); 

        // Check if the new data is present on the reloaded page
        const profilePage = await request(app).get('/profile');
        expect(profilePage.text).toContain('value="NewUser"');
        expect(profilePage.text).toContain('This is a new bio.</textarea>');
    });

    it('When the page loads, the username preview area should exist in its initial loading state', async () => {
        const res = await request(app).get('/profile');
        expect(res.text).toContain('<strong id="username-preview"');
        expect(res.text).toContain('⏳ Loading...');
    });
});

describe('API Usability', () => {

    it('When the get_user_info endpoint receives a simple alphanumeric callback, it should return a valid JSONP response', async () => {
        const res = await request(app).get("/api/get_user_info?callback=myFunc");

        expect(res.statusCode).toEqual(200);
        expect(res.headers['content-type']).toMatch(/javascript/);
        expect(res.text.startsWith("myFunc({")).toBe(true);
    });
});
async function isUserAuthenticated(req, res, next) {
    const token = req.cookies['session-cookie'];
    const user = {};

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        user.id = payload.sub;
        user.firstName = payload.given_name;
        user.lastName = payload.family_name;
        user.email = payload.email;
        user.image = payload.picture;
    }

    try {
        await verify();
        req.user = user;
        console.log('user verified again');
        next();
    } catch (err) {
        console.log('user not authenticated');
        res.redirect('login');

    }
}

export default isUserAuthenticated;
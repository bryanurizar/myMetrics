function isUserAuthenticated(req, res, next) {
    return req.session.user || req.session.guest
        ? next()
        : res.redirect('/login');
}

export default isUserAuthenticated;

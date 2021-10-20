function isUserAuthenticated(req, res, next) {
    return req.session.user ? next() : res.redirect('/login');
}

export default isUserAuthenticated;

async function headerAuth(req, res, next) {
    // check for basic auth header
    if (
        !req.headers.authorization ||
        req.headers.authorization.indexOf('Bearer ') === -1
    ) {
        return res
            .status(401)
            .json({ message: 'Missing Authorization Header' });
    }

    // verify auth credentials
    const token = req.headers.authorization.split(' ')[1];

    if (token !== '1234') {
        return res
            .status(401)
            .json({ message: 'Invalid Authentication Credentials' });
    }

    // attach user to request object
    req.token = token;

    next();
}

module.exports = headerAuth;
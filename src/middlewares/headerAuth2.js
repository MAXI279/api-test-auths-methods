async function headerAuth(req, res, next) {
    if (!req.headers.authorization) {
        return res
            .status(401)
            .json({ message: 'Missing Authorization Header' });
    }

    // verify auth credentials
    const token = req.headers.authorization;

    if (token !== 'token token=1234') {
        return res
            .status(401)
            .json({ message: 'Invalid Authentication Credentials' });
    }

    // attach user to request object
    req.token = token;

    next();
}

module.exports = headerAuth;

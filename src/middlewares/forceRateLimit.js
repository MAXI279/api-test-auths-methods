let requestsCount = 0; 

async function forceRateLimit(req, res, next) {
    requestsCount += 1;
    // if request count is multiple of 3, throw rate limit error
    if (requestsCount % 3 == 0) {
        return res
            .status(429)
            .json({ message: 'Rate limit error' });
    }

    next();
}

module.exports = forceRateLimit;
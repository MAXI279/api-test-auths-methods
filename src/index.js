const _ = require('lodash');
const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.json());

async function basicAuth(req, res, next) {
    // check for basic auth header
    if (
        !req.headers.authorization ||
        req.headers.authorization.indexOf('Basic ') === -1
    ) {
        return res
            .status(401)
            .json({ message: 'Missing Authorization Header' });
    }

    // verify auth credentials
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
        'ascii'
    );
    const [username, password] = credentials.split(':');

    if (username !== 'test' || password !== '1234') {
        return res
            .status(401)
            .json({ message: 'Invalid Authentication Credentials' });
    }

    // attach user to request object
    req.user = username;

    next();
}

app.get('/', (req, res, next) => {
    return res.json({
        status: 200,
        message: 'test api online',
    });
});

app.get('/test', basicAuth, (req, res, next) => {
    return res.json({
        next_page: '/test1',
        results: [
            { id: 1, name: 'test', surname: 'test1' },
            { id: 2, name: 'test', surname: 'test2' },
            { id: 3, name: 'test', surname: 'test3' },
            { id: 4, name: 'test', surname: 'test4' },
        ],
    });
});

app.get('/test1', basicAuth, (req, res, next) => {
    return res.json({
        next_page: '/test2',
        results: [
            { id: 5, name: 'test1', surname: 'test1' },
            { id: 6, name: 'test1', surname: 'test2' },
            { id: 7, name: 'test1', surname: 'test3' },
            { id: 8, name: 'test1', surname: 'test4' },
        ],
    });
});

app.get('/test2', basicAuth, (req, res, next) => {
    return res.json({
        next_page: '/test3',
        results: [
            { id: 9, name: 'test2', surname: 'test1' },
            { id: 10, name: 'test2', surname: 'test2' },
        ],
    });
});

app.get('/test3', basicAuth, (req, res, next) => {
    res.setHeader('next_page', '/nextInHeader');
    return res.json({
        results: [
            { id: 11, name: 'test3', surname: 'test1' },
            { id: 12, name: 'test3', surname: 'test2' },
            { id: 13, name: 'test3', surname: 'test3' },
        ],
    });
});

app.get('/nextInHeader', basicAuth, (req, res, next) => {
    return res.json({
        next_page: '',
        results: [
            { id: 11, name: 'test3', surname: 'test1' },
            { id: 12, name: 'test3', surname: 'test2' },
            { id: 13, name: 'test3', surname: 'test3' },
        ],
    });
});

app.post('/postTest', basicAuth, (req, res, next) => {
    const { id } = req.body;
    console.log(id);

    return res.json({
        id,
        results: [
            { id: 17, name: 'idPost', surname: 'idPost1' },
            { id: 18, name: 'idPost', surname: 'idPost2' },
            { id: 19, name: 'idPost', surname: 'idPost3' },
        ],
    });
});

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

app.get('/header/test', headerAuth, (req, res, next) => {
    const PAGE_SIZE = 4;

    const cursor = req.query.cursor || '';
    const page = parseInt(req.query.page || 1);

    // find the index of the cursor in the results
    const cursorIndex = allResults.findIndex(
        (item) => item.id.toString() === cursor
    );

    // get the results for this page using the cursor or page number
    let results;
    if (cursorIndex === -1 && !isNaN(page)) {
        // if the cursor is not found and page is specified, return the PAGE_SIZE results for that page
        const startIndex = (page - 1) * PAGE_SIZE;
        results = allResults.slice(startIndex, startIndex + PAGE_SIZE);
    } else if (cursorIndex !== -1) {
        // if the cursor is found, return the next PAGE_SIZE results after the cursor
        results = allResults.slice(
            cursorIndex + 1,
            cursorIndex + 1 + PAGE_SIZE
        );
    } else {
        // if neither cursor nor page is specified, return the first PAGE_SIZE results
        results = allResults.slice(0, PAGE_SIZE);
    }

    // calculate the next page URL and next cursor
    let nextPage = null;
    let nextCursor = null;
    if (results.length === PAGE_SIZE) {
        if (cursorIndex === -1 && !isNaN(page)) {
            // if it's the first page, set the next page URL to '/header/test' with a page number of 2
            nextPage = `/header/test?page=${page + 1}`;
            nextCursor = allResults[PAGE_SIZE - 1].id.toString();
        } else {
            // if this is not the first page, set the next page URL to '/header/test' with the same cursor or page number
            if (cursorIndex !== -1) {
                const nextIndex = cursorIndex + PAGE_SIZE;
                nextPage =
                    nextIndex < allResults.length
                        ? `/header/test?cursor=${allResults[
                              nextIndex
                          ].id.toString()}`
                        : null;
                nextCursor =
                    nextIndex < allResults.length
                        ? allResults[nextIndex].id.toString()
                        : null;
            } else {
                nextPage = `/header/test?page=${page + 1}`;
                nextCursor = null;
            }
        }
    }

    // build pagination strategies
    const pagination = {};
    if (nextCursor !== null || !isNaN(page)) {
        if (nextCursor !== null) {
            pagination.next_cursor = nextCursor;
        }
        if (!isNaN(page)) {
            pagination.next_page = nextPage;
        }
    } else {
        pagination.next_cursor = null;
        pagination.next_page = null;
    }

    // add cursor=null to last page
    if (pagination.next_page === null) {
        pagination.next_page = null;
        pagination.next_cursor = null;
    }

    return res.json({
        pagination,
        results,
    });
});

app.get('/header/ROOT', headerAuth, (req, res, next) => {
    res.setHeader('next_page', '/header/ROOT1');
    return res.json([
        { id: 1, name: 'test', surname: 'test1' },
        { id: 2, name: 'test', surname: 'test2' },
        { id: 3, name: 'test', surname: 'test3' },
        { id: 4, name: 'test', surname: 'test4' },
    ]);
});

app.get('/header/ROOT1', headerAuth, (req, res, next) => {
    res.setHeader('next_page', '/header/ROOT2');
    return res.json([]);
});

const allResults = [
    { id: 1, name: 'test', surname: 'test1' },
    { id: 2, name: 'test', surname: 'test2' },
    { id: 3, name: 'test', surname: 'test3' },
    { id: 4, name: 'test', surname: 'test4' },
    { id: 5, name: 'test1', surname: 'test1' },
    { id: 6, name: 'test1', surname: 'test2' },
    { id: 7, name: 'test1', surname: 'test3' },
    { id: 8, name: 'test1', surname: 'test4' },
    { id: 9, name: 'test2', surname: 'test1' },
    { id: 10, name: 'test2', surname: 'test2' },
    { id: 11, name: 'test3', surname: 'test1' },
    { id: 12, name: 'test3', surname: 'test2' },
    { id: 13, name: 'test3', surname: 'test3' },
];

app.listen(3080, () => {
    console.log('Example app listening on port 3232!');
});

const _ = require('lodash');
const express = require('express');
const axios = require('axios');

const {
    basicAuth,
    headerAuth,
    forceRateLimit,
    headerAuth2,
} = require('./middlewares');
const app = express();

const PORT = 3080;

app.use(express.json());

app.get('/', (req, res, next) => {
    return res.json({
        status: 200,
        message: 'test api online',
    });
});

app.get('/test', basicAuth, forceRateLimit, (req, res, next) => {
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

app.get('/test1', basicAuth, forceRateLimit, (req, res, next) => {
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

app.get('/test2', basicAuth, forceRateLimit, (req, res, next) => {
    return res.json({
        next_page: '/test3',
        results: [
            { id: 9, name: 'test2', surname: 'test1' },
            { id: 10, name: 'test2', surname: 'test2' },
        ],
    });
});

app.get('/test3', basicAuth, forceRateLimit, (req, res, next) => {
    res.setHeader('next_page', '/nextInHeader');
    return res.json({
        results: [
            { id: 11, name: 'test3', surname: 'test1' },
            { id: 12, name: 'test3', surname: 'test2' },
            { id: 13, name: 'test3', surname: 'test3' },
        ],
    });
});

app.get('/nextInHeader', basicAuth, forceRateLimit, (req, res, next) => {
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

app.get('/header/test', headerAuth, (req, res, next) => {
  const PAGE_SIZE = 4;
  const offsetKey = req.query.offset || req.query.startAt;
  const limitKey = req.query.limit || req.query.maxResults;
  const cursor = req.query.cursor || '';
  const page = parseInt(req.query.page || 1);
  const offset = parseInt(offsetKey || 0);
  const limit = parseInt(limitKey || PAGE_SIZE);
  const host = req.get('host');
  // find the index of the cursor in the results
  const cursorIndex = allResults.findIndex(
    (item) => item.id.toString() === cursor
  );

  // get the results for this page using the cursor or page number or offset and limit
  let results;
  if (offset !== 0 || limit !== PAGE_SIZE) {
    results = allResults.slice(offset, offset + limit);
  } else if (cursorIndex === -1 && !isNaN(page)) {
    const startIndex = (page - 1) * PAGE_SIZE;
    results = allResults.slice(startIndex, startIndex + PAGE_SIZE);
  } else if (cursorIndex !== -1) {
    results = allResults.slice(cursorIndex + 1, cursorIndex + 1 + PAGE_SIZE);
  } else {
    results = allResults.slice(0, PAGE_SIZE);
  }

  // calculate the next page URL and next cursor
  let nextPage = null;
  let nextCursor = null;
  if (results.length === PAGE_SIZE) {
    if (offset !== 0 || limit !== PAGE_SIZE) {
      const nextPageOffset = offset + limit;
      nextPage = `/header/test?offset=${nextPageOffset}&limit=${limit}`;
      nextCursor = null;
    } else if (cursorIndex === -1 && !isNaN(page)) {
      nextPage = `/header/test?page=${page + 1}`;
      nextCursor = allResults[PAGE_SIZE - 1].id.toString();
    } else {
      if (cursorIndex !== -1) {
        const nextIndex = cursorIndex + PAGE_SIZE;
        nextPage =
          nextIndex < allResults.length
            ? `/header/test?cursor=${allResults[nextIndex].id.toString()}`
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

  res.setHeader('link', `<${host}${pagination.next_page}>; rel="next"`);
  return res.json({
    pagination,
    results,
  });
});

app.get('/header2/test', headerAuth2, (req, res, next) => {
  const PAGE_SIZE = 4;

  const cursor = req.query.cursor || '';
  const page = parseInt(req.query.page || 1);
  const offset = parseInt(req.query.offset || 0);
  const limit = parseInt(req.query.limit || PAGE_SIZE);

  // find the index of the cursor in the results
  const cursorIndex = allResults.findIndex(
    (item) => item.id.toString() === cursor
  );

  // get the results for this page using the cursor or page number or offset and limit
  let results;
  if (offset !== 0 || limit !== PAGE_SIZE) {
    results = allResults.slice(offset, offset + limit);
  } else if (cursorIndex === -1 && !isNaN(page)) {
    const startIndex = (page - 1) * PAGE_SIZE;
    results = allResults.slice(startIndex, startIndex + PAGE_SIZE);
  } else if (cursorIndex !== -1) {
    results = allResults.slice(cursorIndex + 1, cursorIndex + 1 + PAGE_SIZE);
  } else {
    results = allResults.slice(0, PAGE_SIZE);
  }

  // calculate the next page URL and next cursor
  let nextPage = null;
  let nextCursor = null;
  if (results.length === PAGE_SIZE) {
    if (offset !== 0 || limit !== PAGE_SIZE) {
      const nextPageOffset = offset + limit;
      nextPage = `/header/test?offset=${nextPageOffset}&limit=${limit}`;
      nextCursor = null;
    } else if (cursorIndex === -1 && !isNaN(page)) {
      nextPage = `/header/test?page=${page + 1}`;
      nextCursor = allResults[PAGE_SIZE - 1].id.toString();
    } else {
      if (cursorIndex !== -1) {
        const nextIndex = cursorIndex + PAGE_SIZE;
        nextPage =
          nextIndex < allResults.length
            ? `/header/test?cursor=${allResults[nextIndex].id.toString()}`
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

app.get('/test/:errorId', (req, res, next) => {
    const { errorId } = req.params;
    const errors = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
        503: 'Service Unavailable',
    };

    if (!errors[errorId]) {
        return res.status(400).json({
            status: 400,
            message: 'Bad Request',
        });
    }
    return res.status(parseInt(errorId)).json({
        status: errorId,
        message: errors[errorId],
    });
});

app.post('/header/test', headerAuth, (req, res, next) => {
    const MAX_RESULTS = 5;
    const { limit, offset, startAt, maxResults, ...filters } = req.body;
    const { page, ...queryParams } = req.query;
    const allFilters = {
        ...filters,
        ...queryParams,
    };

    // Filter data based on filters received from body and query params
    let filteredData = allResults.filter((item) => {
        for (let key in allFilters) {
            if (item[key] !== allFilters[key]) {
                return false;
            }
        }
        return true;
    });

    if (!page && !limit && !maxResults && !offset && !startAt) {
        return res.json(filteredData.slice(0, MAX_RESULTS));
    }
    if (page && !limit && !maxResults && !offset && !startAt) {
        const startIndex = (page - 1) * MAX_RESULTS;
        filteredData = filteredData.slice(startIndex, startIndex + MAX_RESULTS);
        return res.json(filteredData);
    }

    // Apply limit and offset if they're provided
    if (offset || startAt) {
        filteredData = filteredData.slice(offset || startAt);
    }
    if (limit || maxResults) {
        filteredData = filteredData.slice(0, limit || maxResults);
    }

    return res.json(filteredData);
});

const allResults = [
    { id: 1, name: 'test', surname: 'test1' },
    { id: 2, name: 'test', surname: 'test2' },
    { id: 3, name: 'test1', surname: 'test3' },
    { id: 4, name: 'test', surname: 'test4' },
    { id: 5, name: 'test1', surname: 'test1' },
    { id: 6, name: 'test1', surname: 'test2' },
    { id: 7, name: 'test1', surname: 'test3' },
    { id: 8, name: 'test1', surname: 'test4' },
    { id: 9, name: 'test2', surname: 'test1' },
    { id: 10, name: 'test2', surname: 'test2' },
    { id: 11, name: 'test3', surname: 'test1' },
    { id: 12, name: 'test3', surname: 'test2' },
    { id: 13, name: 'test1', surname: 'test3' },
    { id: 14, name: 'test1', surname: 'test3' },
    { id: 15, name: 'test1', surname: 'test3' },
    { id: 16, name: 'test2', surname: 'test3' },
    { id: 17, name: 'test2', surname: 'test3' },
];

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

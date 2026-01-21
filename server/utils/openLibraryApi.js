const axios = require('axios');

const openLibraryApi = axios.create({
    baseURL: 'https://openlibrary.org',
    headers: {
        'User-Agent': 'Elysium/1.0 (https://elysiumbooks.app; elysiumbookshelp@gmail.com)',
        'Accept': 'application/json',
    },
    timeout: 10000
});

module.exports = openLibraryApi;
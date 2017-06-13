import express from 'express';
import config from '../config';
import middleware from '../middleware';
import dbconn from '../db';
import path  from 'path';
import search from '../controller/search';
import list from '../controller/list';
import savetoken from '../controller/savetoken';

let router = express();

// Ensure DB Connection

dbconn(db => {
	router.use(middleware({ config, db }));
	router.use('/search', search({ config, db }));
	router.use('/savetoken', savetoken({ config, db }));
	router.use('/', list({ config, db }));
});

// Serving index page

router.get('/searchview', function(req, res) {
    res.sendFile(path.join(__dirname + '/../public/index.html'));
});


export default router;



// https://github.com/request/request/issues/2047.  - Multiple Issue
import { Router } from 'express';
import path  from 'path';
import cookie from 'cookie-parser';

import GetMessages from './getmessages';

export default({ config, db}) => {
	let api = Router();
	api.get('/', (req, res) => {
		if(req.query.error === 'access_denied') {
			res.json({
				data: 'Kindly provide permission to access your mails'
			});
			return false;
		}

		GetMessages.get(req, res)
		.then(response => {
			// res.render('search');
			res.cookie('currentuser', response[0].email);
			res.redirect('/searchview');
			// res.sendFile(path.join(__dirname + '/../public/index.html'));
		})
		.catch(err => {
			console.log('erRrrrrrrrrrrr.    ', err);
			res.json(err);
		});
	});
	return api;	
};
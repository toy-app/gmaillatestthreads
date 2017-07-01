//list.js

import { Router } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import readline from 'readline';
import google from 'googleapis';
import googleAuth from 'google-auth-library';
import path  from 'path';
import config from '../config';


var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email'];



function getNewToken(oauth2Client, res) {
	var authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});
	res.redirect(authUrl);
}

function authorize(credentials, res) {
	var clientSecret = credentials.installed.client_secret;
	var clientId = credentials.installed.client_id;
	var redirectUrl = config.redirectURL;
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

	getNewToken(oauth2Client, res);

}


function init(res) {
	var secret_file = path.join(__dirname + '/../../client_secret.json');
	fs.readFile(secret_file, function processClientSecrets(err, content) {
		if (err) {
			console.log('Error loading client secret file: ' + err);
			return;
		}
		authorize(JSON.parse(content), res);
	});
}

export default({ config, db}) => {
	let api = Router();
	api.get('/', (req, res) => {
		init(res);
	});
	return api;	
};
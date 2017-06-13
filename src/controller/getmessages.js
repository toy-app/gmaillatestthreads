//getmessages.js
import { Router } from 'express';
import mongoose from 'mongoose';
import Messages from '../models/messages';
import googleAuth from 'google-auth-library';
import fs from 'fs';
import path  from 'path';
import jwt from 'jwt-simple';
import requestbatch from 'request';
import request from 'request-promise';
import moment from 'moment';
import { Base64 } from 'js-base64';
import formURL from 'string-template';
import config from '../config';
import Parser from './../lib/parser';
import multiparty from 'multiparty';
import split from 'split';
import streams from 'stream-stream';

class GetMessages {

	static get(req, res){
		return new Promise((resolve, reject) => {
			this.getAccessToken(req, res)
			.then((content, code, res) => {
				this.authorize(content, code, res)
				.then( (token, res) => {
					this.getThreads(token, res)
					.then( this.getThreadDataBatch )
					.then( this.parseDecodeData )
					.then( this.storeAllThreadTodb )
					.then( respnse => {
						resolve(respnse);
					});
				})
			})
			.catch(err => {
				reject(res.json(err));
			})
		});
	}

	static storeAllThreadTodb(threads) {
		return new Promise((resolve, reject) => {


			let messages = new Messages();

			threads.map(function(thread) {
				console.log('==============',thread);
				Messages.findOneAndUpdate(
				{
					email: thread.email,
					id: thread.id
				},
				thread,
				{ upsert: true
				}
				,function(err){
					if(err){
						console.log(err);
						reject(err);
					}
					resolve(threads);
				});
			});

		});
	}

	static parseDecodeData(threads) {
		return new Promise((resolve, reject) => {
			var parsedthreads = null, parsedData = [], data = {}, debugkey = {};

			try {
				parsedthreads = threads.data.map(function(val, index){
					var data = {};
					data.message = [];
					if(val){
						if(val.messages) {
							for(var message = 0,len = val.messages.length; message < len; message++) {
								var parsedData = parseMessage(val.messages[message]);
								data.id = parsedData.threadId;
								data.message.push(parsedData.textPlain);
							}
						}
					}
					data.email = threads.id;
					return data;
				});
			} catch(eeee){
				console.log(' Thread parse erRrrrrrrrrrrr', eeee);
				resolve(threads);
			}
			resolve(parsedthreads);
		});
	}

	static authorize(credentials, refreshtoken, res) {
		var clientSecret = credentials.installed.client_secret;
		var clientId = credentials.installed.client_id;
		var redirectUrl = config.redirectURL;
		var auth = new googleAuth();
		var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

		return new Promise((resolve, reject) => {
			oauth2Client.getToken(credentials.refreshtoken, function(err, token) {
				if (err) {
					console.log('Error while trying to retrieve access token', err);
					reject(err);
					return;
				}
				oauth2Client.credentials = token;
				let user_data = jwt.decode(token.id_token, {}, true);
				token.email = user_data.email;
				resolve(token, res);
			});
		});
	}

	static getThreads(userdata, res){
		var currentDate =  moment().year() + '/' + (moment().month() + 1) + '/' + moment().date() + 1;
		var prevMonthDate = moment().subtract(1, 'months');
		prevMonthDate =  prevMonthDate.year() + '/' + (prevMonthDate.month() + 1) + '/' + prevMonthDate.date();
		var uri = formURL(config.mailFilterURI, {
			userid: userdata.email,
			prevMonthDate: prevMonthDate,
			currentDate: currentDate
		});

		var options = {
			uri: uri,
			// qs: {
			// 	access_token:  userdata.access_token
			// },
			headers: {
				'Authorization': 'Bearer ' + userdata.access_token
			},
			json: true
		};

		return new Promise((resolve, reject) => {
			request(options).then(function (repos) {
				repos.userId = userdata.email;
				repos.access_token = userdata.access_token;
				resolve(repos);
			}).catch(function (err) {
				console.log('erRrrrrrrrrrrr', err);
				reject(err);
			});
		});
	}


	static getThreadDataBatch(threadIds){
		return new Promise((resolve, reject) => {
			var repos = [];
			var result = new Parser({objectMode: true}), combined = streams(), i = 0;
			i = threadIds.messages.length;
			if(threadIds.messages.length){
				let allThreads = threadIds.messages.map(response => {
					if(response){
						var uri = formURL(config.batchURL, {
							userId: threadIds.userId,
							threadId: response.threadId
						});
						return {
							'Content-Type': 'application/http',
							body: uri
						};
					}
				});

				var options = {
					method: 'POST',
					url: 'https://www.googleapis.com/batch',
					multipart: allThreads,
					headers: {
						'Authorization': 'Bearer ' + threadIds.access_token,
						'content-type': 'multipart/mixed'
					}
				};



				var r = requestbatch(options);

				r.on('response', function (messages) {
					var type = messages.headers['content-type'], form = new multiparty.Form;
					messages.headers['content-type'] = type.replace('multipart/mixed', 'multipart/related');

					form.on('part', function (part) {
						combined.write(part.pipe(split('\r\n')).pipe(new Parser));
					}).parse(messages);
					form.on('close', function () {
						combined.end();
					});
				});

				r.on('error', function (e) {
					console.log(' @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ',  e);
					return reject(e);
				});

				combined.pipe(result)

				result.on('data', function(messages){
					i--;
					repos.push(messages);
					if(i === 0){
						var data = {};
						data.id = threadIds.userId;
						data.data = repos;
						resolve(data);
					}
				});
			} else {
				reject(2);
			}
		});
	}

	static getThreadData(threadIds){
		return new Promise((resolve, reject) => {
			var repos = [];
			if(threadIds.messages.length){
				let allThreads = threadIds.messages.map(response => {
					if(response){
						return new Promise((innerresolve, innerReject) => {
							var uri = formURL(config.fetchThreadURI, {
								userId: threadIds.userId,
								threadId: response.threadId
							});
							var options = {
								uri: uri,
								// qs: {
								// 	access_token:  threadIds.access_token
								// },
								headers: {
									'Authorization': 'Bearer ' + threadIds.access_token
								},
								json: true
							};
							request(options).then(function (messages) {
								return innerresolve(messages);
							}).catch(function (messageserr) {
								console.log(' @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ',  messageserr);
								return innerReject(messageserr);
							});
						});
					}
				});
				Promise.all(allThreads).then((msgs) => {
					var data = {};
					msgs.map(msg => {
						repos.push(msg);
					});
					data.id = threadIds.userId;
					data.data = repos;
					resolve(data);
				});
			} else {
				reject(2);
			}
		});
	}

	static getAccessToken(req, res) {
		var secret_file = path.join(__dirname + '/../../client_secret.json');
		return new Promise((resolve, reject) => {
			fs.readFile(secret_file, function processClientSecrets(err, content) {
				if (err) {
					console.log('Error loading client secret file: ' + err);
					return;
				}
				var fileContent = JSON.parse(content);
				fileContent.refreshtoken = req.query.code;
				resolve(fileContent, req.query.code, res);
			});
		});
	}

}



function urlB64Decode(string) {
	return Base64.decode(string.replace(/\-/g, '+').replace(/\_/g, '/'));
}


function indexHeaders(headers) {
	if (!headers) {
		return {};
	} else {
		return headers.reduce(function (result, header) {
			result[header.name.toLowerCase()] = header.value;
			return result;
		}, {});
	}
}

function parseMessage(response) {
	var result = {
		threadId: response.threadId
	};

	var payload = response.payload;
	if (!payload) {
		return result;
	}

	var headers = indexHeaders(payload.headers);

	var parts = [payload];
	var firstPartProcessed = false;

	while (parts.length !== 0) {
		var part = parts.shift();
		if (part.parts) {
			parts = parts.concat(part.parts);
		}
		if (firstPartProcessed) {
			headers = indexHeaders(part.headers);
		}

		var isHtml = part.mimeType && part.mimeType.indexOf('text/html') !== -1;
		var isPlain = part.mimeType && part.mimeType.indexOf('text/plain') !== -1;
		var isAttachment = headers['content-disposition'] && headers['content-disposition'].indexOf('attachment') !== -1;

		if (isPlain && !isAttachment) {
			result.textPlain = urlB64Decode(part.body.data);
		}

		firstPartProcessed = true;
	}

	return result;
}

export default GetMessages;

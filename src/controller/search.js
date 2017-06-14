//search.js

import { Router } from 'express';
import Messages from '../models/messages';
import cookie from 'cookie-parser';


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

export default({ config, db}) => {
	let api = Router();
	api.get('/', (req, res) => {
		var user = req.cookies.currentuser;

		let searchtext = new RegExp(escapeRegex(req.query.searchtext), 'gi');

		Messages.find({$text: {$search: req.query.searchtext}, email: user})
		.limit(10)
		.exec(function(err, docs) { 
			if(err){
				console.log('hhhhjhkjkhkh', err);
				res.json({
				docs
			});
			}
			// res.json({
			// 	docs
			// });
			res.render('searchlist.pug', {
				docs
			});
		});



		// Messages.find({'data.message': searchtext},
		// 	{ 'data.$': 1 },
		// 	function (err, results) {
		// 		console.log('======= search complete')
		// 		if (results) {
		// 			res.json({
		// 				results
		// 			});
		// 		} else {
		// 			res.json({
		// 				'message': 'No data found'
		// 			});
		// 		}
		// 	});




		// $elemMatch

		// Messages.find({'data': {
		// 	$elemMatch: {
		// 		message: searchtext
		// }}}).forEach(function(message){
		// 	console.log('==============');
		// 	console.log(message);
		// 	console.log('===============');
		// 	res.json({
		// 				'message': 'No data found'
		// 			});
		// });


//aggregate

// 		Messages.aggregate([
//     // Actually match the documents containing the matched value
//     { "$match": {
//         "data.message": searchtext
//     }},

//     // Unwind both of your arrays
//     { "$unwind": "$data" },
//     { "$unwind": "$data.message" },

//     // Now filter only the matching array element
//     { "$match": {
//         "data.message": searchtext
//     }},

//     // Group back one level of data         
//     { "$group": {
//         "_id": {
//             "_id": "$_id",
//             "email": "$email",
//             "id": "$message.id"
//         },
//         "messages": { "$push": "$data.messages" }
//     }},

//     // Group back to the original level
//     { "$group": {
//         "_id": "$_id._id",
//         "email": { "$first": "$_id.email" },
//         "data": {
//             "$push": { 
//                 "id": "$_id.id",
//                 "messages": "$messages"
//             }
//         }
//     }}
// ],function(err,result){
// console.log('==============');
// 			console.log(result);
// 			console.log('===============');
// 			res.json({
// 						result
// 					});
// })




	});
	return api;	
};
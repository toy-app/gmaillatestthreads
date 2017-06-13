import mongoose from 'mongoose';


let Schema = mongoose.Schema;



// let messageSchema = new Schema({
// 	message: { type: [String], index: true },
// 	id: { type: String },
// 	// subject: { type: String },
// 	// sender: String
// });

let messagesSchema = new Schema({
	// data: [messageSchema],
	message: { type: [String], text: true },
	id: { type: String },
	// email: { type: String, unique: true },
	email: String,
	createdAt: { type: Date, default: Date.now() },
	updatedAt: { type: Date, default: Date.now() }
});


module.exports = mongoose.model('messages', messagesSchema );
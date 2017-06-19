export default {
	"PORT": 3006,
	"mongoURL": "mongodb://localhost:27017/gmailthreads",
	"bodyLimit": "500kb",
	"fetchThreadURI":"https://www.googleapis.com/gmail/v1/users/{userId}/threads/{threadId}",
	"mailFilterURI": "https://www.googleapis.com/gmail/v1/users/{userid}/messages?q=\"after:{prevMonthDate} before:{currentDate}\"",
	"redirectURL": "http://localhost:3006/token",
	"batchURL": "GET https://www.googleapis.com/gmail/v1/users/{userId}/threads/{threadId}\n"
}
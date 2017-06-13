import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import config from './config';
import routes from './routes';
import path  from 'path';
import cookie from 'cookie-parser';
let app = express();
app.server = http.createServer(app);

app.use(bodyParser.json({
	limit: config.bodyLimit
}));


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'src/views'));
app.use(cookie())
// app.use(express.static(path.join(__dirname, 'src/public')));
// app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.server.listen(config.PORT);
console.log(`Started on port: ${app.server.address().port}`);

export default app;
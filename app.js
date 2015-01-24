/*** EXTERNAL LIBRARIES ***/
var express = require('express');

var data = require('./modules/data.js');
var config = require('./config.js');

var app = express();

/*** EXPRESS CONFIGURATION ***/
app.use(express.static(__dirname + '/public/'));

/*** WEBSITE PAGES AND STATES ***/
app.get('/', function (req, res) {
	res.redirect('/index.html');
});


/////// ERRORS ///////
// They must go at the end of the file, after the definition of all the routes

//handle 500 errors:
app.use(function(err, req, res, next) {//IMPORTANT: When defining any sort of error middleware you MUST name all four function arguments, otherwise Express.js will not be able to tell this is error middleware, and will attempt to treat this middleware like all other middleware.
	err.statusCode = 500; //internal server errorconsole
	res.status(500); //internal server error
	res.send('500 - Internal server error');
});

//any route didn't match the request, so it's a 404 error:
app.get('*', function(req, res, next) {
	var err = new Error();
	err.status = 404;
	next(err);
});
// handling 404 errors:
app.use(function(err, req, res, next) {
	if(err.status !== 404) {
		return next();
	}
	res.send('404 - Page not found');
});

app.listen(config.port);

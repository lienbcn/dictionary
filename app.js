/*** EXTERNAL LIBRARIES ***/
var express = require('express');
var fs = require('fs');

var wordnik = require('./modules/wordnik.js');
var data = require('./modules/data.js');
var config = require('./config.js');

//Constants:
var WORDNIK_URL = 'http://api.wordnik.com:80/v4';

//Init scripts:
//Fetch first N words of frequency list:
(function(){
	global.aCommonWords = [];
	var numWords = 60000;
	console.log('Loading the first '+numWords+' common words ...');
	var buffer = new Buffer(1024);
	var sFile = '';
	var fd = fs.openSync(config.commonWordsFile, 'r');
	var bytesRead;
	while(true){
		bytesRead = fs.readSync(fd, buffer, 0, 1024, null);
		sFile += buffer.slice(0, bytesRead).toString();
		if(bytesRead < 1024){ //end of file
			break;
		}
		if(sFile.split(/\r\rn|\r|\n/).length >= numWords){
			break;
		}
	}
	var aLines = sFile.split(/\r\rn|\r|\n/);
	aLines.pop(-1); //remove last item because it can be cutted
	aLines.forEach(function(sLine){
		//Each line has a word, followed by a space or tab and then the number of times it appears on a very long text
		var sWord = sLine.match(/^[a-zA-Z]+/)[0];
		global.aCommonWords.push(sWord);
	});
	console.log('The first '+global.aCommonWords.length+' common words have been loaded');
})();



var app = express();

/*** EXPRESS CONFIGURATION ***/
app.use(express.static(__dirname + '/public/'));

/*** WEBSITE PAGES AND STATES ***/
app.get('/', function (req, res) {
	res.redirect('/index.html');
});

app.get('/commonWords.json', function(req, res, next){
	if(!global.aCommonWords){
		return next(new Error('Common words array has not been defined'));
	}
	res.send(JSON.stringify(global.aCommonWords));
});

//Returns arary of 
app.get('/word.json', function(req, res, next){
	if(!req.query.word || req.query.word === ''){
		return res.send(JSON.stringify({error: 'Empty parameter: word'}));
	}
	var sWord = req.query.word.trim().toLowerCase();
	wordnik.definitions(sWord, req.query.partOfSpeech, function(error, response, body){
		if(error) return next(error);
		return res.send(body);
	});

	//Track all the searches that have been done:
	data.get('search_log', function(err, aSearchLog){
		if(err){
			return console.error(err);
		}
		aSearchLog = aSearchLog || [];
		aSearchLog.push({
			word: sWord,
			partOfSpeech: req.query.partOfSpeech,
			frequency: global.aCommonWords.indexOf(sWord), //-1 means not found (very strange word)
			date: new Date().getTime()
		});
		data.set('search_log', aSearchLog, function(err){
			if(err){
				console.error(err);
			}
		});
	});
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
	res.status(404);
	res.send('404 - Page not found');
});

app.listen(config.port);
console.log('App listening at port '+config.port);

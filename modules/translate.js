var jsdom = require('jsdom');
var request = require('request');

var requestGoogleTranslate = function(englishWord, cb){
	request.post(
		'https://translate.google.com/',
		{
			form: {
				sl: 'en',
				tl: 'es',
				js: 'n',
				prev: '_t',
				hl: 'en',
				ie: 'UTF-8',
				text: englishWord,
				'edit-text': ''
			},
			encoding: 'binary' //should return in utf8 because in the html there's the property of charset in UTF-8 but it's not true and some charachters were not visible
		},
		function(err, httpResponse, body){
			if(err) return cb(err);
			if(httpResponse.statusCode !== 200) return cb(new Error('Status code: '+httpResponse.statusCode+' ; body: '+body));
			var sHtmlContent = body.match(/<body( |>).+<\/body>/); //Get the whole <body> tag
			if(!sHtmlContent){
				return cb(new Error('Response is not HTML, or it does not contain the <body> tag: '+body));
			}
			return cb(null, sHtmlContent[0]);
		}
	);
};

var getTransaltionFromHtml = function(sHtml, cb){
	jsdom.env(
		sHtml,
		["http://code.jquery.com/jquery.js"],
		function(errors, window){
			if(errors) return cb(errors);
			var spanishWord = window.jQuery('#result_box').text();
			return cb(null, spanishWord);
		}
	);
};

var translateToSpanish = function(englishWord, cb){
	requestGoogleTranslate(englishWord, function(err, sHtml){
		if(err) return cb(err);
		getTransaltionFromHtml(sHtml, function(err, spanishWord){
			if(err) return cb(err);
			return cb(null, spanishWord);
		});
	});
};

module.exports = {
	translateToSpanish: translateToSpanish
};

var request = require('request');

var nLastAuthentication = null;

var authenticate = function(cb){
	request('http://api.wordnik.com:80/v4/account.json/authenticate/lienbcn?password=Thorium90&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5', cb);
};

var definitions = function(word, partOfSpeech, cb){
	var nNow = new Date().getTime();
	var requestDefinitions = function(cb){
		request(
			{
				url: 'http://api.wordnik.com:80/v4/word.json/'+word+'/definitions',
				qs: {
					api_key: 'a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5',
					limit: '200',
					partOfSpeech: partOfSpeech || '',
					useCanonical: 'true' //convicted -> convict
				}
			},
			cb
		);
	};
	if(!nLastAuthentication || nNow - nLastAuthentication > 1000*3600*24){
		authenticate(function(error){
			if(error) return cb(error);
			requestDefinitions(cb);
		});
	}
	else{
		requestDefinitions(cb);
	}
};

module.exports = {
	authenticate: authenticate,
	definitions: definitions
};

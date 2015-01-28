var fs = require('fs');
var config = require('../config.js');

//Keep a copy of the file in memory and update it when writing to it:
var oCache;
//Update cache from the data file. Use sync to make sure it finishes before trying to access to the data:
(function(){
	var exists = fs.existsSync(config.dataFile);
	if(!exists){ //create a new file with an empty object:
		fs.writeFileSync(config.dataFile, '{}', {encoding: 'utf8'});
	}
	var jsonData = fs.readFileSync(config.dataFile, {encoding: 'utf8'});
	oCache = JSON.parse(jsonData); //will throw exception if it's not a valid json
})();

var get = function(key, cb){
	var value = oCache[key];
	process.nextTick(function(){
		cb(null, value);
	});
};

var set = function(key, value, cb){
	oCache[key] = value;
	fs.writeFile(config.dataFile, JSON.stringify(oCache), {encoding: 'utf8'}, cb);
};

module.exports = {
	get: get,
	set: set
};

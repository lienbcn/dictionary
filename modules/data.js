var fs = require('fs');
var moment = require('moment');

var config = require('../config.js');


//Keep a copy of the file in memory and update it when writing to it:
var oCache = {};

//Create the data folder if it doesn't exist:
if(!fs.existsSync(config.dataDir)){
	fs.mkdirSync(config.dataDir);
}
//Update cache from the data file. Use sync to make sure it finishes before trying to access to the data:
if(fs.existsSync(config.dataFile)){ //create a new file with an empty object:
	var jsonData = fs.readFileSync(config.dataFile, {encoding: 'utf8'});
	oCache = JSON.parse(jsonData); //will throw exception if it's not a valid json
}

var get = function(key, cb){
	var value = oCache[key];
	process.nextTick(function(){
		cb(null, value);
	});
};

//Create a backup file, once per day:
var getLastBackupFile = function(cb){
	//Get the list of files in the data folder:
	fs.readdir(config.dataDir, function(err, files){
		if(err) return cb(err);
		//Select only the backup files:
		var backupFiles = files.filter(function(file){
			var pattern = /\.backup\.json$/;
			return pattern.test(file);
		});
		if(!backupFiles.length){
			return cb(null, null); //no backup files
		}
		//Find the last backup file:
		var lastFile = backupFiles.sort().slice(-1)[0];
		return cb(null, lastFile);
	});
};
var backup = function(cb){
	getLastBackupFile(function(err, lastFile){
		if(err) return cb(err);
		var writeBackup = true;
		var now = moment();
		if(lastFile){
			//Get the date of the file name:
			var joinedDate = lastFile.slice(0, 8); //20150202
			var joinedToday = now.format('YYYYMMDD');
			writeBackup = joinedToday !== joinedDate; //if it already exists a backup file from today then don't write another one
		}
		if(writeBackup){
			return fs.writeFile(config.dataDir+now.format('YYYYMMDD-HHmmss')+'.backup.json', JSON.stringify(oCache), {encoding: 'utf8'}, cb);
		}
		return cb(null, false);
	});
};

var set = function(key, value, cb){
	oCache[key] = value;
	//Write the backup file if it's a new day:
	backup(function(err){
		if(err) return cb(err);
		return fs.writeFile(config.dataFile, JSON.stringify(oCache), {encoding: 'utf8'}, cb);
	});
};

module.exports = {
	get: get,
	set: set
};

var ss = require('string-similarity');
var fs = require('fs');
var db = JSON.parse(fs.readFileSync('dotadb.json', 'utf8'));

for (var entry in db) {
	db[entry] = cleanMsg(db[entry]);
}

function cleanMsg(str) {
	return str.toLowerCase().trim().replace("'", "");
}

function findBestSound(soundName) {
	var maxScore = 0.0;
	var bestSound = null;
	var bestDesc = null;
	
	for (var entry in db) {
		var score =  ss.compareTwoStrings(soundName, db[entry]);
		if (score > maxScore) {
			maxScore = score;
			bestSound = entry;
			bestDesc = db[entry];
		}
	}
	return { path: bestSound, description: bestDesc };
}

module.exports = {
	addVoiceLine: function(command, soundQueue) {
		command = command.trim();
		var splitIndex = command.indexOf(" ");
		if (splitIndex === -1)
			return;
		var soundName = command.substring(splitIndex, command.length - 1).trim();
		soundName = cleanMsg(soundName);
		var bestSound = findBestSound(soundName);
		if (bestSound.path)
			soundQueue.push(bestSound);
	}
};
var ss = require('string-similarity');
var fs = require('fs');
var db = JSON.parse(fs.readFileSync('dotadb.json', 'utf8'));

for (var entry in db) {
	db[entry] = cleanMsg(db[entry]);
}

function cleanMsg(str) {
	return str.toLowerCase().trim().replace("'", "");
}

module.exports = {
	getVoicePath: function(command) {
		var maxScore = 0.0;
		var bestPath = null;
		command = command.trim();
		var splitIndex = command.indexOf(" ");
		if (splitIndex === -1)
			return null;
		var soundName = command.substring(splitIndex, command.length - 1).trim();
		soundName = cleanMsg(soundName);
		for (var entry in db) {
			var score =  ss.compareTwoStrings(soundName, db[entry]);
			if (score > maxScore) {
				maxScore = score;
				bestPath = entry;
			}
		}
		console.log("Playing " + bestPath + " with score " + maxScore + " and desc " + db[bestPath]);
		return bestPath;
	}
};
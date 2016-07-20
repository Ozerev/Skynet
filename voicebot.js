var ss = require('string-similarity');
var fs = require('fs');
var db = JSON.parse(fs.readFileSync('dotadb.json', 'utf8'));

for (var entry in db) {
	var pathContents = entry.split("\\");
	var heroName = "";
	if (pathContents.length >= 3) {
		heroName = pathContents[2] + " ";
	}
	db[entry] = cleanMsg(heroName + db[entry]);
}

function removeAll(string, removed, replace) {
	return string.split(removed).join(replace);
}

function cleanMsg(str) {
	str = str.toLowerCase().trim();
	str = removeAll(str, ",", "");
	str = removeAll(str, "'", "");
	str = removeAll(str, ".", "");
	str = removeAll(str, "!", "");
	str = removeAll(str, "?", "");
	str = removeAll(str, "_", " ");
	str = removeAll(str, ":", "");
	return str;
}

function findBestSound(soundName) {
	console.log(soundName);
	var searchWords = soundName.split(" ");
	
	var bestMatchScore = 0;
	var matches = [];
	for (var entry in db) {
		var dbTag = db[entry];
		var dbWords = dbTag.split(" ");
		var statusArray = [];
		for (var i = 0; i < dbWords.length; i++)
			statusArray.push(false);
		
		var score = 0;
		for (var i = 0; i < searchWords.length; i++) {
			var testWord = searchWords[i];
			for (var j = 0; j < dbWords.length; j++) {
				if (statusArray[j])
					continue;
				if (testWord === dbWords[j]) {
					statusArray[j] = true;
					score++;
					break;
				}
			}
		}
		
		if (score > bestMatchScore) {
			bestMatchScore = score;
			matches = [ entry ];
		} else if (score === bestMatchScore) {
			console.log
			matches.push(entry);
		}
	}
	if (matches.length === 0)
		return { path: null, description: null };
	
	var index = Math.floor(Math.random() * matches.length);
	console.log(matches.length + " " + db[matches[index]]);
	return { path: matches[index], description: db[matches[index]] };
}

module.exports = {
	addVoiceLine: function(command, soundQueue) {
		command = command.trim();
		var splitIndex = command.indexOf(" ");
		if (splitIndex === -1)
			return;
		var soundName = command.substring(splitIndex, command.length).trim();
		soundName = cleanMsg(soundName);
		var bestSound = findBestSound(soundName);
		if (bestSound.path)
			soundQueue.push(bestSound);
	}
};
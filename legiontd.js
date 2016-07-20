var http = require('request');

module.exports = {
	printLegionGames: function(chatMsg) {
		http("https://entgaming.net/forum/games_fast.php", function(error, response, body) {
			var strings = parseLegionData(body);
			var msg = "\n" + strings.join("\n");
			chatMsg.reply(msg);
		});
	}
};

function parseLegionData(data) {
	var lines = data.split("\n");
	var global = '';
	var euro = '';
	for (var i = 0; i < lines.length; i++) {
		var curLine = lines[i];
		if (curLine.indexOf("Legion TD Mega #") !== -1) {
			var contents = curLine.split("|");
			var nplayers = parseInt(contents[2]);
			var maxPlayers = parseInt(contents[3]);
			global = contents[5] + "\t(" + nplayers + "/" + maxPlayers + ")";
		} else if (curLine.indexOf("Legion TD Mega euro #") !== -1) {
			var contents = curLine.split("|");
			var nplayers = parseInt(contents[2]);
			var maxPlayers = parseInt(contents[3]);
			euro = contents[5] + "\t(" + nplayers + "/" + maxPlayers + ")";
		}
	}
	return [global, euro];
}
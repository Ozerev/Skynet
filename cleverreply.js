var Cleverbot = require('cleverbot-node');
var clbot = new Cleverbot;

module.exports = {
	reply: function(chatMsg) {
		var space = chatMsg.text.indexOf(" ");
		if (space !== -1) {
			var cleverMsg = chatMsg.text.substring(space, chatMsg.text.length).trim();
			Cleverbot.prepare(function() {
				clbot.write(cleverMsg, (response) => {
					console.log("Responding " + response.message + " to " + cleverMsg);
					chatMsg.reply(response.message);
				});
			});
		}
	}
};
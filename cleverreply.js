var Cleverbot = require('cleverbot-node');
var clbot = new Cleverbot;

module.exports = {
	reply: function(chatMsg) {
		var cleverMsg = chatMsg.text;
		Cleverbot.prepare(function() {
			clbot.write(cleverMsg, (response) => {
				console.log("Responding " + response.message + " to " + cleverMsg);
				chatMsg.reply(response.message);
			});
		});
	}
};
module.exports = {
	printRoll: function(chatMsg) {
		var min = 1;
		var max = 100;
		var contents = chatMsg.text.split(" ");
		if (contents.length === 2) {
			var range = contents[1].split("-");
			if (range.length == 1) {
				max = Math.max(min, parseInt(range[0]));
			} else if (range.length == 2) {
				min = parseInt(range[0]);
				max = Math.max(min, parseInt(range[1]));
			}
		}
		if (isNaN(min) || isNaN(max)) {
			max = 100;
			min = 1;
		}
		var rollValue = min + Math.round((max - min) * Math.random());
		chatMsg.reply(chatMsg.authorName + " rolled " + rollValue +  " (" + min + "-" + max + ")");
	}
};
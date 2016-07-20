var ytdl = require('ytdl-core');
var fs = require('fs');
var db = JSON.parse(fs.readFileSync('yt.json', 'utf8'));
var progress = {};

function createSound(chatMsg, contents) {
	var tag = contents[2];
	var url = contents[3];
	if (tag in db || tag in progress) {
		chatMsg.reply(tag + " already exists");
		return;
	}
	progress[tag] = true;
	console.log("Creating " + tag + " " + url);
	var stream = ytdl(url, { filter: "audioonly" });
	stream.on("error", (err) => {
		console.log(err + " " + url);
		chatMsg.reply("Failed creating " + tag + " - " + err);
	})
	var path = "D:\\YTSounds\\" + tag + ".mp3";
	var write = stream.pipe(fs.createWriteStream("D:\\YTSounds\\" + tag + ".mp3"));
	write.on("finish", () => {
		console.log("Completed " + url);
		delete progress[tag];
		db[tag] = path;
		fs.writeFile("yt.json", JSON.stringify(db));
		chatMsg.reply("Created " + tag + " successfully");
	});
}

function deleteSound(chatMsg, contents) {
	var tag = contents[2];
	if (tag in db) {
		delete db[tag];
		chatMsg.reply("Deleted " + tag + " successfully");
	}
}

function listSounds(chatMsg) {
	var str = "";
	for (var entry in db) {
		str += entry + "\n";
	}
	chatMsg.reply(str);
}

module.exports = {
	handleCommand: function(chatMsg, soundQueue) {
		var contents = chatMsg.text.split(" ");
		if (contents.length === 4) {
			if (contents[1] === "create") {
				createSound(chatMsg, contents);
			}
		} else if (contents.length === 3) {
			if (contents[1] === "delete" && chatMsg.authorName === "Evozer") {
				deleteSound(chatMsg, contents);
			}
		} else if(contents.length === 2) {
			var tag = contents[1];
			if (tag === "list") {
				listSounds(chatMsg);
			} else {
				if (tag in db) {
					soundQueue.push(db[tag]);
				}
			}
		}
	}
};


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
	ytdl.getInfo(url, (err,info) => {
		if (err) {
			chatMsg.reply("Failed creating " + tag + " - " + err);
			delete progress[tag];
			return;
		}
		var max_length = 5 * 60;
		if (!info.length_seconds || info.length_seconds > max_length) {
			chatMsg.reply("Failed creating " + tag + ", the video is too long");
			delete progress[tag];
			return;
		}
		var stream = ytdl(url, { filter: "audioonly" });
		stream.on("error", (err) => {
			console.log(err + " " + url);
			chatMsg.reply("Failed creating " + tag + " - " + err);
			delete progress[tag];
			return;
		});
		var path = "D:\\YTSounds\\" + tag + ".mp3";
		var write = stream.pipe(fs.createWriteStream("D:\\YTSounds\\" + tag + ".mp3"));
		write.on("finish", () => {
			console.log("Completed " + url);
			delete progress[tag];
			db[tag] = path;
			fs.writeFile("yt.json", JSON.stringify(db));
			chatMsg.reply("Created " + tag + " successfully");
		});
	});
}

function deleteSound(chatMsg, contents) {
	var tag = contents[2];
	if (tag in db) {
		delete db[tag];
		fs.writeFile("yt.json", JSON.stringify(db));
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
			} else if (tag === "random") {
				var keys = [];
				for (var k in db)
					keys.push(k);
				var index = Math.floor(Math.random() * keys.length);
				soundQueue.push({ path: db[keys[index]], description: keys[index] });
			} else {
				if (tag in db) {
					soundQueue.push({ path: db[tag], description: tag });
				}
			}
		}
	}
};


var ytdl = require('ytdl-core');
var fs = require('fs');
var db = JSON.parse(fs.readFileSync('yt.json', 'utf8'));
var progress = {};

function createSound(contents, writeFn, channel) {
	var tag = contents[2];
	var url = contents[3];
	if (tag in db || tag in progress) {
		writeFn(channel, tag + " already exists");
		return;
	}
	progress[tag] = true;
	console.log("Creating " + tag + " " + url);
	var stream = ytdl(url, { filter: "audioonly" });
	stream.on("error", (err) => {
		console.log(err + " " + url);
		writeFn(channel, "Failed creating " + tag + " - " + err);
	})
	var path = "D:\\YTSounds\\" + tag + ".mp3";
	var write = stream.pipe(fs.createWriteStream("D:\\YTSounds\\" + tag + ".mp3"));
	write.on("finish", () => {
		console.log("Completed " + url);
		delete progress[tag];
		db[tag] = path;
		fs.writeFile("yt.json", JSON.stringify(db));
		writeFn(channel, "Created " + tag + " successfully");
	});
}

function deleteSound(contents, writeFn, channel) {
	var tag = contents[2];
	if (tag in db) {
		delete db[tag];
		writeFn(channel, "Deleted " + tag + " successfully");
	}
}

function listSounds(writeFn, channel) {
	var str = "";
	for (var entry in db) {
		str += entry + "\n";
	}
	writeFn(channel, str);
}

module.exports = {
	handleCommand: function(command, writeFn, channel) {
		var contents = command.split(" ");
		if (contents.length === 4) {
			if (contents[1] === "create") {
				createSound(contents, writeFn, channel);
			}
		} else if (contents.length === 3) {
			if (contents[1] === "delete" && channel.author.username === "Evozer") {
				deleteSound(contents, writeFn, channel);
			}
		} else if(contents.length === 2) {
			var tag = contents[1];
			if (tag === "list") {
				listSounds(writeFn, channel);
			} else {
				if (tag in db) {
					return db[tag];
				}
			}
		}
	}
};


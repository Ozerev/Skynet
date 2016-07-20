var http = require('request');
var ch = require('cheerio');
var fs = require('graceful-fs');
var sleep = require('sleep');
var urls = [];
var descriptions = {};
var files = 0;

http("http://dota2.gamepedia.com/Abaddon/Responses", function(error, response, body) {
	var lines = body.split("\n");
	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if (line.indexOf("/Responses") !== -1 && line.startsWith("<li> <a") && line.endsWith("</li>")) {
			var ln = ch.load(line);
			var url = ln('a').attr('href');
			urls.push("http://dota2.gamepedia.com" + url);
		}
	}
	parseSounds();
});

function parseSounds() {
	var i = 0;
	var parseFn = function() {
		if (i == urls.length) {
			fs.writeFile("dotadb.json", JSON.stringify(descriptions));
			return;
		}
		if (files < 50) {
			parsePage(urls[i]);
			i++;
		} else {
			console.log(files);
		}
		setTimeout(parseFn, 1000);
	};
	parseFn();
}

function parsePage(url) {
	http(url, function(error, response, body) {
		if (!body) {
			return;
		}
		var lines = body.split("\n");
		var urlContents = url.split("/");
		var heroName = urlContents[urlContents.length - 2];
		console.log(heroName);
		var dir = "D:/DotaSounds/" + heroName;
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		for(var i = 0; i < lines.length; i++) {
			var line = lines[i];
			if (line.indexOf("hydra-media.cursecdn.com/dota2") !== -1 && (line.endsWith("</li>") || line.endsWith("</li></ul>"))) {
				var ln = ch.load(line);
				var soundUrl = ln('a').attr('href');
				if (soundUrl.startsWith("https://hydra-media.cursecdn.com")) {
					var endIndex = line.lastIndexOf("> ");
					var txt = line.substring(endIndex + 2, line.length - 1);
					endIndex = txt.indexOf("<");
					txt = txt.substring(0, endIndex);
					
					var soundUrlContents = soundUrl.split("/");
					var soundName = soundUrlContents[soundUrlContents.length - 1];
					
					var path = "D:\\DotaSounds\\" + heroName + "\\" + soundName;
					descriptions[path] = txt;
					//downloadFile(path, soundUrl);
				}
			}
		}
		//fs.writeFile("dotadb.json", JSON.stringify(descriptions));
	});
}

function downloadFile(path, url) {
	files++;
	var writeFn = function() {
		var req = http(url);
		var stream = req.pipe(fs.createWriteStream(path));
		var success = true;
		req.on('error', err => {
			success = false;
			console.log(err + " " + path);
			stream.end();
			setTimeout(writeFn, 500);
		});
		stream.on('finish', () => {
			if (success) {
				console.log("Finished writing " + path);
				files--;
			}
		});
	};
	writeFn();
}
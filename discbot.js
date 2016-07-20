var Discord = require("discord.js");
var readLine = require('readline');
var legion = require('./legiontd');
var markov = require('./markovbot');
var trivia = require('./triviabot');
var sounds = require('./voicebot');
var yt = require('./ytbot');
var Cleverbot = require('cleverbot-node');
var creds = require('./credentials');
var clbot = new Cleverbot;

var rl = readLine.createInterface({
	input: process.stdin,
	output: process.stdout
});

var bot = new Discord.Client();
var soundQueue = [];

function joinVoice(msg) {
	if (!msg.server)
		return;
	if (bot.voiceConnection) {
		bot.voiceConnection.destroy();
	}
	var contents = msg.content.split(" ");
	console.log(contents.length);
	if (contents.length >= 2) {
		var chname = contents[1].toLowerCase();
		console.log(chname + " " + bot.channels.length);
		for (var i = 0; i < bot.channels.length; i++) {
			console.log(bot.channels[i].type + " " + bot.channels[i].name + " " + chname);
			if (bot.channels[i].type !== "voice")
				continue;
			if (bot.channels[i].server.id !== msg.server.id)
				continue;
			if (bot.channels[i].name.toLowerCase() === chname) {
				bot.joinVoiceChannel(bot.channels[i]);
				return;
			}
		}
	}
}

setInterval(checkVoice, 250);
function checkVoice() {
	if (!bot.voiceConnection)
		return;
	if (bot.voiceConnection.playing)
		return;
	if (soundQueue.length === 0)
		return;
	var nextSound = soundQueue.shift();
	var options = {};
	options.volume = 0.25;
	var intent = bot.voiceConnection.playFile(nextSound, options, (err,intent) => {
		if (err)
			console.log(err + " " + nextSound);
		intent.on("error", e => {
			console.log("Error: " + e);
		});
	});
}

function reply(str) {
	bot.sendMessage(this, str);
}

bot.on("ready", () => {
	console.log(`Ready to begin! Serving in ${bot.channels.length} channels`);
	
	for (var i = 0; i < bot.channels.length; i++) {
		console.log("Channel " + bot.channels[i].name);
	}
});

bot.on("disconnected", () => {
	console.log("Disconnected!");
	process.exit(1);
});

function createWriteFn(channel) {
	return function(str) {
		bot.sendMessage(channel, str);
	};
}

function writeMessage(channel, text) {
	bot.sendMessage(channel, text);
}

function createChatMessage(msg) {
	return  {
		text: msg.content,
		authorName: msg.author.username,
		channelId: msg.channel.id,
		
		reply: createWriteFn(msg)
	};
}

bot.on("message", msg => {
	var chatMsg = createChatMessage(msg);
	trivia.checkAnswer(chatMsg);
	
	if (msg.content.toLowerCase().startsWith("!trivia")) {
		trivia.handleCommand(chatMsg);
	}

	if (msg.content.toLowerCase() === "dick") {
		msg.reply("båt");
	}
	
	if (msg.content === "!fredag") {
		bot.sendMessage(msg, "https://www.youtube.com/watch?v=kfVsfOSbJY0");
	}
	
	if (msg.content === "!cancel" && bot.voiceConnection && bot.voiceConnection.playing) {
		bot.voiceConnection.stopPlaying();
	}
	
	if (msg.content === "!clear" && bot.voiceConnection && bot.voiceConnection.playing) {
		soundQueue = [];
		bot.voiceConnection.stopPlaying();
	}
	
	if (msg.content.toLowerCase().startsWith("!yt")) {
		var str = yt.handleCommand(msg.content, writeMessage, msg);
		if (str) {
			soundQueue.push(str);
		}
	}
	
	if (msg.content.toLowerCase().startsWith("!voice")) {
		joinVoice(msg);
	}
	
	if (msg.content.toLowerCase().startsWith("!dota") && bot.voiceConnection) {
		var soundUrl = sounds.getVoicePath(msg.content);
		if (soundUrl) {
			soundQueue.push(soundUrl);
		}
	}
	
	if (msg.content.startsWith("!roll")) {
		var min = 1;
		var max = 100;
		var contents = msg.content.split(" ");
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
		bot.sendMessage(msg, msg.author.username + " rolled " + rollValue +  " (" + min + "-" + max + ")");
	}
	
	if (msg.content.toLowerCase() === "!ltd") {
		legion.getLegionGames((global, euro) => {
			bot.sendMessage(msg, "\n" + global + "\n" + euro);
		});
	}
	
	if (msg.content.toLowerCase() == "!spam") {
		var possible = "bcdfghjklmnpqrstvwxz";
		var length = 5 + Math.round(100 * Math.random());
		var text = "";
		for (var i = 0; i < length; i++) {
			text += possible.charAt(Math.round(Math.random() * possible.length));
		}
		text += "i";
		bot.sendTTSMessage(msg, text);
	}
	
	if (msg.content.toLowerCase().startsWith("!harry")) {
		bot.sendTTSMessage(msg, markov.handleCommand(msg.content));
	}
	
	if (msg.isMentioned(bot.user)) {
		var space = msg.content.indexOf(" ");
		if (space !== -1) {
			var cleverMsg = msg.content.substring(space, msg.content.length).trim();
			Cleverbot.prepare(function() {
				clbot.write(cleverMsg, (response) => {
					console.log("Responding " + response.message + " to " + cleverMsg);
					bot.sendMessage(msg, response.message);
				});
			});
		}
	}
});

bot.on("serverCreated", serv => {
	console.log("Joined server " + serv.name);
});

bot.on("channelCreated", ch => {
	console.log("Joined channel " + ch.id);
});


rl.on('line', (input) => {
	if (input.startsWith("accept")) {
		var split = input.split(" ");
		if (split.length === 2) {
			bot.joinServer(split[1]);
		} else {
			console.log("Invalid accept format");
		}
	}
	if (input.toLowerCase() === "quit") {
		trivia.forceQuit();
		bot.destroy();
		rl.close();
	}
});

bot.login(creds.getUserName(), creds.getPassword());
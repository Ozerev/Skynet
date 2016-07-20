var Discord = require("discord.js");
var readLine = require('readline');
var legion = require('./legiontd');
var markov = require('./markovbot');
var trivia = require('./triviabot');
var sounds = require('./voicebot');
var yt = require('./ytbot');
var creds = require('./credentials');
var roll = require('./roll');
var cleverbot = require('./cleverreply');

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
	if (contents.length >= 2) {
		var chname = contents[1].toLowerCase();
		for (var i = 0; i < bot.channels.length; i++) {
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

function createWriteFn(channel, tts) {
	return function(str) {
		if (tts)
			bot.sendTTSMessage(channel, str);
		else
			bot.sendMessage(channel, str);
	};
}

function createChatMessage(msg) {
	return  {
		text: msg.content,
		authorName: msg.author.username,
		channelId: msg.channel.id,
		
		reply: createWriteFn(msg),
		replyTTS: createWriteFn(msg, true)
	};
}

bot.on("message", msg => {
	var chatMsg = createChatMessage(msg);
	trivia.checkAnswer(chatMsg);
	
	if (chatMsg.text.startsWith("!trivia")) {
		trivia.handleCommand(chatMsg);
	}

	if (chatMsg.text === "dick") {
		chatMsg.reply("båt");
	}
	
	if (chatMsg.text === "!fredag") {
		chatMsg.reply("https://www.youtube.com/watch?v=kfVsfOSbJY0");
	}
	
	if (chatMsg.text === "!github") {
		chatMsg.reply("https://github.com/Ozerev/Skynet");
	}
	
	if (chatMsg.text === "!cancel" && bot.voiceConnection && bot.voiceConnection.playing) {
		bot.voiceConnection.stopPlaying();
	}
	
	if (chatMsg.text === "!clear" && bot.voiceConnection && bot.voiceConnection.playing) {
		soundQueue = [];
		bot.voiceConnection.stopPlaying();
	}
	
	if (chatMsg.text.startsWith("!yt")) {
		yt.handleCommand(chatMsg, soundQueue);
	}
	
	if (chatMsg.text.startsWith("!voice")) {
		joinVoice(msg);
	}
	
	if (chatMsg.text.startsWith("!dota") && bot.voiceConnection) {
		sounds.addVoiceLine(chatMsg.text, soundQueue);
	}
	
	if (chatMsg.text.startsWith("!roll")) {
		roll.printRoll(chatMsg);
	}
	
	if (chatMsg.text === "!ltd") {
		legion.printLegionGames(chatMsg);
	}
	
	if (chatMsg.text === "!spam") {
		var possible = "bcdfghjklmnpqrstvwxz";
		var length = 5 + Math.round(100 * Math.random());
		var text = "";
		for (var i = 0; i < length; i++) {
			text += possible.charAt(Math.round(Math.random() * possible.length));
		}
		text += "i";
		chatMsg.replyTTS(text);
	}
	
	if (chatMsg.text.startsWith("!harry")) {
		chatMsg.replyTTS(markov.handleCommand(chatMsg.text));
	}
	
	if (msg.isMentioned(bot.user)) {
		var replaceStr = "<@" + bot.user.id + ">";
		chatMsg.text = chatMsg.text.split(replaceStr).join("").trim();
		cleverbot.reply(chatMsg);
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
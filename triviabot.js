var xlsx = require('xlsx');
var workbook = xlsx.readFile('Trivia-Printable.xlsx');
var ss = require('string-similarity');
var sheet = workbook.Sheets['Trivia'];

var maxindex = 15236;
var minindex = 1;
var qkeys = ['B', 'F', 'J'];
var akeys = ['C', 'G', 'K'];
var isRunning = false;
var questionsRemaining = 0;
var numQuestions = 0;
var currentAnswer = "";
var currentQuestion = "";
var currentTimeout = {};
var nextQTimeout = {};
var initMsg = {};
var standings = {};
var passStatus = {};

var blacklist = 
[
	"which of these",
	"following"
];

function printCorrectAnswer(answer, winner) {
	initMsg.reply("Correct answer \"" + answer + "\" was given by " + winner);
}

function checkPass() {
	var npass = 0;
	var nuser = 0;
	for (var entry in standings) {
		nuser++;
		if (standings[entry].pass === true) {
			npass++;
		}
	}
	initMsg.reply("Pass (" + npass + "/" + nuser + ")");
	if (npass == nuser)
		failQuestion();
}

function clearPass() {
	for (var entry in standings) {
		standings[entry].pass = false;
	}
}

function printStandings() {
	var txt = "Standings are:\n";
	for(var entry in standings) {
		txt += entry + ": " + standings[entry].score + "\n";
	}
	initMsg.reply(txt);
}

function cancel() {
	initMsg.reply("Trivia has ended, thanks for playing");
	printStandings();
	if (currentTimeout) 
		clearTimeout(currentTimeout);
	if (nextQTimeout) 
		clearTimeout(nextQTimeout);
	currentQuestion = "";
	currentAnswer = "";
	currentTimeout = {};
	initMsg = {};
	isRunning = false;
}

function getQuestion() {
	var letteridx = Math.round(Math.random() * qkeys.length);
	var qkey = qkeys[letteridx];
	var akey = akeys[letteridx];
	var idx = minindex + Math.round((maxindex - minindex) * Math.random());
	var qfield = sheet[qkey + idx];
	var afield = sheet[akey + idx];
	if (!qfield || !afield) {
		return null;
	}
	
	var q = sheet[qkey + idx].v + "";
	var a = sheet[akey + idx].v + "";
	
	for (var i = 0; i < blacklist.length; i++) {
		if (q.toLowerCase().indexOf(blacklist[i]) !== -1) {
			return null;
		}
	}
	a = a.replace("*CORRECT*", "");
	return [q, a];
}

function nextQuestion() {
	clearPass();
	if (questionIndex === numQuestions) {
		cancel();
	} else {
		var question = getQuestion();
		while (!question)
			question = getQuestion();
		var q = question[0];
		var a = question[1];
		console.log(q + " - " + a);
		currentQuestion = q;
		currentAnswer = a;
		var qstr = "Q (" + (questionIndex+1) + "/" + numQuestions + "): ";
		initMsg.reply(qstr + q);
		currentTimeout = setTimeout(failQuestion, 25000);
		questionIndex++;
	}
}

function failQuestion() {
	initMsg.reply("No correct answer given, correct answer was " + currentAnswer);
	currentQuestion = "";
	currentAnswer = "";
	if (currentTimeout)
		clearTimeout(currentTimeout);
	currentTimeout = {};
	nextQTimeout = setTimeout(nextQuestion, 2000);
}

module.exports = {
	handleCommand: function(chatMsg) {
		var contents = chatMsg.text.split(" ");
		if (contents.length >= 2) {
			var triviaCmd = contents[1].toLowerCase();
			
			if (triviaCmd === "start" && !isRunning && contents.length === 3) {
				var numQ = parseInt(contents[2]);
				if (!isNaN(numQ)) {
					if (numQ > 500)
						numQ = 500;
					if (numQ < 1)
						numQ = 1;
					chatMsg.reply("Starting trivia with " + numQ + " questions!");
					initMsg = chatMsg;
					questionIndex = 0;
					numQuestions = numQ;
					standings = {};
					currentQuestion = "";
					isRunning = true;
					setTimeout(nextQuestion, 2000);
				}
			} else if (triviaCmd === "cancel" && isRunning && chatMsg.channelId === initMsg.channelId) {
				cancel();
			}
		}
	},
	
	checkAnswer: function(chatMsg) {
		if (!isRunning) {
			return;
		}

		if (chatMsg.channelId !== initMsg.channelId) {
			return;
		}
		if (chatMsg.authorName === "Skynet") {
			return;
		}
		
		if (!(chatMsg.authorName in standings)) {
			standings[chatMsg.authorName] = {};
			standings[chatMsg.authorName].score = 0;
			standings[chatMsg.authorName].pass = false;
		}
		
		if (currentQuestion) {
			var givenAnswer = chatMsg.text.trim().toLowerCase();
			
			if (givenAnswer === "pass") {
				standings[chatMsg.authorName].pass = true;
				checkPass();
			} else {
				var correct = currentAnswer.trim().toLowerCase();
				var sim = ss.compareTwoStrings(givenAnswer, correct);
				if (sim > 0.7) {
					clearTimeout(currentTimeout);
					printCorrectAnswer(currentAnswer.trim(), chatMsg.authorName);
					currentQuestion = "";
					currentAnswer = "";
					currentTimeout = {};
					standings[chatMsg.authorName].score++;
					printStandings();
					setTimeout(nextQuestion, 2000);
				}
			}
		}
	},
	
	forceQuit: function() {
		if (currentTimeout) 
			clearTimeout(currentTimeout);
		if (nextQTimeout) 
			clearTimeout(nextQTimeout);
	}
};
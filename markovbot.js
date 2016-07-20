var util = require('util');
var fs = require('fs');
var markov = require('markov');
var m = markov(1);

var forceSeed = false;

if (forceSeed) {
	fs.readFile("qwantz.txt", (err,data) => {
		if (err) {
			console.log(err);
		}
		console.log("Read complete");
		m.seed(data);
		console.log("Seed complete");
		fs.writeFile("markov.txt", m.writeExternal());
	});
} else {
	fs.readFile("markov.txt", (err,data) => {
		if (err) {
			console.log(err);
		}
		m.readExternal(data);
		console.log("Seed complete");
	});
}

function getMarkovChain(length, key) {
	var chain = {};
	if (typeof key !== "undefined") {
		chain = m.respond(key, length);
	} else {
		key = m.pick();
		chain = m.fill(key, length);
	}
	var str = chain.join(" ");
	str = str.replace(/['"]+/g, '');
	return str;
}

module.exports = {
	handleCommand: function(command) {
		var length = 50 + Math.round(100 * Math.random());
		var contents = command.split(" ");
		var txt = "";
		if (contents.length == 2) {
			txt = getMarkovChain(length, contents[1]);
		} else {
			txt = getMarkovChain(length);
		}
		return txt;
	}
};

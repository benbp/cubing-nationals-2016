var request = require('request');
var cheerio = require('cheerio');
var Promise = require('bluebird');  // jshint ignore:line

var fourbyfour1 = 'https://cubecomps.cubing.net/live.php?cid=1639&cat=3&rnd=1';
var pyraminx1 = 'https://cubecomps.cubing.net/live.php?cid=1639&cat=11&rnd=1';

function getTimes(url) {
    var resolve, reject;
    var deferred = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });

    var firstRound = request.get(url, (err, resp, body) => {
        if (err) {
            reject(err);
            return;
        }
        var $ = cheerio.load(body);
        var td = $('.col_nm :contains("Joshua Broderick Phillips")').parent().parent();
        var result = td.nextAll().slice(6, 7).text();
        var place = td.parent().find('b').first().text();

        resolve({
            result: result,
            place: place
        });
    });

    return deferred;
}

getTimes(fourbyfour1)
.then((data) => {
    console.log("4x4 R1 score: " + data.result);
    console.log("4x4 R1 place: " + data.place);
});

getTimes(pyraminx1)
.then((data) => {
    console.log("Pyraminx R1 score: " + data.result);
    console.log("Pyraminx R1 place: " + data.place);
});

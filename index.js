var request = require('request');
var c = require('cheerio');
var Promise = require('bluebird');  // jshint ignore:line
var express = require('express');
var ejs = require('ejs');


var queries = [
    { title: '2x2 Round 1', url: 'https://cubecomps.cubing.net/live.php?cid=1639&cat=2&rnd=1' },
    { title: '3x3 Round 1', url: 'https://cubecomps.cubing.net/live.php?cid=1639&cat=1&rnd=1' },
    { title: '4x4 Round 1', url: 'https://cubecomps.cubing.net/live.php?cid=1639&cat=3&rnd=1' },
    { title: 'Pyraminx Round 1', url: 'https://cubecomps.cubing.net/live.php?cid=1639&cat=11&rnd=1' },
];

function getTimes(url, cutoff) {
    var resolve, reject;
    var deferred = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    if (!cutoff) {
        cutoff = 100;
    }

    var firstRound = request.get(url, (err, resp, body) => {
        if (err) {
            reject(err);
            return;
        }
        console.time(' res/place ' + url);
        var td = c.load(body)('.col_nm :contains("Joshua Broderick Phillips")').parent().parent();
        var result = td.nextAll().slice(6, 7).text();
        var place = td.parent().find('b').first().text();
        console.timeEnd(' res/place ' + url);

        console.time(' competitors ' + url);
        var tr = c.load(body);
        var competitors = tr('.row_even').length + tr('.row_odd').length;
        console.timeEnd(' competitors ' + url);

        console.time(' unreported ' + url);
        var unreported = c.load(body)('.col_cl :empty').length;
        console.timeEnd(' unreported ' + url);

        console.time(' worst ' + url);
        var worst = c.load(body)('.col_cl :contains(' + cutoff + ')')
                        .parent().nextAll().slice(7,8).text();

        console.timeEnd(' worst ' + url);

        resolve([
            { title: 'result', value: result },
            { title: 'place', value: place },
            { title: 'competitors', value: competitors },
            { title: 'unreported', value: unreported },
            { title: 'worst', value: worst }
        ]);
    });

    return deferred;
}

var app = express();
app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

function addData(data) {
    result.fields.push(data);
}

app.get('/', function(request, response) {
    Promise.resolve().bind({ results: [] })
    .then(function() {
        console.log('FETCHING RESULTS');
        return Promise.map(queries, (query) => {
            return getTimes(query.url)
                    .then((data) => {
                        this.results.push({
                            title: query.title,
                            fields: data
                        });
                    });
        });
    })
    .then(function() {
        console.log('RESULTS');
        this.results = this.results.sort(function(a, b) {
            return a.title > b.title;
        });
        console.log(JSON.stringify(this.results));
        response.render('index.ejs', { results: this.results });
    })
    .catch(function(err) {
        response.send(err);
    });
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
});

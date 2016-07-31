var request = require('request');
var c = require('cheerio');
var Promise = require('bluebird');  // jshint ignore:line
var express = require('express');
var ejs = require('ejs');


var queries = [
    { title: '2x2 Round 1', url: 'https://cubecomps.cubing.net/live.php?cid=1639&cat=2&rnd=1' },
    { cutoff: 150, title: '3x3 Round 1', url: 'https://cubecomps.cubing.net/live.php?cid=1639&cat=1&rnd=1' },
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
        console.time(' rows ' + url);
        var rows = c.load(body)('.row_even, .row_odd');
        console.timeEnd(' rows ' + url);

        console.time(' res/place ' + url);
        var td = c.load(body)('.col_nm :contains("Joshua Broderick Phillips")').parent().parent();
        var result = td.nextAll().slice(6, 7).text();
        var place = td.parent().find('b').first().text();
        console.timeEnd(' res/place ' + url);

        var competitors = rows.length;

        console.time(' unreported ' + url);
        var unreported = c.load(body)('.col_cl :empty').length;
        console.timeEnd(' unreported ' + url);

        console.time(' worst ' + url);
        var worst = c.load(body)('.col_cl :contains(' + cutoff + ')')
                        .parent().nextAll().slice(7,8).text();
        console.timeEnd(' worst ' + url);

        console.time(' scores ' + url);
        var scores = c.load(body)('.TD').children().slice(0, cutoff).map(function(n, el) {
            return c.load(this)('td').slice(8,9).text().replace(/\D+/g, '');
        }).toArray();
        console.timeEnd(' scores ' + url);

        resolve({
            scores: scores,
            fields: [
                { title: 'result', value: result },
                { title: 'place', value: place },
                { title: 'competitors', value: competitors },
                { title: 'unreported', value: unreported },
                { title: 'worst', value: worst }
            ]
        });
    });

    return deferred;
}

var app = express();
app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    var results = [];

    Promise.resolve()
    .then(function() {
        console.log('FETCHING RESULTS');
        return Promise.map(queries, (query) => {
            return getTimes(query.url, query.cutoff)
                    .then((data) => {
                        results.push({
                            cls: query.title.replace(/\s/g, '_'),
                            title: query.title,
                            fields: data.fields,
                            scores: data.scores
                        });
                    });
        });
    })
    .then(function() {
        console.log('RESULTS');
        results = results.sort(function(a, b) {
            return a.title > b.title;
        });
        console.log(JSON.stringify(results));
        response.render('index.ejs', { results: results });
    })
    .catch(function(err) {
        response.send(err);
    });
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
});

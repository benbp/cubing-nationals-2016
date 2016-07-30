var request = require('request');
var cheerio = require('cheerio');
var Promise = require('bluebird');  // jshint ignore:line
var express = require('express');
var ejs = require('ejs');

var twobytwo1 = 'https://cubecomps.cubing.net/live.php?cid=1639&cat=2&rnd=1';
var threebythree1 = 'https://cubecomps.cubing.net/live.php?cid=1639&cat=1&rnd=1';
var fourbyfour1 = 'https://cubecomps.cubing.net/live.php?cid=1639&cat=3&rnd=1';
var pyraminx1 = 'https://cubecomps.cubing.net/live.php?cid=1639&cat=11&rnd=1';

function getTimes(url, cut) {
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
        var competitors = $('.row_even').length + $('.row_odd').length;
        var unreported = 0;
        $('.col_cl').each(function(n, el) {
            if(!cheerio.load(el)('.col_cl').text()) {
                unreported += 1;
            }
        });
        //url;
        //var minimum = $('.col_tm').slice((cut - 1) * 7, cut * 7).text();
        //debugger;

        resolve([
            { title: 'result', value: result },
            { title: 'place', value: place },
            { title: 'competitors', value: competitors },
            { title: 'unreported', value: unreported },
        //    { title: 'minimum', value: minimum }
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
        return [
            getTimes(twobytwo1).bind(this)
            .then((data) => {
                this.results.push({
                    title: '2x2 Round 1',
                    fields: data
                });
            }),
            getTimes(threebythree1).bind(this)
            .then((data) => {
                this.results.push({
                    title: '3x3 Round 1',
                    fields: data
                });
            }),
            getTimes(fourbyfour1).bind(this)
            .then((data) => {
                this.results.push({
                    title: '4x4 Round 1',
                    fields: data
                });
            }),
            getTimes(pyraminx1).bind(this)
            .then((data) => {
                this.results.push({
                    title: 'Pyraminx Round 1',
                    fields: data
                });
            })
        ];
    })
    .spread(function() {
        console.log('RESULTS');
        console.log(this.results);
        response.render('index.ejs', { results: this.results });
    })
    .catch(function(err) {
        response.send(err);
    });
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
});

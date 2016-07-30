var request = require('request');
var cheerio = require('cheerio');
var Promise = require('bluebird');  // jshint ignore:line
var express = require('express');
var ejs = require('ejs');

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
        var competitors = $('.row_even').length + $('.row_odd').length;
        var unreported = 0;
        $('.col_cl').each(function(n, el) {
            if(!cheerio.load(el)('.col_cl').text()) {
                unreported += 1;
            }
        });

        resolve({
            result: result,
            place: place,
            competitors: competitors,
            unreported: unreported
        });
    });

    return deferred;
}

var app = express();
app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    Promise.resolve().bind({ results: {} })
    .then(function() {
        console.log('FETCHING RESULTS');
        return [
            getTimes(fourbyfour1).bind(this)
            .then((data) => {
                this.results.fourbyfourR1Score = data.result;
                this.results.fourbyfourR1Place = data.place;
                this.results.fourbyfourR1Competitors = data.competitors;
                this.results.fourbyfourR1Unreported = data.unreported;
            }),
            getTimes(pyraminx1).bind(this)
            .then((data) => {
                this.results.pyraminxR1Score = data.result;
                this.results.pyraminxR1Place = data.place;
                this.results.pyraminxR1Competitors = data.competitors;
                this.results.pyraminxR1Unreported = data.unreported;
            })
        ];
    })
    .spread(function() {
        console.log('RESULTS');
        console.log(this.results);
        response.render('index.ejs', this.results);
    })
    .catch(function(err) {
        response.send(err);
    });
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
});

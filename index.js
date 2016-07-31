var request = require('request');
var c = require('cheerio');
var Promise = require('bluebird');  // jshint ignore:line
var express = require('express');
var ejs = require('ejs');


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

        console.time(' cutoff ' + url);
        var cutoff = c.load(body)('td[style*="background-color:#CCFF00"]').length;
        console.timeEnd(' cutoff ' + url);

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

        console.time(' title ' + url);
        var title = c.load(body)('.main div[style*="margin"]').text();
        console.timeEnd(' title ' + url);

        resolve({
            title: title,
            scores: scores,
            fields: [
                { title: 'result', value: result },
                { title: 'place', value: place },
                { title: 'competitors', value: competitors },
                { title: 'unreported', value: unreported },
                { title: 'worst', value: worst },
                { title: 'advancing', value: cutoff }
            ]
        });
    });

    return deferred;
}

var app = express();
app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    res.render('index.ejs', { refreshInterval: 10 });
});

app.get('/null', function(req, res) {
    res.send('');
});

app.get('/query', function(req, res) {
    Promise.resolve()
    .then(function() {
        console.log('FETCHING RESULTS');
        console.log(req.query);
        return getTimes(req.query.url, req.query.cutoff || 100)
        .then((data) => {
            return {
                cls: data.title.replace(/[\s\.]/g, '_'),
                url: req.query.url,
                title: data.title,
                fields: data.fields,
                scores: data.scores
            };
        });
    })
    .then(function(result) {
        console.log('RESULTS');
        console.log(JSON.stringify(result));
        app.render('result.ejs', result, (err, html) => {
            if (err) {
                res.send(err);
            } else {
                res.send({
                    cls: result.cls,
                    url: result.url,
                    scores: result.scores,
                    html: html
                });
            }
        });
    })
    .catch(function(err) {
        console.error(err);
        res.send(err);
    });
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
});

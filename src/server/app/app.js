const webpack = require('webpack');
const app = require('express')();
const HTTP = require('http').Server(app);

app.use(function(err, req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();

    console.error(err.stack)
    res.status(500).send('Something broke dude!');
});

HTTP.listen(3000);

module.exports = app;
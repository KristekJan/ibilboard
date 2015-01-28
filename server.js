var fs = require('fs'),
    __dirname = "public",
    name_file = "local_db.json",
    name_var = "count",
    http = require('http'),
    express = require('express'),
    app = express(),
    port = process.env.PORT || 80,
    ib = require('./lib/ib.js'),
    async = require("async");


app.listen(3000);
http.createServer(app).listen(port);


ib.init( /*name_file, name_var*/ );
ib.test("./test/test.json");


//http://127.0.0.1/there?count=0&count=1&nevim=1
app.get( /*'/track'*/ '/:a', function (req, res) {

    if (req.url === '/favicon.ico') {
        res.writeHead(200, {
            'Content-Type': 'image/x-icon'
        });
        res.end();
        console.log('favicon requested');
        return;
    }


    var items = [{
        "function": "jsonS",
        "data": [req.query, name_file]
    }, {
        "function": "redisS",
        "data": [req.query, name_var]
    }];

    var results = [];

    //no use async lib
    // Loop through some items
    //    items.forEach(function (item) {
    //        ib[item.function](item.data[0], function (result) {
    //            results.push(result);
    //            if (results.length == items.length) {
    //                final();
    //            }
    //        })
    //    });
    //END -- no use async lib
    var asyncTasks = [];
    items.forEach(function (item) {
        // We don't actually execute the async action here
        // We add a function containing it to an array of "tasks"
        asyncTasks.push(function (callback) {
            ib[item.function](item.data[0], function (result) {
                results.push(result);
                callback();
            })

        });

    });

    async.parallel(asyncTasks, function (cb) {
        // All tasks are done now
        res.write("Done\n");
        res.write(JSON.stringify(results));
        res.end();
    });




});
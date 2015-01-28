var ib = require('../lib/ib.js'),
    async = require("async"),
    fs = require('fs');

ib.init();
var test_file = JSON.parse(fs.readFileSync("./test/test.json"));


var cc = 0;
var asyncTasks = [];
test_file.data.forEach(function (item) {
    // We don't actually execute the async action here
    // We add a function containing it to an array of "tasks"
    asyncTasks.push(function (callback) {
        cc++;
        exports[item.function+cc] = function (test) {

            ib[item.function](item.data[0], function (msg) {
                console.log(JSON.stringify(item.result));
                console.log(JSON.stringify(msg));
                var b = JSON.stringify(msg) == JSON.stringify(item.result);
                test.equals(b, true);
                test.done();
                callback();
            }, item.data[1]);
        }
    });


});


asyncTasks.push(function (callback) {  
    exports["testjsonfile"] = function (test) {
        // pridanim 0 nezmenim hodnotu
        ib.redisS({
            "count": "0"
        }, function (msg) {

            if (parseInt(msg.data) == parseInt(test_file.count_end)) {
                console.log("Done : Redis value");
                test.equals(true, true);
                test.done();
            } else {
                test_succ = false;

                test.equals(false, true);
                test.done();

            }
        })
    }
    // client.del(test_file.count_name);

});



async.parallel(asyncTasks, function (cb) {
    console.log("test - done")
                fs.unlink(test_file.file_name, function (err) {
                if (err) throw err;
                console.log('successfully deleted : ' + test_json.file_name);
            });
});
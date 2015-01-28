var fs = require('fs'),
    exec = require('child_process').execFile,
    redis = require("redis"),
    async = require("async"),
    g_name_file = "",
    g_name_var = "", 
    client = redis.createClient( /*6379, '127.0.0.1'*/ ),
    test_succ;


// function for save to lovcal json
jsonS = function (query, callback, dst) {
    dst  = dst||g_name_file;
    if (!test_succ) {
        callback({
            "type": "test_succ",
            "succes": false
        });
    }
    var tmp_json = {
        "query": query
        /*,
        "date": new Date()*/
    }
    if (fs.existsSync(dst)) {

        fs.readFile(dst, function (err, data) {
            if (err) {
                callback({
                    "type": "save",
                    "succes": false,
                    "data": err
                });
                //throw err
            };

            var data_json = JSON.parse(data);
            data_json.push(tmp_json);
            fs.writeFile(dst, JSON.stringify(data_json), function (err) {
                if (err) throw err;

                callback({
                    "type": "save",
                    "succes": true,
                    "data": tmp_json
                });
            });
        });
    } else {
        console.log('not exist' + dst);
        fs.writeFile(dst, JSON.stringify([tmp_json]), function (err) {
            if (err) {
                callback({
                    "type": "save",
                    "succes": false,
                    "data": err
                });
                //throw err;
            }
            callback({
                "type": "save",
                "succes": true,
                "data": tmp_json
            });
        });
    }
}
// END -- function for save to lovcal json


// Init
init = function (name_file, name_var) {
       test_succ = true;
    
    g_name_file = name_file || "local_db.json";
    g_name_var = name_var || "count";
    exec('./redis-server/redis-server.exe', function (err, data) {

        console.log(err)
        console.log(data.toString());
    });

    client.on("error", function (err) {
        console.log("Error " + err);
    });

    client.set(g_name_var, 0, redis.print); // create
    client.get(g_name_var, function (err, val) { //chech create
        if (err) {
            throw err;
        }
        console.log("count : " + val)
    });


}
// END - Init

// for manipulation db redis
redisS = function (query, callback, name_var) {
     name_var  = name_var||name_var;
    if (!test_succ) {
        callback({
            "type": "test_succ",
            "succes": false
        });
    }
    if (query.count /*&& req.query.count.length <2*/ ) {


        if (/^-{0,1}\d*\.{0,1}\d+$/.test(query.count)) {
            client.incrby(name_var, parseInt(query.count), function (err, reply) {
                //console.log(reply); // 11
            });
            client.get(name_var, function (err, val) {
                if (err) {
                    callback({
                        "type": "redis",
                        "succes": false,
                        "data": err
                    });
                    //throw err;
                }
                callback({
                    "type": "redis",
                    "succes": true,
                    "data": parseInt(val)
                });

            });
        } else {
            callback({
                "type": "redis",
                "succes": true,
                "data": "not_number"
            });
        }

    } else {
        callback({
            "type": "redis",
            "succes": true,
            "data": "not_in_query"
        });
    }
}
//END --  for manipulation db redis

//Testing
test = function(dst) {
    dst = dst|| "./test/test.json"; 
    test_succ = true;
    if (fs.existsSync(dst)) {

        fs.readFile(dst, function (err, data) {
            if (err) {
                throw err;
            }
            testing(JSON.parse(data))
        });
    } else {
        test_succ = false;
        console.log("not find testing data");
    }

}

testing = function(test_json) {


    if (fs.existsSync(test_json.file_name)) {
            fs.unlink(test_json.file_name, function (err) {
                if (err) throw err;
                console.log('successfully deleted : ' + test_json.file_name);
            });
    }
    var items = test_json.data;
    var results = [];
    var ss_test = 0; // count succes test function
    // test functions
    var asyncTasks = [];

    
    items.forEach(function(item){
  // We don't actually execute the async action here
  // We add a function containing it to an array of "tasks"
  asyncTasks.push( function(callback){
       global[item.function](item.data[0], function (result) {
            results.push(result);

            if (JSON.stringify(result) == JSON.stringify(item.result)) {
                ss_test++;
                console.log("Succes");
            } else {
                 errorPrint(item.function,JSON.stringify(item.result),JSON.stringify(result))
            }
//            if (results.length == items.length) {
//                final();
//            }
    callback();
        }, item.data[1])
     
  });
  
});

    async.parallel(asyncTasks, function(cb){
  // All tasks are done now

    final();
});

    

// // END -- test functions
//    
// //After END -- test functions
    function final() {
        console.log("Done : " + ss_test + "/" + items.length + "\n");
        if (ss_test != items.length)
            test_succ = false;


        fs.readFile(test_json.file_name, function (err, data) {
            if (err) {
                throw err;
            }

            if (JSON.stringify(JSON.parse(data)) == JSON.stringify(test_json.file_test)) {
                console.log("Done : test json file");
            } else {
                test_succ = false;
                errorPrint("test json file", JSON.stringify(test_json.file_test),JSON.stringify(JSON.parse(data)))
                console.log("Error : test json file");
            }

            fs.unlink(test_json.file_name, function (err) {
                if (err) throw err;
                console.log('successfully deleted : ' + test_json.file_name);
            });
        });


        client.get(test_json.count_name, function (err, val) {
            if (err) {
                throw err;
            }
            if (parseInt(val) == parseInt(test_json.count_end)) {
                console.log("Done : Redis value");
            } else {
                test_succ = false;
                errorPrint( "Redis value", test_json.count_end, parseInt(val))
               
            }
            client.del(test_json.count_name);
        });


    }
     //END - After END -- test functions

}

errorPrint = function(type,want,have) {
                console.log("------");
                console.log("Error");
                console.log("type: " + type);
                console.log("want: " + want);
                console.log("have: " + have);
                console.log("------");  
}




module.exports.init = init;
module.exports.test = test;
module.exports.jsonS = jsonS;
module.exports.redisS = redisS;
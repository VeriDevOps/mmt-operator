var moment      = require('moment');
var dataAdaptor = require('./dataAdaptor.js');
var Window      = require("./window.js");
var config      = require("../config.json");

var MongoClient = require('mongodb').MongoClient,
    format = require('util').format;

var Cache = function (period) {
    this.data = [];
    this.add = function (msg) {
        this.data.push(msg);
    };

    this.addArray = function (arr) {
        this.data = this.data.concat(arr);
    }
    this.clear = function () {
        this.data = [];
    };
    this.getLength = function () {
        return this.data.length;
    };
    this.getData = function () {
        /**
         * [[Description]]
         * @param   {Object}   message  [[Description]]
         * @returns {Object}   [[Description]]
         */
        var getKeyData = function (message) {
            var key = {},
                data = {};


            if (message.format === 100) { //TODO: replace with definition
                key = {
                    format: message.format,
                    probe: message.probe,
                    source: message.source,
                    path: message.path,
                    ip_src: message.ip_src,
                    //ip_dest: message.ip_dest
                };
                data = {
                    '$set': {
                        app: message.app,
                        last_time: message.time,
                        start_time: message.start_time,
                        mac_src: message.mac_src,
                        //mac_dest: message.mac_dest
                    },
                    '$inc': {
                        bytecount: message.bytecount,
                        payloadcount: message.payloadcount,
                        packetcount: message.packetcount,
                        dl_data: message.dl_data,
                        ul_data: message.ul_data,
                        dl_packets: message.dl_packets,
                        ul_packets: message.ul_packets,
                        ul_payload: message.ul_payload,
                        dl_payload: message.dl_payload,
                        active_flowcount: message.active_flowcount
                    }
                };
            }
            //security
            else if (message.format == 10) {
                key = {
                    format: message.format,
                    probe: message.probe,
                    source: message.source,
                    property: message.property,
                    verdict: message.verdict,
                    type: message.type
                };
                data = {
                    '$inc': {
                        verdict_count: message.verdict_count 
                    },
                    '$set': {
                        last_time: message.time,
                        description: message.description
                    }
                }
            } else if( message.format == 11 || message.format == 12 ){
                  key = Object.keys( message );
            } else {
                key = {
                    format: message.format,
                    probe: message.probe,
                    source: message.source,
                    path: message.path,
                    server_addr: message.server_addr,
                    client_addr: message.client_addr,
                    app: message.app
                };

                if (message.format === 0) {
                    data = {
                        '$inc': {
                            dl_data: message.dl_data,
                            ul_data: message.ul_data,
                            dl_packets: message.dl_packets,
                            ul_packets: message.ul_packets,
                            count: 1,
                            active_flowcount: message.active_flowcount
                        },
                        '$set': {
                            last_time: message.time,
                            start_time: message.start_time
                        }
                    }

                } else if (message.format === 1) {
                    data = {
                        '$inc': {
                            dl_data: message.dl_data,
                            ul_data: message.ul_data,
                            dl_packets: message.dl_packets,
                            ul_packets: message.ul_packets,
                            response_time: message.response_time,
                            transactions_count: message.transactions_count,
                            interaction_time: message.interaction_time,
                            count: 1,
                            active_flowcount: message.active_flowcount
                        },
                        '$set': {
                            last_time: message.time,
                            start_time: message.start_time
                        }
                    };

                } else if (message.format === 2) {
                    data = {
                        '$inc': {
                            dl_data: message.dl_data,
                            ul_data: message.ul_data,
                            dl_packets: message.dl_packets,
                            ul_packets: message.ul_packets,
                            count: 1,
                            active_flowcount: message.active_flowcount
                        },
                        '$set': {
                            last_time: message.time,
                            start_time: message.start_time,
                            server_name: message.server_name,
                            cdn: message.cdn
                        }
                    };

                } else if (message.format === 3) {
                    data = {
                        '$inc': {
                            dl_data: message.dl_data,
                            ul_data: message.ul_data,
                            dl_packets: message.dl_packets,
                            ul_packets: message.ul_packets,
                            packet_loss: message.packet_loss,
                            packet_loss_burstiness: message.packet_loss_burstiness,
                            jitter: message.jitter,
                            count: 1,
                            active_flowcount: message.active_flowcount
                        },
                        '$set': {
                            last_time: message.time,
                            start_time: message.start_time
                        }
                    };

                }
            }

            key.time = moment(message.time).startOf(period).valueOf();
            return {
                key: key,
                data: data
            };
        };

        var obj = {};
        for (var i in this.data) {
            var msg  = this.data[i];
            var o    = getKeyData(msg);
            var key  = o.key;
            var data = o.data;

            var txt = JSON.stringify(key);

            if (obj[txt] == undefined) {
                obj[txt] = {};
                for (var j in key)
                    obj[txt][j] = key[j];
            }

            var oo = obj[txt];

            //increase
            for (var j in data['$inc'])
                if (oo[j] == undefined)
                    oo[j] = data['$inc'][j];
                else
                    oo[j] += data['$inc'][j];
                //set
            for (var j in data['$set'])
                oo[j] = data['$set'][j];

            //console.log( oo );
        }
        var arr = [];
        for (var i in obj)
            arr.push(obj[i]);
        
        console.log( period + " compress " + this.data.length +  " records ===> " + arr.length);
        
        return arr;
    };
};

//cache size
var MAX_LENGTH   = 1000000;

//cache size from config.js
if( config.buffer_socketio.max_length_size )
    MAX_LENGTH = parseInt( config.buffer_socketio.max_length_size );


var MongoConnector = function (opts) {
    this.mdb = null;

    if (opts == undefined)
        opts = {};

    opts.connectString = opts.connectString || 'mongodb://127.0.0.1:27017/MMT';

    var self = this;

    var cache = {
        minute: new Cache("minute"),
        hour: new Cache("hour"),
        day: new Cache("day")
    }

    self.window = new Window( 5*60,  MAX_LENGTH, "real" );
    self.window_minute = new Window( (24+1)*60*60,  MAX_LENGTH, "min" );
    
    self.window_minute.addData = function( arr ){
        //add to window_minute
        arr.forEach(function(e,i){
            if( e )
                self.window_minute.push( dataAdaptor.reverseFormatReportItem( e ) ); 
        });
    }
    
    
    //use to delete old data from "traffic" and "traffic_time" collections
    var lastDeletedTime = {
        traffic: {
            ts: null,
            period: 5 * 60 * 1000 //delete data older than 5 min
        },
        traffic_min: {
            ts: null,
            period: 60 * 60 * 1000 //delete data older than 60 min
        }
    }

    MongoClient.connect(opts.connectString, function (err, db) {
        if (err) throw err;
        self.mdb = db;
        console.log("Connected to Database");
        
        //load last data to the windows
        self.getLastTime( function( err, ts ){
            
            var option = {
                format: [100, 0, 1, 2, 10, 11, 12],    //all kind of data
                time:{
                    begin: ts - self.window.config.MAX_PERIOD,
                    end  : ts
                },
                collection: "traffic",
                raw: true
            };
            self.getCurrentProtocolStats( option, function( err, data ){
                if( err ) console.error( err.stack );
                //self.window.pushArray( data );
                self.window.data = data;
            });  
            
            
            option = {
                format: [100, 0, 1, 2, 10, 11, 12],    //all kind of data
                time:{
                    begin: ts - self.window_minute.config.MAX_PERIOD,
                    end  : ts
                },
                collection: "traffic_min",
                raw: true
            };
            self.getCurrentProtocolStats( option, function( err, data ){
                if( err ) console.error( err.stack );
                //self.window_minute.pushArray( data );
                self.window_minute.data = data;
            });
        } );
        
        
    });    


    self.lastTimestamp = 0;

    /**
     * Stock a report to database
     * @param {[[Type]]} message [[Description]]
     */
    self.addProtocolStats = function (message) {
        if (self.mdb == null) return;

        //
        self.window.push( message );
        
        
        message = dataAdaptor.formatReportItem(message);
        var ts = message.time;

        self.lastTimestamp = ts;

        self.mdb.collection("traffic").insert(message, function (err, records) {
            if (err) console.error(err.stack);
        });

        if( message.format === dataAdaptor.CsvFormat.BA_BANDWIDTH_FORMAT 
           || message.format === dataAdaptor.CsvFormat.BA_PROFILE_FORMAT){
            
            self.mdb.collection("behaviour").insert(message, function (err, records) {
                if (err) console.error(err.stack);
            });
            return;
        }


        //add message to cache
        cache.minute.add(message);
        
        if (cache.minute.lastUpdateTime === undefined)
            cache.minute.lastUpdateTime = ts;

        //if cache is in minute ==> UPDATE Minute
        else if (ts - cache.minute.lastUpdateTime >= 60 * 1000) {

            var data = cache.minute.getData();
            self.window_minute.addData( data );
            self.mdb.collection("traffic_min").insert(data, function (err, records) {
                if (err) console.error(err.stack);
                console.log(">>>>>>> flush " + data.length + " records to traffic_min");
            });
            
            cache.minute.lastUpdateTime = ts;
            cache.minute.clear();

            cache.hour.addArray(data);

            // Update Hour
            if (cache.hour.lastUpdateTime === undefined)
                cache.hour.lastUpdateTime = ts;
            else if (ts - cache.hour.lastUpdateTime >= 60 * 60 * 1000) {

                //update traffic hour
                data = cache.hour.getData();
                self.mdb.collection("traffic_hour").insert(data, function (err, records) {
                    if (err) console.error(err.stack);
                    console.log(">>>>>>> flush " + data.length + " records to traffic_hour");
                });
                cache.hour.lastUpdateTime = ts;
                cache.hour.clear();

                cache.day.addArray(data);

                //Update Day
                if (cache.day.lastUpdateTime === undefined)
                    cache.day.lastUpdateTime = ts;
                else if (ts - cache.day.lastUpdateTime >= 24 * 60 * 60 * 1000) {
                    data = cache.day.getData();
                    self.mdb.collection("traffic_day").insert(data, function (err, records) {
                        if (err) console.error(err.stack);
                        console.log(">>>>>>> flushed " + data.length + " records to traffic_day");
                    });

                    cache.day.lastUpdateTime = ts;
                    cache.day.clear();
                }

            }

        }

        //delete Trafic        
        for (var i in lastDeletedTime) {
            var last = lastDeletedTime[i];

            if (last.ts == undefined)
                last.ts = ts;
            else if (ts - last.ts >= last.period) {

                //Delete old data in traffic. Retain only data from the last hour
                self.mdb.collection(i).deleteMany({
                        time: {
                            "$lt": last.ts
                        }
                    },
                    function (err, result) {
                        if (err) throw err;
                        console.log("<<<<< deleted " + result.deletedCount + " records in [" + i + "] older than " + (new Date(last.ts)).toLocaleTimeString());
                    });

                last.ts = ts;
            }
        }
    };


    self.flushCache = function (cb) {
        var totalCall = 0;
        var callback = function () {
            totalCall++;
            if (totalCall == 3)
                if( cb )
                    cb();
        }

        var data = cache.minute.getData();
        self.window_minute.addData( data );
        cache.minute.clear();
        if (data.length > 0)
            self.mdb.collection("traffic_min").insert(data, function (err, records) {
                if (err) console.error(err.stack);
                console.log(">>>>>>> flush " + data.length + " records to traffic_min");
                callback();
            });
        else
            callback();

        cache.hour.addArray(data);
        data = cache.hour.getData();
        cache.hour.clear();
        if (data.length > 0)
            self.mdb.collection("traffic_hour").insert(data, function (err, records) {
                if (err) console.error(err.stack);
                console.log(">>>>>>> flush " + data.length + " records to traffic_hour");
                callback();
            });
        else
            callback();

        cache.day.addArray(data);
        data = cache.day.getData();
        cache.day.clear();
        if (data.length > 0)
            self.mdb.collection("traffic_day").insert(data, function (err, records) {
                if (err) console.error(err.stack);
                console.log(">>>>>>> flushed " + data.length + " records to traffic_day");
                callback();
            });
        else
            callback();
    };

    //flush caches before quering
    self.getProtocolStats = function (options, callback) {
        
        console.log(options);
        
        if( options.period === "minute" ){
            var data;
            if( options.isReload )
                data = self.window.getFreshData( options.format );
            else
                data = self.window.getAllData( options.format );
            
            console.log("got " + data.length + "/" + self.window.data.length + " from window cache");
            callback(null, data );
            return;
        }
        else if( options.collection === "traffic_min"  ){
            var data;
            if( options.isReload )
                data = self.window_minute.getFreshData( options.format );
            else
                data = self.window_minute.getAllData( options.format, options.time.begin );
            
            console.log("got " + data.length + "/" + self.window_minute.data.length + " from window_minute cache");
            callback(null, data );
            return;
        }
            
        self.flushCache( function(){
            self.getCurrentProtocolStats( options, callback );
        } );
    };
    
    /**
     * [[Description]]
     * @param {Object}   options  [[Description]]
     * @param {[[Type]]} callback [[Description]]
     */
    self.getCurrentProtocolStats = function (options, callback) {
        
        var start_ts = (new Date()).getTime();

        if( options.format.indexOf( dataAdaptor.CsvFormat.BA_BANDWIDTH_FORMAT ) >= 0
           || options.format.indexOf( dataAdaptor.CsvFormat.BA_PROFILE_FORMAT ) >= 0){
            
            //options.collection = "behaviour";
        }
        
        var cursor = self.mdb.collection(options.collection).find({
            format: {
                $in: options.format
            },
            "time": {
                '$gte': options.time.begin,
                '$lte': options.time.end
            }
        });

        cursor.toArray(function (err, doc) {
            if (err) {
                callback('InternalError');
                return;
            }

            var end_ts = (new Date()).getTime();
            var ts = end_ts - start_ts;

            console.log("\n got " + doc.length + " records, took " + ts + " ms");

            if (options.raw) {
                var data = [];
                for (i in doc) {
                    var record = doc[i];
                    //if( record.last_time )
                    //    record.time = record.last_time;
                    
                    record = dataAdaptor.reverseFormatReportItem(doc[i]);

                    data.push(record);
                }

                ts = (new Date()).getTime() - end_ts;

                console.log("converted " + doc.length + " records, took " + ts + " ms\n");
                callback(null, data);
            } else {
                callback(null, doc);
            }

        });
    };

    /**
     * Get timestamp of the last report having some predefined format
     * @param {Callback} cb      [[Description]]
     */
    self.getLastTime = function ( cb ) {
        if (self.mdb == null) return;


        if (self.lastTimestamp > 0 ) {
            cb(null, self.lastTimestamp);
            return;
        }

        self.mdb.collection("traffic").find({
        }).sort({
            "_id": -1
        }).limit(1).toArray(function (err, doc) {
            if (err) {
                self.lastTimestamp = (new Date()).getTime();
            }
            else if (Array.isArray(doc) && doc.length > 0)
                self.lastTimestamp = doc[0].time;
            
            cb(null, self.lastTimestamp);
        });
    };
    
    
    self.emptyDatabase = function( cb ){
        self.mdb.dropDatabase( function( err, doc ){
            console.log( "drop database!");
            self.window.clear();
            self.window_minute.clear();
            cache.day.clear();
            cache.minute.clear();
            cache.hour.clear();
            
            //empty also mmt-bandwidth
            MongoClient.connect('mongodb://' + config.database_server +':27017/mmt-bandwidth', function (err, db) {
                if (! err) 
                    db.dropDatabase( function( err, doc) {
                        cb( err );
                    });
            });
            
        } );
    };
};

module.exports = MongoConnector;
var mmtAdaptor = require('../libs/dataAdaptor');
var config     = require("../config.json");
console.log( config );
var router = {};
router.startListening = function (db, redis) {
    var report_client = redis.createClient();

    //report_client.subscribe("protocol.flow.stat");
    //report_client.subscribe("radius.report");
    //report_client.subscribe("microflows.report");
    report_client.subscribe("flow.report");
    report_client.subscribe("web.flow.report");
    report_client.subscribe("ssl.flow.report");
    report_client.subscribe("rtp.flow.report");

    report_client.on('message', function (channel, message) {
        console.log( "[" + channel + "] " + message );
        
        var msg = JSON.parse(message);
        if( msg[4] == 0){
            //console.log("[META] " + message)
            return;
        }
        var format = msg[0];
        
        if( format == 99 && mmtAdaptor.setDirectionProtocolStat( msg, config.mac_server ) == null){
            console.log("[DONOT] " + message)
            return;
        }
        if( (format == 0 || format == 1 || format == 2) 
           && mmtAdaptor.setDirectionProtocolFlow(msg, config.ip_server, config.network_mask) == null){
            console.log("[DONOT] " + message)
            return;
        }
        
        //this is used by api
        router.api.lastPacketTimestamp = msg[3] * 1000;    //timeestamp
        
        msg = mmtAdaptor.formatReportItem( msg );

        db.addProtocolStats(msg, function (err, err_msg) {});
    });
};

module.exports = router;
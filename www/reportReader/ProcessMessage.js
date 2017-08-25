/**
 *  
 */

"use strict";
const mmtAdaptor = require('../libs/dataAdaptor');
const config     = require('../libs/config');
const ip2loc     = require('../libs/ip2loc');
const DataBase   = require("./DataBase.js");
const router = {};
const COL = mmtAdaptor.StatsColumnId;
const _IS_OFFLINE = (config.probe_analysis_mode === "offline");


function setDirectionStatFlowByIP( msg ){

   msg[ COL.IP_SRC_INIT_CONNECTION ] = true;
   
   if ( ip2loc.isLocal( msg[COL.IP_SRC] ) )
     return msg;

   if ( ip2loc.isLocal( msg[COL.IP_DEST] ) ){
     msg[ COL.IP_SRC_INIT_CONNECTION ] = false;
     return mmtAdaptor.inverseStatDirection( msg )
   }

   return msg;
};

//DONOT remove this block
//this is for sending data to web clients vi socketio
var caches = {};
function send_to_client( channel, msg ){
	if( caches[ channel ] == undefined )
		caches[ channel ] = [];
	//add msg to caches
	//caches will be verified each seconds and sent to client
	//caches[ channel ].push( msg );
}

setInterval( function(){
	for( var channel in caches ){
		var cache = caches[ channel ];
		//no data in this cache
		if( cache.length == 0 )
			continue;
		//avg
		if (channel === "qos" ){
			for( var j=1; j<cache.length; j++)
				for( var i=4; i<13;i++ )
					cache[0][i] += cache[j][i];

			for( var i=4; i<13;i++ )
				if( i != 9 || i != 10 )
					cache[0][i] /= cache.length;

			//router.socketio.emit( "qos", cache[0] );
		}else {
			//router.socketio.emit( channel, cache );
		}

		//reset this cache to zero
		caches[ channel ] = [];
	}
}, 1000);
//end caches


function ProcessMessage( database ){
	const self       = this;
	const _database  = database; 

	/**
	 * Process a message report generated by MMT-Probe:
	 * 	- insert the message to DB
	 *  - send it directly to Web client if need
	 * @param message
	 * @returns
	 */
	self.process = function( message ) {
		//console.log( message );
		//message = message.replace(/\(null\)/g, 'null');
		var msg = mmtAdaptor.formatMessage( '[' + message + ']' );

		if( msg === null )
			return;

		//For each kind of message
		switch( msg[0] ){
		/*
        case mmtAdaptor.CsvFormat.NO_SESSION_STATS_FORMAT:
            if( config.only_ip_session === true ){
                //console.log( message );
                return;
            }
            break;
		 */
		case mmtAdaptor.CsvFormat.STATS_FORMAT:
			/*
            if (msg[4] == 0) {
                console.log("[META  ] " + message);
                return;
            }

            if( msg[ COL.IP_SRC ] === "undefined" ){
                console.log("[DONT 1] " + message);
                return;
            }
			 */
			if( setDirectionStatFlowByIP(msg) === null) {
				//console.log("[DONT KNOW DIRECTION] " + message);
				//return;
			}
			break;

			//does not use these kind of reports
			/*
		case mmtAdaptor.CsvFormat.DEFAULT_APP_FORMAT:
		case mmtAdaptor.CsvFormat.WEB_APP_FORMAT:
		case mmtAdaptor.CsvFormat.SSL_APP_FORMAT:
			return;
			 */

			//behaviour: changing bandwidth
		case mmtAdaptor.CsvFormat.BA_BANDWIDTH_FORMAT:
			if( msg[ mmtAdaptor.BehaviourBandwidthColumnId.VERDICT ] == "NO_CHANGE_BANDWIDTH" ||
					msg[ mmtAdaptor.BehaviourBandwidthColumnId.BW_BEFORE ] == msg[ mmtAdaptor.BehaviourBandwidthColumnId.BW_AFTER ] || msg[ mmtAdaptor.BehaviourBandwidthColumnId.IP ] === "undefined" ){
				console.log( message )
				return;
				//console.log( mmtAdaptor.formatReportItem( msg ) );
			}
			break;

			//behaviour: changing profile
		case mmtAdaptor.CsvFormat.BA_PROFILE_FORMAT:
			if(     msg[ mmtAdaptor.BehaviourProfileColumnId.VERDICT ] === "NO_CHANGE_CATEGORY"
				//|| msg[ mmtAdaptor.BehaviourProfileColumnId.VERDICT ] === "NO_ACTIVITY_BEFORE"
				|| msg[ mmtAdaptor.BehaviourProfileColumnId.IP ]      === "undefined" ){
				console.log( message );
				return;
				//console.log( mmtAdaptor.formatReportItem( msg ) );
			}
			break;

			//license information
		case mmtAdaptor.CsvFormat.LICENSE:
			//if( typeof databaseadmin )
			//	databaseadmin.insertLicense( mmtAdaptor.formatReportItem( msg ));
			break;

			//Video QoS
		case mmtAdaptor.CsvFormat.OTT_QOS:
			send_to_client( "qos", msg );
			break;
			//Security alerts
		case mmtAdaptor.CsvFormat.SECURITY_FORMAT:
			send_to_client( "security", msg );
		}

		//TODO: to be remove, this chages probe ID, only for Thales demo
		//msg[1] = "Sodium";

		//to test mult-probe
		//msg[1] = Math.random() > 0.5 ? 1 : 0;

		//_TODO: re-enable this
		_database.add(msg, function (err, err_msg) {});
		msg = null;
	};
}

module.exports = ProcessMessage;
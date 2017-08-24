/**
 * Insert Messages to Database 
 */

"use strict";

const config    = require("../libs/config"),
dataAdaptor     = require('../libs/dataAdaptor'),
tools           = require("../libs/tools"),
ip2loc          = require("../libs/ip2loc"),
CONST           = require("../libs/constant"),
DataCache       = require("./Cache"),
DBInserter      = require("./DBInserter"),
FORMAT          = require('util').format;
const IP        = new (require("../libs/shared/IP.js"));

const COL      = dataAdaptor.StatsColumnId;
const HTTP     = dataAdaptor.HttpStatsColumnId;
const NDN      = dataAdaptor.NdnColumnId;
const TLS      = dataAdaptor.TlsStatsColumnId;
const RTP      = dataAdaptor.RtpStatsColumnId;
const FTP      = dataAdaptor.FtpStatsColumnId;
const LICENSE  = dataAdaptor.LicenseColumnId;
const OTT      = dataAdaptor.OTTQoSColumnId;
const STAT     = dataAdaptor.StatColumnId;

const FORMAT_ID = COL.FORMAT_ID,
PROBE_ID      = COL.PROBE_ID,
SOURCE_ID     = COL.SOURCE_ID,
TIMESTAMP     = COL.TIMESTAMP,
REPORT_NUMBER = COL.REPORT_NUMBER;

//list of protocols (not application)
//this list is used to filter out applications.
//collections "data_protocol_*" store only protocols
const PURE_PROTOCOLS =  [
    30,81,82,85,99,
    117,153,154,155,163,164,166,169,170,178,179,180,181,182,183,196,198,
    228,231,241,247,272,273,298,299,
    314,322,323,324,325,339,340,341,354,357,358,363,376,388,
    461,
    625,626,627,628
];

const DOUBLE_STAT_PERIOD_IN_MS = config.probe_stats_period_in_ms*1000*2;

const FLOW_SESSION_INIT_DATA = {};//init data of each session

//all columns of HTTP, SSL,RTP et FTP
//attributes will be stored in data_session collection
const initSessionSet = [];
for( var i = COL.FORMAT_TYPE ; i <= FTP.RESPONSE_TIME; i++){
	if( dataAdaptor.objectHasAttributeWithValue( COL, i)      == undefined
			&&  dataAdaptor.objectHasAttributeWithValue( HTTP, i)    == undefined
			&&  dataAdaptor.objectHasAttributeWithValue( NDN, i)     == undefined
			&&  dataAdaptor.objectHasAttributeWithValue( TLS, i)     == undefined
			&&  dataAdaptor.objectHasAttributeWithValue( RTP, i)     == undefined
			&&  dataAdaptor.objectHasAttributeWithValue( FTP, i)     == undefined
			&&  dataAdaptor.objectHasAttributeWithValue( LICENSE, i) == undefined
			&&  dataAdaptor.objectHasAttributeWithValue( OTT, i)     == undefined
	) continue;

	//exclude set
	if( [ HTTP.RESPONSE_TIME, HTTP.TRANSACTIONS_COUNT, HTTP.REQUEST_INDICATOR,
		FTP.RESPONSE_TIME ].indexOf( i ) >= 0 )
		continue;

	initSessionSet.push( i );
}
initSessionSet.push( COL.START_TIME );

/**
 * Flat an application path
 * @param str : application path, e.g., ETH.IP.TCP.HTTP
 * @returns an array contains all children paths, e.g., [ETH, ETH.IP, ETH.IP.TCP, ETH.IP.TCP.HTTP] 
 */
function flatAppPath( str ){
	if( str == undefined )
		return [];

	var arr = [ {path: str, app: dataAdaptor.getAppIdFromPath( str ), depth: (str.match(/\./g)||[]).length} ];
	do{
		str = dataAdaptor.getParentPath( str );
		if( str === "." )
			//we reach root
			return arr;
		arr.push( {path: str, app: dataAdaptor.getAppIdFromPath( str ), depth: (str.match(/\./g)||[]).length} );
	} while( true );

	return arr;
}

module.exports = function(){
	const self     = this;
	const inserter = new DBInserter( config.databaseName );
	//count number of reports containing only one packet
	var no_1_packet_reports = 0;
	self.dataCache = {
			total: new DataCache( inserter, "data_total",
					{
				key: [COL.FORMAT_ID, COL.PROBE_ID],
				inc: [COL.UL_DATA_VOLUME, COL.DL_DATA_VOLUME,
					COL.UL_PAYLOAD_VOLUME, COL.DL_PAYLOAD_VOLUME,
					COL.UL_PACKET_COUNT, COL.DL_PACKET_COUNT,
					COL.DATA_VOLUME, COL.PACKET_COUNT,
					COL.ACTIVE_FLOWS
					],
					}
					),
			mac: new DataCache( inserter, "data_mac",
					{
				key: [COL.PROBE_ID, COL.MAC_SRC],
				inc: [COL.UL_DATA_VOLUME, COL.DL_DATA_VOLUME,
					COL.UL_PAYLOAD_VOLUME, COL.DL_PAYLOAD_VOLUME,
					COL.UL_PACKET_COUNT, COL.DL_PACKET_COUNT,
					COL.DATA_VOLUME, COL.PACKET_COUNT,
					COL.ACTIVE_FLOWS
					],
				set: ["isGen"],
				init: [COL.START_TIME]
					},
					CONST.period.REAL
			),
			protocol: new DataCache( inserter, "data_protocol",
					{
				key: [COL.FORMAT_ID, COL.PROBE_ID, COL.APP_PATH],
				inc: [COL.UL_DATA_VOLUME, COL.DL_DATA_VOLUME,
					COL.UL_PAYLOAD_VOLUME, COL.DL_PAYLOAD_VOLUME,
					COL.UL_PACKET_COUNT, COL.DL_PACKET_COUNT,
					COL.DATA_VOLUME, COL.PACKET_COUNT,
					COL.ACTIVE_FLOWS
					],
				set: [COL.APP_ID, "proto_depth"]
					}
			),
			app: new DataCache( inserter, "data_app",
					{
				key: [COL.FORMAT_ID, COL.PROBE_ID, COL.APP_PATH],
				inc: [COL.UL_DATA_VOLUME, COL.DL_DATA_VOLUME,
					COL.UL_PAYLOAD_VOLUME, COL.DL_PAYLOAD_VOLUME,
					COL.UL_PACKET_COUNT, COL.DL_PACKET_COUNT,
					COL.DATA_VOLUME, COL.PACKET_COUNT,
					COL.ACTIVE_FLOWS
					],
				set: ["isGen", "app_paths", COL.APP_ID, COL.PROFILE_ID]
					}
			),
			ip: new DataCache( inserter, "data_ip", 
					{
				key: [COL.PROBE_ID, COL.IP_SRC],
				inc: [COL.UL_DATA_VOLUME, COL.DL_DATA_VOLUME,
					COL.UL_PAYLOAD_VOLUME, COL.DL_PAYLOAD_VOLUME,
					COL.UL_PACKET_COUNT, COL.DL_PACKET_COUNT,
					COL.DATA_VOLUME, COL.PACKET_COUNT,
					COL.ACTIVE_FLOWS
					],
				set: ["isGen", COL.MAC_SRC]
					}
			),
			location: new DataCache( inserter, "data_location", 
					{
				key: [COL.PROBE_ID, COL.DST_LOCATION],
				inc: [COL.UL_DATA_VOLUME, COL.DL_DATA_VOLUME,
					COL.UL_PAYLOAD_VOLUME, COL.DL_PAYLOAD_VOLUME,
					COL.UL_PACKET_COUNT, COL.DL_PACKET_COUNT,
					COL.DATA_VOLUME, COL.PACKET_COUNT,
					COL.ACTIVE_FLOWS
					],
					}
			),
			//a link between 2 IPs
			link: new DataCache( inserter, "data_link", 
					{
				key: [COL.PROBE_ID, COL.IP_SRC, COL.IP_DEST ],
				inc: [COL.UL_DATA_VOLUME, COL.DL_DATA_VOLUME,
					COL.UL_PAYLOAD_VOLUME, COL.DL_PAYLOAD_VOLUME,
					COL.UL_PACKET_COUNT, COL.DL_PACKET_COUNT,
					COL.DATA_VOLUME, COL.PACKET_COUNT,
					COL.ACTIVE_FLOWS
					],
				set: [COL.SRC_LOCATION, COL.DST_LOCATION, COL.IP_SRC, COL.IP_DEST]
					}
			),
			reports: new DataCache( inserter, "reports",
					{}, 
					CONST.period.SPECIAL //keep original reports
			),
			
			//system statistics
			sysStat: new DataCache( inserter, "data_stat",
					{
				key: [STAT.FORMAT_ID, STAT.PROBE_ID],
				inc: [STAT.CPU_USER, STAT.CPU_SYS, STAT.CPU_IDLE, STAT.MEM_AVAIL, STAT.MEM_TOTAL, STAT.COUNT],
					}
			),
			//for DOCTOR project
			//TODO to remove
			ndn: new DataCache( inserter, "data_ndn",
					{
				key: [COL.FORMAT_ID, COL.PROBE_ID, NDN.PACKET_ID],
				inc: [NDN.CAP_LEN, NDN.NDN_DATA, NDN.INTEREST_NONCE, NDN.INTEREST_LIFETIME, NDN.DATA_FRESHNESS_PERIOD],
				set: [NDN.MAC_SRC, NDN.NAME, NDN.MAC_DEST, NDN.PARENT_PROTO, NDN.IP_SRC, NDN.IP_DEST,
					NDN.QUERY, NDN.PACKET_TYPE, NDN.IFA]
					}
			),
			
			//MUSA project
			//TODO to remove
			avail: new DataCache( inserter, "data_availability",
					{
				key: [COL.FORMAT_ID, COL.PROBE_ID, COL.SOURCE_ID],
				inc: [4, 5, 6 ]
					}
			),
	};
	
	/**
	 * Add a new message to DB
	 */
	self.add = function( message, callback ){
		var msg = dataAdaptor.formatReportItem( message );

		const ts       = msg[ TIMESTAMP ];
		const format   = msg[ FORMAT_ID ];
		const probe_id = msg[ PROBE_ID ];

		var msg2;
		var is_micro_flow = false;

		switch( format ){

			//System statistic: CPU, memory
		case dataAdaptor.CsvFormat.SYS_STAT_FORMAT:
			self.dataCache.sysStat.addMessage( msg );
			return;

		case dataAdaptor.CsvFormat.BA_BANDWIDTH_FORMAT:
		case dataAdaptor.CsvFormat.BA_PROFILE_FORMAT:
			//insert directly to DB
			inserter.add("behaviour", [msg] );
			return;

		case dataAdaptor.CsvFormat.SECURITY_FORMAT:
			inserter.add("security", [msg] );
			return;

		case dataAdaptor.CsvFormat.OTT_QOS:
			inserter.add("ott_qos", [msg] );
			return;

			//NDN protocol
		case 625:
			self.dataCache.ndn.addMessage( msg );
			//IFA: store all alerts

			const new_msg = {};
			//copy some attrs of msg to new_msg;
			[ COL.PROBE_ID, COL.TIMESTAMP, NDN.MAC_SRC, NDN.IFA ].forEach( function(el){
				new_msg[ el ] = msg[ el ];
			} )

			inserter.add( "ndn_alerts", [new_msg] );

			return;
			//MUSA project
		case 50:
			self.dataCache.avail.addMessage( msg );
			return;
			//statistic reports

			//receive this msg when probe is starting
		case dataAdaptor.CsvFormat.LICENSE:
			//new running period
			//this report is sent at each end of x seconds (after seding all other reports)
		case dataAdaptor.CsvFormat.DUMMY_FORMAT:
			if( no_1_packet_reports > 0 ){
				console.log("Number of reports containing only 1 packet: " + no_1_packet_reports );
				no_1_packet_reports  = 0;
			}
			
			inserter.add("probe_status", [msg] );
			
			//add dummy message to the cache to push them to DB
			self.dataCache.total.addMessage( msg );
			self.dataCache.mac.addMessage( msg );
			self.dataCache.protocol.addMessage( msg );
			self.dataCache.ip.addMessage( msg );
			self.dataCache.app.addMessage( msg );
			self.dataCache.location.addMessage( msg );
			self.dataCache.link.addMessage( msg );
			self.dataCache.reports.addMessage( msg );
			return;

		case 99:
		case 100:

			//a dummy report when session expired
			if( msg[ COL.PACKET_COUNT ] === 0 ){
				return;
			}
			else if( msg[ COL.PACKET_COUNT ] === 1 ){
				no_1_packet_reports ++;
			}

			//original message
			self.dataCache.reports.addMessage( msg );
			
			//this is original message comming from mmt-probe
			msg.isGen = false;
			
			//as 2 threads may produce a same session_ID for 2 different sessions
			//this ensures that session_id is uniqueelse
			msg[ COL.SESSION_ID ] = msg[ COL.SESSION_ID ] + "-" + msg[ COL.THREAD_NUMBER ];
			
			//one msg is a report of a session
			//==> total of them are number of active flows at the sample interval
			msg[ COL.ACTIVE_FLOWS ] = 1;
			
			//total traffic
			self.dataCache.total.addMessage( msg );

			//session
			if( format === 100 ){
				//console.log( msg[ COL.DATA_TRANSFER_TIME ] )
				msg._ip_dest = msg[ COL.IP_DEST ];
				
				msg[ COL.IP_SRC ]  = IP.string2NumberV4( msg[COL.IP_SRC]  );
				msg[ COL.IP_DEST ] = IP.string2NumberV4( msg[COL.IP_DEST] );
				
				//this should not happen
				//if( msg[ COL.DATA_TRANSFER_TIME ] > DOUBLE_STAT_PERIOD_IN_MS )
				//	msg[ COL.DATA_TRANSFER_TIME ] = 0;

				//HTTP
				if( msg[ COL.FORMAT_TYPE ] === 1 ){
					//each HTTP report is a unique session (1 request - 1 resp if it has)
					if( !is_micro_flow )
						msg[ COL.SESSION_ID ] = msg[ COL.SESSION_ID ] + "-" + msg[ HTTP.TRANSACTIONS_COUNT ];
					//mmt-probe: HTTP.TRANSACTIONS_COUNT: number of request/response per one TCP session

					//same as ACTIVE_FLOWS
					//mmt-operator: sum = number of req/res per 5 seconds
					msg[ HTTP.TRANSACTIONS_COUNT ] = 1;//one msg is a report of a transaction

					//HTTP data is not yet completely transfered
					//if( msg[ HTTP.REQUEST_INDICATOR ] === 0 ){
					//this msg reports a part of HTTP transaction
					//==> we reset its RESPONSE_TIME to zero as it was reported
					//msg[ HTTP.RESPONSE_TIME ] = 0;
					//}
				}
				
				//traffic of local IP
				//do not add report 99 to data_ip collection as it has no IP
				self.dataCache.ip.addMessage( msg );

	         /////////////////////////////////////////////////////////////
				//symetric link between 2 IPs
				if(  msg[ COL.IP_SRC ] <  msg[ COL.IP_DEST ] )
				   self.dataCache.link.addMessage( msg );
				else{
				   msg = dataAdaptor.inverseStatDirection( msg );
				   self.dataCache.link.addMessage( msg );
				   //revert
				   msg = dataAdaptor.inverseStatDirection( msg );
				}
		      /////////////////////////////////////////////////////////////
				
				//destination location
				self.dataCache.location.addMessage( msg );
			}
			
			self.dataCache.mac.addMessage( msg );

			///////////////////////////////////////////////////////////////
			//expand application path: 
			var app_arr = flatAppPath( msg[ COL.APP_PATH ] );
			
			const original_app_id = msg[ COL.APP_ID ],
				  original_path   = msg[ COL.APP_PATH ]; 
			//add to protocols collections
			for( var i=0; i<app_arr.length; i++ ){
				var o = app_arr[i];
				//this is a protocol
				if( PURE_PROTOCOLS.indexOf( o.app ) != -1){
					//save msg with the new app_id and its path
					msg[ COL.APP_ID ]   = o.app;
					msg[ COL.APP_PATH ] = o.path;
					msg.proto_depth     = o.depth;
					self.dataCache.protocol.addMessage( msg );
				}
			}
			
			delete( msg.proto_depth );
			//restore original app_id and its path
			msg[ COL.APP_ID ]   = original_app_id;
			msg[ COL.APP_PATH]  = original_path;
			
			
			msg.app_paths = app_arr;
			
			self.dataCache.app.addMessage( msg );
         ///////////////////////////////////////////////////////////////
			
			//each session
			//self.dataCache.session.addMessage( msg );
			//self.dataCache.detail.addMessage(  msg );
			

			if( !is_micro_flow ){
				//add traffic for the other side (src <--> dest )
				msg.isGen = true;
				msg = dataAdaptor.inverseStatDirection( msg );
				
				//change session_id of this clone message
				msg[ COL.SESSION_ID ] = "-" + msg[ COL.SESSION_ID ];

				self.dataCache.mac.addMessage( msg );
				
				//only if its partner is local
				if( ip2loc.isLocal( msg._ip_dest )){
					//do not add report 99 to data_ip collection as it has no IP
					if( format === 100 )
						self.dataCache.ip.addMessage( msg );
					//self.dataCache.session.addMessage( msg );
					//self.dataCache.detail.addMessage(  msg );
				}
			}
			return;
		}
	}

};
var ipLib  = require("ip");
var config = require("../config.json");
/** Class: MMTDrop
 *  An object container for all MMTDrop library functions.
 *
 *  This class is just a container for all the objects and constants
 *  used in the library.  It is not meant to be instantiated, but to
 *  provide a namespace for library objects, constants, and functions.
 */

var MMTDrop = {

    /**
     * Constants: MMTDrop defined csv format types
     */
    CsvFormat : {
        DEFAULT_APP_FORMAT      : 0/**< Default application flow report format id */,
        WEB_APP_FORMAT          : 1/**< WEB flow report format id */,
        SSL_APP_FORMAT          : 2/**< SSL flow report format id */,
        RTP_APP_FORMAT          : 3/**< RTP flow report format id */,
        MICROFLOWS_STATS_FORMAT : 8/**< Micro flows statistics format id */,
        RADIUS_REPORT_FORMAT    : 9/**< RADIUS protocol control format id */,
        STATS_FORMAT            : 100/**< Statistics format id */,
        SECURITY_FORMAT         : 10,
        BA_PROFILE_FORMAT       : 12,
        BA_BANDWIDTH_FORMAT     : 11,
        LICENSE                 : 30,
    },
    
    isFlowStats : function ( format ) {
        switch (format) {
            case MMTDrop.CsvFormat.DEFAULT_APP_FORMAT :
            case MMTDrop.CsvFormat.WEB_APP_FORMAT :
            case MMTDrop.CsvFormat.SSL_APP_FORMAT :
            case MMTDrop.CsvFormat.RTP_APP_FORMAT :
                return true;
            default :
                return false;
        }
    },
    
    /**
     * Constants: MMTDrop defined csv format types
     */
    StatsColumnId           : {
        FORMAT_ID           : 0, /**< Index of the format id column */
        PROBE_ID            : 1, /**< Index of the probe id column */
        SOURCE_ID           : 2, /**< Index of the data source id column */
        TIMESTAMP           : 3, /**< Index of the format id column */
        APP_ID              : 4, /**< Index of the application id column */
        APP_PATH            : 5, /**< Index of the application path column */
        ACTIVE_FLOWS        : 6, /**< Index of the active flows column */
        DATA_VOLUME         : 7, /**< Index of the data volume column */
        PAYLOAD_VOLUME      : 8, /**< Index of the payload data volume column */
        PACKET_COUNT        : 9, /**< Index of the packet count column */
        UL_DATA_VOLUME      : 10, /**< Index of the data volume column */
        UL_PAYLOAD_VOLUME   : 11, /**< Index of the payload data volume column */
        UL_PACKET_COUNT     : 12, /**< Index of the packet count column */
        DL_DATA_VOLUME      : 13, /**< Index of the data volume column */
        DL_PAYLOAD_VOLUME   : 14, /**< Index of the payload data volume column */
        DL_PACKET_COUNT     : 15, /**< Index of the packet count column */
        START_TIME          : 16, /**< Index of the start timestamp of the flow */
        IP_DEST             : 17, /**< Index of the IP address destination column */
        IP_SRC              : 18, /**< Index of the IP address source column */
        MAC_SRC             : 19, /**< Index of the MAC address source column */
        MAC_DEST            : 20, /**< Index of the MAC address destination column */
        SESSION_ID:21,
        PORT_DEST:22,
        PORT_SRC: 23
    },
    
    SecurityColumnId           : {
        FORMAT_ID               : 0, /**< Index of the format id column */
        PROBE_ID                : 1, /**< Index of the probe id column */
        SOURCE_ID               : 2, /**< Index of the data source id column */
        TIMESTAMP               : 3, /**< Index of the format id column */
        PROPERTY                : 4, /**< Index of the application id column */
        VERDICT                 : 5,
        TYPE                    : 6,
        DESCRIPTION             : 7,
        HISTORY                 : 8,
        VERDICT_COUNT           : 9
    },
    BehaviourBandwidthColumnId           : {
        FORMAT_ID               : 0, /**< Index of the format id column */
        PROBE_ID                : 1, /**< Index of the probe id column */
        SOURCE_ID               : 2, /**< Index of the data source id column */
        TIMESTAMP               : 3, /**< Index of the format id column */
        PROPERTY                : 4, /**< Index of the application id column */
        IP                      : 5,
        APP                     : 6,
        BW_BEFORE               : 7,
        BW_AFTER                : 8,
        VERDICT                 : 9,
        DESCRIPTION             : 10
    },
    BehaviourProfileColumnId           : {
        FORMAT_ID               : 0, /**< Index of the format id column */
        PROBE_ID                : 1, /**< Index of the probe id column */
        SOURCE_ID               : 2, /**< Index of the data source id column */
        TIMESTAMP               : 3, /**< Index of the format id column */
        PROPERTY                : 4, /**< Index of the application id column */
        IP                      : 5,
        PROFILE_BEFORE          : 6,
        PROFILE_AFTER           : 7,
        BW_BEFORE               : 8,
        BW_AFTER                : 9,
        VERDICT                 : 10,
        DESCRIPTION             : 11
    },
    /**
     * Constants: MMTDrop defined Flow based csv format (format 0, and common part of 1, 2, 3)
     */
    FlowStatsColumnId           : {
        FORMAT_ID               : 0, /**< Index of the format id column */
        PROBE_ID                : 1, /**< Index of the probe id column */
        SOURCE_ID               : 2, /**< Index of the data source id column */
        TIMESTAMP               : 3, /**< Index of the format id column */
        FLOW_ID                 : 4, /**< Index of the flow id column */
        START_TIME              : 5, /**< Index of the flow start time */
        IP_VERSION              : 6, /**< Index of the IP version number column */
        SERVER_ADDR             : 7, /**< Index of the server address column */
        CLIENT_ADDR             : 8, /**< Index of the client address column */
        SERVER_PORT             : 9, /**< Index of the server port column */
        CLIENT_PORT             : 10, /**< Index of the client port column */

        //IS_LOCAL                : 11, /** 0 (if not a local address), 1 (local address,server),2 (local address,client),3 (local address,both server and client)*/

        TRANSPORT_PROTO         : 11, /**< Index of the transport protocol identifier column */
        UL_PACKET_COUNT         : 12, /**< Index of the uplink packet count column */
        DL_PACKET_COUNT         : 13, /**< Index of the downlink packet count column */
        UL_DATA_VOLUME          : 14, /**< Index of the uplink data volume column */
        DL_DATA_VOLUME          : 15, /**< Index of the downlink data volume column */
        TCP_RTT                 : 16, /**< Index of the TCP round trip time column */
        RETRANSMISSION_COUNT    : 17, /**< Index of the retransmissions count column */
        APP_FAMILY              : 18, /**< Index of the application family column */
        CONTENT_CLASS           : 19, /**< Index of the content class column */
        PROTO_PATH              : 20, /**< Index of the protocol path column */
        APP_NAME                : 21, /**< Index of the application name column */
        APP_FORMAT_ID           : 22, /**< Index of the start of the application specific statistics (this is not a real column, rather an index) */
    },
    
    HttpStatsColumnId : {
        RESPONSE_TIME       : 0, /**< Index of the response time column */
        TRANSACTIONS_COUNT  : 1, /**< Index of the HTTP transactions count (req/res number) column */
        INTERACTION_TIME    : 2, /**< Index of the interaction time (between client and server) column */
        HOSTNAME            : 3, /**< Index of the hostname column */
        MIME_TYPE           : 4, /**< Index of the MIME type column */
        REFERER             : 5, /**< Index of the Referer column */
        DEVICE_OS_ID        : 6, /**< Index of the device and operating system ids column */
        CDN_FLAG            : 7, /**< Index of the is CDN delivered column */
    },
    
    TlsStatsColumnId : {
        SERVER_NAME : 0, /**< Index of the format id column */
        CDN_FLAG    : 1, /**< Index of the format id column */
    },
    
    RtpStatsColumnId : {
        PACKET_LOSS_RATE        : 0, /**< Index of the format id column */
        PACKET_LOSS_BURSTINESS  : 1, /**< Index of the format id column */
        MAX_JITTER              : 2,
    },
   
     LicenseColumnId           : {
        FORMAT_ID                       : 0, /**< Index of the format id column */
        PROBE_ID                        : 1, /**< Index of the probe id column */
        SOURCE_ID                       : 2, /**< Index of the data source id column */
        TIMESTAMP                       : 3, /**< Index of the format id column */
        LICENSE_INFO_ID                 : 4, /**< Index of the application id column */
        NUMBER_OF_MAC                   : 5,
        MAC_ADDRESSES                   : 6,
        EXPIRY_DATE                     : 7
    },
    /**
     * Return the parent of the given protocol path. <br>
     * ("1.2" is the parent of "1.2.3"; "." is the parent of "1")
     * @param path application protocol path
     */
    getParentPath : function(path) {
        var n = path.lastIndexOf(".");
        if (n == -1) {
            return ".";
        } else {
            var p = path.substring(0, n);
            return p;
        }
    },

    /**
     * Return the child of the given protocol path. <br>
     * ("2.3" is the child of "1.2.3"; "." is the child of "1")
     * @param path application protocol path
     */
    getChildPath : function(path) {
        var n = path.indexOf(".");
        if (n == -1) {
            return ".";
        } else {
            var child = path.substring(n + 1, path.toString().length);
            return child;
        }
    },
    
    /**
     * Returns the root application id given the application path.
     * @param {Object} path application protocol path
     */
    getRootAppId : function(path) {
        var n = path.toString().indexOf(".");
        if (n == -1) {
            return path;
        } else {
            return path.toString().substring(0, n);
        }
    },
    
    getAppLevelFromPath : function( path ){
        var count = 0;
        for( var j=0; j<path.length; j++){
            if( path[ j ] === '.') count ++;
        }
        return count;
    },

    /**
     * Return the path friendly name. <br>
     * @param path application protocol path (given by application IDs)
     */
    getPathFriendlyName : function(path) {
        var root = MMTDrop.getRootAppId(path);
        var friendlyName = MMTDrop.ProtocolsIDName[root];
        var child = MMTDrop.getChildPath(path);
        while(root != path && child != "." && root != "" && root != ".") {
            root = MMTDrop.getRootAppId(child);
            child = MMTDrop.getChildPath(child);
            friendlyName = friendlyName + '.' + MMTDrop.ProtocolsIDName[root];
        }
        return friendlyName;
    },

    /**
     * Returns the application id given the application path.
     * @param {Object} path application protocol path
     */
    getAppIdFromPath : function(path) {
        var n = path.lastIndexOf(".");
        return parseInt( path.substring(n + 1, path.length) );
    },

    /**
     * Returns the application name given the application path.
     * @param {Object} path application protocol path
     */
    getAppName : function(path) {
        var n = path.toString().lastIndexOf(".");
        return MMTDrop.ProtocolsIDName[path.toString().substring(n + 1, path.toString().length)];
    },
    
    /**
     * Returns the parent application name given the application path. <br>
     * If the application parent does not exist (path equal to root application), -1 is returned.
     * @param {Object} path
     */
    getParentApp : function(path) {
        var parent = this.getParentPath(path);
        if (parent == ".")
            return -1;
        return this.getAppId(parent);
    },
    
    /**
     * Returns the protocol path from the given statistics report entry
     * @param {Object} entry statistics report entry
     */
    getEntryPath : function(entry) {
        return entry[MMTDrop.StatsColumnId.APP_PATH];
    },
    
    /**
     * Maps the Protocol ID to a Protocol Name
     * @param {number} id
     * @returns {string} Protocol Name
     */
    getProtocolNameFromID : function(id) {
        var protocolName;
        protocolName = ( id in MMTDrop.ProtocolsIDName) ? MMTDrop.ProtocolsIDName[id] : 'NaP';
        return protocolName;
    },
    
    /**
     * Maps the Protocol Name to a Protocol ID
     * @param {string} protocolName
     * @returns {number} id
     */
    getProtocolIDFromName : function(protocolName) {
        var protocolID;
        protocolID = ( protocolName in MMTDrop.ProtocolsNameID) ? MMTDrop.ProtocolsNameID[protocolName] : 'NaP';
        return protocolID;
    },
    
    /**
     * Returns the first element that was inserted in the given array
     */
    get1stElem : function(data) {
        for (var prop in data)
            if (data.propertyIsEnumerable(prop))
                return prop;
    },
    
    setDirectionStatFlowByIP: function( msg ){
        if( config.local_network == null )
            return msg;
        
        var COL       = this.StatsColumnId;
        
        if( this.isLocalIP( msg[COL.IP_SRC] )  )
            return msg;
        else if ( this.isLocalIP( msg[COL.IP_DEST] ) ){
            return this.inverseStatDirection( msg )
        }
        return null;
    },
    
    isLocalIP : function( ip ){
        if( ip === undefined || ip === "undefined")
            return false;
        
        if( this._localIPs === undefined ){
            var rootsIP = [];
            for( var i in config.local_network ){
                var lo   = config.local_network[i];
                var root = ipLib.mask(lo.ip, lo.mask);

                rootsIP.push(  {root: root, mask: lo.mask } );
            }
            this._localIPs = rootsIP;
        }
        
        for( var i in this._localIPs ){
            var lo = this._localIPs[ i ];
            if( ipLib.mask( ip, lo.mask ) == lo.root )
                return true;
        }
        return false;  
    },
    inverseStatDirection: function( msg ){
        var COL       = this.StatsColumnId;
        //Permute DL <--> UL
        var tmp = msg[COL.IP_SRC];
        //change direction
        msg[COL.IP_SRC]  = msg[COL.IP_DEST];
        msg[COL.IP_DEST] = tmp;

        var tmp = msg[COL.MAC_SRC];
        //change direction
        msg[COL.MAC_SRC]  = msg[COL.MAC_DEST];
        msg[COL.MAC_DEST] = tmp;
        
        for(var i=0; i<2; i++){
            tmp                           = msg[ COL.UL_DATA_VOLUME + i ];
            msg[ COL.UL_DATA_VOLUME + i ] = msg[ COL.DL_DATA_VOLUME + i ];
            msg[ COL.DL_DATA_VOLUME + i ] = tmp;
        }
        return msg;
    },
    
    //this contains a list of protocols (not applications, for example: GOOGLE, HOTMAIL, ...)
    PureProtocol :  [
        30,81,82,85,99,153,154,155,163,164,166,169,170,178,179,180,181,182,183,196,198,228,
        231,241,247,272,273,298,299,314,322,323,324,325,339,340,341,354,357,358,363,376,388,461,
    ],
    //list of protocols that should have children
    ParentProtocol: [
        99,153,154,155,178,179,180,181,182,
        341,354,376,461,
    ],
};

MMTDrop.LicensePoint = function( entry ){
    var retval = {};
    retval.format                               = entry[MMTDrop.LicenseColumnId.FORMAT_ID];
    retval.probe                                = entry[MMTDrop.LicenseColumnId.PROBE_ID];
    retval.source                               = entry[MMTDrop.LicenseColumnId.SOURCE_ID];
    retval.time                                 = entry[MMTDrop.LicenseColumnId.TIMESTAMP];
    retval.info_id                              = entry[MMTDrop.LicenseColumnId.LICENSE_INFO_ID];
    retval.number_of_mac                        = entry[MMTDrop.LicenseColumnId.NUMBER_OF_MAC];
    retval.mac_addresses                        = entry[MMTDrop.LicenseColumnId.MAC_ADDRESSES];
    retval.expire_date                          = entry[MMTDrop.LicenseColumnId.EXPIRY_DATE];
    return retval;
}

MMTDrop.reverseLicensePoint = function(elem) {
    var retval = [];
    retval[MMTDrop.LicenseColumnId.FORMAT_ID]                    = elem.format;
    retval[MMTDrop.LicenseColumnId.PROBE_ID]                     = elem.probe;
    retval[MMTDrop.LicenseColumnId.SOURCE_ID]                    = elem.source;
    retval[MMTDrop.LicenseColumnId.TIMESTAMP]                    = elem.time;
    retval[MMTDrop.LicenseColumnId.LICENSE_INFO_ID]              = elem.info_id;
    retval[MMTDrop.LicenseColumnId.NUMBER_OF_MAC]                = elem.number_of_mac;
    retval[MMTDrop.LicenseColumnId.MAC_ADDRESSES]                = elem.mac_addresses;
    retval[MMTDrop.LicenseColumnId.EXPIRY_DATE]                  = elem.expire_date;
    return retval;
}

MMTDrop.BehaviourBandwidthPoint = function( entry ){
    var retval = {};
    retval.format                   = entry[MMTDrop.BehaviourBandwidthColumnId.FORMAT_ID];
    retval.probe                    = entry[MMTDrop.BehaviourBandwidthColumnId.PROBE_ID];
    retval.source                   = entry[MMTDrop.BehaviourBandwidthColumnId.SOURCE_ID];
    retval.time                     = entry[MMTDrop.BehaviourBandwidthColumnId.TIMESTAMP];
    retval.property                 = entry[MMTDrop.BehaviourBandwidthColumnId.PROPERTY];
    retval.ip                       = entry[MMTDrop.BehaviourBandwidthColumnId.IP];
    retval.description              = entry[MMTDrop.BehaviourBandwidthColumnId.DESCRIPTION];
    retval.verdict                  = entry[MMTDrop.BehaviourProfileColumnId.VERDICT];
    
    retval.app                      = entry[MMTDrop.BehaviourBandwidthColumnId.APP];
    retval.bw_before                = entry[MMTDrop.BehaviourBandwidthColumnId.BW_BEFORE];
    retval.bw_after                 = entry[MMTDrop.BehaviourBandwidthColumnId.BW_AFTER];
    return retval;
};

MMTDrop.reverseBehaviourBandwidthPoint = function(elem) {
    var retval = [];
    retval[MMTDrop.BehaviourBandwidthColumnId.FORMAT_ID]      = elem.format;
    retval[MMTDrop.BehaviourBandwidthColumnId.PROBE_ID]       = elem.probe;
    retval[MMTDrop.BehaviourBandwidthColumnId.SOURCE_ID]      = elem.source;
    retval[MMTDrop.BehaviourBandwidthColumnId.TIMESTAMP]      = elem.time;
    retval[MMTDrop.BehaviourBandwidthColumnId.PROPERTY]       = elem.property;
    retval[MMTDrop.BehaviourBandwidthColumnId.VERDICT]        = elem.verdict;
    retval[MMTDrop.BehaviourBandwidthColumnId.IP]             = elem.ip;
    retval[MMTDrop.BehaviourBandwidthColumnId.DESCRIPTION]    = elem.description;

    retval[MMTDrop.BehaviourBandwidthColumnId.APP]            = elem.app;
    retval[MMTDrop.BehaviourBandwidthColumnId.BW_BEFORE]      = elem.bw_before;
    retval[MMTDrop.BehaviourBandwidthColumnId.BW_AFTER]       = elem.bw_after;
    return retval;
}

MMTDrop.BehaviourProfilePoint = function( entry ){
    var retval = {};
    retval.format                   = entry[MMTDrop.BehaviourProfileColumnId.FORMAT_ID];
    retval.probe                    = entry[MMTDrop.BehaviourProfileColumnId.PROBE_ID];
    retval.source                   = entry[MMTDrop.BehaviourProfileColumnId.SOURCE_ID];
    retval.time                     = entry[MMTDrop.BehaviourProfileColumnId.TIMESTAMP];
    retval.property                 = entry[MMTDrop.BehaviourProfileColumnId.PROPERTY];
    retval.ip                       = entry[MMTDrop.BehaviourProfileColumnId.IP];
    retval.description              = entry[MMTDrop.BehaviourProfileColumnId.DESCRIPTION];
    retval.verdict                  = entry[MMTDrop.BehaviourProfileColumnId.VERDICT];
    
    retval.profile_before           = entry[MMTDrop.BehaviourProfileColumnId.PROFILE_BEFORE];
    retval.profile_after            = entry[MMTDrop.BehaviourProfileColumnId.PROFILE_AFTER];
    retval.bw_before                = entry[MMTDrop.BehaviourProfileColumnId.BW_BEFORE];
    retval.bw_after                 = entry[MMTDrop.BehaviourProfileColumnId.BW_AFTER];
    return retval;
};

MMTDrop.reverseBehaviourProfilePoint = function(elem) {
    var retval = [];
    retval[MMTDrop.BehaviourProfileColumnId.FORMAT_ID]      = elem.format;
    retval[MMTDrop.BehaviourProfileColumnId.PROBE_ID]       = elem.probe;
    retval[MMTDrop.BehaviourProfileColumnId.SOURCE_ID]      = elem.source;
    retval[MMTDrop.BehaviourProfileColumnId.TIMESTAMP]      = elem.time;
    retval[MMTDrop.BehaviourProfileColumnId.PROPERTY]       = elem.property;
    retval[MMTDrop.BehaviourProfileColumnId.VERDICT]        = elem.verdict;
    retval[MMTDrop.BehaviourProfileColumnId.IP]             = elem.ip;
    retval[MMTDrop.BehaviourProfileColumnId.DESCRIPTION]    = elem.description;

    retval[MMTDrop.BehaviourProfileColumnId.PROFILE_BEFORE] = elem.profile_before;
    retval[MMTDrop.BehaviourProfileColumnId.PROFILE_AFTER]  = elem.profile_after;
    retval[MMTDrop.BehaviourProfileColumnId.BW_BEFORE]      = elem.bw_before;
    retval[MMTDrop.BehaviourProfileColumnId.BW_AFTER]       = elem.bw_after;
    return retval;
}

MMTDrop.SecurityPoint = function( entry ){
    var retval = {};
    retval.format                   = entry[MMTDrop.SecurityColumnId.FORMAT_ID];
    retval.probe                    = entry[MMTDrop.SecurityColumnId.PROBE_ID];
    retval.source                   = entry[MMTDrop.SecurityColumnId.SOURCE_ID];
    retval.time                     = entry[MMTDrop.StatsColumnId.TIMESTAMP];
    retval.property                 = entry[MMTDrop.SecurityColumnId.PROPERTY];
    retval.verdict                  = entry[MMTDrop.SecurityColumnId.VERDICT];
    retval.type                     = entry[MMTDrop.SecurityColumnId.TYPE];
    retval.description              = entry[MMTDrop.SecurityColumnId.DESCRIPTION];
    
    retval.history                  = JSON.stringify( entry[MMTDrop.SecurityColumnId.HISTORY] );
    //retval.history                  = "'" + entry[MMTDrop.SecurityColumnId.HISTORY] + "'";
    
    if( entry[MMTDrop.SecurityColumnId.VERDICT_COUNT] )
        retval.verdict_count            = entry[MMTDrop.SecurityColumnId.VERDICT_COUNT];
    else
        retval.verdict_count = 1;
    return retval;
};

MMTDrop.reverseSecurityPoint = function(elem) {
    var retval = [];
    retval[MMTDrop.SecurityColumnId.FORMAT_ID]      = elem.format;
    retval[MMTDrop.SecurityColumnId.PROBE_ID]       = elem.probe;
    retval[MMTDrop.SecurityColumnId.SOURCE_ID]      = elem.source;
    retval[MMTDrop.SecurityColumnId.TIMESTAMP]      = elem.time;
    retval[MMTDrop.SecurityColumnId.PROPERTY]       = elem.property;
    retval[MMTDrop.SecurityColumnId.VERDICT]        = elem.verdict;
    retval[MMTDrop.SecurityColumnId.TYPE]           = elem.type;
    retval[MMTDrop.SecurityColumnId.DESCRIPTION]    = elem.description;
    
    if( elem.history )
        retval[MMTDrop.SecurityColumnId.HISTORY]        = JSON.parse( elem.history );
    
    //retval[MMTDrop.SecurityColumnId.HISTORY]        = elem.history;
    retval[MMTDrop.SecurityColumnId.VERDICT_COUNT]  = elem.verdict_count;
    return retval;
}
MMTDrop.StatsTimePoint = function(entry) {
    var retval = {};
    retval.format               = entry[MMTDrop.StatsColumnId.FORMAT_ID];
    retval.probe                = entry[MMTDrop.StatsColumnId.PROBE_ID];
    retval.source               = entry[MMTDrop.StatsColumnId.SOURCE_ID];
    retval.time                 = entry[MMTDrop.StatsColumnId.TIMESTAMP];
    
    retval.app                  = entry[MMTDrop.StatsColumnId.APP_ID];
    retval.path                 = entry[MMTDrop.StatsColumnId.APP_PATH];

    retval.ul_data              = entry[MMTDrop.StatsColumnId.UL_DATA_VOLUME];
    retval.dl_data              = entry[MMTDrop.StatsColumnId.DL_DATA_VOLUME];
    retval.ul_packets           = entry[MMTDrop.StatsColumnId.UL_PACKET_COUNT];
    retval.dl_packets           = entry[MMTDrop.StatsColumnId.DL_PACKET_COUNT];
    
    retval.ul_payload           = entry[MMTDrop.StatsColumnId.UL_PAYLOAD_VOLUME];
    retval.dl_payload           = entry[MMTDrop.StatsColumnId.DL_PAYLOAD_VOLUME];
    
    retval.active_flowcount     = entry[MMTDrop.StatsColumnId.ACTIVE_FLOWS];

    retval.bytecount            = entry[MMTDrop.StatsColumnId.DATA_VOLUME];
    retval.payloadcount         = entry[MMTDrop.StatsColumnId.PAYLOAD_VOLUME];
    retval.packetcount          = entry[MMTDrop.StatsColumnId.PACKET_COUNT];
    retval.start_time           = entry[MMTDrop.StatsColumnId.START_TIME];
    retval.ip_src               = entry[MMTDrop.StatsColumnId.IP_SRC];
    retval.ip_dest              = entry[MMTDrop.StatsColumnId.IP_DEST];
    retval.mac_src              = entry[MMTDrop.StatsColumnId.MAC_SRC];
    retval.mac_dest             = entry[MMTDrop.StatsColumnId.MAC_DEST];

    retval.session_id           = entry[MMTDrop.StatsColumnId.SESSION_ID];
    retval.port_src             = entry[MMTDrop.StatsColumnId.PORT_SRC];
    retval.port_dest            = entry[MMTDrop.StatsColumnId.PORT_DEST];
    
    return retval;
}

MMTDrop.reverseStatsTimePoint = function(elem) {
    var retval = [];
    retval[MMTDrop.StatsColumnId.FORMAT_ID]         = elem.format;
    retval[MMTDrop.StatsColumnId.PROBE_ID]          = elem.probe;
    retval[MMTDrop.StatsColumnId.SOURCE_ID]         = elem.source;
    retval[MMTDrop.StatsColumnId.TIMESTAMP]         = elem.time;
    retval[MMTDrop.StatsColumnId.APP_ID]            = elem.app;
    retval[MMTDrop.StatsColumnId.APP_PATH]          = elem.path;
    retval[MMTDrop.StatsColumnId.ACTIVE_FLOWS]      = elem.active_flowcount;
    retval[MMTDrop.StatsColumnId.DATA_VOLUME]       = elem.bytecount;
    retval[MMTDrop.StatsColumnId.PAYLOAD_VOLUME]    = elem.payloadcount;
    retval[MMTDrop.StatsColumnId.PACKET_COUNT]      = elem.packetcount;
    retval[MMTDrop.StatsColumnId.UL_PAYLOAD_VOLUME] = elem.ul_payload;
    retval[MMTDrop.StatsColumnId.DL_PAYLOAD_VOLUME] = elem.dl_payload;
    
    retval[MMTDrop.StatsColumnId.UL_DATA_VOLUME]    = elem.ul_data;
    retval[MMTDrop.StatsColumnId.DL_DATA_VOLUME]    = elem.dl_data;
    
    retval[MMTDrop.StatsColumnId.UL_PACKET_COUNT]   = elem.ul_packets;
    retval[MMTDrop.StatsColumnId.DL_PACKET_COUNT]   = elem.dl_packets;
    
    retval[MMTDrop.StatsColumnId.START_TIME]        = elem.start_time;
    
    retval[MMTDrop.StatsColumnId.IP_SRC]            = elem.ip_src;
    retval[MMTDrop.StatsColumnId.IP_DEST]           = elem.ip_dest;
    
    retval[MMTDrop.StatsColumnId.MAC_SRC]           = elem.mac_src;
    retval[MMTDrop.StatsColumnId.MAC_DEST]          = elem.mac_dest;
    
    retval[MMTDrop.StatsColumnId.SESSION_ID]        = elem.session_id;
    
    retval[MMTDrop.StatsColumnId.PORT_SRC]          = elem.port_src;
    retval[MMTDrop.StatsColumnId.PORT_DEST]         = elem.port_dest;
    
    return retval;
};

/**
  * Flow statistics data entry
  */
MMTDrop.FlowStatsItem = function(entry) {
    var retval = {};
    retval.format           = entry[MMTDrop.FlowStatsColumnId.FORMAT_ID];
    retval.probe            = entry[MMTDrop.FlowStatsColumnId.PROBE_ID];
    retval.source           = entry[MMTDrop.FlowStatsColumnId.SOURCE_ID];
    retval.time             = entry[MMTDrop.FlowStatsColumnId.TIMESTAMP];
    retval.fid              = entry[MMTDrop.FlowStatsColumnId.FLOW_ID];
    retval.start_time       = entry[MMTDrop.FlowStatsColumnId.START_TIME];
    retval.ip_version       = entry[MMTDrop.FlowStatsColumnId.IP_VERSION];
    retval.server_addr      = entry[MMTDrop.FlowStatsColumnId.SERVER_ADDR];
    retval.client_addr      = entry[MMTDrop.FlowStatsColumnId.CLIENT_ADDR];
    retval.server_port      = entry[MMTDrop.FlowStatsColumnId.SERVER_PORT];
    retval.client_port      = entry[MMTDrop.FlowStatsColumnId.CLIENT_PORT];
    retval.transport_proto  = entry[MMTDrop.FlowStatsColumnId.TRANSPORT_PROTO];
    retval.ul_data          = entry[MMTDrop.FlowStatsColumnId.UL_DATA_VOLUME];
    retval.dl_data          = entry[MMTDrop.FlowStatsColumnId.DL_DATA_VOLUME];
    retval.ul_packets       = entry[MMTDrop.FlowStatsColumnId.UL_PACKET_COUNT];
    retval.dl_packets       = entry[MMTDrop.FlowStatsColumnId.DL_PACKET_COUNT];
    retval.tcp_rtt          = entry[MMTDrop.FlowStatsColumnId.TCP_RTT];
    retval.retransmission   = entry[MMTDrop.FlowStatsColumnId.RETRANSMISSION_COUNT];
    retval.family           = entry[MMTDrop.FlowStatsColumnId.APP_FAMILY];
    retval.content_class    = entry[MMTDrop.FlowStatsColumnId.CONTENT_CLASS];
    retval.path             = entry[MMTDrop.FlowStatsColumnId.PROTO_PATH];
    retval.app              = entry[MMTDrop.FlowStatsColumnId.APP_NAME];
    return retval;
};

MMTDrop.reverseFlowStatsItem = function(item) {
    var retval = [];
    retval[MMTDrop.FlowStatsColumnId.FORMAT_ID]             = item.format;
    retval[MMTDrop.FlowStatsColumnId.PROBE_ID]              = item.probe;
    retval[MMTDrop.FlowStatsColumnId.SOURCE_ID]             = item.source;
    retval[MMTDrop.FlowStatsColumnId.TIMESTAMP]             = item.time;
    retval[MMTDrop.FlowStatsColumnId.FLOW_ID]               = item.fid;
    retval[MMTDrop.FlowStatsColumnId.START_TIME]            = item.start_time;
    retval[MMTDrop.FlowStatsColumnId.IP_VERSION]            = item.ip_version;
    retval[MMTDrop.FlowStatsColumnId.SERVER_ADDR]           = item.server_addr;
    retval[MMTDrop.FlowStatsColumnId.CLIENT_ADDR]           = item.client_addr;
    retval[MMTDrop.FlowStatsColumnId.SERVER_PORT]           = item.server_port;
    retval[MMTDrop.FlowStatsColumnId.CLIENT_PORT]           = item.client_port;
    retval[MMTDrop.FlowStatsColumnId.TRANSPORT_PROTO]       = item.transport_proto;
    retval[MMTDrop.FlowStatsColumnId.UL_DATA_VOLUME]        = item.ul_data;
    retval[MMTDrop.FlowStatsColumnId.DL_DATA_VOLUME]        = item.dl_data;
    retval[MMTDrop.FlowStatsColumnId.UL_PACKET_COUNT]       = item.ul_packets;
    retval[MMTDrop.FlowStatsColumnId.DL_PACKET_COUNT]       = item.dl_packets;
    retval[MMTDrop.FlowStatsColumnId.TCP_RTT]               = item.tcp_rtt;
    retval[MMTDrop.FlowStatsColumnId.RETRANSMISSION_COUNT]  = item.retransmission;
    retval[MMTDrop.FlowStatsColumnId.APP_FAMILY]            = item.family;
    retval[MMTDrop.FlowStatsColumnId.CONTENT_CLASS]         = item.content_class;
    retval[MMTDrop.FlowStatsColumnId.PROTO_PATH]            = item.path;
    retval[MMTDrop.FlowStatsColumnId.APP_NAME]              = item.app;
    return retval;
};

MMTDrop.HttpFlowStatsItem = function(entry) {
    var retval = MMTDrop.FlowStatsItem(entry);

    retval.response_time        = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.RESPONSE_TIME];
    retval.transactions_count   = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.TRANSACTIONS_COUNT];
    retval.interaction_time     = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.INTERACTION_TIME];
    retval.hostname             = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.HOSTNAME];
    retval.mime                 = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.MIME_TYPE];
    retval.referer              = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.REFERER];
    retval.device_os_id         = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.DEVICE_OS_ID];
    retval.cdn                  = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.CDN_FLAG];
    return retval;
};

MMTDrop.reverseHttpFlowStatsItem = function(item) {
    var retval = MMTDrop.reverseFlowStatsItem(item);

    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.RESPONSE_TIME]       = item.response_time;
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.TRANSACTIONS_COUNT]  = item.transactions_count;
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.INTERACTION_TIME]    = item.interaction_time;
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.HOSTNAME]            = item.hostname;
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.MIME_TYPE]           = item.mime;
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.REFERER]             = item.referer;
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.DEVICE_OS_ID]        = item.device_os_id;
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.HttpStatsColumnId.CDN_FLAG]            = item.cdn;
    return retval;
};

MMTDrop.TlsFlowStatsItem = function(entry) {
    var retval = MMTDrop.FlowStatsItem(entry);
    retval.server_name = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.TlsStatsColumnId.SERVER_NAME];
    retval.cdn = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.TlsStatsColumnId.CDN_FLAG];
    return retval;
};

MMTDrop.reverseTlsFlowStatsItem = function(item) {
    var retval = MMTDrop.reverseFlowStatsItem(item);
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.TlsStatsColumnId.SERVER_NAME] = item.server_name;
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.TlsStatsColumnId.CDN_FLAG] = item.cdn;
    return retval;
};

MMTDrop.RtpFlowStatsItem = function(entry) {
    var retval = MMTDrop.FlowStatsItem(entry);
    retval.packet_loss = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.RtpStatsColumnId.PACKET_LOSS_RATE];
    retval.packet_loss_burstiness = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.RtpStatsColumnId.PACKET_LOSS_BURSTINESS];
    retval.jitter = entry[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.RtpStatsColumnId.MAX_JITTER];
    return retval;
};

MMTDrop.reverseRtpFlowStatsItem = function(item) {
    var retval = MMTDrop.reverseFlowStatsItem(item);
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.RtpStatsColumnId.PACKET_LOSS_RATE] = item.packet_loss;
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.RtpStatsColumnId.PACKET_LOSS_BURSTINESS] = item.packet_loss_burstiness;
    retval[MMTDrop.FlowStatsColumnId.APP_FORMAT_ID + MMTDrop.RtpStatsColumnId.MAX_JITTER] = item.jitter;
    return retval;
};

MMTDrop.formatReportItem = function(entry) {
    switch( entry[0] ) {
        case MMTDrop.CsvFormat.DEFAULT_APP_FORMAT : 
            return MMTDrop.FlowStatsItem( entry );
        case MMTDrop.CsvFormat.WEB_APP_FORMAT : 
            return MMTDrop.HttpFlowStatsItem( entry );
        case MMTDrop.CsvFormat.SSL_APP_FORMAT : 
            return MMTDrop.TlsFlowStatsItem( entry );
        case MMTDrop.CsvFormat.RTP_APP_FORMAT : 
            return MMTDrop.RtpFlowStatsItem( entry );
        case MMTDrop.CsvFormat.STATS_FORMAT : 
            return MMTDrop.StatsTimePoint( entry );
        case MMTDrop.CsvFormat.SECURITY_FORMAT:
            return MMTDrop.SecurityPoint( entry );
        case MMTDrop.CsvFormat.BA_BANDWIDTH_FORMAT:
            return MMTDrop.BehaviourBandwidthPoint( entry );
        case MMTDrop.CsvFormat.BA_PROFILE_FORMAT:
            return MMTDrop.BehaviourProfilePoint( entry );
        case MMTDrop.CsvFormat.LICENSE:
            return MMTDrop.LicensePoint( entry );
            
        case MMTDrop.CsvFormat.MICROFLOWS_STATS_FORMAT : //TODO 
        case MMTDrop.CsvFormat.RADIUS_REPORT_FORMAT : //TODO
        default :
            return null;
    }
};

MMTDrop.reverseFormatReportItem = function(entry) {
    switch( entry.format ) {
        case MMTDrop.CsvFormat.DEFAULT_APP_FORMAT :
            return MMTDrop.reverseFlowStatsItem( entry );
        case MMTDrop.CsvFormat.WEB_APP_FORMAT :
            return MMTDrop.reverseHttpFlowStatsItem( entry );
        case MMTDrop.CsvFormat.SSL_APP_FORMAT :
            return MMTDrop.reverseTlsFlowStatsItem( entry );
        case MMTDrop.CsvFormat.RTP_APP_FORMAT :
            return MMTDrop.reverseRtpFlowStatsItem( entry );
        case MMTDrop.CsvFormat.STATS_FORMAT :
            return MMTDrop.reverseStatsTimePoint( entry );
        case MMTDrop.CsvFormat.SECURITY_FORMAT:
            return MMTDrop.reverseSecurityPoint( entry );
        case MMTDrop.CsvFormat.BA_BANDWIDTH_FORMAT:
            return MMTDrop.reverseBehaviourBandwidthPoint( entry );
        case MMTDrop.CsvFormat.BA_PROFILE_FORMAT:
            return MMTDrop.reverseBehaviourProfilePoint( entry );
        case MMTDrop.CsvFormat.LICENSE:
            return MMTDrop.reverseLicensePoint( entry );
            
        case MMTDrop.CsvFormat.MICROFLOWS_STATS_FORMAT : //TODO 
        case MMTDrop.CsvFormat.RADIUS_REPORT_FORMAT : //TODO
        default :
            return null;
    }
};
/**
 * Convert a message in string format to an array
 * @param {[[Type]]} message [[Description]]
 */
MMTDrop.formatMessage = function( message ){
    var msg = JSON.parse( message );
    var formatTime = function( ts ){
        return Math.round( ts ) * 1000;    //remove millisecond
    }
    //timestamp
    msg[ 3 ] = formatTime( msg[3] );
    //format
    switch( msg[0] ) {
        case MMTDrop.CsvFormat.DEFAULT_APP_FORMAT :
        case MMTDrop.CsvFormat.WEB_APP_FORMAT :
        case MMTDrop.CsvFormat.SSL_APP_FORMAT :
        case MMTDrop.CsvFormat.RTP_APP_FORMAT :
            msg[ MMTDrop.FlowStatsColumnId.START_TIME ] = formatTime(msg[ MMTDrop.FlowStatsColumnId.START_TIME ] );
            break;
        case MMTDrop.CsvFormat.STATS_FORMAT :
            msg[ MMTDrop.StatsColumnId.START_TIME ] = formatTime( msg[ MMTDrop.StatsColumnId.START_TIME ] );
            break;
        case MMTDrop.CsvFormat.SECURITY_FORMAT:
        case MMTDrop.CsvFormat.BA_BANDWIDTH_FORMAT:
        case MMTDrop.CsvFormat.BA_PROFILE_FORMAT:
            //ip
            if( msg[ 6 ] == "undefined ")
                return null;
            break;
        case MMTDrop.CsvFormat.LICENSE:
            msg[ MMTDrop.LicenseColumnId.EXPIRY_DATE ] == formatTime( msg[ MMTDrop.LicenseColumnId.EXPIRY_DATE ] );
            break;
        case MMTDrop.CsvFormat.MICROFLOWS_STATS_FORMAT : //TODO 
        case MMTDrop.CsvFormat.RADIUS_REPORT_FORMAT : //TODO
        default :
            return null;
    }
    return msg;
}

module.exports = MMTDrop;
module.exports.CsvFormat = MMTDrop.CsvFormat;
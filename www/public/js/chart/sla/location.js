var arr = [
    {
        id: "top_profile",
        title: "SLA/Top Profiles",
        x: 6,
        y: 0,
        width: 6,
        height: 9,
        type: "success",
        userData: {
            fn: "createTopProfileReport"
        },
    },
    {
        id: "top_location",
        title: "SLA/Top Geo Locations",
        x: 0,
        y: 0,
        width: 6,
        height: 9,
        type: "success",
        userData: {
            fn: "createTopLocationReport"
        },
    }
    /*
    {
        id: "top_proto",
        title: "Top Protocols/Applications",
        x: 8,
        y: 0,
        width: 4,
        height: 9,
        type: "warning",
        userData: {
            fn: "createTopProtocolReport"
        },
    },
    */
];

var availableReports = {
    "createTopUserReport": "Top Users",
    "createTopProtocolReport": "Top Protocols",
    "createTopLocationReport" : "Top Geo Locations"
};


function getHMTL( tag ){
    var html = tag[0];
    for( var i=1; i<tag.length; i++)
        html += ' <i class="fa fa-angle-right"/> ' + tag[i];
    return html;
}

//create reports
var ReportFactory = {
    createDetailOfApplicationChart2: function () {
        var self    = this;
        var COL     = MMTDrop.constants.StatsColumn;
        var HTTP    = MMTDrop.constants.HttpStatsColumn;
        var SSL     = MMTDrop.constants.TlsStatsColumn;
        var RTP     = MMTDrop.constants.RtpStatsColumn;
        var FTP     = MMTDrop.constants.FtpStatsColumn;
        var FORMAT  = MMTDrop.constants.CsvFormat;
        var HISTORY = [];
        var openingRow;

        var cTable = MMTDrop.chartFactory.createTable({
            getData: {
                getDataFn: function (db) {
                    HISTORY = [];
                    var columns = [{id: COL.START_TIME.id, label: "Start Time", align:"left"},
                                   {id: COL.IP_DST.id   , label: "Server"    , align:"left"},
                                  COL.APP_PATH];

                    var colSum = [
                        {id: COL.UL_DATA_VOLUME.id, label: "Upload (B)"  , align:"right"},
                        {id: COL.DL_DATA_VOLUME.id, label: "Download (B)", align:"right"},
                    ];
                    var HTTPCols = [
                        { id: HTTP.CONTENT_LENGTH.id, label: "File Size (B)", align: "right"},
                        { id: HTTP.URI.id      , label: HTTP.URI.label},
                        { id: HTTP.METHOD.id   , label: HTTP.METHOD.label},
                        { id: HTTP.RESPONSE.id , label: HTTP.RESPONSE.label},
                        { id: HTTP.MIME_TYPE.id, label: "MIME"     , align:"left"},
                        { id: HTTP.REFERER.id  , label: "Referer"  , align:"left"},

                    ];
                    var SSLCols = [];
                    var RTPCols = [ SSL.SERVER_NAME ];
                    var FTPCols = [
                      FTP.CONNNECTION_TYPE,
                      FTP.USERNAME,
                      FTP.PASSWORD,
                      FTP.FILE_NAME,
                      {id: FTP.FILE_SIZE.id, label: "File Size (B)", align: "right"}
                    ];
                    var otherCols = [];

                    var data = db.data();

                    var arr = [];
                    var havingOther = false;
                    var type = 0;

                    for( var i in data){
                        var msg     = data[i];

                        var format  = msg [ COL.FORMAT_TYPE.id ];
                        var obj     = {};
                        HISTORY.push( msg );

                        obj[ COL.START_TIME.id ]    = moment( msg[COL.START_TIME.id] ).format("YYYY/MM/DD HH:mm:ss");
                        obj[ COL.APP_PATH.id ]      = MMTDrop.constants.getPathFriendlyName( msg[ COL.APP_PATH.id ] );
                        obj[ COL.FORMAT_TYPE.id ]   = msg[ COL.FORMAT_TYPE.id ];
                        var host =  "";
                        if( type == 0 )
                          type = msg[ COL.FORMAT_TYPE.id ];
                        //HTTP
                        if( type == 1)
                          host =  msg[ HTTP.HOSTNAME.id ];
                        else if( type == 2)
                          host = msg[ SSL.SERVER_NAME.id ];

                        if( host != undefined && host != ""){
                                obj[COL.IP_DST.id]  = host;
                        }else
                            obj[COL.IP_DST.id]  = msg[COL.IP_DST.id]; // ip

                        for( var j in colSum ){
                                var val = msg[ colSum[j].id ];
                                if( val == undefined )
                                    val = 0;
                            obj[ colSum[j].id ] = val;
                        }
                        if( type == 1 )
                          otherCols = HTTPCols;
                        else if ( type == 2 )
                          otherCols = SSLCols;
                        else if ( type == 3 )
                          otherCols = RTPCols;
                        else if ( type == 4 )
                          otherCols = FTPCols;

                        for( var i in otherCols ){
                            var c   = otherCols[i];
                            var val = msg[ c.id ];
                            if( val != undefined && val !== ""){
                                obj[ c.id ]  = val;
                                c.havingData = true;
                            }
                        }

                        arr.push( obj );

                    }

                    for( var i in otherCols ){
                        var c = otherCols[i];
                        if( c.havingData === true ){
                            colSum.push( c );
                            //default value for the rows that have not data of this c
                            for( var j in arr )
                                if( arr[j][ c.id ] == undefined || arr[j][ c.id ] == "null" || arr[j][ c.id ] == "(null)" )
                                    arr[j][ c.id ] = "";
                        }
                    }

                    columns = columns.concat( colSum  );
                    columns.unshift( {id: "index", label: ""});

                    //sort by Download
                    arr.sort( function( a, b ){
                      return b[ COL.DL_DATA_VOLUME.id ] -  a[ COL.DL_DATA_VOLUME.id ];
                    })

                    for( var i=0; i<arr.length; i++ ){
                      var msg = arr[i];
                        msg.index = (i+1);
                        msg[ COL.UL_DATA_VOLUME.id ] = MMTDrop.tools.formatDataVolume( msg[ COL.UL_DATA_VOLUME.id ] );
                        msg[ COL.DL_DATA_VOLUME.id ] = MMTDrop.tools.formatDataVolume( msg[ COL.DL_DATA_VOLUME.id ] );

                        //HTTP
                        if( msg[ COL.FORMAT_TYPE.id ] == 1 ){
                          if( msg[ HTTP.CONTENT_LENGTH.id ] > 0 )
                            msg[ HTTP.CONTENT_LENGTH.id ] = MMTDrop.tools.formatDataVolume( msg[ HTTP.CONTENT_LENGTH.id ] );
                          else {
                            msg[ HTTP.CONTENT_LENGTH.id ] = "";
                          }
                        }
                        //FTP
                        else if( msg[ COL.FORMAT_TYPE.id ] === 4 ){
                          if( msg[ FTP.CONNNECTION_TYPE.id ] == 1 )
                            msg[ FTP.CONNNECTION_TYPE.id ] = "Connection";
                          else
                            msg[ FTP.CONNNECTION_TYPE.id ] = "Data";
                          msg[ FTP.FILE_SIZE.id ] = MMTDrop.tools.formatDataVolume( msg[ FTP.FILE_SIZE.id ] );

                          if( msg[FTP.USERNAME.id] == 0 ) msg[FTP.USERNAME.id] = "";
                          if( msg[FTP.PASSWORD.id] == 0 ) msg[FTP.PASSWORD.id] = "";
                        }
                    }
                    if( arr.length > 10 )
                      return {
                          data: arr,
                          columns: columns,
                      };

                    return {
                        data: arr,
                        columns: columns,
                        chart: {
                          "dom"   : '<"detail-table table-inside-table row-cursor-default" t>',
                          "scrollCollapse": true,
                          deferRender: true,
                        }
                    };
                }
            },
            chart: {
                "paging": true,
                "info"  : true,
                "dom"   : '<"detail-table table-inside-table row-cursor-default" t><<"col-sm-3"i><"col-sm-3"f><"col-sm-6"p>>',
                "scrollCollapse": true,
                //"scrollX": true,
                //"scrollY": true,
                deferRender: true,
            },
        });
        return cTable;
    },

    /**
     *
     * @param   {[[Type]]}              group_by either IP_DST or APP_PATH
     * @returns {object|string|boolean} [[Description]]
     */
    createDetailOfApplicationChart: function ( ) {
        var self    = this;
        var COL     = MMTDrop.constants.StatsColumn;
        var HTTP    = MMTDrop.constants.HttpStatsColumn;
        var SSL     = MMTDrop.constants.TlsStatsColumn;
        var RTP     = MMTDrop.constants.RtpStatsColumn;
        var FORMAT  = MMTDrop.constants.CsvFormat;
        var HISTORY = {};
        var openingRow;

        var cTable = MMTDrop.chartFactory.createTable({
            getData: {
                getDataFn: function (db) {
                    //reset
                    HISTORY    = {};
                    openingRow = {};

                    var col_key  = {id: COL.IP_DST.id,  label: "Server" };
                    if( cTable.userData.ip_dest != undefined )
                        col_key  = {id: COL.APP_PATH.id, label: "App/protocol Path"};

                    var columns = [{id: COL.START_TIME.id, label: "Start Time"   , align:"left"},
                                   {id: "LastUpdated"    , label: "Last Updated" , align:"left"},
                                   col_key
                                   ];

                    var colSum = [
                        {id: COL.UL_DATA_VOLUME.id, label: "Upload (B)"  , align:"right"},
                        {id: COL.DL_DATA_VOLUME.id, label: "Download (B)", align:"right"},
                        {id: COL.DATA_VOLUME.id   , label: "Total (B)"   , align:"right"},
                    ];


                    var data = db.data();

                    var arr = [];
                    var havingOther = false;
                    var updateIP2Name = function( obj, msg ){
                        if( obj.__needUpdateIP2Name == undefined )
                            return;

                        var host =  "";
                        var type = msg[ COL.FORMAT_TYPE.id ];
                        //HTTP
                        if( type == 1)
                          host =  msg[ HTTP.HOSTNAME.id ];
                        else if( type == 2)
                          host = msg[ SSL.SERVER_NAME.id ];

                        if( host != undefined && host != ""){
                          obj[COL.IP_DST.id]  = obj[COL.IP_DST.id] + " (" + host  + ")" ;
                          delete( obj.__needUpdateIP2Name );
                        }
                    }

                    for( var i in data){
                        var msg      = data[i];
                        var key_val = msg [ col_key.id ];
                        if( HISTORY[ key_val ] == undefined ){
                            HISTORY[ key_val ] = {
                                data  : {
                                    __key : key_val
                                },
                                detail: [],
                            };
                            //update
                            var obj = HISTORY[ key_val ].data;
                            obj[ col_key.id ] = msg[ col_key.id ];

                            //IP
                            if( col_key.id == COL.IP_DST.id ){
                                obj.__needUpdateIP2Name = true;
                                updateIP2Name( obj, msg );
                            }else
                                obj[ col_key.id ] =  MMTDrop.constants.getPathFriendlyName( obj[ col_key.id ] );


                            obj[ COL.START_TIME.id ] = msg[ COL.START_TIME.id ];
                            obj[ "LastUpdated" ]     = msg[ COL.TIMESTAMP.id ];

                            for (var j in colSum )
                                obj[ colSum[j].id ] = msg[ colSum[j].id ];
                        }
                        else{
                            var obj = HISTORY[ key_val ].data;
                            if( col_key.id == COL.IP_DST.id )
                                updateIP2Name( obj, msg );

                            if( obj[ COL.START_TIME.id ] > msg[ COL.START_TIME.id ] )
                              obj[ COL.START_TIME.id ] = msg[ COL.START_TIME.id ];
                            if( obj[ "LastUpdated" ] < msg[ COL.TIMESTAMP.id ] )
                              obj[ "LastUpdated" ] = msg[ COL.TIMESTAMP.id ];

                            for (var j in colSum )
                                obj[ colSum[j].id ] += msg[ colSum[j].id ] ;

                        }

                        HISTORY[ key_val ].detail.push( msg );
                    }

                    var arr = [];
                    for( var i in HISTORY )
                        arr.push( HISTORY[i].data );

                    arr.sort( function( a, b){
                        return b[ COL.DATA_VOLUME.id ] -  a[ COL.DATA_VOLUME.id ];
                    });

                    //format data
                    for( var i=0; i<arr.length; i++ ){
                        var obj = arr[i];
                        obj.index = i+1;

                        HISTORY[ i ] = HISTORY[ obj.__key ];

                        obj[ COL.START_TIME.id ]    = moment( obj[COL.START_TIME.id] ).format("YYYY/MM/DD HH:mm:ss");
                        obj[ "LastUpdated" ]        = moment( obj["LastUpdated"] )    .format("YYYY/MM/DD HH:mm:ss");
                        obj[ COL.UL_DATA_VOLUME.id] = MMTDrop.tools.formatDataVolume( obj[ COL.UL_DATA_VOLUME.id] );
                        obj[ COL.DL_DATA_VOLUME.id] = MMTDrop.tools.formatDataVolume( obj[ COL.DL_DATA_VOLUME.id] );
                        obj[ COL.DATA_VOLUME.id]    = MMTDrop.tools.formatDataVolume( obj[ COL.DATA_VOLUME.id]    );

                    }
                    columns = columns.concat( colSum  );
                    columns.unshift( {id: "index", label: ""});

                    return {
                        data: arr,
                        columns: columns
                    };
                }
            },
            chart: {
                //"scrollX": true,
                //"scrollY": true,
                dom: "<'row'<'col-sm-5'l><'col-sm-7'f>><'row-cursor-pointer't><'row'<'col-sm-3'i><'col-sm-9'p>>",
                deferRender: true,
            },
            afterEachRender: function (_chart) {
                // Add event listener for opening and closing details
                _chart.chart.on('click', 'tbody tr[role=row]', function () {
                    var tr       = $(this);
                    var row      = _chart.chart.api().row(tr);
                    var row_data = row.data();
                    if( row_data == undefined )
                        return;

                    var index = row_data[0] - 1;

                    //if (openingRow && openingRow.index == index)
                    //    return;

                    if (row.child.isShown()) {
                        // This row is already open - close it
                        row.child.hide();
                        tr.removeClass('shown');
                        openingRow = {};
                    } else {
                        //close the last opening, that is different with the current one
                        if (openingRow.row ) {
                            openingRow.row.child.hide();
                            $(openingRow.row.node()).removeClass('shown');
                        }

                        // Open this row

                        row.child('<div id="detailTable" class="code-json overflow-auto-xy">----</div>').show();
                        tr.addClass('shown');

                        openingRow = {row: row, index: index};

                        var data = HISTORY[ index ].detail;
                        cDetailTable2.database.data( data );
                        cDetailTable2.renderTo("detailTable")
                    }
                    return false;
                });
            }
        });
        return cTable;
    },
    createApplicationReport: function (filter, ip) {
        var self = this;
        var db_param = {id: "network.profile" };
        if( ip !== undefined )
            db_param["userData"] = {ip: ip};
        var database = MMTDrop.databaseFactory.createStatDB( db_param );
        var COL      = MMTDrop.constants.StatsColumn;
        var fProbe   = MMTDrop.filterFactory.createProbeFilter();

        var cPie = MMTDrop.chartFactory.createTable({
            getData: {
                getDataFn: function (db) {
                    var data = db.data();
                    var total = {
                        data: 0,
                        packet: 0
                    }
                    //the first column is Timestamp, so I start from 1 instance of 0
                    var columns = [COL.DATA_VOLUME, COL.PACKET_COUNT];

                    var obj = MMTDrop.tools.sumByGroup( data,
                                                       [COL.DATA_VOLUME.id, COL.PACKET_COUNT.id],
                                                       COL.APP_ID.id );

                    data = [];
                    for (var cls in obj) {
                        var o = obj[cls];
                        var name = MMTDrop.constants.getProtocolNameFromID(cls);
                        name = '<a onclick=loadDetail(null,'+ cls +')>' + name + '</a>'
                        data.push( [0, name,
                                    o[ COL.DATA_VOLUME.id ],
                                    o[ COL.PACKET_COUNT.id ],
                                    MMTDrop.constants.getCategoryNameFromID(MMTDrop.constants.getCategoryIdFromAppId( cls ))
                                   ] )
                        total.data += o[ COL.DATA_VOLUME.id ];
                    }

                    //sort by data size
                    data.sort(function (a, b) {
                        return b[2] - a[2];
                    });
                    //index
                    for( var i=0; i<data.length; i++ ){
                        data[i][0] = (i+1);
                        data[i][2] = '<span title="'+
                            MMTDrop.tools.formatPercentage( data[i][2] / total.data )
                            +'">' +
                            MMTDrop.tools.formatDataVolume( data[i][2] )
                            + '</span>';

                        data[i][3] = MMTDrop.tools.formatLocaleNumber( data[i][3] );
                    }
                    return {
                        data: data,
                        columns: [{id: 0, label: ""           , align: "left"},
                                  {id: 1, label: "Application", align: "left"},
                                  {id: 2, label: "Data       ", align: "right"},
                                  {id: 3, label: "Packet"     , align: "right"},
                                  {id: 4, label: "Profile"    , align: "right"}],
                    };
                }
            },
            chart: {
                "paging": false,
                "info"  : true,
                "dom"   : '<"row" <"col-md-6" i><"col-md-6" f>> <"tbl-proto-app-report" t>',
                "scrollY": true,
            },
            bgPercentage:{
                table : ".tbl-proto-app-report table",
                column: 3, //index of column, start from 1
                css   : "bg-img-1-red-pixel",
                attr  : {
                    children : "span",
                    att : "title"
                }
            },
            //custom legend
            afterEachRender: function (_chart) {
                var chart = _chart.chart;
                var $widget = $("#" + _chart.elemID).getWidgetParent();

                //resize when changing window size
                $widget.on("widget-resized", function (event, widget) {
                    var $div = widget.find(".dataTables_scrollBody");
                    var h = $div.getWidgetContentOfParent().height() - 100;
                    $div.css({'max-height' : h});
                });
                $widget.trigger("widget-resized", [$widget]);
            }
        });
        //

        var dataFlow = [{
            object: fProbe,
            effect: [{
                object: cPie
                    }]
        }, ];

        var report = new MMTDrop.Report(
            // title
            null,

            // database
            database,

            // filers
					[fProbe],

            //charts
					[
                {
                    charts: [cPie],
                    width: 12
                },
					 ],

            //order of data flux
            dataFlow
        );

        return report;
    },
    createDestinationReport: function (filter, ip) {
        var self = this;
        var db_param = {id: "network.destination" };
        if( ip !== undefined )
            db_param["userData"] = {ip: ip };
        var database = MMTDrop.databaseFactory.createStatDB( db_param );
        var COL      = MMTDrop.constants.StatsColumn;
        var fProbe   = MMTDrop.filterFactory.createProbeFilter();

        var cPie = MMTDrop.chartFactory.createTable({
            getData: {
                getDataFn: function (db) {
                    var data = db.data();
                    var obj = {};
                    var total = {
                        packet: 0,
                        data  : 0
                    }

                    for (var i=0; i<data.length; i++) {
                        var msg  = data[i];
                        var ip   = msg[ COL.IP_DST.id ];
                        var time = msg[ COL.TIMESTAMP.id ];

                        ip = '<a onclick=loadDetail("'+ ip +'")>' + ip + '</a>'

                        if( obj[ip] === undefined )
                            obj[ ip ] = [
                                0, //0: index
                                ip,//1: ip
                                0, //2: data
                                0, //3: packet
                                msg[ COL.START_TIME.id ], //4: start time
                                time //5: last updated
                            ];
                        obj[ ip ][ 2 ] += msg[ COL.DATA_VOLUME.id];
                        obj[ ip ][ 3 ] += msg[ COL.PACKET_COUNT.id ];

                        total.data    += msg[ COL.DATA_VOLUME.id];
                        total.packet  += msg[ COL.PACKET_COUNT.id ];

                        if( obj[ ip ][ 4 ] > time )
                            obj[ ip ][ 4 ] = time;
                        if( obj[ ip ][ 5 ] < time )
                            obj[ ip ][ 5 ] = time;
                    }

                    data = [];
                    for( var i in obj )
                        data.push( obj[i] );

                    //sort by data size
                    data.sort(function (a, b) {
                        return b[2] - a[2];
                    });
                    //index
                    for( var i=0; i<data.length; i++ ){
                        data[i][0] = (i+1);
                        data[i][2] = '<span title="'+
                            MMTDrop.tools.formatPercentage( data[i][2] / total.data )
                            +'">' +
                            MMTDrop.tools.formatDataVolume( data[i][2] )
                            + '</span>';

                        data[i][3] = MMTDrop.tools.formatLocaleNumber( data[i][3] );


                        data[i][4] = moment( data[i][4] ).format("YYYY/MM/DD HH:mm:ss");
                        data[i][5] = moment( data[i][5] ).format("MM/DD HH:mm:ss");
                    }


                    return {
                        data: data,
                        columns: [{id: 0, label: ""              , align: "left"},
                                  {id: 1, label: "Destination IP", align: "left"},
                                  {id: 2, label: "Data       "   , align: "right"},
                                  {id: 3, label: "Packet"        , align: "right"},
                                  {id: 4, label: "Start Time"    , align: "right"},
                                  {id: 5, label: "Last Updated"  , align: "right"},
                                 ],
                    };
                }
            },
            chart: {
                "paging": false,
                "info"  : true,
                "dom"   : '<"row" <"col-md-6" i><"col-md-6" f>> <"tbl-destination-report" t>',
                "scrollY": "200px",
                "scrollCollapse": true,
            },
            bgPercentage:{
                table : ".tbl-destination-report table",
                column: 3, //index of column, start from 1
                css   : "bg-img-1-red-pixel",
                attr  : {
                    children : "span",
                    att : "title"
                }
            },
            //custom legend
            afterEachRender: function (_chart) {
                var chart = _chart.chart;
                var $widget = $("#" + _chart.elemID).getWidgetParent();

                //resize when changing window size
                $widget.on("widget-resized", function (event, widget) {
                    var $div = widget.find(".dataTables_scrollBody");
                    var h = $div.getWidgetContentOfParent().height() - 100;
                    $div.css({'max-height' : h});
                });
                $widget.trigger("widget-resized", [$widget]);

            }
        });
        //

        var dataFlow = [{
            object: fProbe,
            effect: [{
                object: cPie
                    }]
        }, ];

        var report = new MMTDrop.Report(
            // title
            null,

            // database
            database,

            // filers
					[fProbe],

            //charts
					[
                {
                    charts: [cPie],
                    width: 12
                },
					 ],

            //order of data flux
            dataFlow
        );

        return report;
    },
    createTopProfileReport: function (filter, ip) {
        var self = this;
        var db_param = {id: "network.profile" };
        if( ip !== undefined )
            db_param["userData"] = {ip: ip };
        var database = MMTDrop.databaseFactory.createStatDB( db_param );
        var COL      = MMTDrop.constants.StatsColumn;
        var fProbe   = MMTDrop.filterFactory.createProbeFilter();
        var fMetric  = MMTDrop.filterFactory.createMetricFilter();

        var cPie = MMTDrop.chartFactory.createPie({
            getData: {
                getDataFn: function (db) {
                    var col = fMetric.selectedOption();

                    var data = [];
                    //the first column is Timestamp, so I start from 1 instance of 0
                    var columns = [];

                    var obj = db.stat.splitDataByClass();

                    cPie.dataLegend = {
                        "dataTotal": 0,
                        "label"    : col.label.substr(0, col.label.indexOf(" ")),
                        "data"     : {}
                    };

                    var total = 0;

                    for (var cls in obj) {
                        var o = obj[cls];
                        //sumup by col.id
                        o = MMTDrop.tools.sumUp(o, col.id);

                        var v = o[col.id];
                        if( v === 0 || v === undefined ) continue;

                        var name = MMTDrop.constants.getCategoryNameFromID(cls);

                        data.push({
                            "key": name,
                            "val": v
                        });

                        cPie.dataLegend.data[name] = v;
                        cPie.dataLegend.dataTotal += v;
                    }


                    data.sort(function (a, b) {
                        return b.val - a.val;
                    });

                    var top = 7;
                    if( data.length > top+2 && cPie.showAll !== true && ip == undefined ){
                        var val = 0;

                        //update data
                        for (var i=top; i<data.length; i++ ){
                            var msg = data[i];
                            val += msg.val;
                        }

                        data[top] = {
                            key: "Other",
                            val: val
                        };
                        data.length = top+1;

                        //reset dataLegend
                        cPie.dataLegend.data = {};
                        for (var i = 0; i < data.length; i++) {
                            var o = data[i];
                            cPie.dataLegend.data[o.key] = o.val;
                        }
                    }

                    return {
                        data: data,
                        columns: [{
                            "id": "key",
                            label: ""
                        }, {
                            "id": "val",
                            label: ""
                        }],
                    };
                }
            },
            chart: {
                size: {
                    height: 300
                },
                legend: {
                    hide: true,
                },
                data: {
                    onclick: function( d, i ){
                        var id = d.id;
                        if( id === "Other") return;

                        var _chart = cPie.chart;
                    }
                }
            },
            bgPercentage:{
                table : ".tbl-top-profiles",
                column: 4, //index of column, start from 1
                css   : "bg-img-1-red-pixel"
            },
            //custom legend
            afterEachRender: function (_chart) {
                var chart = _chart.chart;
                var legend = _chart.dataLegend;

                var $table = $("<table>", {
                    "class": "table table-bordered table-striped table-condensed tbl-top-profiles"
                });
                $table.appendTo($("#" + _chart.elemID));
                $("<thead><tr><th></th><th width='50%'>Profile</th><th>" + legend.label + "</th><th>Percent</th></tr>").appendTo($table);
                var i = 0;
                for (var key in legend.data) {
                    if( key == "Other")
                        continue;

                    i++;
                    var val = legend.data[key];
                    var $tr = $("<tr>");
                    $tr.appendTo($table);

                    $("<td>", {
                            "class": "item-" + key,
                            "data-id": key,
                            "style": "width: 30px; cursor: pointer",
                            "align": "right"
                        })
                        .css({
                            "background-color": chart.color(key)
                        })
                        .on('mouseover', function () {
                            chart.focus($(this).data("id"));
                        })
                        .on('mouseout', function () {
                            chart.revert();
                        })
                        .on('click', function () {
                            var id = $(this).data("id");
                            chart.toggle(id);
                            //$(this).css("background-color", chart.color(id) );
                        })
                        .appendTo($tr);
                    $("<td>", {
                        "text": key
                    }).appendTo($tr);

                    var $a = $("<a>", {
                        href : "?show detail of this class",
                        title: "click to show detail of this class",
                        text : MMTDrop.tools.formatDataVolume( val ),

                    });
                    $a.on("click", null, key, function( event ){
                        event.preventDefault();
                        var id = event.data;

                        if( ip )
                            location.href = "?profile=" + id + "&ip = " + ip;
                        else
                            location.href = "?profile=" + id;
                        return false;
                    });

                    $("<td>", {align: "right"}).text(  MMTDrop.tools.formatDataVolume( val ) ).appendTo($tr);

                    $("<td>", {
                        "align": "right",
                        "text": Math.round(val * 10000 / legend.dataTotal) / 100 + "%"
                    }).appendTo($tr);
                }
                var $tfoot = $("<tfoot>");

                if (legend.data["Other"] != undefined) {
                    i++;
                    $tr = $("<tr>");
                    var key = "Other";
                    var val = legend.data[key];

                    $("<td>", {
                            "class": "item-" + key,
                            "data-id": key,
                            "style": "width: 30px; cursor: pointer",
                            "align": "right"
                        })
                        .css({
                            "background-color": chart.color(key)
                        })
                        .on('mouseover', function () {
                            chart.focus($(this).data("id"));
                        })
                        .on('mouseout', function () {
                            chart.revert();
                        })
                        .on('click', function () {
                            var id = $(this).data("id");
                            chart.toggle(id);
                            //$(this).css("background-color", chart.color(id) );
                        })
                        .appendTo($tr);

                    var $a = $("<a>", {
                        href: "?show all classes",
                        title: "click to show all classes",
                        text: "Other",

                    });
                    $a.on("click", function(){
                       _chart.showAll = true;
                       _chart.redraw();
                        return false;
                    });

                    $("<td>").append( $a ).appendTo($tr);


                    $("<td>", {
                        "align": "right",
                        "html" :  MMTDrop.tools.formatDataVolume( val )
                    }).appendTo($tr);

                    $("<td>", {
                        "align": "right",
                        "text": Math.round(val * 10000 / legend.dataTotal) / 100 + "%"

                    }).appendTo($tr);

                    $tfoot.append($tr).appendTo($table);
                }

                $tfoot.append(
                    $("<tr>", {
                        "class": 'success'
                    }).append(
                        $("<td>", {
                            "align": "center",
                            "text": i
                        })
                    ).append(
                        $("<td>", {
                            "text": "Total"
                        })
                    ).append(
                        $("<td>", {
                            "align": "right",
                            "text": MMTDrop.tools.formatDataVolume( legend.dataTotal )
                        })
                    ).append(
                        $("<td>", {
                            "align": "right",
                            "text": "100%"
                        })
                    )
                ).appendTo($table);

                $table.dataTable({
                    paging: false,
                    dom: "t",
                    order: [[3, "desc"]]
                });
            }
        });
        //

        var dataFlow = [{object:fProbe,
                         effect:[{
                object: fMetric,
                effect: [{
                    object: cPie
                }]
        }, ] }];

        var report = new MMTDrop.Report(
            // title
            null,

            // database
            database,

            // filers
					[fProbe, fMetric],

            //charts
					[
                {
                    charts: [cPie],
                    width: 12
                },
					 ],

            //order of data flux
            dataFlow
        );

        return report;
    },
    createTopUserReport: function (filter, userData) {
        var self = this;
        var database = MMTDrop.databaseFactory.createStatDB({id: "network.user", userData: userData});
        var COL      = MMTDrop.constants.StatsColumn;
        var fProbe   = MMTDrop.filterFactory.createProbeFilter();
        var fMetric  = MMTDrop.filterFactory.createMetricFilter();

        var cPie = MMTDrop.chartFactory.createPie({
            getData: {
                getDataFn: function (db) {
                    var col = fMetric.selectedOption();

                    var data = [];
                    //the first column is Timestamp, so I start from 1 instance of 0
                    var columns = [];

                    cPie.dataLegend = {
                        "dataTotal": 0,
                        "label"    : col.label.substr(0, col.label.indexOf(" ")),
                        "data"     : {}
                    };

                    var db_data = db.data();

                    for( var i=0; i< db_data.length; i++){
                        var val  = db_data[i][ col.id ];
                        var name = db_data[i][ COL.IP_SRC.id ];
                        var mac  = db_data[i][ COL.MAC_SRC.id ];

                        if( cPie.dataLegend.data[name] === undefined )
                            cPie.dataLegend.data[name] = {mac: mac, val: 0};

                        cPie.dataLegend.data[name].val += val;
                        cPie.dataLegend.dataTotal      += val;
                    }
                    for( var name in cPie.dataLegend.data )
                        data.push({
                            "key": name,
                            "val": cPie.dataLegend.data[ name ].val
                        });


                    data.sort(function (a, b) {
                        return b.val - a.val;
                    });

                    var top = 7;


                    if( cPie.showAll === true && data.length >= 200 ){
                        top = 200;
                        cPie.showAll = false;
                    }

                    if( data.length > top+2 && cPie.showAll !== true){
                        var val = 0;

                        //update data
                        for (var i=top; i<data.length; i++ ){
                            var msg = data[i];
                            val += msg.val;

                            //remove
                            delete( cPie.dataLegend.data[ msg.key ]);
                        }

                        //reset dataLegend
                        cPie.dataLegend.data["Other"] = {mac: "", val: val};

                        data[top] = {
                            key: "Other",
                            val: val
                        };
                        data.length = top+1;
                    }

                    return {
                        data: data,
                        columns: [{
                            "id": "key",
                            label: ""
                        }, {
                            "id": "val",
                            label: ""
                        }],
                        ylabel: col.label
                    };
                }
            },
            chart: {
                size: {
                    height: 300
                },
                legend: {
                    hide: true,
                },
                data: {
                    onclick: function( d, i ){
                        var ip = d.id;
                        if( ip === "Other") return;

                        var _chart = cPie;
                        //TODO
                    }
                }
            },
            bgPercentage:{
                table : ".tbl-top-users",
                column: 5, //index of column, start from 1
                css   : "bg-img-1-red-pixel"
            },
            //custom legend
            afterEachRender: function (_chart) {
                var chart = _chart.chart;
                var legend = _chart.dataLegend;

                var $table = $("<table>", {
                    "class": "table table-bordered table-striped table-hover table-condensed tbl-top-users"
                });
                $table.appendTo($("#" + _chart.elemID));
                $("<thead><tr><th></th><th width='40%'>Client IP</th><th width='20%'>MAC</th><th width='20%'>" + legend.label + "</th><th width='20%'>Percent</th></tr>").appendTo($table);
                var i = 0;
                for (var key in legend.data) {
                    if (key == "Other")
                        continue;
                    i++;
                    var val = legend.data[key].val;
                    var mac = legend.data[key].mac;

                    var $tr = $("<tr>");
                    $tr.appendTo($table);

                    $("<td>", {
                            "class": "item-" + key,
                            "data-id": key,
                            "style": "width: 30px; cursor: pointer",
                            "align": "right"
                        })
                        .css({
                            "background-color": chart.color(key)
                        })
                        .on('mouseover', function () {
                            chart.focus($(this).data("id"));
                        })
                        .on('mouseout', function () {
                            chart.revert();
                        })
                        .on('click', function () {
                            var id = $(this).data("id");
                            chart.toggle(id);
                            //$(this).css("background-color", chart.color(id) );
                        })
                        .appendTo($tr);

                    var $label = $("<a>", {
                        text : key,
                        title: "click to show detail of this user",
                        href :"?ip=" + key
                    });

                    $("<td>", {align: "left"}).append($label).appendTo($tr);

                    $("<td>", {
                        "text" : mac,
                        "align": "left"
                    }).appendTo($tr);


                    $("<td>", {
                        "text" : MMTDrop.tools.formatDataVolume( val ),
                        "align": "right"
                    }).appendTo($tr);

                    var percent = MMTDrop.tools.formatPercentage(val / legend.dataTotal);
                    $("<td>", {
                        "align": "right",
                        "text" : percent

                    }).appendTo($tr);
                }

                //footer of table
                var $tfoot = $("<tfoot>");

                if (legend.data["Other"] != undefined) {
                    i++;
                    $tr = $("<tr>");
                    var key = "Other";
                    var val = legend.data[key].val;

                    $("<td>", {
                            "class": "item-" + key,
                            "data-id": key,
                            "style": "width: 30px; cursor: pointer",
                            "align": "right"
                        })
                        .css({
                            "background-color": chart.color(key)
                        })
                        .on('mouseover', function () {
                            chart.focus($(this).data("id"));
                        })
                        .on('mouseout', function () {
                            chart.revert();
                        })
                        .on('click', function () {
                            var id = $(this).data("id");
                            chart.toggle(id);
                            //$(this).css("background-color", chart.color(id) );
                        })
                        .appendTo($tr);

                    if( i <= 10 ){
                        var $a = $("<a>", {
                            href: "?show all clients",
                            title: "click to show all clients",
                            text: "Other",

                        });
                        $a.on("click", function(){
                           _chart.showAll = true;
                           _chart.redraw();
                            return false;
                        });

                        $("<td>").append( $a ).appendTo($tr);
                    }
                    else
                        $("<td>").append("Other").appendTo($tr);

                    $("<td>").appendTo($tr);

                    $("<td>", {
                        "align": "right",
                        "html":  MMTDrop.tools.formatDataVolume( val ),
                    }).appendTo($tr);

                    var percent = MMTDrop.tools.formatPercentage(val / legend.dataTotal);
                    $("<td>", {
                        "align": "right",
                        "text" : percent

                    }).appendTo($tr);

                    $tfoot.append($tr).appendTo($table);
                }

                $tfoot.append(
                    $("<tr>", {
                        "class": 'success'
                    }).append(
                        $("<td>", {
                            "align": "center",
                            "text": i
                        })
                    ).append(
                        $("<td>", {
                            "text": "Total"
                        })
                    ).append(
                        $("<td>", {
                        })
                    ).append(
                        $("<td>", {
                            "align": "right",
                            "text": MMTDrop.tools.formatDataVolume( legend.dataTotal )
                        })
                    ).append(
                        $("<td>", {
                            "align": "right",
                            "text": "100%"
                        })
                    )
                ).appendTo($table);

                $table.dataTable({
                    paging: false,
                    dom: "t",
                    order: [[4, "desc"]],
                    "scrollY": "240px",
                    "scrollCollapse": true,
                });
            }
        });
        //

        var dataFlow = [{object:fProbe,
                         effect:[{
                object: fMetric,
                effect: [{
                    object: cPie
                }]
        }, ] }];

        var report = new MMTDrop.Report(
            // title
            null,

            // database
            database,

            // filers
					[fProbe, fMetric],

            //charts
					[
                {
                    charts: [cPie],
                    width: 12
                },
					 ],

            //order of data flux
            dataFlow
        );

        return report;
    },

    createTopProtocolReport: function (filter, ip) {
        var self = this;
        var db_param = {id: "network.profile" };
        if( ip !== undefined )
            db_param["userData"] = {ip: ip };
        var database = MMTDrop.databaseFactory.createStatDB( db_param );
        var COL      = MMTDrop.constants.StatsColumn;
        var fProbe   = MMTDrop.filterFactory.createProbeFilter();
        var fMetric  = MMTDrop.filterFactory.createMetricFilter();

        var cPie = MMTDrop.chartFactory.createPie({
            getData: {
                getDataFn: function (db) {
                    var col = fMetric.selectedOption();

                    var data = [];
                    //the first column is Timestamp, so I start from 1 instance of 0
                    var columns = [];

                    var obj = db.stat.splitDataByApp();

                    cPie.dataLegend = {
                        "dataTotal": 0,
                        "label"    : col.label.substr(0, col.label.indexOf(" ")),
                        "data"     : {}
                    };

                    var total = 0;

                    for (var cls in obj) {
                        var o = obj[cls];
                        //sumup by col.id
                        o = MMTDrop.tools.sumUp(o, col.id);

                        var v = o[col.id];
                        if( v === 0 || v === undefined ) continue;

                        var name = MMTDrop.constants.getProtocolNameFromID(cls);

                        data.push({
                            "key": name,
                            "val": v
                        });

                        cPie.dataLegend.data[name] = v;
                        cPie.dataLegend.dataTotal += v;
                    }


                    data.sort(function (a, b) {
                        return b.val - a.val;
                    });

                    var top = 7;
                    if( data.length > top+1 && cPie.showAll !== true && ip == undefined ){
                        var val = 0;

                        //update data
                        for (var i=top; i<data.length; i++ ){
                            var msg = data[i];
                            val += msg.val;
                        }

                        data[top] = {
                            key: "Other",
                            val: val
                        };
                        data.length = top+1;

                        //reset dataLegend
                        cPie.dataLegend.data = {};
                        for (var i = 0; i < data.length; i++) {
                            var o = data[i];
                            cPie.dataLegend.data[o.key] = o.val;
                        }
                    }

                    return {
                        data: data,
                        columns: [{
                            "id": "key",
                            label: ""
                        }, {
                            "id": "val",
                            label: ""
                        }],
                    };
                }
            },
            chart: {
                size: {
                    height: 300
                },
                legend: {
                    hide: true,
                },
                data: {
                    onclick: function( d, i ){
                        var id = d.id;
                        if( id === "Other") return;

                        var _chart = cPie.chart;
                    }
                }
            },
            bgPercentage:{
                table : ".tbl-top-proto",
                column: 4, //index of column, start from 1
                css   : "bg-img-1-red-pixel"
            },
            //custom legend
            afterEachRender: function (_chart) {
                var chart = _chart.chart;
                var legend = _chart.dataLegend;

                var $table = $("<table>", {
                    "class": "table table-bordered table-striped table-condensed tbl-top-proto"
                });
                $table.appendTo($("#" + _chart.elemID));
                $("<thead><tr><th></th><th width='50%'>Protocol/Application</th><th>" + legend.label + "</th><th>Percent</th></tr>").appendTo($table);
                var i = 0;
                for (var key in legend.data) {
                    if( key == "Other")
                        continue;

                    i++;
                    var val = legend.data[key];
                    var $tr = $("<tr>");
                    $tr.appendTo($table);

                    $("<td>", {
                            "class": "item-" + key,
                            "data-id": key,
                            "style": "width: 30px; cursor: pointer",
                            "align": "right"
                        })
                        .css({
                            "background-color": chart.color(key)
                        })
                        .on('mouseover', function () {
                            chart.focus($(this).data("id"));
                        })
                        .on('mouseout', function () {
                            chart.revert();
                        })
                        .on('click', function () {
                            var id = $(this).data("id");
                            chart.toggle(id);
                            //$(this).css("background-color", chart.color(id) );
                        })
                        .appendTo($tr);
                    $("<td>", {
                        "text": key
                    }).appendTo($tr);

                    var $a = $("<a>", {
                        href : "?show detail of this class",
                        title: "click to show detail of this class",
                        text : MMTDrop.tools.formatDataVolume( val ),

                    });
                    $a.on("click", null, key, function( event ){
                        event.preventDefault();
                        var id = event.data;

                        if( ip )
                            location.href = "?profile=" + id + "&ip = " + ip;
                        else
                            location.href = "?profile=" + id;
                        return false;
                    });

                    $("<td>", {align: "right"}).text(  MMTDrop.tools.formatDataVolume( val ) ).appendTo($tr);

                    $("<td>", {
                        "align": "right",
                        "text": Math.round(val * 10000 / legend.dataTotal) / 100 + "%"
                    }).appendTo($tr);
                }
                var $tfoot = $("<tfoot>");

                if (legend.data["Other"] != undefined) {
                    i++;
                    $tr = $("<tr>");
                    var key = "Other";
                    var val = legend.data[key];

                    $("<td>", {
                            "class": "item-" + key,
                            "data-id": key,
                            "style": "width: 30px; cursor: pointer",
                            "align": "right"
                        })
                        .css({
                            "background-color": chart.color(key)
                        })
                        .on('mouseover', function () {
                            chart.focus($(this).data("id"));
                        })
                        .on('mouseout', function () {
                            chart.revert();
                        })
                        .on('click', function () {
                            var id = $(this).data("id");
                            chart.toggle(id);
                            //$(this).css("background-color", chart.color(id) );
                        })
                        .appendTo($tr);

                    var $a = $("<a>", {
                        href: "?show all classes",
                        title: "click to show all classes",
                        text: "Other",

                    });
                    $a.on("click", function(){
                       _chart.showAll = true;
                       _chart.redraw();
                        return false;
                    });

                    $("<td>").append( $a ).appendTo($tr);


                    $("<td>", {
                        "align": "right",
                        "html" :  MMTDrop.tools.formatDataVolume( val )
                    }).appendTo($tr);

                    $("<td>", {
                        "align": "right",
                        "text": Math.round(val * 10000 / legend.dataTotal) / 100 + "%"

                    }).appendTo($tr);

                    $tfoot.append($tr).appendTo($table);
                }

                $tfoot.append(
                    $("<tr>", {
                        "class": 'success'
                    }).append(
                        $("<td>", {
                            "align": "center",
                            "text": i
                        })
                    ).append(
                        $("<td>", {
                            "text": "Total"
                        })
                    ).append(
                        $("<td>", {
                            "align": "right",
                            "text": MMTDrop.tools.formatDataVolume( legend.dataTotal )
                        })
                    ).append(
                        $("<td>", {
                            "align": "right",
                            "text": "100%"
                        })
                    )
                ).appendTo($table);

                $table.dataTable({
                    paging: false,
                    dom: "t",
                    order: [[3, "desc"]]
                });
            }
        });
        //

        var dataFlow = [{object:fProbe,
                         effect:[{
                object: fMetric,
                effect: [{
                    object: cPie
                }]
        }, ] }];

        var report = new MMTDrop.Report(
            // title
            null,

            // database
            database,

            // filers
					[fProbe, fMetric],

            //charts
					[
                {
                    charts: [cPie],
                    width: 12
                },
					 ],

            //order of data flux
            dataFlow
        );

        return report;
    },
    createTopLocationReport: function(filter, ip, userData){
        var self = this;
        var database = MMTDrop.databaseFactory.createStatDB({id: "network.country", userData: userData});
        var COL      = MMTDrop.constants.StatsColumn;
        var fProbe   = MMTDrop.filterFactory.createProbeFilter();
        var fMetric  = MMTDrop.filterFactory.createMetricFilter();

        var cPie = MMTDrop.chartFactory.createPie({
            getData: {
                getDataFn: function (db) {
                    var col = fMetric.selectedOption();
                    var data = [];
                    //the first column is Timestamp, so I start from 1 instance of 0
                    var columns = [];

                    cPie.dataLegend = {
                        "dataTotal": 0,
                        "label"    : col.label.substr(0, col.label.indexOf(" ")),
                        "data"     : {}
                    };

                    var db_data = db.data();

                    for( var i=0; i< db_data.length; i++){
                        var val  = db_data[i][ col.id ];
                        var name = db_data[i][ COL.DST_LOCATION.id ];

                        if( cPie.dataLegend.data[name] === undefined )
                            cPie.dataLegend.data[name] = {mac: name, val: 0};

                        cPie.dataLegend.data[name].val += val;
                        cPie.dataLegend.dataTotal      += val;
                    }
                    for( var name in cPie.dataLegend.data )
                        data.push({
                            "key": name,
                            "val": cPie.dataLegend.data[ name ].val
                        });

                    data.sort(function (a, b) {
                        return b.val - a.val;
                    });

                    var top = 7;

                    if( cPie.showAll === true && data.length >= 200 ){
                        top = 200;
                        cPie.showAll = false;
                    }

                    if( data.length > top+2 && cPie.showAll !== true){
                        var val = 0;

                        //update data
                        for (var i=top; i<data.length; i++ ){
                            var msg = data[i];
                            val += msg.val;

                            //remove
                            delete( cPie.dataLegend.data[ msg.key ]);
                        }

                        //reset dataLegend
                        cPie.dataLegend.data["Other"] = {val: val};

                        data[top] = {
                            key: "Other",
                            val: val
                        };
                        data.length = top+1;
                    }

                    return {
                        data: data,
                        columns: [{
                            "id": "key",
                            label: ""
                        }, {
                            "id": "val",
                            label: ""
                        }],
                        ylabel: col.label
                    };
                }
            },
            chart: {
                size: {
                    height: 300
                },
                legend: {
                    hide: true,
                },
                data: {
                    onclick: function( d, i ){
                        var ip = d.id;
                        if( ip === "Other") return;

                        var _chart = cPie;
                        //TODO
                    }
                }
            },
            bgPercentage:{
                table : ".tbl-top-locations",
                column: 4, //index of column, start from 1
                css   : "bg-img-1-red-pixel"
            },
            //custom legend
            afterEachRender: function (_chart) {
                var chart = _chart.chart;
                var legend = _chart.dataLegend;

                var $table = $("<table>", {
                    "class": "table table-bordered table-striped table-hover table-condensed tbl-top-locations"
                });
                $table.appendTo($("#" + _chart.elemID));
                $("<thead><tr><th></th><th>Location</th><th width='20%'>" + legend.label + "</th><th width='20%'>Percent</th></tr>").appendTo($table);
                var i = 0;
                for (var key in legend.data) {
                    if (key == "Other")
                        continue;
                    i++;
                    var val = legend.data[key].val;
                    // var mac = legend.data[key].mac;

                    var $tr = $("<tr>");
                    $tr.appendTo($table);

                    $("<td>", {
                            "class": "item-" + key,
                            "data-id": key,
                            "style": "width: 30px; cursor: pointer",
                            "align": "right"
                        })
                        .css({
                            "background-color": chart.color(key)
                        })
                        .on('mouseover', function () {
                            chart.focus($(this).data("id"));
                        })
                        .on('mouseout', function () {
                            chart.revert();
                        })
                        .on('click', function () {
                            // var id = $(this).data("id");
                            // chart.toggle(id);
                            //$(this).css("background-color", chart.color(id) );
                        })
                        .appendTo($tr);


                    var $label = $("<a>", {
                        text : key,
                        title: "click to show detail of this location",
                        // href :"?ip=" + key
                    });

                    $("<td>", {align: "left"}).append($label).appendTo($tr);

                    // $("<td>", {
                    //     "text" : mac,
                    //     "align": "left"
                    // }).appendTo($tr);


                    $("<td>", {
                        "text" : MMTDrop.tools.formatDataVolume( val ),
                        "align": "right"
                    }).appendTo($tr);

                    var percent = MMTDrop.tools.formatPercentage(val / legend.dataTotal);
                    $("<td>", {
                        "align": "right",
                        "text" : percent

                    }).appendTo($tr);
                }

                //footer of table
                var $tfoot = $("<tfoot>");

                if (legend.data["Other"] != undefined) {
                    i++;
                    $tr = $("<tr>");
                    var key = "Other";
                    var val = legend.data[key].val;

                    $("<td>", {
                            "class": "item-" + key,
                            "data-id": key,
                            "style": "width: 30px; cursor: pointer",
                            "align": "right"
                        })
                        .css({
                            "background-color": chart.color(key)
                        })
                        .on('mouseover', function () {
                            chart.focus($(this).data("id"));
                        })
                        .on('mouseout', function () {
                            chart.revert();
                        })
                        .on('click', function () {
                            var id = $(this).data("id");
                            chart.toggle(id);
                            //$(this).css("background-color", chart.color(id) );
                        })
                        .appendTo($tr);

                    if( i <= 10 ){
                        var $a = $("<a>", {
                            href: "?show all clients",
                            title: "click to show all clients",
                            text: "Other",

                        });
                        $a.on("click", function(){
                           _chart.showAll = true;
                           _chart.redraw();
                            return false;
                        });

                        $("<td>").append( $a ).appendTo($tr);
                    }
                    else
                        $("<td>").append("Other").appendTo($tr);

                    // $("<td>").appendTo($tr);

                    $("<td>", {
                        "align": "right",
                        "html":  MMTDrop.tools.formatDataVolume( val ),
                    }).appendTo($tr);

                    var percent = MMTDrop.tools.formatPercentage(val / legend.dataTotal);
                    $("<td>", {
                        "align": "right",
                        "text" : percent

                    }).appendTo($tr);

                    $tfoot.append($tr).appendTo($table);
                }

                $tfoot.append(
                    $("<tr>", {
                        "class": 'success'
                    }).append(
                        $("<td>", {
                            "align": "center",
                            "text": i
                        })
                    ).append(
                        $("<td>", {
                            "text": "Total"
                        })
                    // ).append(
                    //     $("<td>", {
                    //     })
                    ).append(
                        $("<td>", {
                            "align": "right",
                            "text": MMTDrop.tools.formatDataVolume( legend.dataTotal )
                        })
                    ).append(
                        $("<td>", {
                            "align": "right",
                            "text": "100%"
                        })
                    )
                ).appendTo($table);

                $table.dataTable({
                    paging: false,
                    dom: "t",
                    // order: [[4, "desc"]],
                    order: [[3, "desc"]],
                    "scrollY": "240px",
                    "scrollCollapse": true,
                });
            }
        });
        //

        var dataFlow = [{object:fProbe,
                         effect:[{
                object: fMetric,
                effect: [{
                    object: cPie
                }]
        }, ] }];

        var report = new MMTDrop.Report(
            // title
            null,

            // database
            database,

            // filers
                    [fProbe, fMetric],

            //charts
                    [
                {
                    charts: [cPie],
                    width: 12
                },
                     ],

            //order of data flux
            dataFlow
        );

        return report;
    }

}

var param = MMTDrop.tools.getURLParameters();
if( param.ip != undefined ){
    var ip = param.ip; //'<a href="?">'+ param.ip +'</a>'
    arr = [{
        id: "profile",
        title: ip + " &gt; Profiles",
        x: 0,
        y: 0,
        width: 5,
        height: 10,
        type: "danger",
        userData: {
            fn: "createIPUserReport"
        },
    },{
        id: "user",
        title: ip + " &gt; Destinations",
        x: 6,
        y: 6,
        width: 7,
        height: 5,
        type: "info",
        userData: {
            fn: "createIPDestinationReport"
        },
    },{
        id: "app",
        title: ip + " &gt; Protocols/Applications",
        x: 6,
        y: 0,
        width: 7,
        height: 5,
        type: "success",
        userData: {
            fn: "createIPApplicationReport"
        },
    }];

    ReportFactory.ip = param.ip;
    ReportFactory.createIPUserReport = function( filter ){
        var rep = this.createTopProfileReport( filter, this.ip);
        return rep;
    };

    ReportFactory.createIPApplicationReport = function( filter ){
        var rep = this.createApplicationReport( filter, this.ip);
        return rep;
    };

    ReportFactory.createIPDestinationReport = function( filter ){
        var rep = this.createDestinationReport( filter, this.ip);
        return rep;
    }
}

var detail_db = MMTDrop.databaseFactory.createStatDB({id: "network.detail"});
var cTable    = ReportFactory.createDetailOfApplicationChart();

var cDetailTable2 = ReportFactory.createDetailOfApplicationChart2();
cDetailTable2.attachTo( new MMTDrop.Database(), false );

function loadDetail( ip_dest, app_id ){
    if( param.ip == undefined )
        return;
    var userData = {
        ip     : param.ip,
        ip_dest: ip_dest,
        app_id : app_id
    };
    if( ip_dest == undefined )
        ip_dest = "";
    else
        ip_dest = ', <strong>IP destination: </strong>' + ip_dest;

    var app_name = "";
    if( app_id )
        app_name = ', <strong>Application:</strong> ' + MMTDrop.constants.getProtocolNameFromID( app_id );

    cTable.userData = userData;

    var group_by = fPeriod.selectedOption().id;
    var period   = {begin: status_db.time.begin, end: status_db.time.end};
    period = JSON.stringify( period );

    detail_db.reload({"userData": userData, "period": period, period_groupby: group_by}, function( new_data, table){
        table.attachTo( detail_db, false );
        table.renderTo( "popupTable" )
        $("#detailItem").html('<strong>IP source:</strong> '+ param.ip + ip_dest + app_name );
        $("#modalWindow").modal();
    }, cTable);


     if( $("#modalWindow").length === 0 ){
        var modal = '<div class="modal modal-wide fade" tabindex="-1" role="dialog" aria-hidden="true" id="modalWindow">'
                    +'<div class="modal-dialog">'
                    +'<div class="modal-content" >'
                    +'<div class="modal-header">'
                    +'<button type="button" class="close" data-dismiss="modal" aria-label="Close">&times;</button>'
                    +'<h4 class="modal-title">Detail</h4>'
                    +'</div>'
                    +'<div class="modal-body code-json">'
                    +'<div id="detailItem"/>'
                    +'<div id="popupTable"/>'
                    +'</div>'
                    +'</div></div></div>';

        $("body").append( $(modal) );
    }
}

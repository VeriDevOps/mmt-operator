/**
 * config:
 *  - elem:        DOM selector to render report
 * 	- channel:     where the report listens data to update its visualation
 *  - title:       title of report
 *  - chartType:   ['timeline', 'pie', 'bar', 'tree', 'table']
 *  - filterTypes: ['class', 'app', 'datatype']
 *  - metric: an array of elements ['stat', 'flow']
 *  		  or a column index, eg, MMTDrop.constants.StatsColumn.DATA_VOLUME
 *  	
 */


var ReportFactory = {
    getCol: function (col, isIn) {
        var COL = MMTDrop.constants.StatsColumn;
        var tmp = "PAYLOAD_VOLUME";
        if (col == COL.DATA_VOLUME)
            tmp = "DATA_VOLUME";
        else if (col == COL.PACKET_COUNT)
            tmp = "PACKET_COUT";

        var label;
        if (isIn) {
            label = "In";
            tmp = "DL_" + tmp;
        } else {
            label = "Out";
            tmp = "UL_" + tmp;
        }
        return {
            id: COL[tmp].id,
            label: label,
            type: "area"
        };
    },

    createProtocolReport: function (fProbe, database) {
        var self = this;
        var COL = MMTDrop.constants.StatsColumn;
        var fDir = MMTDrop.filterFactory.createDirectionFilter();
        var fMetric = MMTDrop.filterFactory.createMetricFilter();

        var cTree = MMTDrop.chartFactory.createTree({
            getData: {
                getDataFn: function (db) {
                    var col = fMetric.selectedOption();
                    var cols = [{
                        id: col.id,
                        label: "All"
                    }];
                    var dir = fDir.selectedOption().id;
                    if (dir != 0)
                        cols = [self.getCol(col, dir == 1)];
                    /*    
                    if (fProbe.selectedOption().id != 0)
                        cols.push({
                            id: COL.DATA_VOLUME.id,
                            label: "Data"
                        });
                    */
                    return db.stat.getDataTableForChart(cols, true);
                }
            },
            click: function (e) {
                if (Array.isArray(e) == false)
                    return;

                var data = database.stat.filter([{
                    id: COL.APP_PATH.id,
                    data: e
                }]);
                var oldData = database.data();

                //set new data for cLine
                database.data(data);
                cLine.attachTo(database);
                if (cLine.isVisible())
                    cLine.redraw();

                cPie.attachTo(database);

                if (cPie.isVisible())
                    cPie.redraw();
                //reset
                database.data(oldData);
            },
            afterRender: function (chart) {
                //console.log( chart )
                //clear old selected
                var el;
                var $treetable = $(".treetable");
                var $ethernet = $(".treetable tbody .selected");
                $(".treetable tbody tr").each(function (index) {
                    var el = $(this);
                    var sels = ["99.178.178", //IP.IP
                                "99.178.163", //IP.ICMP
                                "99.178.166", //IP.IGMP
                               "99.178.354", //IP.TCP
                               "99.178.376", //IP.UDP
                               "99.30"
                               ]
                    var id = el.data("tt-id");
                    if (sels.indexOf(id) >= 0) {
                        el.addClass("selected");

                        $treetable.treetable("collapseNode", id);
                    }
                });
                if ($ethernet != undefined)
                    $ethernet.trigger("click");
            }
        });

        var cLine = MMTDrop.chartFactory.createTimeline({
            //columns: [MMTDrop.constants.StatsColumn.APP_PATH]
            getData: {
                getDataFn: function (db) {
                    var col = fMetric.selectedOption();
                    var dir = fDir.selectedOption().id;
                    var colToSum = col.id;
                    if (dir != 0)
                        colToSum = self.getCol(col, dir == 1).id;

                    var colsToGroup = [COL.TIMESTAMP.id,
						               COL.APP_PATH.id];

                    var data = db.data();
                    data = MMTDrop.tools.sumByGroups(data, [colToSum], colsToGroup);

                    var arr = [];
                    var header = [];

                    for (var time in data) {
                        var o = {};
                        o[COL.TIMESTAMP.id] = time;

                        var msg = data[time];
                        for (var path in msg) {
                            o[path] = msg[path][colToSum];
                            if (header.indexOf(path) == -1)
                                header.push(path);
                        }
                        arr.push(o);
                    }
                    var columns = [COL.TIMESTAMP];
                    for (var i = 0; i < header.length; i++) {
                        var path = header[i];
                        columns.push({
                            id: path,
                            label: //MMTDrop.constants.getProtocolNameFromID(MMTDrop.constants.getAppIdFromPath(path)),
                                MMTDrop.constants.getPathFriendlyName(path),
                            type: "area"
                        });
                    }
                    return {
                        data: arr,
                        columns: columns,
                        ylabel: fMetric.selectedOption().label
                    };
                },
            }
        });

        cLine = MMTDrop.chartFactory.createTimeline({
            getData: {
                getDataFn: function (db) {
                    var noApp = db.stat.getAppIDs().length;
                    var col = fMetric.selectedOption();
                    var dir = fDir.selectedOption().id;
                    var colToSum = col;
                    if (dir != 0)
                        colToSum = self.getCol(col, dir == 1);

                    col = colToSum;

                    //if( noApp == 1)
                    //	return db.stat.getDataTimeForChart( col, false, false );

                    var obj = db.stat.getDataTimeForChart(col, true, true);

                    //the first column is Timestamp, so I start from 1 instance of 0
                    for (var i = 1; i < obj.columns.length; i++) {
                        var msg = obj.columns[i];
                        var path = msg.label;
                        var arr = path.split(".");

                        path = "";
                        for (var j = arr.length - 1; j >= 0; j--) {
                            if (path == "")
                                path = arr[j];
                            else
                                path += "." + arr[j];
                        }
                        msg.label = path; //donot need add its grand father name

                        obj.columns[i].type = "area"; //area-spline
                    }

                    var cols = [];

                    for (var i = 1; i < obj.columns.length; i++)
                        cols.push(obj.columns[i]);

                    cols.sort(function (a, b) {
                        return a.label > b.label;
                    });

                    cols.unshift(obj.columns[0]);

                    obj.columns = cols;


                    return obj;
                }
            }
        });
        var cPie = MMTDrop.chartFactory.createPie({
            getData: {
                getDataFn: function (db) {
                    var col = fMetric.selectedOption();
                    var dir = fDir.selectedOption().id;
                    var colToSum = col.id;
                    if (dir != 0)
                        colToSum = self.getCol(col, dir == 1).id;

                    var colsToGroup = [COL.APP_PATH.id];

                    var data = db.data();
                    data = MMTDrop.tools.sumByGroups(data, [colToSum], colsToGroup);

                    var arr = [];
                    var header = [];

                    for (var key in data) {
                        var o = {};
                        o[COL.APP_PATH.id] = MMTDrop.constants.getPathFriendlyName(key);

                        var msg = data[key];
                        o[colToSum] = msg[colToSum];

                        arr.push(o);
                    }
                    var columns = [COL.APP_PATH, col];
                    return {
                        data: arr,
                        columns: columns,
                        ylabel: col.label
                    };
                },
            }
        });
        //redraw cLine when changing fMetric
        fMetric.onFilter(function () {
            if (cLine.isVisible())
                cLine.redraw();
            if (cPie.isVisible)
                cPie.redraw();
        });


        var dataFlow = [{
            object: fProbe,
            effect: [{
                object: fDir,
                effect: [{
                    object: fMetric,
                    effect: [{
                        object: cTree
                    }]
				}, ]
            }]
			}, ];

        var report = new MMTDrop.Report(
            // title
            null,

            // database
            database,

            // filers
					[fDir, fMetric],

            //charts
					[
                {
                    charts: [cTree],
                    width: 4
                },
                {
                    charts: [cLine, cPie],
                    width: 8
                },
					 ],

            //order of data flux
            dataFlow
        );
        return report;
    },
    createNodeReport: function (fProbe, database) {

        var COL = MMTDrop.constants.FlowStatsColumn;
        //var fDir    = MMTDrop.filterFactory.createDirectionFilter();
        fProbe = MMTDrop.filterFactory.createProbeFilter();
        var fPeriod = MMTDrop.filterFactory.createPeriodFilter();
        var fMetric = MMTDrop.filterFactory.createFlowMetricFilter();

        database = MMTDrop.databaseFactory.createFlowDB();

        var cTable = MMTDrop.chartFactory.createTable({
            getData: {
                getDataFn: function (db) {
                    var data = db.data();
                    var col = fMetric.selectedOption();

                    var sorted = false; //do not sort by default

                    var label = col.label;
                    col = col.id;

                    var probes = db.stat.getProbes();
                    var noProbes = probes.length;

                    var obj = MMTDrop.tools.sumByGroups(db.data(), [col], [COL.APP_NAME.id, COL.PROBE_ID.id]);
                    var arr = [];
                    for (var time in obj) {
                        var oo = {};
                        oo[COL.APP_NAME.id] = time;
                        console.log("TIME: " + time);
                        oo[col] = {};
                        for (var probe in obj[time])
                            if (noProbes == 1)
                                oo[col] = obj[time][probe][col];
                            else
                                oo[col][probe] = obj[time][probe][col];

                        arr.push(oo);
                    }

                    var columns = [COL.APP_NAME];
                    if (noProbes == 1)
                        columns.push({
                            id: col,
                            label: "Probe " + probes[0]
                        });
                    else
                        columns.push({
                            id: col,
                            label: "Probe",
                            probes: probes
                        });

                    return {
                        data: arr,
                        columns: columns,
                        ylabel: label,
                        probes: probes
                    };
                }
            }
        });

        var dataFlow = [{
            object: fPeriod,
            effect: [{
                object: fProbe,
                effect: [{
                    object: fMetric,
                    effect: [{
                        object: cTable
                }]
								}]
					}]
        }];

        var report = new MMTDrop.Report(
            // title
            null,

            // database
            database,

            // filers
					[fPeriod, fProbe, fMetric],

            // charts
					[
                {
                    charts: [cTable],
                    width: 12
                },
					 ],

            //order of data flux
            dataFlow
        );
        return report;
    },

    createRealtimeTrafficReport: function (fProbe, database) {
        var _this = this;
        var rep = _this.createTrafficReport(fProbe, database, true);

        var COL     = MMTDrop.constants.StatsColumn;
        var cLine   = rep.groupCharts[0].charts[0];
        var fDir    = rep.filters[0];
        var fMetric = rep.filters[1];

        //add data to chart each second (rather than add immediatlly after receiving data)
        //this will avoid that two data are added very closely each

        var newData = {};
        var lastAddMoment = 0;

        fDir.onFilter( function(){
            newData = {};
        });
        
        var appendMsg = function (msg) {
            if( msg[ COL.APP_ID.id ] != 99)
                return;
            //console.log( msg );
            var chart = cLine.chart;
            if (chart == undefined)
                return;

            //the chart cLine in 
            //- probeMode if it shows total data of each probe
            //- appMode   if it shows data of each app in a probe
            var probeId = fProbe.selectedOption().id;
            var isInProbeMode = probeId == 0;

            var col = fMetric.selectedOption();
            var dir = fDir.selectedOption().id;
            
            var cols = [];
            if (dir == 0){
                cols = [{id: col.id, label: "All"}];
                cols.push( _this.getCol(col, true) );
                cols.push( _this.getCol(col, false) );
            }else
                cols = [ _this.getCol(col, dir == 1) ];

            //receive msg of a probe different with the one beeing showing
            if (!isInProbeMode &&
                probeId != msg[COL.PROBE_ID.id]) {
                console.log(" donot concern");
                return;
            }


            var time = msg[COL.TIMESTAMP.id] ;
            for( var c in cols ){
                c = cols[c];
                var serieName = c.label;

                if (isInProbeMode)
                    serieName = "Probe-" + msg[COL.PROBE_ID.id];
                var val  = msg[c.id];
                
                //For test only
                //if( val == 0)
                //    val = Math.round(Math.random() * 1000);
                
                if (newData[serieName] === undefined)
                    newData[serieName] = 0;

                newData[serieName] += val;
            }
            
            //update to chart each x seconds
            if (time - lastAddMoment > 2*1000 && newData != {}) {
                //chart.zoom.enable( false );

                var date = new Date(time);
                var xs   = chart.xs();

                var columns = [];
                //convert newData to columns format of C3js
                for (var s in newData) {
                    columns.push([s, newData[s]]);    //y value
                    columns.push(["x-" + s, date]);   //x value = time
                }

                //load new pair nameY: nameX

                chart.flow({
                    columns: columns,
                    length : 0,
                });


                //remove the points outside the graph
                
                var minX = date.getTime() - 1000 * 60 * 3; //3 min
                var data = chart.data.shown();

                //set null to all points outside the chart
                for (var i in data) {
                    var obj = data[i];

                    for (var j in obj.values) {
                        var p = obj.values[j];

                        if (p.x && p.x.getTime() < minX) {
                            p.value = null;
                            p.x = null;
                        }
                    }
                }

                //reset newData
                newData = {};
                lastAddMoment = time;
            }
        };


        database.onMessage(function (msg) {
            if (msg[COL.FORMAT_ID.id] != MMTDrop.constants.CsvFormat.STATS_FORMAT)
                return;
            appendMsg(msg);
        });

        return rep;
    },
    
    createTrafficReport: function (fProbe, database) {
        var _this = this;
        var COL = MMTDrop.constants.StatsColumn;

        var fDir = MMTDrop.filterFactory.createDirectionFilter();
        var fMetric = MMTDrop.filterFactory.createMetricFilter();

        var cLine = MMTDrop.chartFactory.createTimeline({
            getData: {
                getDataFn: function (db) {
                    var dir = fDir.selectedOption().id;
                    var col = fMetric.selectedOption();
                    var cols = [COL.TIMESTAMP];


                    //dir = 1: incoming, -1 outgoing, 0: All
                    if (dir == 0) {
                        cols.push({
                            id   : col.id,
                            label: "All"
                            //type : "line"
                        });
                        cols.push(_this.getCol(col, true));
                        cols.push(_this.getCol(col, false));
                    } else if (dir == 1)
                        cols.push(_this.getCol(col, true));
                    else
                        cols.push(_this.getCol(col, false));

                    var arr = [];
                    var ethernet = 99;
                    var data = db.data();
                    for (var i in data) {
                        var msg = data[i];
                        var proto = msg[COL.APP_ID.id];

                        if (proto != ethernet || msg[0] != 99)
                            continue;

                        var o = {};
                        for (var j in cols) {
                            var id = cols[j].id;
                            o[id] = msg[id];
                        }
                        arr.push(o);
                    }

                    return {
                        data   : arr,
                        columns: cols,
                        ylabel : col.label
                    };
                }
            }
        });

        var dataFlow = [{
            object: fDir,
            effect: [{
                object: fProbe,
                effect: [{
                    object: fMetric,
                    effect: [{
                        object: cLine
                    }]
								}]
					}]
        }];

        var report = new MMTDrop.Report(
            // title
            null,

            // database
            database,

            // filers
					[fDir, fMetric],

            // charts
					[
                {
                    charts: [cLine],
                    width: 12
                },
					 ],

            //order of data flux
            dataFlow
        );
        return report;
    }
}
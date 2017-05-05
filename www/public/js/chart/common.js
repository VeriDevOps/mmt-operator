/*
//
//These 2 variables are defined in each tab.js (eg: link.js, network.js)
var arr = [
    {
        id: "realtime",
        title: "Traffic in Realtime",
        x: 0,
        y: 0,
        width: 6,
        height: 6,
        type: "success",
        userData: {
            fn: "createRealtimeTrafficReport"
        },
    },
];

var availableReports = {
    "createNodeReport":     "Nodes",
}

*/

MMTDrop.setOptions({
    //serverURL: "http://localhost:8088",
});


if( ReportFactory === undefined )
    var ReportFactory = {};

for (var i in ReportFactory)
        MMTDrop.reportFactory[i] = ReportFactory[i];

ReportFactory = MMTDrop.reportFactory;

const fPeriod = MMTDrop.filterFactory.createPeriodFilter();
const fProbe  = MMTDrop.filterFactory.createProbeFilter();
const reports = [];

const COL     = MMTDrop.constants.StatsColumn;
const HTTP    = MMTDrop.constants.HttpStatsColumn;
const SSL     = MMTDrop.constants.TlsStatsColumn;
const TLS     = MMTDrop.constants.TlsStatsColumn;
const RTP     = MMTDrop.constants.RtpStatsColumn;
const FTP     = MMTDrop.constants.FtpStatsColumn;

//this database is reload firstly when a page is loaded
//this db contains status of probe, interval to get data of reports
var status_db = new MMTDrop.Database({collection: "status"});

var fAutoReload = {
  hide : function(){
    $("#autoReload").hide();
    $("#isAutoReloadChk").prop("checked", false);
  }
};

$(function () {
    'use strict'

    if( typeof arr === "undefined" ){
        console.error("No Reports are defined!");
        $("#waiting").hide();
        return;
    }

    $("#waiting").on("click", function(){
            $("#waiting").hide();
    });

    if (fPeriod == undefined) {
        throw new Error("Need to defined fPeriod filter")
    }

    if( typeof availableReports == "undefined" )
      var availableReports = [];

    //init toolbar-box
    if( arr.length == 1 )
      $("#deleteBtn").hide();
    if( MMTDrop.tools.object2Array(availableReports).length == 0 )
      $("#addBtn").hide();

    //fProbe: list of available probes in the period selected by fPeriod
    fProbe.storeState = false;
    fProbe.renderTo("toolbar-box");
    fProbe.onFilter( function( opt ){
      MMTDrop.tools.reloadPage("probe_id=" + opt.id );
    });
    //update options of this combobox based on value in status_db
    fProbe.reloadOptions = function(){
      var probes_status = status_db.probeStatus;
      var arr = [];
      const select_id = URL_PARAM.probe_id;
      for( var i in probes_status ){
        if( i == select_id )
          arr.push({ id: i, label: "Probe " + i, selected: true });
        else
          arr.push({ id: i, label: "Probe " + i});
      }

      if( arr.length > 1 ){
        if( select_id == undefined || select_id == "all" )
          arr.unshift({id: "undefined", label: "All", selected: true});
        else
          arr.unshift({id: "undefined", label: "All"})

        fProbe.option( arr );
        fProbe.redraw();
      }else {
      }
    }
    //end fProbe

    //
    fPeriod.storeState = false;
    fPeriod.renderTo("toolbar-box");
    if( URL_PARAM.period )
      fPeriod.selectedOption({id: URL_PARAM.period});
    fPeriod.onFilter( function( opt ){
      MMTDrop.tools.reloadPage("period=" + opt.id );
    });


    var renderReport = function (node) {
        try {
            var key = node.userData.fn;
            var cb = ReportFactory[key];
            if (MMTDrop.tools.isFunction(cb)) {
                var rep = ReportFactory[key]( fPeriod );
                if (rep) {
                    rep.renderTo(node.id + "-content");
                    reports.push( rep );
                }else{
                  //rep is not a real report (it could be a form, ...)
                  //=> hide loading icon
                  loading.onHide();
                }
            }

            //loading is defined in each tab
            if( loading )
                loading.totalChart ++;

        } catch (ex) {
            console.error("Error when rending report [" + key + "] to the DOM [" + node.id + "]");
            console.error(ex.stack);
        }
    }

    var data = Grid.together(arr);

    for (var i in data) {
        var node = data[i];
        renderReport( node);
    }

    //reload databases of reports
    var reloadReports = function( data, group_by ){
      //reload options of fProbe
      fProbe.reloadOptions();

      //there are no reports
      if (reports.length == 0 ){
        loading.onHide();
      }else{
        var probe_id = URL_PARAM.probe_id;
        try{
            for( var i=0; i<reports.length; i++ ){
              //update parameter
              var param = {};
              param.period = status_db.time;
              param.period_groupby = group_by;
              if( probe_id != undefined ){
                param.probe = parseInt( probe_id );
              }


              reports[ i ].database.reload( param , function(new_data, rep){
                    //for each element in dataFlow array
                    for( var j in rep.dataFlow ){
                        var filter = rep.dataFlow[ j ];
                        if(!filter) return;

                        filter = filter.object;
                        if (filter instanceof MMTDrop.Filter)
                            filter.filter();
                        else if( filter ){ //chart
                            filter.attachTo( rep.database );
                            filter.redraw();
                        }
                    }
                }, reports[ i ]);
            }
        }catch ( err ){
            loading.onHide();
            console.error( err );
        }
      }//end if
    }

    //fire the chain of filters
    setTimeout( function(){
      console.log("loading status_db");
      status_db.reload({ action: fPeriod.getSamplePeriodTotal()*1000 }, reloadReports, fPeriod.selectedOption().id );
    }, 500 );

    //update the modal show list of reports to user
    var $modal = $("#modal");

    $modal.find(".btn-group .btn").on("click", function () {
        var $el = $(this);
        $("#reportColor").val($el.data("type"));
    })

    var $sel = $("#reportList");
    for (var i in availableReports) {
        var label = availableReports[i];
        $sel.append($("<option>", {
            "value": i,
            "text": label + " Report"
        }));
    }

    //when use selected a kind of report and click on "Done"
    $modal.find("#doneBtn").on("click", function () {

        $modal.modal("hide");

        var id = $sel.val();
        var label = $("#reportTitle").val();

        if (label == undefined || label == "")
            label = availableReports[id] + " Report";

        var node = {
            id: "custom-report-" + MMTDrop.tools.getUniqueNumber(),
            title: label,
            width: 12,
            height: 4,
            x: 0,
            y: 0,
            type: $("#reportColor").val(),
            userData: {
                fn: id
            }
        };

        Grid.add_widget(node);
        Grid.save_grid();

        window.location.reload();
        //renderReport(node);

    });


    var reloadCount = 0;
    var auto_reload_timer = null;
    function start_auto_reload_timer(){
        if( auto_reload_timer )
            clearInterval( auto_reload_timer );

        var p = fPeriod.getDistanceBetweenToSamples() * 1000;
        if( p <= 60*1000 )
            p = 60*1000;
        //always reload each 60 seconds
        p = 60*1000;
        auto_reload_timer = setInterval( function(){
            reloadCount ++;
            console.log( reloadCount + " Reload ======>");

            if( reloadCount >= 10 ){
                location.reload();
                throw new Error("Stop");
            }

            loading.onShowing();
            status_db.reload({}, reloadReports, fPeriod.selectedOption().id);
        }, p);
    }
    $("#isAutoReloadChk").change( function(){
        var is_on = $(this).is(":checked");
        console.log( "autoReload: " + is_on );
        MMTDrop.tools.localStorage.set("autoreload", is_on, false);
        if( is_on ){
            start_auto_reload_timer();
        }else{
            clearInterval( auto_reload_timer );
        }
    });


    var checked = MMTDrop.tools.localStorage.get("autoreload", false);
    //checkbox default is "true"
    if(  checked === false ){
        $("#isAutoReloadChk").prop("checked", false);
    }else
        //checkbox is already checked ==> trigger its event
        $("#isAutoReloadChk").trigger("change");


    //download images
    $("#exportBtn").click( function(){
      d3.selectAll("path").attr("fill", "none");
      d3.selectAll(".tick line, path.domain, c3-ygrid").attr("stroke", "black");
      d3.selectAll(".c3-line").attr("stroke-width", "2px");
      d3.selectAll(".c3-ygrid").attr("stroke", "#aaa").attr("stroke-dasharray","3 3");

      var $form = $("#frmUploadImage");
      //for the first time
      if( $form.length == 0){

        $form = MMTDrop.tools.createDOM({
          type : "<form>",
          attr : {
            id     : "frmUploadImage",
            method : "POST",
            style  : "display: none"
          },
          children:[{
            type : "<input>",
            attr : {
              name : "data",
            }
          }]
        });
        $("body").append($form);
      }

      function render_image( index ){
        if( index >= data.length ) return;
        var node       = data[index];
        var targetElem = $("#" + node.id);

        console.log( "Rendering image for tab." + node.id)

        // First render all SVGs to canvases
        var elements = targetElem.find('svg').map(function() {
            var svg    = $(this);
            var canvas = $('<canvas>');

            // Get the raw SVG string and curate it
            var content = svg[0].outerHTML.trim();
            canvg( canvas[0], content );

            //temporary replace the svg by the canvas
            //the svg will be put back after rendering image
            svg.replaceWith(canvas);

            return {
                svg   : svg,
                canvas: canvas
            };
        });
        //return;
        // At this point the container has no SVG, it only has HTML and Canvases.
        html2canvas( targetElem, {
          //allowTaint: true,
          letterRendering: true,
	        onrendered: function(canvas) {
            var ctx=canvas.getContext("2d");

            // Put the SVGs back in place
            elements.each(function() {
              this.canvas.replaceWith(this.svg);
            });

            //add water mark
	    	    ctx.font      = "14px Arial";
		        ctx.fillStyle = "grey";
	    	    ctx.fillText("Montimage", 15, canvas.height - 12);

		        var fileName = node.title + "-" + (new Date()).toLocaleString() + ".png";

            try {
              var isFileSaverSupported = !!new Blob;
              //OK, your browser support Blog
              canvas.toBlob(function(blob) {
                  saveAs(blob, fileName);
              });
            } catch (e) {
              $form.attr("action", "/export?filename=" + fileName);
              $form.attr("method", "POST");
              //get image based_64
              $form.children().val( canvas.toDataURL("image/png") );
              $form.submit();
            }


            //for others reports
            if( index < data.length - 1 )
              setTimeout( render_image, 1000, index + 1);
	        }
	      });// end html2canvas
      }
      render_image( 0 );

    })//end $("#exportBtn").click
});







//load a popup graph represeting trafic of last 5 minutes of an IP/APP/MAC/Profile/...
function createTrafficReport( collection, key, id ){
  var getCol = function (col, isIn) {
      var COL = MMTDrop.constants.StatsColumn;

      var tmp = "PAYLOAD_VOLUME";
      if (col.id == COL.DATA_VOLUME.id)
          tmp = "DATA_VOLUME";
      else if (col.id == COL.PACKET_COUNT.id)
          tmp = "PACKET_COUNT";

      var label;
      if (isIn) {
          label = "In";
          tmp = "DL_" + tmp;
      } else {
          label = "Out";
          tmp = "UL_" + tmp;
      }
      return {
          id   : COL[tmp].id,
          label: label,
          total: 0, //total data IN/OUT
          //type: "area"
      };
  }

  var formatTime = function( date ){
        return moment( date.getTime() ).format( fPeriod.getTimeFormat() );
  };

  var fMetric  = MMTDrop.filterFactory.createMetricFilter();
  var COL      = MMTDrop.constants.StatsColumn;



  var group = { _id : {} };
  [ COL.TIMESTAMP.id , COL.FORMAT_ID.id ].forEach( function( el, index){
    group["_id"][ el ] = "$" + el;
  } );
  [ COL.UL_DATA_VOLUME.id, COL.DL_DATA_VOLUME.id, COL.ACTIVE_FLOWS.id, COL.UL_PACKET_COUNT.id, COL.DL_PACKET_COUNT.id, COL.UL_PAYLOAD_VOLUME.id, COL.DL_PAYLOAD_VOLUME.id ].forEach( function( el, index){
    group[ el ] = {"$sum" : "$" + el};
  });
  [ COL.TIMESTAMP.id , COL.FORMAT_ID.id ].forEach( function( el, index){
    group[ el ] = {"$last" : "$"+ el};
  });
  var match = {};
  if( key !== "match")
    match[ key ] = id;
  else
    match = JSON.parse( id );

  var query = [{"$match" : match}, {"$group" : group}];
  var database = new MMTDrop.Database({collection: "data_" + collection, action: "aggregate",
    query: query});


    var cLine = MMTDrop.chartFactory.createTimeline({
        getData: {
            getDataFn: function (db) {
                var col = fMetric.selectedOption();
                var cols = [];

                var period = fPeriod.getDistanceBetweenToSamples();

                var ylabel = col.label;
                col.total  = 0;

                if (col.id === MMTDrop.constants.StatsColumn.PACKET_COUNT.id) {
                    ylabel += " (pps)";
                } else if (col.id === MMTDrop.constants.StatsColumn.ACTIVE_FLOWS.id) {
                    ylabel += " (total)";
                    period  = 1;
                } else {
                    period /= 8; //  bit/second
                    ylabel += " (bps)";
                }

                if (col.id !== COL.ACTIVE_FLOWS.id) {
                    //dir = 1: incoming, -1 outgoing, 0: All
                    cols.push( getCol(col, true)); //in
                    cols.push( getCol(col, false)); //out
                } else
                    cols.push(col);

                var obj  = {};
                var data = db.data();

                for (var i in data) {
                    var msg   = data[i];
                    var time  = msg[COL.TIMESTAMP.id];
                    var exist = true;

                    //data for this timestamp does not exist before
                    if (obj[time] == undefined) {
                        exist = false;
                        obj[time] = {};
                        obj[time][COL.TIMESTAMP.id] = time;
                    }


                    for (var j in cols) {
                        var id = cols[j].id;

                        cols[j].total += msg[ id ];

                        if( msg[id] == undefined )
                            msg[id] = 0;

                        if (exist)
                            obj[time][id] += msg[id] / period;
                        else
                            obj[time][id] = msg[id] / period;
                    }
                }

                for (var j in cols)
                  if (col.id === COL.DATA_VOLUME.id || col.id === COL.PAYLOAD_VOLUME.id)
                    cols[j].label += " ("+ MMTDrop.tools.formatDataVolume( cols[j].total ) +"B)";
                  else
                    cols[j].label += " ("+ MMTDrop.tools.formatLocaleNumber( cols[j].total ) +")";

                //first columns is timestamp
                cols.unshift(COL.TIMESTAMP);

                var $widget = $("#" + cLine.elemID).getWidgetParent();
                var height  = $widget.find(".grid-stack-item-content").innerHeight();
                height     -= $widget.find(".filter-bar").outerHeight(true) + 15;

                return {
                    data    : obj,
                    columns : cols,
                    ylabel  : ylabel,
                    height  : height,
                    addZeroPoints:{
                        time_id       : 3,
                        time          : status_db.time,
                        sample_period : 1000 * fPeriod.getDistanceBetweenToSamples(),
                        probeStatus   : {}//data.length == 0 ? {} : status_db.probeStatus
                    },
                };
            }
        },

        chart: {
            data:{
                type: "line"//step
            },
            color: {
                pattern: ['orange', 'green']
            },
            grid: {
                x: {
                    show: false
                },
                y: {
                    show: true
                }
            },
            axis: {
                x: {
                    tick: {
                        format: formatTime,
                    }
                },
            },
            zoom: {
                enabled: false,
                rescale: false
            },
            tooltip:{
                format: {
                    title:  formatTime,
                    name : function (name, ratio, id, index) {
                      return name.split(" ")[0]; //return only In/Out
                    }
                }
            },
        },

        afterRender: function (chart) {
            //register resize handle
            var $widget = $("#" + chart.elemID).getWidgetParent();
            $widget.on("widget-resized", function (event, $widget) {
                var height = $widget.find(".grid-stack-item-content").innerHeight();
                height -= $widget.find(".filter-bar").outerHeight(true) + 15;
                chart.chart.resize({
                    height: height
                });
            });
        }
    });


  var dataFlow = [{
            object: fMetric,
            effect: [{object: cLine}]
                      }];

  var report = new MMTDrop.Report(
      // title
      "",
      // database
      database,
      // filers
		[fMetric],
      //charts
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



function createPopupReport( collection, key, id, title, probe_id  ){
  if( collection != "mac")
    collection = "session";

  var formatTime = function( date ){
        return moment( (new Date(date)).getTime() ).format( fPeriod.getTimeFormat() );
  };
  var rep   = createTrafficReport( collection, key, id );
  var $modal = MMTDrop.tools.getModalWindow("_pop_report");
  $modal.$title.html("Traffic of " + title + " (in period from "+ formatTime( status_db.time.begin )  +" to "+
    formatTime( status_db.time.end )  +")" );
  $modal.$content.html('<div id="_pop_report_graphs" style="height: 200px; width: 100%" class="">'
                      +'<div class="center-block loading text-center" style="width: 100px; margin-top: 150px"> <i class="fa fa-refresh fa-spin fa-3x fa-fw"></i>'
                      +'<span class="sr-only">Loading...</span></div>'
                      +'</di>');
  $modal.modal();

  setTimeout( function(){
    rep.renderTo("_pop_report_graphs");
    var param = rep.database.param;
    var param = {period: status_db.time, period_groupby: fPeriod.selectedOption().id};
    if( probe_id ){
      param.probe = [ probe_id ];

      var $match = {};
      $match[ COL.PROBE_ID.id ] =  probe_id ;
      param.query = [{$match: $match}];
    }

    if( collection == "mac" )
      param.no_group = true;


    rep.database.reload( param , function(new_data, rep){
          //for each element in dataFlow array
          for( var j in rep.dataFlow ){
              var filter = rep.dataFlow[ j ];
              if(!filter) return;

              filter = filter.object;
              if (filter instanceof MMTDrop.Filter)
                  filter.filter();
              else if( filter ){ //chart
                  filter.attachTo( rep.database );
                  filter.redraw();
              }
          }
      }, rep);
  }, 1000);
}

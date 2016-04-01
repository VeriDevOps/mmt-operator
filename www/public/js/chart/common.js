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

var fPeriod = MMTDrop.filterFactory.createPeriodFilter();
var reports = [];

$(function () {
    'use strict'
    
    $("#waiting").on("click", function(){
            $("#waiting").hide();
    });
    
    if (fPeriod == undefined) {
        throw new Error("Need to defined fPeriod filter")
    }


    fPeriod.renderTo("toolbar-box");
    fPeriod.onChange( loading.onShowing  );

    var renderReport = function (node) {
        try {
            var key = node.userData.fn;
            var cb = ReportFactory[key];
            if (MMTDrop.tools.isFunction(cb)) {
                var rep = ReportFactory[key]( fPeriod );
                if (rep) {
                    rep.renderTo(node.id + "-content");
                    reports.push( rep );
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


    fPeriod.onFilter( function( opt ){
        console.log("fProbe filtering");
        try{
            for( var i=0; i<reports.length; i++ ){

                reports[ i ].database.reload({ period :  opt.id}, function(new_data, rep){
                    var filter = MMTDrop.tools.getFirstElement(rep.dataFlow);
                    if(!filter) return;

                    filter = filter.object;
                    if (filter instanceof MMTDrop.Filter)
                        filter.filter();
                    else if( filter ){ //chart
                        filter.attachTo( rep.database );
                        filter.redraw();
                    }

                }, reports[ i ]);
            }
        }catch ( err ){
            loading.onHide();
        }
    });
    
    //fire the chain of filters
    setTimeout( function(){
        fPeriod.filter(); 
    }, 0 );



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
        //p = 10*1000;
        auto_reload_timer = setInterval( function(){
            reloadCount ++;
            console.log( reloadCount + " Reload ======>");
            
            if( reloadCount >= 10 ){
                location.reload();
                throw new Error("Stop");
            }
            
            loading.onShowing();
            fPeriod.filter();
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

});
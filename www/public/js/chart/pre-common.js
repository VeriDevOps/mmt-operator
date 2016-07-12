var Loading = function( ){
    this.chartLoaded = 0;
    this.totalChart  = 0;
    var _his = this;
    this.onChartLoad = function(){
        _his.chartLoaded ++;

        var ts = (new Date()).getTime() - ts_start;
        console.log( "renderd " + _his.chartLoaded + ", took " + ts + " ms" );

        if( _his.chartLoaded >= _his.totalChart )
            setTimeout( function( l ){
                l.onHide();
            }, 500, _his );
    }

    this.onHide = function(){
        waiting.hide();
    }

    this.onShowing = function(){
        waiting.show();
        _his.chartLoaded = 0;
        ts_start = (new Date()).getTime();
    }
}

var loading = new Loading();
MMTDrop.callback = {
    chart : {
        afterRender : loading.onChartLoad
    }
};

var ts_start = 0;

$( function(){
    ts_start = (new Date()).getTime();
    //loading.onHide();
} );

MMTDrop.setOptions({
    format_payload: true
});


//hide animation if 2 consecutif refreshes are less than 5seconds;
var now = (new Date()).getTime();
var lastRefresh = MMTDrop.tools.cookie.get("last_load");
MMTDrop.tools.cookie.set("last_load", now, 1);

if( lastRefresh == undefined ) lastRefresh = 0;
if( now - lastRefresh < 10000 ){
  //remove animation
  $('<style type="text/css">\
  .c3-chart-arc .c3-chart-line{animation: none; -ms-animation: none; -moz-animation: none;-webkit-animation: none;}\
</style>').appendTo("head");

}

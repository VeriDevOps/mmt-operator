var arr = [
    {
        id: "sla",
        title: "Overview of Metrics",
        x: 0,
        y: 0,
        width: 12,
        height: 8,
        type: "success",
        userData: {
            fn: "createUploadForm"
        },
    }
];

var availableReports = {
}



//create reports

var ReportFactory = {
	createUploadForm: function( fPeriod ){
    var COL = MMTDrop.constants.StatsColumn;
    //UPDATE VALUE OF METRIX AFTER REDERING
    var isFirstUpdate = true;
    var updateValue = function (){
      if( isFirstUpdate ){
        //update value of metrics when changing period => reload status_db
        status_db.afterReload( updateValue );
        isFirstUpdate = false;
      }

      /*
      $("#header").html(" (from "
                        +  moment(new Date( status_db.time.begin )).format("YYYY-MM-DD HH:mm:ss")
                        + " to "
                        + moment(new Date( status_db.time.end )).format("YYYY-MM-DD HH:mm:ss")
                        + ")"
                    );
      */
      $(".alerts").each( function( index, el ){
        $(el).html( '<i class = "fa fa-refresh fa-spin fa-fw"/>' );
        var metricName = this.dataset["metricname"];
        switch (metricName) {
          case "rtt":
            getData( this, "data_session", COL.RTT.id);
            break;
          case "availability":
            getData( this, "availability", 4);
            break;
          case "location":
            getData( this, "data_session", COL.DST_LOCATION.id);
            break;
          default:
        }
      } );
    }

    function getQuery( col_id, el ){
      var obj  = el.dataset;
      var expr = obj.value;
      expr = expr
          .replace(">=", '"$gte":').replace(">", '"$gt" :')
          .replace("<=", '"$lte":').replace("<", '"$lt" :')
          .replace("!=", '"$ne":')
          .replace("=",  '"$eq" :');
      expr = JSON.parse( "{" + expr + "}" );

      var $match = {};
      //timestamp
      $match[ COL.TIMESTAMP.id ] = {"$gte": status_db.time.begin, "$lt" : status_db.time.end };
      //probeid
      $match[1] = parseInt( obj.compid );

      $match[ col_id ] = expr;
      var $group = {"_id": null, "count": {"$sum":1}};

      return { query: [ {"$match" : $match}, {"$group": $group}], period_groupby: fPeriod.selectedOption().id };
    }

    window._getQueryParam = getQuery;

    var total_db = new MMTDrop.Database({collection: "__", action: "aggregate", raw: true});

    function getData( el, collection, col_id ){
      //get number of alerts from database
      var param = getQuery( col_id, el );
      param.collection = collection;
      total_db.reload( param, function( data ){
        var val = 0;
        if( data.length > 0 )
          val = data[0].count;

        $(el).html( '<span class="badge">' + val + '</span>' );
      });
    }
    //END UPDATING values


    //REDNER TABLE OF METRIX
    var app_id = MMTDrop.tools.getURLParameters().app_id;
    if( app_id == undefined )
        app_id = "_undefined";
    //reder table of components and their metrics
    var loadForm = function( obj ){
      var table_rows = [];

      //get number
      var getNumberOfSelectedMetrics = function( sele ){
        var count = 0;
        for( var me in sele )
          if( sele[ me ].enable )
            count ++;
        return count;
      }
      //get either "metric" or "compoent" having the given id
      var getObject = function( label, id ){
        for( var i=0; i<obj[ label ].length; i++ )
          if( obj[label][i].id == id )
            return obj[label][i];
        return null;
      };

      //creat each row for each metric of a component
      for( var comp_id in obj.selectedMetric ){
        var selMetrics = obj.selectedMetric[ comp_id ];
        var comp       = getObject("components", comp_id)
        var $row = {
          type    : "<tr>",
          children: [{
            type :  "<td>",
            attr : {
              colspan : 5,
              style   : "font-weight: bold",
              text    : comp.title + " ("+ comp.url +")"
            }
          }]
        };

        //first row for component's title
        table_rows.push( $row );

        //each row for metric
        var j = 0;
        for( var me_id in selMetrics ){
          var me  = getObject("metrics", me_id );
          if( me == undefined ){
            if( comp.metrics )
              for( var k=0; k<comp.metrics.length; k++ )
                if( comp.metrics[k].id == me_id ){
                  me = comp.metrics[k];
                  break;
                }
          }
          var sel = selMetrics[ me_id ];

          if( sel == null || sel.enable == false )
            continue;

          j++;

          row = {
            type    : "<tr>",
            children: []
          };
          //first column
          if( j == 1 ){
            row.children.push({
              type : "<td>",
              attr : {
                rowspan : getNumberOfSelectedMetrics( selMetrics )
              }
            })
          }
          //metric name
          row.children.push({
            type : "<td>",
            attr : {
              text : me.title,
              width: "30%",
            }
          })

          //alert
          row.children.push({
            type     : "<td>",
            attr     : {
              align : "center",
              width : "20%",
            },
            children : [{
              type : "<a>",
              attr : {
                id      : "alert-" + comp.id + "-" + me.id,
                class   : "text-danger",
                text    : "alerts "
              },
              children : [{
                type     : "<span>",
                attr     : {
                  "class"           : "alerts",
                  "data-compid"     : comp.id,
                  "data-metricid"   : me.id,
                  "data-metricname" : me.name,
                  "data-value"      : sel.alert,
                  "html"            : '<i class = "fa fa-refresh fa-spin fa-fw"/>'
                }
              }]
            }]
          });
          //violation
          row.children.push({
            type     : "<td>",
            attr     : {
              align : "center",
              width : "20%",
            },
            children : [{
              type : "<a>",
              attr : {
                id      : "violation-" + comp.id + "-" + me.id,
                class   : "text-danger",
                text    : "violations "
              },
              children : [{
                type     : "<span>",
                attr     : {
                  "class"           : "alerts",
                  "data-compid"     : comp.id,
                  "data-metricid"   : me.id,
                  "data-metricname" : me.name,
                  "data-value"      : sel.violation,
                  "html"            : '<i class = "fa fa-refresh fa-spin fa-fw"/>'
                }
              }]
            }]
          });

          //detail
          row.children.push({
            type     : "<td>",
            attr     : {
              align : "center",
              width : "20%",
            },
            children : [{
              type : "<a>",
              attr : {
                class   : "btn btn-info",
                type    : "button",
                text    : "Report",
                onclick : "window._gotoURL( '" + me.name + "',"+ comp.id +" )"
              }
            }]
          });
          table_rows.push( row );
        }
      }

      var form_config = {
        type  : "<div>",
        attr  : {
          class  : "col-md-10 col-md-offset-1",
          style  : "margin-top: 20px"
        },
        children : [{
          type     : "<form>",
          children : [{
            type     : "<table>",
            attr     : {
              class : "table table-striped table-bordered table-condensed dataTable no-footer"
            },
            children : table_rows
          }]
        },{
          type: "<div>",
          children : [
            {
              type: "<a>",
              attr: {
                class   : "btn btn-danger pull-right",
                style   : "margin-left: 30px",
                text    : "Modify Metrics",
                href    : '/chart/sla/metric' + MMTDrop.tools.getQueryString(["app_id"])
              }
            }
          ]
        }]
      };

      $("#" + arr[0].id + "-content" ).append( MMTDrop.tools.createDOM( form_config ) ) ;
      //after redering the table, update their values (#alert, #violation)
      setTimeout( updateValue, 1000);

      //on click
      $(".alerts").each( function( index, el ){

        $(el).parent().onclick = function(){
            var $this = $(this);
            if( $this.text() == 0 )
              return;
            alert("click")
        }
      } );
    }
    //END RENDERING

    //LOAD METRIX FROM DATABASE
    MMTDrop.tools.ajax("/api/metrics/find?raw", [{$match: {app_id : app_id}}], "POST", {
      error  : function(){},
      success: function( data ){
        var obj = data.data[0];
        //does not exist ?
        if( obj == undefined )
          MMTDrop.tools.gotoURL("/chart/sla/upload", {param:["app_id"]});
        //there exists an application but user has not yet selected which metrics
        else if( obj.selectedMetric == undefined )
          MMTDrop.tools.gotoURL("/chart/sla/metric", {param:["app_id"]});
        else{
          loadForm( obj );
        }
      }
    } );


    window._gotoURL = function( name, probe_id ){
      MMTDrop.tools.gotoURL( '/chart/sla/'+ name +
        MMTDrop.tools.getQueryString( ["app_id"], "probe_id=" + probe_id + "&period_id=" + fPeriod.selectedOption().id ) );
    }
	}
}

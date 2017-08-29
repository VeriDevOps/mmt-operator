var arr = [
   {
      id: "sla-metric",
      title: "Metrics",
      x: 0,
      y: 0,
      width: 12,
      height: 6,
      type: "success",
      userData: {
         fn: "createUploadForm"
      },
   },{
      id: "sla-reaction",
      title: "Reactions",
      x: 0,
      y: 8,
      width: 12,
      height: 5,
      type: "warning",
      userData: {
         fn: "createReactionForm"
      },
   }
   ];

function getAppID (){
   if (MMTDrop.tools.getURLParameters().app_id == undefined )
      return "_undefined";
   return MMTDrop.tools.getURLParameters().app_id;
}

function getCompID (){
   const id = fProbe.selectedOption().id;
   return id;
}
//create reports

var ReportFactory = {
      createUploadForm: function( fPeriod ){
         const COL = MMTDrop.constants.StatsColumn;
         const total_db = new MMTDrop.Database({collection: "metrics_alerts", action: "aggregate", raw: true});

         //UPDATE VALUE OF METRIX AFTER REDERING
         var isFirstUpdate = true;
         const updateValue = function (){

            if( isFirstUpdate ){
               //update value of metrics when changing period => reload status_db
               status_db.afterReload( updateValue );
               isFirstUpdate = false;
            }


            //get number of alerts from database
            const
            TYPE   = "$4", //index of "type" in DB
            match   = { "0" : {"$gte": status_db.time.begin, "$lt" : status_db.time.end }, "1" : getAppID()},
            group   = { "_id": {"1": "$1", "2": "$2", "3": "$3"}, //group by app_id, comp_id and metric_id
                  "alert"     : { "$sum"   : {$cond: { if: { $eq: [ TYPE, "alert" ] }    , then: 1, else: 0 }}}, 
                  "violate"   : { "$sum"   : {$cond: { if: { $eq: [ TYPE, "violation" ] }, then: 1, else: 0 }} },
                  "app_id"    : { "$first" : "$1"},
                  "comp_id"   : { "$first" : "$2"},
                  "me_id"     : { "$first" : "$3"},};

            total_db.reload( {query : [{$match: match}, {$group : group}]}, function( data ){

               //find value (number of alerts/violations)
               const _getData = function ( el, data ){
                  var obj = {};
                  if (el.dataset)
                     obj  = el.dataset;
                  else
                     obj  = el;

                  const comp_id  = parseInt( obj.compid ),
                  metric_id  = obj.metricid,
                  type       = obj.type; //either "alert" or "violation"

                  for( var i=0; i<data.length; i++ ){
                     var o = data[i];
                     if( o.me_id == metric_id && o.comp_id == comp_id ){
                        //if having data?
                        if( o[ type ] )
                           return o[ type ];
                        break;
                     }
                  }
                  return 0;
               };//end _getData

               //for each element of either alert or violation of a metric
               //update value to DOM element
               $(".alerts").each( function( i, el ){
                  //$(el).html( '<i class = "fa fa-refresh fa-spin fa-fw"/>' );
                  const val = _getData( this, data );
                  
                  $(el).attr( "data-count", val );
                  /*
                  $(el)
                     .delay( 0+i*5000 )
                     .html( '<span class="badge">' + val + i + '</span>' );
                     */
                  setTimeout( function( e ){
                     $(e).html( '<span class="badge">' + val + '</span>' );
                     //ensure this element is showing
                     $("#div-alerts").scrollToChild( e, 100, 40 );
                  }, i*100, el );
               } );

               //update reaction table
               if( window._updateReactions )
                  //perform this function only after showing all alerts
                  setTimeout( window._updateReactions, 100 * $(".alerts").size() + 500 , data );
            });
         };//end of updateValue
         //END UPDATING values


         //REDNER TABLE OF METRIX
         //reder table of components and their metrics
         var loadForm = function( obj ){
            var table_rows = [];

            //get number
            const getNumberOfSelectedMetrics = function( sele ){
               var count = 0;
               for( var me in sele )
                  if( sele[ me ].enable )
                     count ++;
               return count;
            }
            //get either "metric" or "compoent" having the given id
            const getObject = function( label, id ){
               for( var i=0; i<obj[ label ].length; i++ )
                  if( obj[label][i].id == id )
                     return obj[label][i];
               return null;
            };

            //creat each row for each metric of a component
            for( var comp_id in obj.selectedMetric ){
               //show only probe that is indicated in URL by probe_id
               if( URL_PARAM.probe_id != undefined && URL_PARAM.probe_id != comp_id )
                  continue;
               var selMetrics = obj.selectedMetric[ comp_id ];
               var comp       = getObject("components", comp_id)
               if( comp.metrics == undefined || comp.metrics.length == 0 ) 
                  continue;

               var $row = {
                     type    : "<tr>",
                     children: [{
                        type :  "<td>",
                        attr : {
                           colspan : 5,
                           style   : "font-weight: bold",
                           html    : "<u>C" + comp_id + "</u>: "+ comp.title + " ("+ comp.ip +")"
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
                        html : "<u><b>" + me.name + "</b></u>: " + me.title,
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
                              "data-type"       : "alert",
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
                              "data-type"       : "violate",
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
                           onclick : "window._gotoURL( '" + me.name + "',"+ comp.id + ",'"+ sel.alert + "','" + sel.violation + "','&metric_id=" + me.id +  "' )"
                        }
                     }]
                  });
                  table_rows.push( row );
               }
            }

            var form_config = {
                  type  : "<div>",
                  attr  : {
                     style  : "position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px"
                  },
                  children : [{
                     type     : "<div>",
                     attr     : {
                        id     : "div-alerts",
                        style: "position: absolute; top: 35px; left: 0px; right: 0px; bottom: 0px; overflow: auto;",
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
                     }]
                  },{
                     type: "<div>",
                     attr: {
                        style: "position: absolute; top: 0px; right: 0px",
                     },
                     children : [
                        {
                           type: "<a>",
                           attr: {
                              class   : "btn btn-primary pull-right",
                              style   : "margin-left: 30px",
                              text    : "Modify Metrics",
                              href    : '/chart/sla/metric' + MMTDrop.tools.getQueryString(["app_id","probe_id"])
                           }
                        }
                        ]
                  }]
            };

            $("#sla-metric-content" ).append( MMTDrop.tools.createDOM( form_config ) ) ;

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
         MMTDrop.tools.ajax("/api/metrics/find?raw", [{$match: {app_id : getAppID() }}], "POST", {
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


         window._gotoURL = function( name, probe_id, alert_thr, violation_thr, extra_url ){

            alert_thr = alert_thr
            .replace(">=", '"$gte":').replace(">", '"$gt" :')
            .replace("<=", '"$lte":').replace("<", '"$lt" :')
            .replace("!=", '"$ne":')
            .replace("=",  '"$eq" :');
            violation_thr = violation_thr
            .replace(">=", '"$gte":').replace(">", '"$gt" :')
            .replace("<=", '"$lte":').replace("<", '"$lt" :')
            .replace("!=", '"$ne":')
            .replace("=",  '"$eq" :');

            switch( name ){
               case "availability":
                  break;
               case "vul_scan_freq":
               case "vuln_scan_freq":
                  name = "vuln_scan_freq";
                  break;
               default:
                  name = "alerts";
                  break;
            }
            
            MMTDrop.tools.gotoURL( '/chart/sla/'+ name +
                  MMTDrop.tools.getQueryString( ["app_id"], "&probe_id=" + probe_id + "&alert=" + alert_thr + "&violation=" + violation_thr + extra_url ) );
         }
      },

      
      createReactionForm: function( fPeriod ){

         //RENDER TABLE
         var renderTable = function ( obj, serverTime ){
            const INTERVAL_BETWEEN_2_IGNORES  = 1*60*1000; //1 minute(s)
            const INTERVAL_BETWEEN_2_PERFORMS = 2*60*1000; //1 minute(s)
            //this is used when use submit the form
            window._mmt = obj;

            const init_components = obj.components,
            reactions       = obj.selectedReaction;

            var table_rows = [{
               type    : "<thead>",
               children: [{
                  type     : "<tr>",
                  children : [{
                     type : "<th>",
                     attr : {
                        style : "text-align:right",
                        text  : "Conditions"
                     }
                  },{
                     type : "<th>",
                     attr : {
                        text : "Actions"
                     }
                  },{
                     type : "<th>",
                     attr : {
                        text : "Priority"
                     }
                  },{
                     type : "<th>",
                     attr : {
                        text : "#Triggers"
                     }
                  },{
                     type : "<th>",
                     attr : {
                        text : "Recommendation",
                        style: "width: 200px"
                     }
                  }]
               }]
            }];
            
            const _span = function( txt ){
               return '<span class="badge">' + txt + '</span>';
            }
            
            for( var i=0; i<init_components.length; i++){
               var comp = init_components[ i ];
               //show only probe that is indicated in URL by probe_id
               if( URL_PARAM.probe_id != undefined && URL_PARAM.probe_id != comp.id )
                  continue;

               //each row for a metric
               for( var react_id in reactions ){
                  var reaction = reactions[ react_id ];
                  
                  //show only reactions of this component
                  if( reaction.comp_id != comp.id || reaction.enable !== true )
                     continue;

                  //a row for description
                  table_rows.push({
                     type: "<tr>",
                     children: [{
                        type : "<td>",
                        attr : {
                           colspan: 6,
                           text   : reaction.note
                        }
                     }]
                  });
                  
                  //a new row for the detail
                  var row = {
                        type    : "<tr>",
                        attr    : {
                           style: "height: 45px; width: 200px;",
                        },
                        children: []
                  };

                  var conditionList = [];
                  for( var cond in reaction.conditions )
                     conditionList.push( _span( "C" + reaction.comp_id ) + _span( cond ) +' ('+ reaction.conditions[cond].map( _span ).join(' or ') +')' )

                     //condition
                     row.children.push({
                        type  : "<td>",
                        attr  : {
                           align: "right",
                           style: "border-right: none",
                           html : conditionList.join(" and ") + ' <span class="glyphicon glyphicon-arrow-right"></span>'
                        }
                     });

                  var actionList = [];
                  reaction.actions.forEach( function( val ){
                     actionList.push('<span class="badge">'+ val +'</span>');
                  });

                  //reaction
                  row.children.push({
                     type : "<td>",
                     attr : {
                        html : actionList.join(", ")
                     }
                  });
                  //priority
                  row.children.push({
                     type : "<td>",
                     attr :{
                        html : reaction.priority
                     }
                  });

                  //number of times this reaction was trigged
                  row.children.push({
                     type: "<td>",
                     attr: {
                        align: "right",
                        text : 0
                     }
                  });

                  //add  dummy buttons when the reaction is performing/ignored
                  if( reaction.action == "ignore" 
                     //ignored since last minute
                     && serverTime - reaction.action_time < INTERVAL_BETWEEN_2_IGNORES )
                     row.children.push({
                        type : "<td>",
                        attr : {
                           align: "right",
                           html : '<span class="text-danger" >Ignored</span>'
                        }
                     });
                  //reaction is performing
                  else if( reaction.action == "perform" 
                     && serverTime - reaction.action_time < INTERVAL_BETWEEN_2_PERFORMS ){
                     row.children.push({
                        type : "<td>",
                        attr : {
                           html :
                              (reaction.action_status == "start"?
                              '<span class="text-success">Performing</span> <i class="fa fa-spinner fa-pulse fa-fw"></i>'
                              :'<span class="text-success">Performed</span>')
                        }
                     });
                  }else
                     row.children.push({
                        type : "<td>",
                        attr : {
                           align: "center",
                           class: "reactions",
                           id   : "reaction-" + react_id,
                           "data-reaction"    : JSON.stringify( reaction ),
                           "data-reaction-id" : react_id,
                           html : "checking ..."
                        },
                     });

                  table_rows.push( row );
               }
            }

            var form_config = {
                  type  : "<div>",
                  attr  : {
                     style  : "position: absolute; top: 10px; bottom: 10px; left: 10px; right: 10px"
                  },
                  children : [{
                     type     : "<div>",
                     attr     :{
                        style : "position: absolute; top: 35px; left: 0px; right: 0px; bottom: 0px; overflow: auto",
                        id    : "div-reactions"
                     },
                     children : [{
                        type     : "<table>",
                        attr     : {
                           class : "table table-striped table-bordered table-condensed dataTable no-footer",
                           id    : "tblData",
                        },
                        children : table_rows
                     }]
                  },{
                     type: "<div>",
                     attr: {
                        style: "position: absolute; top: 0px; right: 0px;"
                     },
                     children : [
                        {
                           type: "<a>",
                           attr: {
                              class   : "btn btn-primary pull-right",
                              text    : "Manage Reactions",
                              href    : '/chart/sla/reaction' + MMTDrop.tools.getQueryString(["app_id","probe_id"])
                           }
                        }]
                  }]
            };

            $("#sla-reaction-content" ).append( MMTDrop.tools.createDOM( form_config ) ) ;
            
            
            function _btnClick( type, react_id, cb ){
               MMTDrop.tools.ajax("/musa/sla/reaction/"+ type +"/" + react_id, {}, "POST", {
                  error  : function(){
                     
                  },
                  success: cb
               });
            }
            
            //ignore a reaction
            window._ignoreReaction = function( react_id ){
               _btnClick( "ignore", react_id, function(){
                  $("#reaction-" + react_id)
                     .html( '<span class="text-danger">Ignored</span>' )
                     .attr( "align", "right" );
               });
            };
            
          //perform a reaction
            window._performReaction = function( react_id ){
               _btnClick( "perform", react_id, function(){
                  $("#reaction-" + react_id )
                     .html('<span class="text-success">Performing</span> <i class="fa fa-spinner fa-pulse fa-fw"></i>')
                     .attr("align", "left");
               });
            }
         }//end rederTable function

         //LOAD METRIX FROM DATABASE
         MMTDrop.tools.ajax("/api/metrics/find?raw", [{$match: {app_id : getAppID()}}], "POST", {
            error  : function(){},
            success: function( data ){
               var obj = data.data[0];
               //does not exist ?
               if( obj == undefined )
                  MMTDrop.tools.gotoURL("/chart/sla/upload", {param:["app_id"]});
               else{
                  //IMPORTANT: this global variable is used by #_getMetricIDFromName
                  window.__sla = obj;
                  renderTable( obj, data.now );
               }
            }
         } );
         //end LOADING METRIX
      }
}

function _createButtons( react_id ){
   return {
      type : "<div>",
      children: [{
         type : "<input>",
         attr : {
            type  : "button",
            id    : "btn-reaction-perform-" + react_id,
            class : "btn btn-danger btn-reaction-perform btn-reaction-" + react_id,
            title : "Perform the actions",
            value : "Perform",
            onclick: "_performReaction('" + react_id + "')",
         }
      },{
         type : "<input>",
         attr : {
            type  : "button",
            id    : "btn-reaction-ignore-" + react_id,
            style : "margin-left: 20px",
            class : "btn btn-default btn-reaction-ignore btn-reaction-" + react_id,
            value : "Ignore",
            onclick: "_ignoreReaction('"+ react_id +"')",
         }
      }]
   }
}

/**
 * Get metric id from its name.
 * This function uses a global variable defined in createReactionForm when using ajax to get data from server
 * @param name
 * @returns
 */
function _getMetricIDFromName( name, comp_id ){
   if( window.__sla == undefined ){
      console.error( "This must not happen" );
      return 0;
   }
   
   //find in general metric
   for( var i=0; i<window.__sla.metrics.length; i++ ){
      var m = window.__sla.metrics[ i ];
      if( m.name == name )
         return m.id;
   }
   //find in metric list of component
   for( var i=0; i<window.__sla.components.length; i++ ){
      var comp = window.__sla.components[ i ];
      if( comp.id == comp_id ){
         var metrics = comp.metrics;
         //for each metric in the list of matrics of this component
         for( var j=0; j<metrics.length; j++ )
            if( metrics[j].name == name )
               return metrics[j].id;
      }
   }
   console.error( "This must not happen" );
   return 0;
}

//reaction: {"comp_id": "30",
//              "conditions": { "availability": [  "violate" ], "incident": [  "alert" ]},
//              "actions": [ "filtre_port", "restart_apache"],"priority": "MEDIUM","note": "note","enable": true}
//data    : [{"alert":0,"violate":63,"app_id":"_undefined","comp_id":1,"me_id":"1"},
//             {"alert":0,"violate":63,"app_id":"_undefined","comp_id":30,"me_id":"1"}
//            ]
function _verifyCondition( reaction, data ){
   const conditions = reaction.conditions;
   const comp_id    = reaction.comp_id;
   
   for( var metric_name in conditions ){
      const metric_id = _getMetricIDFromName( metric_name, comp_id );
      var valid  = false;
      var cond = conditions[ metric_name ]; //cond is an array
      
      if( cond.length == 0 )
         continue;
      
      for( var i=0; i<data.length; i++ ){
         var o = data[i];
         if( o.comp_id == comp_id       //same component
               && o.me_id == metric_id  //same metric
               && (
                     //one cond
                     ( cond.length == 1 && o[ cond[0] ] > 0 )
                     ||
                     //having either "alert" or "violate"
                     ( cond.length == 2 && ( o[ cond[0] ] > 0 || o[ cond[1] ] > 0) )
                  )
         ){
            //found one msg that satisfies the condition
            valid = true;
            break;
         }
      }
         
      //donot find any element in data that satisfies this condition
      if( !valid )
         return false;
   }
   return true;
}

//verify the metric_alerts data againts the reactions
function _updateReactions( data ){
   //for each reaction
   $(".reactions").each( function( index, el ){
      const reactID  = $(el).attr("data-reaction-id");
      const reaction = JSON.parse( $(el).attr("data-reaction") );
      const isValid  = _verifyCondition( reaction, data );
      
      //show "Perform" and "Ignore" buttons
      //$(el).html( MMTDrop.tools.createDOM( _createButtons( reactID ) ) );
      //ani
      /*
         $(el)
            .delay( 1000 * index )
            .html( MMTDrop.tools.createDOM( _createButtons( reactID ) ));
       */
      setTimeout( function( e, text ){
         $(e).html( text );
         $("#div-reactions").scrollToChild( e, 0, 40 );
      }, 1000*index, el, 
         isValid ? MMTDrop.tools.createDOM( _createButtons( reactID ) ) : "" );
   });
}
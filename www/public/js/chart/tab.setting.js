var arr = [
    {
        id: "system",
        title: "System Usage",
        x: 0,
        y: 0,
        width: 6,
        height: 3,
        type: "info",
        userData: {
            fn: "createSystemInformationReport"
        },
    },{
        id: "localIPs",
        title: "Local IPs",
        x: 6,
        y: 0,
        width: 6,
        height: 3,
        type: "success",
        userData: {
            fn: "createLocalIPsInformationReport"
        },
    },{
        id: "network",
        title: "Network Interfaces",
        x: 0,
        y: 5,
        width: 6,
        height: 4,
        type: "warning",
        userData: {
            fn: "createNetworkInformationReport"
        },
    },{
        id: "database",
        title: "Database",
        x: 6,
        y: 5,
        width: 6,
        height: 4,
        type: "danger",
        userData: {
            fn: "createDatabaseInformationReport"
        },
    }
];

var availableReports = {
}


//create reports
var ReportFactory = {
	createSystemInformationReport: function( fPeriod ){
    fPeriod.hide();
    fAutoReload.hide();
    var form_config = {
      type : "<div>",
      attr : {
        style : "margin: 20px 10px 10px 0px"
      },
      children: [{
        type : "<form>",
        attr : {
          class        : "form-horizontal",
        },
        children : [{
          type  : "<div>",
          attr  : {
            class : "col-sm-12 text-right",
            id    : "sys-timestamp",
            text  : "waiting"
          }
        },{
          label : "CPU",
          type  : "<div>",
          attr  : {
            class : "progress",
          },
          children : [
            {
              type : "<div>",
              attr :{
                class : "progress-bar",
                role  : "progressbar",
                style : "width: 0%",
                id    : "sys-cpu-bar"
              }
            },
          ]
        },{
          label : "Memory",
          type  : "<div>",
          attr  : {
            class : "progress",
          },
          children : [
            {
              type : "<div>",
              attr :{
                class : "progress-bar",
                role  : "progressbar",
                style : "width: 0%",
                id    : "sys-memory-bar"
              }
            }
          ]
        },{
          label : "Hard Driver",
          type  : "<div>",
          attr  : {
            class : "progress",
          },
          children : [
            {
              type : "<div>",
              attr :{
                class : "progress-bar",
                role  : "progressbar",
                style : "width: 0%",
                id    : "sys-disk-bar"
              }
            }
          ]
        }]
      }]
    };

    $("#system-content" ).append( MMTDrop.tools.createForm( form_config ) ) ;
    var load_data = function(){
      MMTDrop.tools.ajax("/info/os", null, "GET", {
        error  : function(){
          MMTDrop.alert.error("Cannot connect to server", 5*1000);
        },
        success: function( data ){
          var set_value = function( elem, val, text ){
            var type = "success";
            if( val <= 50 )
              type = "success";
            else if (val <= 70)
              type = "warning";
            else
              type = "danger";
            if( text == undefined )
              text = val + "%";
            else
              text = val + "% ("+ text +")"
            $(elem).attr("class", "progress-bar progress-bar-"+ type).width( val + "%" ).text( text );
          }
          var obj = data.data, text;
          if( window._lastUsageCPU == undefined )
            window._lastUsageCPU = {
              used: 0,
              total: 0
            };

          set_value("#sys-cpu-bar",    Math.round((obj.cpu.used - window._lastUsageCPU.used)/(obj.cpu.total-window._lastUsageCPU.total)*100) );
          window._lastUsageCPU.used  = obj.cpu.used;
          window._lastUsageCPU.total = obj.cpu.total;

          text = (obj.memory.used/1000/1000/1000).toFixed(2) + " / " +
                 (obj.memory.total/1000/1000/1000).toFixed(2)  + " GB";
          set_value("#sys-memory-bar", Math.round(obj.memory.used/obj.memory.total*100), text );
          text = (obj.hardDrive.used/1000/1000).toFixed(2) + " / " +
                 (obj.hardDrive.total/1000/1000).toFixed(2)  + " GB";
          set_value("#sys-disk-bar",   Math.round(obj.hardDrive.used/obj.hardDrive.total*100), text );

          $("#sys-timestamp").text( moment( new Date( obj.timestamp )).format("YYYY-MM-DD HH:mm:ss" ) )
        }
      })
    }

    setTimeout( load_data, 1000);
    //auto update each 5seconds
    setInterval( load_data, 5000);
	},

  createDatabaseInformationReport: function(){
    fPeriod.hide();
    fAutoReload.hide();
    var form_config = {
      type : "<div>",
      attr : {
        style : "margin: 40px 10px 10px 0px"
      },
      children: [{
        type : "<form>",
        attr : {
          class        : "form-horizontal",
        },
        children : [{
          label : "Last backup",
          type  : "<p>",
          attr  : {
            class : "form-control-static",
            html  : "2016 "
                  + ' <a class="" title=Download the last backup""><span class="glyphicon glyphicon-cloud-download"/></a>'
                  //+ ' <a class="" title="Backup Now"><span class="glyphicon glyphicon-floppy-save" aria-hidden="true"/></a>'
          }
        },{
          label : "Auto backup",
          type  : "<select>",
          attr  : {
            onchange : ""
          },
          children:[{
            type : "<option>",
            attr : {
              value : "none",
              text  : "None"
            }
          },{
            type : "<option>",
            attr : {
              value : "daily",
              text  : "Daily"
            }
          },{
            type : "<option>",
            attr : {
              value : "weekly",
              text  : "Weekly"
            }
          },{
            type : "<option>",
            attr : {
              value : "monthly",
              text  : "Monthly"
            }
          }]
        },{
          label : "Save to FTP Server",
          type  : "<input>",
          attr  : {
            type        : "text",
            placeholder : "10.0.0.2/backup",
            required    : true,
          }
        },
        {
          label    : "",
          type     : "<div>",
          attr     : {
            class : "row"
          },
          children : [{
            type : "<div>",
            attr : {
              class : "col-sm-6"
            },
            children : [{
              type : "<input>",
              attr : {
                class       : "form-control",
                placeholder : "ftp username"
              }
            }]
          },{
            type : "<div>",
            attr : {
              class : "col-sm-6"
            },
            children : [{
              type : "<input>",
              attr : {
                class       : "form-control",
                placeholder : "ftp password",
                type        : "password"
              }
            }]
          }]
        },
        //buttons
        {
          type  : "<div>",
          label : "",
          attr  : {
            class : ""
          },
          children : [{
            type: "<input>",
            attr: {
              type : "submit",
              id   : "conf-db-btnSave",
              class: "btn btn-primary",
              value: 'Save'
            }
          },{
            type: "<input>",
            attr: {
              type : "button",
              id   : "conf-db-btnRestore",
              class: "btn btn-success pull-right",
              value: 'Restore a Backup'
            }
          },{
            type: "<input>",
            attr: {
              type : "button",
              id   : "conf-db-btnEmpty",
              style: "margin-right: 10px",
              class: "btn btn-danger pull-right",
              value: 'Empty DB'
            }
          },]
        }//end buttons
      ]
      }]
    };

    $("#database-content" ).append( MMTDrop.tools.createForm( form_config ) ) ;
    //when click on Empty
    $("#conf-db-btnEmpty").on("click", function(){
      if( confirm("Empty Database of MMT-Operator\nDo you want to cancel?") )
        return;
        MMTDrop.tools.ajax("/info/db?action=empty-db", {}, "POST", {
          error  : function(){
            MMTDrop.alert.error("Cannot empty the database", 10*1000);
          },
          success: function(){
            MMTDrop.alert.success("Successfully emptyed the database", 10*1000);
          }
        })
    })
  },

  createNetworkInformationReport: function(){
    fPeriod.hide();
    fAutoReload.hide();

    var generate_form = function( obj ){
      obj = obj.data;

      var list_interfaces = [];
      for( var key in obj.interfaces )
        list_interfaces.push({
            type : "<option>",
            attr : {
              "value" : key,
              "text"  : key
            }
          }
        );

      var form_config = {
        type : "<div>",
        attr : {
          style : "margin: 40px 10px 10px 0px"
        },
        children: [{
          type : "<form>",
          attr : {
            id    : "nic-form",
            class : "form-horizontal",
          },
          children:[{
              label    : "Monitoring",
              type     : "<select>",
              attr     : {
                id : "nic-mon-iface"
              },
              children : list_interfaces
            },
            {
              label    : "Administration",
              type     : "<select>",
              attr     : {
                id : "nic-admin-iface"
              },
              children : list_interfaces
            },
            //
            {
              label    : "",
              type     : "<div>",
              attr     : {
                class : "row"
              },
              children : [{
                type : "<div>",
                attr : {
                  class : "col-sm-6"
                },
                children : [{
                  type : "<input>",
                  attr : {
                    id          : "nic-address",
                    name        : "nic-address",
                    class       : "form-control",
                    placeholder : "addresss",
                    required    : true,
                  }
                }]
              },{
                type : "<div>",
                attr : {
                  class : "col-sm-6"
                },
                children : [{
                  type : "<input>",
                  attr : {
                    id          : "nic-netmask",
                    name        : "nic-netmask",
                    class       : "form-control",
                    placeholder : "netmask",
                    required    : true,
                  }
                }]
              }]
            },
            //
            {
              label    : "",
              type     : "<div>",
              attr     : {
                class : "row"
              },
              children : [{
                type : "<div>",
                attr : {
                  class : "col-sm-6"
                },
                children : [{
                  type : "<input>",
                  attr : {
                    id          : "nic-gateway",
                    name        : "nic-gateway",
                    class       : "form-control",
                    placeholder : "gateway",
                    required    : true,
                  }
                }]
              },{
                type : "<div>",
                attr : {
                  class : "col-sm-6"
                },
                children : [{
                  type : "<input>",
                  attr : {
                    id          : "nic-dns-servernames",
                    name        : "nic-dns-servernames",
                    class       : "form-control",
                    placeholder : "dns-servernames",
                    required    : true,
                  }
                }]
              }]
            },
            //buttons
            {
              label : "",
              type: "<input>",
              attr: {
                type : "submit",
                class: "btn btn-primary",
                value: 'Save',
                id   : "nic-btnSave"
              }
            }//end buttons
            ]
        }]//end form
      }
      $("#network-content" ).append( MMTDrop.tools.createForm( form_config ) ) ;

      $("#nic-mon-iface").val( obj.probe );
      //when user change admin interface
      $("#nic-admin-iface").on("change", function(){
        var val   = $(this).val();
        var iface = obj.interfaces[ val ];
        var set_value = function( el, val ){
          if( val == undefined ) return;
          $(el).val( val );
        }

        set_value( "#nic-address", iface.address );
        set_value( "#nic-netmask", iface.netmask );
        set_value( "#nic-gateway", iface.gateway );
        set_value( "#nic-dns-servernames", iface["dns-servernames"] );
      });
      //get other interface as admin
      var iface = "";
      for( var i in obj.interfaces )
        if( i != obj.probe ){
          iface = i;
          break;
        }
      $("#nic-admin-iface").val( iface ).trigger("change");


      //when user submit form
      $("#nic-form").validate({
        errorClass  : "text-danger",
        errorElement: "span",
        rules: {
          "nic-mon-iface"       : {ipv4: true},
          "nic-address"         : {ipv4: true},
          "nic-netmask"         : {ipv4: true},
          "nic-gateway"         : {ipv4: true},
          "nic-dns-servernames" : {ipv4: true},
        },
        //when the form was valided
        submitHandler : function( form ){
          if( confirm("Do you want to cancel?") )
            return;
          var data = {
            monitor: $("#nic-admin-iface").val(),
            admin  : {
              iface             : $("#nic-mon-iface").val(),
              address           : $("#nic-address").val(),
              netmask           : $("#nic-netmask").val(),
              gateway           : $("#nic-gateway").val(),
              "dns-servernames" : $("#nic-dns-servernames").val()
            }
          };

          MMTDrop.tools.ajax("/info/nic", data, "POST", {
            error  : function(){
              MMTDrop.alert.error("Cannot update the interfaces", 10*1000);
            },
            success: function(){
              MMTDrop.alert.success("Successfully updated the interfaces", 10*1000);
              obj.interfaces[ data.admin.iface ] = data.admin;
              /*
              setTimeout( function(){
                window.location.href = "http://" + data.admin.address;
              }, 1500 )
              */
            }
          })
          return false;
        }
      });
    };

    MMTDrop.tools.ajax("/info/nic", null, "GET", {
      error   : function(){},
      success : generate_form
    })
  },

  createLocalIPsInformationReport: function(){
    fPeriod.hide();
    fAutoReload.hide();

    var form_config = {
      type : "<div>",
      attr : {
        style : "margin: 35px",
        class : "row"
      },
      children: [{
        type : "<div>",
        attr : {
          class: "col-sm-6",
        },
        children: [{
          type : "<form>",
          attr : {
            id: "conf-operator-form"
          },
          children: [{
            label : "MMT-Operator",
            type  : "<textarea>",
            attr  : {
              rows: 3,
              id      : "conf-operator-content",
              required: true
            }
          },{
            type : "<input>",
            attr : {
              type : "submit",
              class: "btn btn-primary",
              value: 'Save',
              id   : "conf-btnSave"
            }
          }]
        }]
      },{
        type : "<div>",
        attr : {
          class: "col-sm-6",
        },
        children: [{
          type : "<form>",
          attr : {
            id: "conf-probe-form"
          },
          children: [{
            label : "MMT-Probe",
            type  : "<textarea>",
            attr  : {
              rows: 3,
              id      : "conf-probe-content",
              required: true
            }
          },{
            type : "<input>",
            attr : {
              type : "submit",
              class: "btn btn-primary",
              value: 'Save',
              id   : "conf-btnSave"
            }
          }]
        }]
      }]
    }
    //load data
    $("#localIPs" ).append( MMTDrop.tools.createForm( form_config, true ) ) ;
    MMTDrop.tools.ajax("/info/conf", null, "GET", {
      error : function(){
        MMTDrop.alert.error("Internal error", 10*1000);
      },
      success : function( data ){
        $("#conf-probe-content").val( data.data.probe )
        $("#conf-operator-content").val( data.data.operator )
      }
    });

    //save operator-conf
    //when user submit form
    $("#conf-operator-form").validate({
      errorClass  : "text-danger",
      errorElement: "span",
      //when the form was valided
      submitHandler : function( form ){

        var value = $("#conf-operator-content").val();
        try{
          var o = JSON.parse( value );
        }catch( err ){
          MMTDrop.alert.error( "<strong>Syntax error:</strong>" + err, 10*1000 );
          return;
        }

        if( confirm("Update and Restart MMT-Operator\nDo you want to cancel?") )
          return;

        var data = {
          operator: value,
        };

        MMTDrop.tools.ajax("/info/conf", data, "POST", {
          error  : function(){
            MMTDrop.alert.error("Cannot update the configure of MMT-Operator", 10*1000);
          },
          success: function(){
            MMTDrop.alert.success("Successfully updated the configure of MMT-Operator", 10*1000);
            obj.interfaces[ data.admin.iface ] = data.admin;
          }
        })
        return false;
      }
    });

    //save probe-conf
    //when user submit form
    $("#conf-probe-form").validate({
      errorClass  : "text-danger",
      errorElement: "span",
      //when the form was valided
      submitHandler : function( form ){

        var value = $("#conf-probe-content").val();

        if( confirm("Update and Restart MMT-Probe\nDo you want to cancel?") )
          return;

        var data = {
          probe: value,
        };

        MMTDrop.tools.ajax("/info/conf", data, "POST", {
          error  : function(){
            MMTDrop.alert.error("Cannot update the configure of MMT-Probe", 10*1000);
          },
          success: function(){
            MMTDrop.alert.success("Successfully updated the configure of MMT-Probe", 10*1000);
            obj.interfaces[ data.admin.iface ] = data.admin;
          }
        })
        return false;
      }
    });
  }
}

const _global = require("./global");

const val = _global.get("config");
if( val != undefined ){
   module.exports = val;
}
else{
// allow to change config.json
   var configPath = "config.json";
   process.argv.forEach(function (val, index, array) {
      //console.log(index + ': ' + val);
      var arr = val.split("=");
      if( arr[0] == "--config"){
         configPath = arr[1];
         
         //parent process
         if( process.send == undefined )
            console.warn("[INFO] MMT-Operator used configuration in " + arr[1] );
         
      }
   });

   const
   config  = require( "../" + configPath ),
   fs      = require("fs"),
   util    = require("util"),
   moment  = require('moment'),
   path    = require('path'),
   tools   = require('./tools.js'),
   VERSION = require("../version.json").VERSION_NUMBER + "-" + require("../version.json").VERSION_HASH,
   constant= require('./constant.js')
   ;

   config.location = configPath;

   config.version = VERSION; 

   if( config.input_mode != constant.REDIS_STR 
         && config.input_mode != constant.FILE_STR 
         && config.input_mode != constant.KAFKA_STR)
      config.input_mode = constant.FILE_STR;


// == HTTP server port number
   if( Number.isNaN( config.port_number ) || config.port_number < 0 )
      config.port_number = 80;

   function set_default_value( variable, prop, value ){
      if( variable[prop] == undefined )
         variable[prop] = value;
   }

// == Database name
   config.databaseName      = "mmt-data";  //database 
   config.adminDatabaseName = "mmt-admin"; //database for administrator

   set_default_value( config, "log_folder", path.join( __dirname, "..", "log") );

   if( config.probe_analysis_mode != "online" && config.probe_analysis_mode != "offline" )
      config.probe_analysis_mode = "offline";

   config.is_probe_analysis_mode_offline = (config.probe_analysis_mode === "offline");

   set_default_value( config, "database_server", {} );

   set_default_value( config.database_server, "host", "127.0.0.1" );
   set_default_value( config.database_server, "port", 27017 );

   set_default_value( config.redis_input, "host", "127.0.0.1" );
   set_default_value( config.redis_input, "port", 6379 );

   set_default_value( config.micro_flow, "packet", 7 );
   set_default_value( config.micro_flow, "byte"  , 448 );

// period to retain detail reports (1 report for 1 session during sample period, e.g. sconds)
// retain 7days
   set_default_value( config, "retain_detail_report_period", 7*24*3600 );

   set_default_value( config, "probe_stats_period", 5);
   config.probe_stats_period_in_ms = config.probe_stats_period * 1000;

// use in Cache to decide when we will push caches to DB:
// - either their size >= max_length_size
// - or interval between 2 reports >= max_interval
   set_default_value( config.buffer, "max_length_size", 10000 );
   set_default_value( config.buffer, "max_interval", 30 );


   config.json = JSON.stringify( config );

//ensure that mmt-operator is running on a good nodejs version
   if( process.release.lts == undefined || process.release.lts != 'Carbon' ){
      console.warn("[WARN] MMT-Operator works well on Carbon release of NodeJS. It may not work on this version "+ process.version +".");
   }
   
// ensure log directory exists
   if( !fs.existsSync( config.log_folder ) ){
      console.error("[ERR]: Log folder [" + config.log_folder + "] does not exists.");
      console.info( "\nConfiguration: " );
      console.info( config.json );
      console.info( "node version: %s, platform: %s", process.version, process.platform );
      process.exit();
   }
   
   
// log
   if( !Array.isArray( config.log ) )
      config.log = ["error"];


// overwrite console.log
   console.logStdout = console.log;
   console.errStdout = console.error;

   const logFile = {
         date   : (new Date()).getDate(),
         stream : fs.createWriteStream(path.join(config.log_folder, (moment().format("YYYY-MM-DD")) + '.log'), { flags: 'a' })
   }
   const _writeLog = function( msg, date ){
      //ensure each one log file for each day
      if( logFile.date !== date ){
         logFile.date   = date;
         logFile.stream = fs.createWriteStream(path.join(config.log_folder, (moment().format("YYYY-MM-DD")) + '.log'), { flags: 'a' });
      }

      logFile.stream.write( msg );
   }

   var logStdout = process.stdout;
   var errStdout = process.stderr;


// get prefix to print message: date time, file name and line number of caller
   const getPrefix = function( txt ){
      const date = new Date();
      var logLineDetails = ((new Error().stack).split("at ")[3]).trim();
      //TODO: root is not always www
      logLineDetails     = logLineDetails.split("www/")[1];
      var prefix = date.toLocaleString() + ", " + logLineDetails + ", " + txt + "\n  ";

      return {msg: prefix, date: date.getDate()};
   }

   if( config.log.indexOf( "log" ) !== -1 ){
      console.log = function () {
         const prefix  = getPrefix( "LOG" );
         const content = prefix.msg + util.format.apply(null, arguments) + '\n';

         _writeLog( content, prefix.date );
      }
   }
   else{
      console.log = function(){};
   }

   if( config.log.indexOf( "warn" ) !== -1 ){
      console.warn = function(){
         const prefix  = getPrefix( "WARN" );
         const content = prefix.msg + util.format.apply(null, arguments) + '\n';
         if( config.is_in_debug_mode === true  )
            errStdout.write  ( content );

         _writeLog( content, prefix.date );
      }
   }
   else{
      console.warn = function(){};
   }

   if( config.log.indexOf( "error" ) !== -1 ){
      console.error = function( err ){
         const prefix  = getPrefix( "ERROR" );
         const content = prefix.msg + util.format.apply(null, arguments) + '\n';
         if( config.is_in_debug_mode === true  )
            errStdout.write  ( content );

         if( typeof( err ) === 'object' )
            for (var prop in err)  
               errStdout.write( "  "+ prop+ " value: ["+ err[prop]+ "]\n" );

         _writeLog( content, prefix.date );
      }
   }
   else{
      console.error = function(){};
   }

   if( config.log.indexOf( "info" ) !== -1 ){
      console.info = function( msg ){
         const prefix  = getPrefix( "INFO" );
         const content = prefix.msg + util.format.apply(null, arguments) + '\n';

         _writeLog( content, prefix.date );
      }
   }
   else{
      console.info = function(){};
   }


   console.debug = function(){
      logStdout.write( util.format.apply(null, arguments, (new Error())))
   };

   config.logStdout     = logStdout;
   config.logFileStream = logFile.stream;
   config.outStream     = logStdout;

   if( config.is_in_debug_mode == true )
      config.outStream = logFile.stream

//    list of pages to show on Web (see "all_page" on routes/chart.js)
      if( ! Array.isArray( config.modules ))
         config.modules = [];

   //list of pages to be added
   //const fixPages = ["link","network","application", "dpi"];
   const fixPages = [];

   for( var i=fixPages.length-1; i>=0; i--)
      if( config.modules.indexOf( fixPages[i] ) == -1 )
         config.modules.unshift( fixPages[i] );


// is MMT-Operator running for a specific project?
// config.project = constant.project.MUSA
// config.project = "MUSA"

   config.isSLA = ( config.modules.indexOf("sla") !== -1 );

// MUSA
   config.sla = tools.merge( {
      "active_check_period"   : 5,
      "violation_check_period": 5,
      "reaction_check_period" : 5
   }, config.sla);


// check Musa
   if( config.isSLA ){
      if( config.input_mode == constant.FILE_STR ){   
         console.error('Error in config.json: input_mode must be either "kafka" or "redis" when enabling "sla" module.');
         process.exit( 1 );
      }

      if( config.sla == undefined ){
         console.error('Error in config.json: sla must be defined.');
         process.exit( 1 );
      }

      if( !Array.isArray( config.sla.init_components ) ){
         console.error('Error in config.json: sla.init_components must be an array.');
         process.exit( 1 );
      }
      if( !Array.isArray( config.sla.init_metrics ) ){
         console.error('Error in config.json: sla.init_metrics must be an array.');
         process.exit( 1 );
      }
      if( config.sla.actions == undefined ){
         console.error('Error in config.json: sla.actions must be defined.');
         process.exit( 1 );
      }
   }


   module.exports = config;

   _global.set( "config", config );
}
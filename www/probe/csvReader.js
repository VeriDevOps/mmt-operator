/**
 * Read csv files and  
 */


"use strict";

//
const fs           = require('fs');
const path         = require('path');
const lineReader   = require('readline');

//libs
const config         = require("../libs/config");
const tools          = require("../libs/tools");
const DBInserter     = require('./DBInserter');
const processMessage = require("./processMessage");
const DataBase       = require("./DataBase.js");

//total number of reader processes
const TOTAL_READERS = process.argv[3];
//index of the current process
const READER_INDEX  = process.argv[2];
const DATA_FOLDER   = config.data_folder;
const DELETE_FILE_AFTER_READING = config.delete_data;

console.log( "start csv reader " + READER_INDEX );

const database = new DataBase();
const dbadmin  = new DBInserter( config.adminDatabaseName );

// ensure data directory exists
if( !fs.existsSync( DATA_FOLDER ) ){
	console.error("Error: Data folder [" + DATA_FOLDER + "] does not exists.");
	process.exit();
}

//load list of read csv file from db
var read_files = [];
function process_file (file_name, cb) {
	const lr = lineReader.createInterface({
		input: fs.createReadStream( file_name )
	});
	var totalLines = 0;

	var start_ts = tools.getTimestamp();

	lr.on ('line', function (line) {
		// 'line' contains the current line without the trailing newline character.
		try{
			processMessage( line, database );
		}catch( e ){
			console.error( "Error when processing line " + totalLines + " of file " + file_name );
			console.error( e );
		}
		totalLines ++;
	});

	lr.on('close', function () {
		// All lines are read, file is closed now.
		console.log( READER_INDEX + " processed file "+ path.basename(file_name) +" ("+ totalLines +" lines, "+ (tools.getTimestamp() - start_ts) +" ms)");

		//delete data file
		if( DELETE_FILE_AFTER_READING ){
			//remove semaphore file
			fs.unlink( file_name + ".sem", function(err){
				if( err ) console.error( err );
				//remove csv file
				fs.unlink( file_name, function( e ){
					if( err ) console.error( err );
					cb( totalLines );
				});
			});
		}
		else{
			read_files.push( file_name );
			dbadmin.add("read-files", [{"file_name": file_name}], function(){
				cb( totalLines );
			});
		}
	});
};


//list of csv files to be read
var _cache_files = [];
//get the oldest file containing data and not beeing locked
function get_csv_file(dir) {
	if( _cache_files.length > 0){
		//delete the first element from _cache_files and return the element
		return _cache_files.splice(0, 1)[0];
	}

	//Returns an array of filenames excluding '.' and '..'.
	var files = fs.readdirSync(dir);
	var arr = []; //will contain list of csv files

	for (var i=0; i<files.length; i++) {
		var file_name = files[i];

		//filename format: timestamp_threadid_name.csv
		//  1500992643_10_dataoutput.csv
		var thread_index = file_name.split("_")[1];
		//process only some csv files
		if( thread_index % TOTAL_READERS != READER_INDEX  )
			continue

			//file was read (check in database when the read files are not deleted)
			if( config.delete_data !== true )
				if( read_files.indexOf( dir + file_name ) > -1 )
					continue;

		//need to end with csv
		if (file_name.match(/csv$/i) == null)
			continue;

		//check if there exists its semaphore
		if ( files.indexOf( file_name + ".sem" ) > -1 )
			arr.push(dir + file_name);
	}

	if( arr.length == 0 )
		return null;

	//sort by ascending of file name
	_cache_files = arr.sort();

	//delete the first element from _cache_files and return the element
	return _cache_files.splice(0, 1)[0];
};


var process_folder = function () {
	var file_name = get_csv_file( DATA_FOLDER );
	if (file_name == null) {
		setTimeout(process_folder, 500);
		return;
	}
	try{
		process_file(file_name, function () {
			process_folder();
		});
	}catch( ex ){
		console.error( ex );
		process_folder();
	}
};

process.stdout.write("\nWaiting for data in the folder [" + DATA_FOLDER + "] ...\n");
//need to delete .csv and .sem files after reading
if( DELETE_FILE_AFTER_READING ){
	//start after 2 seconds
	setTimeout( process_folder, 2000);
}else{
	//connect to DB to store list of read files
	var start_process = function(){
		return process_folder();
		dbadmin.connect( function( err, mdb ) {
			if( err ){
				throw new Error( "Cannot connect to mongoDB" );
				process.exit(0);
			}
			mdb.collection("read-files").find().toArray( function(err, doc){
				read_files = [];
				for(var i in doc)
					read_files.push( doc[i].file_name );
				process_folder();
			});
		});
	};

	setTimeout( start_process, 2000);
}

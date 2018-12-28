/**
 * This module will recontruct LTE topology and save it into DB.
 * Each topology is identified by PROBE_ID.
 * A topology is empty when Probe is starting.
 * It will be updated time by time when Operator receives LTE_TOPOLOGY_REPORT from Probe.
 */


"use strict";
const mmtAdaptor = require('../libs/dataAdaptor');
const config     = require('../libs/config');
const COL        = mmtAdaptor.LteTopoStatColumnId;
const DBInserter = require("./DBInserter");
const inserterDB = new DBInserter();

const COLLECTION = "lte_topology";

//entity type defined by eNodeB topology Reports given by MMT-Probe
const ELEMENT_TYPE = {
    UE      : 1,
    ENODEB  : 2,
    MME     : 3,
    GATEWAY : 4
};

//event type defined by eNodeB topology Reports given by MMT-Probe
const EVENT_TYPE = {
    ADD_ELEMENT: 1,
    ADD_LINK   : 2,
    RM_LINK    : 3,
    RM_ELEMENT : 4,
};

/**
 * Return ID of a topology
 */
function getID( msg ){
   return msg[ COL.PROBE_ID ];
   
   /*
   return {
      probe : msg[ COL.PROBE_ID  ],
      source: msg[ COL.SOURCE_ID ]
   }*/
}

/**
 * Return an entity data. An entity is a node in a topology
 */
function _getElement( msg ){
   const data = {};
   
   data.timestamp = msg[ COL.TIMESTAMP ];
   
   data.id = msg[ COL.ELEMENT_ID ];
   data.ip = msg[ COL.IP ];
   
   switch( msg[ COL.ELEMENT_TYPE ] ){
   case ELEMENT_TYPE.UE:
      data.imsi   = msg[ COL.UE_IMSI ];
      data.m_tmsi = msg[ COL.UE_M_TMSI ];
      data.type   = "ue";
      break;
   case ELEMENT_TYPE.ENODEB:
      data.name = msg[ COL.NAME ];
      data.type   = "enodeb";
      break;
   case ELEMENT_TYPE.MME:
      data.name = msg[ COL.NAME ];
      data.type   = "mme";
      break;
   case ELEMENT_TYPE.GATEWAY:
      data.type   = "gw";
      break;
   }
   
   //remove empty field
   for( const key in data )
      if( data[key] == 0 || data[key] == "" )
         delete data[key];
   
   return data;
}

/**
 * topo: {
 *    probe_id  : >> INT: id of MMT-Probe
 *    source_id : >> STR: either NIC name or pcap file name
 *    init_time : >> INT: moment of starting MMT-Probe
 *    timestamp : >> INT: last update of topology
 *    nodes     : >> OBJ: set of nodes in format: key => data  
 *    {
 *       id of element : data
 *    },
 *    links     : >> ARR: array of links between nodes. 
 *                        Each link is an object having field "source" and "target" are ID of source and target nodes 
 *    [
 *       { "source": id of source, "target": id of target }
 *    ]
 *    history   : >> ARR: array of LTE_TOPOLOGY_REPORT messges received from Probe
 * }
 */


let lastTimestamp = 0;
/**
 * Process LTE topology report from MMT-Probe
 * 
 */
function updateMessage( msg ){
   const ts = msg[ COL.TIMESTAMP ];
   
   //do not process older reports or the ones that do not concernt
   if( ts < lastTimestamp )
      return;
   
   lastTimestamp = ts;
   
   const update = {
         $set  : { timestamp: ts  }, //update the last timestamp
         $push : { history  : msg } //add msg to the history
   };
   
   const elem_id = msg[ COL.ELEMENT_ID ];
   
   switch( msg[ COL.EVENT ] ){
   case EVENT_TYPE.ADD_ELEMENT:
      const el = _getElement( msg );
      
      //this will update the fields of a node
      for( const key in el )
         update.$set["nodes." + elem_id + "." + key] = el[ key ];
      
      break;
      
   case EVENT_TYPE.ADD_LINK:
      update.$addToSet = { links: { source: elem_id, target: msg[ COL.PARENT_ID ] }};
      break;
      
   case EVENT_TYPE.RM_ELEMENT:
      //remove a node from nodes
      update.$unset = {};
      update.$unset["nodes." + elem_id ] = "";
      //no break: as rm an element and then rm all its links
   case EVENT_TYPE.RM_LINK:
      //remove all elements in the links array
      // such that the elements have either same source or taget than elem_id
      update.$pull = { links: {$or: [{ source: elem_id}, {target: elem_id}]}};
      break;
   
   }
   
   inserterDB.update( COLLECTION, getID( msg ), update, {upset: true} );
}

function processMessage( msg ){
   const ts = msg[ COL.TIMESTAMP ];
   
   const data = {
         init_time : ts,
         nodes     : {},
         links     : [],
         history   : []
   };
   
   //to maintain the compatibility with other collection
   [COL.PROBE_ID, COL.SOURCE_ID, COL.TIMESTAMP ].forEach( function( e ){
      data[ e ] = msg[ e ];
   });
   
   //1. insert the template if the topology does not exist
   inserterDB.update( COLLECTION, getID( msg ), {
      $set        : {timestamp: ts},
      $setOnInsert: data,
   }, {upsert: true}, 
   
   function( err, result){
      if( err )
         return console.error( err );
      //2. update data
      updateMessage( msg );
   });
}


function resetTopology( msg ){
   console.log( "Reset LTE-Topology" );
   const ts = msg[ COL.TIMESTAMP ];
   
   const data = {
         init_time : ts,
         nodes     : {},
         links     : [],
         history   : []
   };
   
   //to maintain the compatibility with other collection
   [COL.PROBE_ID, COL.SOURCE_ID, COL.TIMESTAMP ].forEach( function( e ){
      data[ e ] = msg[ e ];
   });
   
   //init template for the topology
   inserterDB.set( COLLECTION, getID( msg ), data )
}

module.exports = {
      processMessage : processMessage,
      resetTopology  : resetTopology,
      getTopology    : function(){ return lteTopology; }
};

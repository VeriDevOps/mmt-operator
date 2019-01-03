"use strict";
   

const mmtAdaptor = require('./dataAdaptor');
const COL        = mmtAdaptor.LteTopoStatColumnId;

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
      //if( msg[ COL.GTP_TEID ] )
      //   data.gtp_teid.push( msg[ COL.GTP_TEID ] );
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
 *    "1"       : >> INT: id of MMT-Probe
 *    "2"       : >> STR: either NIC name or pcap file name
 *    "3"       : >> INT: the last timestamp of any reports generated by Probe
 *    init_time : >> INT: moment of starting MMT-Probe
 *    timestamp : >> INT: last update of any nodes/links of topology
 *    nodes     : >> OBJ: set of nodes in format: key => data  
 *    {
 *       id of element : data
 *    },
 *    links     : >> ARR: array of links between nodes. 
 *                        Each link is an object having field "source" and "target" are ID of source and target nodes 
 *    {
 *       id: { "source": id of source, "target": id of target }
 *    }
 * }
 */

/**
 * Process LTE topology report from MMT-Probe
 * 
 */

var topo = {};

function initTopo( msg ){
   topo = {
         init_time : msg[ COL.TIMESTAMP ],
         timestamp : msg[ COL.TIMESTAMP ],
         nodes     : {},
         links     : {}
   };
   //to maintain the compatibility with other collection
   [COL.PROBE_ID, COL.SOURCE_ID, COL.TIMESTAMP ].forEach( function( e ){
      topo[ e ] = msg[ e ];
   });
}

function updateMessage( msg ){
   const ts = msg[ COL.TIMESTAMP ];
   
   topo.timestamp = ts; //update the last timestamp
   
   const elem_id = msg[ COL.ELEMENT_ID ];
   
   switch( msg[ COL.EVENT ] ){
   case EVENT_TYPE.ADD_ELEMENT:
      const el = _getElement( msg );
      
      if( topo.nodes[ elem_id ] == undefined )
         topo.nodes[ elem_id ] = {};
      //this will update the fields of a node
      for( const key in el )
         topo.nodes[ elem_id ][key] = el[ key ];
      
      break;
      
   case EVENT_TYPE.ADD_LINK:
      const link_id = elem_id + "--"+ msg[ COL.PARENT_ID ];
      topo.links[ link_id ] = { source: elem_id, target: msg[ COL.PARENT_ID ] };
      break;
      
   case EVENT_TYPE.RM_ELEMENT:
      //remove a node from nodes
      delete topo.nodes[ elem_id ] ;
      //no break: as rm an element and then rm all its links
   case EVENT_TYPE.RM_LINK:
      //remove all elements in the links array
      // such that the elements have either same source or taget than elem_id
      for( const i in topo.links ){
         const link = topo.links[i];
         console.log( link );
         
         if( link.source === elem_id || link.target === elem_id )
            delete( topo.links[ i ] );
      }
      break;
   }
}

module.exports = function( dataArr, callback ){

   if( typeof(callback) !== "function")
      callback = console.log;
   
   if( dataArr.length > 0 ){
      initTopo( dataArr[0] );
      dataArr.forEach( updateMessage );
   
      topo.links = Object.values( topo.links );
      callback( null, [topo] );
   }
   else
      callback( null, [] );  
}
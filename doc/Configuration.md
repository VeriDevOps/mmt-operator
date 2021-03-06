# Configuration

The configuration is in `config.json` file.

- `database_server`: IP address of mongoDB
- `redis_server`: IP address of Redis server
- `data_folder` : Path to the folder containing output of mmt-probe
- `input_mode`: either `file` or `redis` or `kafka`
- `mac_getway`: MAC address of a gateway. It is used to decide a packet is incoming or outgoing: 
    - incoming: if a packet having MAC source is the same with the one of the gateway
    - outgoing: if  a packet having MAC destination is the same with the one of the gateway
All packets having MAC source and destination are different with the one of the gateway will be omitted.

If this option is `null` then all packets will be traited and the iformation about directions are not correct any more.
    
- `local_network`: an array indicating local IP ranges
- `probe_stats_period`: a number in second indicating the statistic period of the mmt-probe. This number must be the same with the value of `stats_period` in the configuration file of mmt-probe.
- `is_in_debug_mode`: boolean, set to `true` to print out debug information

- `buffer_socketio`: set a FIFO buffer of data to be flushed to clients to visualize
    - `max_length_size`: a number set size of the buffer. When the buffer fulls if a new message is added to tail, then the first message (the oldest one) of the buffer will be remove.
    - `max_period_size`: a number of seconds set size of the buffer. When a new message A is added, the messages that olders than `max_period_size` seconds (since timestamps of A) will be removed.
    - `flush_to_client_period`: a number of seconds representing the period to flush the buffer to clients and empty the buffer.
    
# Example

```json
{
    "database_server": "192.168.0.37",
    "redis_server": "192.168.0.37",
    "data_folder": "/Users/nhnghia/temps/share_vbox/",
    "input_mode": "file",
    "//mac_gateway": "00:05:5d:89:26:78",
    "local_network": [{
            "ip": "192.168.0.0",
            "mask": "255.0.0.0"
        },
        {
            "ip": "172.16.0.0",
            "mask": "255.0.0.0"
        },
        {
            "ip": "10.0.0.0",
            "mask": "255.0.0.0"
        }],
    "probe_stats_period": 5,
    "buffer_socketio": {
        "max_length_size": 2000,
        "max_period_size": 3600,
        "flush_to_client_period": 5
    },
    "is_in_debug_mode": true
}
```
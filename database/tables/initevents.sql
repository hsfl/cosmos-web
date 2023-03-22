# Note, should be run with a database specified (see inittables.sh)
# The docker mysql entrypoint script will ignore this folder

####################################################
### TABLES #########################################
####################################################

# List of events types
# event_id: Node id of node agent belongs to
# event_type: events types

DROP TABLE event_type;
DROP TABLE cosmos_event;

CREATE TABLE IF NOT EXISTS event_type (
    event_id TINYINT UNSIGNED NOT NULL,
    event_type VARCHAR(40) NOT NULL,

    PRIMARY KEY (event_id)
);

# COSMOS event
# node_name: Node name
# utc: Telem timestamp (decisecond precision)
# duration: Seconds of event duration
# event_id: Numeric encoding of event type
# event_name: Event name
CREATE TABLE IF NOT EXISTS cosmos_event (
    node_name VARCHAR(40) NOT NULL,
    utc DOUBLE(17, 8) NOT NULL,
    duration INT UNSIGNED,
    event_id TINYINT UNSIGNED NOT NULL,
    event_name VARCHAR(40) NOT NULL,

    PRIMARY KEY (node_name, utc, event_name)
);

REPLACE INTO event_type VALUES (0, 'Umbra');
REPLACE INTO event_type VALUES (1, 'kauai');
REPLACE INTO event_type VALUES (2, 'surrey');
REPLACE INTO event_type VALUES (3, 'payload1');
REPLACE INTO event_type VALUES (4, 'payload2');

REPLACE INTO cosmos_event VALUES ('mothership', 59874.83333333, 200, 3, 'Npole');
REPLACE INTO cosmos_event VALUES ('mothership', 59874.84333333, 1000, 3, 'Spole');
REPLACE INTO cosmos_event VALUES ('mothership', 59874.85333333, 400, 4, 'EQA');
REPLACE INTO cosmos_event VALUES ('mothership', 59874.86333333, 2000, 4, 'EQD');
REPLACE INTO cosmos_event VALUES ('mothership', 59874.86733333, 300, 3, 'MaxN');
REPLACE INTO cosmos_event VALUES ('mothership', 59874.85027778, 1000, 3, 'MaxS');
REPLACE INTO cosmos_event VALUES ('mothership', 59874.86027778, 900, 0, 'UMB_In');

REPLACE INTO cosmos_event VALUES ('mothership', 59874.84027778, 1728, 2, 'AOS000');
REPLACE INTO cosmos_event VALUES ('mothership', 59874.86027799, 0, 2, 'LOS000');

# test different dates for manual computation accuracy; 2023
REPLACE INTO cosmos_event VALUES ('mothership', 59874.86027799, 0, 2, 'LOS222');
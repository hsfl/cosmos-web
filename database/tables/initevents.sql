# Note, should be run with a database specified (see inittables.sh)
# The docker mysql entrypoint script will ignore this folder

####################################################
### TABLES #########################################
####################################################

# List of events types
# event_id: Node id of node agent belongs to
# event_type: events types
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

INSERT INTO event_type VALUES (1, 'Orbital');
INSERT INTO event_type VALUES (2, 'Ground station');
INSERT INTO event_type VALUES (3, 'Target');
INSERT INTO event_type VALUES (4, 'Umbra');
INSERT INTO event_type VALUES (5, 'Earth occultation');

INSERT INTO cosmos_event VALUES ('mothership', 59874.83333333, 200, 1, 'Npole');
INSERT INTO cosmos_event VALUES ('mothership', 59874.84027778, 2000, 1, 'Spole');
INSERT INTO cosmos_event VALUES ('mothership', 59874.85333333, 200, 1, 'EQA');
INSERT INTO cosmos_event VALUES ('mothership', 59874.86333333, 2000, 1, 'EQD');
INSERT INTO cosmos_event VALUES ('mothership', 59874.86733333, 200, 1, 'MaxN');
INSERT INTO cosmos_event VALUES ('mothership', 59874.87333333, 2000, 1, 'MaxS');
INSERT INTO cosmos_event VALUES ('mothership', 59874.87500000, 200, 4, 'UMB_In');

INSERT INTO cosmos_event VALUES ('mothership', 59874.84027778, 200, 2, 'AOS000');
INSERT INTO cosmos_event VALUES ('mothership', 59874.84027799, 200, 2, 'LOS000');
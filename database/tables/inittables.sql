# Note, should be run with a database specified (see inittables.sh)
# The docker mysql entrypoint script will ignore this folder

####################################################
### TABLES #########################################
####################################################
# List of nodes in the realm
# id: Node id within realm
# name: Node name
CREATE TABLE IF NOT EXISTS node (
    id TINYINT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,

    PRIMARY KEY (id)
);

# List of agents in the realm
# node_id: Node id of node agent belongs to
# name: Agent name
CREATE TABLE IF NOT EXISTS agent (
    node_id TINYINT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,

    FOREIGN KEY (node_id)
        REFERENCES node(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    PRIMARY KEY node_id (node_id)
);

# For Telemetry points from the spacecraft
# Timestamps can store up to millisecond precision
# All values are cast to double
# node_id: Node id
# name: Telem key
# time: Telem timestamp
# value: Telem value
CREATE TABLE IF NOT EXISTS telem (
    node_id TINYINT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,
    time DATETIME(3) NOT NULL,
    value DOUBLE,

    FOREIGN KEY (node_id)
        REFERENCES node(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    PRIMARY KEY (node_id, name, time)
);

# Store batches of simulated data
# id: Batch id, used to identify which set of data are one collection
CREATE TABLE IF NOT EXISTS sim_batch (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    # The kind of simulated data, ie: TODO: consider this comment, do we need kind?
    PRIMARY KEY (id)
);

# For simulated ephemeral data from the COSMOS propagator
# node_id: Node id
# name: Simulated data key
# time: Data timestamp
# value: Data value
# batch_id: Which batch this data point was created in
CREATE TABLE IF NOT EXISTS sim_data (
    node_id TINYINT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,
    time DATETIME(3) NOT NULL,
    value DOUBLE,
    # All propagator data from the same run share the same id
    batch_id INT UNSIGNED NOT NULL,

    FOREIGN KEY (node_id)
        REFERENCES node(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (batch_id)
        REFERENCES sim_batch(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    PRIMARY KEY (node_id, name, time)
);

# For mapping device/piece/whatever name to a human-readable name
# node_id: Node id
# name: Device name, used in the namespace of the node
# device_name: The human readable name of the device
CREATE TABLE IF NOT EXISTS device (
    node_id TINYINT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,
    device_name VARCHAR(40) NOT NULL,
    
    FOREIGN KEY (node_id)
        REFERENCES node(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    PRIMARY KEY (node_id, name)
);

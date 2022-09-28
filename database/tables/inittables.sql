# Note, should be run with a database specified (see inittables.sh)
# The docker mysql entrypoint script will ignore this folder

####################################################
### TABLES #########################################
####################################################
# List of nodes in the realm
CREATE TABLE IF NOT EXISTS node (
    id TINYINT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,

    PRIMARY KEY (id)
);

# List of agents in the realm
CREATE TABLE IF NOT EXISTS agent (
    node_id TINYINT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,

    FOREIGN KEY (node_id)
        REFERENCES node(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    PRIMARY KEY node_id_name (node_id, name)
);

# For Telemetry points from the spacecraft
# Timestamps can store up to millisecond precision
# All values are cast to double
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
CREATE TABLE IF NOT EXISTS sim_batch (
    # The kind of simulated data, ie: 
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (id)
);

# For simulated ephemeral data from the COSMOS propagator
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
CREATE TABLE IF NOT EXISTS device (
    node_id TINYINT UNSIGNED NOT NULL,
    # The name used in the namespace of the node
    name VARCHAR(40) NOT NULL,
    # The human readable name of the device
    dname VARCHAR(40) NOT NULL,
    
    FOREIGN KEY (node_id)
        REFERENCES node(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    PRIMARY KEY (node_id, name)
);

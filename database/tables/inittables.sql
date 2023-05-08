# Note, should be run with a database specified (see inittables.sh)
# The docker mysql entrypoint script will ignore this folder

# drop database if exists cosmos;
# create database cosmos;
# use cosmos;

CREATE TABLE IF NOT EXISTS node_type (
    id SMALLINT UNSIGNED NOT NULL UNIQUE,
    name VARCHAR(40) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS node (
node_id TINYINT UNSIGNED NOT NULL UNIQUE,
node_name VARCHAR(40) NOT NULL UNIQUE,
node_type SMALLINT UNSIGNED NOT NULL,
agent_name VARCHAR(40) NOT NULL,
utc DOUBLE,
utcstart DOUBLE,
PRIMARY KEY (node_name)
);

# COSMOS device types
# Each specific device has a unique device type ID
# name: Name of the device type
# id: Device type id, defined in jsondef.h
CREATE TABLE IF NOT EXISTS device_type (
    name VARCHAR(40) NOT NULL,
    id SMALLINT UNSIGNED NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

# COSMOS device
# All COSMOS devices inherit from devicestruc and are stored in the devices vector
# node_name: Name of node
# type: Device type id, defined in jsondef.h
# cidx: Component index, index in devices vector
# didx: Device index, index of the specific device in its appropriate devspec vector
CREATE TABLE IF NOT EXISTS device (
    node_name VARCHAR(40) NOT NULL,
    type SMALLINT UNSIGNED NOT NULL,
    cidx SMALLINT UNSIGNED NOT NULL,
    didx SMALLINT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,
    PRIMARY KEY (node_name, type, didx)
);

CREATE TABLE IF NOT EXISTS battstruc (
node_name VARCHAR(40) NOT NULL,
didx TINYINT UNSIGNED NOT NULL,
utc DOUBLE NOT NULL,
volt DOUBLE,
amp DOUBLE,
power DOUBLE,
temp DOUBLE,
percentage DOUBLE,
PRIMARY KEY (node_name, didx, utc)
);

CREATE TABLE IF NOT EXISTS bcregstruc (
node_name VARCHAR(40) NOT NULL,
didx TINYINT UNSIGNED NOT NULL,
utc DOUBLE NOT NULL,
volt DOUBLE,
amp DOUBLE,
power DOUBLE,
temp DOUBLE,
mpptin_amp DOUBLE,   
mpptin_volt DOUBLE,  
mpptout_amp DOUBLE,  
mpptout_volt DOUBLE, 
PRIMARY KEY (node_name, didx, utc)
);

CREATE TABLE IF NOT EXISTS cpustruc (
node_name VARCHAR(40) NOT NULL,
didx TINYINT UNSIGNED NOT NULL,
utc DOUBLE NOT NULL,
temp DOUBLE,
uptime INT UNSIGNED,   
cpu_load DOUBLE, 
gib DOUBLE,  
boot_count INT UNSIGNED,   
storage DOUBLE,  
PRIMARY KEY (node_name, didx, utc)
);

CREATE TABLE IF NOT EXISTS gyrostruc (
node_name VARCHAR(40) NOT NULL,
didx TINYINT UNSIGNED NOT NULL,
utc DOUBLE NOT NULL,
omega DOUBLE,
PRIMARY KEY (node_name, didx, utc)
);

CREATE TABLE IF NOT EXISTS magstruc (
node_name VARCHAR(40) NOT NULL,
didx TINYINT UNSIGNED NOT NULL,
utc DOUBLE NOT NULL,
mag_x DOUBLE,
mag_y DOUBLE,
mag_z DOUBLE,
PRIMARY KEY (node_name, didx, utc)
);

CREATE TABLE IF NOT EXISTS mtrstruc (
node_name VARCHAR(40) NOT NULL,
didx TINYINT UNSIGNED NOT NULL,
utc DOUBLE NOT NULL,
mom DOUBLE,
align_w DOUBLE,
align_x DOUBLE,
align_y DOUBLE,
align_z DOUBLE,
PRIMARY KEY (node_name, didx, utc)
);

CREATE TABLE IF NOT EXISTS rwstruc (
node_name VARCHAR(40) NOT NULL,
didx TINYINT UNSIGNED NOT NULL,
utc DOUBLE NOT NULL,
amp DOUBLE,
omg DOUBLE,
romg DOUBLE,
PRIMARY KEY (node_name, didx, utc)
);

CREATE TABLE IF NOT EXISTS swchstruc (
node_name VARCHAR(40) NOT NULL,
didx TINYINT UNSIGNED NOT NULL,
utc DOUBLE NOT NULL,
volt DOUBLE,
amp DOUBLE,
power DOUBLE,
temp DOUBLE,
PRIMARY KEY (node_name, didx, utc)
);

CREATE TABLE IF NOT EXISTS tsenstruc (
node_name VARCHAR(40) NOT NULL,
didx TINYINT UNSIGNED NOT NULL,
utc DOUBLE NOT NULL,
temp DOUBLE,
PRIMARY KEY (node_name, didx, utc)
);


CREATE TABLE IF NOT EXISTS locstruc (
    node_name VARCHAR(40) NOT NULL,
    utc DOUBLE NOT NULL,
    eci_s_x DOUBLE,
    eci_s_y DOUBLE,
    eci_s_z DOUBLE,
    eci_v_x DOUBLE,
    eci_v_y DOUBLE,
    eci_v_z DOUBLE,
    icrf_s_x DOUBLE,
    icrf_s_y DOUBLE,
    icrf_s_z DOUBLE,
    icrf_s_w DOUBLE,
    icrf_v_x DOUBLE,
    icrf_v_y DOUBLE,
    icrf_v_z DOUBLE,

    PRIMARY KEY (node_name, utc)
);

CREATE TABLE IF NOT EXISTS locstruc_eci (
node_name VARCHAR(40) NOT NULL,
utc DOUBLE NOT NULL,
s_x DOUBLE,
s_y DOUBLE,
s_z DOUBLE,
v_x DOUBLE,
v_y DOUBLE,
v_z DOUBLE,
a_x DOUBLE,
a_y DOUBLE,
a_z DOUBLE,
PRIMARY KEY (node_name, utc)
);

CREATE TABLE IF NOT EXISTS attstruc_icrf (
node_name VARCHAR(40) NOT NULL,
utc DOUBLE NOT NULL,
s_x DOUBLE,
s_y DOUBLE,
s_z DOUBLE,
s_w DOUBLE,
omega_x DOUBLE,
omega_y DOUBLE,
omega_z DOUBLE,
alpha_x DOUBLE,
alpha_y DOUBLE,
alpha_z DOUBLE,
PRIMARY KEY (node_name, utc)
);

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

# All available agent commands
# node_name: Node name
# request: The agent request
# 
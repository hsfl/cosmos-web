# Note, should be run with a database specified (see inittables.sh)
# The docker mysql entrypoint script will ignore this folder

####################################################
### TABLES #########################################
####################################################

# List of locstruc types for combined att_icrf + pos_eci



DROP TABLE locstruc;

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

# locstruc_type: (node_name, utc, eci_s_x, eci_s_y, eci_s_z, eci_v_x, eci_v_y, eci_v_z, icrf_s_x, icrf_s_y, icrf_s_z, icrf_s_w, icrf_v_x, icrf_v_y, icrf_v_z  )
REPLACE INTO locstruc VALUES ('mothership', 59874.83333333, 2230000, 3730750, 5210750, -5632.5,5057.75,-1207.75, 0.0004848787686305429, 0.00099960060846681622, 0.4480002584702239, 0.89403273659403326, 0, 0, 0);
REPLACE INTO locstruc VALUES ('c', 59872.83333333, 2230000, 3730750, 5210750, -5632.5,5057.75,-1207.75, 0.0004848787686305429, 0.00099960060846681622, 0.4480002584702239, 0.89403273659403326, 0, 0, 0);

# node : node_id node_name, node_type, agent_name, utc, utcstart

REPLACE INTO node VALUES (0, 'mothership', 0, 'agent name', 59874.83333333, 59874.83333333);
REPLACE INTO node VALUES (1, 'c', 0, 'agent name', 59874.83333333, 59874.83333333);


REPLACE INTO battstruc VALUES ('mothership', 0, 59874.83333333, 0, 0, 0, 0, 0);

REPLACE INTO device VALUES ('mothership', 12, 0, 0, 'test');
REPLACE INTO device VALUES ('mothership', 30, 0, 0, 'test');
REPLACE INTO device VALUES ('mothership', 15, 0, 0, 'test');
REPLACE INTO device VALUES ('mothership', 15, 0, 15, 'test');
REPLACE INTO device VALUES ('mothership', 5, 0, 5, 'test');
REPLACE INTO device VALUES ('mothership', 32, 0, 32, 'test');

REPLACE INTO bcregstruc VALUES ("mothership", 30, 59874.83333333, 0, 0, 0, 0, 0, 0, 0, 0);

REPLACE INTO tsenstruc VALUES ("mothership", 15, 59874.83333333, 0);

REPLACE INTO cpustruc VALUES ("mothership", 15, 59874.83333333, 0, 0, 0, 0, 0, 0);

REPLACE INTO magstruc VALUES ("mothership", 32, 59874.83333333, 0, 0, 0);


CREATE TABLE IF NOT EXISTS magstruc (
node_name VARCHAR(40) NOT NULL,
didx TINYINT UNSIGNED NOT NULL,
utc DOUBLE NOT NULL,
mag_x DECIMAL(5,2),
mag_y DECIMAL(5,2),
mag_z DECIMAL(5,2),
PRIMARY KEY (node_name, didx, utc)
);
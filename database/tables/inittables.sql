# Note, should be run with a database specified (see inittables.sh)
# The docker mysql entrypoint script will ignore this folder

####################################################
### TABLES #########################################
####################################################
# List of nodes in the realm
# node_id: Node id within realm
# node_name: Node name
# node_utcstart: Node utcstart time
CREATE TABLE IF NOT EXISTS node (
    node_id TINYINT UNSIGNED NOT NULL UNIQUE,
    node_name VARCHAR(40) NOT NULL UNIQUE,
    device_utc DATETIME(1),
    node_utcstart DATETIME(1),

    PRIMARY KEY (node_id)
);

# List of agents in the realm
# node_id: Node id of node agent belongs to
# node_agent: Agent name
CREATE TABLE IF NOT EXISTS agent (
    node_id TINYINT UNSIGNED NOT NULL,
    node_agent VARCHAR(40) NOT NULL,

    FOREIGN KEY (node_id)
        REFERENCES node(node_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    PRIMARY KEY (node_id)
);

# BATT devices
# node_id: Node id
# didx: Index of Battery in device table
# device_batt_utc: Telem timestamp (decisecond precision)
# device_batt_volt: Voltage in V
# device_batt_amp: Current in A
# device_batt_power: Power in W
# device_batt_temp: Temperature in K
# device_batt_percentage: Disk space usage percentage
CREATE TABLE IF NOT EXISTS device_batt (
    node_id TINYINT UNSIGNED NOT NULL,
    didx TINYINT UNSIGNED NOT NULL,
    device_batt_utc DATETIME(1) NOT NULL,
    device_batt_volt DECIMAL(5,2),
    device_batt_amp DECIMAL(5,2),
    device_batt_power DECIMAL(5,2),
    device_batt_temp DECIMAL(5,2),
    device_batt_percentage DECIMAL(5,2),

    PRIMARY KEY (node_id, didx, device_batt_utc)
);

# BCREG devices
# node_id: Node id
# didx: Index of BCREG in device table
# device_bcreg_utc: Telem timestamp (decisecond precision)
# device_bcreg_volt: Voltage in V
# device_bcreg_amp: Current in A
# device_bcreg_power: Power in W
# device_bcreg_mpptin_amp: Current in A
# device_bcreg_mpptin_volt: Current in V
# device_bcreg_mpptout_amp: Current in A
# device_bcreg_mpptout_volt: Current in V
CREATE TABLE IF NOT EXISTS device_bcreg (
    node_id TINYINT UNSIGNED NOT NULL,
    didx TINYINT UNSIGNED NOT NULL,
    device_bcreg_utc DATETIME(1) NOT NULL,
    device_bcreg_volt DECIMAL(5,2),
    device_bcreg_amp DECIMAL(5,2),
    device_bcreg_power DECIMAL(5,2),
    device_bcreg_mpptin_amp DECIMAL(5,2),
    device_bcreg_mpptin_volt DECIMAL(5,2),
    device_bcreg_mpptout_amp DECIMAL(5,2),
    device_bcreg_mpptout_volt DECIMAL(5,2),

    PRIMARY KEY (node_id, didx, device_bcreg_utc)
);

# CPU devices
# node_id: Node id
# didx: Index of CPU in device table
# device_cpu_utc: Telem timestamp (decisecond precision)
# device_cpu_uptime: Seconds CPU has been up
# device_cpu_boot_count: Number of reboots
# device_cpu_load: Current CPU load
# device_cpu_gib: Memory usage (RAM + Virtual) in gib
# device_cpu_storage: Disk space usage percentage
# device_cpu_temp: CPU temperature (in C)
CREATE TABLE IF NOT EXISTS device_cpu (
    node_id TINYINT UNSIGNED NOT NULL,
    didx TINYINT UNSIGNED NOT NULL,
    device_cpu_utc DATETIME(1) NOT NULL,
    device_cpu_uptime INT UNSIGNED,
    device_cpu_boot_count INT UNSIGNED,
    device_cpu_load DECIMAL(5,2),
    device_cpu_gib DECIMAL(5,2),
    device_cpu_storage DECIMAL(3,2),
    device_cpu_temp DECIMAL(5,2),

    PRIMARY KEY (node_id, didx, device_cpu_utc)
);

# Magnetometer
# node_id: Node id
# didx: Index of magnetometer in device table
# device_mag_mag_utc: Telem timestamp (decisecond precision)
# device_mag_mag_x: Magnetometer reading x axis
# device_mag_mag_y: Magnetometer reading y axis
# device_mag_mag_z: Magnetometer reading z axis
CREATE TABLE IF NOT EXISTS device_mag (
    node_id TINYINT UNSIGNED NOT NULL,
    didx TINYINT UNSIGNED NOT NULL,
    device_mag_mag_utc DATETIME(1) NOT NULL,
    device_mag_mag_x DECIMAL(5,2),
    device_mag_mag_y DECIMAL(5,2),
    device_mag_mag_z DECIMAL(5,2),

    PRIMARY KEY (node_id, didx, device_mag_mag_utc)
);

# EPS Switch devices
# node_id: Node id
# didx: ID of switch in device table
# device_swch_utc: Telem timestamp (decisecond precision)
# device_swch_volt: Voltage in V
# device_swch_amp: Current in A
# device_swch_power: Power in W
CREATE TABLE IF NOT EXISTS device_swch (
    node_id TINYINT UNSIGNED NOT NULL,
    didx TINYINT UNSIGNED NOT NULL,
    device_swch_utc DATETIME(1) NOT NULL,
    device_swch_volt DECIMAL(5,2),
    device_swch_amp DECIMAL(5,2),
    device_swch_power DECIMAL(5,2),

    PRIMARY KEY (node_id, didx, device_swch_utc)
);

# TSEN devices
# node_id: Index of TSEN in device table
# didx: Index of TSEN in device table
# device_tsen_utc: Timestamp of telem point
# device_tsen_temp: Temperature value of thermal sensor
CREATE TABLE IF NOT EXISTS device_tsen (
    node_id TINYINT UNSIGNED NOT NULL,
    didx TINYINT UNSIGNED NOT NULL,
    device_tsen_utc DATETIME(1) NOT NULL,
	device_tsen_temp DECIMAL(5,2),

    PRIMARY KEY (node_id, didx, device_tsen_utc)
);

# Position in ECI
# node_id: Node id
# node_loc_pos_eci_s_utc: Telem timestamp (decisecond precision)
# node_loc_pos_eci_s_x: X position in ECI (in meters)
# node_loc_pos_eci_s_y: Y position in ECI (in meters)
# node_loc_pos_eci_s_z: Z position in ECI (in meters)
CREATE TABLE IF NOT EXISTS node_loc_pos_eci_s (
    node_id TINYINT UNSIGNED NOT NULL,
    node_loc_pos_eci_s_utc DATETIME(1) NOT NULL,
    node_loc_pos_eci_s_x DECIMAL(10,2),
    node_loc_pos_eci_s_y DECIMAL(10,2),
    node_loc_pos_eci_s_z DECIMAL(10,2),

    PRIMARY KEY (node_id, node_loc_pos_eci_s_utc)
);

# Velocity in ECI
# node_id: Node id
# node_loc_pos_eci_v_utc: Telem timestamp (decisecond precision)
# node_loc_pos_eci_v_x: X velocity in ECI (in meters)
# node_loc_pos_eci_v_y: Y velocity in ECI (in meters)
# node_loc_pos_eci_v_z: Z velocity in ECI (in meters)
CREATE TABLE IF NOT EXISTS node_loc_pos_eci_v (
    node_id TINYINT UNSIGNED NOT NULL,
    node_loc_pos_eci_v_utc DATETIME(1) NOT NULL,
    node_loc_pos_eci_v_x DECIMAL(8,2),
    node_loc_pos_eci_v_y DECIMAL(8,2),
    node_loc_pos_eci_v_z DECIMAL(8,2),

    PRIMARY KEY (node_id, node_loc_pos_eci_v_utc)
);

# Acceleration in ECI
# node_id: Node id
# node_loc_pos_eci_a_utc: Telem timestamp (decisecond precision)
# node_loc_pos_eci_a_x: X acceleration in ECI (in meters)
# node_loc_pos_eci_a_y: Y Acceleration in ECI (in meters)
# node_loc_pos_eci_a_z: Z Acceleration in ECI (in meters)
CREATE TABLE IF NOT EXISTS node_loc_pos_eci_a (
    node_id TINYINT UNSIGNED NOT NULL,
    node_loc_pos_eci_a_utc DATETIME(1) NOT NULL,
    node_loc_pos_eci_a_x DECIMAL(8,2),
    node_loc_pos_eci_a_y DECIMAL(8,2),
    node_loc_pos_eci_a_z DECIMAL(8,2),

    PRIMARY KEY (node_id, node_loc_pos_eci_a_utc)
);

# Attitude in ICRF, 0th derivative
# node_id: Node id
# node_loc_att_icrf_utc: Telem timestamp (decisecond precision)
# node_loc_att_icrf_s_d_x: X quaternion in ICRF
# node_loc_att_icrf_s_d_y: Y quaternion in ICRF
# node_loc_att_icrf_s_d_z: Z quaternion in ICRF
# node_loc_att_icrf_s_w: W quaternion in ICRF
CREATE TABLE IF NOT EXISTS node_loc_att_icrf_s (
    node_id TINYINT UNSIGNED NOT NULL,
    node_loc_att_icrf_utc DATETIME(1) NOT NULL,
    node_loc_att_icrf_s_d_x DECIMAL(8,2),
    node_loc_att_icrf_s_d_y DECIMAL(8,2),
    node_loc_att_icrf_s_d_z DECIMAL(8,2),
    node_loc_att_icrf_s_w DECIMAL(8,2),

    PRIMARY KEY (node_id, node_loc_att_icrf_utc)
);

# Attitude in ICRF, 1st derivative
# node_id: Node id
# node_loc_att_icrf_utc: Telem timestamp (decisecond precision)
# node_loc_att_icrf_v_col_0: X quaternion in ICRF
# node_loc_att_icrf_v_col_1: Y quaternion in ICRF
# node_loc_att_icrf_v_col_2: Z quaternion in ICRF
CREATE TABLE IF NOT EXISTS node_loc_att_icrf_v (
    node_id TINYINT UNSIGNED NOT NULL,
    node_loc_att_icrf_utc DATETIME(1) NOT NULL,
    node_loc_att_icrf_v_col_0 DECIMAL(8,2),
    node_loc_att_icrf_v_col_1 DECIMAL(8,2),
    node_loc_att_icrf_v_col_2 DECIMAL(8,2),

    PRIMARY KEY (node_id, node_loc_att_icrf_utc)
);

# Attitude in ICRF, 2nd derivative
# node_id: Node id
# node_loc_att_icrf_utc: Telem timestamp (decisecond precision)
# node_loc_att_icrf_a_col_0: X quaternion in ICRF
# node_loc_att_icrf_a_col_1: Y quaternion in ICRF
# node_loc_att_icrf_a_col_2: Z quaternion in ICRF
CREATE TABLE IF NOT EXISTS node_loc_att_icrf_a (
    node_id TINYINT UNSIGNED NOT NULL,
    node_loc_att_icrf_utc DATETIME(1) NOT NULL,
    node_loc_att_icrf_a_col_0 DECIMAL(8,2),
    node_loc_att_icrf_a_col_1 DECIMAL(8,2),
    node_loc_att_icrf_a_col_2 DECIMAL(8,2),

    PRIMARY KEY (node_id, node_loc_att_icrf_utc)
);


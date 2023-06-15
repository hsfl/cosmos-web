export interface mysqlschema {
    table: string;
    statement: string;
}

export const table_schema: Array<mysqlschema> = [
    {
        table: "node_type",
        statement: `CREATE TABLE IF NOT EXISTS node_type (
            id SMALLINT UNSIGNED NOT NULL UNIQUE,
            name VARCHAR(40) NOT NULL,
            PRIMARY KEY (id)
        );`
    },
    {
        table: "node",
        statement: `CREATE TABLE IF NOT EXISTS node (
            node_id TINYINT UNSIGNED NOT NULL UNIQUE,
            node_name VARCHAR(40) NOT NULL UNIQUE,
            node_type SMALLINT UNSIGNED NOT NULL,
            agent_name VARCHAR(40) NOT NULL,
            utc DOUBLE,
            utcstart DOUBLE,
            PRIMARY KEY (node_name)
            );`
    },
    {
        table: "device_type",
        statement: `CREATE TABLE IF NOT EXISTS device_type (
            name VARCHAR(40) NOT NULL,
            id SMALLINT UNSIGNED NOT NULL UNIQUE,
            PRIMARY KEY (id)
        );`
    },
    {
        table: "device",
        statement: `CREATE TABLE IF NOT EXISTS device (
            node_name VARCHAR(40) NOT NULL,
            type SMALLINT UNSIGNED NOT NULL,
            cidx SMALLINT UNSIGNED NOT NULL,
            didx SMALLINT UNSIGNED NOT NULL,
            name VARCHAR(40) NOT NULL,
            PRIMARY KEY (node_name, type, didx)
        );`
    },
    {
        table: "battstruc",
        statement: `CREATE TABLE IF NOT EXISTS battstruc (
            node_name VARCHAR(40) NOT NULL,
            didx TINYINT UNSIGNED NOT NULL,
            utc DOUBLE NOT NULL,
            volt DOUBLE,
            amp DOUBLE,
            power DOUBLE,
            temp DOUBLE,
            percentage DOUBLE,
            PRIMARY KEY (node_name, didx, utc)
            );`
    },
    {
        table: "bcregstruc",
        statement: `CREATE TABLE IF NOT EXISTS bcregstruc (
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
            );`
    },
    {
        table: "cpustruc",
        statement: `CREATE TABLE IF NOT EXISTS cpustruc (
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
            );`
    },
    {
        table: "gyrostruc",
        statement: `CREATE TABLE IF NOT EXISTS gyrostruc (
            node_name VARCHAR(40) NOT NULL,
            didx TINYINT UNSIGNED NOT NULL,
            utc DOUBLE NOT NULL,
            omega DOUBLE,
            PRIMARY KEY (node_name, didx, utc)
            );`
    },
    {
        table: "magstruc",
        statement: `CREATE TABLE IF NOT EXISTS magstruc (
            node_name VARCHAR(40) NOT NULL,
            didx TINYINT UNSIGNED NOT NULL,
            utc DOUBLE NOT NULL,
            mag_x DOUBLE,
            mag_y DOUBLE,
            mag_z DOUBLE,
            PRIMARY KEY (node_name, didx, utc)
            );`
    },
    {
        table: "mtrstruc",
        statement: `CREATE TABLE IF NOT EXISTS mtrstruc (
            node_name VARCHAR(40) NOT NULL,
            didx TINYINT UNSIGNED NOT NULL,
            utc DOUBLE NOT NULL,
            mom DOUBLE,
            align_w DOUBLE,
            align_x DOUBLE,
            align_y DOUBLE,
            align_z DOUBLE,
            PRIMARY KEY (node_name, didx, utc)
            );`
    },
    {
        table: "rwstruc",
        statement: `CREATE TABLE IF NOT EXISTS rwstruc (
            node_name VARCHAR(40) NOT NULL,
            didx TINYINT UNSIGNED NOT NULL,
            utc DOUBLE NOT NULL,
            amp DOUBLE,
            omg DOUBLE,
            romg DOUBLE,
            PRIMARY KEY (node_name, didx, utc)
            );`
    },
    {
        table: "swchstruc",
        statement: `CREATE TABLE IF NOT EXISTS swchstruc (
            node_name VARCHAR(40) NOT NULL,
            didx TINYINT UNSIGNED NOT NULL,
            utc DOUBLE NOT NULL,
            volt DOUBLE,
            amp DOUBLE,
            power DOUBLE,
            temp DOUBLE,
            PRIMARY KEY (node_name, didx, utc)
            );`
    },
    {
        table: "tsenstruc",
        statement: `CREATE TABLE IF NOT EXISTS tsenstruc (
            node_name VARCHAR(40) NOT NULL,
            didx TINYINT UNSIGNED NOT NULL,
            utc DOUBLE NOT NULL,
            temp DOUBLE,
            PRIMARY KEY (node_name, didx, utc)
            );`
    },
    {
        table: "locstruc",
        statement: `CREATE TABLE IF NOT EXISTS locstruc (
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
        );`
    },
    {
        table: "locstruc_eci",
        statement: `CREATE TABLE IF NOT EXISTS locstruc_eci (
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
            );`
    },
    {
        table: "attstruc_icrf",
        statement: `CREATE TABLE IF NOT EXISTS attstruc_icrf (
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
            );`
    },
    {
        table: "event_type",
        statement: `CREATE TABLE IF NOT EXISTS event_type (
            event_id TINYINT UNSIGNED NOT NULL,
            event_type VARCHAR(40) NOT NULL,
            PRIMARY KEY (event_id)
        );`
    },
    {
        table: "cosmos_event",
        statement: `CREATE TABLE IF NOT EXISTS cosmos_event (
            node_name VARCHAR(40) NOT NULL,
            utc DOUBLE(17, 8) NOT NULL,
            duration INT UNSIGNED,
            event_id TINYINT UNSIGNED NOT NULL,
            event_name VARCHAR(40) NOT NULL,
            PRIMARY KEY (node_name, utc, event_name)
        );`
    },
    {
        table: "event",
        statement: `CREATE TABLE IF NOT EXISTS event (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(255) NOT NULL,
            duration_seconds INT NOT NULL
        );`
    },
    {
        table: "resource",
        statement: `CREATE TABLE IF NOT EXISTS resource (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(255) NOT NULL,
            min_level DOUBLE PRECISION NOT NULL,
            max_level DOUBLE PRECISION NOT NULL
        );`
    },
    {
        table: "event_resource_impact",
        statement: `CREATE TABLE IF NOT EXISTS event_resource_impact (
            event_id INT NOT NULL,
            resource_id INT NOT NULL,
            second_index INT NOT NULL,
            resource_change DOUBLE PRECISION NOT NULL,
            PRIMARY KEY (event_id, resource_id, second_index),
            FOREIGN KEY (event_id) REFERENCES event(id),
            FOREIGN KEY (resource_id) REFERENCES resource(id)
        );`
    },
];
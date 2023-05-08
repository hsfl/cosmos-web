drop database if exists cosmos_ceo;
create database cosmos_ceo;
use cosmos_ceo;
CREATE TABLE IF NOT EXISTS mission_map (
    -- id SMALLINT UNSIGNED NOT NULL UNIQUE,
    mission_name VARCHAR(40) NOT NULL,
    host VARCHAR(40) NOT NULL,
    user VARCHAR(40) NOT NULL,
    db_access VARCHAR(40) NOT NULL,
    db_name VARCHAR(40) NOT NULL,
    PRIMARY KEY (db_name)
);

REPLACE INTO mission_map VALUES ('mothership', 'cosmos_db', 'backend_user', 'password', 'sim_cosmos');

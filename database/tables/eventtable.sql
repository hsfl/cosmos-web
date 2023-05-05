-- Refined Resource Dictionary
CREATE TABLE resource (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL, # ephemeral, sat, etc.
    min_level DOUBLE PRECISION NOT NULL,
    max_level DOUBLE PRECISION NOT NULL
);

-- Event Dictionary
CREATE TABLE event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL, # ephemeral, sat, etc.
    duration_seconds INT NOT NULL
);

-- Event Resource Impact
CREATE TABLE event_resource_impact (
    event_id INT NOT NULL,
    resource_id INT NOT NULL,
    second_index INT NOT NULL, # timestamp in second offset after start of event
    resource_change INT NOT NULL, # how the resource is changing in this timestamp
    PRIMARY KEY (event_id, resource_id, second_index),
    FOREIGN KEY (event_id) REFERENCES event(id),
    FOREIGN KEY (resource_id) REFERENCES resource(id)
);

- Insert Sample Resources
INSERT INTO resource (name, type, min_level, max_level)
VALUES 
    ('Payload Processor', 'Processor', 0, 1),
    ('Camera Temperature', 'Temperature', 0, 366), # K
    ('Power', 'Energy', 0, 15), # kW
    ('Disk Space', 'Storage', 0, 1000); # mb


-- Insert Sample Event
INSERT INTO event (id, name, type, duration_seconds)
VALUES (1, 'Take Picture', 'Picture', 300);

-- Insert Resource Impacts for the Take Picture Event
INSERT INTO event_resource_impact (event_id, resource_id, second_index, resource_change)
VALUES 
    -- Payload Processor
    (1, 1, 0, -1), # binary switch off
    (1, 1, 299, 1); # on

-- Power (Use 3W each second during the 5 minutes when taking a picture)
WITH RECURSIVE power_seconds (second_index) AS (
    SELECT 0
    UNION ALL
    SELECT second_index + 1
    FROM power_seconds
    WHERE second_index < 299
)
INSERT INTO event_resource_impact (event_id, resource_id, second_index, resource_change)
SELECT 1, 3, second_index, -3
FROM power_seconds;

-- Disk Space (Fill disk at the rate of 52mbps starting from the 10th second)
WITH RECURSIVE disk_seconds (second_index) AS (
    SELECT 10
    UNION ALL
    SELECT second_index + 1
    FROM disk_seconds
    WHERE second_index < 299
)
INSERT INTO event_resource_impact (event_id, resource_id, second_index, resource_change)
SELECT 1, 4, second_index, -0.052
FROM disk_seconds;


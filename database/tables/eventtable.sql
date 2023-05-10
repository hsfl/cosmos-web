-- Recreate from scratch
drop table event_resource_impact;
drop table event;
drop table resource;
drop table seq;
drop procedure fill_seq;

CREATE TABLE seq (
  id int(11) NOT NULL
);

DELIMITER ;;
CREATE PROCEDURE fill_seq()
BEGIN
  DECLARE counter INT DEFAULT 0;
  WHILE counter < 1000 DO
    INSERT seq VALUES (counter);
    SET counter = counter + 1;
  END WHILE;
END;;
DELIMITER ;

CALL fill_seq();

-- Resource Dictionary
CREATE TABLE resource (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    min_level DOUBLE PRECISION NOT NULL,
    max_level DOUBLE PRECISION NOT NULL
);

-- Event Dictionary
CREATE TABLE event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    duration_seconds INT NOT NULL
);

-- Event Resource Impact
CREATE TABLE event_resource_impact (
    event_id INT NOT NULL,
    resource_id INT NOT NULL,
    second_index INT NOT NULL,
    resource_change DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (event_id, resource_id, second_index),
    FOREIGN KEY (event_id) REFERENCES event(id),
    FOREIGN KEY (resource_id) REFERENCES resource(id)
);

-- Insert Sample Resources
INSERT INTO resource (name, type, min_level, max_level)
VALUES 
    ('Payload Processor', 'Processor', 0, 1),
    ('Camera Temperature', 'Temperature', 0, 366),
    ('Power', 'Energy', 0, 15),
    ('Disk Space', 'Storage', 0, 1000);

-- Insert Sample Event
INSERT INTO event (id, name, type, duration_seconds)
VALUES (1, 'Take Picture', 'Picture', 300);

-- Insert Resource Impacts for the Take Picture Event
INSERT INTO event_resource_impact (event_id, resource_id, second_index, resource_change)
VALUES 
    -- Payload Processor
    (1, 1, 0, -1),
    (1, 1, 299, 1);

-- Power (Use 3W each second during the 5 minutes when taking a picture)
INSERT INTO event_resource_impact (event_id, resource_id, second_index, resource_change)
SELECT
    1 AS event_id,
    3 AS resource_id,
    (a.num + 10 * b.num + 100 * c.num) AS second_index,
    -3 AS resource_change
FROM
    (SELECT 0 AS num union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) a
JOIN
    (SELECT 0 AS num union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) b
JOIN
    (SELECT 0 AS num union all select 1 union all select 2 union all select 3) c
WHERE
    (a.num + 10 * b.num + 100 * c.num) <= 299;

-- Disk Space (Fill disk at the rate of 52mbps starting from the 10th second)
INSERT INTO event_resource_impact (event_id, resource_id, second_index, resource_change)
SELECT
    1 AS event_id,
    4 AS resource_id,
    (a.num + 10 * b.num + 100 * c.num) AS second_index,
    -0.052 AS resource_change
FROM
    (SELECT 0 AS num union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) a
JOIN
    (SELECT 0 AS num union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) b
JOIN
    (SELECT 0 AS num union all select 1 union all select 2 union all select 3) c
WHERE
    (a.num + 10 * b.num + 100 * c.num) BETWEEN 10 AND 299;


-- this totally works

drop procedure dynamic_eri_report;
DELIMITER ;;
CREATE PROCEDURE dynamic_eri_report(IN event_name VARCHAR(255))
BEGIN
    DECLARE event_id INT;

    SELECT id INTO event_id FROM event WHERE name = event_name;

    SET @sql = NULL;

    SELECT
      GROUP_CONCAT(DISTINCT
        CONCAT(
          'SUM(CASE WHEN resource.id = ',
          resource.id,
          ' THEN IFNULL(event_resource_impact.resource_change, 0) ELSE 0 END) AS `',
          REPLACE(resource.name, ' ', '_'), '`'
        )
      ) INTO @sql
    FROM resource
    JOIN event_resource_impact ON resource.id = event_resource_impact.resource_id
    WHERE event_resource_impact.event_id = event_id;

    SET @sql = CONCAT('SELECT seq.id AS time_seconds, ', @sql, ' 
                      FROM event
                      JOIN seq ON seq.id < event.duration_seconds
                      CROSS JOIN resource
                      LEFT JOIN event_resource_impact ON event_resource_impact.event_id = event.id AND event_resource_impact.resource_id = resource.id AND event_resource_impact.second_index = seq.id
                      WHERE event.id = ', event_id, '
                      AND resource.id IN (SELECT resource_id FROM event_resource_impact WHERE event_id = ', event_id, ')
                      GROUP BY seq.id
                      ORDER BY seq.id;');

    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS dynamic_eri_report_cumulative;
DELIMITER ;;
CREATE PROCEDURE dynamic_eri_report_cumulative (IN event_name VARCHAR(255))
BEGIN
    SET @sql = NULL;

    SELECT
        GROUP_CONCAT(DISTINCT
            CONCAT(
                'SUM(CASE WHEN resource.id = ',
                resource.id,
                ' THEN IFNULL(event_resource_impact.resource_change, 0) ELSE 0 END) AS `',
                resource.name, '`'
            )
        ) INTO @sql
    FROM resource
    WHERE EXISTS (
        SELECT 1
        FROM event_resource_impact eri
        JOIN event e ON eri.event_id = e.id
        WHERE eri.resource_id = resource.id
        AND e.name = event_name
    );

    SET @sql = CONCAT('SELECT seq.id AS time_seconds, ', @sql, '
                       FROM event
                       JOIN seq ON seq.id < event.duration_seconds
                       CROSS JOIN resource
                       LEFT JOIN event_resource_impact ON event_resource_impact.event_id = event.id AND event_resource_impact.resource_id = resource.id AND event_resource_impact.second_index <= seq.id
                       WHERE event.name = ''', event_name, '''
                       GROUP BY seq.id
                       ORDER BY seq.id;');

    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;;
DELIMITER ;


CALL dynamic_eri_report('Take Picture');

CALL dynamic_eri_report_cumulative('Take Picture');




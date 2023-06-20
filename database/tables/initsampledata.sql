# Note, should be pasted manually in sql terminal
# The docker mysql entrypoint script will ignore this folder

####################################################
### SAMPLE DATA INSERT #########################################
####################################################

# List of insert statements for cosmos sql database

# locstruc_type: (node_name, utc, eci_s_x, eci_s_y, eci_s_z, eci_v_x, eci_v_y, eci_v_z, icrf_s_x, icrf_s_y, icrf_s_z, icrf_s_w, icrf_v_x, icrf_v_y, icrf_v_z  )
REPLACE INTO locstruc VALUES ('mothership', 60107.83333333, 2230000, 3730750, 5210750, -5632.5,5057.75,-1207.75, 0.0004848787686305429, 0.00099960060846681622, 0.4480002584702239, 0.89403273659403326, 0, 0, 0);
REPLACE INTO locstruc VALUES ('c', 59872.83333333, 2230000, 3730750, 5210750, -5632.5,5057.75,-1207.75, 0.0004848787686305429, 0.00099960060846681622, 0.4480002584702239, 0.89403273659403326, 0, 0, 0);

# node : node_id node_name, node_type, agent_name, utc, utcstart
REPLACE INTO node VALUES (0, 'mothership', 0, 'agent name', 60107.83333333, 60107.83333333);
REPLACE INTO node VALUES (1, 'c', 0, 'agent name', 60107.83333333, 60107.83333333);

REPLACE INTO device VALUES ('mothership', 12, 0, 0, 'battery');
REPLACE INTO device VALUES ('mothership', 30, 0, 0, 'bcreg');
REPLACE INTO device VALUES ('mothership', 15, 0, 0, 'temp sensor');
REPLACE INTO device VALUES ('mothership', 15, 0, 15, 'temp sensor');
REPLACE INTO device VALUES ('mothership', 5, 0, 5, 'cpu');
REPLACE INTO device VALUES ('mothership', 32, 0, 32, 'magnetometer');
REPLACE INTO device VALUES ('mothership', 31, 0, 31, 'gyroscope');
REPLACE INTO device VALUES ('mothership', 4, 0, 4, 'magnetic torque rod');
REPLACE INTO device VALUES ('mothership', 3, 0, 3, 'reaction wheel');


REPLACE INTO event_type VALUES (0, 'Umbra');
REPLACE INTO event_type VALUES (1, 'kauai');
REPLACE INTO event_type VALUES (2, 'surrey');
REPLACE INTO event_type VALUES (3, 'payload1');
REPLACE INTO event_type VALUES (4, 'payload2');

REPLACE INTO cosmos_event VALUES ('mothership', 60107.03333333, 200, 3, 'Npole');
REPLACE INTO cosmos_event VALUES ('mothership', 60107.04333333, 1000, 3, 'Spole');
REPLACE INTO cosmos_event VALUES ('mothership', 60107.05333333, 400, 4, 'EQA');
REPLACE INTO cosmos_event VALUES ('mothership', 60107.06333333, 2000, 4, 'EQD');
REPLACE INTO cosmos_event VALUES ('mothership', 60107.06733333, 300, 3, 'MaxN');
REPLACE INTO cosmos_event VALUES ('mothership', 60107.05027778, 1000, 3, 'MaxS');
REPLACE INTO cosmos_event VALUES ('mothership', 60107.06027778, 900, 0, 'UMB_In');

REPLACE INTO cosmos_event VALUES ('mothership', 60107.04027778, 1728, 2, 'AOS000');
REPLACE INTO cosmos_event VALUES ('mothership', 60107.06027799, 0, 2, 'LOS000');

# test different dates for manual computation accuracy; 2023
REPLACE INTO cosmos_event VALUES ('mothership', 60107.06027799, 0, 2, 'LOS222');

REPLACE INTO battstruc VALUES ('mothership', 0, 60107.03333333, 0, 0, 0, 0, 0);

REPLACE INTO bcregstruc VALUES ("mothership", 30, 60107.03333333, 0, 0, 0, 0, 0, 0, 0, 0);

REPLACE INTO tsenstruc VALUES ("mothership", 15, 60107.03333333, 0);

REPLACE INTO cpustruc VALUES ("mothership", 15, 60107.03333333, 0, 0, 0, 0, 0, 0);

REPLACE INTO magstruc VALUES ("mothership", 32, 60107.03333333, 0, 0, 0);

REPLACE INTO gyrostruc VALUES ("mothership", 31, 60107.03333333, 0);

REPLACE INTO mtrstruc VALUES ("mothership", 4, 60107.03333333, 0, 0, 0, 0, 0);

REPLACE INTO rwstruc VALUES ("mothership", 3, 60107.03333333, 0, 0, 0);

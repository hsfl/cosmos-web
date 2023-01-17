mysql -uroot -p$MYSQL_ROOT_PASSWORD << END

CREATE USER IF NOT EXISTS 'backend_user'@'%' IDENTIFIED BY '$DB_BACKEND_USER_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON cosmos.* TO 'backend_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON cosmos_test.* TO 'backend_user'@'%';

CREATE USER IF NOT EXISTS 'grafana_user'@'%' IDENTIFIED BY '$DB_GRAFANA_USER_PASSWORD';
GRANT SELECT ON cosmos.* TO 'grafana_user'@'%';

END
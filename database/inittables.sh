# Setup tables for cosmos database
mysql -uroot -p$MYSQL_ROOT_PASSWORD cosmos < /docker-entrypoint-initdb.d/tables/inittables.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD cosmos_test < /docker-entrypoint-initdb.d/tables/inittables.sql

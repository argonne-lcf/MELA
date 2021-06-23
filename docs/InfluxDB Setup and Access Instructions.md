### InfluxDB Setup and Access Instructions


*Steps 1 and 3 are for installation and setup. For testing follow steps 2 and 4.*


1. InfluxDB download [link](https://portal.influxdata.com/downloads/)

```
wget https://dl.influxdata.com/influxdb/releases/influxdb-1.8.6_linux_amd64.tar.gz
tar xvfz influxdb-1.8.6_linux_amd64.tar.gz
```

2. Run influxd : The influxd daemon starts and runs all the processes necessary for InfluxDB to function

```
./influxd -config /path/to/db/influxdb-1.8.6-1/etc/influxdb/influxdb.conf
```
-config should point to the configuration file in your install. Data and log file paths can be specified in the config file.


3. Import/insert influx data : 

```
./usr/bin/influx -import -path=/path/to/dataset/in/lineformat/
```

For example:
```
./usr/bin/influx -import -path=linedata
```

4. Launch influx

```
./usr/bin/influx -precision rfc3339
```

and [access influx db](https://docs.influxdata.com/influxdb/v1.8/introduction/get-started/) on the command line using the following instructions

```
>>> show databases
>>> use db_name 
show time series measurements
>>> show measurements
Access data from measurement CC_TEST_MEASUREMENT
>>> Select * from CC_TEST_MEASUREMENT limit 10
```




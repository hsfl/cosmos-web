load("json.star", "json")
#load("logging.star", "log")

def apply(metric):
	#log.debug("soh value: {}".format(metric.fields.get("value")))
	j = json.decode(metric.fields.get("value"))

	new_metric = Metric(j["node_name"])
	new_metric.tags["beacon_type"] = j["beacon_type"]

	# Convert agent_utc to metric timestamp in unix time
	# precision is nanoseconds
	mjd = j["utc"]
	unix_time = int((mjd - 40587) * 86400 * 1000000000)
	new_metric.time = unix_time
	#log.debug("uxtj: {}".format(unix_time))
	#log.debug("uxtn: {}".format(time.now().unix_nano))

	# Iterate over json keys
	for key in j:
		# Skip these since they are already dealt with
		if key == "node_name" or key == "beacon_type" or key == "utc":
			continue

		# Add other beacon keys as fields
		entry = j[key]
		etype = type(entry)
		if (etype == "int"):
			# Whole numbers mess things up so just cast everything to floats
			entry = float(entry)
		new_metric.fields[key] = entry

	return new_metric
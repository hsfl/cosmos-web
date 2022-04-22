load("json.star", "json")
#load("logging.star", "log")

def apply(metric):
	#log.debug("soh value: {}".format(metric.fields.get("value")))
	j = json.decode(metric.fields.get("value"))

	new_metric = Metric(j["node_name"])
	new_metric.tags["beacon_type"] = j["beacon_type"]

	# Iterate over json keys
	for key in j:
		# Skip these since they are being used as the measurement name and tag, respectively
		if key == "node_name" or key == "beacon_type":
			continue

		# Add other beacon keys as fields
		entry = j[key]
		etype = type(entry)
		if (etype == "int"):
			# Whole numbers mess things up so just cast everything to floats
			entry = float(entry)
		new_metric.fields[key] = entry

	return new_metric
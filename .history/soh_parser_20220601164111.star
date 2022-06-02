load("json.star", "json")
load("logging.star", "log")

# name: key of the current entry
# entry: new entry to add as a field. Recurse on lists or dicts
# metric: the metric to modify
def add_field(name, entry, metric):
	# Check if list
	etype = type(entry)
	if (etype == "list"):
		#log.debug("l-------j[key]: {} {} {}".format(name, entry, type(entry)))
		for i, elem in enumerate(entry):
			fullname = name + "[{}]".format(i)
			add_field(fullname, elem, metric)
		return
	# Check if dict
	elif (etype == "dict"):
		#log.debug("d-------j[key]: {} {} {}".format(name, entry, type(entry)))
		for key in entry.keys():
			fullname = name + ".{}".format(key)
			add_field(fullname, entry[key], metric)
		return
	# This entry is a primitive
	elif (etype == "int"):
		# Whole numbers mess things up so just cast everything to floats
		entry = float(entry)
	metric.fields[name] = entry
	#log.debug("s-------j[key]: {} {} {}".format(name, entry, type(entry)))
	return

# name: sohstring key to add as a tag
# entry: namespace value of the sohstring key
# metric: the metric to modify
def add_sohkey(name, entry, metric):
	metric.tags["soh_key"] = name
	etype = type(entry)
	# Add elements as fields if list or dict
	if (etype == "list"):
		for i, elem in enumerate(entry):
			fullname = "[{}]".format(i)
			add_field(fullname, elem, metric)
	elif (etype == "dict"):
		for key in entry.keys():
			add_field(key, entry[key], metric)
	# If primitive, add the value as a field called "svalue" or "nvalue" for strings and numbers, respectively
	elif (etype == "string"):
		add_field("svalue", entry, metric)
	else:
		add_field("nvalue", entry, metric)
	return

def apply(metric):
	#log.debug("soh value: {}".format(metric.fields.get("value")))
	j = json.decode(metric.fields.get("value"))
	node_name = j["node_name"]

	metrics = []

	# Convert agent_utc to metric timestamp in unix time
	# precision is nanoseconds
	unix_time = time.now().unix_nano
	if "node_utc" in j:
		mjd = j["node_utc"]
		unix_time = int((mjd - 40587) * 86400 * 1000000000)
		#log.debug("uxtj: {}".format(unix_time))
		#log.debug("uxtn: {}".format(time.now().unix_nano))
	
	# Iterate over SOH json keys
	for key in j:
		# Skip these since they are being used as the measurement name and timestamp, respectively
		if key == "node_name" or key == "node_utc":
			continue
		
		new_metric = Metric(node_name)
		new_metric.time = unix_time
		#new_metric.fields[key] = j[key] # probably don't need node_utc twice

		# Add sohstring keys as tags
		#log.debug("k-------: {}".format(key))
		add_sohkey(key, j[key], new_metric)
		metrics.append(new_metric)

	#log.debug("--------FORMAT END: {}".format(node_name))
	return metrics
load("json.star", "json")
load("logging.star", "log")
load("time.star", "time")

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
    return

# Each SOH object is just one single measurement
# Arg d is a dictionary, a single SOH
# metrics is the list to append to and return
def handleSOH(d, metrics):
    node_name = d["node_name"]

    # Convert agent_utc to metric timestamp in unix time
    # precision is nanoseconds
    unix_time = 0
    time_key = ""
    if "node_utc" in d:
        time_key = "node_utc"
    elif "utc" in d:
        time_key = "utc"
    if time_key != "":
        mjd = d[time_key]
        unix_time = int((mjd - 40587) * 86400 * 1000000000)
    else:
        unix_time = time.now().unix_nano
    
    # Measurement name is the node name,
    # time as the mjd time if provided (reconsider?)
    new_metric = Metric(node_name)
    # TODO: fix tag, also coordinate with namepass namedrop of buckets in .conf file
    new_metric.tags["type"] = "simdata"
    new_metric.time = unix_time
    
    # Iterate over SOH json keys
    for key in d:
        # Skip these since they are being used as the measurement name and timestamp, respectively
        if key == "node_name" or key == "node_utc" or key == "utc":
            continue

        # Add sohstring keys as fields
        #log.debug("k-------: {}".format(key))
        add_field(key, d[key], new_metric)
    #log.debug("--------SOH END: {} {}".format(node_name, new_metric))
    metrics.append(new_metric)

def apply(metric):
    #log.debug("soh value: {}".format(metric.fields.get("value")))
    j = json.decode(metric.fields.get("value"))
    metrics = []

    # If it's a single object, handle it as one soh
    if (type(j) == "dict"):
        handleSOH(j, metrics)
        return metrics

    # If it's a list, iterate through elements, with each element being a soh
    for el in j:
        handleSOH(el, metrics)

    #log.debug("--------FORMAT END: {}".format(metrics))
    return metrics
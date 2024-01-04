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
    # Ignore null entries
    elif (etype == "NoneType"):
        return
    metric.fields[name] = entry
    return

# Each SOH object is just one single measurement
# Arg d is a dictionary, a single SOH
# metrics is the list to append to and return
def handleSOH(d, metrics):
    new_metric = Metric("beacon")
    node_name = "unknown"
    beacon_type = "unknown"
    if "node_name" in d:
        node_name = d["node_name"]
    if "beacon_type" in d:
        beacon_type = d["beacon_type"]
    new_metric.tags["node_name"] = node_name
    new_metric.tags["beacon_type"] = beacon_type

    new_metric.fields["beacon_arrival_time"] = time.now().unix_nano
    new_metric.time = 0

    # Used to tag influxdb-type input data. Removed in telegraf.conf before output
    new_metric.tags["telegraf_datatag"] = "cosmos_influxdb"

    # Iterate over SOH json keys
    for key in d:
        # Skip these since they are already dealt with
        if key == "node_name" or key == "beacon_type":
            continue
        
        # Use latest utc timestamp provided in the set
        if key.find("utc") != -1:
            mjd = d[key]
            unix_time = int((mjd - 40587) * 86400 * 1000000000)
            if unix_time > new_metric.time:
               new_metric.time = unix_time
            continue

        # Add json keys as fields
        #log.debug("k-------: {}".format(key))
        add_field(key, d[key], new_metric)
    #log.debug("--------SOH END: {} {}".format(node_name, new_metric))

    # if no time was found, just use current time
    if new_metric.time == 0:
        new_metric.time = time.now().unix_nano
    #log.debug("--------SOH END: {} currenttime: {} {}".format(node_name, new_metric.fields["beacon_arrival_time"], new_metric.time))
    metrics.append(new_metric)

def apply(metric):
    #log.debug("soh value: {}".format(metric.fields.get("value")))
    j = json.decode(metric.fields.get("value"))
    metrics = []

    # If it's a single object, handle it as one soh
    if (type(j) == "dict"):
        handleSOH(j, metrics)
    # If it's a list, iterate through elements, with each element being a soh
    else:
        for el in j:
            handleSOH(el, metrics)

    #log.debug("--------FORMAT END: {}".format(metrics))
    return metrics

load("json.star", "json")
load("time.star", "time")
#load("logging.star", "log")

def apply(metric):
    #log.debug("soh value: {}".format(metric.fields.get("value")))
    j = json.decode(metric.fields.get("value"))

    new_metric = Metric("beacon")
    node_name = "unknown"
    beacon_type = "unknown"
    if "node_name" in j:
        node_name = j["node_name"]
    if "beacon_type" in j:
        beacon_type = j["beacon_type"]
    new_metric.tags["node_name"] = node_name
    new_metric.tags["beacon_type"] = beacon_type

    new_metric.time = time.now().unix_nano

    # Iterate over json keys
    for key in j:
        # Skip these since they are already dealt with
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
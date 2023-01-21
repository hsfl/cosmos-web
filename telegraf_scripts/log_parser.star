load("json.star", "json")
load("time.star", "time")
#load("logging.star", "log")

def apply(metric):
    #log.debug("Loki value: {}".format(metric.fields.get("value")))
    j = json.decode(metric.fields.get("value"))

    new_metric = Metric("log")
    level = "info"
    location = "unknown"
    if "level" in j:
        level = j["level"]
    if "location" in j:
        location = j["location"]
    new_metric.tags["level"] = level
    new_metric.tags["location"] = location

    new_metric.time = time.now().unix_nano

    # Iterate over json keys
    for key in j:
        # Skip these since they are already dealt with
        if key == "level" or key == "location":
            continue

        # Add other keys as fields
        entry = j[key]

        new_metric.fields[key] = str(entry)
    
    new_metric.tags["telegraf_datatag"] = "cosmos_log"

    return new_metric
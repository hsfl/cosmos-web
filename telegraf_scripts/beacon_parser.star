load("logging.star", "log")

def apply(metric):
    log.debug("got beacon: {}".format(metric))
    return metric

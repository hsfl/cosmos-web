import requests

#url = 'http://interstel1.interstel.tech:10090/sim/propagator'
#url = 'http://localhost:10090/sim/propagator'
url = 'http://localhost:10090/db/telem'
prop_args = {
    "node_id":0,
    "name":"batt_level",
    "time":59270,
    "value":3.0,
    "nodes":[{"name":"iobc","id":0},{"name":"unibap","id":1}],
}
#prop_args = [{"node_id":2,"name":"dev0","dname":"diobc"},{"node_id":0,"name":"dev1","dname":"dunibap"}]
headers = {'Content-Type': 'application/json'}
req = requests.post(url=url, json=prop_args, headers=headers)

print(req.json())

# Ian Whitehouse, Apr 2025, ianjw@umd.edu
from json import dump, load
from sys import argv


def flatten(nodes, level=1):
    flattened_nodes = []

    for node in nodes:
        node["level"] = level
        if "children" in node.keys():
            new_flattend_nodes = flatten(node["children"], level=level+1)
            for flat_node in new_flattend_nodes:
                if "parent" not in flat_node.keys():
                    flat_node["parent"] = node["node"]
                flattened_nodes.append(flat_node)
            del node["children"]
            flattened_nodes.append(node)
        else:
            flattened_nodes.append(node)

    return flattened_nodes


if len(argv) < 2:
    assert False, "No input file cli argument"

with open(argv[1], "r") as f:
    data = load(f)

# Flatten and change node to id
flat_data = flatten([data])
flat_data[-1]["parent"] = None
for i in range(len(flat_data)):
    flat_data[i]["id"] = flat_data[i]["node"]
    del flat_data[i]["node"]
flat_data = sorted(flat_data, key=lambda x: x["id"])
print(flat_data)

with open("d3-website/tree.json", "w") as f:
    dump(flat_data, f)

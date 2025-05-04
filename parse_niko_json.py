# Ian Whitehouse, Apr 2025, ianjw@umd.edu
from json import dump, load
from sys import argv
import pandas as pd


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


def find_mutation_reference(mutation, ref_mutations_dict):
    mutation = (mutation.split(":")[0][3:].lower(), int(mutation.split(":")[1]))

    for ref_mutation in ref_mutations_dict:
        try:
            loc = ref_mutation["Genome Location"].split(":")
            chromosome = loc[0].lower()
            loc = (int(loc[1].split("-")[0]), int(loc[1].split("-")[1]))

            if chromosome == mutation[0] and loc[0] <= mutation[1] <= loc[1]:
                return ref_mutation
        except ValueError:
            print(ref_mutation)
    return None





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

# Add mutation role and type in cancer
mutation_info = pd.read_csv('cosmic.tsv', sep='\t').to_dict("records")

for i in range(len(flat_data)):
    rel_mutations = [
        find_mutation_reference(mutation, mutation_info) for mutation in flat_data[i]["mutation_names"]
    ]

    flat_data[i]["roles"] = [
        mut["Role in Cancer"] if mut is not None else "no known role" for mut in rel_mutations
    ]
    flat_data[i]["types"] = [
        mut["Tumour Types(Somatic)"] if mut is not None else "no known type" for mut in rel_mutations
    ]

    flat_data[i]["geneId"] = [
        mut["Gene Symbol"] if mut is not None else "no gene" for mut in rel_mutations
    ]

# print(flat_data)
with open("d3-website/tree.json", "w") as f:
    dump(flat_data, f)

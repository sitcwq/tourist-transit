import osmnx as ox
import networkx as nx
import json


def load_json_data(file_path):
    with open(file_path, "r") as file:
        json_data = json.load(file)
    converted_json_data = {}
    for key in json_data:
        # Normalize keys to ensure consistent comparison
        normalized_key = ''.join([c for c in key if c.isdigit() or c == ','])
        sorted_key = ','.join(sorted(normalized_key.split(','), key=int))
        converted_json_data[sorted_key] = json_data[key]
    return converted_json_data

def add_congestion(graph, json_data):
    # Convert the JSON data for easier key comparison
    converted_json_data = {}
    for key in json_data:
        # Normalize keys to ensure consistent comparison
        normalized_key = ''.join([c for c in key if c.isdigit() or c == ','])
        sorted_key = ','.join(sorted(normalized_key.split(','), key=int))
        converted_json_data[sorted_key] = json_data[key]

    # Update the graph with congestion information
    for u, v, key, data in graph.edges(keys=True, data=True):
        osmids = data.get('osmid')
        if isinstance(osmids, list):
            sorted_osmids = ','.join(sorted(map(str, osmids), key=int))
        else:
            sorted_osmids = str(osmids)

        # Check against the converted JSON data
        congested_info = converted_json_data.get(sorted_osmids, None)
        congested_status = congested_info['congested'] if congested_info else False

        # Assign the congested status to the edge
        graph[u][v][key]['congested'] = congested_status



#Function to identify ERP nodes based on the "highway" attribute
def is_erp_edge(data):
    return data.get('highway') in ['motorway', 'motorway_link']

# Function to add weights to edges, increasing weights for ERP edges
def add_weights(graph, weight_increase=0.00064):
    for u, v, key, data in graph.edges(keys=True, data=True):
        # Default weight based on distance (or any other criteria)
        distance = data.get('length', 1.0)  # Default to 1.0 if 'length' is not available
        weight = distance

        weight *= weight_increase
        # Add the weight to the edge data
        graph[u][v][key]['weight'] = round(weight, 2)

    print("Weights added to all edges.")

def add_peak_weights(graph, toll_nodes, weight_increase=0.00064 , peak_multiplier=1.8, toll_increase=2.20):
    for u, v, key, data in graph.edges(keys=True, data=True):
        # Default weight based on distance (or any other criteria)
        distance = data.get('length', 100.0)  # Default to 1.0 if 'length' is not available
        is_congested = data.get('congested', False)  # Default to False if 'congested' is not set

        # Calculate weight based on congestion
        if is_congested:
            weight = distance * weight_increase * peak_multiplier
        else:
            weight = distance * weight_increase

        if v in toll_nodes:
            weight += toll_increase

        # Assign the calculated weight to the edge data
        graph[u][v][key]['peakWeight'] = round(weight, 2)

    print("Peak weights added to all edges based on congestion status.")

# Load the GraphML file
graphml_file_path = 'network.graphml'  
G = ox.load_graphml(graphml_file_path)
print(f"Loaded graph from {graphml_file_path}")

json_file_path = "cleaned_traffic_data.json"
json_data = load_json_data(json_file_path)

# Extract all nodes where 'highway' is 'toll_gantry'
toll_gantry_nodes = [node for node, data in G.nodes(data=True) if data.get('highway') == 'toll_gantry']



#add congestion value
add_congestion(G, json_data)

#Add default weights to the graph edges
add_weights(G)

#add peak weights
add_peak_weights(G,toll_gantry_nodes)




# Save the modified graph to a new GraphML file (optional)


modified_graphml_file_path = 'weighted_network.graphml'
ox.save_graphml(G, filepath=modified_graphml_file_path)
print(f"Modified graph saved to {modified_graphml_file_path}")




# # Save the modified graph to a GeoJSON file (optional)
# modified_geojson_file_path = 'modified_network2.geojson'
# ox.save_graph_geopackage(G, filepath=modified_geojson_file_path)
# print(f"Modified graph saved to {modified_geojson_file_path}")

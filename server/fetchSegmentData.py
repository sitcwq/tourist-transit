from shapely.geometry import LineString
import osmnx as ox
import json
import requests

def get_midpoint(linestring):
    if linestring:
        # Convert the LINESTRING to a Shapely LineString object
        line = LineString(linestring.coords)
        midpoint = line.interpolate(0.5, normalized=True)
        return {'longitude': midpoint.x, 'latitude': midpoint.y}
    return None


def compile_midpoint(graph):
    midpoints_data = {}
    for u, v, data in graph.edges(data=True):
        if 'geometry' in data:
            midpoint = get_midpoint(data['geometry'])
            if midpoint:
                osmid = str(data.get('osmid', 'No OSM ID'))
                midpoints_data[osmid] = midpoint
        else:
            print(f"Edge {data.get('osmid', 'No OSM ID')} does not have LINESTRING data.")
    return midpoints_data


def fetch_traffic_data(midpoints_data, api_key):
    base_url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
    updated_data = {}
    count = 0
    for osmid, coords in midpoints_data.items():
        # Formulate the point string required by the API
        point = f"{coords['latitude']},{coords['longitude']}"
        params = {
            'key': api_key,
            'point': point,
            'zoom': 10  # Level of detail
        }
        response = requests.get(base_url, params=params)
        if response.status_code == 200:
            count += 1
            print("retrieving item {0}".format(count))
            traffic_data = response.json()
            flow_segment_data = traffic_data.get('flowSegmentData', {})
            essential_data = {
                'frc': flow_segment_data.get('frc'),
                'currentSpeed': flow_segment_data.get('currentSpeed'),
                'freeFlowSpeed': flow_segment_data.get('freeFlowSpeed'),
                'congested': flow_segment_data.get('currentSpeed', float('inf')) < flow_segment_data.get('freeFlowSpeed', 0)
            }
            updated_data[osmid] = {
                'coordinates': coords,
                'traffic_info': essential_data
            }
        else:
            updated_data[osmid] = {
                'coordinates': coords,
                'error': 'Failed to fetch traffic data'
            }

    return updated_data

def save_to_json(data, file_path):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)


# Load the graph
graphml_file_path = 'network.graphml'  
G = ox.load_graphml(graphml_file_path)
print(f"Loaded graph from {graphml_file_path}")


# Get midpoints
mid_points = compile_midpoint(G)

# Get road segment data
api_key = 'N0dsKnwqruuSlX6KAwfCoVKCtBUESYZC'
traffic_data = fetch_traffic_data(mid_points, api_key)



save_to_json(traffic_data, 'traffic_data.json')



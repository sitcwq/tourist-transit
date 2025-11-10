# Making use of OSMNX and NetworkX
from flask import Flask, request, jsonify
from flask_cors import CORS
import osmnx as ox
import networkx as nx
import time


# Set up CORS for flask and react
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])


# Load the preprocessed graph
G_road = ox.load_graphml("weighted_network.graphml")


# Ensure all edge weights are floats
for u, v, data in G_road.edges(data=True):
    if 'weight' in data:
        data['weight'] = float(data['weight'])
    if 'peakWeight' in data:
        data['peakWeight'] = float(data['peakWeight'])    


# Check if depature time is peak hour
def is_peak_hour(departure_time):
    peak_hours_morning_start = 7 * 60 + 30 
    peak_hours_morning_end = 9 * 60 + 30 
    peak_hours_evening_start = 17 * 60 
    peak_hours_evening_end = 20 * 60 

    hours, minutes = map(int, departure_time.split(':'))
    departure_minutes = hours * 60 + minutes

    return (peak_hours_morning_start <= departure_minutes <= peak_hours_morning_end or
            peak_hours_evening_start <= departure_minutes <= peak_hours_evening_end)


# Convert seconds to hours and minutes
def convert_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    return f"{hours} hours and {minutes} minutes"


# Custom greedy algorithm for TSP
def greedy_tsp(graph, start_node, nodes, weight, algo):
    unvisited = set(nodes)
    unvisited.remove(start_node)
    current_node = start_node
    tsp_path = [current_node]
     # Creates and finds the cloest next node using different path finding algos shortest path. appends it to the tsp sequence path
    while unvisited:
        next_node = min(unvisited, key=lambda node: nx.shortest_path_length(graph, current_node, node, weight=weight, method=algo))
        tsp_path.append(next_node)
        current_node = next_node
        unvisited.remove(next_node)

    tsp_path.append(start_node)
    return tsp_path


# Solving the travelling salesman problem with different algorithms based off user input
def solve_tsp(start, hotels, departureTime, efficiencyType, algorithm):
    # Find the closest node to Drop off point's coordinates
    start_node = ox.distance.nearest_nodes(G_road, start['coordinates'][1], start['coordinates'][0])
    hotel_nodes = [ox.distance.nearest_nodes(G_road, hotel['coordinates'][1], hotel['coordinates'][0]) for hotel in hotels]

    # Initialise destination nodes.
    nodes = [start_node] + hotel_nodes + [start_node]

    # Defining weights to be used based on user input
    cost = 'peakWeight' if is_peak_hour(departureTime) else 'weight'
    if efficiencyType == "Cost":
        weight_type = 'peakWeight' if is_peak_hour(departureTime) else 'weight'
    else:
        weight_type = "travel_time"

    # Create a complete graph for TSP
    # Employ Path-Finding algorithm to find paths
    if algorithm['mode'] == "Greedy TSP":
        method = ""
        match algorithm['pathfind']:
            case "Bellman-Ford":
                method = "bellman-ford"
            case "Dijkstra":
                method = "dijkstra"
        
        tsp_path = greedy_tsp(G_road, start_node, nodes, weight_type, method)
    else:
        # Creates a new Directed and complete graph 
        # Each node is a destination. The new graph extracts out shortest paths determined by path finding algorithm
        # Saving the shortest path between 2 nodes as the edge.
        tsp_graph = nx.DiGraph()
        for i, node1 in enumerate(nodes):
            for j, node2 in enumerate(nodes):
                if i != j:
                    try:
                        match algorithm['pathfind']:
                            case "Bellman-Ford":
                                path_length = nx.single_source_bellman_ford_path_length(G_road, node1, weight=weight_type)
                                length = path_length[node2]

                            case "Dijkstra":
                                length = nx.shortest_path_length(G_road, node1, node2, weight=weight_type)    
                        tsp_graph.add_edge(node1, node2, weight=length)
                    except nx.NetworkXNoPath:
                        print(f"No path between {node1} and {node2}")

        # Use the respective algorithm for TSP
        match algorithm['mode']:
            case "Simulated Annealing TSP":
                tsp_path = nx.approximation.traveling_salesman_problem(tsp_graph, seed=1, weight=weight_type, init_cycle="greedy", cycle=True, method=nx.approximation.simulated_annealing_tsp)

    # Create the full path by combining shortest paths between nodes
    # now it takes the destination path and sequence, breaks them down into the actual roads taken to be displayed 
    # on the front end
    # From here, we sum values we want to display such as number of erp_passed and total cost iteratively at each road feature
    # 
    full_path = []
    time_taken = 0
    total_cost = 0
    erp_passed = 0
    for i in range(len(tsp_path) - 1):
        u, v = tsp_path[i], tsp_path[i + 1]
        path = nx.shortest_path(G_road, u, v, weight=weight_type)
        full_path.extend(path[:-1])
        for j in range(len(path) - 1):
            edge_data = G_road.get_edge_data(path[j], path[j + 1])[0]
            total_cost += edge_data[cost]
            edge_time_taken = float(edge_data['travel_time'])

            if edge_data['congested'] == 'True' and is_peak_hour(departureTime): 
                edge_time_taken *= 1.5
            time_taken += edge_time_taken

        for node in path:
            if 'highway' in G_road.nodes[node] and G_road.nodes[node]['highway'] == 'toll_gantry' and is_peak_hour(departureTime):
                erp_passed += 1
         
    full_path.append(tsp_path[-1])

    # Identify the return path after visiting all hotels
    visited_hotels = set(hotel_nodes)
    forward_path = []
    return_path = []
    forward = True
    for node in full_path:
        if node in visited_hotels:
            visited_hotels.remove(node)
        elif not visited_hotels:
            forward = False
        if forward:
            forward_path.append(node)
        else:
            return_path.append(node)
    return_path.append(start_node)

    # Convert the travel time taken to hours and minutes
    time_taken_hr_min = convert_time(time_taken)
    return forward_path, return_path, total_cost, erp_passed, time_taken_hr_min


# Converting the graph to geojson
def route_to_geojson(route, graph):
    features = []
    for i in range(len(route) - 1):
        u = route[i]
        v = route[i + 1]
        if graph.has_edge(u, v):
            edge_data = graph.get_edge_data(u, v)[0]
            if 'geometry' in edge_data:
                coords = list(edge_data['geometry'].coords)
            else:
                coords = [(graph.nodes[u]['x'], graph.nodes[u]['y']),
                          (graph.nodes[v]['x'], graph.nodes[v]['y'])]
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords
                },
                "properties": {
                    "length": edge_data['length'],
                    "weight": edge_data['weight']
                }
            }
            features.append(feature)
    return {"type": "FeatureCollection", "features": features}


# POST route to compute algorithm
@app.route('/api/v1/route', methods=['POST'])
def get_route_api():
    # Get front end data
    data = request.get_json()
    start = data.get('start')
    hotels = data.get('selectedHotels')
    efficiencyType = data.get('efficiencyType')
    departureTime = data.get('departureTime')
    algorithmType = data.get('algorithm')

    if not start or not hotels:
        return jsonify({"error": "Please provide start point and selected hotels"}), 400
    
    # Calculate runtime of algorithm
    start_time = time.process_time()

    # Get results from our tsp solver
    forward_route, return_route, total_cost, erp_passed, time_taken_hr_min = solve_tsp(start, hotels, departureTime, efficiencyType, algorithmType)
    runtime = time.process_time() - start_time

    if not forward_route or not return_route:
        return jsonify({"error": "No route found"}), 500

    geojson_forward_route = route_to_geojson(forward_route, G_road)
    geojson_return_route = route_to_geojson(return_route, G_road)

    # Store road names
    forward_route_roads = []
    prev_road_name = None
    for i in range(len(forward_route) - 1):
        u = forward_route[i]
        v = forward_route[i + 1]
        edge_data = G_road.get_edge_data(u, v)
        if edge_data is not None:
            road_name = edge_data[0].get('name')
        if road_name:
            if road_name != prev_road_name:  # Only append if the road name changes
                forward_route_roads.append(road_name)
                prev_road_name = road_name

    return_route_roads = []
    prev_road_name = None
    for i in range(len(return_route) - 1):
        u = return_route[i]
        v = return_route[i + 1]
        edge_data = G_road.get_edge_data(u, v)
        if edge_data is not None:
            road_name = edge_data[0].get('name')
        if road_name:
            if road_name != prev_road_name:  # Only append if the road name changes
                return_route_roads.append(road_name)
                prev_road_name = road_name

    # Return to front end
    response = {
        "geojson_forward_route": geojson_forward_route,
        "geojson_return_route": geojson_return_route,
        "start": start,
        "hotels": hotels,
        "dashboardData": {"runtimeTaken": round(runtime, 5), "timeTaken": time_taken_hr_min, "totalCost": round(total_cost, 2), "ERPPassed": erp_passed, "forwardRouteRoads": forward_route_roads, "returnRouteRoads": return_route_roads},
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)

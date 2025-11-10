import osmnx as ox
import pyogrio
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, LineString
from shapely import STRtree
from pyproj import Geod
import csv
import traceback

geod = Geod(ellps="WGS84")  # for calculating new edge lengths. use the same coordinate reference system as the graph for accuracy

print('Downloading road graph')
place = "Singapore"
G = ox.graph_from_place(place, network_type="drive")

print('Adding edge speeds')
G = ox.routing.add_edge_speeds(G)

new_node = max(G.nodes())  # Find the maximum node ID in the graph. New node IDs will be incrementally generated from this

print('Generating Rtree')
edge_list = []  # List of edges (u, v, key)
geom_linestring_list = []  # List of edge geometries (linestring)

# Build the edge and edge geometry lists
for u, v, key, data in G.edges(data=True, keys=True):
    if 'geometry' in data:
        geom_linestring_list.append(data['geometry'])
    else:
        # If no explicit geometry, approximate with a LineString of node coordinates
        node_u = G.nodes[u]
        node_v = G.nodes[v]
        edge_geom = LineString([(node_u['x'], node_u['y']), (node_v['x'], node_v['y'])])
        geom_linestring_list.append(edge_geom)

    edge_list.append([u, v, key])

rtree = STRtree(geom_linestring_list)  # build rtree from edge geometries (line segments)

print('Inserting ERP gantry nodes into road graph')
with open('gantry_locations.csv', mode='r') as csv_file:
    gantry_locations = csv.DictReader(csv_file)

    for gantry in gantry_locations:
        print(gantry['gantry_name'] + ' ' + gantry['lat'] + ' ' + gantry['long'])
        new_node_coords = (float(gantry['long']), float(gantry['lat']))  # Coordinates for the new node

        new_node_point = Point(*new_node_coords)  # point representing the gantry location
        edge_idx = rtree.nearest(new_node_point)  # Query rtree to get index of nearest edge to gantry

        u, v, key = edge_list[edge_idx]  # lookup the edge info
        edge_data = G.get_edge_data(u, v, key)  # Get the original edge's data

        # Construct geometry of the new edges connecting to the ERP gantry node
        try:
            # Extract the LineString geometry of the nearest edge
            if 'geometry' in edge_data:
                line = list(edge_data['geometry'].coords)
                line_length = len(line)
                print('Length of linestring:', line_length)

                print('Finding nearest point of geometry to ERP gantry')
                min_distance = float('inf')
                nearest = None
                for vertex in line:
                    distance = new_node_point.distance(Point(vertex))
                    if distance < min_distance:
                        min_distance = distance
                        nearest = vertex

                nearest_point_index = line.index(nearest) # get the index of the nearest point in the edge's geometry

                # if nearest point is the first point in geometry, draw a direct line between
                # else split the geometry linestring accordingly
                if nearest_point_index == 0:
                    split_line1 = LineString(
                        [[G.nodes[u]['x'], G.nodes[u]['y']], [new_node_coords[0], new_node_coords[1]]])
                    print('direct line1 generated')
                else:
                    split_line1 = LineString(line[:nearest_point_index] + [(new_node_coords[0], new_node_coords[1])])
                
                # if nearest point is the last point in geometry, draw a direct line between
                # else split the geometry linestring accordingly
                if nearest_point_index == line_length - 1:
                    split_line2 = LineString(
                        [[new_node_coords[0], new_node_coords[1]], [G.nodes[v]['x'], G.nodes[v]['y']]])
                    print('direct line2 generated')
                else:
                    split_line2 = LineString(
                        [(new_node_coords[0], new_node_coords[1])] + line[nearest_point_index + 1:])
                  
                print('new line1 number of points: ' + str(len(split_line1.coords)))
                print('new line2 number of points: ' + str(len(split_line2.coords)))
            else:
                print('Nearest edge does not have geometry')
                split_line1 = LineString(
                    [(G.nodes[u]['x'], G.nodes[u]['y'])] + [(new_node_coords[0], new_node_coords[1])])
                split_line2 = LineString(
                    [(new_node_coords[0], new_node_coords[1])] + [(G.nodes[v]['x'], G.nodes[v]['y'])])
                
        except Exception:
            print('Error at' + gantry['gantry_name'] + ' ' + gantry['lat'] + '' + gantry['long'])
            traceback.print_exc()
            continue
        
        # Calculate the length of the new edges
        split_line1_len = geod.geometry_length(split_line1)
        split_line2_len = geod.geometry_length(split_line2)
        
        # if calculated edge length is invalid, skip adding gantry to graph and print edge geometry info
        if str(split_line1_len) == 'nan' or str(split_line2_len) == 'nan':
            print('Calculated edge length is invalid for ', gantry['gantry_name'])
            print('split line1 coords: ', split_line1.coords)
            print('split line2 coords: ', split_line2.coords)
            continue

        try:  
            new_node += 1  # Create a new unique node id
            # Add the ERP gantry as a new node to the graph
            G.add_node(new_node, osmid=new_node, name=gantry['gantry_name'], y=new_node_coords[1],
                      x=new_node_coords[0], highway='toll_gantry', ref=gantry['gantry_code'], zone=gantry['gantry_zone'])      
            
            G.remove_edge(u, v, key)  # Remove the original edge from graph

            # Add the new edges, copying over the original edge attributes and updating geometries and edge lengths
            G.add_edge(u, new_node, **{**edge_data, 'geometry': split_line1, 'length': split_line1_len})
            G.add_edge(new_node, v, **{**edge_data, 'geometry': split_line2, 'length': split_line2_len})
        except:
            print('Error inserting new edges for' + gantry['gantry_name'])
            traceback.print_exc()
            continue

print('Adding edge travel times')
G = ox.routing.add_edge_travel_times(G)

# rounding off lengths to 1 decimal place due to excessive precision
for idx, (u, v, data) in enumerate(G.edges(data=True)):
    if data['length'] is not None:
        data['length'] = round(data['length'], 1)

print('Processed ' + str(idx + 1) + ' edges when rounding off lengths')

# Plot the graph to check that the ERP gantry nodes are inserted correctly
print('Plotting graph')
fig, ax = ox.plot_graph(G, node_color='r', node_size=30, edge_linewidth=2, figsize=(192, 80))

print('Exporting geojson')
nodes, edges = ox.graph_to_gdfs(G, nodes=True, edges=True)  # convert graph to GeoDataFrame

erp_gantries = nodes.query('highway=="toll_gantry"')  # get erp gantry nodes
edges['geometry'] = edges['geometry'].apply(lambda x: LineString(x.coords))  # convert edge geometry to linestrings
merged_gdf = gpd.GeoDataFrame(pd.concat([erp_gantries, edges], ignore_index=True))  # Combine ERP gantry nodes with edges into one GeoDataFrame

# save to geojson for visualisation
# use a browser-based geojson viewer to verify that the graph has been modified correctly
pyogrio.write_dataframe(merged_gdf, "graph.geojson")

print('Saving graph to graphml file')
ox.save_graphml(G, 'network.graphml')  # save modified graph for further preprocessing

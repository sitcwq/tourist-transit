# @title collapse
import urllib.request
from datetime import datetime
from os import path
import json
from time import sleep
from pykml import parser
import re
import pandas as pd
import os

gantry_locations = []
skip_count = 0
prices_list = []
bus_charges_list = []
api_key = os.environ["datamall_key"]

# kml file obtained from https://onemotoring.lta.gov.sg/mapapp/kml/erp-kml/erp-kml-0.kml
with open('ERP.kml') as file:
    kml = parser.parse(file).getroot().Document

# csv file obtained by converting the table in Annex D of
# https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf
print('Mapping gantries to ERP zones')
zone_mapping = pd.read_csv('gantry_zone_mapping.csv')

# extract gantry info from the kml file and map it to its respective ERP zone
for p in kml.Placemark:
    gantry_name = re.search(r'<td>(.*)</td>', str(p.name)).group(1)
    gantry_code = re.findall(r'\((\d+)\)', str(gantry_name))[0]
    erp_coord = str(p.Point.coordinates).strip('\n\t').split(',')
    erp_lat = erp_coord[1]
    erp_long = erp_coord[0]
    gantry_zone = zone_mapping.query(f'`No.` == {gantry_code}')['Zone ID'].values[0]

    gantry_locations.append({
        'gantry_name': gantry_name,
        'gantry_code': gantry_code,
        'gantry_zone': gantry_zone,
        'lat': erp_lat,
        'long': erp_long
    })

df = pd.DataFrame(gantry_locations)  # save the gantry info to csv file
filename = 'gantry_locations.csv'
df.to_csv(filename, mode='a', index=False, header=not path.exists(filename))
print('Exported gantry information')

print('Getting ERP zone charges from LTA Datamall API')  # fetch ERP zone charges from LTA Datamall
while True:
    req = urllib.request.Request(f'http://datamall2.mytransport.sg/ltaodataservice/ERPRates?$skip={skip_count}',
                                 headers={'AccountKey': api_key})
    price_request = urllib.request.urlopen(req).read().decode('utf-8')
    price_data = json.loads(price_request)
    prices_list.extend(price_data['value'])

    print('Getting more ERP zone charges')
    if len(price_data['value']) < 500:  # API is limited to 500 records per call. keep calling until response has < 500 records
        break

    skip_count = skip_count + 500
    sleep(1.5)

# only extract the ERP charges for small and large buses
for charge in prices_list:
    if 'Buses' in charge['VehicleType']:
        if 'Small' in charge['VehicleType']:
            charge['VehicleType'] = 'Small Buses'
        else:
            charge['VehicleType'] = 'Large Buses'

        charge.pop('EffectiveDate', None)
        bus_charges_list.append(charge)

# save the ERP charges info to csv
df = pd.DataFrame(bus_charges_list)
filename = f'bus_erp_charges_{datetime.now().strftime("%d-%m-%Y_%H-%M-%S")}.csv'
df.to_csv(filename, mode='a', index=False, header=not path.exists(filename))
print('Successfully exported ERP charges information')

print('Done!')

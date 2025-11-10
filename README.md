# Tourist Transit: A Cost-Efficient Bus Routing Application

A web application that calculates optimal travel routes connecting Changi Airport to multiple hotels in Singapore, based on user-selected destinations and route preferences. This project was developed as part of a Data Structures and Algorithms group coursework.

## Features

- **Route Optimisation:** Calculates the fastest or most cost-efficient routes using multiple graph-based algorithms.
- **Cost Modelling:** Incorporates fuel costs and ERP (Electronic Road Pricing) charges into route calculations for more realistic cost evaluation.
- **Multi-Destination Selection:** Allows users to select multiple pre-listed hotels to include in the journey.
- **Route Filtering:** Filter results by travel time or total cost depending on user preference.

## Tech Stack

**Frontend:**
- React.js
- Tailwind CSS
- Node.js / Vite

**Backend:**
- Python (Flask)

## Installation & Setup

### Frontend (React)
```
# Ensure Node.js is installed and updated before running the commands
cd client
npm install (Only needs to be ran the first time)
npm run dev
```

### Backend (Flask)
```
cd server
pip install -r requirements.txt
flask --app tsp run
```

### Troubleshooting Tips

If you're facing issues when trying to install the requirements due to GDAL, see this video by [Open Geospatial Solutions](https://www.youtube.com/watch?v=2GNmhmoIiJs) for a workaround.

Once both client and server are initialised, visit http://localhost:5173 to test it out!

## Algorithms Implemented

- Dijkstra’s Algorithm
- Bellman-Ford Algorithm
- Greedy TSP
- Simulated Annealing

Each algorithm can be compared through metrics like total travel cost and execution time.

## Screenshots / Demo

![App Screenshot](./assets/preview.png)  
![App Screenshot](./assets/launch.png)  

## Authors

This project was developed by:

Daniel Lee Jia Xiong  
Saito Yugo  
Ng Zhen Wei Dennis  
Chia Wenqi  
Tan Yong Cheun, Denny  
Kong Boon Wei, Joel  

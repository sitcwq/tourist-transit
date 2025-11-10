// @ts-nocheck
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Modal from "./Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useState, useEffect } from "react";

export default function BusMap({
  mapData,
  setMapData,
  routeData,
  setRouteData,
  modal,
  setModal,
  algoDetails,
  setAlgoDetails,
}: any): JSX.Element {
  const [efficiencyType, setEfficiencyType] = useState(
    routeData.efficiencyType
  );
  const [departureTime, setDepartureTime] = useState(routeData.departureTime);
  const [dashboardData, setDashboardData] = useState(mapData.dashboardData);
  const [dashboardActive, setDashboardActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCluster, setActiveCluster] = useState<number | null>(null);

  // Convert to proper geojson format
  function convertGeoJSON(geojson: any) {
    return geojson.features.map((feature: any) => {
      const coordinates = feature.geometry.coordinates.map((coord: any) => [
        coord[1],
        coord[0],
      ]);
      return {
        name: feature.properties.name,
        coordinates: coordinates,
      };
    });
  }

  // Function to recalculate route
  async function recalculateRoute() {
    setLoading(true);
    try {
      const updatedRouteData = {
        ...routeData,
        efficiencyType: efficiencyType,
        departureTime: departureTime,
        algorithm: { pathfind: algoDetails.pathfind, mode: algoDetails.mode },
      };

      setRouteData({
        ...routeData,
        efficiencyType: efficiencyType,
        departureTime: departureTime,
        algorithm: { pathfind: algoDetails.pathfind, mode: algoDetails.mode },
      });
      const response = await fetch("http://127.0.0.1:5000/api/v1/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedRouteData),
      });

      const result = await response.json();
      setMapData(result);
      setDashboardData(result.dashboardData);
      setModal({
        active: true,
        type: "pass",
        message: `Showing "${efficiencyType}" efficiency type at "${departureTime} hours with ${algoDetails.mode} algorithm."`,
      });
      setDashboardActive(true);
    } catch (error) {
      setModal({
        active: true,
        type: "fail",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const forwardRoutes = convertGeoJSON(mapData.geojson_forward_route);
  const returnRoutes = convertGeoJSON(mapData.geojson_return_route);
  const start = mapData.start.coordinates;
  const hotels = mapData.hotels.map((hotel: any) => hotel.coordinates);

  const startIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const hotelIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const clusterIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  const handleMarkerClick = (cluster: number) => {
    setActiveCluster(cluster === activeCluster ? null : cluster);
  };

  // Turn off modal every time the state is changed
  useEffect(() => {
    const timeout = setTimeout(() => {
      setModal({ active: false, type: "fail", message: "" });
    }, 3000);
    return () => clearTimeout(timeout);
  }, [modal]);

  return (
    <>
      {dashboardActive && (
        <div className="fixed w-screen h-screen flex justify-center items-center z-50">
          <section className="lg:w-4/6 lg:h-3/5 w-11/12 h-3/6 flex items-center flex-col bg-white border-4 border-gray-300 shadow-2xl rounded-xl pt-4">
            <div className="text-2xl font-semibold tracking-wide w-11/12 p-4 border-b-4 border-purple-200 shadow-lg rounded-lg text-center">
              Dashboard
            </div>
            <div className="w-full flex flex-col mt-4 items-center justify-around h-3/5 font-medium text-lg text-center overflow-y-auto p-4">
              <p>
                Total Runtime of Algorithm: {dashboardData.runtimeTaken} seconds
              </p>
              <p>Total Travel Time Taken: {dashboardData.timeTaken}</p>
              <p>Total Cost: ${dashboardData.totalCost}</p>
              <p>ERPs Passed through: {dashboardData.ERPPassed}</p>
              <div className="flex flex-col justify-center items-center">
                <p className="text-xl font-semibold tracking-wide underline mt-4">
                  Directions
                </p>
                <p>
                  Forward Route Roads:{" "}
                  {dashboardData.forwardRouteRoads.join(" -> ")}
                </p>
                <p className="mt-2">
                  Return Route Roads:{" "}
                  {dashboardData.returnRouteRoads.join(" -> ")}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="w-1/2 mt-4 flex justify-center items-center h-12 bg-blue-300 rounded-xl tracking-widest text-lg font-semibold hover:bg-blue-400 disabled:hover:cursor-not-allowed"
              onClick={(e: any) => setDashboardActive(false)}
            >
              Go Back
            </button>
          </section>
        </div>
      )}
      {modal.active && (
        <div className="w-full absolute top-0 flex justify-center items-center z-50">
          <Modal modal={modal} />
        </div>
      )}
      <section
        className={`flex flex-col w-screen h-screen relative z-10 ${
          (dashboardActive || algoDetails.active) && "blur-sm"
        }`}
      >
        <div className="relative flex flex-row w-full justify-between items-center font-medium text-md h-44">
          <button
            className="w-1/5 md:1/3 h-12 rounded-lg bg-blue-400 hover:bg-blue-500 ml-2"
            onClick={() => setMapData(null)}
            type="button"
          >
            Go Back
          </button>
          <div className="flex flex-row md:w-4/6 w-2/3 justify-around items-center h-full">
            <div className="flex flex-col h-full justify-evenly mr-4">
              <label htmlFor="efficiencyType" className="mr-4">
                Algorithms:
              </label>
              <select
                id="algoDetails"
                value={algoDetails.pathfind}
                onChange={(e: any) =>
                  setAlgoDetails({ ...algoDetails, pathfind: e.target.value })
                }
                className="hover:cursor-pointer border-2 rounded-md border-black"
              >
                <option>Dijkstra</option>
                <option>Bellman-Ford</option>
              </select>
              <select
                id="algoDetails2"
                value={algoDetails.mode}
                onChange={(e: any) =>
                  setAlgoDetails({ ...algoDetails, mode: e.target.value })
                }
                className="hover:cursor-pointer border-2 rounded-md border-black"
              >
                <option>Greedy TSP</option>
                <option>Simulated Annealing TSP</option>
              </select>
              <button
                className="h-8 rounded-lg bg-blue-400 hover:bg-blue-500 disabled:cursor-not-allowed flex justify-center items-center"
                onClick={() => setAlgoDetails({ ...algoDetails, active: true })}
                type="button"
              >
                Details
              </button>
            </div>
            <div className="flex flex-col h-full justify-center mr-4">
              <label htmlFor="efficiencyType" className="mr-4">
                Efficiency Type:
              </label>
              <select
                id="efficiencyType"
                value={efficiencyType}
                onChange={(e: any) => setEfficiencyType(e.target.value)}
                className="hover:cursor-pointer border-2 rounded-md border-black"
              >
                <option>Time</option>
                <option>Cost</option>
              </select>
            </div>
            <div className="flex flex-col justify-center">
              <label htmlFor="departureTime" className="mr-4">
                Departure Time:
              </label>
              <div className="flex flex-row">
                <input
                  type="time"
                  id="departureTime"
                  value={departureTime}
                  onChange={(e: any) => setDepartureTime(e.target.value)}
                  className="hover:cursor-pointer border-2 pl-2 rounded-md border-black"
                />
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  data-tooltip-id="peakHourInfo"
                  className="ml-2 text-blue-500 hover:text-blue-700"
                />
                <ReactTooltip id="peakHourInfo" place="left">
                  Note that peak hour timings are from 7:30 AM to 9:30 AM and
                  5:00 PM to 8:00 PM, it will be more costly and take more time
                </ReactTooltip>
              </div>
            </div>
            <button
              className="w-1/5 h-12 rounded-lg bg-blue-400 hover:bg-blue-500 disabled:cursor-not-allowed flex justify-center items-center"
              onClick={() => recalculateRoute()}
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <div role="status">
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <p></p>
                </div>
              ) : (
                <p>Recalculate</p>
              )}
            </button>
            <button
              className="w-1/5 h-12 rounded-lg bg-blue-400 hover:bg-blue-500 disabled:cursor-not-allowed flex justify-center items-center"
              onClick={(e: any) => setDashboardActive(true)}
              type="button"
            >
              View Dashboard
            </button>
          </div>
        </div>
        <MapContainer
          center={[1.3644, 103.9915]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {forwardRoutes.map((route: any, index: number) => (
            <Polyline
              key={`forward-${index}`}
              positions={route.coordinates}
              color="red"
            />
          ))}
          {returnRoutes.map((route: any, index: number) => (
            <Polyline
              key={`return-${index}`}
              positions={route.coordinates}
              color="green"
            />
          ))}
          <Marker position={start} icon={startIcon}>
            <Popup>
              <span>Start: Changi Airport</span>
            </Popup>
          </Marker>
          {mapData.hotels.map((hotel: any, index: number) => (
            <Marker
              key={index}
              position={hotel.coordinates}
              icon={hotelIcon}
              eventHandlers={{
                click: () => handleMarkerClick(hotel.cluster),
              }}
            >
              <Popup>
                <span>{hotel.name} Dropoff Point</span>
              </Popup>
            </Marker>
          ))}
          {mapData.hotels
            .filter((hotel: any) => hotel.cluster === activeCluster)
            .flatMap((hotel: any, index: number) =>
              hotel.clusterVicinity.map((vicinity: any, i: number) => (
                <Marker
                  key={`cluster-${index}-${i}`}
                  position={vicinity.coordinates}
                  icon={clusterIcon}
                >
                  <Popup>
                    <span>{vicinity.name}</span>
                  </Popup>
                </Marker>
              ))
            )}
        </MapContainer>
      </section>
    </>
  );
}

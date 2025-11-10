import HotelForm from "./components/HotelForm";
import BusMap from "./components/BusMap";
import FAQ from "./components/FAQ";
import AlgoDetails from "./components/AlgoDetails";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

function App() {
  const [mapData, setMapData] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [FAQActive, setFAQActive] = useState<boolean>(false);
  const [algoDetails, setAlgoDetails] = useState<any>({
    active: false,
    pathfind: "Dijkstra",
    mode: "Greedy TSP",
  });
  const [modal, setModal] = useState<any>({
    active: false,
    type: "fail",
    message: "",
  });

  return (
    <main className="w-screen h-screen fixed z-10 flex justify-center items-center bg-gradient-to-t from-orange-300 to-orange-400">
      {algoDetails.active && (
        <AlgoDetails
          algoDetails={algoDetails}
          setAlgoDetails={setAlgoDetails}
        />
      )}
      {FAQActive && <FAQ />}
      {!mapData && (
        <button
          type="button"
          onClick={() => {
            setFAQActive(!FAQActive);
          }}
          className="fixed z-40 top-5 right-5 pt-4 pb-4 pl-6 pr-6 tracking-wider font-bold rounded-md transition ease-in-out bg-blue-500 hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500 duration-300"
        >
          <p>FAQ</p>
          {FAQActive && (
            <FontAwesomeIcon
              icon={faCircleXmark}
              className="absolute top-0 right-0 scale-150"
            />
          )}
        </button>
      )}
      {mapData ? (
        <BusMap
          mapData={mapData}
          setMapData={setMapData}
          routeData={routeData}
          setRouteData={setRouteData}
          modal={modal}
          setModal={setModal}
          algoDetails={algoDetails}
          setAlgoDetails={setAlgoDetails}
        />
      ) : (
        <HotelForm
          setMapData={setMapData}
          setRouteData={setRouteData}
          modal={modal}
          setModal={setModal}
          FAQActive={FAQActive}
          algoDetails={algoDetails}
          setAlgoDetails={setAlgoDetails}
        />
      )}
    </main>
  );
}

export default App;

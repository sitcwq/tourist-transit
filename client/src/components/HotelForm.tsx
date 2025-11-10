import { useState, useEffect } from "react";
import { numberOfHotelsOptions, hotels } from "../utils/data";
import Modal from "./Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { Tooltip as ReactTooltip } from "react-tooltip";
//@ts-ignore
import Map from "./BusMap";

export default function HotelForm({
  setMapData,
  setRouteData,
  modal,
  setModal,
  FAQActive,
  algoDetails,
  setAlgoDetails,
}: any): JSX.Element {
  const [numberOfHotels, setNumberOfHotels] = useState<number>(2);
  const [selectedHotels, setSelectedHotels] = useState<any>([]);
  const [efficiencyType, setEfficiencyType] = useState<string>("Time");
  const [departureTime, setDepartureTime] = useState<string>("08:00");
  const [loading, setLoading] = useState<boolean>(false);

  // Handle checkbox limitation to number of hotels
  function handleCheckboxChange(hotel: any) {
    if (selectedHotels.includes(hotel)) {
      setSelectedHotels(selectedHotels.filter((h: any) => h !== hotel));
    } else {
      if (selectedHotels.length < numberOfHotels) {
        setSelectedHotels([...selectedHotels, hotel]);
      }
    }
  }

  // Handle the changing of number of hotels and resetting selected hotels on change
  function handleNumberOfHotelsChange(e: any) {
    setNumberOfHotels(parseInt(e.target.value));
    setSelectedHotels([]);
  }

  // Handle submission of info to flask REST API
  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    if (selectedHotels.length === 0) {
      setModal({
        active: true,
        type: "fail",
        message: "Please select your hotels",
      });
      setLoading(false);
      return;
    } else if (selectedHotels.length === 1) {
      setModal({
        active: true,
        type: "fail",
        message: "Please select more than 1 hotel",
      });
      setLoading(false);
      return;
    }

    const data = {
      efficiencyType: efficiencyType,
      departureTime: departureTime,
      algorithm: { pathfind: algoDetails.pathfind, mode: algoDetails.mode },
      start: hotels.start,
      selectedHotels: selectedHotels.map((hotel: any) => ({
        name: hotel.name,
        coordinates: hotel.coordinates,
        cluster: hotel.cluster,
        clusterVicinity: hotel.clusterVicinity,
      })),
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setRouteData(data);
      setMapData(result);
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

  // Turn off modal
  useEffect(() => {
    const timeout = setTimeout(() => {
      setModal({ active: false, type: "fail", message: "" });
    }, 3000);
    return () => clearTimeout(timeout);
  }, [modal]);

  return (
    <section
      className={`relative lg:w-4/6 lg:h-5/6 w-11/12 h-[90%] flex items-center flex-col bg-white border-4 border-gray-300 shadow-2xl rounded-xl pt-4 ${
        (FAQActive || algoDetails.active) && "blur-sm"
      }`}
    >
      <span className="flex absolute h-5 w-5 top-0 right-0 -mt-2 -mr-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-85"></span>
        <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-400"></span>
      </span>
      {modal.active && <Modal modal={modal} />}
      <div className="text-2xl font-semibold tracking-wide w-11/12 p-4 border-b-4 border-purple-200 shadow-lg rounded-lg text-center">
        TouristTransit
      </div>
      <form
        className="w-11/12 flex items-center flex-col h-full p-4"
        onSubmit={(e: any) => handleSubmit(e)}
      >
        <div className="lg:w-1/2 w-full flex flex-col justify-evenly items-center font-medium text-md sm:text-lg">
          <div className="flex flex-row w-full items-center justify-center">
            <label htmlFor="numberHotels" className="mr-4">
              Number of Hotels:
            </label>
            <select
              id="numberHotels"
              onChange={(e: any) => handleNumberOfHotelsChange(e)}
              className="hover:cursor-pointer border-2 pl-1 rounded-md w-12 border-black"
            >
              {numberOfHotelsOptions.map((option: number) => {
                return <option>{option}</option>;
              })}
            </select>
          </div>
          <div className="flex flex-row mt-4 w-full items-center justify-center">
            <label htmlFor="efficiencyType" className="mr-4">
              Efficiency Type:
            </label>
            <select
              id="efficiencyType"
              onChange={(e: any) => setEfficiencyType(e.target.value)}
              className="hover:cursor-pointer border-2 pl-1 rounded-md border-black"
            >
              <option>Time</option>
              <option>Cost</option>
            </select>
          </div>
          <div className="flex flex-row justify-center sm:items-stretch items-center mt-4">
            <label htmlFor="departureTime" className="mr-4">
              Departure Time:
            </label>
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
            <ReactTooltip id="peakHourInfo" place="top">
              Note that peak hour timings are from 7:30 AM to 9:30 AM and 5:00
              PM to 8:00 PM, it will be more costly and take more time
            </ReactTooltip>
          </div>
          <div className="flex flex-row w-full items-center justify-center mt-4">
            <label htmlFor="efficiencyType" className="mr-4">
              Algorithms:
            </label>
            <div className="flex flex-col">
              <select
                id="algoDetails"
                value={algoDetails.pathfind}
                onChange={(e: any) =>
                  setAlgoDetails({ ...algoDetails, pathfind: e.target.value })
                }
                className="hover:cursor-pointer border-2 rounded-md border-black mb-2"
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
            </div>
            <button
              className="h-8 ml-4 pl-4 pr-4 rounded-lg bg-blue-400 hover:bg-blue-500 disabled:cursor-not-allowed flex justify-center items-center"
              onClick={() => setAlgoDetails({ ...algoDetails, active: true })}
              type="button"
            >
              Details
            </button>
          </div>
        </div>
        <div className="w-full h-full flex flex-col sm:text-lg text-sm items-center justify-evenly">
          <div className="w-full h-64 overflow-y-auto">
            {hotels.end.map((hotel) => (
              <div
                key={hotel.name}
                className="w-full flex justify-center items-center tracking-wide font-medium p-2"
              >
                <input
                  className="mr-2 scale-125 hover:cursor-pointer"
                  type="checkbox"
                  id={hotel.name}
                  name={hotel.name}
                  checked={selectedHotels.includes(hotel)}
                  onChange={() => handleCheckboxChange(hotel)}
                  disabled={
                    !selectedHotels.includes(hotel) &&
                    selectedHotels.length >= numberOfHotels
                  }
                />
                <label className="hover:cursor-pointer" htmlFor={hotel.name}>
                  {hotel.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full mt-4 flex justify-center items-center h-12 bg-blue-300 rounded-xl tracking-widest text-lg font-semibold hover:bg-blue-400 disabled:hover:cursor-not-allowed"
          onClick={(e: any) => handleSubmit(e)}
          disabled={loading}
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
            <p>Calculate Route</p>
          )}
        </button>
      </form>
    </section>
  );
}

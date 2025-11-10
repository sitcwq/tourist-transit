import { algorithmDetails } from "../utils/algodetail";

export default function AlgoDetails({
  algoDetails,
  setAlgoDetails,
}: any): JSX.Element {
  // Filter to find the selected algorithm
  const selectedAlgorithm: any = algorithmDetails.find(
    (algo) => algo.name === algoDetails.mode
  );

  return (
    <div className="absolute w-full h-full flex justify-center items-center z-50">
      <section className="lg:w-5/6 lg:h-4/5 w-11/12 h-4/5 flex items-center flex-col bg-white border-4 border-gray-300 shadow-2xl rounded-xl pt-4">
        <div className="text-2xl font-semibold tracking-wide w-11/12 p-4 border-b-4 border-purple-200 shadow-lg rounded-lg text-center">
          About {algoDetails.mode}
        </div>
        <article className="flex flex-col justify-between items-center w-full p-4 h-2/4">
          <p>
            <strong>Type:</strong> {selectedAlgorithm.type}
          </p>
          <p>
            <strong>Time Complexity:</strong> {selectedAlgorithm.timeComplexity}
          </p>
          <p>
            <strong>Approach:</strong> {selectedAlgorithm.approach}
          </p>
          <p>
            <strong>Limitations:</strong> {selectedAlgorithm.limitation}
          </p>
        </article>
        <button
          className="w-1/5 md:1/3 h-12 rounded-lg bg-blue-400 hover:bg-blue-500 ml-2"
          type="button"
          onClick={() => setAlgoDetails({ ...algoDetails, active: false })}
        >
          Go Back
        </button>
      </section>
    </div>
  );
}

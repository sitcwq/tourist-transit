export default function FAQ(): JSX.Element {
  return (
    <div className="absolute w-full h-full flex justify-center items-center z-10">
      <section className="lg:w-5/6 lg:h-4/5 w-11/12 h-4/5 flex items-center flex-col bg-white border-4 border-gray-300 shadow-2xl rounded-xl pt-4">
        <div className="text-2xl font-semibold tracking-wide w-11/12 p-4 border-b-4 border-purple-200 shadow-lg rounded-lg text-center">
          Frequently Asked Questions
        </div>
        <article className="flex flex-col justify-between items-center w-full p-4 overflow-y-auto">
          <div className="flex flex-col justify-between items-center p-4">
            <p className="font-bold text-lg tracking-wide text-center">
              What is this?
            </p>
            <p className="text-center tracking-wide">
              Our travelling bus service provides the smoothest route to
              selected hotels as well as its nearby hotels and the user can
              choose whether he/she wants to prioritise in saving cost or
              finding the fastest route.
            </p>
          </div>
          <div className="flex flex-col justify-between items-center p-4">
            <p className="font-bold text-lg tracking-wide text-center">
              How do i use this?
            </p>
            <p className="text-center tracking-wide">
              Simply select the number of hotels you would like to visit,
              efficiency type, algorithms to apply and departure time before
              selecting the specific hotels you would like to visit. A route
              will be displayed to you which not only covers these hotels but
              the cluster of hotels nearby it before returning back to the
              pickup point. You can click on the red markers to reveal the
              nearby hotels around that cluster for tourists to visit as well.
            </p>
          </div>
          <div className="flex flex-col justify-between items-center p-4">
            <p className="font-bold text-lg tracking-wide text-center">
              What assumptions/dummy simulation do we use?
            </p>
            <p className="text-center tracking-wide">
              We are targeting hotel clusters in the city area of Singapore and
              assumed some roads will be congested during peak hours which is
              covered in our pre-processed data.
            </p>
          </div>
          <div className="flex flex-col justify-between items-center p-4">
            <p className="font-bold text-lg tracking-wide text-center">
              How do we calculate cost?
            </p>
            <p className="text-center tracking-wide">
              We created pre-processed weights which represents our cost value
              along the road edges in our graph and the costs takes into account
              peak hour congestion, gas fees and erp gateway fees. When
              prioritising for time, all such costs will be ignored and the
              algorithm would find the shortest smoothest route instead with the
              travel time of that route as the weight.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

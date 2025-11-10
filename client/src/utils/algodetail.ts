export const algorithmDetails = [
  {
    name: "Christofides TSP",
    type: "Approximation Algorithm",
    timeComplexity: "O(n^3) where n is the number of vertices",
    approach:
      "Starts off with constructing a minimum spanning tree of the undirected road network graph, finding a minimum weight perfect matching for odd degree vertices in the tree, followed by combining the edges to form a Eulerian multigraph and finally forming a Hamitonian circuit through shortcutting and acquiring the TSP solution.",
    benefits:
      "Guarantees 1.5 times of optimal. Makes it a robust choice for approximation as finding the exact TSP solution can be expensive. Our team relied on the built in NetworkX functionality to perform the Christofides algorithm for convenience. ",
    limitation:
      "Only applicable to undirected graphs. Approximation ration may not be satisfactory for all applications. Performance can be impacted by the initial MST and matching steps.",
  },
  {
    name: "Simulated Annealing TSP",
    type: "Probabilistic optimisation algorithm",
    timeComplexity:
      "O(Ni * No * |V|) where Ni is number of iterations the inner loop and No is the number of iterations in the outer loop.",
    approach:
      "The algorithms first start with an initial solution and set temperature (default=100). It then generates a new solution using the “1-1” exchange, which transposes the position of two elements of the current solution. At every iteration, the algorithm selects thoughtfully a neighbour solution. If the cost of the neighbour solution is lower than the current, it will then become the current cost in the next iteration. The algorithm stops when the best cost solution does not improve after 10 cycles.",
    limitation:
      "Performance depends on the temperature and parameters. It can be slow for very large instances when finding near-optimal solutions. As default temperature was used, it is possible that the algorithm will be stuck with a smaller local optimum due to inappropriate temperature or insufficient cooling, leading to poor quality solutions.",
  },
  {
    name: "Greedy TSP",
    type: "Optimisation algorithm",
    timeComplexity: "O(|V|^2), whre N is the number of hotels selected. ",
    approach:
      "The algorithm adds a node to the solution at every iteration. It selects a node not already in the cycle whose connection to the previous node adds the least cost to the cycle. ",
    limitation:
      "Greedy algorithms inhertly lack backtracking, thus it may not always provide the most optimal solution",
  },
];

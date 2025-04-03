/**
 * AirportRoutes.js
 * Defines realistic aircraft routes for landing and takeoff at Boston Logan Airport
 */

// Logan Airport coordinates
export const loganAirport = [-71.0096, 42.3656];

// Delay at airport in milliseconds (3 minutes)
export const airportStayDuration = 180000;

// Flight paths for different scenarios
export const flightRoutes = {
  // Approach from the west, land at Logan, stay, then depart to the south
  westArrival: {
    // Approach from the west
    arrival: [
      [-71.2002, 42.3843], // Starting point (west of Boston)
      [-71.1702, 42.3743], // Approaching Boston
      [-71.1402, 42.3743], // Continuing approach
      [-71.1102, 42.3743], // Getting closer to Logan
      [-71.0802, 42.3743], // Final approach
      [-71.0502, 42.3700], // Almost at Logan
      loganAirport           // Landing at Logan
    ],
    // Depart to the south
    departure: [
      loganAirport,           // Starting at Logan
      [-71.0196, 42.3456], // Initial climb
      [-71.0296, 42.3256], // Continuing climb
      [-71.0396, 42.3056], // Heading south
      [-71.0496, 42.2856], // Further south
      [-71.0596, 42.2656]  // Exit point to the south
    ]
  },
  
  // Approach from the north, land at Logan, stay, then depart to the east
  northArrival: {
    // Approach from the north
    arrival: [
      [-71.0396, 42.4256], // Starting point (north of Boston)
      [-71.0346, 42.4056], // Approaching Boston from north
      [-71.0296, 42.3956], // Continuing approach
      [-71.0246, 42.3856], // Getting closer to Logan
      [-71.0196, 42.3756], // Final approach
      loganAirport           // Landing at Logan
    ],
    // Depart to the east (over water)
    departure: [
      loganAirport,           // Starting at Logan
      [-70.9896, 42.3656], // Initial climb over water
      [-70.9696, 42.3656], // Continuing over water
      [-70.9496, 42.3656], // Further east
      [-70.9296, 42.3656], // Over Atlantic
      [-70.9096, 42.3656]  // Exit point to the east
    ]
  },
  
  // Approach from the south, land at Logan, stay, then depart to the west
  southArrival: {
    // Approach from the south
    arrival: [
      [-71.0396, 42.3056], // Starting point (south of Boston)
      [-71.0346, 42.3156], // Approaching Boston from south
      [-71.0296, 42.3256], // Continuing approach
      [-71.0246, 42.3356], // Getting closer to Logan
      [-71.0196, 42.3456], // Final approach
      [-71.0146, 42.3556], // Almost at Logan
      loganAirport           // Landing at Logan
    ],
    // Depart to the west
    departure: [
      loganAirport,           // Starting at Logan
      [-71.0296, 42.3700], // Initial climb
      [-71.0496, 42.3743], // Continuing climb
      [-71.0696, 42.3756], // Heading west
      [-71.0896, 42.3776], // Further west
      [-71.1096, 42.3796], // Even further west
      [-71.1296, 42.3816]  // Exit point to the west
    ]
  },
  
  // Approach from the east (over water), land at Logan, stay, then depart to the north
  eastArrival: {
    // Approach from the east (over water)
    arrival: [
      [-70.9296, 42.3656], // Starting point (east of Boston, over water)
      [-70.9496, 42.3656], // Approaching Boston from east
      [-70.9696, 42.3656], // Continuing approach
      [-70.9896, 42.3656], // Getting closer to Logan
      loganAirport           // Landing at Logan
    ],
    // Depart to the north
    departure: [
      loganAirport,           // Starting at Logan
      [-71.0096, 42.3756], // Initial climb
      [-71.0096, 42.3856], // Continuing climb
      [-71.0096, 42.3956], // Heading north
      [-71.0096, 42.4056], // Further north
      [-71.0096, 42.4156]  // Exit point to the north
    ]
  },
  
  // Special route for demonstrating the landing and takeoff more dramatically
  demonstrationRoute: {
    // Clear approach from the southwest for good visibility
    arrival: [
      [-71.1500, 42.3200], // Starting point (southwest of Boston)
      [-71.1300, 42.3300], // Approaching Boston
      [-71.1100, 42.3400], // Continuing approach
      [-71.0900, 42.3500], // Getting closer to Logan
      [-71.0700, 42.3580], // Final approach
      [-71.0500, 42.3630], // Almost at Logan
      [-71.0300, 42.3650], // Very close to Logan
      loganAirport           // Landing at Logan
    ],
    // Clear departure to the northeast over water
    departure: [
      loganAirport,           // Starting at Logan
      [-70.9900, 42.3700], // Initial climb
      [-70.9700, 42.3750], // Continuing climb
      [-70.9500, 42.3800], // Heading northeast
      [-70.9300, 42.3850], // Further northeast
      [-70.9100, 42.3900], // Even further northeast
      [-70.8900, 42.3950]  // Exit point to the northeast
    ]
  }
};

// Utility function to calculate the complete route including waiting at airport
export function getCompleteRoute(routeName, waitAtAirport = true) {
  if (!flightRoutes[routeName]) {
    console.error(`Route '${routeName}' not found`);
    return [];
  }
  
  const { arrival, departure } = flightRoutes[routeName];
  
  // If no waiting, just connect arrival and departure
  if (!waitAtAirport) {
    return [...arrival, ...departure.slice(1)]; // Skip first point of departure to avoid duplicate
  }
  
  // With waiting, add multiple copies of the airport point
  // This will make the aircraft appear to stop at the airport
  const waitingPoints = Array(10).fill(loganAirport);
  
  return [...arrival, ...waitingPoints, ...departure.slice(1)];
}


// Usage example:
// const completeRoute = getCompleteRoute('westArrival');
<script>
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { getCompleteRoute, loganAirport } from './AirportRoutes.js';

  export let map; // Reference to the Mapbox map
  export let active = true; // Default to active
  export let routeName = 'demonstrationRoute'; // Default route
  
  // Airport coordinates (starting point)
  export let startPoint = loganAirport;
  
  // Get the complete flight path
  let flightPath = getCompleteRoute(routeName);
  
  let aircraftElement;
  let currentPathIndex = 0;
  let isAtAirport = false;
  
  // Dynamic duration - slower when near airport, faster for en-route
  $: segmentDuration = isNearAirport(currentPathIndex) ? 5000 : 2000;
  
  // Create tweened values for smooth animation
  const aircraftPosition = tweened(flightPath[0], {
    duration: segmentDuration,
    easing: cubicOut
  });
  
  function isNearAirport(index) {
    // Check if we're at or very near the airport
    if (index >= flightPath.length) return false;
    
    const point = flightPath[index];
    const distance = Math.sqrt(
      Math.pow(point[0] - loganAirport[0], 2) + 
      Math.pow(point[1] - loganAirport[1], 2)
    );
    
    // If very close to airport, consider it "at airport"
    isAtAirport = distance < 0.001;
    
    // Return true if we're approaching or at the airport
    return distance < 0.01;
  }
  
  function calculateBearing(start, end) {
    // Convert to radians
    const startLat = start[1] * Math.PI / 180;
    const startLng = start[0] * Math.PI / 180;
    const endLat = end[1] * Math.PI / 180;
    const endLng = end[0] * Math.PI / 180;
    
    // Calculate bearing
    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
              Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    
    // Normalize to 0-360
    bearing = (bearing + 360) % 360;
    
    return bearing;
  }
  
  function animateToNextPoint() {
    if (!map) return;
    
    // Exit if we've finished the route
    if (currentPathIndex >= flightPath.length - 1) {
      console.log("Flight completed");
      
      // Optionally restart after a delay
      setTimeout(() => {
        currentPathIndex = 0;
        animateToNextPoint();
      }, 5000);
      return;
    }
    
    const nextIndex = currentPathIndex + 1;
    const nextPoint = flightPath[nextIndex];
    const currentPoint = flightPath[currentPathIndex];
    
    // Calculate bearing for aircraft rotation
    const bearing = calculateBearing(currentPoint, nextPoint);
    
    // Update aircraft rotation - different appearance when on ground vs. in air
    if (aircraftElement) {
      // Slower rotation when at airport
      aircraftElement.style.transition = `transform ${isAtAirport ? 1.5 : 0.3}s ease-out`;
      
      // Rotate the aircraft in the direction of movement
      aircraftElement.style.transform = `rotate(${bearing}deg)`;
      
      // Change appearance when at airport
      if (isAtAirport) {
        aircraftElement.classList.add('on-ground');
      } else {
        aircraftElement.classList.remove('on-ground');
      }
    }
    
    // Animate to next point with appropriate duration
    aircraftPosition.set(nextPoint, { duration: isNearAirport(nextIndex) ? 5000 : 2000 }).then(() => {
      currentPathIndex = nextIndex;
      
      // Determine if aircraft is at the airport
      if (isNearAirport(currentPathIndex)) {
        console.log("Aircraft is at/near airport");
        // Add delay when at airport
        setTimeout(animateToNextPoint, isAtAirport ? 3000 : 100);
      } else {
        setTimeout(animateToNextPoint, 100); // Normal transition between segments
      }
    });
  }
  
  onMount(() => {
    console.log("Aircraft component mounted");
    
    // Create aircraft element when map is available
    if (map) {
      createAircraftElement();
      // Start animation
      setTimeout(animateToNextPoint, 1000);
    }
  });
  
  function createAircraftElement() {
    if (!map || !map.getCanvasContainer) return;
    
    // Create a DOM element for the aircraft
    const el = document.createElement('div');
    el.className = 'aircraft-marker';
    
    // Use emoji for plane
    el.innerHTML = '✈️';
    el.style.fontSize = '38px'; // Slightly smaller
    el.style.position = 'absolute';
    el.style.zIndex = '9999';
    el.style.transition = 'transform 0.3s ease-out';
    
    // Add to map
    map.getCanvasContainer().appendChild(el);
    aircraftElement = el;
    
    console.log("Aircraft element created");
  }
  
  // Update aircraft position on the map
  $: if (map && aircraftElement && $aircraftPosition) {
    const point = map.project($aircraftPosition);
    aircraftElement.style.left = `${point.x - 15}px`; // Center horizontally
    aircraftElement.style.top = `${point.y - 15}px`;  // Center vertically
  }
</script>
  
<style>
  :global(.aircraft-marker) {
    z-index: 999;
    pointer-events: none;
    filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
  }
  
  :global(.aircraft-marker.on-ground) {
    /* Visual indicator that plane is on the ground */
    opacity: 0.8;
    filter: brightness(0.9) drop-shadow(0 0 1px rgba(0,0,0,0.3));
  }
</style>
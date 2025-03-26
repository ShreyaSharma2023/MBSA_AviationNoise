<script>
    import { onMount } from 'svelte';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
  
    export let map; // Reference to the Mapbox map
    export let active = false; // Control when animation starts
    
    // Airport coordinates (starting point)
    export let startPoint = [-71.0096, 42.3656]; // Example: Logan Airport coordinates
    
    // Flight path - array of coordinates [longitude, latitude]
    export let flightPath = [
      [-71.0202, 42.3643], // Starting point (same as startPoint)
      [-71.0502, 42.3843], // Waypoint 1
      [-71.0802, 42.4043], // Waypoint 2
      [-71.1102, 42.3943], // Waypoint 3
      [-71.1402, 42.3743], // Waypoint 4
      [-71.1702, 42.3543], // Waypoint 5
      [-71.2002, 42.3443], // Waypoint 6
      [-71.0202, 42.3643]  // Back to starting point
    ];
    
    let aircraftElement;
    let currentPathIndex = 0;
    const duration = 2000; // Duration for each segment in ms
    
    // Create tweened values for smooth animation
    const aircraftPosition = tweened(flightPath[0], {
      duration,
      easing: cubicOut
    });
    
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
      if (!active || !map) return;
      
      const nextIndex = (currentPathIndex + 1) % flightPath.length;
      const nextPoint = flightPath[nextIndex];
      const currentPoint = flightPath[currentPathIndex];
      
      // Calculate bearing for aircraft rotation
      const bearing = calculateBearing(currentPoint, nextPoint);
      
      // Update aircraft rotation
      if (aircraftElement) {
        aircraftElement.style.transform = `rotate(${bearing}deg)`;
      }
      
      // Animate to next point
      aircraftPosition.set(nextPoint).then(() => {
        currentPathIndex = nextIndex;
        setTimeout(animateToNextPoint, 100); // Small pause between segments
      });
    }
    
    onMount(() => {
      console.log("Aircraft component mounted");
      console.log("Map available:", !!map);
      
      // Create aircraft element when map is available
      if (map) {
        createAircraftElement();
      }
    });
    
    function createAircraftElement() {
      if (!map || !map.getCanvasContainer) return;
      
      // Create a DOM element for the aircraft
      const el = document.createElement('div');
      el.className = 'aircraft-marker';
      
      // Fix the path - use forward slashes and correct path format
      el.style.backgroundImage = 'url(/static/images/Aircraft_PPT.svg)';
      
      // Make it bigger and more visible
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.position = 'absolute';
      el.style.transition = 'transform 0.3s ease-out';
      
      // Add to map
      map.getCanvasContainer().appendChild(el);
      aircraftElement = el;
      
      console.log("Aircraft element created");
      
      // Start the animation if active
      if (active) {
        setTimeout(animateToNextPoint, 1000);
      }
    }
    
    // Update aircraft position on the map
    $: if (map && aircraftElement && $aircraftPosition) {
      const point = map.project($aircraftPosition);
      aircraftElement.style.left = `${point.x - 20}px`; // Center horizontally
      aircraftElement.style.top = `${point.y - 20}px`;  // Center vertically
    }
    
    // Watch for changes to the active state
    $: if (active && map && aircraftElement && currentPathIndex === 0) {
      animateToNextPoint();
    }
  </script>
  
  <style>
    /* Additional styles for the aircraft if needed */
    :global(.aircraft-marker) {
      z-index: 999; /* Ensure aircraft is above other map elements */
      pointer-events: none; /* Allow clicks to pass through */
    }
</style>
<script>
    import { onMount } from "svelte";
    import mapboxgl from "mapbox-gl";

    export let map;
    import * as d3 from "d3";

    const colorMapping = {
        'Pink': '#7e1060',    
        'Orange': '#f9773f',  //neon green
        'Yellow': '#fcc478',  
        'Red': '#b1004d',     
    };

    let isLoading = false;
    let loadedTowns = 0;
    let totalTowns = 0;
    let directoryMap = null;
    let currentBatchIndex = 0;
    const BATCH_SIZE = 3; 
    const DELAY_BETWEEN_TOWNS = 10; 
    const DELAY_BETWEEN_BATCHES = 20; 

    async function loadSimplifiedNoiseMap() {
        try {
            console.log('Loading simplified noise map');
            
            // This could be a placeholder until detailed data is loaded
            map.addSource('simplified-noise', {
                type: 'geojson',
                data: {
                    "type": "FeatureCollection",
                    "features": []
                }
            });
            
            map.addLayer({
                id: 'simplified-noise-layer',
                type: 'fill',
                source: 'simplified-noise',
                paint: {
                    'fill-color': [
                        'match',
                        ['get', 'noiseColor'],
                        'Pink', colorMapping.Pink,
                        'Orange', colorMapping.Orange,
                        'Yellow', colorMapping.Yellow,
                        'Red', colorMapping.Red,
                        'transparent' // Default color
                    ],
                    'fill-opacity': 0.7,
                    'fill-outline-color': '#000000'
                }
            });
            
            // Set cursor to pointer when hovering over parcels
            map.on('mouseenter', 'simplified-noise-layer', () => {
                map.getCanvas().style.cursor = 'pointer';
                const coordinates = e.lngLat;
                const noiseLevel = e.features[0].properties.noiseColor;

                // Show tooltip
                d3.select("#tooltip")
                    .style("left", `${e.originalEvent.clientX + 10}px`)
                    .style("top", `${e.originalEvent.clientY + 10}px`)
                    .style("opacity", 1)
                    .html(`<strong>Noise Level:</strong> ${noiseLevel}`);
            });

            map.on('mouseleave', 'simplified-noise-layer', () => {
                map.getCanvas().style.cursor = '';
                d3.select("#tooltip").style("opacity", 0);
            });
            
            console.log('Simplified noise map initialized');
        } catch (error) {
            console.error('Error loading simplified noise map:', error);
        }
    }

    async function loadTownData(townId, files, layerId) {
        const features = [];
        
        for (const fileName of files) {
            if (fileName.startsWith('No_Data')) continue;
            
            try {
                const response = await fetch(`/data/parcels/noise_by_town/${townId}/${fileName}`);
                if (!response.ok) continue;
                
                const data = await response.json();
                const colorName = fileName.replace('.geojson', '');
                
                data.features.forEach(feature => {
                    feature.properties.noiseColor = colorName;
                });
                features.push(...data.features);
                
            } catch (error) {
                console.warn(`Error loading ${fileName} for town ${townId}:`, error);
            }
        }

        if (features.length > 0) {
            try {
                map.addSource(layerId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: features
                    }
                });

                map.addLayer({
                    id: layerId,
                    type: 'fill',
                    source: layerId,
                    paint: {
                        'fill-color': [
                            'match',
                            ['get', 'noiseColor'],
                            'Orange', colorMapping.Orange,
                            'Pink', colorMapping.Pink,
                            'Yellow', colorMapping.Yellow,
                            'Red', colorMapping.Red,
                            '#000000'
                        ],
                        'fill-opacity': .7,
                        'fill-outline-color': '#000000'
                    }
                });
                
                // Set cursor to pointer for this layer
                map.on('mouseenter', layerId, () => {
                    map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', layerId, () => {
                    map.getCanvas().style.cursor = '';
                });
                
                console.log(`Added layer for town ${townId} with ${features.length} features`);
            } catch (error) {
                console.error(`Error adding layer for town ${townId}:`, error);
            }
        }
    }

    async function loadNextBatch() {
        if (!isLoading && directoryMap) {
            isLoading = true;
            const entries = Object.entries(directoryMap);
            const startIndex = currentBatchIndex;
            const endIndex = Math.min(startIndex + BATCH_SIZE, entries.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                const [townId, files] = entries[i];
                const layerId = `parcels-${i}`;
                await loadTownData(townId, files, layerId);
                loadedTowns++;
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TOWNS));
            }

            currentBatchIndex = endIndex;
            isLoading = false;

           
            if (currentBatchIndex < entries.length) {
                setTimeout(() => loadNextBatch(), DELAY_BETWEEN_BATCHES);
            }

            
            if (window.gc) window.gc();
        }
    }

    async function initializeLoading() {
        if (!map.loaded()) return;
        
        console.log('Initializing parcel data loading');
        
        // Add simplified noise layer for immediate display
        await loadSimplifiedNoiseMap();
        
        // Clear any existing detail layers
        for (let i = 0; ; i++) {
            const layerId = `parcels-${i}`;
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            } else {
                break;
            }
            if (map.getSource(layerId)) {
                map.removeSource(layerId);
            }
        }

        try {
            const response = await fetch('/data/parcels/noise_by_town/directory_map.json');
            if (!response.ok) {
                throw new Error('Failed to load directory map');
            }
            directoryMap = await response.json();
            totalTowns = Object.keys(directoryMap).length;
            loadedTowns = 0;
            currentBatchIndex = 0;
            
            // Set up click handler before loading data
            setupParcelClickHandler();
            
            await loadNextBatch();

        } catch (error) {
            console.error('Error initializing parcel data:', error);
            isLoading = false;
        }
    }

    // Append an SVG overlay inside the map container
    const svg = d3.select(map.getCanvasContainer())
        .append("svg")
        .style("position", "absolute")
        .style("top", "0px")
        .style("left", "0px")
        .style("width", "100%")
        .style("height", "100%")
        .style("pointer-events", "none"); // Prevents interference with map interactions

    const brush = d3.brush()
        .extent([[0, 0], [map.getCanvas().width, map.getCanvas().height]])
        .on("brush", brushed)
        .on("end", brushEnded);

    const brushGroup = svg.append("g")
        .attr("class", "brush")
        .call(brush);

        brushGroup
        .style("pointer-events", "none"); // Allows map interaction when not brushing

        brush.on("start", () => brushGroup.style("pointer-events", "all")); // Activate on brush
        brush.on("end", () => brushGroup.style("pointer-events", "none"));  // Deactivate after brush

    function brushed(event) {
        const selection = event.selection;
        if (!selection) return;
    
        // Convert screen coordinates to map coordinates
        const [x0, y0] = selection[0];
        const [x1, y1] = selection[1];

        const nw = map.unproject([x0, y0]); // Top-left in [lng, lat]
        const se = map.unproject([x1, y1]); // Bottom-right in [lng, lat]

        console.log("Selected area:", nw, se);
    }

    function brushEnded(event) {
        if (!event.selection) {
            console.log("Brush cleared");
            return;
        }

        // Example: Update map source based on the brushed region
        map.getSource('simplified-noise').setData({
            "type": "FeatureCollection",
            "features": [] // Replace with filtered features
        });

        console.log("Filtered noise map updated");
    }

    function setupParcelClickHandler() {
        // Popup for displaying parcel information
        const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false
        });

        // Add click handler for both simplified and detailed views
        map.on('click', (e) => {
            // Query both simplified and detailed layers
            const layers = ['simplified-noise-layer'];
            
            // Add all detail layers that might exist
            for (let i = 0; i < currentBatchIndex; i++) {
                layers.push(`parcels-${i}`);
            }
            
            // Find the features at click point from all layers
            const features = map.queryRenderedFeatures(e.point, {
                layers: layers.filter(layer => map.getLayer(layer))
            });
            
            if (!features.length) {
                popup.remove();
                return;
            }
            
            // Get the first clicked feature
            const feature = features[0];
            const props = feature.properties;
            
            console.log("Clicked feature properties:", props);
            
            // Format the properties into HTML
            let html = '<div class="parcel-popup">';
            html += `<h3>Parcel Information</h3>`;
            
            // Check and format common properties
            const address = props.SITE_ADDR || props.SITE_ADDR_L || 'Not available';
            const buildingValue = props.BLDG_VAL ? `$${Number(props.BLDG_VAL).toLocaleString()}` : 'N/A';
            const landValue = props.LAND_VAL ? `$${Number(props.LAND_VAL).toLocaleString()}` : 'N/A';
            const totalValue = props.TOTAL_VAL ? `$${Number(props.TOTAL_VAL).toLocaleString()}` : 'N/A';
            
            html += `<p><strong>Address:</strong> ${address}</p>`;
            html += `<p><strong>Building Value:</strong> ${buildingValue}</p>`;
            html += `<p><strong>Land Value:</strong> ${landValue}</p>`;
            html += `<p><strong>Total Value:</strong> ${totalValue}</p>`;
            html += `<p><strong>Noise Level:</strong> ${props.noiseLevel || props.noiseColor || 'N/A'}</p>`;
            
            // Add more properties if available
            if (props.USE_CODE_SYMB) {
                html += `<p><strong>Property Type:</strong> ${props.USE_CODE_SYMB}</p>`;
            }
            if (props.LOT_SIZE) {
                html += `<p><strong>Lot Size:</strong> ${Number(props.LOT_SIZE).toLocaleString()} sq ft</p>`;
            }
            
            html += '</div>';
            
            // Set popup content and location
            popup
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);
        });
    }

    onMount(() => {
        if (map) {
            if (map.loaded()) {
                initializeLoading();
            } else {
                map.on('load', () => {
                    initializeLoading();
                });
            }
        }
    });
</script>

<div class="loading-status">
    {#if directoryMap}
        <p>Loaded: {loadedTowns} / {totalTowns}</p>
    {/if}
</div>

<style>
    .loading-status {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1000;
    }

    :global(.parcel-popup) {
        padding: 5px;
        max-width: 300px;
        font-family: Arial, sans-serif;
    }

    :global(.parcel-popup h3) {
        margin: 0 0 10px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #ccc;
    }

    :global(.parcel-popup p) {
        margin: 5px 0;
        font-size: 14px;
    }
</style>
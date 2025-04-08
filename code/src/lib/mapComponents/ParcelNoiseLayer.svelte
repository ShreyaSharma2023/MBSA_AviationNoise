<script>
    import { onMount } from "svelte";
    import mapboxgl from "mapbox-gl";

    export let map;

    const colorMapping = {
        'Pink': '#7e1060',    
        'Orange': '#39ff14',  //neon green
        'Yellow': '#fcc478',  
        'Red': '#b1004d',     
    };

    let isLoading = false;
    let loadedTowns = 0;
    let totalTowns = 0;
    let directoryMap = null;
    let currentBatchIndex = 0;
    const BATCH_SIZE = 3; 
    const DELAY_BETWEEN_TOWNS = 1000; 
    const DELAY_BETWEEN_BATCHES = 2000; 

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
                        'fill-opacity': 1,
                        'fill-outline-color': '#000000'
                    }
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
            
            
            await loadNextBatch();

        } catch (error) {
            console.error('Error initializing parcel data:', error);
            isLoading = false;
        }
    }

    onMount(() => {
        if (map) {
            if (map.loaded()) {
                initializeLoading();
            } else {
                map.on('load', initializeLoading);
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
</style> 
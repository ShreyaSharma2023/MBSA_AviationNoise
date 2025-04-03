<script>
    import mapboxgl from "mapbox-gl";
    import * as d3 from 'd3';
    import "../../node_modules/mapbox-gl/dist/mapbox-gl.css";
    import {onMount} from "svelte";
    import buffer from '@turf/buffer';
    import {point} from '@turf/helpers';
    import PanelComponent from '../lib/dataVisComponents/panel.svelte';
   
    import BaseMap from "$lib/mapComponents/BaseMap.svelte";

    mapboxgl.accessToken = "pk.eyJ1IjoicmZpb3Jpc3RhIiwiYSI6ImNsdWQwcDd0aDFkengybG85eW00eDJqdzEifQ.smRFd5P2IKrDHr5HGsfrGw";

    let baseMap;
    let stations = [];
    let parcelFiles = [];
    let zoningAndCensusFiles = [];
    let selectedMunicipality;
    let municipalities = [];
    let selectedStations = [];
    let guidedMode = false;
    let comparisonMode = false;
    let explorationMode = false;

    let resetScroll = false;
    let value = 0;

    onMount(async () => {
        let loadedParcelFiles = await d3.csv("/data/parcels/merged_file_name_reference.csv");

    
        parcelFiles = loadedParcelFiles.map(entry => {
            let newParcelFile = {};
            newParcelFile.StopName = entry.StopName;
            newParcelFile.FileName = entry.FileName;
            return newParcelFile;
        });

    })

    function deselectAll(e) {
        selectedMunicipality = null;
        selectedStations = [];
        resetScroll = true;
    }
</script>

<BaseMap
        class="baseMap"
        bind:this={baseMap}
        bind:municipalities={municipalities}
        bind:selectedMunicipality={selectedMunicipality}
        bind:guidedMode={guidedMode}
        bind:parcelFiles={parcelFiles}
        bind:comparisonMode={comparisonMode}
        bind:explorationMode={explorationMode}
/>

{#key explorationMode}
        <!--<div class="panel-container">
            <div class="progress-bar" style="position: absolute;">
                {#each [0, 1, 2, 3, 4, 5, 6, 7, 8] as slideIndex}
                    <div class="circle {value === slideIndex ? 'active' : ''}"></div>
                {/each}
            </div>
            <PanelComponent
                    bind:municipalities={municipalities}
                    bind:stations={stations}
                    bind:zoningAndCensusFiles={zoningAndCensusFiles}
                    bind:selectedMunicipality={selectedMunicipality}
                    bind:selectedStations={selectedStations}
                    bind:guidedMode={guidedMode}
                    bind:comparisonMode={comparisonMode}
                    bind:explorationMode={explorationMode}
                    bind:resetScroll={resetScroll}
                    bind:value={value}
            />
        </div> -->
{/key}

<style>
    @import url("$lib/global.css");

    .floating-x {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 1000;

        width: 30px;
        height: 30px;
        line-height: 30px;
        text-align: center;

        padding: 0;
        background-color: rgba(255, 255, 255, 0.8);
        border: none;
        cursor: pointer;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);

        display: flex;
        justify-content: center;
        align-items: center;
    }

    /*.panel-container {*/
    /*    display: flex;*/
    /*    width: 100%;*/
    /*}*/

    .reset-icon {
        width: 60%;  /* Adjust this to fit the button */
        height: auto; /* Keeps the aspect ratio of the image */
        transition: transform 0.3s ease; /* Smooth transition for transform */
    }

    .reset-icon:hover {
        transform: rotate(-180deg); /* Rotate 180 degrees on hover */
    }
</style>

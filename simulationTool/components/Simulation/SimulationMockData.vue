<template>
    <div class="mock-data-panel">
        <div class="alert alert-info">
            <h5>🧪 Simulation Mock Data</h5>
            <p>Dieses Panel lädt Test-Daten für die Simulation, um die Print-Funktionalität zu testen.</p>
        </div>

        <div class="mb-3">
            <button
                class="btn btn-primary me-2"
                @click="loadMockData"
            >
                📊 Mock-Simulation laden
            </button>
            <button
                class="btn btn-success me-2"
                :disabled="!hasMockData"
                @click="goToResults"
            >
                🎯 Zu Ergebnissen
            </button>
            <button
                class="btn btn-warning"
                @click="clearMockData"
            >
                🗑️ Daten löschen
            </button>
        </div>

        <div
            v-if="hasMockData"
            class="alert alert-success"
        >
            ✅ Mock-Daten geladen! Sie können jetzt zu den Simulationsergebnissen wechseln.
        </div>
    </div>
</template>

<script>
import {mapGetters, mapMutations} from "vuex";

export default {
    name: "SimulationMockData",
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "planningScenarios",
            "simulations",
            "simulationIdForResults"
        ]),

        hasMockData () {
            return this.planningScenarios.length > 0 && this.simulationIdForResults;
        }
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", [
            "setPlanningScenarios",
            "setSimulations",
            "setSimulationIdForResults",
            "setMode",
            "setOnJobStatusChange",
            "setCurrentPlanningScenarioId"
        ]),

        /**
         * Loads mock simulation data into the store
         */
        loadMockData () {
            const currentTime = new Date(),
                startTime = new Date(currentTime.getTime() - 5 * 60 * 1000), // 5 minutes ago
                endTime = new Date(currentTime.getTime() - 1 * 60 * 1000), // 1 minute ago
                // Mock Planning Scenario
                mockPlanningScenario = {
                    id: "mock-scenario-1",
                    name: "Wind Comfort Analysis Hamburg",
                    description: "Mock-Szenario für Wind Comfort Analyse",
                    simulations: {
                        "mock-sim-1": {
                            id: "mock-sim-1",
                            name: "Wind Comfort Simulation",
                            configId: "wind-comfort-config-1",
                            jobs: {
                                "job-1": {
                                    id: "job-1",
                                    jobStatus: {
                                        status: "successful",
                                        started: startTime.toISOString(),
                                        finished: endTime.toISOString(),
                                        progress: 100
                                    },
                                    requestBody: {
                                        inputs: {
                                            "ComplexObjectInput": {
                                                "wind-speed": 15,
                                                "wind-direction": 35,
                                                "geometries": {
                                                    "226e57e8-3417-4f9d-ad3f-ddc2ce169838": {
                                                        "coordinates": [565000, 5934000, 0, 565500, 5934000, 0, 565500, 5934500, 0, 565000, 5934500, 0],
                                                        "indices": [0, 1, 2, 0, 2, 3]
                                                    },
                                                    "6fbf2238-3fba-42a8-b7d0-a7ac1b24a709": {
                                                        "coordinates": [565500, 5934000, 0, 566000, 5934000, 0, 566000, 5934500, 0, 565500, 5934500, 0],
                                                        "indices": [0, 1, 2, 0, 2, 3]
                                                    },
                                                    "additional-building-area": {
                                                        "coordinates": [566000, 5934000, 0, 566500, 5934000, 0, 566500, 5934500, 0, 566000, 5934500, 0],
                                                        "indices": [0, 1, 2, 0, 2, 3]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    jobResults: {
                                        "wind_comfort": {
                                            features: [
                                                {
                                                    type: "Feature",
                                                    geometry: {
                                                        type: "Polygon",
                                                        coordinates: [[
                                                            [565000, 5934000],
                                                            [565500, 5934000],
                                                            [565500, 5934500],
                                                            [565000, 5934500],
                                                            [565000, 5934000]
                                                        ]]
                                                    },
                                                    properties: {
                                                        "comfort_level": "uncomfortable",
                                                        "comfort_value": 0.8,
                                                        "wind_speed": 15,
                                                        "building_id": "226e57e8-3417-4f9d-ad3f-ddc2ce169838"
                                                    }
                                                },
                                                {
                                                    type: "Feature",
                                                    geometry: {
                                                        type: "Polygon",
                                                        coordinates: [[
                                                            [565500, 5934000],
                                                            [566000, 5934000],
                                                            [566000, 5934500],
                                                            [565500, 5934500],
                                                            [565500, 5934000]
                                                        ]]
                                                    },
                                                    properties: {
                                                        "comfort_level": "moderate",
                                                        "comfort_value": 0.5,
                                                        "wind_speed": 12,
                                                        "building_id": "6fbf2238-3fba-42a8-b7d0-a7ac1b24a709"
                                                    }
                                                },
                                                {
                                                    type: "Feature",
                                                    geometry: {
                                                        type: "Polygon",
                                                        coordinates: [[
                                                            [566000, 5934000],
                                                            [566500, 5934000],
                                                            [566500, 5934500],
                                                            [566000, 5934500],
                                                            [566000, 5934000]
                                                        ]]
                                                    },
                                                    properties: {
                                                        "comfort_level": "comfortable",
                                                        "comfort_value": 0.2,
                                                        "wind_speed": 8,
                                                        "building_id": "additional-building-area"
                                                    }
                                                }
                                            ]
                                        },
                                        "wind_analysis": {
                                            features: [
                                                {
                                                    type: "Feature",
                                                    geometry: {
                                                        type: "Polygon",
                                                        coordinates: [[
                                                            [565000, 5934500],
                                                            [565500, 5934500],
                                                            [565500, 5935000],
                                                            [565000, 5935000],
                                                            [565000, 5934500]
                                                        ]]
                                                    },
                                                    properties: {
                                                        "wind_direction": 35,
                                                        "wind_speed": 15,
                                                        "turbulence": "high"
                                                    }
                                                },
                                                {
                                                    type: "Feature",
                                                    geometry: {
                                                        type: "Polygon",
                                                        coordinates: [[
                                                            [565500, 5934500],
                                                            [566000, 5934500],
                                                            [566000, 5935000],
                                                            [565500, 5935000],
                                                            [565500, 5934500]
                                                        ]]
                                                    },
                                                    properties: {
                                                        "wind_direction": 40,
                                                        "wind_speed": 12,
                                                        "turbulence": "medium"
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    resultStyle: {
                                        type: "polygon",
                                        property: "comfort_level",
                                        styles: [
                                            {
                                                value: "uncomfortable",
                                                style: {
                                                    fillColor: [255, 0, 0, 0.7],
                                                    strokeColor: [255, 0, 0, 1],
                                                    strokeWidth: 2
                                                }
                                            },
                                            {
                                                value: "moderate",
                                                style: {
                                                    fillColor: [255, 165, 0, 0.7],
                                                    strokeColor: [255, 165, 0, 1],
                                                    strokeWidth: 2
                                                }
                                            },
                                            {
                                                value: "comfortable",
                                                style: {
                                                    fillColor: [0, 255, 0, 0.7],
                                                    strokeColor: [0, 255, 0, 1],
                                                    strokeWidth: 2
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                // Mock Simulation Configuration
                mockSimulation = {
                    id: "wind-comfort-config-1",
                    name: "Wind Comfort Analysis Konfiguration",
                    inputs: {
                        "ComplexObjectInput": {
                            propertiesMapping: {
                                "wind-speed": "Windgeschwindigkeit (m/s)",
                                "wind-direction": "Windrichtung (°)",
                                "geometries": "Gebäude Geometrien"
                            }
                        }
                    },
                    outputs: {
                        propertiesMapping: {
                            "wind_comfort": "Wind Komfort Analyse",
                            "wind_analysis": "Wind Analyse Details"
                        }
                    }
                };

            // Load data into store
            this.setPlanningScenarios([mockPlanningScenario]);
            this.setSimulations([mockSimulation]);
            this.setSimulationIdForResults("mock-sim-1");

            // Trigger the watcher to process the data
            this.setOnJobStatusChange(Date.now());

            console.log("✅ Mock simulation data loaded successfully!");
        },

        /**
         * Navigate to simulation results
         */
        goToResults () {
            this.setMode("simulationResults");

            // Ensure features are displayed on the map
            this.$nextTick(() => {
                // Trigger the display of mock features
                this.setOnJobStatusChange(Date.now());

                // Zoom to Hamburg area where our mock data is located (EPSG:25832)
                this.$store.dispatch("Maps/zoomToExtent", {
                    extent: [565000, 5934000, 566500, 5935000],
                    options: {maxZoom: 15}
                }, {root: true});
            });
        },

        /**
         * Clear all mock data
         */
        clearMockData () {
            this.setPlanningScenarios([]);
            this.setSimulations([]);
            this.setSimulationIdForResults("");
            console.log("🗑️ Mock data cleared");
        }
    }
};
</script>

<style scoped>
.mock-data-panel {
    padding: 1rem;
}

.btn:disabled {
    opacity: 0.6;
}
</style>

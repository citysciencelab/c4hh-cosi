<script>
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "TrafficCountSwitch",
    components: {
        SwitchInput
    },
    props: {
        currentMeansOfTransport: {
            type: String,
            required: false,
            default: ""
        },
        lastMeansOfTransportKey: {
            type: Array,
            required: false,
            default: () => []
        },
        tableDiagramId: {
            type: String,
            required: true
        }
    },
    emits: ["setMeansOfTransportKey"],
    data () {
        return {
            isTableVisible: false
        };
    },
    computed: {
        /**
         * Gets the translated label for the table switch.
         * @returns {String} The translated label.
         */
        tableSwitchLabel () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.showTable");
        },
        /**
         * Checks if the component is used for the table.
         * @returns {Boolean} true if it is the table.
         */
        isTable () {
            return this.tableDiagramId.includes("table");
        },
        /**
         * Checks if the component is used for the diagram.
         * @returns {Boolean} true if it is the diagram.
         */
        isDiagram () {
            return this.tableDiagramId.includes("diagram");
        },
        /**
         * Dynamically determines the optional means of transport including the translated label.
         * @returns {Object|null} The transport object with key and label, or null.
         */
        optionalTransport () {
            if (this.currentMeansOfTransport === "Anzahl_Kfz") {
                return {
                    key: "Anzahl_Schwerverkehr",
                    label: this.$t("additional:modules.tools.gfi.themes.trafficCount.showHeavyTraffic")
                };
            }
            else if (this.currentMeansOfTransport === "Anzahl_Schwerverkehr") {
                return {
                    key: "Anzahl_Kfz",
                    label: this.$t("additional:modules.tools.gfi.themes.trafficCount.showCarTraffic")
                };
            }
            return null;
        }
    },
    mounted () {
        if (this.isTable) {
            this.isTableVisible = false;
            const el = document.getElementById(this.tableDiagramId);

            if (el) {
                el.style.display = "none";
            }
        }
    },
    methods: {
        /**
         * Sets the means of transport key (triggered by the switch).
         * @param {Event} event The native change event of the switch.
         * @param {Object} transportObj The selected means of transport object.
         * @returns {void}
         */
        setMeansOfTransportKey (event, transportObj) {
            if (!event?.target || !transportObj?.key) {
                return;
            }
            const meansOfTransportKey = [this.currentMeansOfTransport];

            if (event.target.checked) {
                meansOfTransportKey.push(transportObj.key);
            }

            this.$emit("setMeansOfTransportKey", meansOfTransportKey);
        },
        /**
         * Toggles the visibility of the table.
         * @param {Event} event The native change event of the switch.
         * @returns {void}
         */
        toggleTableDiagram (event) {
            if (!event?.target) {
                return;
            }
            const isChecked = event.target.checked;

            this.isTableVisible = isChecked;

            const el = document.getElementById(this.tableDiagramId);

            if (el) {
                el.style.display = isChecked ? "block" : "none";
            }
        }
    }
};
</script>

<template>
    <div class="traffic-switch-container mb-4 mt-2">
        <SwitchInput
            v-if="isTable"
            :id="'switch-' + tableDiagramId"
            :label="tableSwitchLabel"
            :aria="tableSwitchLabel"
            :checked="isTableVisible"
            :interaction="toggleTableDiagram"
        />
        <SwitchInput
            v-if="isDiagram && optionalTransport"
            :id="'switch-' + optionalTransport.key"
            :label="optionalTransport.label"
            :aria="optionalTransport.label"
            :checked="lastMeansOfTransportKey.length === 2"
            :interaction="(event) => setMeansOfTransportKey(event, optionalTransport)"
        />
    </div>
</template>

<style lang="scss" scoped>
.traffic-switch-container {
    display: flex;
    align-items: center;
    padding-left: 0.5rem;
}
</style>

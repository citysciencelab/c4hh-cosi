<script>
export default {
    name: "TrafficCountCheckbox",
    props: {
        /**
         * The current meansOfTransport
         */
        currentMeansOfTransport: {
            type: String,
            required: false,
            default: ""
        },
        /**
         * The last meansOfTransport key
         */
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
            isChecked: true,
            multiChecked: []
        };
    },
    computed: {
        diagramLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.diagramLabel");
        },

        tableLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.tableLabel");
        },

        checkboxLabel: function () {
            if (this.tableDiagramId.includes("table")) {
                return this.tableLabel;
            }

            return this.diagramLabel;
        },

        checkboxId: function () {
            return "checkbox-" + this.tableDiagramId;
        },
        /**
         * Returs the toggled checkbox for KFZ and SV
         * @returns {Object[]}  - the checkbox object.
         */
        toggledCar: function () {
            if (this.currentMeansOfTransport === "Anzahl_Kfz") {
                return [
                    {key: "Anzahl_Kfz", name: "Kfz"},
                    {key: "Anzahl_Schwerverkehr", name: "Schwerverkehr"}
                ];
            }
            else if (this.currentMeansOfTransport === "Anzahl_Schwerverkehr") {
                return [
                    {key: "Anzahl_Schwerverkehr", name: "Schwerverkehr"},
                    {key: "Anzahl_Kfz", name: "Kfz"}
                ];
            }

            return [];
        }
    },
    mounted: function () {
        // Setting the table hidden as default
        if (this.tableDiagramId.includes("table")) {
            this.isChecked = false;
            if (document.getElementById(this.tableDiagramId)) {
                document.getElementById(this.tableDiagramId).style.display = "none";
            }
        }
    },
    methods: {
        /**
         * Sets the shown means of transport keys.
         * @param {evt} evt the click event
         * @param {Object} val the chosen chekbox value.
         * @returns {Void}  -
         */
        setMeansOfTransportKey (event, val) {
            const meansOfTransportKey = [this.currentMeansOfTransport];

            if (event.target.checked) {
                meansOfTransportKey.push(val.key);
            }

            this.$emit("setMeansOfTransportKey", meansOfTransportKey);
        },
        /**
         * toggle the table or diagram by clicking the checkbox
         * @param {Object[]} evt the target of current click event
         * @returns {Void}  -
         */
        toggleTableDiagram: function (evt) {
            if (evt && evt.target) {
                const checked = evt.target.checked,
                    toggledElementId = evt.target.value;

                if (!checked) {
                    document.getElementById(toggledElementId).style.display = "none";
                }
                else {
                    document.getElementById(toggledElementId).style.display = "block";
                }
            }
        }
    }
};
</script>

<template>
    <div class="tab-pane form-check d-flex">
        <input
            :id="checkboxId"
            v-model="isChecked"
            :value="tableDiagramId"
            type="checkbox"
            class="form-check-input"
            @click="toggleTableDiagram"
        >
        <label
            class="form-check-label"
            :for="checkboxId"
        >{{ checkboxLabel }}</label>
        <div
            v-if="toggledCar.length"
            class="d-flex ms-4"
        >
            <div
                v-for="(meansOfTransport, index) in toggledCar"
                :key="meansOfTransport.name"
                class="ms-5"
            >
                <input
                    :id="'checkbox-'+meansOfTransport.name"
                    :value="meansOfTransport.name"
                    :checked="index === 0 || lastMeansOfTransportKey.length === 2"
                    :disabled="index === 0"
                    type="checkbox"
                    class="form-check-input"
                    @change="setMeansOfTransportKey($event, meansOfTransport)"
                >
                <label
                    class="form-check-label"
                    :for="'checkbox-'+meansOfTransport.name"
                >{{ meansOfTransport.name }}</label>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.form-check-input:checked {
    // color: $secondary_focus_contrast;
    // background-color: $secondary_focus;
    // border-color: $secondary_focus;
}
.form-check-label {
    margin-top: 0.1095em;
}
</style>

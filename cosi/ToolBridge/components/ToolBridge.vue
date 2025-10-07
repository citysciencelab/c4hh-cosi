<script>
// Developer Documentation in ./doc/ToolBridge.md
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersToolBridge";
import actions from "../store/actionsToolBridge";
import mutations from "../store/mutationsToolBridge";
import tableify from "tableify"; // generate html tables from js objects // only needed for debugging UI

export default {
    name: "ToolBridge",
    data () {
        return {
            retrievedSettings: [], // only needed for debugging UI
            selectedItem: "Dashboard", // only needed for debugging UI
            selectedSettings: undefined, // only needed for debugging UI
            resultDisplay: "" //  only needed for debugging UI
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Modules/ToolBridge", Object.keys(getters)),

        activeSetting () { // only needed for debugging UI
            return this.retrievedSettings[parseInt(this.selectedSettings, 10) || this.retrievedSettings.length - 1];
        }
    },
    watch: {
        receivedResults (newResult) {
            // when a new request to a tool is made, a callback function is passed along, defining what to do with the results at the very end.
            // whenever a result is received, we run that callback.
            // that way, the requests/results are self contained - i.e. we don't need to keep track of what requests we made when and what we were supposed to do with them.
            newResult.request.outputCallback(newResult);
        }
    },
    created () {
        // ...
    },
    mounted () {
        // ...
    },
    methods: {
        ...mapMutations("Modules/ToolBridge", Object.keys(mutations)),
        ...mapActions("Modules/ToolBridge", Object.keys(actions)),
        getToolSettingsButton () { // only needed for debugging UI
            // when the button is clicked, read toolbridge interface, get settings of the selected tool, store them to array
            const settings = this.currentSettings(this.selectedItem);

            this.retrievedSettings.push(settings);
        },
        runToolButton (toolName, settings, outputCallback) { // only needed for debugging UI
            this.$store.dispatch("Modules/ToolBridge/runTool", {
                toolName: toolName,
                settings: settings,
                outputCallback: outputCallback
            });

        },
        defaultOutputCallback (result) { // only needed for debugging UI
            if (result.type === "table") {
                const table_html = tableify(result.result);

                this.resultDisplay = table_html;

            }
            else if (result.type === "image") {
                this.resultDisplay = "<img src='" + result.result + "' width='200px'>";
            }
        }
    }
};
</script>

<!-- interface for debugging only-->
<template lang="html">
    Welches Tool soll verwendet werden?<br>
    <v-select
        v-model="selectedItem"
        label="Tool wählen"
        :items="supportedTools"
    />
    <v-btn @click="getToolSettingsButton">
        aktuelle Tool Einstellungen speichern
    </v-btn>
    <v-text-field
        v-model="selectedSettings"
        label="use retrieved settings #"
        type="number"
        clearable
    />
    <v-btn @click="runToolButton(selectedItem, activeSetting, defaultOutputCallback)">
        Tool anwenden
    </v-btn>
    <div v-html="resultDisplay" />
</template>

<style lang="scss" scoped>
</style>

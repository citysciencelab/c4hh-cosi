<script>
import {mapGetters, mapActions} from "vuex";
import ControlIcon from "../../../../src/modules/controls/components/ControlIcon.vue";

/**
 * The BackForward control element allows stepping back
 * and forth through view states regarding zoom and center.
 * @module modules/controls/ExampleControl
 */
export default {
    name: "ExampleControl",
    components: {
        ControlIcon
    },
    computed: {
        ...mapGetters("Controls/ExampleControl", [
            "icon",
            "supportedDevices"
        ])
    },
    methods: {
        ...mapActions("Controls/ExampleControl", [
            "showAlert"
        ]),
        /**
         * Shows an alert.
         */
        alarm () {
            this.showAlert("Dies ist ein Beispiel control in den addons.");
        }
    }
};
</script>

<template>
    <div
        id="example-contol-buttons"
    >
        <ControlIcon
            :title="'Alarm'"
            :icon-name="icon"
            :on-click="alarm"
        />
    </div>
</template>

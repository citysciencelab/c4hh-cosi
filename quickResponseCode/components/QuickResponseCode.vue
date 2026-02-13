<script>
import {mapActions, mapMutations} from "vuex";
import QuickResponseCodeOverlay from "./QuickResponseCodeOverlay.vue";

/**
 * The QuickResponseCode creates a qr code at the clicked position in the map.
 * @module addons/QuickResponseCode
 */
export default {
    name: "QuickResponseCode",
    components: {
        QuickResponseCodeOverlay
    },
    mounted () {
        this.registerListener({type: "click", listener: this.setEvtCoordinate, keyForBoundFunctions: "quickResponseGetCoordinateListener"});
    },
    unmounted () {
        this.unregisterListener({type: "click", listener: this.setEvtCoordinate, keyForBoundFunctions: "quickResponseGetCoordinateListener"});
    },
    methods: {
        ...mapMutations("Modules/QuickResponseCode", [
            "setEvtCoordinate"
        ]),
        ...mapActions("Maps", [
            "registerListener",
            "unregisterListener"
        ])
    }
};
</script>

<template>
    <div id="quick-response-code-container">
        <p> {{ $t('additional:modules.quickResponseCode.text') }}</p>

        <QuickResponseCodeOverlay />
    </div>
</template>

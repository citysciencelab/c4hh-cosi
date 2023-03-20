<script>
import ToolTemplate from "../../../src/modules/tools/ToolTemplate.vue";
import QuickResponseCodeOverlay from "./QuickResponseCodeOverlay.vue";
import {mapGetters, mapMutations, mapActions} from "vuex";
import getters from "../store/gettersQuickResponseCode";
import mutations from "../store/mutationsQuickResponseCode";

export default {
    name: "QuickResponseCode",
    components: {
        ToolTemplate,
        QuickResponseCodeOverlay
    },
    computed: {
        ...mapGetters("Tools/QuickResponseCode", Object.keys(getters))
    },
    watch: {
        active (value) {
            if (value) {
                this.registerListener({type: "click", listener: this.setEvtCoordinate});
            }
        }
    },
    created () {
        this.$on("close", this.close);
    },
    methods: {
        ...mapMutations("Tools/QuickResponseCode", Object.keys(mutations)),
        ...mapActions("Maps", ["registerListener", "unregisterListener"]),

        /**
         * Closes this tool window by setting active to false
         * @returns {void}
         */
        close () {
            this.setActive(false);
            this.unregisterListener({type: "click", listener: this.setEvtCoordinate});

            const model = Radio.request("ModelList", "getModelByAttributes", {id: this.$store.state.Tools.QuickResponseCode.id});

            if (model) {
                model.set("isActive", false);
            }
        }
    }
};
</script>

<template lang="html">
    <ToolTemplate
        :title="$t(name)"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
    >
        <template #toolBody>
            <div
                v-if="active"
                id="tool-quick-response-code"
            >
                <QuickResponseCodeOverlay />
                {{ $t(text) }}
            </div>
        </template>
    </ToolTemplate>
</template>

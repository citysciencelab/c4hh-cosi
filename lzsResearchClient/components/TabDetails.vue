<script>
import {mapGetters, mapMutations} from "vuex";
import {TAB_SET_CURRENT} from "./shared/TabContainer.vue";

export default {
    name: "TabDetails",
    components: {},
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    props: {},
    data () {
        return {};
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "getDetailsForSelectedInstanceId"
        ])
    },
    watch: {},
    methods: {
        ...mapMutations("Modules/LzsResearchClient", [
            "setSelectedInstanceId"
        ]),
        returnToResultTab () {
            this.setSelectedInstanceId(null);
            this.setCurrentTab("tabResult");
        }
    }
};
</script>

<template>
    <div id="TabDetails">
        "TabDetails Content"

        {{ getDetailsForSelectedInstanceId }}

        <button
            @click="returnToResultTab()"
        >
            Change tab from child..
        </button>
    </div>
</template>

<style lang="scss" scoped>
#TabDetails {
    outline: dashed 2px red;
}
</style>

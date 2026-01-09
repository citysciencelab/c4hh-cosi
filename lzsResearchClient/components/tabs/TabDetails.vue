<script>
import {TAB_SET_CURRENT} from "../TabContainer.vue";

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
    computed: {},
    watch: {},
    methods: {}
};
</script>

<template>
    <div id="TabDetails">
        "TabDetails Content"

        <button
            @click="setCurrentTab('tabResult')"
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

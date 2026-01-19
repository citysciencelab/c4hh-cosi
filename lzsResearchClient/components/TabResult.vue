<script>
import {mapGetters} from "vuex";

export default {
    name: "TabResult",
    components: {},
    props: {},
    data () {
        return {};
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "searchAttributeResponse"
        ])
    },
    watch: {},
    methods: {}
};
</script>

<template>
    <div id="TabResult">
        "TabResult Content"
        <div v-if="searchAttributeResponse.length > 0">
            {{ searchAttributeResponse }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
#TabResult {
    outline: dashed 2px red;
}
</style>

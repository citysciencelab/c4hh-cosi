<script>
import {mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersCosiFileImport";
import mutations from "../store/mutationsCosiFileImport";
import {getModelByAttributes} from "../../utils/radioBridge.js";

export default {
    name: "EditLayer",
    components: {
    },
    data () {
        return {
        };
    },
    computed: {
        ...mapGetters("Tools/CosiFileImport", Object.keys(getters)),
        // returns layer active layer by index in importedLayers (state/store)
        selectedLayer () {
            const model = getModelByAttributes({type: "layer", id: this.importedLayers[this.activeLayer].id});

            return model.attributes;
        }
    },
    watch: {
        activeLayer () {
            // console.log("zzup", this.activeLayer);
        }
    },
    methods: {
        ...mapMutations("Tools/CosiFileImport", Object.keys(mutations))
    }
};
</script>

<template lang="html">
    <div class="edit_layer">
        {{ selectedLayer.name }}: {{ activeLayer }}
    </div>
</template>


<style lang="scss" scoped>
</style>

<script>
import {mapGetters} from "vuex";
import Multiselect from "vue-multiselect";

export default {
    name: "ProcessSelect",
    components: {
        Multiselect
    },
    props: {
        modelValue: {
            type: Array,
            default: () => []
        }
    },
    emits: ["update:modelValue"],
    computed: {
        ...mapGetters({
            processes: "Modules/SimulationTool/processes"
        })
    },
    methods: {
        handleInputChange (value) {
            this.$emit("update:modelValue", value);
        },
        labelFunction (process) {
            return `${process.title} v${process.version} (${process.id})`;
        }
    }
};
</script>

<template>
    <div class="process-list">
        <multiselect
            :model-value="modelValue"
            :placeholder="$t('additional:modules.tools.simulationTool.searchModels') + '...'"
            :aria-label="$t('additional:modules.tools.simulationTool.searchModels') + '...'"
            track-by="id"
            :custom-label="labelFunction"
            :options="processes"
            :multiple="true"
            @update:modelValue="handleInputChange"
        />
    </div>
</template>

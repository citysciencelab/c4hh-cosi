<script>
import Multiselect from "vue-multiselect";

export default {
    name: "JobSelect",
    components: {
        Multiselect
    },
    props: {
        modelValue: {
            type: Array,
            default: () => []
        },
        filteredJobs: {
            type: Array,
            default: () => []
        }
    },
    emits: ["update:modelValue"],
    methods: {
        handleInputChange (value) {
            this.$emit("update:modelValue", value);
        },
        labelFunction (job) {
            return `${job.name} v${job.process_version} (${job.process_title})`;
        }
    }
};
</script>

<template>
    <div class="job-list">
        <multiselect
            :model-value="modelValue"
            :placeholder="$t('additional:modules.tools.simulationTool.searchJobs') + '...'"
            :aria-label="$t('additional:modules.tools.simulationTool.searchJobs') + '...'"
            track-by="jobID"
            :custom-label="labelFunction"
            :options="filteredJobs"
            :multiple="true"
            @update:modelValue="handleInputChange"
        />
    </div>
</template>

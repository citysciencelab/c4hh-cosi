<script>
export default {
    name: "DistrictFinderFilterExport",
    emits: ["exportConditions"],
    data () {
        return {
            exportName: "",
            withAreas: false
        };
    },
    methods: {
        /**
         * Emits exportConditions with set data.
         * @returns {void}
         */
        emitExport () {
            this.$emit("exportConditions", this.exportName, this.withAreas);
        }
    }
};

</script>

<template lang="html">
    <div
        id="export-dialog"
        class="dropdown-menu p-3 rounded"
    >
        <h5>{{ $t("additional:modules.tools.cosi.districtFinder.conditionsExport") }}</h5>
        <div class="mb-3">
            <label
                for="export-name"
            >
                {{ $t("additional:modules.tools.cosi.districtFinder.label.exportName") }}
            </label>
            <input
                id="export-name"
                v-model="exportName"
                type="text"
                class="form-control"
                aria-describedby="exportName"
            >
        </div>
        <div class="mb-3 form-check">
            <input
                id="export-areas"
                v-model="withAreas"
                type="checkbox"
                class="form-check-input"
            >
            <label
                class="form-check-label"
                for="export-areas"
            >
                {{ $t("additional:modules.tools.cosi.districtFinder.label.exportAreas") }}
            </label>
        </div>
        <button
            class="btn btn-primary lh-1 fs-5"
            @click="emitExport"
        >
            <i class="bi bi-download pe-2" />
            {{ $t("additional:modules.tools.cosi.districtFinder.button.export") }}
        </button>
    </div>
</template>

<style lang="scss" scoped>

    #export-dialog {
        min-width: 300px;

        h5 {
            font-family: $font_family_accent;
        }
    }
</style>

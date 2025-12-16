<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "DistrictFinderFilterExport",
    components: {
        FlatButton,
        InputText
    },
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
            <InputText
                :id="'export-name'"
                :model-value="exportName"
                :label="$t('additional:modules.tools.cosi.districtFinder.label.exportName')"
                :placeholder="$t('additional:modules.tools.cosi.districtFinder.label.exportName')"
            />
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
            <FlatButton
                class="my-3"
                icon="bi bi-upload"
                :text="$t('additional:modules.tools.cosi.districtFinder.button.export')"
                @click.native="emitExport"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>

    #export-dialog {
        min-width: 20%;
    }
</style>


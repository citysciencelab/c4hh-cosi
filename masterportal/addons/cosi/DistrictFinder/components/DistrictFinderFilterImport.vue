<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import isObject from "@shared/js/utils/isObject";
export default {
    name: "DistrictFinderFilterImport",
    components: {
        FlatButton
    },
    emits: ["setConditionDate", "setConditionTitle", "setCardList", "setLatestYear", "setDistrictSelector"],
    data () {
        return {
            latestData: false
        };
    },
    computed: {
        ...mapGetters("Modules/DistrictSelector", ["mapping"])
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapMutations("Modules/DistrictFinder", ["setSubLevelSelection", "setSelectedLevelId", "setTopLevelSelection"]),

        /**
         * Checks if the value is in right number format
         * @param {Object[]} data - data in content.
         * @returns {Boolean} true if the value is in right format
         */
        checkNumberOfValue (data) {
            if (!Array.isArray(data) || !data.length) {
                return false;
            }

            let valid = true;

            data.forEach(element => {
                if (!isObject(element)) {
                    valid = false;
                    return;
                }
                const valueType = this.mapping.find(stats => stats.category === element.statisticCategory).valueType;

                if (valueType === "relative" && (!this.isNumberInRange(element.referenceValue) || !this.isNumberInRange(element.ruleTolerance))) {
                    const id = element.id;

                    this.addSingleAlert({
                        content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")} ${this.$t("additional:modules.tools.cosi.districtFinder.errors.relNumErr", {id})}`,
                        category: "Warning",
                        displayClass: "warning"
                    });
                    valid = false;
                }
            });

            return valid;
        },

        /**
         * Checks if the number is in a range.
         * @param {Number} val - the checked number.
         * @returns {Boolean} true if the value is in a range.
         */
        isNumberInRange (val) {
            return Math.floor(parseFloat(val)) >= 0 && Math.floor(parseFloat(val)) <= 100;
        },

        /**
         * Loading the data from files.
         * @param {Event} evt - A input change event.
         * @returns {void}
         */
        loadFiles (evt) {
            for (const file of evt.target.files) {
                if (!file.type.match("application/json")) {
                    this.addSingleAlert({
                        content: `${file.name}: ${this.$t("additional:modules.tools.cosi.districtFinder.errors.wrongFileFormat")}`,
                        category: "Warning",
                        displayClass: "warning"
                    });
                    continue;
                }
                const reader = new FileReader();

                reader.onload = this.parseFileContent;
                reader.readAsText(file);
            }
            this.$refs.form.reset();
        },

        /**
         * Parses the file content to JSON and emits it.
         * @param {Event} evt - A file reader load event.
         * @returns {void}
         */
        parseFileContent (evt) {
            let filter = {};

            try {
                filter = JSON.parse(evt?.target?.result);
            }
            catch (err) {
                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }

            if (!Object.prototype.hasOwnProperty.call(filter, "meta")) {
                const attribute = "meta";

                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")} ${this.$t("additional:modules.tools.cosi.districtFinder.errors.attErr", {attribute})}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }
            if (!Object.prototype.hasOwnProperty.call(filter?.meta, "date")) {
                const attribute = "date";

                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")} ${this.$t("additional:modules.tools.cosi.districtFinder.errors.attErr", {attribute})}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }
            if (!Object.prototype.hasOwnProperty.call(filter?.meta, "name")) {
                const attribute = "name";

                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")} ${this.$t("additional:modules.tools.cosi.districtFinder.errors.attErr", {attribute})}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }
            if (!Object.prototype.hasOwnProperty.call(filter, "data")) {
                const attribute = "data";

                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")} ${this.$t("additional:modules.tools.cosi.districtFinder.errors.attErr", {attribute})}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }
            if (!this.checkNumberOfValue(filter.data)) {
                return;
            }
            if (isObject(filter.districtSelector)) {
                if (Object.prototype.hasOwnProperty.call(filter.districtSelector, "selectedLevelId")) {
                    this.setSelectedLevelId(filter.districtSelector.selectedLevelId);
                }
                if (Array.isArray(filter.districtSelector.selectedTopLevels) && filter.districtSelector.selectedTopLevels.length) {
                    this.setTopLevelSelection(filter.districtSelector.selectedTopLevels);
                }
                if (Array.isArray(filter.districtSelector.selectedSubLevels) && filter.districtSelector.selectedSubLevels.length) {
                    this.setSubLevelSelection(filter.districtSelector.selectedSubLevels);
                }
            }

            this.$emit("setLatestYear", this.latestData);
            this.$emit("setConditionDate", filter.meta.date);
            this.$emit("setConditionTitle", filter.meta.name);
            this.$emit("setCardList", filter.data);
        },

        /**
         * Triggers the click event on the file input to open the explorer.
         * @returns {void}
         */
        triggerFileInput () {
            this.$el.querySelector("#file-input").click();
            this.$el.querySelector("#district-finder-import").classList.remove("show");
        }
    }
};
</script>

<template lang="html">
    <div
        id="district-finder-import"
        class="dropdown"
    >
        <FlatButton
            class="my-3 dropdown-toggle"
            icon="bi bi-upload"
            :text="$t('additional:modules.tools.cosi.districtFinder.button.importConditions')"
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
        />
        <div
            id="district-finder-import"
            class="dropdown-menu p-4 rounded"
        >
            <h5 class="mt-0 mb-0">
                {{ $t("additional:modules.tools.cosi.districtFinder.button.importConditions") }}
            </h5>
            <form ref="form">
                <label for="file-input">
                    <input
                        id="file-input"
                        type="file"
                        class="d-none"
                        @change="loadFiles"
                    >
                </label>
            </form>
            <p class="pt-0 pb-2">
                {{ $t("additional:modules.tools.cosi.districtFinder.importLatestData") }}
            </p>
            <div class="mb-3 form-check">
                <input
                    id="import-latest-data"
                    v-model="latestData"
                    type="checkbox"
                    class="form-check-input"
                >
                <label
                    class="form-check-label"
                    for="import-latest-data"
                >
                    {{ $t("additional:modules.tools.cosi.districtFinder.label.latestData") }}
                </label>
            </div>
            <FlatButton
                class="my-3"
                icon="bi bi-upload"
                :text="$t('additional:modules.tools.cosi.districtFinder.button.import')"
                @click.native="triggerFileInput"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>

    #district-finder-import {
        font-family: $font_family_default;
        width: 450px;

        .btn-outline {
            border-color: $light_blue;
            color: $light_blue;
        }
       .btn-outline:hover {
            cursor: pointer;
            background-color: $light_blue;
            color: $white;
       }

    }

</style>

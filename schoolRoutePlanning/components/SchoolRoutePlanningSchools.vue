<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import Multiselect from "vue-multiselect";

export default {
    name: "SchoolRoutePlanningSchools",
    components: {
        Multiselect
    },
    props: {
        layer: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters("Tools/SchoolRoutePlanning", [
            "initialSelectedSchoolNumber",
            "regionalPrimarySchoolName",
            "regionalPrimarySchoolNumber",
            "selectedSchoolNumber",
            "sortedSchools"
        ]),

        /**
         * Getter for sorted school attributes.
         * @returns {Object[]} The schools contains id and name with address.
         */
        sortedSchoolAttributes () {
            const sortedSchoolAttributes = this.sortedSchools.map(school => {
                return {
                    id: school.get("schul_id"),
                    name: `${school.get("schulname")}, ${school.get("adresse_strasse_hausnr")}`
                };
            });

            return sortedSchoolAttributes;
        }
    },
    watch: {
        /**
         * Select a school, if this tool is already open.
         * @param {Object} value The number of the school.
         * @returns {void}
         */
        initialSelectedSchoolNumber (value) {
            this.selectSchoolNumber(value?.id, value?.name);
        },

        /**
         * Watcher for selectedSchoolNumber
         * @param {Object} schoolNumber The number of the school.
         * @returns {void}
         */
        selectedSchoolNumber (schoolNumber) {
            if (schoolNumber?.id && schoolNumber?.name) {
                this.selectSchool({
                    selectedSchoolId: schoolNumber.id,
                    layer: this.layer
                });
            }
        }
    },
    mounted () {
        if (this.initialSelectedSchoolNumber !== "") {
            this.$nextTick(() => {
                this.selectSchoolNumber(this.initialSelectedSchoolNumber.id, this.initialSelectedSchoolNumber.name);
            });
        }
    },
    methods: {
        ...mapMutations("Tools/SchoolRoutePlanning", ["setSelectedSchoolNumber"]),
        ...mapActions("Tools/SchoolRoutePlanning", ["selectSchool"]),

        /**
         * Sets the school number to dropdown.
         * @param {String} schoolNumber The number of the selected school.
         * @param {String} schoolName The name of the selected school.
         * @returns {void}
         */
        selectSchoolNumber (schoolNumber, schoolName) {
            this.setSelectedSchoolNumber({
                id: schoolNumber,
                name: schoolName
            });
        }
    }

};
</script>

<template>
    <div class="mb-3">
        <div class="tool-schoolRoutePlanning-schools-regionalPrimarySchool">
            <span
                v-if="regionalPrimarySchoolName"
                class="d-block"
                :title="$t('additional:modules.tools.schoolRoutePlanning.selectSchool')"
            >
                {{ $t("additional:modules.tools.schoolRoutePlanning.regionalPrimarySchool") }}
                <a
                    role="button"
                    tabindex="0"
                    href="#"
                    :class="regionalPrimarySchoolNumber ? 'd-block' : ''"
                    @click="selectSchoolNumber(regionalPrimarySchoolNumber, regionalPrimarySchoolName)"
                    @keydown.enter="selectSchoolNumber(regionalPrimarySchoolNumber, regionalPrimarySchoolName)"
                >
                    {{ $t(regionalPrimarySchoolName) }}
                </a>
            </span>
        </div>
        <div class="tool-schoolRoutePlanning-schools-multiselect-container">
            <label
                for="tool-schoolRoutePlanning-schools-multiselect"
                class="form-label"
            >
                {{ $t("additional:modules.tools.schoolRoutePlanning.selectSchool") }}
            </label>
            <Multiselect
                id="tool-schoolRoutePlanning-schools-multiselect"
                :value="selectedSchoolNumber"
                track-by="name"
                label="name"
                :show-labels="false"
                :options="sortedSchoolAttributes"
                :option-height="32"
                placeholder=""
                @input="setSelectedSchoolNumber"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .tool-schoolRoutePlanning-schools-regionalPrimarySchool {
        margin-bottom: 1rem;
    }
</style>

<style lang="scss">
    @import "~variables";

    .tool-schoolRoutePlanning-schools-multiselect-container .multiselect, .tool-schoolRoutePlanning-schools-multiselect-container .multiselect__input, .tool-schoolRoutePlanning-schools-multiselect-container .multiselect__single {
        font-family: inherit;
        font-size: $font-size-base;
        color: $black;
        line-height: 1rem;
    }

    .tool-schoolRoutePlanning-schools-multiselect-container .multiselect {
        min-height: 2rem;
        height: 2rem;
    }
    .tool-schoolRoutePlanning-schools-multiselect-container .multiselect .multiselect__tags {
        min-height: 2rem;
        height: 2rem;
        border-radius: 0;
        border: 1px solid #ced4da
    }

    .tool-schoolRoutePlanning-schools-multiselect-container .multiselect .multiselect__select {
        height: 2rem;
    }

    .tool-schoolRoutePlanning-schools-multiselect-container .multiselect .multiselect__select:before {
        top: 50%;
    }

    .tool-schoolRoutePlanning-schools-multiselect-container .multiselect .multiselect__option {
        display: block;
        min-height: 1rem;
        line-height: 0.5rem;
        text-decoration: none;
        text-transform: none;
        position: relative;
        white-space: nowrap;
        padding: 10px 12px;
    }

    .tool-schoolRoutePlanning-schools-multiselect-container .multiselect .multiselect__option--selected {
        background: inherit;
        color: inherit;
        font-weight: inherit;
    }

    .tool-schoolRoutePlanning-schools-multiselect-container .multiselect .multiselect__option--highlight {
        background: $light_blue;
        outline: none;
        color: $white;
        font-weight: inherit;
    }

    .tool-schoolRoutePlanning-schools-multiselect-container .multiselect .multiselect__input {
        font-family: inherit;
        font-size: $font-size-big;
    }
</style>

<script>
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "TemplateAdminFormCard",
    components: {
        DropdownAutocomplete,
        InputText
    },
    props: {
        importedReferenceValue: {
            type: String,
            required: false,
            default: ""
        },
        label: {
            type: String,
            required: true
        },
        originReferenceValue: {
            type: String,
            required: false,
            default: ""
        },
        statData: {
            type: Array,
            required: false,
            default: () => []
        },
        title: {
            type: String,
            required: false,
            default: ""
        },
        unit: {
            type: [String, Boolean],
            required: false,
            default: false
        }
    },
    data () {
        return {
            referenceValue: "",
            selectedStatData: this.title,
            statisticDataList: []
        };
    },
    watch: {
        referenceValue () {
            this.emitSetReferenceValue();
        },
        originReferenceValue (val) {
            this.referenceValue = val;
        },
        selectedStatData (val) {
            let StatDataObj = [];

            this.statData.forEach(stats => {
                if (stats?.data.filter(data => data?.label === val).length) {
                    StatDataObj = stats?.data.filter(data => data?.label === val);
                }
            });

            if (StatDataObj.length) {
                this.$emit("addStatDataObj", StatDataObj[0]);
            }
        }
    },
    mounted () {
        this.referenceValue = typeof this.importedReferenceValue !== "undefined" ? this.importedReferenceValue : "";
        this.statData.forEach(stats => {
            this.statisticDataList.push({"group": stats.category});
            stats.data.forEach(data => {
                this.statisticDataList.push({"label": data.label});
            });
        });
    },
    methods: {
        /**
         * Emits the setReferenceValueList function in TemplateAdminForm component
         * @returns {void}
         */
        emitSetReferenceValue () {
            if (this.selectedStatData !== "") {
                this.$emit("setReferenceValueList", {
                    statisticName: this.selectedStatData,
                    value: this.referenceValue
                });
            }
        },

        /**
         * Checks if the input is number or comma
         * @param {event} e the keypress event
         * @returns {Boolean} true if the input letter is number or comma
         */
        checkNumber (e) {
            const char = String.fromCharCode(e.keyCode);

            if ((/^\d*,?\d*-?\d{0,2}$/).test(char)) {
                return true;
            }
            e.preventDefault();
            return false;
        },

        /**
         * Checks if the last several strings are comma
         * @returns {void}
         */
        checkComma () {
            this.referenceValue = this.referenceValue.replace(/^[,\s]+|[,\s]+$/g, "").replace(/,[,\s]*,/g, ",");
        }
    }
};

</script>

<template lang="html">
    <div class="card shadow mb-3">
        <div class="row g-0">
            <div class="col-md-1 pe-0">
                <button
                    class="btn drag-and-drop shadow-none ps-0 pe-0 pt-3 align-items-center handle"
                    type="button"
                    @click.prevent=""
                >
                    <i class="bi bi-grip-vertical mt-1" />
                </button>
            </div>
            <div class="col-md-11">
                <button
                    class="close-button shadow-none"
                    aria-label="Close"
                    @click.prevent="$emit('removeCard')"
                >
                    <i class="bi bi-x align-middle" />
                </button>
                <div class="card-body ps-2 pe-2 pb-0 pt-3 d-flex">
                    <div class="card-title col-md-7 pe-2">
                        <Dropdown-Autocomplete
                            v-model="selectedStatData"
                            :is-group="true"
                            :items="statisticDataList"
                            :label="$t('additional:modules.cosi.templateAdmin.label.statistic')"
                        />
                    </div>
                    <div class="card-text align-items-center ps-2 pe-4 pb-2 col-md-5">
                        <div class="d-flex">
                            <InputText
                                :id="'reference'"
                                v-model.trim="referenceValue"
                                :label="label"
                                :placeholder="label"
                                @change="checkComma"
                                @keypress="checkNumber($event)"
                            >
                                <span
                                    v-if="unit"
                                    class="unit"
                                >
                                    {{ unit }}
                                </span>
                            </InputText>
                        </div>
                        <span
                            class="form-text"
                        >
                            {{ $t("additional:modules.cosi.templateAdmin.hintNumber") }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "/src/assets/css/mixins.scss";
@import "/src/assets/css/variables";

.card {
    max-width: 100%;
      &:hover {
        border-color: $light_blue;
        .card-title {
           color: $light_blue;
        }
        .drag-and-drop {
            background-color: $light_blue;
            border-right: 1px solid $light_blue;
            i {
                color: $white;
            }
        }
    }
    .card-title {
        font-size: 12px;
        font-family: $font_family_accent;
    }
    .card-text {
        color: #5A5A5A;
        font-size: 11px;
        .unit {
            position: absolute;
            right: 10px;
            top: 30%;
        }
    }
    .input-group-text {
        background-color: $white;
        border-left: none;
    }

    .close-button {
        position: absolute;
        right: 5px;
        i {
            font-size: 18px;
        }
        &:hover {
            background-color: $light_blue;
            color: $white;
        }
    }
    .drag-and-drop {
        height: 100%;
        i {
            font-size: 30px;
            color: #C2C2C2;
        }
    }
    .form-text {
        display: block;
        width: 200px;
    }
}
</style>

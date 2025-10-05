<script>
import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
    name: "TemplateManagerCard",
    components: {
    },
    props: {
        title: {
            type: String,
            required: true
        },
        cardId: {
            type: String,
            required: true
        },
        created: {
            type: String,
            required: true
        },
        selectedTemplate: {
            type: Boolean,
            required: false,
            default: false
        },
        activeTemplate: {
            type: Boolean,
            required: false,
            default: false
        },
        isEnabled: {
            type: Boolean,
            required: false,
            default: true
        }
    },
    computed: {
        ...mapGetters("Modules/TemplateManager", ["currentActiveTemplate", "multiTemplate"]),

        checked: {
            get () {
                return this.activeTemplate;
            },
            set (v) {
                if (v) {
                    this.setCurrentActiveTemplate(this.title);
                }
                else {
                    this.setCurrentActiveTemplate("");
                }
            }
        }
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapMutations("Modules/TemplateManager", ["setCurrentActiveTemplate"]),

        /**
         * Emits which card has been activated and selects it.
         * @returns {void}
         */
        checkActive (evt) {
            const checkbox = document.getElementsByName("template-card");

            if (!this.multiTemplate) {
                Array.prototype.forEach.call(checkbox, el => {
                    if (evt.target.id !== el.id && el.checked === true) {
                        el.checked = false;
                        this.$emit("showTemplate", el.title);
                        this.$emit("activateTemplate", el.title, false);
                    }
                });
            }

            this.$emit("showTemplate", this.title);
            this.$emit("activateTemplate", this.title, evt?.target?.checked);
        },

        /**
         * Shows alert info if there are no districts existed.
         * @param {Boolean} val - the flag if this template is enabled.
         * @returns {void}
         */
        showDistrictInfo (val) {
            if (!val) {
                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.templateManager.errors.templateName")} ${this.title} ${this.$t("additional:modules.tools.cosi.templateManager.errors.notAllowLoaded")}`,
                    category: "Warning",
                    displayClass: "warning"
                });
            }
        }
    }
};
</script>
<template lang="html">
    <div
        class="col col-md-12"
    >
        <div
            class="card h-100"
            :class="!isEnabled ? 'disabled' : ''"
            :isSelected="selectedTemplate"
            :isActive="activeTemplate"
        >
            <div class="card-body p-3">
                <div class="container p-1">
                    <div
                        class="header row"
                    >
                        <i
                            class="card-icon justify-content-center col col-md-1 h4 p-0 align-self-center mb-0"
                            :class="activeTemplate ? 'bi bi-file-earmark-text' : 'bi bi-file-earmark-x' "
                        />
                        <button
                            class="title-button btn pe-0 py-0 btn-block col col-md-8"
                            @click.prevent="$emit('showTemplate', title)"
                        >
                            <h5 class=" card-title pe-0 mb-0">
                                {{ title }}
                            </h5>
                            <div class="created-section mt-0">
                                {{ created }}
                            </div>
                        </button>
                        <label
                            class="switch"
                            :class="isEnabled ? 'middle' : ''"
                            role="button"
                            tabindex="0"
                            @click="showDistrictInfo(isEnabled)"
                            @keydown="showDistrictInfo(isEnabled)"
                        >
                            <input
                                :id="`flexSwitchCheckChecked-${cardId}`"
                                v-model="checked"
                                type="checkbox"
                                name="template-card"
                                :title="title"
                                :disabled="!isEnabled ? 'disabled' : false"
                                @change="checkActive"
                            >
                            <span class="slider round" />
                        </label>
                        <span
                            :class="isEnabled ? 'middle' : ''"
                        >
                            {{ checked ? $t("additional:modules.tools.cosi.templateManager.label.enable") : $t("additional:modules.tools.cosi.templateManager.label.disable") }}
                        </span>
                        <div
                            v-if="!isEnabled"
                            class="hint"
                        >
                            <i class="bi bi-info-circle" />
                            {{ $t("additional:modules.tools.cosi.templateManager.chooseDistricts") }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
.card {
    border: 1px solid $light_grey;
    border-radius: 5px;
    padding-top: 5px;
    &.disabled {
        opacity: 0.5;
    }
   i {
        color: #6E7174;
        font-size: 30px;
   }
    &:hover {
        background-color: #DCE2F3;
    }
    .title-button {
        box-shadow: none;
        text-align: left;
        &:enabled {
            border: none;
            outline: 0;
        }
    }
    .card-title {
        font-size: 12px;
        color: #6E7174;
        font-family: $font_family_accent;
    }
    .created-section {
        font-size: 11px;
        color: #6E7174;
    }
    .middle {
        align-self: center;
    }
    .hint {
        position: absolute;
        right: 0;
        bottom: 5px;
        font-size: 10px;
        i {
            font-size: 14px;
        }
    }
}
.card[isActive='true'] {
    border: 2px solid $light_blue;
    .card-title {
        color: $light_blue;
    }
    i {
        color: $light_blue
    }
}
.card[isSelected='true'] {
    background-color: #DCE2F3;
}

.switch {
    position: relative;
    display: inline-block;
    width: 30px;
    height: 14px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: .4s;
    transition: .4s;
}

.slider:before {
    position: absolute;
    content: "";
    height: 12px;
    width: 12px;
    left: 2px;
    bottom: 1px;
    background-color: white;
    -webkit-transition: .4s;
    transition: .4s;
}

input:checked + .slider {
    background-color: #003063;
}

input:focus + .slider {
    box-shadow: 0 0 1px #003063;
}

input:checked + .slider:before {
    -webkit-transform: translateX(14px);
    -ms-transform: translateX(14px);
    transform: translateX(14px);
}

/* Rounded sliders */
.slider.round {
    border-radius: 14px;
}

.slider.round:before {
    border-radius: 50%;
}
</style>

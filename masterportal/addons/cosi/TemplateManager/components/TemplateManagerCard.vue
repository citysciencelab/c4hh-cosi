<script>
import {mapGetters, mapMutations} from "vuex";
import CustomCard from "../../shared/modules/cards/components/CustomCard.vue";

export default {
    name: "TemplateManagerCard",
    components: {
        CustomCard
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
        }
    }
};
</script>
<template lang="html">
    <div
        class="col col-md-12"
    >
        <CustomCard
            hoverable
            :status="activeTemplate ? 'active' : ''"
            :selected="selectedTemplate"
            :icon="activeTemplate ? 'bi bi-file-earmark-text' : 'bi bi-file-earmark-x'"
        >
            <div
                class="row align-items-center"
            >
                <div
                    class="title-button btn pe-0 py-0 btn-block col col-md-8"
                >
                    <a
                        href="#"
                        class="pe-0 mb-0 stretched-link"
                        :class="activeTemplate ? 'card-title-active' : 'card-title'"
                        @click.prevent="$emit('showTemplate', title)"
                    >{{ title }}</a>
                    <div class="created-section mt-0">
                        {{ created }}
                    </div>
                </div>
                <div class="switch-input col col-md-4">
                    <div
                        v-if="isEnabled"
                        class="form-check form-switch"
                    >
                        <input
                            :id="`flexSwitchCheckChecked-${cardId}`"
                            v-model="checked"
                            type="checkbox"
                            role="switch"
                            name="template-card"
                            :title="title"
                            :aria-label="checked ? $t('additional:modules.tools.cosi.templateManager.label.enable') : $t('additional:modules.tools.cosi.templateManager.label.disable')"
                            class="form-check-input align-self-center"
                            :disabled="!isEnabled ? 'disabled' : false"
                            @change="checkActive"
                        >
                        <label
                            class="form-check-label ps-2 pt-1 me-0"
                            for="template-card"
                        >
                            {{ checked ? $t('additional:modules.tools.cosi.templateManager.label.enable') : $t('additional:modules.tools.cosi.templateManager.label.disable') }}
                        </label>
                    </div>
                    <div
                        v-else
                        class="hint align-items-start text-center"
                    >
                        <i class="bi bi-info-circle me-2" />
                        {{ $t("additional:modules.tools.cosi.templateManager.chooseDistricts") }}
                    </div>
                </div>
            </div>
        </CustomCard>
    </div>
</template>
<style lang="scss" scoped>
.switch-input {
    position: relative;
    z-index: 5000;
}
.card {
    .title-button {
        text-align: left;
        box-shadow: none;
        border: none;
        .card-title {
            color: $dark_grey
        }
        .card-title-active {
            color: $secondary;
        }
    }

    .hint {
        font-size: $font_size_sm;
        i {
            font-size: 14px;
        }
    }
}

.form-check-input {
    width: 2.5rem;
    height: 1.5rem;
}
.form-check-label {
    font-size: $font-size-base * 0.9;
}
</style>

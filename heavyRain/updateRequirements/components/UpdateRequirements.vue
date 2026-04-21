<script>
import {convertColor} from "@shared/js/utils/convertColor";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import HrCard from "../../shared/components/HrCard.vue";
import HrDraw from "../../shared/components/HrDraw.vue";
import HrFooter from "../../shared/components/HrFooter.vue";
import HrHeader from "../../shared/components/HrHeader.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters} from "vuex";

export default {
    name: "UpdateRequirements",
    components: {
        FileUpload,
        HrCard,
        HrDraw,
        HrFooter,
        HrHeader,
        InputText
    },
    data () {
        return {
            currentView: "main",
            currentOpinion: undefined
        };
    },
    computed: {
        ...mapGetters("Modules/UpdateRequirements", ["informationType"]),

        /**
         * Gets the stroke color for draw style.
         * @returns {Number[]} the rgb color code.
         */
        strokeColor () {
            return convertColor(this.currentOpinion?.color, "rgb");
        }
    },
    mounted () {
        this.currentOpinion = this.informationType[0];
    }
};
</script>

<template lang="html">
    <div>
        <template v-if="currentView === 'main'">
            <HrHeader
                :text="$t('additional:modules.updateRequirements.description')"
                :button-text="$t('additional:modules.updateRequirements.createMessage')"
                @click:button="currentView = 'create-new'"
            />

            <hr class="my-3">
            <h5 class="d-flex align-items-center gap-2 mb-3">
                <i class="bi bi-flag-fill" />
                {{ $t('additional:modules.updateRequirements.reportInfoHeading') }}
            </h5>

            <HrCard
                title="Name Lorem Ipsum"
                edit-aria-label="Bearbeiten"
            >
                <template #above-title>
                    <div class="ratio ratio-16x9 border rounded overflow-hidden mb-3">
                        <img
                            src="https://picsum.photos/id/1031/1200/675"
                            alt="Strassenansicht"
                            class="w-100 h-100"
                            style="object-fit: cover;"
                        >
                    </div>
                    <div
                        v-if="typeof currentOpinion !== 'undefined'"
                        class="d-flex flex-column justify-content-end align-items-center gap-2"
                    >
                        <small class="text-body-secondary">{{ currentOpinion.cat }}</small>
                        <span
                            class="badge rounded-pill fw-normal px-3 py-2"
                            :style="{background: currentOpinion.color}"
                        >
                            {{ currentOpinion.name }}
                        </span>
                    </div>
                </template>

                <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <span class="text-body-secondary">erstellt am:</span>
                    <span>04.04.2025</span>
                    <span class="text-body-secondary">|</span>
                    <span class="text-body-secondary">Initiator:</span>
                    <span>Lorem Ipsum</span>
                </div>

                <p class="mb-3">
                    <span class="text-body-secondary">letzte Aktualisierung:</span>
                    <span class="ms-1">11.03.2026</span>
                </p>

                <p class="mb-3">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.
                    Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.
                </p>

                <p class="mb-3">
                    <a
                        href="https://www.infolink.de"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        www.infolink.de
                    </a>
                </p>

                <p class="mb-0">
                    Ansprechpartner
                </p>
            </HrCard>
        </template>
        <template v-else-if="currentView === 'create-new'">
            <h5 class="headline mb-3">
                {{ $t('additional:modules.updateRequirements.createFormTitle') }}
            </h5>
            <p class="mb-3">
                {{ $t('additional:modules.updateRequirements.createNewDescriptionFirst') }}
            </p>
            <p class="mb-5">
                {{ $t('additional:modules.updateRequirements.createNewDescriptionSecond') }}
            </p>
            <HrDraw
                class="mb-4"
                :heading="$t('additional:modules.updateRequirements.drawHeading')"
                :stroke-color="strokeColor"
                @update:drawn-geojson-feature="drawnGeojsonFeature = $event"
            />
            <InputText
                id="update-requirements-name"
                :label="'additional:modules.updateRequirements.form.name'"
                :placeholder="'additional:modules.updateRequirements.form.name'"
            />
            <InputText
                id="update-requirements-initiator"
                :label="'additional:modules.updateRequirements.form.initiator'"
                :placeholder="'additional:modules.updateRequirements.form.initiator'"
            />
            <div class="form-floating mb-3">
                <select
                    id="update-requirements-type"
                    v-model="currentOpinion"
                    class="form-select"
                >
                    <option
                        v-for="(data, key) in informationType"
                        :key="key"
                        :value="data"
                    >
                        {{ data.cat + " " + data.name }}
                    </option>
                </select>
                <label for="update-requirements-type">
                    {{ $t('additional:modules.updateRequirements.form.typeOptional') }}
                </label>
            </div>
            <InputText
                id="update-requirements-contact"
                :label="'additional:modules.updateRequirements.form.contact'"
                :placeholder="'additional:modules.updateRequirements.form.contact'"
            />
            <InputText
                id="update-requirements-comment"
                html-type="textarea"
                :label="'additional:modules.updateRequirements.form.commentOptional'"
                :placeholder="'additional:modules.updateRequirements.form.commentOptional'"
            />
            <InputText
                id="update-requirements-infolink"
                :label="'additional:modules.updateRequirements.form.infolinkOptional'"
                :placeholder="'additional:modules.updateRequirements.form.infolinkOptional'"
            />
            <h5 class="mb-2">
                {{ $t('additional:modules.updateRequirements.form.uploadOptional') }}
            </h5>
            <FileUpload
                class="mb-5"
                :change="() => undefined"
                :drop="() => undefined"
            />
            <HrFooter
                :cancel-text="$t('additional:modules.updateRequirements.cancelButtonLabel')"
                :save-text="$t('additional:modules.updateRequirements.saveButtonLabel')"
                @click:cancel="currentView = 'main'"
                @click:save="currentView = 'main'"
            />
        </template>
    </div>
</template>

<style lang="scss" scoped>
.headline {
    color: $secondary;
    font-family: $font-family_accent;
}
</style>


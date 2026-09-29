<script>
import {createPolygonStyle} from "../../shared/js/createPolygonStyle.js";
import {formatDate} from "../../shared/js/formatDate.js";
import {getClickedWfstFeature} from "../../shared/js/getClickedWfstFeature.js";
import HrCard from "../../shared/components/HrCard.vue";
import HrHeader from "../../shared/components/HrHeader.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";
import layerCollection from "@core/layers/js/layerCollection.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {toImageSrc} from "../../shared/js/toImageSrc.js";
import UpdateEdit from "./UpdateEdit.vue";

export default {
    name: "UpdateRequirements",
    components: {
        HrCard,
        HrHeader,
        HrSnackbar,
        UpdateEdit
    },
    data () {
        return {
            showSnackbar: false,
            snackbarMessage: "",
            snackbarColor: "success"
        };
    },
    computed: {
        ...mapGetters("Modules/UpdateRequirements", ["informationType", "currentRequirement", "currentView", "wfstAttributes", "wfstLayerId"]),

        /**
         * Gets the current opinion.
         * @returns {Object} the current opinion object.
         */
        currentOpinion () {
            return this.informationType.find(type => `${type.cat} ${type.name}` === this.currentRequirement?.formValues?.informationType);
        },

        /**
         * Gets the source of the image of the current report.
         * @returns {String} the source of the image or an empty string, if the report has no image.
         */
        imageSrc () {
            return toImageSrc(this.currentRequirement?.formValues?.image);
        }
    },
    async mounted () {
        if (this.wfstLayerId) {
            await this.addOrReplaceLayer({layerId: this.wfstLayerId, visibility: true});
            // the layer is created by a watcher of the layer config, so it exists after the next tick
            await this.$nextTick();
            layerCollection.getLayerById(this.wfstLayerId)?.setStyle(createPolygonStyle(this.getFeatureColor));
            // the content of a clicked report is shown in the module, so the gfi is not needed
            layerCollection.getLayerById(this.wfstLayerId)?.getLayer()?.set("gfiAttributes", "ignore");
            this.registerListener({type: "singleclick", listener: this.onMapClick, keyForBoundFunctions: "heavyRainUpdateRequirementsClick"});
        }
    },
    unmounted () {
        this.removePointMarker();
        if (this.wfstLayerId) {
            this.unregisterListener({type: "singleclick", listener: this.onMapClick, keyForBoundFunctions: "heavyRainUpdateRequirementsClick"});
            this.replaceByIdInLayerConfig({layerConfigs: [{id: this.wfstLayerId, layer: {visibility: false}}]});
        }
    },
    methods: {
        formatDate,
        ...mapActions(["addOrReplaceLayer", "replaceByIdInLayerConfig"]),
        ...mapActions("Maps", ["placingPointMarker", "registerListener", "removePointMarker", "unregisterListener"]),
        ...mapMutations("Modules/UpdateRequirements", ["setCurrentRequirement", "setCurrentView"]),

        /**
         * Opens the form for a new report.
         * The current report and its marker are reset, so that the new report does not update it.
         * @returns {void}
         */
        createRequirement () {
            this.removePointMarker();
            this.setCurrentRequirement(undefined);
            this.setCurrentView("create-new");
        },

        /**
         * Shows the content of the clicked report and marks the clicked position.
         * Clicks are ignored in the edit view, as the map is used for drawing there.
         * @param {Object} evt the OpenLayers map click event.
         * @returns {void}
         */
        onMapClick (evt) {
            if (this.currentView !== "main") {
                return;
            }

            const requirement = getClickedWfstFeature(evt, this.wfstLayerId, this.wfstAttributes);

            if (requirement) {
                this.setCurrentRequirement(requirement);
                this.placingPointMarker(evt.coordinate);
            }
        },

        /**
         * Gets the color of a saved report on the map by its information type.
         * A report with an unknown information type gets the color of the first information type.
         * @param {module:ol/Feature} feature the saved report.
         * @returns {String|undefined} the hex color.
         */
        getFeatureColor (feature) {
            const value = feature.get(this.wfstAttributes.informationType),
                  type = this.informationType.find(({cat, name}) => `${cat} ${name}` === value);

            return (type || this.informationType[0])?.color;
        },

        /**
         * Shows a snackbar message.
         * @param {String} message the message to display
         * @param {String} color the snackbar color
         * @returns {void}
         */
        showSnackbarMessage (message, color = "success") {
            this.snackbarMessage = message;
            this.snackbarColor = color;
            this.showSnackbar = true;
        }
    }
};
</script>

<template lang="html">
    <div>
        <template v-if="currentView === 'main'">
            <HrHeader
                :text="$t('additional:modules.updateRequirements.description')"
                :button-text="$t('additional:modules.updateRequirements.createMessage')"
                @click:button="createRequirement"
            />
            <hr class="my-3">
            <h5
                v-if="typeof currentRequirement !== 'undefined'"
                class="d-flex align-items-center gap-2 mb-3"
            >
                <i class="bi bi-flag-fill" />
                {{ $t('additional:modules.updateRequirements.reportInfoHeading') }}
            </h5>
            <HrCard
                v-if="typeof currentRequirement !== 'undefined'"
                :title="currentRequirement?.formValues?.name"
                edit-aria-label="Bearbeiten"
                @click:edit="setCurrentView('create-new')"
            >
                <template #above-title>
                    <div
                        v-if="imageSrc"
                        class="ratio ratio-16x9 border rounded overflow-hidden mb-3"
                    >
                        <img
                            :src="imageSrc"
                            :alt="typeof currentRequirement?.formValues?.imageName !== 'undefined' ? currentRequirement.formValues.imageName : currentRequirement?.formValues?.name"
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
                <template #card>
                    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                        <span class="text-body-secondary">
                            {{ $t("additional:modules.updateRequirements.form.createdAt") }}
                        </span>
                        <span>{{ formatDate(currentRequirement?.formValues?.creationDate) }}</span>
                        <span class="text-body-secondary">|</span>
                        <span class="text-body-secondary">Initiator:</span>
                        <span>{{ currentRequirement?.formValues?.initiator }}</span>
                    </div>

                    <p class="mb-3">
                        <span class="text-body-secondary">
                            {{ $t("additional:modules.updateRequirements.form.lastUpdate") }}
                        </span>
                        <span class="ms-1">{{ formatDate(currentRequirement?.formValues?.lastUpdate) }}</span>
                    </p>

                    <p class="mb-3">
                        {{ currentRequirement?.formValues?.comment }}
                    </p>

                    <p class="mb-3">
                        <a
                            :href="currentRequirement?.formValues?.infoLink"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {{ currentRequirement?.formValues?.infoLink }}
                        </a>
                    </p>

                    <p class="mb-0">
                        {{ $t("additional:modules.updateRequirements.form.contact") }}
                    </p>
                    <p class="mb-0">
                        {{ currentRequirement?.formValues?.contactPerson }}
                    </p>
                </template>
            </HrCard>
        </template>
        <template v-else-if="currentView === 'create-new'">
            <UpdateEdit
                @showSnackbarMessage="showSnackbarMessage"
                @click:save="setCurrentView('main')"
                @click:cancel="setCurrentView('main')"
            />
        </template>

        <HrSnackbar
            :model-value="showSnackbar"
            :message="snackbarMessage"
            :color="snackbarColor"
            @update:model-value="val => showSnackbar = val"
        />
    </div>
</template>

<style lang="scss" scoped>
.headline {
    color: $secondary;
    font-family: $font-family_accent;
}
</style>


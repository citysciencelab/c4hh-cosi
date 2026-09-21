<script>
import ButtonGroup from "@shared/modules/buttons/components/ButtonGroup.vue";
import dayjs from "dayjs";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import layerCollection from "@core/layers/js/layerCollection";
import {mapActions, mapGetters} from "vuex";
import {Popover} from "bootstrap";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import {requestGfi} from "@shared/js/api/wmsGetFeatureInfo.js";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";

export default {
    name: "PotentialDamagedBuilding",

    components: {
        ButtonGroup,
        FlatButton,
        InputText
    },

    data () {
        return {
            adjustedDamageClass: undefined,
            adjustmentDate: undefined,
            comment: undefined,
            selectedFeature: undefined
        };
    },

    computed: {
        ...mapGetters("Modules/PotentialDamagedBuilding", ["itemList"]),
        ...mapGetters("Maps", ["clickCoordinate", "resolution", "projection"]),

        /**
         * Returns the GFI attributes of the selected item's WMS layer.
         * @returns {Object} The GFI attributes.
         */
        gfiAttributes () {
            return this.selectedItem?.wmsLayer?.attributes?.gfiAttributes || {};
        },

        /**
         * Returns the formatted adjustment date of the selected feature.
         * @returns {String} The formatted adjustment date.
         */
        formattedAdjustmentDate () {
            return this.selectedFeature?.get("sk_anpdatum") ? dayjs(this.selectedFeature.get("sk_anpdatum")).format("DD.MM.YYYY") : "";
        },

        /**
         * Returns a list of item names extracted from the itemList getter.
         * @returns {Array} List of item names.
         */
        itemNameList () {
            return this.itemList.map(item => ({name: item.name}));
        },

        /**
         * Returns the last updated damage class of the selected feature.
         * @returns {String} The last updated damage class.
         */
        lastUpdatedDamageClass () {
            return this.selectedFeature?.get("sk_aktuell") || "";
        },

        /**
         * Returns the last updated date of the selected feature.
         * @returns {String} The last updated date.
         */
        lastUpdatedDate () {
            return this.selectedFeature?.get("sk_aktdatum") || "";
        },

        /**
         * Returns the currently selected item from the itemList.
         * @returns {Object} The selected item object.
         */
        selectedItem () {
            return this.itemList.find(item => item.selected);
        }
    },

    watch: {
        /**
         * Calls the fetchFeature function with the selected item and the new coordinate.
         * Places a point marker at the new coordinate.
         * @returns {void}
         */
        clickCoordinate: {
            handler (coordinate) {
                this.placingPointMarker(coordinate);
                this.fetchFeature(this.selectedItem, coordinate, this.resolution, this.projection);
            },
            deep: true
        }
    },

    mounted () {
        this.toggleLayerVisibility(this.itemList);
    },

    unmounted () {
        this.removePointMarker();
        this.hideSelectedItem(this.selectedItem);
    },

    methods: {
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapActions("Maps", ["placingPointMarker", "removePointMarker"]),

        /**
         * Fetches the feature information for the specified item at the given coordinate.
         * @params {Object} item - The item for which to fetch feature information.
         * @params {Array} coordinate - The coordinate at which to fetch the feature.
         * @params {Number} resolution - The map resolution.
         * @params {String} projection - The map projection.
         * @returns {void}
         */
        fetchFeature (item, coordinate, resolution, projection) {
            if (typeof item.wmsLayer === "undefined") {
                item.wmsLayer = layerCollection.getLayerById(item.wmsId);
            }

            const url = item.wmsLayer.getLayerSource().getFeatureInfoUrl(
                coordinate,
                resolution,
                projection,
                {INFO_FORMAT: item.wmsLayer.get("infoFormat")}
            );

            requestGfi("text/xml", url, item.wmsLayer).then(featureList => {
                this.selectedFeature = featureList[0];
                this.setDataFromFeature(this.selectedFeature);
                this.$nextTick(this.initializePopovers);
            });
        },

        /**
         * Hides the specified WMS layer represented by the given item.
         * @param {Object} item - The item representing the WMS layer to hide.
         * @returns {void}
         */
        hideSelectedItem (item) {
            this.replaceByIdInLayerConfig({
                layerConfigs: [{
                    id: item.wmsId,
                    layer: {
                        id: item.wmsId,
                        visibility: false
                    }
                }]
            });
        },

        /**
         * Initializes Bootstrap popovers after their trigger elements are rendered.
         * @returns {void}
         */
        initializePopovers () {
            const popoverTriggerList = document.querySelectorAll("[data-bs-toggle='popover']");

            [...popoverTriggerList].forEach(popoverTrigger => Popover.getOrCreateInstance(popoverTrigger));
        },

        /**
         * Renames all feature properties by adding the required namespace prefix.
         * @param {ol/Feature} feature - The feature whose properties are renamed.
         * @param {String} prefix - The namespace prefix to be added to each property.
         * @returns {void}
         */
        prefixFeatureProperties (feature, prefix) {
            Object.entries(feature.getProperties()).forEach(([key, value]) => {
                feature.set(`${prefix}${key}`, value);
                feature.unset(key);
            });
        },

        /**
         * Sets the component data based on the provided feature.
         * @params {Object} feature - The feature from which to extract data.
         * @returns {void}
         */
        setDataFromFeature (feature) {
            this.adjustedDamageClass = feature?.get("sk_angepasst") || "";
            this.adjustedDate = feature?.get("sk_anpdatum") || "";
            this.comment = feature?.get("kommentar") || "";
        },

        /**
         * Sets the feature properties based on the component data.
         * @param {ol/Feature} feature - The feature to which the data is set.
         * @param {String} prefix - The namespace prefix to be added to each property.
         * @returns {void}
         */
        setDataToFeature (feature, prefix) {
            feature.set(`${prefix}sk_angepasst`, this.adjustedDamageClass);
            feature.set(`${prefix}sk_anpdatum`, dayjs().format("YYYY-MM-DD"));
            feature.set(`${prefix}kommentar`, this.comment);
        },

        /**
         * Toggles the visibility of the layers based on their selected state.
         * @params {Array} itemList - The list of layers whose visibility needs to be toggled.
         * @returns {void}
         */
        toggleLayerVisibility (itemList) {
            itemList.forEach(layer => {
                this.replaceByIdInLayerConfig({
                    layerConfigs: [{
                        id: layer.wmsId,
                        layer: {
                            id: layer.wmsId,
                            visibility: layer.selected
                        }
                    }]
                });
            });
        },

        /**
         * Toggles the selected state of the specified layer.
         * @params {String} layerName - The name of the layer to be selected.
         * @params {Array} itemList - The list of layers among which the selection is to be toggled.
         * @returns {void}
         */
        toggleSelectedItem (selectedItem, itemList) {
            itemList.forEach(layer => {
                layer.selected = false;
            });
            selectedItem.selected = true;
        },

        /**
         * Updates the potential damaged building feature with the provided item data.
         * @param {Object} item - The item containing the data to update the feature with.
         * @param {Object} feature - The feature to be updated.
         * @returns {void}
         */
        updatePotentialDamagedBuilding (item, feature) {
            if (typeof item.wfstConfig === "undefined") {
                item.wfstConfig = rawLayerList.getLayerWhere({id: item.wfstId});
            }

            this.prefixFeatureProperties(feature, "de.hh.up:");
            this.setDataToFeature(feature, "de.hh.up:");
            wfs.sendTransaction(this.projection.getCode(), feature, item.wfstConfig.url, item.wfstConfig, "selectedUpdate").then(() => {
                this.selectedFeature = undefined;
                this.removePointMarker();
            }).catch(error => {
                console.error("Transaction failed", error);
            });
        },

        /**
         * Updates the selected item and toggles the visibility of all items.
         * @params {String} name - The name of the item to be updated.
         * @params {Array} itemList - The list of items among which the selection is to be toggled.
         * @returns {void}
         */
        updateSelectedItem (name, itemList) {
            const selectedItem = itemList.find(item => item.name === name);

            this.toggleSelectedItem(selectedItem, itemList);
            this.toggleLayerVisibility(itemList);
            this.selectedFeature = undefined;
            this.removePointMarker();
        }
    }
};
</script>

<template lang="html">
    <p>
        {{ $t("additional:modules.potentialDamagedBuilding.description") }}
    </p>
    <h5 class="mt-3">
        {{ $t("additional:modules.potentialDamagedBuilding.headline.buildingAttributes") }}
    </h5>
    <ButtonGroup
        class="mt-3"
        :buttons="itemNameList"
        group="building_attributes"
        :selected-value="selectedItem?.name"
        @set-selected-button="updateSelectedItem($event, itemList)"
    />
    <template v-if="selectedFeature">
        <h5 class="mt-5">
            {{ $t("additional:modules.potentialDamagedBuilding.headline.buildingOverview") }}
        </h5>
        <div class="row row-cols-1 row-cols-md-2 g-4 justify-content-center">
            <div class="col">
                <div class="overview-card rounded p-3 text-center h-100 d-flex flex-column align-items-center justify-content-center">
                    <span class="value fs-4 d-block text-truncate-custom">{{ lastUpdatedDamageClass }}</span>
                    <span class="box-label d-block lh-sm mb-1">{{ $t("additional:modules.potentialDamagedBuilding.damagePotentialClass") }}</span>
                    <span class="comment d-block small">{{ $t("additional:modules.potentialDamagedBuilding.currentlyUsed") }}</span>
                    <button
                        type="button"
                        class="btn btn-link p-0 text-dark border-0"
                        tabindex="0"
                        data-bs-toggle="popover"
                        data-bs-placement="bottom"
                        data-bs-trigger="focus"
                        :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.damagePotentialClass')"
                    >
                        <i class="bi bi-info-circle" />
                    </button>
                </div>
            </div>
            <div class="col">
                <div class="overview-card rounded p-3 text-center h-100 d-flex flex-column align-items-center justify-content-center">
                    <span class="value fs-5 d-block text-truncate-custom">{{ lastUpdatedDate }}</span>
                    <span class="box-label d-block lh-sm mb-1">{{ $t("additional:modules.potentialDamagedBuilding.updateDateLabel") }}</span>
                    <span class="comment d-block small">{{ $t("additional:modules.potentialDamagedBuilding.lastUpdate") }}</span>
                    <button
                        type="button"
                        class="btn btn-link p-0 text-dark border-0"
                        tabindex="0"
                        data-bs-toggle="popover"
                        data-bs-placement="bottom"
                        data-bs-trigger="focus"
                        :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.updateDate')"
                    >
                        <i class="bi bi-info-circle" />
                    </button>
                </div>
            </div>
        </div>
        <h5 class="headline mt-5 mb-3">
            <i class="bi bi-pencil-fill me-3" />
            {{ $t("additional:modules.potentialDamagedBuilding.headline.updateData") }} {{ selectedItem.name }}
        </h5>
        <div class="d-flex gap-1 align-items-center card-hint">
            <span class="mt-1">
                {{ $t("additional:modules.potentialDamagedBuilding.lastUpdatedHint") }}
            </span>
            <span class="ms-2">
                {{ formattedAdjustmentDate }}
            </span>
        </div>
        <div class="row g-3 mt-2">
            <div class="col-12 col-md-5">
                <div class="card shadow p-2 h-100">
                    <div class="card-body">
                        <h6 class="headline card-title">
                            {{ $t("additional:modules.potentialDamagedBuilding.headline.adjustedDamagePotentialClass") }}
                        </h6>
                        <span class="card-hint">
                            {{ $t("additional:modules.potentialDamagedBuilding.adjustedDamagePotentialClassHint") }}
                        </span>
                        <InputText
                            id="adjusted-potential-damaged-class"
                            v-model="adjustedDamageClass"
                            class="mt-3"
                            :label="$t('additional:modules.potentialDamagedBuilding.damagePotentialClass')"
                            :max="6"
                            :min="1"
                            :placeholder="$t('additional:modules.potentialDamagedBuilding.damagePotentialClass')"
                            :type="'number'"
                        />
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-7">
                <div class="card shadow p-2 h-100">
                    <div class="card-body">
                        <h6 class="headline card-title">
                            {{ $t("additional:modules.potentialDamagedBuilding.headline.comment") }}
                        </h6>
                        <span class="card-hint">
                            {{ $t("additional:modules.potentialDamagedBuilding.commentHint") }}
                        </span>
                        <InputText
                            id="comment-text"
                            v-model="comment"
                            class="mt-3"
                            html-type="textarea"
                            max-length="255"
                            :label="$t('additional:modules.potentialDamagedBuilding.headline.comment')"
                            :placeholder="$t('additional:modules.potentialDamagedBuilding.headline.comment')"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-4">
            <FlatButton
                id="reset"
                icon="bi bi-arrow-counterclockwise"
                :secondary="true"
                :aria-label="$t('additional:modules.potentialDamagedBuilding.reset')"
                :text="$t('additional:modules.potentialDamagedBuilding.reset')"
                @click="setDataFromFeature(selectedFeature)"
            />
            <FlatButton
                id="save"
                icon="bi bi-save"
                :aria-label="$t('additional:modules.potentialDamagedBuilding.save')"
                :text="$t('additional:modules.potentialDamagedBuilding.save')"
                @click="updatePotentialDamagedBuilding(selectedItem, selectedFeature)"
            />
        </div>
        <h5 class="headline mt-5 mb-3">
            <i class="bi bi-file-text me-3" />
            {{ $t("additional:modules.potentialDamagedBuilding.headline.potentialDamagedInformation") }} {{ selectedItem.name }}
        </h5>
        <div class="mb-4">
            <div class="d-flex align-items-center mb-2">
                <h6 class="headline-group mb-0">
                    {{ $t("additional:modules.potentialDamagedBuilding.headline.potentialDamagedClass") }}
                </h6>
                <button
                    type="button"
                    class="btn btn-link p-0 text-dark border-0"
                    tabindex="0"
                    data-bs-toggle="popover"
                    data-bs-placement="bottom"
                    data-bs-trigger="focus"
                    :data-bs-content="$t('additional:modules.potentialDamagedBuilding.description')"
                >
                    <i class="ms-2 bi bi-info-circle" />
                </button>
            </div>
            <div class="row g-0 mb-1 ms-4">
                <div class="col-4 col-md-8 box-label">
                    {{ gfiAttributes.sk_aktuell }}
                </div>
                <div class="col text-muted">
                    {{ lastUpdatedDamageClass }}
                </div>
            </div>
            <div class="row g-0 mb-1 ms-4">
                <div class="col-4 col-md-8 box-label">
                    {{ gfiAttributes.sk_aktdatum?.name }}
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("sk_aktdatum") }}
                </div>
            </div>
            <div class="row g-0 mb-1 ms-4">
                <div class="col-4 col-md-8 box-label">
                    {{ gfiAttributes.sk_basis }}
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("sk_basis") }}
                </div>
            </div>
            <div class="row g-0 mb-1 ms-4">
                <div class="col-4 col-md-8 box-label">
                    {{ gfiAttributes.sk_angepasst }}
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("sk_angepasst") }}
                </div>
            </div>
            <div class="row g-0 mb-1 ms-4">
                <div class="col-4 col-md-8 box-label">
                    {{ gfiAttributes.sk_anpdatum?.name }}
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("sk_anpdatum") }}
                </div>
            </div>
            <div class="row g-0 mb-1 ms-4">
                <div class="col-4 col-md-8 box-label">
                    {{ gfiAttributes.kommentar }}
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("kommentar") }}
                </div>
            </div>
        </div>
        <div class="mb-4">
            <div class="d-flex align-items-center mb-2">
                <h6 class="headline-group mb-0">
                    {{ $t("additional:modules.potentialDamagedBuilding.headline.buildingFunction") }}
                </h6>
                <button
                    type="button"
                    class="btn btn-link p-0 text-dark border-0"
                    tabindex="0"
                    data-bs-toggle="popover"
                    data-bs-placement="bottom"
                    data-bs-trigger="focus"
                    :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.buildingKey')"
                >
                    <i class="ms-2 bi bi-info-circle" />
                </button>
            </div>
            <div class="row g-0 mb-1 ms-4">
                <div class="col-4 col-md-8 box-label">
                    {{ gfiAttributes.gfk }}
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("gfk") }}
                </div>
            </div>
            <div class="row g-0 ms-4">
                <div class="col-4 col-md-8 box-label">
                    {{ gfiAttributes.bezgfk }}
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("bezgfk") }}
                </div>
            </div>
        </div>
        <div class="mb-4">
            <div class="d-flex align-items-center mb-2">
                <h6 class="headline-group mb-0">
                    {{ $t("additional:modules.potentialDamagedBuilding.headline.additionalBuildingFunction") }}
                </h6>
                <button
                    type="button"
                    class="btn btn-link p-0 text-dark border-0"
                    tabindex="0"
                    data-bs-toggle="popover"
                    data-bs-placement="bottom"
                    data-bs-trigger="focus"
                    :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.additionalBuildingFunction')"
                >
                    <i class="ms-2 bi bi-info-circle" />
                </button>
            </div>
            <div class="row g-0 mb-1 ms-4">
                <div class="col-4 col-md-8 box-label">
                    {{ gfiAttributes.wgf }}
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("wgf") }}
                </div>
            </div>
            <div class="row g-0 ms-4">
                <div class="col-4 col-md-8 box-label">
                    {{ gfiAttributes.bezwgf }}
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("bezwgf") }}
                </div>
            </div>
        </div>
        <div class="mb-4">
            <h6 class="headline-group mb-2">
                {{ $t("additional:modules.potentialDamagedBuilding.headline.additionalInformation") }}
            </h6>
            <div class="row g-0 mb-1 ms-4">
                <div class="col-4 col-md-8 d-flex align-items-center">
                    <span class="box-label">{{ gfiAttributes.bezofl }}</span>
                    <button
                        type="button"
                        class="btn btn-link p-0 text-dark border-0 lh-1"
                        tabindex="0"
                        data-bs-toggle="popover"
                        data-bs-placement="bottom"
                        data-bs-trigger="focus"
                        :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.earthSurface')"
                    >
                        <i class="ms-2 bi bi-info-circle" />
                    </button>
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("bezofl") }}
                </div>
            </div>
            <div class="row g-0 ms-4">
                <div class="col-4 col-md-8 d-flex align-items-center">
                    <span class="box-label"> {{ gfiAttributes.bezbat }} </span>
                    <button
                        type="button"
                        class="btn btn-link p-0 text-dark border-0 lh-1"
                        tabindex="0"
                        data-bs-toggle="popover"
                        data-bs-placement="bottom"
                        data-bs-trigger="focus"
                        :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.buildingConstructionType')"
                    >
                        <i class="ms-2 bi bi-info-circle" />
                    </button>
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("bezbat") }}
                </div>
            </div>
            <div class="row g-0 ms-4">
                <div class="col-4 col-md-8 d-flex align-items-center">
                    <span class="box-label"> {{ gfiAttributes.check_ug }} </span>
                    <button
                        type="button"
                        class="btn btn-link p-0 text-dark border-0 lh-1"
                        tabindex="0"
                        data-bs-toggle="popover"
                        data-bs-placement="bottom"
                        data-bs-trigger="focus"
                        :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.basementLevels')"
                    >
                        <i class="ms-2 bi bi-info-circle" />
                    </button>
                </div>
                <div class="col text-muted">
                    {{ selectedFeature.get("check_ug") }}
                </div>
            </div>
        </div>
    </template>
</template>

<style lang="scss" scoped>

.overview-card {
    background-color: $primary;
    min-width: 0;
    hyphens: auto;
    word-wrap: break-word;

    span {
        display: block;
        inline-size: 100%;
        overflow-wrap: break-word;
    }
    .value {
        font-family: $font_family_accent;
        font-size: clamp(1.2rem, 4vw, 2rem);
        color: $secondary;
    }
    .comment {
        font-size: $font_size_sm;
        color: $dark_grey;
        font-size: clamp(0.85rem, 3vw, 1rem);
    }
    span:not(.value) {
        font-size: clamp(0.8rem, 2vw, 1rem);
        line-height: 1.2;
    }
}
.headline {
    color: $secondary;
    font-family: $font-family_accent;
}
.headline-group {
    color: $secondary;
}
.box-label {
    font-family: $font-family_accent;
}
.card-hint {
    font-size: $font_size_sm;
}
</style>


<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {formatDateTime} from "../../utils/dateHelpers";
import SelectableList from "../SelectableList.vue";
import GeoMarkerForm from "../GeoMarkerForm.vue";

export default {
    name: "TabListContent",
    components: {
        IconButton,
        SelectableList,
        GeoMarkerForm
    },
    props: {
        tabActive: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            selectedListItemId: null,
            savingInProgress: false,
            showList: true,
            geoMarkerUpdateMode: false,
            originalCoordinates: null,
            selectedFeatureIsGemisEditNotAllowed: false,
            formRenderKey: 0
        };
    },
    computed: {
        ...mapGetters("Modules/GeoMarker", [
            "geoMarkerFeatureList",
            "geoMarkerShortFeatureId",
            "geoMarkerState",
            "geoMarkerFeatureSelected",
            "geoMarkerWfsFeatureType",
            "categories",
            "departments",
            "geoMarkerUpdateFeature",
            "isGemisFeature"
        ]),
        ...mapGetters("Menu", [
            "currentMenuWidth",
            "expanded"
        ]),
        ...mapGetters(["restServiceById"]),
        tableData () {
            return {
                headers: [
                    {
                        itemProperty: "zeitstempel",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.zeitstempel"),
                        sortable: "date",
                        sortableDateFormat: "DD.MM.YYYY HH:mm"
                    },
                    {
                        itemProperty: "status",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.status"),
                        sortable: "string"
                    },
                    {
                        itemProperty: "beschreibung",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.beschreibung"),
                        cssClass: "clamp",
                        sortable: "string"
                    },
                    {
                        itemProperty: "kategorie",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.kategorie"),
                        sortable: "string"
                    },
                    {
                        itemProperty: "quelle",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.quelle"),
                        sortable: "string"
                    },
                    {
                        itemProperty: "id",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.id"),
                        sortable: "numeric"
                    }
                ],
                items: this.geoMarkerFeatureList?.map(item => {
                    const featureProperties = item.getProperties(),
                        geoMarkerState = this.geoMarkerState(featureProperties);

                    return {
                        zeitstempel: featureProperties.zeitstempel
                            ? formatDateTime(featureProperties.zeitstempel)
                            : null,
                        status: geoMarkerState
                            ? this.$t("additional:modules.geoMarker.status." + geoMarkerState)
                            : null,
                        beschreibung: featureProperties.beschreibung ?? null,
                        kategorie: featureProperties.kategorie ?? null,
                        quelle: featureProperties.quelle ?? null,
                        id: this.geoMarkerShortFeatureId(item.getId()),
                        // Feature id, not visible in table, but required to access the feature later.
                        featureId: item.getId()
                    };
                })
            };
        },
        countGeoMarker () {
            return this.geoMarkerFeatureList?.length + " " + this.$t("additional:modules.geoMarker.filter.countGeoMarker");
        },
        geoMarkerUpdateFeatureCoordinates () {
            return this.geoMarkerUpdateFeature
                ? this.geoMarkerUpdateFeature.getGeometry().getCoordinates()
                : null;
        }
    },
    watch: {
        geoMarkerFeatureSelected (feature) {
            if (feature) {
                this.removePointMarker();
                this.placingPointMarker(feature?.getGeometry().getCoordinates());
            }

            this.defineUpdateLayers();
        },
        async tabActive (val) {
            this.unregisterListener({type: "click", listener: this.requestGFI, keyForBoundFunctions: "geoMarkerRequestGFIEvent"});

            if (val) {
                await this.$nextTick();

                this.registerListener({type: "click", listener: this.requestGFI, keyForBoundFunctions: "geoMarkerRequestGFIEvent"});

                this.$refs.selectableList.restoreScroll();
            }
            else {
                this.$refs.geoMarkerForm?.releaseFeatureLockOnTabChange();
            }
        }
    },
    methods: {
        ...mapMutations("Modules/GeoMarker", [
            "setGeoMarkerFeatureList",
            "setGeoMarkerFeatureSelected",
            "setGeoMarkerUpdateLayerIds"
        ]),
        ...mapActions("Maps", [
            "setCenter",
            "setZoom",
            "placingPointMarker",
            "removePointMarker",
            "registerListener",
            "unregisterListener"
        ]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Modules/GeoMarker", [
            "setMapInteraction",
            "rollbackGeoMarkerUpdateFeature",
            "requestGFI"
        ]),
        setSelectedFeature (item) {
            const selectedFeature = this.geoMarkerFeatureList.find(feature => feature.getId() === item.featureId);

            this.selectedFeatureIsGemisEditNotAllowed = this.isGemisFeature(selectedFeature);
            this.setGeoMarkerFeatureSelected(selectedFeature);
            this.selectedListItemId = item.id;
        },
        resetSelectedFeature () {
            this.setGeoMarkerFeatureSelected(null);
            this.selectedFeatureIsGemisEditNotAllowed = false;
            this.selectedListItemId = null;
        },
        openVcOblique () {
            const vcObliqueLink = this.restServiceById("oblique").url,
                geometry = this.geoMarkerFeatureSelected
                    ? this.geoMarkerFeatureSelected.getGeometry().clone()
                    : null,
                referenceSystem = mapCollection.getMapView("2D").getProjection().getCode(),
                transformedCoordinates = geometry?.transform(referenceSystem, "EPSG:4326").getCoordinates(),
                useUrl = geometry
                    ? `${vcObliqueLink}?lang=de&groundPosition=${transformedCoordinates[0]},${transformedCoordinates[1]}&distance=250#`
                    : vcObliqueLink;

            window.open(useUrl, "_blank");
        },
        centerVisibleMap (coord = null) {
            let coordinates = coord;

            if (this.geoMarkerFeatureSelected) {
                coordinates = this.geoMarkerFeatureSelected.getGeometry().getCoordinates();
            }

            const map = mapCollection.getMap("2D"),
                pixelAtCoordinates = map?.getPixelFromCoordinate(coordinates),
                rightPadding = this.expanded("secondaryMenu")
                    ? document.getElementById("mp-menu-secondaryMenu").offsetWidth + 20
                    : 20,
                leftPadding = this.expanded("mainMenu")
                    ? document.getElementById("mp-menu-mainMenu").offsetWidth + 20
                    : 20,
                offset = (rightPadding - leftPadding) / 2,
                shiftedPixelX = [pixelAtCoordinates[0] + offset, pixelAtCoordinates[1]],
                shiftedCoordinate = map.getCoordinateFromPixel(shiftedPixelX);

            this.setCenter(shiftedCoordinate);
        },
        zoomToGeoMarker () {
            if (this.geoMarkerFeatureSelected) {
                const map = mapCollection.getMap("2D"),
                    view = map.getView(),
                    setZoom = 8;

                if (view.getZoom() === setZoom) {
                    this.centerVisibleMap();
                }
                else {
                    const onMoveEnd = () => {
                        this.centerVisibleMap();
                        map.un("moveend", onMoveEnd);
                    };

                    map.on("moveend", onMoveEnd);
                    view.setZoom(setZoom);
                }
            }
        },
        onSuccess () {
            this.setUpdateModeParameters();
            this.geoMarkerUpdateMode = false;
        },
        defineUpdateLayers () {
            if (this.geoMarkerFeatureSelected) {
                if (this.geoMarkerUpdateMode) {
                    const updateProperties = this.geoMarkerFeatureSelected.getProperties(),
                        departmentKeys = Object.keys(this.departments),
                        statusProperties = Object.entries(updateProperties)
                            // eslint-disable-next-line no-unused-vars
                            .filter(([key, value]) => ["offen", "inaktiv", "geschlossen"].includes(value)),
                        allUpdateLayers = statusProperties.map(layer => {
                            // The features in the gebaeude layer are stored with the status of the gemis department (sta_gemis).
                            // Since the features in the gemis layer are not editable they should not reach this point and do not need to be treated here.
                            const department = layer[0] === "sta_gemis" ? "gebaeude" : departmentKeys.find(key => {
                                return layer[0].includes(key) ? this.departments[key].layerIds[layer[1]] : null;
                            });

                            return this.departments[department].layerIds[layer[1]];
                        });

                    this.setGeoMarkerUpdateLayerIds(allUpdateLayers);
                    this.setMapInteraction("update");
                }
                else {
                    this.setGeoMarkerUpdateLayerIds([]);
                    this.setMapInteraction(null);
                }
            }
        },
        setUpdateModeParameters () {
            if (this.geoMarkerFeatureSelected) {
                if (this.geoMarkerUpdateMode) {
                    // start updating a feature
                    this.defineUpdateLayers();

                    if (!this.originalCoordinates) {
                        this.originalCoordinates = this.geoMarkerFeatureList
                            .find(feature => feature.getId() === this.geoMarkerFeatureSelected.getId())
                            .getGeometry()
                            .getCoordinates();
                    }
                }
                else {
                    // stop updating a feature (after cancel or save)
                    this.rollbackGeoMarkerUpdateFeature();
                    this.setMapInteraction(null);
                    this.originalCoordinates = null;
                }
            }
        },
        resetGeoMarkerForm () {
            this.$refs.geoMarkerForm?.resetForm();
        },
        changeEditFeatureMode (status) {
            if (!this.selectedFeatureIsGemisEditNotAllowed) {
                if (this.geoMarkerFeatureSelected) {
                    this.geoMarkerUpdateMode = status;
                }

                this.setUpdateModeParameters();
            }
        }
    }
};
</script>

<template>
    <div
        id="tabListContent"
        class="tabListContent"
    >
        <div
            v-if="geoMarkerFeatureList.length"
            class="tabListInfo"
        >
            <p>
                {{ countGeoMarker }}
            </p>

            <p v-if="geoMarkerFeatureSelected">
                {{ $t('additional:modules.geoMarker.GeoMakerList.selectedGeoMarkerWithId',
                      { id: geoMarkerShortFeatureId(geoMarkerFeatureSelected.getId()) })
                }}
            </p>

            <IconButton
                :class-array="['btn-light', 'me-2', 'listAction']"
                :aria="$t('additional:modules.geoMarker.GeoMakerList.button.hideList')"
                :icon="showList ? 'bi-dash-square' : 'bi-plus-square'"
                @click="showList = !showList"
            />
        </div>

        <template v-if="tableData.items?.length">
            <div class="geoMarkerListContainer">
                <SelectableList
                    v-show="showList"
                    ref="selectableList"
                    :selected-item-id="selectedListItemId"
                    :table-data="tableData"
                    @item-selected="setSelectedFeature"
                />

                <div
                    v-if="geoMarkerUpdateMode"
                    class="geoMarkerUpdateOverlay"
                />
            </div>
        </template>

        <div v-else>
            {{ $t("additional:modules.geoMarker.GeoMakerList.tableNoData") }}
        </div>

        <div class="listActionButtons">
            <IconButton
                :class-array="['btn-light', 'me-2', 'listAction']"
                :aria="$t('additional:modules.geoMarker.GeoMakerList.button.zoomToGeoMarker')"
                icon="bi-zoom-in"
                :disabled="!geoMarkerFeatureSelected"
                @click="zoomToGeoMarker()"
            />

            <IconButton
                :class-array="['btn-light', 'me-2', 'listAction']"
                :aria="$t('additional:modules.geoMarker.GeoMakerList.button.centerMapOnGeoMarker')"
                icon="bi-crosshair"
                :disabled="!geoMarkerFeatureSelected"
                @click="centerVisibleMap()"
            />

            <IconButton
                :class-array="['btn-light', 'me-2', 'listAction']"
                :aria="$t('additional:modules.geoMarker.GeoMakerList.button.openVcOblique')"
                icon="bi-image"
                @click="openVcOblique()"
            />
        </div>

        <div
            v-if="geoMarkerFeatureSelected"
            class="geoMarkerEdit"
        >
            <GeoMarkerForm
                ref="geoMarkerForm"
                :key="formRenderKey"
                mode="edit"
                :selected-feature="geoMarkerFeatureSelected"
                @update-successfull="onSuccess()"
                @editing="changeEditFeatureMode"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>

.tabListContent {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;

    div.tabListInfo {
        display: flex;
        justify-content: space-between;
    }

    :deep(div.selectableList) {
        max-height: 25rem;
        min-height: auto;
        flex-shrink: 0;
    }

    :deep(div.selectableList table td.td-item-aktion button) {
        z-index: initial;
        outline: revert;
        margin: 0 auto;
    }

    div.geoMarkerEdit {
        overflow-y: auto;
        flex: 1;
        margin-top: 1rem;
    }

    div.listActionButtons {
        display: flex;
        justify-content: flex-start;
        gap: 0.5rem;
        margin-top: 0.5rem;

        :deep(button.geoMarkerUpdateMode) {
            background-color: $dark_blue;
            border-color: #fdfdff;
            color: white
        }
    }

    div.geoMarkerListContainer {
        position: relative;

        div.geoMarkerUpdateOverlay {
            background: rgba(255,255,255,0.5);
            z-index: 10;
            cursor: not-allowed;
            pointer-events: all;
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
        }
    }
}
</style>

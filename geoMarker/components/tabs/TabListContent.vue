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
    data () {
        return {
            selectedListItemId: null,
            savingInProgress: false,
            showList: true,
            geoMarkerUpdateMode: false,
            showUpdateMessage: false,
            originalCoordinates: null
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
            "geoMarkerUpdateFeature"
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
                    },
                    {
                        itemProperty: "aktion",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.aktion"),
                        sortable: false
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
        geoMarkerUpdateFeatureCoordinates: {
            handler (newValue) {
                if (this.originalCoordinates && newValue) {
                    this.showUpdateMessage = JSON.stringify(newValue) !== JSON.stringify(this.originalCoordinates);
                }
                else {
                    this.showUpdateMessage = false;
                }
            },
            deep: true
        }
    },
    methods: {
        ...mapMutations("Modules/GeoMarker", [
            "setGeoMarkerFeatureList",
            "setGeoMarkerFeatureSelected",
            "setGeoMarkerUpdateLayerIds"
        ]),

        ...mapActions("Maps", ["setCenter", "setZoom", "placingPointMarker", "removePointMarker"]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Modules/GeoMarker", [
            "setMapInteraction",
            "rollbackGeoMarkerUpdateFeature",
            "loadFeaturesForEditLayer"
        ]),
        setSelectedFeature (item) {
            this.setGeoMarkerFeatureSelected(
                this.geoMarkerFeatureList.find(feature => feature.getId() === item.featureId)
            );

            this.selectedListItemId = item.id;
        },
        resetSelectedFeature () {
            this.setGeoMarkerFeatureSelected(null);

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
        centerVisibleMap () {
            if (this.geoMarkerFeatureSelected) {
                const coordinates = this.geoMarkerFeatureSelected.getGeometry().getCoordinates(),
                    map = mapCollection.getMap("2D"),
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
            }
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
        onCancelEdit () {
            this.rollbackGeoMarkerUpdateFeature();
            this.showUpdateMessage = false;

            if (this.geoMarkerUpdateMode) {
                this.setUpdateModeParameters();
                this.geoMarkerUpdateMode = false;
            }

            this.resetSelectedFeature();
        },
        onSuccess () {
            this.showUpdateMessage = false;
            this.setUpdateModeParameters();
            this.geoMarkerUpdateMode = false;
        },
        defineUpdateLayers () {
            if (this.geoMarkerFeatureSelected) {
                if (this.geoMarkerUpdateMode) {
                    const updateProperties = this.geoMarkerFeatureSelected.getProperties(),
                        departmentKeys = Object.keys(this.departments),
                        updateLayers = Object.entries(updateProperties)
                            // eslint-disable-next-line no-unused-vars
                            .filter(([key, value]) => ["offen", "inaktiv", "geschlossen"].includes(value)),
                        allUpdateLayers = updateLayers.map(layer => {
                            const department = departmentKeys.find(key => {
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
                    this.defineUpdateLayers();

                    if (!this.originalCoordinates) {
                        this.originalCoordinates = this.geoMarkerFeatureList
                            .find(feature => feature.getId() === this.geoMarkerFeatureSelected.getId())
                            .getGeometry()
                            .getCoordinates();
                    }
                    this.showUpdateMessage = false;
                }
                else {
                    this.rollbackGeoMarkerUpdateFeature();
                    this.setMapInteraction(null);
                    this.showUpdateMessage = false;
                    this.originalCoordinates = null;
                }
            }
        },
        toggleUpdateMode () {
            if (this.geoMarkerFeatureSelected) {
                this.geoMarkerUpdateMode = !this.geoMarkerUpdateMode;
            }
        },
        onClickMoveButton () {
            this.toggleUpdateMode();
            this.setUpdateModeParameters();
        },
        resetGeoMarkerForm () {
            this.$refs.geoMarkerForm?.resetForm();
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
                    :selected-item-id="selectedListItemId"
                    :table-data="tableData"
                    @item-selected="setSelectedFeature"
                >
                    <template #cell-aktion>
                        <IconButton
                            class="cellActionIconButton"
                            :aria="$t('additional:modules.geoMarker.GeoMakerList.table.aktionButtonLabel')"
                            icon="bi-eye"
                        />
                    </template>
                </SelectableList>

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
                :class-array="[
                    'btn-light', 'me-2', 'listAction',
                    geoMarkerUpdateMode ? 'geoMarkerUpdateMode' : '']"
                :aria="$t('additional:modules.geoMarker.GeoMakerList.button.moveGeoMarker')"
                icon="bi-arrows-move"
                :disabled="!geoMarkerFeatureSelected"
                @click="onClickMoveButton()"
            />

            <IconButton
                :class-array="['btn-light', 'me-2', 'listAction']"
                :aria="$t('additional:modules.geoMarker.GeoMakerList.button.openVcOblique')"
                icon="bi-image"
                @click="openVcOblique()"
            />

            <p v-if="showUpdateMessage">
                {{ $t('additional:modules.geoMarker.GeoMakerList.updateMessage') }}
            </p>
        </div>
        <div
            v-if="geoMarkerFeatureSelected"
            class="geoMarkerEdit"
        >
            <GeoMarkerForm
                ref="geoMarkerForm"
                mode="edit"
                :selected-feature="geoMarkerFeatureSelected"
                @cancel-edit="onCancelEdit"
                @update-successfull="onSuccess()"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

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

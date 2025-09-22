<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {formatDateTime} from "../../utils/dateHelpers";
import SelectableList from "../SelectableList.vue";

export default {
    name: "TabListContent",
    components: {
        IconButton,
        SelectableList
    },
    data () {
        return {
            selectedListItemId: null
        };
    },
    computed: {
        ...mapGetters("Modules/GeoMarker", [
            "geoMarkerFeatureList",
            "geoMarkerShortFeatureId",
            "geoMarkerState",
            "geoMarkerFeatureSelected",
            "geoMarkerWfsFeatureType"
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
                        itemProperty: "id",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.id")
                    },
                    {
                        itemProperty: "quelle",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.quelle")
                    },
                    {
                        itemProperty: "kategorie",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.kategorie")
                    },
                    {
                        itemProperty: "status",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.status")
                    },
                    {
                        itemProperty: "beschreibung",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.beschreibung"),
                        cssClass: "clamp"
                    },
                    {
                        itemProperty: "zeitstempel",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.zeitstempel")
                    },
                    {
                        itemProperty: "aktion",
                        displayName: this.$t("additional:modules.geoMarker.GeoMakerList.table.aktion")
                    }
                ],
                items: this.geoMarkerFeatureList?.map(item => {
                    const featureProperties = item.getProperties(),
                        geoMarkerState = this.geoMarkerState(featureProperties);

                    return {
                        id: this.geoMarkerShortFeatureId(item.getId()),
                        quelle: featureProperties.quelle ?? "--",
                        kategorie: featureProperties.kategorie ?? "--",
                        status: geoMarkerState
                            ? this.$t("additional:modules.geoMarker.status." + geoMarkerState)
                            : "--",
                        beschreibung: featureProperties.beschreibung ?? "--",
                        zeitstempel: featureProperties.zeitstempel
                            ? formatDateTime(featureProperties.zeitstempel)
                            : "--",
                        // Feature id, not visible in table, but required to access the feature later.
                        featureId: item.getId()
                    };
                })
            };
        },
        countGeoMarker () {
            return this.geoMarkerFeatureList?.length + " " + this.$t("additional:modules.geoMarker.filter.countGeoMarker");
        }
    },
    watch: {
        geoMarkerFeatureSelected (feature) {
            if (feature) {
                this.removePointMarker();
            }

            this.placingPointMarker(feature?.getGeometry().getCoordinates());
        },
        geoMarkerFeatureList () {
            this.removePointMarker();
        }
    },
    methods: {
        ...mapMutations("Modules/GeoMarker", [
            "setGeoMarkerFeatureList",
            "setGeoMarkerFeatureSelected"
        ]),
        ...mapMutations("Menu", ["setExpandedBySide"]),
        ...mapActions("Menu", ["changeCurrentComponent"]),
        ...mapActions("Maps", ["setCenter", "setZoom", "placingPointMarker", "removePointMarker"]),
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
        }
    }
};
</script>

<template>
    <div
        id="tabListContent"
        class="tabListContent"
    >
        <p v-if="geoMarkerFeatureList.length">
            {{ countGeoMarker }}
        </p>

        <template v-if="tableData.items?.length">
            <SelectableList
                :selected-item-id="selectedListItemId"
                :table-data="tableData"
                @item-selected="setSelectedFeature"
            >
                <template #cell-aktion>
                    <IconButton
                        :class="'cellActionIconButton'"
                        :aria="$t('additional:modules.geoMarker.GeoMakerList.table.aktionButtonLabel')"
                        :icon="'bi-eye'"
                    />
                </template>
            </SelectableList>
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
    </div>
</template>

<style lang="scss" scoped>
.tabListContent {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;

    :deep(div.selectableList) {
        max-height: 25rem;
        min-height: auto;
    }

    :deep(div.selectableList table td.td-item-aktion button) {
        z-index: initial;
        outline: revert;
        margin: 0 auto;
    }

    div.listActionButtons {
        display: flex;
        justify-content: flex-start;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
}
</style>

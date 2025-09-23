<script>
import {mapGetters, mapMutations} from "vuex";
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
        }
    },
    methods: {
        ...mapMutations("Modules/GeoMarker", [
            "setGeoMarkerFeatureList",
            "setGeoMarkerFeatureSelected"
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
        }
    }
};
</script>

<template>
    <div
        id="tabListContent"
        class="tabListContent"
    >
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

            <!-- START DEMO ONLY -->
            <div v-if="geoMarkerFeatureSelected">
                <p>
                    Selected GeoMarker: {{ geoMarkerFeatureSelected.getId() }}
                </p>

                <button @click="resetSelectedFeature">
                    (DEMO) Selektion in Liste zurücksetzen
                </button>
            </div>
            <!-- END DEMO ONLY -->
        </template>

        <div v-else>
            {{ $t("additional:modules.geoMarker.GeoMakerList.tableNoData") }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
.tabListContent {
    :deep(div.selectableList) {
        max-height: 25rem;
        min-height: auto;
    }

    :deep(div.selectableList table td.td-item-aktion button) {
        z-index: initial;
        outline: revert;
        margin: 0 auto;
    }
}
</style>

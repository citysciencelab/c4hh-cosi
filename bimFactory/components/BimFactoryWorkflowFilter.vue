<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import GraphicalSelect from "../../../src/shared/modules/graphicalSelect/components/GraphicalSelect.vue";
import TableComponent from "../../../src/shared/modules/table/components/TableComponent.vue";
import SpinnerItem from "../../../src/shared/modules/spinner/components/SpinnerItem.vue";
import FlatButton from "../../../src/shared/modules/buttons/components/FlatButton.vue";
import Polygon from "ol/geom/Polygon.js";
import crs from "@masterportal/masterportalapi/src/crs.js";

export default {
    components: {
        GraphicalSelect,
        TableComponent,
        SpinnerItem,
        FlatButton
    },
    props: {
        config: {
            type: Object,
            required: true
        },
        isOpen: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            data: null,
            drawOptions: {
                "Box": this.$t("common:shared.modules.graphicalSelect.selectBySquare"),
                "Polygon": this.$t("common:shared.modules.graphicalSelect.selectByPolygon")
            }
        };
    },
    computed: {
        ...mapGetters("Maps", ["mode"]),
        ...mapGetters("Modules/GraphicalSelect", [
            "selectedAreaGeoJson"
        ]),
        ...mapGetters("Modules/BimFactory", [
            "filteredData",
            "isLoading",
            "filterLayer",
            "workflowFormData"
        ]),
        displayData () {
            return this.data;
        },
        filterNote () {
            return !this.data && this.selectedAreaGeoJson?.coordinates
                ? this.$t("additional:modules.bimfactory.workflow.components.filter.filterNote")
                : undefined;
        }
    },
    watch: {
        filteredData (newValue) {
            if (this.config.component.renderAs === "table" && newValue.features?.length) {
                const rows = newValue.features?.map(singleFeature => singleFeature?.properties),
                    columns = Object.keys(newValue.features[0]?.properties).map((key, index) => {
                        return {
                            "name": key,
                            "order": "origin",
                            "index": index
                        };
                    });

                this.data = {
                    headers: columns,
                    items: rows
                };
            }
            else if (this.config.component.renderAs === "list") {
                this.data = newValue;
            }
            else {
                this.data = "no data available";
            }
        },
        isOpen (newValue) {
            this.$refs.graphicalSelect.setStatus(newValue);
        },
        selectedAreaGeoJson (newVal) {
            this.data = null;
            this.setWorkflowFormDataBbox("empty");
            this.setGeneratedIfcUrl({});
            this.setFilterLayer(new Polygon(newVal.coordinates));
        },
        mode (newVal) {
            if (newVal === "3D") {
                this.addSingleAlert({
                    content: this.$t("additional:modules.bimfactory.workflow.components.filter.message3D"),
                    category: "warn",
                    title: this.$t("additional:modules.bimfactory.workflow.components.filter.message3DTitle")
                });
            }
        },
        workflowFormData: {
            handler () {
                this.setGeneratedIfcUrl({});
            },
            deep: true
        }
    },
    mounted () {
        if (this.mode === "3D") {
            this.changeMapMode("2D");
        }
    },
    methods: {
        ...mapActions("Maps", ["changeMapMode"]),
        ...mapActions("Modules/BimFactory", ["filterRequests"]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapMutations("Modules/BimFactory", ["setFilterLayer", "setWorkflowFormDataBbox", "setGeneratedIfcUrl"]),
        onFilter () {
            const polygon = new Polygon(this.selectedAreaGeoJson.coordinates),
                bbox = polygon.getExtent(),
                targetProjection = "EPSG:4326",
                sourceProjection = crs.getMapProjection(mapCollection.getMap("2D")),
                bboxLowerLeftCorner = crs.transform(sourceProjection, targetProjection, [Number(bbox[0]), Number(bbox[1])]),
                bboxUpperRightCorner = crs.transform(sourceProjection, targetProjection, [Number(bbox[2]), Number(bbox[3])]),
                transformedBbox = {
                    "min_x": bboxLowerLeftCorner[0],
                    "min_y": bboxLowerLeftCorner[1],
                    "max_x": bboxUpperRightCorner[0],
                    "max_y": bboxUpperRightCorner[1]
                };

            this.filterRequests({bboxLowerLeftCorner, bboxUpperRightCorner, endpoint: this.config.component.endpoint});

            this.setWorkflowFormDataBbox(transformedBbox);

            this.setFilterLayer(polygon);
            this.setGeneratedIfcUrl({});
        }
    }
};

</script>

<template>
    <div class="bimFactoryWorkflowFilter">
        <div class="filterSelect">
            <GraphicalSelect
                ref="graphicalSelect"
                :label="$t('additional:modules.bimfactory.workflow.components.filter.select')"
                :start-geometry="filterLayer"
                :options="drawOptions"
            />
        </div>

        <FlatButton
            :text="config.component.title"
            :interaction="onFilter"
            icon="bi bi-bounding-box-circles"
            :disabled="!selectedAreaGeoJson"
        />

        <span class="filterNote">{{ filterNote }}</span>

        <SpinnerItem
            v-if="isLoading"
            custom-class="spinner"
            class="ms-3"
        />

        <div v-if="typeof displayData === 'object' && displayData?.headers?.length && config.component.renderAs === 'table' && !isLoading">
            <TableComponent
                :data="displayData"
                :max-attributes-to-show="1000"
                :dynamic-column-table="true"
                :fixed-bottom-data="{items: []}"
                table-class="filteredResultsTable"
            />

            <p class="filteredElementsNumber">
                {{ displayData?.items?.length + " " + $t('additional:modules.bimfactory.workflow.components.filter.numberFilteredElement') }}
            </p>
        </div>

        <div v-else-if="displayData?.length && config.component.renderAs === 'list' && !isLoading">
            <span class="selectedTiles">
                {{ displayData?.length + " " + $t('additional:modules.bimfactory.workflow.components.filter.numberSelectedTiles') }}
            </span>

            <ul
                class="responseList"
            >
                <li
                    v-for="(item, index) in displayData"
                    :key="index"
                >
                    {{ item }}
                </li>
            </ul>
        </div>

        <span v-else-if="typeof displayData === 'string' && !isLoading">
            {{ $t('additional:modules.bimfactory.workflow.components.filter.noDataAvailable') }}
        </span>
    </div>
</template>

<style lang="scss">
#bim-factory {
    div.bimFactoryWorkflowFilter {
        width: 100%;

        div.filterSelect {
            margin: 0.5rem 0.75rem 0.5rem 0;
        }

        span.selectedTiles {
            margin-left: 0.25rem;
        }

        ul.responseList {
            list-style-type: none;
        }

        span.filterNote {
            margin-left: 0.25rem;
        }

        div.filteredResultsTable {
            max-height: 20rem;

            table {
                td {
                    white-space: nowrap;

                    p {
                        margin-bottom: 0;
                    }
                }
            }
        }

        p.filteredElementsNumber {
            text-align: right;
            margin-right: 1rem;
        }
    }
}
</style>

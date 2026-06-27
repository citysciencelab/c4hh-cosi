<script>
import {mapGetters, mapActions} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import TableComponent from "@shared/modules/table/components/TableComponent.vue";

export default {
    name: "FeatureListView",
    components: {
        FlatButton,
        TableComponent
    },
    computed: {
        ...mapGetters(["ignoredKeys"]),
        ...mapGetters("Modules/FeatureLister", [
            "maxFeatures",
            "featureCount",
            "shownFeatures",
            "headers",
            "gfiFeaturesOfLayer"
        ]),
        /**
         * Returns the properties of the features in the layer, excluding ignored keys and applying any attribute display settings.
         * The id of the feature is needed to identify the feature for the zoom in the detail view.
         * @returns {Array} - An array of feature properties.
         */
        featureProperties () {
            let items = [];

            if (this.gfiFeaturesOfLayer && this.gfiFeaturesOfLayer.length > 0) {
                items = this.gfiFeaturesOfLayer.map((feature) => {
                    const properties = feature.getProperties(),
                        attributesToShow = feature.getAttributesToShow(),
                        showAll = attributesToShow === "showAll",
                        newProperties = {};

                    Object.keys(properties).forEach((key) => {
                        if (!this.ignoredKeys.includes(key.toUpperCase())) {
                            if (showAll || key in attributesToShow) {
                                const newProperty = showAll ? key : attributesToShow[key];

                                newProperties[newProperty] = properties[key];
                                newProperties.id = feature.id;
                                newProperties.geom = feature.geom;
                            }
                        }
                    });
                    return newProperties;
                });
            }
            return items;
        },
        /**
         * Returns the feature properties and the header in the structure required by the table component.
         * @returns {Object} - An object containing headers and items for the table.
         */
        tableData () {
            if (this.featureProperties.length === 0) {
                return {
                    headers: [],
                    items: []
                };
            }
            return {
                headers: this.headers,
                items: this.featureProperties.slice(0, this.shownFeatures)
            };
        }
    },
    methods: {
        ...mapActions("Modules/FeatureLister", [
            "clickOnFeature",
            "hoverOverFeature",
            "showMore"
        ])
    }
};
</script>

<template>
    <div
        class="table-responsive feature-lister-list-table-container mt-3 mb-3"
    >
        <TableComponent
            id="feature-lister-list-table"
            :data="tableData"
            :filterable="true"
            :enable-settings="true"
            :full-view-enabled="true"
            :sortable="true"
            :sort-alphanumerical="true"
            export-file-name="Feature Lister Export"
            select-mode="row"
            :run-select-row-on-mount="false"
            :run-select-on-hover="true"
            :downloadable="true"
            :download-format="['csv', 'geojson']"
            @rowSelected="row => clickOnFeature(row)"
            @rowOnHover="row => hoverOverFeature(row)"
        />
    </div>
    <div>
        <FlatButton
            id="module-feature-lister-show-more"
            aria-label="$t('commonmodules.featureLister.more')"
            type="button"
            :text="$t('common:modules.featureLister.more')"
            :icon="'bi-plus'"
            :disabled="featureCount <= maxFeatures || shownFeatures === featureCount"
            :interaction="() => showMore()"
        />
        <p
            class="navbar-text feature-lister-list-message"
        >
            {{ $t("common:modules.featureLister.key", {shownFeatures, featureCount}) }}
        </p>
    </div>
</template>

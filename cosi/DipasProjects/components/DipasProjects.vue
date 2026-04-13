<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import Card from "../../shared/modules/cards/components/Card.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import mutations from "../store/mutationsDipasProjects";
import GeoJSON from "ol/format/GeoJSON";
import {Fill, Stroke, Style, Circle, Text} from "ol/style.js";
import {Vector} from "ol/source.js";
import {Heatmap} from "ol/layer.js";
// import {Point} from "ol/geom.js";
// import {generateColorScale, generateColorScaleByColor} from "../../utils/colorScale";
import {getLayerById} from "../../DistrictSelector/utils/prepareDistrictLevels.js";
import {scaleSequential} from "d3-scale";
import {interpolateRdYlGn} from "d3-scale-chromatic";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import axios from "axios";
import {exportAsGeoJson} from "../utils/exportResults";
// import LoaderOverlay from "../../../../../src/utils/loaderOverlay.js";
// import {getCenterOfMass} from "../../utils/features/getCenterOfMass";
import dayjs from "dayjs";
import DipasContributions from "./DipasProjectsContributions.vue";
// import {getModelByAttributes} from "../../utils/radioBridge.js";

export default {
    name: "DipasProjects",
    components: {
        Card,
        IconButton,
        FlatButton,
        ToolInfo,
        DipasContributions
    },
    data () {
        return {
            projectsFeatureCollection: [],
            projectsColors: null,
            projectsActive: {},
            contributions: {},
            selectedStyling: null,
            categoryRainbow: false,
            pollingEnabled: false,
            poll: null,
            isMounted: false,
            scrollPos: "",
            map: undefined,
            projects: [],
            selectedProjectId: null,
            isExpanded: false,
            currentView: "projects"
        };
    },
    computed: {
        ...mapGetters("Modules/DipasProjects", ["baseUrl"]),
        ...mapGetters("Tools/FeaturesList", ["isFeatureActive"]),
        /**
         * @todo refactor: use Map getter "getLayerById" instead of custom method
         */
        ...mapGetters("Maps", {layerById: "getLayerById", projectionCode: "projectionCode"}),
        ...mapGetters("Modules/Language", ["currentLocale"]),
        isProjectActive () {
            return (id) => {
                const projectActive = this.projectsActive[id];

                return projectActive.layer || projectActive.contributions || projectActive.heatmap;
            };
        },
        selectedProject () {
            return this.projects.find(project => project.id === this.selectedProjectId);
        }
    },
    watch: {
        selectedStyling: function () {
            /* for (const [id, value] of Object.entries(this.contributions)) {
                if (value.features.length > 0) {
                    // const model = getModelByAttributes({id: id + "-contributions"});

                    // model.get("layerSource").changed();
                }
            }*/

        //    this.$root.$emit("updateFeaturesList");
        },
        pollingEnabled (state) {
            if (state) {
                this.poll = this.setPolling();
            }
            else {
                clearInterval(this.poll);
            }
        }
    },
    /**
    * @returns {void}
    */
    created () {
        this.map = mapCollection.getMap("2D");
    },
    /**
   * fetches the projects and creates their layer with different color styles
   * @returns {void}
   */
    async mounted () {
        this.initialize();
    },
    methods: {
        ...mapMutations("Modules/DipasProjects", Object.keys(mutations)),
        ...mapActions("Maps", ["zoomToExtent"]),
        ...mapActions("Modules/DipasProjects", ["addLayer"]),
        ...mapActions("Tools/FeaturesList", ["addVectorlayerToMapping", "removeVectorLayerFromMapping"]),
        ...mapMutations("Maps", ["addLayerToMap"]),
        ...mapActions("Tools/Draw", ["createCenterPoint"]),
        getLayerById,

        /**
        * Closes this tool window by setting active to false
        * @returns {void}
        */
        close () {
            this.setActive(false);

            // set the backbone model to active false for changing css class in menu (menu/desktop/tool/view.toggleIsActiveClass)
            // else the menu-entry for this tool is always highlighted
            /* const model = getModelByAttributes({
                id: this.$store.state.Tools.Dipas.id
            }); */

            if (model) {
                model.set("isActive", false);
            }
        },
        /**
         * initializes the component with important data
         * @returns {void}
         */
        async initialize () {
            const fetch = await this.fetchProjects();
            let features = [];

            for (let i = fetch.features.length - 1; i >= 0; i--) {
                if (typeof fetch.features[i].geometry.type === "undefined") {
                    fetch.features.splice(i, 1);
                }
            }

            features = new GeoJSON().readFeatures(fetch);

            this.selectedStyling = "category";
            this.projectsFeatureCollection = this.transformFeatures(features);
            // this.projectsColors = generateColorScale(undefined, "interpolateTurbo", this.projectsFeatureCollection.length).legend.colors;
            for (let i = 0; i < this.projectsFeatureCollection.length; i++) {
                const feature = this.projectsFeatureCollection[i],
                    id = feature.getProperties().id;
                    /* layer = {
                        id: id,
                        name: id,
                        project: true,
                        features: [feature],
                        isBaseLayer: true
                    };*/
                /* style = new Style({
                        fill: new Fill({color: this.projectsColors[i].replace("rgb", "rgba").replace(")", ", 0.4)")}),
                        stroke: new Stroke({color: this.projectsColors[i], width: 4})
                    }), */
                // len = Object.values(feature.get("standardCategories")).length,
                /* colorScale = generateColorScaleByColor(this.projectsColors[i], len),
                    rainbowColorScale = generateColorScale([0, len + 1], "interpolateRainbow").scale,
                    model = await this.addLayer(layer),
                    layerOnMap = this.getLayerById(this.map.getLayers().getArray(), id); */

                /* layerOnMap.setZIndex(0);
                    layerOnMap.setStyle(style);
                    layerOnMap.setVisible(false);
                    model.set("isSelected", false); */

                this.projectsActive[id] = {layer: false, contributions: false, heatmap: false};
                this.contributions[id] = {index: i, colors: {}, rainbowColors: {}, features: [], loading: false};
                /* for (const [catIndex, category] of Object.values(feature.get("standardCategories")).entries()) {
                    //  this.contributions[id].colors[category.name] = colorScale(catIndex);
                    // this.contributions[id].rainbowColors[category.name] = rainbowColorScale(catIndex);
                }*/
            }
            this.prepareProjects();
        },
        /**
         * fetches all projects as a FeatureCollection
         * @returns {Object} the FeatureCollection of all projects in json format
         */
        async fetchProjects () {
            const url = this.baseUrl,
                ret = await axios(url, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
                        "Content-Type": "application/json"
                    }
                }),
                json = await ret.data;

            if (json.error) {
                throw Error(JSON.stringify(json));
            }
            return json;
        },
        /**
         * fetches the contributions of a given project id
         * @param {String} id the id of a previously fetched project
         * @returns {Object} the FeatureCollection of all contributions for the given project id in json format
         */
        async fetchContributions (id) {
            const url = this.baseUrl + "/" + id + "/contributions",
                ret = await axios(url, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
                        "Content-Type": "application/json"
                    }
                }),
                json = await ret.data;

            if (json.error) {
                throw Error(JSON.stringify(json));
            }

            return json;
        },
        /**
         * takes an array of features and passes them to the transformFeature function
         * @param {Array} features an array of features
         * @returns {Array} an array with the transformed features
         */
        transformFeatures (features) {
            features.forEach(feature => this.transformFeature(feature));
            return features;
        },
        /**
         * takes a feature and transforms it to the desired referenceSystem so it can be displayed on the map
         * @param {Object} feature the feature to be transformed
         * @returns {Object} the transformed feature
         */
        transformFeature (feature) {
            const geometry = feature.getGeometry();
            let referenceSystem = feature.get("referenceSystem");

            referenceSystem = referenceSystem === undefined ? "4326" : referenceSystem;
            if (geometry) {
                geometry.transform("EPSG:" + referenceSystem, this.projectionCode);
            }
            return feature;
        },
        /**
         * fetches the contributions for the given project id and transforms those features
         * @param {String} id the id of the project
         * @returns {Array} the transformed features of all contributions
         */
        async getContributionFeatures (id) {
            const fetch = await this.fetchContributions(id),
                features = new GeoJSON().readFeatures(fetch);

            for (const feature of features) {
                if (!feature.get("dipasLocated")) {
                    // const model = getModelByAttributes({id: id}),
                    // center = getCenterOfMass(model.get("features")[0], this.projectionCode, this.projectionCode);

                    // feature.setGeometry(new Point(center));

                    // TODO: Skip these features for transform so there's no need to transform back and forth?
                    let referenceSystem = feature.get("referenceSystem");

                    referenceSystem = referenceSystem === undefined ? "4326" : referenceSystem;
                    feature.getGeometry().transform(this.projectionCode, "EPSG:" + referenceSystem);
                }
            }
            return this.transformFeatures(features);
        },
        /**
         * changes the visibility of the layer for the given project id
         * @param {String} id the project id
         * @param {Boolean} value wether the project layer shall be visible or not
         * @returns {void}
         */
        /* async changeProjectVisibility (id, value) {
            const model = getModelByAttributes({id: id});

            model.set("isSelected", value);
        },*/
        /**
         * @param {Object} id - the project ID
         * @param {Boolean} refresh - if set, contributions will be refreshed in any case
         * @return {Object} the contributions object
         */
        async updateContributionFeatures (id, refresh = false) {
            const projectContributions = this.contributions[id];

            if (refresh || projectContributions.features.length === 0) {
                projectContributions.loading = true;
                const contributions = await this.getContributionFeatures(id);

                for (const feature of contributions) {
                    const geometryType = feature.getGeometry().getType();

                    if (geometryType !== "Point") {
                        // const center = this.createCenterPoint({feature});

                        // feature.setGeometry(new Point(center));
                    }
                    feature.setProperties({
                        originalGeometryType: geometryType,
                        votingPro: String(feature.get("votingPro")),
                        votingContra: String(feature.get("votingContra")),
                        commentsNumber: String(feature.get("commentsNumber"))
                    });
                    feature.setId(feature.get("id"));
                }
                projectContributions.features = contributions;
                projectContributions.loading = false;
            }

            return projectContributions;
        },
        /**
         * changes the visibility of the contributions layer for the given project id
         * @param {Object} feature the project feature
         * @param {Boolean} value wether the contributions layer shall be visible or not
         * @returns {void}
         */
        async changeContributionVisibility (feature, value) {
            const id = feature.get("id"),
                layer = {
                    id: id + "-contributions",
                    name: feature.get("nameFull") + " Beiträge",
                    features: []
                };

            // let model = getModelByAttributes({id: layer.id});

            if (!model) {
                await this.updateContributionFeatures(id);
                layer.features = this.contributions[id].features;
                // model = await this.addLayer(layer);

                const
                    layerOnMap = this.getLayerById(this.map.getLayers().getArray(), layer.id),
                    heatmapLayer = this.getLayerById(this.map.getLayers().getArray(), id + "-heatmap");

                layerOnMap.setZIndex(2);
                layerOnMap.setStyle(this.contributionStyles);
                this.addVectorlayerToMapping(model.attributes);

                if (heatmapLayer) {
                    heatmapLayer.setSource(layerOnMap.getSource());
                }
            }

            model.set("isSelected", value);
        },
        contributionStyles (feature, resolution) {
            const styles = [];

            switch (this.selectedStyling) {
                case "project":
                    styles.push(this.getContributionColorByProject(feature, resolution));
                    break;
                case "category":
                    this.categoryRainbow = false;
                    styles.push(this.getContributionColorByCategory(feature, resolution));
                    break;
                case "categoryRainbow":
                    this.categoryRainbow = true;
                    styles.push(this.getContributionColorByCategory(feature, resolution));
                    break;
                case "voting":
                    styles.push(this.getContributionColorByVoting(feature, resolution));
                    break;
                default:
                    styles.push(null);
                    break;
            }
            if (feature.get("originalGeometryType") !== "Point") {
                const secondaryStyle = new Style();

                if (resolution < 1.5) {
                    secondaryStyle.setText(this.getContributionGeometryLabel());
                }
                styles.push(secondaryStyle);
            }
            if (!feature.get("dipasLocated")) {
                const tertiaryStyle = new Style();

                tertiaryStyle.setText(this.getContributionErrorLabel());
                styles.push(tertiaryStyle);
            }
            return styles;
        },
        /**
         * creates a style for the given feature and resolution
         * @param {ol.Feature} feature the feature to style
         * @param {Number} resolution the current map resolution
         * @returns {void}
         */
        getContributionColorByProject (feature, resolution) {
            const id = feature.get("belongToProject"),
                index = this.contributions[id].index,
                color = this.projectsColors[index],
                text = this.getContributionLabel(feature),
                style = new Style({
                    image: new Circle({
                        radius: 5,
                        fill: new Fill({color: color.replace("rgb", "rgba").replace(")", ", 0.4)")}),
                        stroke: new Stroke({color: "#000", width: 1})
                    })
                });

            if (resolution < 1.5) {
                style.setText(text);
            }
            return style;
        },
        /**
         * creates a style for the given feature and resolution
         * @param {ol.Feature} feature the feature to style
         * @param {Number} resolution the current map resolution
         * @returns {void}
         */
        getContributionColorByCategory (feature, resolution) {
            const id = feature.get("belongToProject"),
                category = feature.get("category");
            let colors;

            if (this.categoryRainbow) {
                colors = this.contributions[id].rainbowColors;
            }
            else {
                colors = this.contributions[id].colors;
            }
            const color = colors[category],
                text = this.getContributionLabel(feature),
                style = new Style({
                    image: new Circle({
                        radius: 5,
                        fill: new Fill({color: color}),
                        stroke: new Stroke({color: "#000", width: 1})
                    })
                });

            if (resolution < 1.5) {
                style.setText(text);
            }
            return style;
        },
        /**
         * creates a style for the given feature and resolution
         * @param {ol.Feature} feature the feature to style
         * @param {Number} resolution the current map resolution
         * @returns {void}
         */
        getContributionColorByVoting (feature, resolution) {
            const colorScale = scaleSequential().interpolator(interpolateRdYlGn),
                properties = feature.getProperties(),
                votingPro = parseInt(properties.votingPro, 10),
                votingContra = parseInt(properties.votingContra, 10),
                weight = (votingPro + 1) / ((votingPro + 1) + (votingContra + 1)),
                color = colorScale(weight),
                text = this.getContributionLabel(feature),
                style = new Style({
                    image: new Circle({
                        // radius: Math.sqrt(votingPro + votingContra) + 5,
                        radius: Math.pow(votingPro + votingContra, 2 / 3) + 3,
                        fill: new Fill({color: color}),
                        stroke: new Stroke({color: "#000", width: 1})
                    })
                });

            if (resolution < 1.5) {
                style.setText(text);
            }
            return style;
        },
        /**
         * changes the visibility of the heatmap layer for the given project id
         * @param {String} id the project id
         * @param {Boolean} value wether the heatmap layer shall be visible or not
         * @returns {void}
         */
        async changeHeatmapVisibility (id, value) {
            const
                layerId = id + "-heatmap",
                // contributionsModel = getModelByAttributes({id: id + "-contributions"}),
                isFeatureActive = this.isFeatureActive;
            let
                layer = this.getLayerById(this.map.getLayers().getArray(), layerId);

            if (!layer) {
                const vector = new Vector();
                let maxVotes = 0;

                if (!this.contributions[id].features) {
                    // LoaderOverlay.show();
                    this.contributions[id].features = await this.getContributionFeatures(id);
                    // LoaderOverlay.hide();
                }
                for (const feature of this.contributions[id].features) {
                    vector.addFeature(feature);
                }

                maxVotes = Math.max(...this.contributions[id].features.map(
                    f => parseInt(f.get("votingPro"), 10) + parseInt(f.get("votingPro"), 10))
                );
                layer = new Heatmap({
                    source: vector,
                    radius: 40,
                    blur: 20,
                    id: layerId,
                    weight: function (feature) {
                        if (!isFeatureActive(feature)) {
                            return 0;
                        }
                        const votingPro = parseInt(feature.get("votingPro"), 10),
                            votingContra = parseInt(feature.get("votingContra"), 10),
                            weight = (votingPro + votingContra) / maxVotes;

                        return weight;
                    }
                });
                layer.setZIndex(1);
                this.map.addLayer(layer);
            }
            /* if (contributionsModel && layer.getSource() !== contributionsModel.get("layerSource")) {
                layer.setSource(contributionsModel.get("layerSource"));
            } */

            layer.setVisible(value);
        },

        getContributionLabel (feature) {
            return new Text({
                font: "16px Calibri,sans-serif",
                fill: new Fill({
                    color: [255, 255, 255]
                }),
                stroke: new Stroke({
                    color: [0, 0, 0],
                    width: 2
                }),
                text: feature.get("id"),
                textAlign: "left",
                offsetY: -8,
                offsetX: 8
            });
        },

        getContributionGeometryLabel () {
            return new Text({
                font: "16px Calibri,sans-serif",
                fill: new Fill({
                    color: [255, 0, 0]
                }),
                stroke: new Stroke({
                    color: [0, 0, 0],
                    width: 2
                }),
                text: "*",
                textAlign: "left",
                offsetY: -8,
                offsetX: -8
            });
        },

        getContributionErrorLabel () {
            return new Text({
                font: "16px Calibri,sans-serif",
                fill: new Fill({
                    color: [255, 0, 0]
                }),
                stroke: new Stroke({
                    color: [0, 0, 0],
                    width: 2
                }),
                text: "?",
                textAlign: "left",
                offsetY: -12,
                offsetX: -2.5
            });
        },

        /* handleColor (id, category) {
            let color;

            if (["project", "voting"].includes(this.selectedStyling)) {
                const index = this.contributions[id].index;

                color = this.projectsColors[index];
            }
            else {
                // let colors = this.contributions[id].colors;

                /* if (this.categoryRainbow) {
                    //  colors = this.contributions[id].rainbowColors;
                }
                // color = colors[category] ? colors[category] : "rgb(0,0,0)";*/
        // }
        // return color;
        // },

        zoomToProject (feature) {
            const extent = feature.getGeometry().getExtent();

            this.zoomToExtent({extent: extent, options: {padding: [20, 20, 20, 20]}});
        },

        getDateString (feature) {
            const startDate = dayjs(feature.get("dateStart")).format("DD.MM.YYYY"),
                endDate = dayjs(feature.get("dateEnd")).format("DD.MM.YYYY");

            return `${startDate} - ${endDate}`;
        },
        exportDipas () {
            const layers = [],
                layersOnMap = [];

            for (const project in this.projectsActive) {
                if (this.projectsActive[project].layer) {
                    layers.push(project);
                }
                if (this.projectsActive[project].contributions) {
                    layers.push(project + "-contributions");
                }
                if (this.projectsActive[project].heatmap) {
                    layers.push(project + "-heatmap");
                }
            }
            for (const layerId of layers) {
                layersOnMap.push(this.getLayerById(this.map.getLayers().getArray(), layerId));
            }
            exportAsGeoJson(layersOnMap);
        },
        /**
         * Sets an automatic polling for new contributions
         * pollingInterval length from store in ms
         * @returns {Number} the interval ID
         */
        setPolling () {
            return setInterval(() => {
                for (const id in this.contributions) {
                    // const model = getModelByAttributes({id: id + "-contributions"});

                    this.updateContributionFeatures(id, true);
                    if (model) {
                        const source = model.get("layerSource");

                        model.set("features", this.contributions[id].features);
                        source.clear();
                        source.addFeatures(this.contributions[id].features);
                    }
                }
            }, this.pollingInterval);
        },

        async scrollPosition (id) {
            await this.$nextTick();
            const target = this.$refs.pdesc.find(el => el.id === id);

            if (!target) {
                return;
            }

            if (target.scrollHeight === target.offsetHeight) {
                this.scrollPos = "";
                return;
            }

            if (target.scrollTop === 0) {
                this.scrollPos = "bottom";
                return;
            }

            if (target.scrollTop > 0 && target.scrollTop < (target.scrollHeight - target.offsetHeight - 3)) {
                this.scrollPos = "both";
                return;
            }

            if (target.scrollTop >= (target.scrollHeight - target.offsetHeight - 3)) {
                this.scrollPos = "top";
                return;
            }

            this.scrollPos = "";
        },
        /**
         * Prepares and formats the projects data.
         * @returns {Object} - The project data.
        */
        prepareProjects () {
            this.projects = this.projectsFeatureCollection.map(feature => {
                const props = feature.getProperties();

                return {
                    id: props.id,
                    title: props.nameFull,
                    categories: Object.values(props.standardCategories).map(cat => cat.name),
                    description: props.description,
                    dateRange: this.getDateString(feature),
                    contributionCount: props.hasParticipatoryText?.length || 0,
                    state: props.proceedingState,
                    website: props.website,
                    owner: props.owner,
                    status: ""
                };
            });
        },
        /**
         * Gets the formatted properties for the UI card component.
         * @param {Object} project - The project data object to be transformed.
         * @returns {Object} - The project data for card component.
        */
        getCardProps (project) {
            return {
                badgeList: [{
                    backgroundColor: project.state === "active" ? "#daefde" : "#3C5F94",
                    color: project.state === "active" ? "#005d00" : "#FFFFFF",
                    text: this.$t(`additional:modules.tools.cosi.dipasProjects.${project.state}`)
                }],
                data: [
                    {value: project.title},
                    {icon: "bi bi-calendar", label: project.dateRange},
                    {icon: "bi bi-card-list", label: `${project.contributionCount} Beiträge`}
                ],
                status: project.status
            };
        },
        /**
         * Gets the selected project by ID and updates its status to active.
         * @param {String} id - the id of the project to select.
         * @returns {void}
         */
        selectProject (id) {
            this.isExpanded = false;

            this.projects.forEach(project => {
                project.status = project.id === id && project.status !== "active" ? "active" : "";
            });
        },
        /**
         * Toggles the expanded view state and scrolls the selected card into view.
         * @param {String} id - the id of the selected project.
         * @returns {void}
         */
        toggleText (id) {
            if (this.isExpanded) {

                this.isExpanded = false;

                setTimeout(() => {
                    const element = document.getElementById(`card-${id}`);

                    if (element) {
                        element.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest"
                        });
                    }
                }, 50);
            }
            else {
                this.isExpanded = true;
            }
        },
        /**
         * Opens a given URL in a new browser tab.
         * @param {String} url - the web address to be opened.
         * @returns {void}
         */
        handleLinkClick (url) {
            if (url) {
                window.open(url, "_blank", "noopener,noreferrer");
            }
        },
        /**
         * Updates the view to display contributions for a specific project.
         * @param {String} id - the id of the project whose contributions should be shown.
         * @returns {void}
         */
        async showProjectContributions (id) {
            this.selectedProjectId = id;

            await this.updateContributionFeatures(this.selectedProjectId);

            this.currentView = "contributions";
            this.isExpanded = false;
        },
        /**
         * Switches the view back to the project overview and resets the scroll position.
         * @returns {void}
         */
        returnToProjects () {
            this.currentView = "projects";

            const element = document.getElementById("dipas");

            if (element) {
                element.scrollIntoView({behavior: "instant"});
            }
        }
    }
};
</script>

<template lang="html">
    <div
        id="dipas"
    >
        <div v-if="currentView === 'projects'">
            <ToolInfo
                :locale="currentLocale"
                :summary="$t('additional:modules.tools.cosi.dipasProjects.summary')"
            />
            <hr>
            <div v-if="projects.length > 0">
                <div class="d-flex justify-content-between align-items-center pb-3 pt-3 ps-2">
                    <h4 class="pb-3">
                        {{ $t('additional:modules.tools.cosi.dipasProjects.projectsHeadline') }}
                    </h4>
                    <IconButton
                        :aria="$t('additional:modules.tools.cosi.dipasProjects.ascending')"
                        icon="bi bi-sort-up"
                        :title="$t('additional:modules.tools.cosi.dipasProjects.ascending')"
                        :interaction="() => ''"
                        :class-array="['btn-light']"
                        :label="$t('additional:modules.tools.cosi.dipasProjects.ascending')"
                    />
                </div>
                <div
                    v-for="project in projects"
                    :id="`card-${project.id}`"
                    :key="project.id"
                    class="px-3"
                >
                    <Card
                        :badge-list="getCardProps(project).badgeList"
                        :data="getCardProps(project).data"
                        :downloadable="true"
                        :removable="false"
                        :link-to="!!project.website"
                        icon="bi-folder2-open"
                        :status="getCardProps(project).status"
                        @click="selectProject(project.id)"
                        @link-opened="handleLinkClick(project.website)"
                    />
                    <div
                        v-if="project.status === 'active'"
                        class="project-details-container"
                    >
                        <div class="text-wrapper p-4">
                            <div :class="['expand-content', { 'is-collapsed': !isExpanded }]">
                                <div class="d-flex flex-column pb-3">
                                    <small
                                        class="cardLabel"
                                    >
                                        {{ $t('additional:modules.tools.cosi.dipasProjects.owner') }}
                                    </small>
                                    <small>
                                        {{ project.owner }}
                                    </small>
                                </div>
                                <div class="d-flex flex-column">
                                    <small
                                        class="cardLabel"
                                    >
                                        {{ $t('additional:modules.tools.cosi.dipasProjects.projectDescription') }}
                                    </small>
                                    <div
                                        class="text-start"
                                        v-html="project.description"
                                    />
                                </div>
                            </div>
                            <div class="d-flex justify-content-center">
                                <button
                                    class="btn btn-link p-0 mt-2 text-decoration-none small d-flex align-items-center"
                                    @click="toggleText(project.id)"
                                >
                                    {{ isExpanded ? 'Schließen' : 'Weiterlesen...' }}
                                    <i :class="['bi ms-1', isExpanded ? 'bi-chevron-up' : 'bi-chevron-down']" />
                                </button>
                            </div>
                        </div>
                        <div class="d-flex justify-content-center py-3">
                            <FlatButton
                                v-if="project.contributionCount !== 0"
                                class="btn-primary"
                                icon="bi bi-card-list"
                                :text="$t('additional:modules.tools.cosi.dipasProjects.showAllContributions')"
                                @click="showProjectContributions(project.id)"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div v-else>
                <div class="d-flex flex-column align-items-center justify-content-center py-10 my-5">
                    <div
                        class="spinner-border text-primary-emphasis mb-4"
                        role="status"
                    />
                    <h6 class="">
                        {{ $t('additional:modules.tools.cosi.dipasProjects.loading') }}
                    </h6>
                </div>
            </div>
        </div>
        <div
            v-else-if="currentView === 'contributions'"
        >
            <DipasContributions
                :project="selectedProject"
                :items="contributions[selectedProjectId]?.features"
                @back="returnToProjects"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>

html {
    scroll-behavior: smooth;
}
.spinner-border {
    width: 3em;
    height: 3rem;
    color: $secondary;
}
.text-wrapper {
    background-color: #f8f9fb;
    border-radius: 15px;
    border: 1px solid rgba(0, 0, 0, 0.03);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
    line-height: 1.6;
}

.cardLabel {
    color: $dark-grey;
    font-family: $font_family_accent;
}

.expand-content {
  transition: max-height 0.5s ease-in-out;
  overflow: hidden;
  white-space: pre-line;
  line-break: loose;
  word-spacing: normal;
}

.expand-content.is-collapsed {
  max-height: 7rem;
  mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
}

.expand-content:not(.is-collapsed) {
  mask-image: none;
  -webkit-mask-image: none;
}

[id^="card-"] {
  scroll-margin-top: 2rem;
}
</style>

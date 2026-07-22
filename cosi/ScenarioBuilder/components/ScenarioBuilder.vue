<script>
// import {getComponent} from "../../../../src/utils/getComponent";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AddCardButton from "../../shared/modules/cards/components/AddCardButton.vue";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import Card from "../../shared/modules/cards/components/Card.vue";
import dayjs from "dayjs";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import getters from "../store/gettersScenarioBuilder";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import mutations from "../store/mutationsScenarioBuilder";
import actions from "../store/actionsScenarioBuilder";
import describeFeatureTypeByLayerId from "../../utils/describeFeatureType";
import beautifyKey from "@shared/js/utils/beautifyKey.js";
// import validateProp, {compareLayerMapping} from "../utils/validateProp";
// import TypesMapping from "../../assets/mapping.types.json";
import Feature from "ol/Feature";
import {featureTagStyleMod, featureTagStyle, toggleTagsOnLayerVisibility} from "../utils/guideLayer";
import getValuesForField from "../utils/getValuesForField";
import getFieldTypeForValue from "../utils/getFieldTypeForValue";
import layerCollection from "@core/layers/js/layerCollection";
import hash from "object-hash";
// import ReferencePicker from "./ReferencePicker.vue";
// import MoveFeatures from "./MoveFeatures.vue";
// import FeatureEditor from "./FeatureEditor.vue";
// import GeometryPicker from "../../components/GeometryPicker.vue";
// import ScenarioManager from "./ScenarioManager.vue";
import Scenario from "../classes/Scenario";
import ScenarioFeature from "../classes/ScenarioFeature";
import SimpleCard from "../../shared/modules/cards/components/SimpleCard.vue";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import {unpackCluster} from "../../utils/features/unpackCluster";
// import {getAddress} from "../../utils/geocode";
// import LoaderOverlay from "../../../../src/utils/loaderOverlay.js";
// import {getModelByAttributes} from "../../utils/radioBridge.js";
import setGeomAttributes from "../../utils/features/setGeomAttributes";
import VectorLayer from "ol/layer/Vector.js";
import Point from "ol/geom/Point";

export default {
    name: "ScenarioBuilder",
    components: {
        AccordionItem,
        AddCardButton,
        AlertMessage,
        Card,
        DropdownAutocomplete,
        FlatButton,
        InputText,
        ToolInfo,
        SimpleCard
    },
    data () {
        return {
            workingLayer: null,
            featureTypeDesc: [],
            featureTypeDescSorted: {
                required: [],
                optional: []
            },
            featureProperties: {},
            beautifyKey: beautifyKey,
            // typesMapping: TypesMapping,
            geometry: undefined,
            valuesForFields: {},
            panel: [0, 1],
            formValid: false,
            isCreated: false,
            editDialog: false,
            editFeature: null,
            map: undefined,
            cards: [],
            showNewScenario: false,
            scenarioTitle: "",
            currentView: "scenario",
            selectedScenario: null,
            objectCards: [],
            currentObject: null,
            showNewObject: false,
            visibleLayerListForDropdown: [],
            selectedLayer: null,
            visibleVectorLayers: [],
            placementMode: false,
            placementMapListener: null,
            objectTitle: "",
            scenarioLayer: null
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Modules/ScenarioBuilder", Object.keys(getters)),
        ...mapGetters("Modules/FeaturesList", ["groupActiveLayer", "activeVectorLayerList"]),
        ...mapGetters("Maps", ["getLayerById", "projectionCode"]),
        ...mapGetters("Modules/Routing", ["geosearchReverse"]),
        ...mapGetters(["layerConfig", "visibleSubjectDataLayerConfigs"]),
        /**
         * Getter and Setter for the manuel coordinates Input for the geometry
         */
        geomCoords: {
            get () {
                return this.geometry ? JSON.stringify(this.geometry.getCoordinates()) : undefined;
            },
            set (v) {
                this.setGeomByInput(v);
            }
        },
        layerItems () {
            return this.visibleVectorLayers.map(layer => ({
                title: layer.getLayer().get("name"),
                value: layer
            }));
        }
    },

    watch: {
        /**
         * Watcher function for the workingLayer.
         * Triggers the retrival of the featureType description and the available values.
         * @param {Object} layerMap - the layerMap of the current working layer.
         * @returns {void}
         */
        /* workingLayer (layerMap) {
            // LoaderOverlay.show();
            this.resetFeature();

            this.describeFeatureTypeByLayerId(layerMap.layerId)
                .then(desc => {
                    const _desc = desc || this.getDescriptionBySource(layerMap.layerId),
                          required = [],
                          optional = [];
                    let geom;

                    for (const field of _desc) {
                        if (compareLayerMapping(field, layerMap)) {
                            required.push(field);
                            this.featureProperties[field.name] = null;
                        }
                        else if (this.typesMapping[field.type] === "geom") {
                            geom = field;
                        }
                        else {
                            optional.push(field);
                        }
                    }
                    this.featureTypeDescSorted = {required, optional, geom};
                    this.featureTypeDesc = _desc;
                    this.asyncGetValuesForField(_desc);
                });
        },*/
        /**
         * Updates the title of the current object and its corresponding card.
         * @param {string} newName - The new name to set for the feature and card text.
         * @returns {void}
         */
        objectTitle (newName) {
            if (!this.currentObject) {
                return;
            }

            this.currentObject.feature.set("name", newName);

            const card = this.objectCards.find(
                item => item.id === this.currentObject.feature.getId()
            );

            if (card) {
                card.text = newName;
            }
        },
        /**
         * Synchronizes visible vector layers and resets the selected layer if it becomes hidden.
         * @returns {void}
         */
        visibleSubjectDataLayerConfigs: {
            handler () {
                this.visibleVectorLayers = this.getVisibleVectorLayers();

                if (!this.visibleVectorLayers.includes(this.selectedLayer)) {
                    this.selectedLayer = null;
                }
            },
            deep: true,
            immediate: true
        },
        /**
         * If the tool is active, activate the select interaction and add overlay to the districtLayers if necessary
         * If the tool is not actvie, deactivate the interactions (select, drag box) and remove overlay if no districts are selected
         * and update the extent of the selected features (districts).
         * @param {boolean} newActive - Defines if the tool is active.
         * @returns {void}
         */
        /* async active (newActive) {
            if (newActive) {
                if (this.geometry) {
                    // wait for 2 ticks for the drawing layer to initialize
                    await this.$nextTick();
                    this.$refs["geometry-picker"].geometry.value = this.geometry;
                    await this.$nextTick();
                }
            }
            else {
                const model = getComponent(this.id);

                if (model) {
                    model.set("isActive", false);
                }
                geomPickerUnlisten(this.$refs["geometry-picker"]);
            }
        }, */
        activeVectorLayerList (layerList) {
            if (this.guideLayer) {
                toggleTagsOnLayerVisibility(this.guideLayer, layerList);
            }
        },
        featureProperties: {
            deep: true,
            handler () {
                this.isCreated = false;
            }
        },
        geometry () {
            this.isCreated = false;
            // this.getAddress(geom);
        }
    },
    /**
     * Lifecycle function, triggers on component initialize. Creates necessary guide and drawing layers.
     * @returns {void}
     */
    async created () {
        this.map = mapCollection.getMap("2D");
        await this.createGuideLayer();
        await this.createScenarioLayer();
    },
    methods: {
        ...mapMutations("Modules/ScenarioBuilder", Object.keys(mutations)),
        ...mapActions("Modules/ScenarioBuilder", Object.keys(actions)),
        ...mapActions("Maps", ["addNewLayerIfNotExists", "placingPointMarker", "removePointMarker"]),
        ...mapMutations("Maps", ["setCenter"]),

        // compareLayerMapping, // the utils function that checks a prop against the layer map
        // validateProp, // the utils function validating the type of props and returning the relevant rules
        describeFeatureTypeByLayerId, // WFS describeFeatureType request based on the rawLayerList

        /**
         * Creates a new scenario, sets it as active, and adds a corresponding card.
         * @returns {void}
         */
        addCard () {
            const scenario = new Scenario(
                this.scenarioTitle,
                this.guideLayer,
                {
                    isActive: true
                }
            );

            this.setActiveScenario(scenario);

            this.cards.push({
                title: this.scenarioTitle,
                data: [
                    {value: this.scenarioTitle},
                    {icon: "bi bi-pencil", label: "Erstellt: " + dayjs().format("DD.MM.YYYY")}
                ],
                downloadable: true,
                icon: "bi bi-bounding-box",
                removable: false
            });
            this.showNewScenario = false;
        },
        /**
         * Generates and adds a new object card based on the provided scenario feature.
         * @param {Object} scenarioFeature - The scenario feature containing the map feature and properties.
         * @returns {void}
         */
        addObjectCard (scenarioFeature) {
            const feature = scenarioFeature.feature,
                  properties = feature.getProperties();

            this.objectCards.push({
                id: feature.getId(),
                icon: "bi bi-box",
                label: properties.facility || this.selectedLayer.getLayer().get("name"),
                text: "Neues Objekt",
                scenarioFeature
            });

        },
        /**
         * Sets the selected scenario and switches the view to the objects management panel.
         * @param {Object} scenario - The scenario instance to open.
         * @returns {void}
         */
        openScenario (scenario) {
            this.selectedScenario = scenario;
            this.currentView = "objects";
        },
        /**
         * Resets the selected scenario and switches the view back to the scenario overview.
         * @returns {void}
         */
        closeScenario () {
            this.selectedScenario = null;
            this.currentView = "scenario";
        },
        /**
         * Creates or retrieves the scenario layer, configures its visibility and z-index, and assigns it.
         * @returns {void}
         */
        async createScenarioLayer () {
            const layer = await this.addNewLayerIfNotExists({
                layerName: this.id + "_scenario_objects"
            });

            layer.setVisible(true);
            layer.setZIndex(20);

            this.scenarioLayer = layer;
        },
        /**
         * Removes a card from the cards array at the specified index.
         * @param {Number} index - Index of the card to be removed
         * @return {void}
         */
        removeCard (index) {
            this.cards.splice(index, 1);
        },
        /* getVisibleLayerList () {
            this.layerIdList = this.getVisibleVectorLayers().map(layer => layer.getLayer().get("name"));

            this.layerIdList.forEach(name => {
                this.visibleLayerListForDropdown.push(name);
            });
        },*/
        /**
         * Activates the placement mode for a specific layer and attaches the click event listener to the map.
         * @param {Object} layer - The map layer where the new feature should be placed.
         * @returns {void}
         */
        startPlacement (layer) {
            if (!layer) {
                return;
            }
            this.selectedLayer = layer;
            this.placementMode = true;
            this.map.on("click", this.placeFeature);
        },
        /**
         * Handles the map click event to create a feature at the clicked coordinates and deactivates the placement mode.
         * @param {Object} evt - The map click event object containing the coordinates.
         * @returns {void}
         */
        placeFeature (evt) {
            const geometry = new Point(evt.coordinate);

            this.createFeature(geometry);
            this.map.un("click", this.placeFeature);
            this.placementMode = false;
        },

        /**
         * Returns all visible vector layers from the layer collection that are of supported types.
         * Supported types include "WFS", "OAF", and "GeoJSON".
         * @returns {Array} An array of visible vector layer objects.
         */
        getVisibleVectorLayers () {
            const supportedLayerTypes = ["WFS", "OAF", "GeoJSON"];

            return layerCollection.getLayers().filter(layer => {
                return layer.getLayer() instanceof VectorLayer && layer?.attributes.visibility === true && layer?.attributes?.isNeverVisibleInTree !== true && supportedLayerTypes.includes(layer.get("typ"));
            });
        },
        /**
         * @description create a guide layer used for additional info to display on the map
         * @returns {void}
         */
        async createGuideLayer () {
            const newLayer = await this.addNewLayerIfNotExists({layerName: this.id + "_layer"});

            newLayer.setVisible(true);
            newLayer.setStyle(function (feature) {
                if (feature.get("isModified") && !feature.get("isSimulation")) {
                    return [featureTagStyleMod(feature)];
                }
                return [featureTagStyle(feature)];
            });
            newLayer.setZIndex(15);
            this.setGuideLayer(newLayer);

            return newLayer;
        },

        /**
         * Resets the new feature properties
         * @returns {void}
         */
        resetFeature () {
            this.featureProperties = {};
            this.geometry = null;
            this.formValid = false;
            // geomPickerResetLocation(this.$refs["geometry-picker"]);
            // geomPickerUnlisten(this.$refs["geometry-picker"]);
        },

        /**
         * Updates the geometry from the geomPicker in the data for later use when instantiating a new feature
         * @param {module:ol/Geometry} geom the new geometry object
         * @returns {void}
         */
        updateGeometry (geom) {
            this.geometry = geom;
        },

        /**
         * Creates a new simulated feature and adds it to the map
         * @todo move to the scenarioFeature constructor?
         * @returns {void}
         */
        createFeature (geometry) {
            const guideLayer = this.guideLayer,
                  feature = new Feature({geometry});
            const sourceLayer = this.selectedLayer?.getLayer();

            if (sourceLayer) {
                const styleFn = sourceLayer.getStyle && typeof sourceLayer.getStyle === "function"
                    ? sourceLayer.getStyle()
                    : sourceLayer.getStyle;

                if (typeof styleFn === "function") {
                    feature.setStyle((resolution) => styleFn(feature, resolution));
                }
                else if (styleFn) {
                    feature.setStyle(styleFn);
                }
            }

            feature.set("isSimulation", true);
            feature.set("sourceLayer", this.selectedLayer.getLayer().get("name"));
            feature.set("sourceLayerId", this.selectedLayer.layerId);


            this.setFeatureProperties(
                feature,
                this.featureProperties,
                geometry
            );

            const scenarioFeature = new ScenarioFeature(feature, this.scenarioLayer, guideLayer);

            this.activeScenario.addFeature(
                scenarioFeature
            );

            this.currentObject = scenarioFeature;
            this.addObjectCard(scenarioFeature);

            this.removePointMarker();
            this.$root.$emit("updateFeature");

            this.isCreated = true;
        },

        /**
         * @param {module:ol/Feature} feature - the feature whose properties to set
         * @param {Object} properties - the dict of properties to add to the feature
         * @param {module:ol/Geometry} geometry - the feature's geometry
         * @returns {void}
         */
        setFeatureProperties (feature, properties, geometry) {
            // delete potential geometry from properties
            if (Object.hasOwnProperty.call(properties, "geometry")) {
                delete properties.geometry;
            }
            // set properties
            feature.setProperties(properties);
            // flag as simulated
            feature.set("isSimulation", true);
            // create unique hash as ID
            feature.setId(hash({...properties, geom: geometry}));

            setGeomAttributes(feature, this.geomAttributes);
            // // set additional attributes based on geometry
            // if (geometry.getType() === "Polygon" || geometry.getType() === "MultiPolygon") {
            //     const area = Math.round((geometry.getArea() + Number.EPSILON) * 100) / 100;

            //     for (const attr of this.areaAttributes) {
            //         feature.set(attr.key, area * attr.factorToSqm);
            //     }
            // }
        },

        /**
         * Asynchronously Retrieves the avaialble values for each field of the featureType
         * stores the result for use in select fields
         * @param {Object[]} desc - the featureType description
         * @returns {void}
         */
        asyncGetValuesForField (desc) {
            this.valuesForFields = {};

            for (const field of desc) {
                getValuesForField(field.name, this.workingLayer.layerId)
                    .then(items => {
                        this.valuesForFields = {
                            ...this.valuesForFields,
                            [field.name]: items
                        };
                    });
            }

            // LoaderOverlay.hide();
        },
        /**
         * Resets the current creation state, clears map markers, and opens the panel to create a new object.
         * @returns {void}
         */
        openNewObject () {
            this.resetFeature();
            this.selectedLayer = null;
            this.objectTitle = "";
            this.currentObject = null;
            this.isCreated = false;
            this.placementMode = false;
            this.removePointMarker();
            this.showNewObject = true;
        },

        /**
         * Sets a reference feature's properties as the properties of the feature to create
         * deletes the original features geom if necessary
         * @param {module:ol/Feature} feature - the feature picked as reference
         * @returns {void}
         */
        getDataFromReferenceFeature (feature) {
            const referenceProps = feature.getProperties();

            if (Object.prototype.hasOwnProperty.call(referenceProps, "geom")) {
                delete referenceProps.geom;
            }

            this.featureProperties = referenceProps;
            this.formValid = this.requiredFieldsSet();
        },

        disableFeatureEditor (state) {
            this.setFeatureEditorDisabled(state);
        },

        mapDataTypes (type) {
            return this.$t(`additional:modules.tools.cosi.dataTypes.${type}`);
        },

        /* async getAddress (geom) {
            const address = await getAddress(geom, this.projectionCode, this.geosearchReverse.type);

            if (address) {
                for (const prop of this.workingLayer.addressField) {
                    this.featureProperties[prop] = "";
                }

                this.$set(this.featureProperties, this.workingLayer.addressField[0], address);
                this.$forceUpdate();
            }
        }, */

        getDescriptionBySource (layerId) {
            const layer = this.getLayerById({layerId: layerId}),
                  feature = layer.getSource().getFeatures()[0];
            let props, desc;

            if (feature) {
                props = feature.getProperties();
                desc = Object.entries(props).map(prop => ({
                    minOccurs: 0,
                    name: prop[0],
                    type: getFieldTypeForValue(prop[1])
                }));

                return desc;
            }

            return [];
        },

        requiredFieldsSet () {
            for (const field of this.featureTypeDescSorted.required) {
                if (!this.featureProperties[field.name]) {
                    return false;
                }
            }

            return true;
        },

        openEditDialog (evt) {
            this.editFeature = null;
            this.map.forEachFeatureAtPixel(evt.pixel, feature => {
                for (const feat of unpackCluster(feature)) {
                    if (feat.get("isSimulation")) {
                        this.editFeature = feat;
                        this.editDialog = true;
                    }
                }
            }, {
                layerFilter: l => {
                    return this.activeVectorLayerList.includes(l);
                }
            });

            if (!this.editFeature) {
                this.editDialog = false;
            }
        },

        deleteFeature () {
            this.activeScenario.removeSimulatedFeature(this.editFeature);
            this.editDialog = false;
        }
    }
};
</script>

<template lang="html">
    <div id="manage-scenario">
        <ToolInfo
            :url="readmeUrl"
            :locale="currentLocale"
        />
        <div v-if="currentView === 'scenario'">
            <h5>
                {{ $t('additional:modules.tools.cosi.scenarioManager.title') }}
            </h5>
            <div
                v-if="cards.length"
                class="mb-4 py-2"
            >
                <div
                    v-for="(item, index) in cards"
                    :key="item"
                >
                    <Card
                        class="d-flex flex-column-reverse"
                        :data="item.data"
                        :downloadable="item.downloadable"
                        :icon="item.icon"
                        :visible="false"
                        @click="openScenario(item)"
                        @remove-set="removeCard(index)"
                    />
                </div>
            </div>
            <AlertMessage
                v-if="!cards.length"
                :text="$t('additional:modules.tools.cosi.scenarioManager.alertNoScenario')"
                type="info"
            />
            <AddCardButton
                class="pt-5 2 mb-4"
                :text="$t('additional:modules.tools.cosi.scenarioManager.createNewScenario')"
                @click="showNewScenario = true"
            />
            <hr class="mx-4">
            <div v-if="showNewScenario">
                <InputText
                    id="scenario-title"
                    v-model="scenarioTitle"
                    :label="$t('additional:modules.tools.cosi.scenarioManager.addScenarioTitle')"
                    :placeholder="$t('additional:modules.tools.cosi.scenarioManager.addScenarioTitle')"
                    max-length="50"
                />
                <div class="d-flex justify-content-center">
                    <FlatButton
                        id="add-scenario"
                        :icon="'bi bi-plus-circle'"
                        type="button"
                        :aria-label="$t('additional:modules.tools.cosi.scenarioManager.addScenario')"
                        :disabled="!scenarioTitle.length"
                        :text="$t('additional:modules.tools.cosi.scenarioManager.addScenario')"
                        :interaction="addCard"
                    />
                </div>
            </div>
        </div>
        <div
            v-if="currentView === 'objects'"
            class="px-3 py-2"
        >
            <div class="d-flex align-items-center mb-3">
                <button
                    id="back-to-overview"
                    type="button"
                    class="btn btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-2"
                    :aria-label="$t('additional:modules.tools.cosi.objectManager.back')"
                    :disabled="!scenarioTitle.length"
                    @click="closeScenario"
                >
                    <i class="bi bi-arrow-left" />
                    <span>{{ $t('additional:modules.tools.cosi.objectManager.back') }}</span>
                </button>
            </div>
            <h5 class="mb-4">
                {{ selectedScenario.title + " - " }}
                {{ $t('additional:modules.tools.cosi.objectManager.title') }}
            </h5>

            <AccordionItem
                id="objects"
                :is-open="true"
                :title="$t('additional:modules.tools.cosi.objectManager.createdObjects')"
                icon="bi bi-box"
            >
                <div class="py-2">
                    <AlertMessage
                        v-if="!objectCards.length"
                        :text="$t('additional:modules.tools.cosi.objectManager.alertNoObject')"
                        type="info"
                    />

                    <div
                        v-for="card in objectCards"
                        :key="card.id"
                        class="mb-3"
                    >
                        <SimpleCard
                            :icon="card.icon"
                            :label="card.label"
                            :text="card.text"
                            @click:close="removeSelectionCard(card)"
                        />
                    </div>
                    <AddCardButton
                        class="w-100"
                        :text="$t('additional:modules.tools.cosi.objectManager.createNewObject')"
                        @click="openNewObject"
                    />
                </div>
            </AccordionItem>
            <hr class="my-4">
            <div
                v-if="showNewObject"
                class="mt-3"
            >
                <h5 class="mb-3">
                    {{ $t('additional:modules.tools.cosi.objectManager.titleEditObject') }}
                </h5>

                <DropdownAutocomplete
                    v-model="selectedLayer"
                    class="flex-grow-1 mb-3"
                    :items="layerItems"
                    :label="$t('additional:modules.tools.cosi.objectManager.selectObject')"
                    @update:model-value="startPlacement"
                />
                <div
                    v-if="placementMode"
                    class="toast-minimal p-3 mb-3 border-0"
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                >
                    <div class="d-flex align-items-start gap-5">
                        <div class="pulse-indicator mt-1 ms-3" />
                        <div class="d-flex flex-column align-items-start text-start">
                            <h5 class="mb-2">
                                {{ $t('additional:modules.tools.cosi.objectManager.setFeatureHeadline') }}
                            </h5>
                            <p class="mb-2 text-muted small lh-sm">
                                {{ $t('additional:modules.tools.cosi.objectManager.setFeature') }}
                            </p>
                            <FlatButton
                                id="cancel-placement"
                                :class-array="['btn-small', 'mt-1']"
                                icon="bi bi-x"
                                type="button"
                                :aria-label="$t('additional:modules.tools.cosi.objectManager.cancelPlacement')"
                                :text="$t('additional:modules.tools.cosi.objectManager.cancelPlacement')"
                            />
                        </div>
                    </div>
                </div>
                <InputText
                    v-if="currentObject"
                    id="scenario-title"
                    v-model="objectTitle"
                    class="mt-2"
                    :label="$t('additional:modules.tools.cosi.objectManager.addObjectTitle')"
                    :placeholder="$t('additional:modules.tools.cosi.objectManager.addObjectTitle')"
                    max-length="50"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #scenario-builder {
        form {
            .row {
                margin-top: 0px;
            }
            .col-3 {
                overflow: hidden;
            }
        }
        .flex {
            display: flex;
            .flex-item {
                margin: 0 2px 0 2px;
            }
        }
    }
    .back-to-overview {
        color: $link-color;
    }
   .toast-minimal {
        background: mix(#ffffff, $light_blue, 50%);
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.03);
        transition: all 0.3s ease;
            h5 {
                color: $secondary;
                font-family: $font_family_accent;
            }
    }
    .pulse-indicator {
        width: 10px;
        height: 10px;
        background-color: $secondary;
        border-radius: 50%;
        position: relative;
        flex-shrink: 0;
        &::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            background-color: $secondary;
            border-radius: 50%;
            animation: pulse-ring 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
        }
    }
    @keyframes pulse-ring {
        0% {
            transform: scale(0.5);
            opacity: 1;
        }
        80%, 100% {
            transform: scale(2.8);
            opacity: 0;
        }
    }
</style>

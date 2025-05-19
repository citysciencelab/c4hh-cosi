<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import SpinnerItem from "../../../src/shared/modules/spinner/components/SpinnerItem.vue";
import FlatButton from "../../../src/shared/modules/buttons/components/FlatButton.vue";

export default {
    components: {
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
            required: true,
            default: false
        }
    },
    data () {
        return {
            openingViewerToSendIfc: false
        };
    },
    computed: {
        ...mapGetters("Modules/BimFactory", [
            "isLoading",
            "workflowFormData",
            "generatedIfcUrl",
            "currentWorkflowId"
        ]),
        ...mapGetters("Menu", [
            "mainMenu",
            "secondaryMenu",
            "currentComponent"
        ]),
        ...mapGetters("Modules/BimViewer", ["bimViewerFullyLoaded"]),
        ...mapGetters(["isMobile"]),
        bimViewerConfigured () {
            let bimViewerConfigured = false;

            this.mainMenu.sections.forEach((section) => {
                bimViewerConfigured = section.find(m => {
                    return m.type === "bimViewer";
                });
            });

            if (!bimViewerConfigured) {
                this.secondaryMenu.sections.forEach((section) => {
                    bimViewerConfigured = section.find(m => {
                        return m.type === "bimViewer";
                    });
                });
            }

            return bimViewerConfigured;
        },
        bimViewerMenuSide () {
            let isInMainMenu = false,
                isInSecondaryMenu = false;

            this.mainMenu.sections.forEach((section) => {
                isInMainMenu = section.find(m => {
                    return m.type === "bimViewer";
                });
            });

            if (isInMainMenu) {
                return "mainMenu";
            }

            this.secondaryMenu.sections.forEach((section) => {
                isInSecondaryMenu = section.find(m => {
                    return m.type === "bimViewer";
                });
            });

            if (isInSecondaryMenu) {
                return "secondaryMenu";
            }

            return "";
        },
        ifcUrl () {
            return this.generatedIfcUrl ? this.generatedIfcUrl[this.currentWorkflowId] : "";
        }
    },
    watch: {
        bimViewerFullyLoaded (val) {
            if (val && this.openingViewerToSendIfc) {
                this.sendIfcToViewer();
                this.openingViewerToSendIfc = false;
            }
        }
    },
    methods: {
        ...mapActions("Modules/BimFactory", ["submitCreateIfcRequest", "forceFileDownload"]),
        ...mapActions("Modules/BimViewer", ["loadModel", "addMetaInformationToModel"]),
        ...mapActions("Modules/BimViewer/ToolSceneFit", ["fit"]),
        ...mapActions("Menu", ["changeCurrentComponent"]),
        ...mapMutations("Menu", ["setCurrentComponentProps"]),
        openGeneratedIfcUrl () {
            if (this.ifcUrl) {
                this.forceFileDownload(this.ifcUrl);
            }
            else {
                console.error("Generated IFC URL is undefined.");
            }
        },
        onSubmit () {
            const payload = {
                requestData: {
                    inputs: this.workflowFormData
                },
                endpoint: this.config.component.ogcAPIServiceURL,
                currentWorkflowId: this.currentWorkflowId
            };

            this.submitCreateIfcRequest(payload);
        },
        openIFC () {
            if (this.currentComponent(this.bimViewerMenuSide).type === "bimViewer") {
                this.sendIfcToViewer();
            }
            else if (this.bimViewerFullyLoaded) {
                this.changeCurrentComponent({type: "bimViewer", side: this.bimViewerMenuSide, props: {name: this.$t("common:modules.bimViewer.name")}});
                this.sendIfcToViewer();
            }
            else {
                this.openingViewerToSendIfc = true;
                this.changeCurrentComponent({type: "bimViewer", side: this.bimViewerMenuSide, props: {name: this.$t("common:modules.bimViewer.name")}});
            }
        },
        sendIfcToViewer () {
            this.loadModel(
                {
                    type: "ifc",
                    visible: true,
                    url: this.ifcUrl
                }
            ).then((theModel) => {
                theModel.on("loaded", () => {
                    this.fit();
                    this.addMetaInformationToModel(theModel);
                });
            });
        }
    }
};
</script>

<template>
    <FlatButton
        :text="config.component.title"
        :interaction="() => onSubmit()"
        icon="bi bi-box"
    />

    <FlatButton
        v-if="bimViewerConfigured && ifcUrl && !isMobile"
        :text="$t('additional:modules.bimfactory.workflow.components.submit.openIfcInBimViewer')"
        icon="bi-file-earmark-plus"
        :secondary="true"
        :interaction="() => openIFC()"
    />

    <FlatButton
        v-if="ifcUrl"
        :text="$t('additional:modules.bimfactory.workflow.components.submit.openIfcLink')"
        icon="bi-save-fill"
        :secondary="true"
        :interaction="() => openGeneratedIfcUrl()"
    />

    <SpinnerItem
        v-if="isLoading"
        custom-class="spinner"
        class="ms-3"
    />
</template>

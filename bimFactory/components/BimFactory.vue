<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import BimFactoryStartpage from "./BimFactoryStartpage.vue";
import BimFactoryWorkflow from "./BimFactoryWorkflow.vue";

export default {
    name: "BimFactory",
    components: {
        BimFactoryStartpage,
        BimFactoryWorkflow
    },
    data () {
        return {
            currentWorkflow: null
        };
    },
    computed: {
        ...mapGetters("Modules/BimFactory", ["standAlonePortal", "type"])
    },
    mounted () {
        this.removeTitleFromDOM();
        this.loadWorkflows();
        this.setCurrentMouseMapInteractionsComponent(this.type);
    },
    methods: {
        ...mapMutations("Menu", ["setCurrentMenuWidth", "setCurrentMouseMapInteractionsComponent"]),
        ...mapMutations("Modules/BimFactory", ["setCurrentWorkflowId", "setGeneratedIfcUrl", "setIsRequestErrorGeneral"]),
        ...mapActions("Modules/BimFactory", ["loadWorkflows"]),
        removeTitleFromDOM () {
            /* if (this.standAlonePortal && document.querySelector("#mp-subHeader-mainMenu")) {
                // hide title of portal and increase logo size
                document.querySelector("a#mp-menu-logo-mainMenu>h1").style.display = "none";
                document.querySelector("a#mp-menu-logo-mainMenu>img").style.width = "100%";
                document.querySelector("a#mp-menu-logo-mainMenu>img").style["max-height"] = "none";
            }
            else {
                // hide title of addon in right sidebar, when it is opened, because the Startpage will display the logo
                document.querySelector("div#mp-menu-navigation-secondaryMenu>h4").style.display = "none";
            }*/

            if (!this.standAlonePortal) {
                // hide title of addon in right sidebar, when it is opened, because the Startpage will display the logo
                document.querySelector("div#mp-menu-navigation-secondaryMenu>h4").style.display = "none";
            }
        },
        openWorkflow (value) {
            if (value === "start") {
                this.currentWorkflow = null;
                this.setGeneratedIfcUrl({});
                this.setIsRequestErrorGeneral(false);
            }
            else {
                this.currentWorkflow = parseInt(value, 10);
            }

            this.setCurrentWorkflowId(this.currentWorkflow);
        }
    }
};
</script>

<template>
    <div
        id="bim-factory"
        :class="{'overflowHidden': currentWorkflow !== null}"
    >
        <BimFactoryStartpage
            v-if="currentWorkflow === null"
            @openWorkflow="openWorkflow($event)"
        />

        <BimFactoryWorkflow
            v-else
            :workflow-id="currentWorkflow"
            @openWorkflow="openWorkflow($event)"
        />
    </div>
</template>

<style lang="scss">
#bim-factory {
    flex: 1;

    &.overflowHidden {
        overflow: hidden;
    }
}
</style>

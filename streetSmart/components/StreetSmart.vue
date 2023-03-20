<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import {getComponent} from "../../../src/utils/getComponent";
import ToolTemplate from "../../../src/modules/tools/ToolTemplate.vue";
import getters from "../store/gettersStreetSmart";
import mutations from "../store/mutationsStreetSmart";

export default {
    name: "StreetSmart",
    components: {
        ToolTemplate
    },
    data () {
        return {
            apiIsLoaded: false
        };
    },
    computed: {
        ...mapGetters("Tools/StreetSmart", Object.keys(getters)),
        ...mapGetters("Maps", ["clickCoordinate"]),
        ...mapGetters("MapMarker", ["markerPoint"])
    },
    watch: {
        active (value) {
            if (value) {
                this.$nextTick(() => {
                    if (this.apiIsLoaded) {
                        this.initApi();
                    }
                });
            }
            else {
                this.close();
            }
        },
        clickCoordinate (newCoord, lastCoord) {
            if (newCoord !== lastCoord) {
                this.setPosition(newCoord);
            }
        },
        "markerPoint.values_.visible": function (visible) {
            if (this.active && visible) {
                const features = this.markerPoint.getSource().getFeatures();

                if (features && features[0]) {
                    this.setPosition(features[0].getGeometry().getCoordinates());
                }
            }
        }
    },
    async created () {
        await this.loadPackages(this.apiLoadFinished);
        this.$on("close", this.close);
    },

    methods: {
        ...mapMutations("Tools/StreetSmart", Object.keys(mutations)),
        ...mapActions("Tools/StreetSmart", ["loadPackages", "initApi", "setPosition", "destroyApi"]),

        apiLoadFinished () {
            this.apiIsLoaded = true;
            if (this.active) {
                this.initApi();
            }
        },

        close () {
            const model = getComponent("streetSmart");

            this.destroyApi();
            this.setActive(false);
            if (model) {
                model.set("isActive", false);
            }
        }
    }
};

</script>

<template lang="html">
    <ToolTemplate
        :title="$t(name)"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
        :initial-width="initialWidth"
    >
        <template #toolBody>
            <div
                v-if="!apiIsLoaded"
                id="sidebarloader"
                class="centered-box-wrapper loader-is-loading"
            >
                <div
                    id="loader-spinner-itself"
                    class="default"
                />
            </div>
            <div
                v-if="active"
                id="streetsmart"
            />
        </template>
    </ToolTemplate>
</template>

<style lang="scss" scoped>
#streetsmart {
    height: 100%;
}
#sidebarloader {
    position:absolute;
    top:0;
    right:0;
    bottom:0;
    left:0;
    background-color:rgba(255,255,255,0.4);
    display:none;
    padding-bottom:100px;
    z-index:1000;
}
#sidebarloader.loader-is-loading {
    display:block;
}
</style>

<style lang="scss">
/* FIX:
    These are overrides repairing the issues presented by Masterportal using
    Bootstrap 5 and SmartCityAPI using Bootstrap <=3. */

#streetsmart {
    .expandable-navbar, .cmt-navbar {
        display: flex;
        align-items: start;
        font-family: inherit;

        .navbar-nav {
            flex-direction: row;
            width: auto;
            align-items: center;

            &.navbar-flex-reverse {
                flex-direction: row-reverse;
            }
        }

        .navbar-right {
            display: flex;
            justify-content: end;
        }

        .switch-button {
            height: 20px;
        }

        .measurement-dropdown {
            .btn-default, .dropdown-menu a {
                display: flex;
                align-items: center;
            }
        }
    }

    .cmtViewerPanel {
        .btn-secondary-right {
            position: unset;
            margin: 0;
        }

        .wrapperproperty > div {
            height: 100%;
            display: flex;
            align-items: center;
        }
    }
}
</style>

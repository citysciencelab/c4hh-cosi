<script>
import {mapGetters, mapActions, mapMutations} from "vuex";

export default {
    name: "StreetSmart",
    data () {
        return {
            language: ""
        };
    },
    computed: {
        ...mapGetters("Modules/StreetSmart", ["packagesLoaded"]),
        ...mapGetters("Maps", ["clickCoordinate"]),
        ...mapGetters("Modules/StreetSmart", ["currentLocale"])
    },
    watch: {
        clickCoordinate: {
            handler (newCoord, lastCoord) {
                if (newCoord !== lastCoord) {
                    this.setPosition(newCoord);
                }
            },
            deep: true
        },
        currentLocale: {
            handler (currentLocale) {
                if (currentLocale !== this.language) {
                    this.destroyApi();
                    this.initApi();
                    this.language = currentLocale;
                }
            }
        }
    },
    created () {
        if (!this.packagesLoaded) {
            this.loadPackages(this.apiLoadFinished);
        }
    },
    mounted () {
        this.$nextTick(() => {
            if (this.packagesLoaded) {
                this.initApi();
            }
        });
    },
    beforeUnmount () {
        this.destroyApi();
    },

    methods: {
        ...mapMutations("Modules/StreetSmart", [
            "setPackagesLoaded"
        ]),
        ...mapActions("Modules/StreetSmart", [
            "destroyApi",
            "loadPackages",
            "initApi",
            "setPosition"
        ]),

        /**
         * Set packages are loaded and initialize api.
         * @returns {void}
         */
        apiLoadFinished () {
            this.setPackagesLoaded(true);
            this.initApi();
        }
    }
};

</script>

<template lang="html">
    <div id="addons-street-smart">
        <div
            v-if="!packagesLoaded"
            id="sidebar-loader"
            class="centered-box-wrapper loader-is-loading"
        >
            <div
                id="loader-spinner-itself"
                class="default"
            />
        </div>
        <div id="street-smart" />
    </div>
</template>

<style lang="scss" scoped>
    #addons-street-smart {
        height: 100%;
    }
    #street-smart {
        height: 100%;
    }
    #sidebar-loader {
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
    #sidebar-loader.loader-is-loading {
        display:block;
    }
</style>

<style lang="scss">
    /* FIX:
        These are overrides repairing the issues presented by Masterportal using
        Bootstrap 5 and SmartCityAPI using Bootstrap <=3. */

    #street-smart {
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

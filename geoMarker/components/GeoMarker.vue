<script>
import NavTab from "@shared/modules/tabs/components/NavTab.vue";
import {mapGetters, mapActions} from "vuex";

export default {
    name: "GeoMarker",
    components: {
        NavTab
    },
    data () {
        return {
            fullyLoaded: false
        };
    },
    computed: {
        ...mapGetters("Modules/GeoMarker", [
            "categories",
            "departments"
        ])
    },
    async mounted () {
        await this.loadCategories();
        await this.loadDepartments();

        this.fullyLoaded = true;
    },
    methods: {
        ...mapActions("Modules/GeoMarker", [
            "loadCategories",
            "loadDepartments"
        ])
    }
};
</script>

<template>
    <div id="geoMarker">
        <ul
            id="geoMarkerTabs"
            class="nav nav-tabs nav-justified"
            role="tablist"
        >
            <NavTab
                id="newTab"
                :active="false"
                target="#newTabPane"
                label="Neu"
            />

            <NavTab
                id="filterTab"
                :active="true"
                target="#filterTabPane"
                label="Filter"
            />

            <NavTab
                id="listTab"
                :active="false"
                target="#listTabPane"
                label="Liste"
            />
        </ul>

        <div
            id="geomarkerTabContent"
            class="tab-content"
        >
            <div
                id="newTabPane"
                class="tab-pane fade"
                role="tabpanel"
                aria-labelledby="new-tab"
                tabindex="0"
            >
                <p>Neuen GeoMarker anlegen</p>

                <!-- As an example, will be deleted. -->
                <!-- <p v-if="fullyLoaded">
                    {{ categories }}
                </p> -->

                <!-- As an example, will be deleted. -->
                <!-- <p v-if="fullyLoaded">
                    {{ departments }}
                </p> -->
            </div>

            <div
                id="filterTabPane"
                class="tab-pane fade show active"
                role="tabpanel"
                aria-labelledby="filter-tab"
                tabindex="0"
            >
                <p>Filter GeoMarker</p>
            </div>

            <div
                id="listTabPane"
                class="tab-pane fade"
                role="tabpanel"
                aria-labelledby="list-tab"
                tabindex="0"
            >
                <p>gefilterte GeoMarker auflisten</p>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
div#geoMarker {
    ul#geoMarkerTabs {
        button.nav-link {
            padding: 0.5rem;
        }
    }

    div#geomarkerTabContent {
        padding-top: 1rem;
    }
}
</style>

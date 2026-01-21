<script>
import {mapActions, mapMutations, mapGetters} from "vuex";

export default {
    name: "SideMenu",
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "mode",
            "hiddenSideMenus"
        ]),
        ...mapGetters("Modules/Login", [
            "loggedIn"
        ]),
        ...mapGetters("Menu", [
            "currentComponentName"
        ])
    },
    mounted: async function () {
        this.applyCustomLayout();
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", [
            "setMode"
        ]),
        ...mapMutations("Menu", [
            "setCurrentComponent",
            "setCurrentComponentPropsName"
        ]),
        ...mapActions("Menu", [
            "resetMenu"
        ]),
        closeSimulationTool () {
            this.restoreDefaultLayout();
            if (this.currentComponentName("secondaryMenu") !== "Simulationen") {
                this.setCurrentComponentPropsName({side: "secondaryMenu", name: "Simulationen"});
            }
            this.resetMenu("secondaryMenu");
        },
        applyCustomLayout () {
            const defaultNavigation = document.getElementById("mp-menu-navigation-secondaryMenu"),
                menuBody = document.getElementById("mp-body-secondaryMenu");

            menuBody.style.padding = "0";
            defaultNavigation.style.display = "none";
        },
        restoreDefaultLayout () {
            const defaultNavigation = document.getElementById("mp-menu-navigation-secondaryMenu"),
                menuBody = document.getElementById("mp-body-secondaryMenu");

            menuBody.style.padding = "0 1.5rem 1.5rem 1.5rem";
            defaultNavigation.style.display = "block";
        }
    }
};
</script>

<template>
    <nav class="simulation-tool-sidebar">
        <button
            class="btn btn-link"
            :title="$t('additional:modules.tools.simulationTool.closeSimulationTool')"
            @click="closeSimulationTool"
        >
            <i class="bi bi-x-lg" />
        </button>
        <button
            v-if="!hiddenSideMenus.includes('home-panel')"
            class="btn btn-link"
            :class="{ active: mode === 'home-panel' }"
            :title="$t('additional:modules.tools.simulationTool.home')"
            @click="() => setMode('home-panel')"
        >
            <i class="bi bi-house-fill" />
        </button>
        <button
            v-if="!hiddenSideMenus.includes('planningScenario')"
            class="btn btn-link"
            :class="{ active: mode.includes('planningScenario') }"
            :title="$t('additional:modules.tools.simulationTool.planningScenario')"
            @click="() => setMode('planningScenario')"
        >
            <i class="bi bi-bounding-box-circles" />
        </button>
        <button
            v-if="!hiddenSideMenus.includes('simulationParameter')"
            class="btn btn-link"
            :class="{ active: mode.includes('simulationParameter') }"
            :title="$t('additional:modules.tools.simulationTool.simulationSetParams')"
            @click="() => setMode('simulationParameter')"
        >
            <i class="bi bi-pencil-square" />
        </button>
        <button
            v-if="!hiddenSideMenus.includes('simulationList')"
            class="btn btn-link"
            :class="{ active: mode.includes('simulationList') }"
            :title="$t('additional:modules.tools.simulationTool.simulationList')"
            @click="() => setMode('simulationList')"
        >
            <i class="bi bi-list-check" />
        </button>
        <button
            v-if="!hiddenSideMenus.includes('process')"
            class="btn btn-link"
            :class="{ active: mode.includes('process') }"
            :title="$t('additional:modules.tools.simulationTool.models')"
            @click="() => setMode('process-list')"
        >
            <i class="bi bi-motherboard-fill" />
        </button>
        <button
            v-if="!hiddenSideMenus.includes('job')"
            class="btn btn-link"
            :class="{ active: mode.includes('job')}"
            :title="$t('additional:modules.tools.simulationTool.scenarios')"
            @click="() => setMode('job-list')"
        >
            <i class="bi bi-clipboard-data-fill" />
        </button>
        <button
            v-if="loggedIn && !hiddenSideMenus.includes('ensemble')"
            class="btn btn-link"
            :class="{ active: mode.includes('ensemble')}"
            :title="$t('additional:modules.tools.simulationTool.ensembles')"
            @click="() => setMode('ensemble-list')"
        >
            <i class="bi bi-boxes" />
        </button>
        <button
            v-if="!hiddenSideMenus.includes('help-panel')"
            class="btn btn-link"
            :class="{ active: mode === 'help-panel' || mode.includes('tutorial') }"
            :title="$t('additional:modules.tools.simulationTool.help')"
            @click="() => setMode('help-panel')"
        >
            <i class="bi bi-question-circle-fill" />
        </button>
    </nav>
</template>

<style lang="scss" scoped>
    nav.simulation-tool-sidebar {
        display: flex;
        flex-direction: column;
        width: 65px;
        gap: 1.5rem;
        background-color: $primary;
        padding: 0 .5rem;

        .btn {
            font-size: 2rem;

            &.active {
                background-color: var(--bs-light);
            }

            &:first-child {
                margin-top: .5rem;
                margin-bottom: 2rem;
            }
        }
    }
</style>

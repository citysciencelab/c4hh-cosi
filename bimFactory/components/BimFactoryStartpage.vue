<script>
import getters from "../store/gettersBimFactory";
import {mapGetters} from "vuex";

export default {
    computed: {
        ...mapGetters("Modules/BimFactory", Object.keys(getters))
    },
    methods: {
        openSelectedWorkflow (value) {
            if (value !== "none") {
                this.$emit("openWorkflow", value);
            }
        }
    }
};
</script>

<template>
    <div class="bimFactoryStartPage">
        <img
            v-if="!standAlonePortal"
            class="bimFactoryLogo"
            :src="'./resources/img/Logo_BIMFabrik.png'"
            :alt="$t('additional:modules.bimfactory.startPage.headline.title')"
        >

        <!-- headline with strong tag and link to CUT-project -->
        <p class="fullWidth">
            <i18next :translation="$t('additional:modules.bimfactory.startPage.headline.message')">
                <template #title>
                    <span>
                        <strong> {{ $t('additional:modules.bimfactory.startPage.headline.title') }} </strong>
                    </span>
                </template>

                <template #link>
                    <a
                        :href="$t('additional:modules.bimfactory.startPage.headline.linkHref')"
                        target="_blank"
                    >
                        {{ $t('additional:modules.bimfactory.startPage.headline.linkTitle') }}
                    </a>
                </template>
            </i18next>
        </p>

        <!-- list of available workflows -->
        <div class="workflowSelection fullWidth">
            <label for="availableWorkflows">
                {{ $t('additional:modules.bimfactory.startPage.workflows.title') }}
            </label>

            <select
                id="availableWorkflows"
                class="form-select"
                @change="openSelectedWorkflow($event.target.value)"
            >
                <option value="none">
                    {{ $t('additional:modules.bimfactory.startPage.workflows.select') }}
                </option>

                <option
                    v-for="workflow in workflowsJSON?.workflows"
                    :key="workflow.id"
                    :value="workflow.id"
                >
                    {{ workflow.name }}
                </option>
            </select>
        </div>

        <!-- project description -->
        <p class="fullWidth">
            {{ $t('additional:modules.bimfactory.startPage.description') }}
        </p>

        <img
            class="bimFactoryConcept"
            :src="'./resources/img/konzept_bimfabrik.png'"
            :alt="$t('additional:modules.bimfactory.startPage.conceptAlt')"
        >

        <div class="fullWidth">
            <p> {{ $t('additional:modules.bimfactory.startPage.advantagesTitle') }} </p>

            <ul>
                <li
                    v-for="(feature, index) in $t('additional:modules.bimfactory.startPage.advantages.list', { returnObjects: true })"
                    :key="index"
                >
                    {{ feature }}
                </li>
            </ul>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    div.bimFactoryStartPage {
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;

        img.bimFactoryLogo {
            width: 100%;
            margin-bottom: 2rem;
            border-color: rgb(229, 231, 235);
            border-radius: 4px;
            border-style: solid;
            border-width: 1px;
            box-shadow: 0 1px 5px rgba(0, 0, 0, .2), 0 2px 2px rgba(0, 0, 0, .14), 0 3px 1px -2px rgba(0, 0, 0, .12);
        }

        img.bimFactoryConcept {
            width: 70%;
            margin: 2rem;
        }

       .fullWidth {
            width: 100%;
        }

        div.workflowSelection {
            margin-bottom: 1rem;
        }
    }
</style>

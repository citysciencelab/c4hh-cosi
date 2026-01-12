<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

import {mapGetters, mapActions} from "vuex";

export default {
    name: "TabSearch",
    components: {
        FlatButton,
        InputText
    },
    data () {
        return {
            activeContent: "searchOptionsList",
            selectedArchiv: "",
            searchWithAttributeForm: {}
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "dataClassList"
        ])
    },
    async mounted () {
        await this.fetchDataClassList();

        this.initializeSearchForm();
        this.setSelectedArchiv(this.dataClassList[0]?.name);
    },
    methods: {
        ...mapActions("Modules/LzsResearchClient", [
            "fetchDataClassList"
        ]),
        changeSearchContent (contentId) {
            this.activeContent = contentId;
        },
        setSelectedArchiv (archiv) {
            this.selectedArchiv = archiv;
        },
        initializeSearchForm () {
            const formValues = {};

            this.dataClassList?.forEach(element => {
                const archivName = element.name,
                    attributes = element.highestActiveDataclassVersion.dataclassAttributs
                        .filter(attribute => attribute.usage === "I")
                        .map(attribute => ({
                            ...attribute,
                            value: ""
                        }))
                        .map(attribute => ({
                            ...attribute,
                            value: "",
                            label: this.$t(`additional:modules.lzsResearchClient.tabs.tabSearch.${attribute.name.toLowerCase()}`)
                        }));

                formValues[archivName] = attributes;
                formValues[archivName].push(
                    {
                        name: "maxValueCount",
                        value: "",
                        label: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.maxValueCount"),
                        pattern: "[0-9]{4}"
                    });
            });

            this.searchWithAttributeForm = formValues;
        }
    }
};
</script>

<template>
    <div
        id="TabSearch"
    >
        <transition
            name="slide"
            mode="out-in"
        >
            <ul
                v-if="activeContent === 'searchOptionsList'"
                id="searchOptionsList"
                class="list-group"
            >
                <li
                    class="list-group-item d-flex justify-content-between align-items-center"
                    role="button"
                    tabindex="0"
                    @click="changeSearchContent('searchFormWithAttributes')"
                    @keydown.enter="changeSearchContent('searchFormWithAttributes')"
                >
                    {{ $t('additional:modules.lzsResearchClient.tabs.tabSearch.searchWithAttributeHeading') }}

                    <i class="bi bi-arrow-right-circle" />
                </li>

                <li
                    class="list-group-item d-flex justify-content-between align-items-center"
                    role="button"
                    tabindex="0"
                    @click="changeSearchContent('searchFormWithGeometry')"
                    @keydown.enter="changeSearchContent('searchFormWithGeometry')"
                >
                    {{ $t("additional:modules.lzsResearchClient.tabs.tabSearch.searchWithGeometryHeading") }}

                    <i class="bi bi-arrow-right-circle" />
                </li>
            </ul>

            <div
                v-else
                id="searchAttributes"
                class="searchAttributes"
            >
                <div
                    v-if="activeContent === 'searchFormWithAttributes'"
                    id="searchFormWithAttributes"
                    class="searchFormWithAttributes"
                >
                    <label for="archiv">
                        {{ $t("additional:modules.lzsResearchClient.tabs.tabSearch.selectArchivLabel") }}
                    </label>

                    <select
                        id="archiv"
                        class="form-select archiv"
                        :value="selectedArchiv"
                        @change="setSelectedArchiv($event.target.value)"
                    >
                        <option
                            v-for="(_, name) in searchWithAttributeForm"
                            :key="name"
                            :value="name"
                        >
                            {{ name }}
                        </option>
                    </select>

                    <div class="searchWithAttributeForm">
                        <InputText
                            v-for="attribute in searchWithAttributeForm[selectedArchiv]"
                            :id="attribute.name"
                            :key="attribute.name"
                            v-model="attribute.value"
                            :label="attribute.label"
                            :placeholder="attribute.name"
                        />
                    </div>
                </div>

                <div
                    v-if="activeContent === 'searchFormWithGeometry'"
                    id="searchFormWithGeometry"
                    class="searchFormWithGeometry"
                >
                    Search with geometry
                    <hr>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolores, quo, blanditiis ducimus ipsam optio voluptates mollitia odit tempora provident perspiciatis modi commodi fugiat numquam accusantium rem facere? Saepe, a accusamus.
                    <hr>
                </div>

                <div class="searchButtons">
                    <FlatButton
                        :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.dossiersButtonLabel')"
                        :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.dossiersButtonLabel')"
                    />

                    <FlatButton
                        id="backButton"
                        :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.backButtonLabel')"
                        :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.backButtonLabel')"
                        @click="changeSearchContent('searchOptionsList')"
                    />

                    <FlatButton
                        :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.searchButtonLabel')"
                        :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.searchButtonLabel')"
                    />

                    <FlatButton
                        :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.resetButtonLabel')"
                        :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.resetButtonLabel')"
                    />
                </div>
            </div>
        </transition>
    </div>
</template>

<style lang="scss" scoped>
#TabSearch {
    padding: 1rem 0.5rem;
    position: relative;

    // Transition classes - START
    .slide-enter-active,
    .slide-leave-active {
        transition: all 0.2s ease-in-out;
    }

    .slide-enter-from {
        opacity: 0;
        transform: translateX(-6rem);
    }

    .slide-leave-to {
        opacity: 0;
        transform: translateX(6rem);
    }
    // Transition classes - END

    div.searchAttributes {
        div.searchFormWithAttributes {
            select.archiv {
                margin-bottom: 1rem;
            }
        }
        div.searchButtons {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;

            *:nth-child(2) {
                margin-left: auto;
            }
        }
    }
}
</style>

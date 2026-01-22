<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "./shared/InputText.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import {TAB_SET_CURRENT} from "./shared/TabContainer.vue";

import {mapGetters, mapActions} from "vuex";

export default {
    name: "TabSearch",
    components: {
        FlatButton,
        InputText,
        SpinnerItem
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    data () {
        return {
            activeContent: "searchOptionsList",
            selectedArchive: "",
            searchWithAttributeFormData: {},
            archives: {},
            showSpinner: false,
            isAttributeSearchFormValid: true,
            selectedArchiveIds: [],
            selectedYears: []
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "dataClassList",
            "placeholderDataClassList",
            "archiveYears",
            "archiveList"
        ]),
        /**
         * Generates a sorted list of years grouping the selected archives.
         *
         * Iterates through selected IDs to build a map keyed by year:
         * - If the year is encountered for the first time, it initializes a new entry with an empty array.
         * - Then, it pushes the current archive name into that year's list (whether newly created or existing).
         *
         * @returns {Array<{year: string, archiveNames: string[]}>} Ascending sorted array of year objects.
         */
        yearsList () {
            const yearsList = {};

            this.selectedArchiveIds.forEach(id => {
                const item = this.archiveYears[id];

                if (item && item.year) {
                    if (!yearsList[item.year]) {
                        yearsList[item.year] = {
                            year: item.year,
                            archiveNames: []
                        };
                    }
                    yearsList[item.year].archiveNames.push(item.archiveName);
                }
            });

            return Object.values(yearsList).sort((a, b) => a.year - b.year);
        }
    },
    watch: {
        selectedArchive (newValue) {
            if (newValue) {
                this.validateSearchWithAttributeForm();
            }
        },
        /** Watch the yearsList to update the selectedYears */
        yearsList (yearsListNewValue) {
            const availableYears = yearsListNewValue.map(y => y.year);

            this.selectedYears = this.selectedYears.filter(year =>availableYears.includes(year));
        }
    },
    async mounted () {
        await this.fetchDataClassList();
        await this.fetchPlaceholders();

        this.initializeSearchForm();
    },
    methods: {
        ...mapActions("Modules/LzsResearchClient", [
            "fetchDataClassList",
            "searchByAttribute",
            "fetchPlaceholders",
            "fetchYears"
        ]),
        /**
         * Update the active content section to the given `contentId`.
         * @param {string} contentId - The id of the content to activate.
         */
        changeSearchContent (contentId) {
            this.activeContent = contentId;
        },
        /**
         * Set the selected archive identifier.
         * @param {string} archive - The archive name to select.
         */
        setSelectedArchive (archiv) {
            this.selectedArchive = archiv;
        },
        /**
         * Initialize archive and form data structures from `dataClassList`.
         */
        initializeSearchForm () {
            const formData = {},
                archives = {};

            this.dataClassList?.forEach(element => {
                const archiveName = element.name,
                    attributes = element.highestActiveDataclassVersion.dataclassAttributs
                        .filter(attribute => attribute.usage === "I")
                        .map(attribute => ({
                            ...attribute,
                            value: "",
                            placeholder: this.placeholderDataClassList?.[archiveName]?.[attribute.name].PLACEHOLDER || "",
                            label: this.$t(`additional:modules.lzsResearchClient.tabs.tabSearch.${attribute.name.toLowerCase()}`),
                            pattern: this.placeholderDataClassList?.[archiveName]?.[attribute.name].PATTERN || "",
                            errorMessage: ""
                        }));

                formData[archiveName] = [
                    ...attributes,
                    {
                        name: "maxValueCount",
                        value: "",
                        label: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.maxValueCount"),
                        pattern: "[0-9]{1,4}",
                        placeholder: "10",
                        errorMessage: ""
                    }
                ];

                archives[element.name] = element.id;
            });

            this.searchWithAttributeFormData = formData;
            this.archives = archives;
            this.setSelectedArchive(this.dataClassList[0]?.name);
        },
        /**
         * Build a search payload from the form data, show a spinner and perform the search.
         * After search, switch to the result tab.
         */
        async searchWithAttribute () {
            if (!this.isAttributeSearchFormValid) {
                return;
            }

            const payload = {
                dataclassIds: [this.archives[this.selectedArchive]],
                maxvaluecount: "",
                fachattribute: []
            };

            this.searchWithAttributeFormData[this.selectedArchive].forEach(formItem => {
                if (formItem.usage === "I") {
                    payload.fachattribute.push({
                        id: formItem.name.toUpperCase(),
                        value: formItem.value, type: formItem.usage
                    });
                }

                if (formItem.name === "maxValueCount") {
                    payload.maxvaluecount = formItem.value;
                }
            });

            this.showSpinner = true;

            await this.searchByAttribute(payload);

            this.showSpinner = false;

            this.setCurrentTab("tabResult");
        },
        /**
         * Validate form fields against their patterns and set error messages accordingly.
         */
        validateSearchWithAttributeForm () {
            const attributes = this.searchWithAttributeFormData[this.selectedArchive];

            this.isAttributeSearchFormValid = true;

            attributes.forEach(attribute => {
                attribute.errorMessage = "";

                if (attribute.pattern && attribute.value !== null && String(attribute.value) !== "") {
                    const regex = new RegExp(`^${attribute.pattern}$`);

                    if (!regex.test(String(attribute.value))) {
                        attribute.errorMessage = this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.patternError",
                            {digitNumber: attribute.placeholder.length}
                        );
                        this.isAttributeSearchFormValid = false;
                    }
                }
            });
        },
        /**
         * Reset the attribute form and related validation to initial state.
         */
        resetForm () {
            this.initializeSearchForm();
            this.validateSearchWithAttributeForm();
            this.resetGeometricSearchForm();
        },
        /**
         * Reset the geometric search selection (archive ids).
         */
        resetGeometricSearchForm () {
            this.selectedArchiveIds = [];
            // IMPORTANT:
            // we do not reset archiveYears here, because it works like a caching mechanism.
            // We filter archiveYears according to selectedArchiveIds in yearsList and show yearsList in template. See yearsList computed.
            // So if we dont reset it, we can use the data later, without sending a new request. See onSelectedArchiveIdsChange method.
            // For later implementation, please do not reset archiveYears and dont use it directly so that you need to reset it sometime.
        },
        /**
         * Toggle an archive id in `selectedArchiveIds` and fetch years if needed.
         * @param {string} archiveId - Archive identifier to toggle.
         * @param {Event} event - The change event from the checkbox.
         */
        async onSelectedArchiveIdsChange (archiveId, event) {
            const checked = event.target.checked;

            if (checked) {
                if (!this.selectedArchiveIds.includes(archiveId)) {
                    this.selectedArchiveIds.push(archiveId);
                }

                if (!this.archiveYears[archiveId]) {
                    await this.fetchYears(archiveId);
                }
            }
            else {
                this.selectedArchiveIds = this.selectedArchiveIds.filter(id => id !== archiveId);
            }
        },
        /**
         * Toggle a year in `selectedYears`.
         * @param {number|string} year - Year to toggle.
         * @param {Event} event - The change event from the checkbox.
         */
        onSelectedYearsChange (year, event) {
            const checked = event.target.checked;

            if (checked) {
                if (!this.selectedYears.includes(year)) {
                    this.selectedYears = [...this.selectedYears, year];
                }
            }
            else {
                this.selectedYears = this.selectedYears.filter(y => y !== year);
            }
        }
    }
};
</script>

<template>
    <div id="TabSearch">
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
                    v-if="showSpinner"
                    class="loadingSpinner"
                >
                    <SpinnerItem
                        custom-class="spinner"
                        class="ms-3"
                    />
                </div>

                <div v-else>
                    <div
                        v-if="activeContent === 'searchFormWithAttributes'"
                        id="searchFormWithAttributes"
                        class="searchFormWithAttributes"
                    >
                        <label for="archiv">
                            {{ $t("additional:modules.lzsResearchClient.tabs.tabSearch.selectArchivLabel") }}
                        </label>

                        <select
                            id="archive"
                            class="form-select archive"
                            :value="selectedArchive"
                            @change="setSelectedArchive($event.target.value)"
                        >
                            <option
                                v-for="(_, name) in searchWithAttributeFormData"
                                :key="name"
                                :value="name"
                            >
                                {{ name }}
                            </option>
                        </select>

                        <div class="searchWithAttributeForm">
                            <InputText
                                v-for="attribute in searchWithAttributeFormData[selectedArchive]"
                                :id="attribute.name"
                                :key="attribute.name"
                                v-model="attribute.value"
                                :class-obj="['form-control' + (attribute.errorMessage.length > 0 ? ' is-invalid': ' is-valid')]"
                                :label="attribute.name"
                                :placeholder="attribute.placeholder"
                                :error-message="attribute.errorMessage"
                                @input="validateSearchWithAttributeForm()"
                            />
                        </div>
                    </div>

                    <div
                        v-if="activeContent === 'searchFormWithGeometry'"
                        id="searchFormWithGeometry"
                        class="searchFormWithGeometry"
                    >
                        <div class="archiveSelection">
                            <span>
                                {{ $t('additional:modules.lzsResearchClient.tabs.tabSearch.selectArchivLabel') }}
                            </span>

                            <div
                                class="archiveSelectionList"
                                role="group"
                                aria-label="archives"
                            >
                                <div
                                    v-for="archive in archiveList"
                                    :key="archive.id"
                                    class="archiveCheckboxList"
                                >
                                    <input
                                        :id="`archiveCheckbox-${archive.id}`"
                                        type="checkbox"
                                        :value="archive.id"
                                        :checked="selectedArchiveIds.includes(archive.id)"
                                        @change="onSelectedArchiveIdsChange(archive.id, $event)"
                                    >

                                    <label :for="`archiveCheckbox-${archive.id}`">
                                        {{ archive.name }}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="yearsSelection">
                            <span>
                                {{ $t('additional:modules.lzsResearchClient.tabs.tabSearch.selectYearsLabel') }}
                            </span>

                            <div
                                class="yearsSelectionList"
                                role="group"
                                aria-label="years"
                            >
                                <div
                                    v-for="yearObject in yearsList"
                                    :key="yearObject.year"
                                    class="yearCheckboxItem"
                                >
                                    <input
                                        :id="`yearCheckbox-${yearObject.year}`"
                                        type="checkbox"
                                        :value="yearObject.year"
                                        :checked="selectedYears.includes(yearObject.year)"
                                        @change="onSelectedYearsChange(yearObject.year, $event)"
                                    >

                                    <label :for="`yearCheckbox-${yearObject.year}`">
                                        <span>
                                            {{ yearObject.year }}
                                        </span>
                                        <span>
                                            ({{ yearObject.archiveNames.join(", ") }})
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="searchButtons">
                        <FlatButton
                            id="backButton"
                            :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.backButtonLabel')"
                            :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.backButtonLabel')"
                            @click="changeSearchContent('searchOptionsList')"
                        />

                        <FlatButton
                            :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.searchButtonLabel')"
                            :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.searchButtonLabel')"
                            :disabled="!isAttributeSearchFormValid"
                            @click="searchWithAttribute()"
                        />

                        <FlatButton
                            :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.resetButtonLabel')"
                            :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.resetButtonLabel')"
                            @click="resetForm()"
                        />
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #TabSearch {
        padding: 1rem 0.5rem;
        position: relative;
        height: 100%;

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
            height: 100%;

            div.searchFormWithAttributes {
                select.archive {
                    margin-bottom: 1rem;
                }
            }

            div.loadingSpinner {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                gap: 2rem;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.7);
                z-index: 2;

                div.spinner {
                    width: 4rem;
                    height: 4rem;
                }

                p {
                    background-color: white;
                    white-space: pre-line;
                    padding: 1.5rem;
                }
            }

            div.searchFormWithGeometry {
                .archiveSelectionList {
                    max-height: 12.5rem;
                    overflow-y: auto;
                    border: 0.0625rem solid rgba(0,0,0,0.1);
                    padding: 0.5rem;
                    margin: 0.5rem 0 1rem 0;
                }

                .archiveCheckboxList {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    white-space: nowrap;
                }
                .yearsSelection {
                    .yearsSelectionList {
                        height: 10rem;
                        overflow-y: auto;
                        border: 0.0625rem solid rgba(0,0,0,0.1);
                        padding: 0.5rem;
                        margin: 0.5rem 0 1rem 0;
                    }

                    .yearCheckboxItem {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        white-space: nowrap;
                    }
                }
                div.noCommonYearError {
                    color: $light_red;
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

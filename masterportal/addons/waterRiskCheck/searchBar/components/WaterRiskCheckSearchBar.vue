<script>
import debounce from "@shared/js/utils/debounce";
import {mapGetters, mapActions, mapMutations} from "vuex";
import SearchBarSuggestionList from "./SearchBarSuggestionList.vue";
import SearchBarResultList from "./SearchBarResultList.vue";

/**
 * Searchbar to access search results.
 * @module modules/searchBar/components/SearchBar
 * @vue-computed {String} searchInputValue - The v-bind of search input value.
 * @vue-computed {Object} limitedSortedSearchResults - Results the limited and sorted search results.
 */
export default {
    name: "WaterRiskCheckSearchBar",
    components: {
        SearchBarResultList,
        SearchBarSuggestionList
    },
    props: {
        clickAction: {
            type: Function,
            default: undefined,
            required: false
        },
        disabled: {
            type: Boolean,
            default: false,
            required: false
        }
    },
    data: function () {
        return {
            currentComponentSide: undefined,
            currentSearchInput: this.searchInput,
            layerSelectionPlaceHolder: this.placeholder
        };
    },
    computed: {
        ...mapGetters("Modules/WaterRiskCheckSearchBar", [
            "configPaths",
            "minCharacters",
            "placeholder",
            "searchInput",
            "searchInterfaceInstances",
            "searchResults",
            "searchResultsActive",
            "showAllResults",
            "suggestionListLength",
            "addLayerButtonSearchActive",
            "type",
            "currentSide"
        ]),
        ...mapGetters("Menu", {
            menuCurrentComponent: "currentComponent",
            previousNavigationEntryText: "previousNavigationEntryText"
        }),
        ...mapGetters([
            "isMobile",
            "portalConfig"
        ]),
        /**
         * v-bind of search input value.
         */
        searchInputValue: {
            get () {
                return this.searchInput;
            },
            set (searchInput) {
                this.setSearchInput(searchInput);
                this.removeHighlight3DTile();
            }
        },
        /**
         * Check if search should be activated.
         * @returns {Boolean} True if search should be executed.
         */
        searchActivated () {
            return this.searchInputValue?.length >= parseInt(this.minCharacters, 10);
        },
        /**
         * Updates the categories to unique categories.
         * @returns {Object} The searchresults with unique categories.
         */
        searchResultsWithUniqueCategories () {
            if (this.searchInterfaceInstances.every(searchInterfaceInstance => searchInterfaceInstance.searchState !== "running")) {
                const categories = [...new Set(this.searchResults.map(searchResult => searchResult.category))];

                categories.forEach(category => {
                    const searchResultsByCategory = this.searchResults.filter(searchResult => searchResult.category === category),
                        searchInterfaceIds = [...new Set(searchResultsByCategory.map(searchResult => searchResult.searchInterfaceId))];

                    if (searchInterfaceIds.length > 1) {
                        let count = 0;

                        searchInterfaceIds.forEach(searchInterfaceId => {
                            searchResultsByCategory.forEach(searchResult => {
                                if (searchResult.searchInterfaceId === searchInterfaceId) {
                                    searchResult.category = searchResult.category + "_" + count;
                                }
                            });

                            ++count;
                        });
                    }
                });
            }

            return this.searchResults;
        },

        /**
         * Sorts the results according the configured search providers and prepare the suggestionlist with the limit of suggestionListLength, updates searchSuggestions
         * Prepares currentShowAllList (used to show all results of a category).
         * @returns {Object} results the limited and sorted search results.
         */
        limitedSortedSearchResults () {
            const results = {},
                currentShowAllList = [];

            results.categoryProvider = {};
            this.setSearchSuggestions([]);
            results.availableCategories = [];
            this.searchInterfaceInstances.forEach(searchInterfaceInstance => {
                for (const [index, value] of Object.entries(this.searchResultsWithUniqueCategories)) {
                    if (value.searchInterfaceId === searchInterfaceInstance.searchInterfaceId) {
                        results[value.category + "Count"] = results[value.category + "Count"] === undefined ? 1 : ++results[value.category + "Count"];


                        if (results.availableCategories.includes(value.category) === false) {
                            results.availableCategories.push(value.category);
                            results.categoryProvider[value.category] = value.searchInterfaceId;
                        }

                        currentShowAllList.push(value);

                        if (results[value.category + "Count"] <= this.suggestionListLength) {
                            results[index] = value;
                            this.addSuggestionItem(value);
                        }
                        if (value.imgPath) {
                            results[value.category + "ImgPath"] = value.imgPath;
                        }
                        if (value.icon) {
                            results[value.category + "Icon"] = value.icon;
                        }
                    }
                }
            });

            return {results: results, currentShowAllList: currentShowAllList};
        },

        /**
         * Controls visibility of the Bootstrap dropdown menu with search results.
         * @returns {Boolean} True if the dropdown should be shown.
         */
        showSearchDropdown () {
            return this.searchActivated && this.searchResultsActive && this.searchResults?.length > 0;
        }
    },
    watch: {
        /**
        * Watcher to check the current component
        */
        currentComponentSide: {
            handler (newVal) {
                if (newVal === "root" || (newVal === "layerSelection" && this.addLayerButtonSearchActive === true)) {
                    this.$refs?.searchInput.blur();
                    if (newVal === "root") {
                        this.setSearchResultsActive(false);
                        this.setShowAllResults(false);
                        this.setShowSearchResultsInTree(false);
                        this.setCurrentActionEvent("");
                        this.navigateBack(this.currentSide);
                    }
                }
                if (newVal === "layerSelection" && this.addLayerButtonSearchActive === true) {
                    this.layerSelectionPlaceHolder = "common:modules.searchBar.search";
                }
                else {
                    this.layerSelectionPlaceHolder = this.placeholder;
                }
                this.setGlobalPlaceholder(this.layerSelectionPlaceHolder);
            },
            deep: true
        },
        /**
        * Watcher to check the searchInputValue for layerSelection module
        */
        searchInputValue: {
            handler (value) {
                if (value === "") {
                    this.removePointMarker();
                    this.removePolygonMarker();
                    this.removeHighlight3DTile();
                }
                else {
                    this.checkCurrentComponent(this.currentComponentSide);
                }
            },
            deep: true
        },
        /**
         * Watcher for value of placeholder.
         */
        placeholder (newValue) {
            this.layerSelectionPlaceHolder = newValue;
        }
    },
    created () {
        this.debouncedSearch = debounce((searchInput) => {
            const minimumCharacters = parseInt(this.minCharacters, 10);

            if (!searchInput || searchInput !== this.searchInputValue || searchInput.length < minimumCharacters) {
                return;
            }
            this.search({searchInput});
        }, 250);
    },
    updated () {
        this.$nextTick(() => {
            if (this.searchInput !== "") {
                this.$refs.searchInput.focus();
            }
        });
    },
    mounted () {
        this.checkLayerSelectionSearchConfig();
        this.currentComponentSide = this.menuCurrentComponent(this.currentSide).type;
        this.initializeModule({configPaths: this.configPaths, type: this.type});
        this.overwriteDefaultValues();
        this.instantiateSearchInterfaces(this.$searchInterfaceAddons);
    },
    methods: {
        ...mapActions(["initializeModule"]),
        ...mapActions("Maps", ["removePointMarker", "removePolygonMarker"]),
        ...mapActions("Modules/WaterRiskCheckSearchBar", [
            "instantiateSearchInterfaces",
            "overwriteDefaultValues",
            "activateActions",
            "startLayerSelectionSearch",
            "checkLayerSelectionSearchConfig",
            "search",
            "removeHighlight3DTile"
        ]),
        ...mapActions("Menu", ["navigateBack"]),
        ...mapMutations("Modules/WaterRiskCheckSearchBar", [
            "setGlobalPlaceholder",
            "addSuggestionItem",
            "setCurrentActionEvent",
            "setPlaceholder",
            "setShowAllResults",
            "setShowSearchResultsInTree",
            "setSearchInput",
            "setSearchInterfaces",
            "setSearchResultsActive",
            "setSearchSuggestions",
            "setCurrentSide",
            "setZoomLevel"
        ]),
        ...mapMutations("Menu", [
            "switchToRoot",
            "switchToPreviousComponent",
            "setCurrentComponentBySide",
            "setCurrentComponentPropsName", "setNavigationCurrentComponentBySide", "setNavigationHistoryBySide"
        ]),
        /**
         * Handles search submit: selects a matching result or triggers a new search.
         * @returns {void}
         */
        handleSearchSubmit () {
            const matched = this.tryToMarkAddressResult(this.searchInputValue);

            if (!matched) {
                this.setSearchResultsActive(true);
                this.setShowAllResults(false);
                this.checkCurrentComponent(this.currentComponentSide);
            }
        },
        /**
         * Starts the search in searchInterfaces, if min characters are introduced, updates the result list.
         * @param {String} currentComponentSide Current component type
         * @returns {void}
         */
        startSearch (currentComponentSide) {
            if (this.searchActivated) {
                if (currentComponentSide === "waterRiskCheck") {
                    this.clickAction();
                }
                if (this.isMobile) {
                    this.setNavigationCurrentComponentBySide({
                        side: this.currentSide,
                        newComponent: {props: {name: "Suchübersicht"}, type: "waterRiskCheckSearchBar"}
                    });
                    this.setCurrentComponentBySide({side: this.currentSide, type: "waterRiskCheckSearchBar"});
                    this.setNavigationHistoryBySide({
                        side: this.currentSide,
                        newHistory: [{type: "waterRiskCheck", props: {name: "Wegweiser Überflutungsvorsorge"}}]
                    });
                    const searchInput = this.searchInput;

                    this.$nextTick(() => this.setSearchInput(searchInput));
                }
                this.setSearchResultsActive(true);
                this.debouncedSearch(this.searchInputValue);
            }
        },
        /**
         * Handles the input action behavior of the search
         * @param {String} currentComponentType Current component type
         * @returns {void}
         */
        checkCurrentComponent (currentComponentType) {
            if (currentComponentType === "waterRiskCheck") {
                if (this.searchInputValue.length >= this.minCharacters) {
                    this.startSearch();
                }
            }
            else {
                this.startSearch();
            }
        },
        /**
         * Verifies if the search input matches an address result and, if so,
         * triggers the zoom action and marks the location.
         * @param {String} searchInputValue - The current value of the search input field.
         * @returns {Boolean} Returns true if an address match was found and the zoom was triggered; otherwise false.
         */
        tryToMarkAddressResult (searchInputValue) {
            let matched = false;

            if (searchInputValue?.trim()) {
                const normalizedInput = searchInputValue.trim().toLowerCase();

                this.removePointMarker();

                for (const searchResult of this.searchResults) {
                    const category = searchResult.category.toLowerCase(),
                        name = (searchResult.name || "").toLowerCase().trim();

                    if (
                        category.includes("adresse") ||
                        category.includes("address") ||
                        category.includes("straße")
                    ) {
                        if (normalizedInput === name) {
                            this.activateActions({searchResult, actionType: "onClick"});
                            matched = true;
                            break;
                        }
                    }
                }

                if (matched) {
                    this.setSearchResultsActive(false);
                    this.setShowAllResults(false);
                    this.setShowSearchResultsInTree(false);
                }
            }

            return matched;
        },
        clearSearch () {
            this.searchInputValue = "";
            this.$refs.searchInput.focus();
        }
    }
};
</script>

<template lang="html">
    <div id="water-risk-check-search-bar">
        <div class="input-group">
            <input
                id="searchInput"
                ref="searchInput"
                v-model="searchInputValue"
                type="search"
                class="form-control"
                :disabled
                :placeholder="$t(layerSelectionPlaceHolder)"
                :aria-label="$t(layerSelectionPlaceHolder)"
                @keydown.enter="tryToMarkAddressResult(searchInputValue), checkCurrentComponent(currentComponentSide)"
            >
            <button
                v-if="searchInputValue"
                class="btn-icon input-icon reset-button"
                type="button"
                aria-label="Clear search"
                @click="clearSearch"
            >
                <i class="bi-x-lg fs-6" />
            </button>
            <button
                id="water-risk-check-search-button"
                class="btn btn-primary"
                :disabled="!searchActivated"
                :aria-label="$t(placeholder)"
                type="button"
                @click="handleSearchSubmit"
                @keydown.enter="handleSearchSubmit"
            >
                <i
                    class="bi-search"
                    role="img"
                />
            </button>
        </div>
        <template v-if="isMobile && showSearchDropdown">
            <SearchBarSuggestionList
                v-if="!showAllResults"
                :limited-sorted-search-results="limitedSortedSearchResults"
            />
            <SearchBarResultList
                v-else-if="showAllResults"
                :limited-sorted-search-results="limitedSortedSearchResults"
            />
        </template>
        <div
            v-else
            class="dropdown"
        >
            <div
                v-show="showSearchDropdown"
                class="dropdown-menu show w-100 p-3"
            >
                <SearchBarSuggestionList
                    v-if="!showAllResults"
                    :limited-sorted-search-results="limitedSortedSearchResults"
                />
                <SearchBarResultList
                    v-else-if="showAllResults"
                    :limited-sorted-search-results="limitedSortedSearchResults"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .input-group {
        position: relative;
    }
    #water-risk-check-search-bar {
        #water-risk-check-search-button {
            border-top-right-radius: 5px;
            border-bottom-right-radius: 5px;
        }
        .input-label {
            color: $placeholder-color;
        }

        .dropdown {
            position: relative;
            overflow-anchor: none;
        }

        .dropdown-menu {
            position: absolute;
            top: calc(100% + 0.25rem);
            left: 0;
            right: 0;
            max-height: min(24rem, 50vh);
            overflow-y: auto;
            z-index: 20;
        }
    }
    input[type="search"] {
        -webkit-appearance: none;
        appearance: none;

        &::-webkit-search-cancel-button {
        display: none;
    }
    }
    .btn-icon {
        position: absolute;
        right: 40px;
        top: 40%;
        transform: translateY(-50%);
        background-color: rgba(0, 0, 0, 0);
        border: none;
        padding: 5px 0 0 10px;
        z-index: 5;
    }

    .input-icon {
        margin-left: -37px;
    }

    .reset-button {
        cursor: pointer;
    }

    li:hover, li.active {
        cursor: pointer;
        background: $light-grey;
        font-size: $font-size-base;
    }

    .overflowHidden{
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>


<script>
import {mapGetters, mapMutations} from "vuex";
import SearchBarSuggestionListItem from "./SearchBarSuggestionListItem.vue";

/**
 * Searchbar result list to show the categorized overview or single search results.
 * @module modules/searchBar/components/SearchBarSuggestionList
 * @vue-props {Object} limitedSortedSearchResults - Results the limited and sorted search results.
 * @vue-data {Array} currentShowAllList - Array of the single search results to show from the 'show all' button.
 */
export default {
    name: "SearchBarSuggestionList",
    components: {
        SearchBarSuggestionListItem
    },
    props: {
        limitedSortedSearchResults: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            currentShowAllList: []
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "minCharacters",
            "searchInput",
            "searchResults",
            "searchResultsActive",
            "showAllResults",
            "showAllResultsSearchInterfaceInstances"
        ])
    },
    methods: {
        ...mapMutations("Modules/LzsResearchClient", [
            "setCurrentAvailableCategories",
            "setShowAllResults",
            "setShowAllResultsSearchInterfaceInstances"
        ]),
        /**
         * Prepares the all results list of one category and adapts the navigation history
         * @param {String} categoryItem the category of the results
         * @returns {void}
         */
        prepareShowAllResults (categoryItem) {
            const interfaceToAdd = {id: this.limitedSortedSearchResults?.results?.categoryProvider[categoryItem], searchCategory: categoryItem},
                exists = this.showAllResultsSearchInterfaceInstances.find(searchInterface => searchInterface.id === interfaceToAdd.id);

            if (!exists) {
                const currentInterfaces = [...this.showAllResultsSearchInterfaceInstances];

                currentInterfaces.push(interfaceToAdd);
                this.setShowAllResultsSearchInterfaceInstances(currentInterfaces);
            }

            this.setCurrentAvailableCategories(categoryItem);
            this.currentShowAllList = this.limitedSortedSearchResults?.currentShowAllList.filter(value => {
                return value.category === categoryItem;
            });

            this.setShowAllResults(true);
        },
        /**
         * Returns the first search result object belonging to the given category.
         * Useful for accessing category-specific properties such as `imagePath` or `icon`.
         *
         * @param {String} category - The category name to search for.
         * @returns {Object|undefined} The first search result matching the category, or `undefined` if none is found.
         */
        getFirstByCategory (category) {
            const results = this.limitedSortedSearchResults?.results;

            return Object.values(results).find(
                (item) => item?.category === category
            );
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="searchInput?.length >= minCharacters && searchResultsActive && searchResults?.length > 0"
        class="lzs-research-client-suggestions-container"
    >
        <div
            v-for="categoryItem in limitedSortedSearchResults.results.availableCategories"
            :key="categoryItem"
        >
            <h5
                class="bold mb-4 mt-4"
                :title="$t('common:modules.searchBar.searchResultsFrom') + limitedSortedSearchResults.results.categoryProvider[categoryItem] + '-' + $t('common:modules.searchBar.search')"
            >
                <img
                    v-if="getFirstByCategory(categoryItem)?.imagePath"
                    alt="search result image"
                    class="search-bar-suggestion-image"
                    :src="getFirstByCategory(categoryItem).imagePath"
                >
                <i
                    v-if="!getFirstByCategory(categoryItem)?.imagePath"
                    :class="limitedSortedSearchResults.results[categoryItem + 'Icon']"
                />

                {{ categoryItem +": " + limitedSortedSearchResults.results[categoryItem+"Count"] + "    " + $t("common:modules.searchBar.searchResults") }}
            </h5>
            <div
                v-for="(item, index) in showAllResults===false ? limitedSortedSearchResults.results : limitedSortedSearchResults.currentShowAllList"
                :key="item.id + '-' + index"
            >
                <p
                    v-if="item.category===categoryItem"
                    :id="'suggestion_searchInputLi' + index"
                    class="mb-0"
                >
                    <SearchBarSuggestionListItem
                        :search-suggestion="item"
                    />
                </p>
            </div>
            <div class="showAllSection">
                <button
                    type="button"
                    class="btn btn-light d-flex text-left"
                    :title="$t('common:modules.searchBar.showAllResults')"
                    @click="prepareShowAllResults(categoryItem)"
                >
                    {{ $t("common:modules.searchBar.showAll") }}
                    <span class="bi-chevron-right" />
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
div.lzs-research-client-suggestions-container {
    overflow-y: visible;
    overflow-x: hidden;
    max-height: 70vH;

    button {
        span {
            margin-top: .1rem;
            margin-left: .25rem;
        }
    }

    .showAllSection {
        display: flex;
        justify-content: right;
        align-items: right;
    }

    .search-bar-suggestion-image{
        float: left;
        max-width: 21px;
        max-height: 21px;
        width: auto;
        height: auto;
        object-fit: contain;
        margin-right: 0.5rem;
    }
}
</style>

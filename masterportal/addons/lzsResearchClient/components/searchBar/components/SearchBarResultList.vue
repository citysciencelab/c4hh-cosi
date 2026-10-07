<script>
import {mapGetters} from "vuex";
import SearchBarResultListGeneral from "./SearchBarResultListGeneral.vue";

/**
 * Searchbar result list to show the categorized overview or single search results.
 * @module modules/searchBar/components/SearchBarResultList
 * @vue-props {Object} limitedSortedSearchResults - Results the limited and sorted search results.
 * @vue-data {Array} currentShowAllList - Array of the single search results to show from the 'show all' button.
 */
export default {
    name: "SearchBarResultList",
    components: {
        SearchBarResultListGeneral
    },
    props: {
        limitedSortedSearchResults: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "currentAvailableCategories",
            "minCharacters",
            "searchInput",
            "searchResults",
            "searchResultsActive",
            "currentSide"
        ]),
        ...mapGetters("Menu", [
            "currentComponent"
        ]),

        /**
         * Returns the result items for the current available categories.
         * @returns {Object[]} The result items.
         */
        resultItems () {
            return this.limitedSortedSearchResults?.currentShowAllList.filter(item => this.currentAvailableCategories.startsWith(item.category));
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="searchInput?.length >= minCharacters && searchResultsActive && searchResults?.length > 0"
        class="results-container"
    >
        <div id="lzs-research-client-search-bar-result-list">
            <SearchBarResultListGeneral
                :result-items="resultItems"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
button {
    span {
        margin-top: .1rem;
        margin-left: .25rem;
    }
}
.results-container {
    overflow-y: visible;
    overflow-x: hidden;
}
</style>

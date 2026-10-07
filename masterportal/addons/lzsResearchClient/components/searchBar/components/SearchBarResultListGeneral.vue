<script>
import SearchBarResultListGeneralItem from "./SearchBarResultListGeneralItem.vue";

/**
 * Searchbar result list to show the categorized overview or single search results.
 * @module modules/searchBar/components/SearchBarResultListGeneral
 * @vue-props {Object[]} resultItems - The result items.
 */
export default {
    name: "SearchBarResultListGeneral",
    components: {
        SearchBarResultListGeneralItem
    },
    props: {
        resultItems: {
            type: Array,
            required: true
        }
    }
};
</script>

<template lang="html">
    <div
        class="lzs-research-client-results-general-container"
    >
        <div
            v-for="(item, index) in resultItems"
            :key="item.id + '-' + index"
        >
            <p
                :id="'searchInputLi' + item.id"
                class="mb-1"
            >
                <SearchBarResultListGeneralItem
                    :search-result="item"
                />
            </p>
        </div>
    </div>
</template>

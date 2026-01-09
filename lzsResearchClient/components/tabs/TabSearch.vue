<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "TabSearch",
    components: {
        FlatButton
    },
    data () {
        return {
            activeContent: "searchOptionsList"
        };
    },
    methods: {
        changeSearchContent (contentId) {
            this.activeContent = contentId;
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
                    {{ $t('additional:modules.lzsResearchClient.tabs.tabSearch.searchWithGeometryHeading') }}

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
                    Search with attribute
                    <hr>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus qui saepe quae nihil, numquam, ut tempore consequatur cumque sapiente explicabo mollitia eligendi non rerum laboriosam? Voluptatibus odit delectus ratione eum.
                    <hr>
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
    position:relative;

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

    div.searchAttributes {
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

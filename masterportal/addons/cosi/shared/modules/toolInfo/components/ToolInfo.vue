<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
// import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {mapGetters} from "vuex";
import {uniqueId} from "@shared/js/utils/uniqueId";
import {VSkeletonLoader} from "vuetify/components/VSkeletonLoader";

export default {
    name: "ToolInfo",
    components: {
        AccordionItem,
        // FlatButton,
        VSkeletonLoader
    },
    props: {
        isOpen: {
            type: Boolean,
            default: true
        },
        loading: {
            type: Boolean,
            default: false
        },
        summary: {
            type: String,
            default: null
        },
        title: {
            type: String,
            default: "Information"
        },
        url: {
            type: [String, Object],
            default: null
        }
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"])
    },
    methods: {
        uniqueId,

        /**
         * Gets the right url by the current local.
         * @returns {String} The url.
         */
        getUrl () {
            if (typeof this.url === "string") {
                return this.url;
            }

            const locale = Object.keys(this.url).find(url => {
                return url.substring(0, url.indexOf("-")) === this.currentLocale.substring(0, url.indexOf("-"));
            });

            return this.url[locale];
        },

        /**
         * Opens the link to the manual in a new window.
         * @returns {String|null} The link to open.
         */
        openLink () {
            if (this.url) {
                return window.open(this.getUrl(), "_blank");
            }

            return null;
        }
    }
};
</script>

<template>
    <div class="tool-info-container">
        <template v-if="loading">
            <v-skeleton-loader
                height="40"
                type="heading"
            />
            <v-skeleton-loader
                height="68"
                type="paragraph"
            />
            <v-skeleton-loader
                class="justify-content-end"
                height="60"
                type="chip"
            />
        </template>
        <AccordionItem
            v-else-if="summary || url"
            :id="uniqueId()"
            icon="bi bi-info-circle"
            :title="title"
            :is-open="isOpen"
        >
            <p
                v-if="summary"
                class="mb-2"
            >
                {{ summary }}
            </p>
            <!-- <div
                v-if="url"
                class="d-flex justify-content-end"
            >
                <FlatButton
                    id="info-button"
                    aria="Informationen öffnen"
                    customclass="btn-sm rounded-pill fs-6 tool-info-button"
                    icon="bi bi-info-circle"
                    :interaction="() => openLink()"
                    :text="'Mehr Infos'"
                />
            </div> -->
        </AccordionItem>
    </div>
</template>

<style lang="scss" scoped>

    .tool-info-container {
        font-size: 0.85rem;
    }

</style>

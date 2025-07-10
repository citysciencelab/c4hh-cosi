<script>
import FlatButton from "../../../src/shared/modules/buttons/components/FlatButton.vue";
import {mapGetters} from "vuex";

export default {
    name: "ToolInfo",
    components: {
        FlatButton
    },
    props: {
        summary: {
            type: String,
            default: null
        },
        title: {
            type: String,
            default: "Werkzeuginformationen (Link öffnen)"
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
        <p
            v-if="summary"
            class="mb-1"
        >
            {{ summary }}
        </p>
        <div
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
        </div>
    </div>
</template>

<style lang="scss" scoped>

    .tool-info-container {
        font-size: 0.85rem;
        .tool-info-button {
            min-height: 1.5rem;
        }
    }

</style>

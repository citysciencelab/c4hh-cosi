<script>
import {mapActions} from "vuex";

export default {
    name: "ToolInfo",
    props: {
        title: {
            type: String,
            default: "Werkzeuginformationen (Link öffnen)"
        },
        url: {
            type: [String, Object],
            default: null
        },
        infoText: {
            type: String,
            default: undefined
        },
        summary: {
            type: String,
            default: null
        },
        locale: {
            type: String,
            default: "de"
        }
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),

        showInfo () {
            if (this.url) {
                return window.open(this.getUrl(), "_blank");
            }

            if (this.infoText) {
                this.cleanup();
                this.addSingleAlert({
                    category: "Info",
                    content: this.infoText,
                    displayClass: "info"
                });
            }

            return null;
        },

        getUrl () {
            if (typeof this.url === "string") {
                return this.url;
            }

            const locale = Object.keys(this.url)
                .find(
                    url => url.substring(0, url.indexOf("-")) === this.locale.substring(0, url.indexOf("-"))
                );

            return this.url[locale];
        }
    }
};
</script>

<template>
    <div>
        <v-row
            dense
            justify="end"
        >
            <v-col
                cols="17"
            >
                <p
                    v-if="summary"
                >
                    {{ summary }}
                </p>
            </v-col>
            <v-col
                cols="1"
            >
                <v-btn
                    v-if="infoText || url"
                    :title="title"
                    class="info_btn"
                    depressed
                    right
                    icon
                    x-small
                    @click="showInfo"
                >
                    <v-icon>mdi-help-circle</v-icon>
                </v-btn>
            </v-col>
        </v-row>
        <v-divider />
    </div>
</template>

<style lang="scss" scoped>
    .info_btn {
        margin: 0 0 0 auto;
    }
    p {
        margin-bottom: 0;
    }
</style>

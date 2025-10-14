<script>
import {VCard, VCardText} from "vuetify/components/VCard";

export default {
    name: "SimpleCard",
    components: {
        VCard,
        VCardText
    },
    props: {
        icon: {
            type: String,
            default: null
        },
        label: {
            type: String,
            default: ""
        },
        text: {
            type: String,
            default: ""
        },
        closeable: {
            type: Boolean,
            default: true
        },
        hoverable: {
            type: Boolean,
            default: false
        }
    },
    emits: ["click:close"]
};
</script>

<template lang="html">
    <v-card :class="{hoverable}">
        <v-card-text class="d-flex flex-row align-center">
            <div
                v-if="icon"
                class="p-1 fs-3"
            >
                <i :class="icon" />
            </div>
            <div class="ps-4 py-1 flex-grow-1">
                <div class="label">
                    {{ label }}
                </div>
                <div class="text">
                    {{ text }}
                </div>
            </div>
            <button
                v-if="closeable"
                type="button"
                class="btn-close align-self-start"
                aria-label="Close"
                @click="$emit('click:close')"
            />
        </v-card-text>
    </v-card>
</template>

<style lang="scss" scoped>
    .v-card {
        box-shadow: 2px 3px 13px 0px #00000033;
        border-radius: $badge-border-radius;
        border: 1px solid #DEE2E6;
        .v-card-text {
            padding: 0.6rem;
            .label {
                color: adjust-color($dark_grey, $lightness: 15%);
                font-size: $font-size-base * 0.9;
            }
            .text {
                font-size: $font-size-base;
            }
        }
        &.hoverable :hover {
            background-color: $light_blue;
        }
        .btn-close {
            width: 0.4em;
            height: 0.4em;
            padding-right: 0.3rem;
        }
    }
</style>

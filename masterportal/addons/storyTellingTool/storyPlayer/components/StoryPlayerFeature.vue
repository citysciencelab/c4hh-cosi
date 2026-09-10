<script>
import beautifyKey from "@shared/js/utils/beautifyKey.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {isEmailAddress} from "@shared/js/utils/isEmailAddress.js";
import {isHTML} from "@shared/js/utils/isHTML.js";
import {isImage, isWebLink} from "@shared/js/utils/urlHelper.js";
import {isPhoneNumber, getPhoneNumberAsWebLink} from "@shared/js/utils/isPhoneNumber.js";
import {mapActions} from "vuex";
import {translateKeyWithPlausibilityCheck} from "@shared/js/utils/translateKeyWithPlausibilityCheck.js";

export default {
    name: "StoryPlayerFeature",
    components: {
        FlatButton
    },
    props: {
        featureAttributes: {
            type: Object,
            required: true
        },
        imageAssetsById: {
            type: Object,
            required: false,
            default: () => ({})
        }
    },
    emits: ["closePopup"],
    computed: {
        /**
         * Returns the object URL of the feature image.
         * @returns {String} The feature image URL or an empty string.
         */
        featureImagePath () {
            const imageId = this.featureAttributes?.imageId;

            return imageId
                ? this.imageAssetsById?.[imageId]?.objectURL || ""
                : "";
        }
    },
    methods: {
        ...mapActions("Maps", ["removePointMarker"]),
        beautifyKey,
        getPhoneNumberAsWebLink,
        isEmailAddress,
        isHTML,
        isImage,
        isPhoneNumber,
        isWebLink,
        translateKeyWithPlausibilityCheck,

        /**
         * Checks if it has pipe
         * @param {String} value string to check.
         * @returns {Boolean} whether the given value includes a pipe.
         */
        hasPipe: function (value) {
            return typeof value === "string" && value.includes("|");
        }
    }
};
</script>

<template lang="html">
    <div
        id="feature-popup"
        class="bg-white d-flex flex-column position-relative"
    >
        <div
            v-if="featureAttributes?.image?.id && imageAssetsById[featureAttributes.image.id]?.objectURL"
            class="feature-image flex-shrink-0"
        >
            <img
                :src="imageAssetsById[featureAttributes.image.id].objectURL"
                :alt="featureAttributes.image.alt"
                class="w-100"
            >
            <div class="text-end px-2 pt-1">
                <small class="photocredit">© {{ featureAttributes.image.copyright }}</small>
            </div>
        </div>
        <div
            class="ps-3 pt-3 pe-3 overflow-auto flex-grow-1 feature-popup-body"
        >
            <h5 class="mb-2">
                {{ featureAttributes?.title }}
            </h5>

            <div class="description">
                {{ featureAttributes?.description }}
            </div>
            <div class="table-wrapper mt-2">
                <table class="table small">
                    <tbody v-if="featureAttributes?.attributes">
                        <tr
                            v-for="(value, key) in featureAttributes.attributes"
                            :key="key"
                        >
                            <td class="font-bold firstCol">
                                <span>
                                    {{ beautifyKey(translateKeyWithPlausibilityCheck(key, v => $t(v))) }}
                                </span>
                            </td>

                            <td v-if="isWebLink(value) && !isImage(value)">
                                <a
                                    :href="value"
                                    target="_blank"
                                >Link</a>
                            </td>

                            <td v-else-if="isWebLink(value) && isImage(value)">
                                <a
                                    :href="value"
                                    target="_blank"
                                >
                                    <img
                                        class="gfi-theme-images-image"
                                        :alt="$t('common:modules.getFeatureInfo.themes.default.imgAlt')"
                                        :src="value"
                                    >
                                </a>
                            </td>
                            <td v-else-if="isHTML(value)">
                                <div v-html="value" />
                            </td>
                            <td v-else-if="isPhoneNumber(value)">
                                <a :href="getPhoneNumberAsWebLink(value)">{{ value }}</a>
                            </td>
                            <td v-else-if="isEmailAddress(value)">
                                <a :href="`mailto:${value}`">{{ value }}</a>
                            </td>
                            <td
                                v-else-if="Array.isArray(value)"
                                v-html="value.join('<br>')"
                            />
                            <td v-else-if="hasPipe(value)">
                                <p
                                    v-for="(splitValue, splitKey) in value.split('|')"
                                    :key="splitKey"
                                >
                                    {{ splitValue }}
                                </p>
                            </td>
                            <td
                                v-else-if="typeof value === 'string' && value.includes('<br>')"
                                v-html="value"
                            />
                            <td v-else>
                                {{ value }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="feature-popup-footer position-absolute bottom-0 start-0 end-0 d-flex justify-content-center align-items-center ps-2 pe-2 pb-1 pt-5">
            <FlatButton
                id="save"
                class="mb-2"
                :icon="'bi-x-lg'"
                :text="$t('additional:modules.storyPlayer.close')"
                :title="$t('additional:modules.storyPlayer.close')"
                :secondary="true"
                :interaction="() => $emit('closePopup')"
            />
        </div>
    </div>
</template>

<style lang="scss">
#feature-popup {
    max-height: 60vh;
    max-width: 450px;
    border-radius: 5px;
    box-shadow: 0 8px 24px 8px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    font-size: $font_size_sm;

    .feature-image {
        img {
            display: block;
            width: 100%;
            max-height: 25vh;
            object-fit: cover;
        }

        small {
            font-size: $font_size_sm;
        }
    }

    .feature-title {
        font-family: $font_family_accent;
        font-size: 1.25rem;
        line-height: 1.2;
        color: $secondary;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .description {
        font-size: $font-size-base;
        line-height: 1.3;
        color: $dark_grey;
        white-space: normal;
        overflow-wrap: break-word;
    }

    .table {
        font-size: $font-size-base;
        line-height: 1.3;
        color: $dark_grey;
        margin-bottom: 0;

        td {
            padding-top: 0.3rem;
            padding-bottom: 0.3rem;
            vertical-align: top;
            overflow-wrap: break-word;
        }

        .firstCol {
            font-family: $font_family_accent;
            color: $dark_grey;
        }

        p {
            margin-bottom: 0.2rem;

            &:last-child {
                margin-bottom: 0;
            }
        }
    }
}
#feature-popup > .feature-popup-body {
    padding-bottom: 5rem;
}
</style>

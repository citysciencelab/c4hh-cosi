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
        }
    },
    emits: ["closePopup"],
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
        class="bg-white p-4"
    >
        <h5>{{ featureAttributes?.title }}</h5>
        <div>{{ featureAttributes?.description }}</div>
        <div
            class="table-wrapper mt-3"
        >
            <table class="table">
                <tbody v-if="featureAttributes?.attributes">
                    <tr
                        v-for="(value, key) in featureAttributes.attributes"
                        :key="key"
                    >
                        <td
                            class="font-bold firstCol"
                        >
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
        <div class="d-flex justify-content-center gap-2 mt-4">
            <FlatButton
                id="save"
                class="mb-3"
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
.table-wrapper {
    max-height: 300px;
    max-width: 500px;
    overflow: auto;
}
</style>

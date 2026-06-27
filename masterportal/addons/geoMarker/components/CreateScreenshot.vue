<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";

export default {
    components: {
        IconButton,
        ModalItem
    },
    props: {
        screenshotImage: {
            type: String,
            required: false,
            default: null
        },
        readonly: {
            type: Boolean,
            default: false
        }
    },
    emits: ["onScreenshotCreated", "onScreenshotDeleted"],
    data () {
        return {
            base64Image: this.screenshotImage,
            showModal: false
        };
    },
    computed: {
        imgSource () {
            return this.base64Image ? this.base64Image : false;
        }
    },
    watch: {
        screenshotImage (newValue) {
            this.base64Image = newValue;
        }
    },
    methods: {
        createScreenshot () {
            if (!this.readonly) {
                const map = mapCollection.getMap("2D"),
                    canvas = map.getViewport().querySelector("canvas");

                this.base64Image = canvas.toDataURL("image/png");
                this.$emit("onScreenshotCreated", this.base64Image);
            }
        },
        deleteScreenshot () {
            this.base64Image = undefined;
            this.$emit("onScreenshotDeleted");
        }
    }
};
</script>

<template>
    <div class="createScreenshotContainer">
        <div
            class="createScreenshot"
            role="button"
            tabindex="0"
            v-on="
                readonly || imgSource ? {
                    click: () => showModal = true,
                    keyup: (event) => {
                        // Handle enter key for enter and space key
                        if (event.keyCode === 13 || event.keyCode === 32) {
                            showModal = true
                        }
                    }
                } : {
                    click: () => createScreenshot(),
                    keyup: (event) => {
                        // Handle enter key for enter and space key
                        if (event.keyCode === 13 || event.keyCode === 32) {
                            createScreenshot()
                        }
                    }
                }
            "
        >
            <img
                v-if="imgSource"
                class="screenshotArea"
                :src="imgSource"
                :alt="$t('additional:modules.geoMarker.screenshot.altImage')"
            >

            <i
                v-else-if="!readonly && !imgSource"
                class="placeholderIcon icon bi-camera-fill"
            />

            <p
                v-else
                class="no-edit-cursor"
            >
                {{ $t("additional:modules.geoMarker.screenshot.noImageAvailable") }}
            </p>
        </div>

        <div class="screenshotButtonContainer">
            <IconButton
                v-if="!readonly"
                :class-array="['btn-light']"
                :aria="$t('additional:modules.geoMarker.screenshot.buttonCreate')"
                icon="bi-camera-fill"
                @click="createScreenshot"
            />

            <IconButton
                v-if="imgSource"
                :class-array="['btn-light']"
                :aria="$t('additional:modules.geoMarker.screenshot.buttonPreview')"
                icon="bi-image"
                @click="showModal = true"
            />

            <IconButton
                v-if="imgSource && !readonly"
                id="deleteScreenshotButton"
                :class-array="['btn-light']"
                :aria="$t('additional:modules.geoMarker.screenshot.buttonDelete')"
                icon="bi-trash3"
                @click="deleteScreenshot"
            />
        </div>

        <ModalItem
            :show-modal="showModal"
            @modalHid="showModal = false"
        >
            <template #default>
                <img
                    v-if="imgSource"
                    class="screenshotPreviewArea"
                    :src="imgSource"
                    :alt="$t('additional:modules.geoMarker.screenshot.altImage')"
                >
            </template>
        </ModalItem>
    </div>
</template>

<style lang="scss">

#geoMarker  {
    div.createScreenshotContainer {
        display: flex;
        flex-direction: column;

        div.createScreenshot {
            width: 8rem;
            height: 5rem;
            border: 0.125rem solid $dark_grey;
            position: relative;

            img.screenshotArea {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            i.placeholderIcon {
                font-size: 3rem;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
            }

            p.no-edit-cursor {
                cursor: default;
            }
        }

        div.screenshotButtonContainer {
            display: flex;

            button#deleteScreenshotButton {
               font-size: 1.2rem;
            }
        }
    }
}

div#modal-1-container {
    img.screenshotPreviewArea {
        max-width: 100%;
        max-height: 75vh;
    }

    div#modal-1-inner-wrapper > div:first-child {
        display: flex;
        justify-content: end;
    }
}
</style>

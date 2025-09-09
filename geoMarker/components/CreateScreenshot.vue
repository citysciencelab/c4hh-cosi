<script>
export default {
    props: {
        screenshotImage: {
            type: String,
            required: false,
            default: undefined
        }
    },
    emits: ["onScreenshotCreated"],
    data () {
        return {
            base64Image: this.screenshotImage
        };
    },
    computed: {
        imgSource () {
            return this.base64Image ? this.base64Image : false;
        }
    },
    methods: {
        createScreenshot () {
            const map = mapCollection.getMap("2D"),
                canvas = map.getViewport().querySelector("canvas");

            this.base64Image = canvas.toDataURL("image/png");
            this.$emit("onScreenshotCreated", this.base64Image);
        }
    }
};
</script>

<template>
    <div
        class="createScreenshot"
        role="button"
        tabindex="0"
        @click="createScreenshot"
        @keyup.enter="createScreenshot"
    >
        <img
            v-if="imgSource"
            class="screenshotArea"
            :src="imgSource"
            alt="$t('additional:modules.geoMarker.screenshotImage)"
        >

        <i
            v-else
            class="icon bi-camera-fill"
        />
    </div>
</template>

<style lang="scss">
@import "~variables";

#geoMarker  {
    div.createScreenshot {
        width: 8rem;
        height: 5rem;
        border: 0.125rem solid $dark_grey;

        img.screenshotArea {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        i.icon {
            font-size: 3rem;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
        }
    }
}
</style>

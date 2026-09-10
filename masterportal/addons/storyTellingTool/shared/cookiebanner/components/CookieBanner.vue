<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "CookieBanner",
    components: {
        FlatButton
    },
    emits: ["setCookie"],
    data () {
        return {
            privacy: "https://geodienste.hamburg.de/lgv-config/about-files/datenschutzerklaerung.pdf"
        };
    }
};
</script>

<template lang="html">
    <div class="cookie-banner text-center d-flex flex-column align-items-center p-4">
        <div>
            {{ $t("additional:modules.storyManager.cookiebanner.description") }}
        </div>
        <div class="player position-relative mt-3">
            <span />
        </div>
        <FlatButton
            class="mt-4"
            :aria-label="$t('additional:modules.storyManager.cookiebanner.playVideo')"
            :text="$t('additional:modules.storyManager.cookiebanner.playVideo')"
            @click.stop="$emit('setCookie')"
        />
        {{ $t("additional:modules.storyManager.cookiebanner.furtherInfo") }}
        <a
            :href="privacy"
            class="text-decoration-underline"
            target="_blank"
            @click.stop
        >
            {{ $t("additional:modules.storyManager.cookiebanner.privacy") }}
        </a>
    </div>
</template>

<style lang="scss" scoped>
.cookie-banner{
    background: $light_blue;
    .player {
        background: $secondary;
        border: none;
        width: 65px;
        height: 49px;
        border-radius: 8px;
        opacity: 0.5;
        span {
            width: 0;
            height: 0;
            border-top: 12px solid transparent;
            border-left: 20px solid #fff;
            border-bottom: 12px solid transparent;
            position: absolute;
            top: 24%;
            left: 38%;
        }
    }

    a {
        color: $dark_blue;
        &:hover {
            color: $secondary;
        }
    }
}

</style>

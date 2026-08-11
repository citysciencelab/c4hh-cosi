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
    <div class="cookie-banner text-center d-flex flex-column align-items-center">
        {{ $t("additional:modules.storyManager.cookiebanner.description") }}
        <FlatButton
            class="mt-3"
            :aria-label="$t('additional:modules.storyManager.cookiebanner.playVideo')"
            :text="$t('additional:modules.storyManager.cookiebanner.playVideo')"
            @click.stop="$emit('setCookie')"
        />
        {{ $t("additional:modules.storyManager.cookiebanner.furtherInfo") }}
        <a
            :href="privacy"
            target="_blank"
            @click.stop
        >
            {{ $t("additional:modules.storyManager.cookiebanner.privacy") }}
        </a>
    </div>
</template>

<style lang="scss" scoped>

</style>

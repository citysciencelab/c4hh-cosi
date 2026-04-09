<script>
import HrCard from "../../shared/components/HrCard.vue";
import HrFooter from "../../shared/components/HrFooter.vue";
import HrHeader from "../../shared/components/HrHeader.vue";

export default {
    name: "UpdateRequirements",
    components: {
        HrCard,
        HrFooter,
        HrHeader
    }
};
</script>

<template lang="html">
    <div>
        <HrHeader
            :text="$t('additional:modules.updateRequirements.description')"
            :button-text="$t('additional:modules.updateRequirements.createMessage')"
        />
        <HrCard
            title="Name Lorem Ipsum"
            edit-aria-label="Bearbeiten"
        >
            <template #above-title>
                <div class="ratio ratio-16x9 border rounded overflow-hidden mb-3">
                    <img
                        src="https://picsum.photos/id/1031/1200/675"
                        alt="Strassenansicht"
                        class="w-100 h-100"
                        style="object-fit: cover;"
                    >
                </div>
                <div class="d-flex flex-column justify-content-end align-items-center gap-2">
                    <small class="text-body-secondary">Aktualisierungsbedarf</small>
                    <span class="badge rounded-pill text-bg-primary fw-normal px-3 py-2">
                        Gefaehrdungsanalyse
                    </span>
                </div>
            </template>

            <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span class="text-body-secondary">erstellt am:</span>
                <span>04.04.2025</span>
                <span class="text-body-secondary">|</span>
                <span class="text-body-secondary">Initiator:</span>
                <span>Lorem Ipsum</span>
            </div>

            <p class="mb-3">
                <span class="text-body-secondary">letzte Aktualisierung:</span>
                <span class="ms-1">11.03.2026</span>
            </p>

            <p class="mb-3">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.
                Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.
            </p>

            <p class="mb-3">
                <a
                    href="https://www.infolink.de"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    www.infolink.de
                </a>
            </p>

            <p class="mb-0">
                Ansprechpartner
            </p>
        </HrCard>
        <HrFooter
            :cancel-text="$t('additional:modules.updateRequirements.cancelButtonLabel')"
            :save-text="$t('additional:modules.updateRequirements.saveButtonLabel')"
        />
    </div>
</template>

<style lang="scss" scoped>
</style>


<script>
import ButtonGroup from "@shared/modules/buttons/components/ButtonGroup.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {Popover} from "bootstrap";

export default {
    name: "PotentialDamagedBuilding",
    components: {
        ButtonGroup,
        FlatButton,
        InputText
    },
    data () {
        return {};
    },
    computed: {
    },
    mounted () {
        const popoverTriggerList = document.querySelectorAll("[data-bs-toggle='popover']");

        [...popoverTriggerList].map(popoverTriggerEl => new Popover(popoverTriggerEl));
    },
    methods: {}
};
</script>

<template lang="html">
    <p>
        {{ $t("additional:modules.potentialDamagedBuilding.description") }}
    </p>
    <h5 class="mt-3">
        {{ $t("additional:modules.potentialDamagedBuilding.headline.buildingAttributes") }}
    </h5>
    <ButtonGroup
        class="mt-3"
        :buttons="[{name: 'Gebäude'}, {name: 'Unterirdische Bauwerke'}]"
        group="building_attributes"
    />
    <h5 class="mt-5">
        {{ $t("additional:modules.potentialDamagedBuilding.headline.buildingOverview") }}
    </h5>
    <div class="row row-cols-1 row-cols-md-2 g-4 justify-content-center">
        <div class="col">
            <div class="overview-card rounded p-3 text-center h-100 d-flex flex-column align-items-center justify-content-center">
                <span class="value fs-4 d-block text-truncate-custom">3</span>
                <span class="box-label d-block lh-sm mb-1">{{ $t("additional:modules.potentialDamagedBuilding.damagePotentialClass") }}</span>
                <span class="comment d-block small">aktuell verwendet</span>
                <button
                    type="button"
                    class="btn btn-link p-0 text-dark border-0"
                    tabindex="0"
                    data-bs-toggle="popover"
                    data-bs-placement="bottom"
                    data-bs-trigger="focus"
                    :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.damagePotentialClass')"
                >
                    <i class="bi bi-info-circle" />
                </button>
            </div>
        </div>
        <div class="col">
            <div class="overview-card rounded p-3 text-center h-100 d-flex flex-column align-items-center justify-content-center">
                <span class="value fs-5 d-block text-truncate-custom">10.03.2025</span>
                <span class="box-label d-block lh-sm mb-1">Aktualisierungsdatum</span>
                <span class="comment d-block small">letzte Aktualisierung  </span>
                <button
                    type="button"
                    class="btn btn-link p-0 text-dark border-0"
                    tabindex="0"
                    data-bs-toggle="popover"
                    data-bs-placement="bottom"
                    data-bs-trigger="focus"
                    :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.updateDate')"
                >
                    <i class="bi bi-info-circle" />
                </button>
            </div>
        </div>
    </div>
    <h5 class="headline mt-5 mb-3">
        <i class="bi bi-pencil-fill me-3" />
        {{ $t("additional:modules.potentialDamagedBuilding.headline.updateData") }}
    </h5>
    <h6 class="headline card-title mt-2">
        {{ $t("additional:modules.potentialDamagedBuilding.headline.lastUpdated") }}
    </h6>
    <div class="d-flex gap-1 align-items-center">
        <span class="card-hint mt-1">
            {{ $t("additional:modules.potentialDamagedBuilding.lastUpdatedHint") }}
        </span>
        <span class="ms-2">
            20.03.2026
        </span>
    </div>
    <div class="row g-3 mt-2">
        <div class="col-12 col-md-5">
            <div class="card shadow p-2 h-100">
                <div class="card-body">
                    <h6 class="headline card-title">
                        {{ $t("additional:modules.potentialDamagedBuilding.headline.adjustedDamagePotentialClass") }}
                    </h6>
                    <span class="card-hint">
                        {{ $t("additional:modules.potentialDamagedBuilding.adjustedDamagePotentialClassHint") }}
                    </span>
                    <InputText
                        id="adjusted-potential-damaged-class"
                        class="mt-3"
                        type="number"
                        :label="$t('additional:modules.potentialDamagedBuilding.damagePotentialClass')"
                        :placeholder="$t('additional:modules.potentialDamagedBuilding.damagePotentialClass')"
                    />
                </div>
            </div>
        </div>
        <div class="col-12 col-md-7">
            <div class="card shadow p-2 h-100">
                <div class="card-body">
                    <h6 class="headline card-title">
                        {{ $t("additional:modules.potentialDamagedBuilding.headline.comment") }}
                    </h6>
                    <span class="card-hint">
                        {{ $t("additional:modules.potentialDamagedBuilding.commentHint") }}
                    </span>
                    <InputText
                        id="comment-text"
                        class="mt-3"
                        html-type="textarea"
                        max-length="255"
                        :label="$t('additional:modules.potentialDamagedBuilding.headline.comment')"
                        :placeholder="$t('additional:modules.potentialDamagedBuilding.headline.comment')"
                    />
                </div>
            </div>
        </div>
    </div>
    <div class="d-flex justify-content-between align-items-center mt-4">
        <FlatButton
            id="reset"
            icon="bi bi-arrow-counterclockwise"
            :secondary="true"
            :aria-label="$t('additional:modules.potentialDamagedBuilding.reset')"
            :text="$t('additional:modules.potentialDamagedBuilding.reset')"
        />
        <FlatButton
            id="save"
            icon="bi bi-save"
            :aria-label="$t('additional:modules.potentialDamagedBuilding.save')"
            :text="$t('additional:modules.potentialDamagedBuilding.save')"
        />
    </div>
    <h5 class="headline mt-5 mb-3">
        <i class="bi bi-file-text me-3" />
        {{ $t("additional:modules.potentialDamagedBuilding.headline.potentialDamagedInformation") }}
    </h5>
    <div class="mb-4">
        <div class="d-flex align-items-center mb-2">
            <h6 class="headline-group mb-2">
                {{ $t("additional:modules.potentialDamagedBuilding.headline.potentialDamagedClass") }}
            </h6>
            <button
                type="button"
                class="btn btn-link p-0 text-dark border-0"
                tabindex="0"
                data-bs-toggle="popover"
                data-bs-placement="bottom"
                data-bs-trigger="focus"
                :data-bs-content="$t('additional:modules.potentialDamagedBuilding.description')"
            >
                <i class="ms-2 bi bi-info-circle" />
            </button>
        </div>
        <div class="row g-0 mb-1 ms-4">
            <div class="col-4 col-md-8">
                {{ $t("additional:modules.potentialDamagedBuilding.label.potentialDamagedClassCount") }}
            </div>
            <div class="col text-muted">
                3
            </div>
        </div>
        <div class="row g-0 mb-1 ms-4">
            <div class="col-4 col-md-8">
                {{ $t("additional:modules.potentialDamagedBuilding.label.potentialDamagedClassUpdate") }}
            </div>
            <div class="col text-muted">
                10.03.2025
            </div>
        </div>
        <div class="row g-0 mb-1 ms-4">
            <div class="col-4 col-md-8">
                {{ $t("additional:modules.potentialDamagedBuilding.label.potentialDamagedClassDerive") }}
            </div>
            <div class="col text-muted">
                4
            </div>
        </div>
        <div class="row g-0 mb-1 ms-4">
            <div class="col-4 col-md-8">
                {{ $t("additional:modules.potentialDamagedBuilding.label.potentialDamagedClassLastEntry") }}
            </div>
            <div class="col text-muted">
                3
            </div>
        </div>
        <div class="row g-0 mb-1 ms-4">
            <div class="col-4 col-md-8">
                {{ $t("additional:modules.potentialDamagedBuilding.label.potentialDamagedClassUpdate") }}
            </div>
            <div class="col text-muted">
                20.03.2026
            </div>
        </div>
        <div class="row g-0 mb-1 ms-4">
            <div class="col-4 col-md-8">
                {{ $t("additional:modules.potentialDamagedBuilding.headline.comment") }}
            </div>
            <div class="col text-muted">
                {{ $t("additional:modules.potentialDamagedBuilding.description") }}
            </div>
        </div>
    </div>
    <div class="mb-4">
        <div class="d-flex align-items-center mb-2">
            <h6 class="headline-group mb-2">
                {{ $t("additional:modules.potentialDamagedBuilding.headline.buildingFunction") }}
            </h6>
            <button
                type="button"
                class="btn btn-link p-0 text-dark border-0"
                tabindex="0"
                data-bs-toggle="popover"
                data-bs-placement="bottom"
                data-bs-trigger="focus"
                :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.buildingKey')"
            >
                <i class="ms-2 bi bi-info-circle" />
            </button>
        </div>
        <div class="row g-0 mb-1 ms-4">
            <div class="col-4 col-md-8">
                {{ $t("additional:modules.potentialDamagedBuilding.label.buildingKey") }}
            </div>
            <div class="col text-muted">
                1010
            </div>
        </div>
        <div class="row g-0 ms-4">
            <div class="col-4 col-md-8">
                {{ $t("additional:modules.potentialDamagedBuilding.label.builingFunction") }}
            </div>
            <div class="col text-muted">
                Wohnhaus
            </div>
        </div>
    </div>
    <div class="mb-4">
        <div class="d-flex align-items-center mb-2">
            <h6 class="headline-group mb-2">
                {{ $t("additional:modules.potentialDamagedBuilding.headline.additionalBuildingFunction") }}
            </h6>
            <button
                type="button"
                class="btn btn-link p-0 text-dark border-0"
                tabindex="0"
                data-bs-toggle="popover"
                data-bs-placement="bottom"
                data-bs-trigger="focus"
                :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.additionalBuildingFunction')"
            >
                <i class="ms-2 bi bi-info-circle" />
            </button>
        </div>
        <div class="row g-0 mb-1 ms-4">
            <div class="col-4 col-md-8">
                {{ $t("additional:modules.potentialDamagedBuilding.label.additionalBuilingKey") }}
            </div>
            <div class="col text-muted">
                10600123
            </div>
        </div>
        <div class="row g-0 ms-4">
            <div class="col-4 col-md-8">
                {{ $t("additional:modules.potentialDamagedBuilding.label.additionalBuilingFunction") }}
            </div>
            <div class="col text-muted">
                Tiefgarage
            </div>
        </div>
    </div>
    <div class="mb-4">
        <h6 class="headline-group mb-2">
            {{ $t("additional:modules.potentialDamagedBuilding.headline.additionalInformation") }}
        </h6>
        <div class="row g-0 mb-1 ms-4">
            <div class="col-4 col-md-8 d-flex align-items-center">
                <span>{{ $t("additional:modules.potentialDamagedBuilding.label.earthSurface") }}</span>

                <button
                    type="button"
                    class="btn btn-link p-0 text-dark border-0 lh-1"
                    tabindex="0"
                    data-bs-toggle="popover"
                    data-bs-placement="bottom"
                    data-bs-trigger="focus"
                    :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.earthSurface')"
                >
                    <i class="ms-2 bi bi-info-circle" />
                </button>
            </div>
            <div class="col text-muted">
                -
            </div>
        </div>
        <div class="row g-0 ms-4">
            <div class="col-4 col-md-8 d-flex align-items-center">
                <span> {{ $t("additional:modules.potentialDamagedBuilding.label.buildingConstructionType") }} </span>
                <button
                    type="button"
                    class="btn btn-link p-0 text-dark border-0 lh-1"
                    tabindex="0"
                    data-bs-toggle="popover"
                    data-bs-placement="bottom"
                    data-bs-trigger="focus"
                    :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.buildingConstructionType')"
                >
                    <i class="ms-2 bi bi-info-circle" />
                </button>
            </div>
            <div class="col text-muted">
                -
            </div>
        </div>
        <div class="row g-0 ms-4">
            <div class="col-4 col-md-8 d-flex align-items-center">
                <span> {{ $t("additional:modules.potentialDamagedBuilding.label.basementLevels") }} </span>
                <button
                    type="button"
                    class="btn btn-link p-0 text-dark border-0 lh-1"
                    tabindex="0"
                    data-bs-toggle="popover"
                    data-bs-placement="bottom"
                    data-bs-trigger="focus"
                    :data-bs-content="$t('additional:modules.potentialDamagedBuilding.popover.basementLevels')"
                >
                    <i class="ms-2 bi bi-info-circle" />
                </button>
            </div>
            <div class="col text-muted">
                3
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.overview-card {
    background-color: $primary;
    min-width: 0;
    hyphens: auto;
    word-wrap: break-word;

    span {
        display: block;
        inline-size: 100%;
        overflow-wrap: break-word;
    }
    .value {
        font-family: $font_family_accent;
        font-size: clamp(1.2rem, 4vw, 2rem);
        color: $secondary;
    }
    .comment {
        font-size: $font_size_sm;
        color: $dark_grey;
        font-size: clamp(0.85rem, 3vw, 1rem);
    }
    span:not(.value) {
        font-size: clamp(0.8rem, 2vw, 1rem);
        line-height: 1.2;
    }
}
.headline {
    color: $secondary;
    font-family: $font-family_accent;
}
.headline-group {
    color: $secondary;
}
.box-label {
    font-family: $font-family_accent;
}
.card-hint {
    font-size: $font_size_sm;
}
</style>


<script>
export default {
    name: "TrafficCountCalendarButtonGroup",
    props: {
        idPrefix: {
            type: String,
            required: true
        }
    },
    computed: {
        idSuffix: () => "DateInput"
    },
    methods: {
        openCalendar () {
            document.getElementById(this.idPrefix + this.idSuffix).focus();
        }
    }
};
</script>

<template>
    <span class="input-group-btn">
        <button
            :id="`${idPrefix + idSuffix}Button`"
            class="btn btn-outline-dark"
            type="button"
            @click="openCalendar"
        >
            <span
                class="bootstrap-icon"
                aria-hidden="true"
            >
                <i class="bi-grid-3x3-gap-fill" />
            </span>
        </button>
    </span>
</template>

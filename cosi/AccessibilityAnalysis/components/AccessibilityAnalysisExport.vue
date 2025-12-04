<script>
export default {
    name: "AccessibilityAnalysisExport",
    emits: ["export-geojson", "export-png"]
};
</script>

<template lang="html">
    <ul class="dropdown-menu">
        <li>
            <h6 class="dropdown-header fs-6">
                <i class="bi bi-map me-1" />
                Download
            </h6>
        </li>
        <li class="ps-4">
            <button
                class="dropdown-item"
                @click.stop="$emit('export-geojson', $event)"
            >
                GeoJSON
            </button>
        </li>
        <li class="ps-4">
            <button
                class="dropdown-item"
                @click.stop="$emit('export-png', $event)"
            >
                PNG
            </button>
        </li>
    </ul>
</template>

<style lang="scss" scoped>
    .dropdown-menu {
        li:first-child:hover {
            cursor: default
        }
        li:not(:first-child):hover {
            background-color: $primary;
        }
    }
</style>

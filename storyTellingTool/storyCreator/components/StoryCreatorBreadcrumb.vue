<script>
export default {
    name: "StoryCreatorBreadcrumb",
    props: {
        chapterTitle: {
            type: String,
            required: true
        },
        currentView: {
            type: String,
            required: true
        },
        storyTitle: {
            type: String,
            required: true
        }
    },
    emits: ["go-to-manager", "go-to-story"]
};
</script>

<template>
    <nav
        class="story-breadcrumb d-flex align-items-center mb-1"
        aria-label="breadcrumb"
    >
        <ol class="breadcrumb mb-0 small">
            <li class="breadcrumb-item">
                <a
                    href="#"
                    class="story-breadcrumb__link"
                    @click.prevent="$emit('go-to-manager')"
                >{{ $t('additional:modules.storyManager.title') }}</a>
            </li>
            <li
                v-if="currentView === 'story'"
                class="breadcrumb-item active"
                aria-current="page"
            >
                {{ $t('additional:modules.storyCreator.breadcrumb.storyNav') }}: {{ storyTitle }}
            </li>
            <template v-else-if="currentView === 'chapter'">
                <li class="breadcrumb-item">
                    <a
                        href="#"
                        class="story-breadcrumb__link"
                        @click.prevent="$emit('go-to-story')"
                    >{{ $t('additional:modules.storyCreator.breadcrumb.storyNav') }}: {{ storyTitle }}</a>
                </li>
                <li
                    class="breadcrumb-item active"
                    aria-current="page"
                >
                    {{ $t('additional:modules.storyCreator.breadcrumb.chapterNav') }}: {{ chapterTitle }}
                </li>
            </template>
        </ol>
    </nav>
</template>

<style lang="scss" scoped>
.story-breadcrumb {
    font-size: 1rem;
    --bs-breadcrumb-divider: ">";

    .breadcrumb {
        flex-wrap: nowrap;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &-item + &-item::before {
            color: $link-color;
        }

        &-item.active {
            color: $dark_blue;
            max-width: 20rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            display: inline-block;
        }
    }

    &__link {
        color: $link-color;
        text-decoration: none;
        max-width: 12rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: inline-block;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>

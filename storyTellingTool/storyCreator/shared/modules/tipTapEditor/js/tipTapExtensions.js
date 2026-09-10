import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";

export default [
    StarterKit,
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            target: "_blank",
            rel: "noopener noreferrer"
        }
    }),
    TextStyle,
    Color
];

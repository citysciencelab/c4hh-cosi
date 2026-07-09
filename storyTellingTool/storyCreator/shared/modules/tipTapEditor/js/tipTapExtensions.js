import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

export default [
    StarterKit,
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            target: "_blank",
            rel: "noopener noreferrer"
        }
    })
];

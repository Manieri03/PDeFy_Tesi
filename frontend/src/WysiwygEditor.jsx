import { Editor } from "@tinymce/tinymce-react";
import { useRef, useEffect } from "react";
import "./WysiwygEditor.css";

export default function WysiwygEditor({ initialHtml, onChange }) {
    const editorRef = useRef(null);
    const apiKey = "r3755alfoihxdlyldqrjs3xexxp8neyyrifqy34da4hxwjef";

    useEffect(() => {
        if (editorRef.current && initialHtml) {
            const editor = editorRef.current;
            const currentContent = editor.getContent();
            if (currentContent !== initialHtml) {
                editor.setContent(initialHtml);
            }
        }
    }, [initialHtml]);

    return (
        <Editor
            apiKey={apiKey}
            className="editor_wysiwyg"
            onInit={(_evt, editor) => (editorRef.current = editor)}
            initialValue={initialHtml || ""}
            init={{
                height: 600,
                menubar: false,
                statusbar: false,
                toolbar:
                    "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | code",
                plugins: ["lists", "link", "autolink", "code", "table", "visualblocks", "wordcount"],

                setup: (editor) => {
                    if (editor.editorManager.i18n) {
                        editor.editorManager.i18n.add('it', {
                            'Cancel': 'Annulla',
                            'Save': 'Salva'
                        });
                    }
                },
                content_style: `
                    body { font-family: Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; padding: 1rem; }
                    h1,h2,h3,h4,h5,h6 { margin-top: 1em; font-weight: 600; }
                    p { margin-bottom: 1em; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ccc; padding: 6px; }
                `,
            }}
            onEditorChange={(newContent) => onChange?.(newContent)}
        />
    );
}

import { Editor } from "@tinymce/tinymce-react";
import { useRef, useEffect } from "react";
import "./WysiwygEditor.css";

export default function WysiwygEditor({ initialHtml, onChange, style }) {
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

    function addDeleteButtons(editor) {
        const doc = editor.getDoc();
        const sections = doc.querySelectorAll('section[id^="exercise-"]');

        sections.forEach(section => {
            if (section.querySelector('.delete-btn')) return;

            const btn = doc.createElement('button');
            btn.className = 'delete-btn';
            btn.textContent = "x";
            btn.style.cssText = `
              position: absolute;
              top: 5px;
              right: 5px;
              cursor: pointer;
              z-index: 1000;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 18px;
              height:18px;
              border-radius: 30%;
              font-weight:bold;
              background-color: red;
              color:white;
              border: none;
            `;
            btn.addEventListener('mouseenter', () => btn.style.backgroundColor = 'darkred');
            btn.addEventListener('mouseleave', () => btn.style.backgroundColor = 'red');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                section.remove();
            });
            section.style.position = 'relative';
            section.appendChild(btn);
        });
    }

    return (
        <Editor
            apiKey={apiKey}
            className="editor_wysiwyg"
            onInit={(_evt, editor) => {
                editorRef.current = editor;
                addDeleteButtons(editor);
            }}
            initialValue={initialHtml || ""}
            init={{
                height: 600,
                menubar: false,
                statusbar: false,
                toolbar:
                    "undo redo | bold italic underline | bullist numlist | code",
                plugins: ["lists", "link", "autolink", "code", "table", "visualblocks", "wordcount"],
                language: "it",
                language_url: "https://cdn.tiny.cloud/1/no-api-key/tinymce/6/langs/it.js",
                content_style: style,

                setup: (editor) => {
                    editor.on('NodeChange', () => addDeleteButtons(editor));
                }
            }}
            onEditorChange={(newContent) => onChange?.(newContent)}
        />
    );
}

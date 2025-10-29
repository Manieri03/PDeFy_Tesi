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
                setTimeout(() => addDeleteButtons(editor), 200);
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

    function enableDragDropImageBlocks(editor) {
        const doc = editor.getDoc();

        let draggedBlock = null;

        doc.addEventListener('dragstart', (e) => {
            const block = e.target.closest('.exercise-image-container, .image-with-text, .image-with-placeholder-inline, .image-placeholder-container');
            if (!block) return;

            draggedBlock = block;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', 'dragging');
            block.style.opacity = '0.5';
        });

        doc.addEventListener('dragend', (e) => {
            if (draggedBlock) draggedBlock.style.opacity = '';
            draggedBlock = null;
        });

        doc.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        doc.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!draggedBlock) return;
            const target = e.target.closest('.exercise-image-container, .image-with-text, .image-with-placeholder-inline, li, div.images-grid, .image-item');
            if (!target || target === draggedBlock) return;

            target.parentNode.insertBefore(draggedBlock, target);
        });
    }


    return (
        <Editor
            apiKey={apiKey}
            className="editor_wysiwyg"
            onInit={(_evt, editor) => {
                editorRef.current = editor;
                setTimeout(() => addDeleteButtons(editor), 300);
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
                    editor.on("NodeChange", () => {
                        setTimeout(() => addDeleteButtons(editor), 100);
                    });
                    editor.on("SetContent", () => {
                        setTimeout(() => addDeleteButtons(editor), 100);
                    });
                    editor.on('init', () => {
                        enableDragDropImageBlocks(editor);
                    });
                },
            }}
            onEditorChange={(newContent) => onChange?.(newContent)}
        />
    );
}

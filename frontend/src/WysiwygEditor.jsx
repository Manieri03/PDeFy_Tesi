import { Editor } from "@tinymce/tinymce-react";
import { useRef, useEffect, useState } from "react";
import "./WysiwygEditor.css";

export default function WysiwygEditor({ initialHtml, onChange, style }) {
    const editorRef = useRef(null);
    const apiKey = import.meta.env.VITE_TINYMCE_API_KEY;

    useEffect(() => {
        if (editorRef.current && initialHtml) {
            const editor = editorRef.current;
            const currentContent = editor.getContent();
            if (currentContent !== initialHtml) {
                editor.setContent(initialHtml);
                setTimeout(() => {
                    addDeleteButtons(editor);
                    enableDragDropImageBlocks(editor);
                }, 300);
            }
        }
    }, [initialHtml]);

    function addDeleteButtons(editor) {
        const doc = editor.getDoc();
        const sections = doc.querySelectorAll('section[id^="exercise-"]');

        sections.forEach((section) => {
            if (section.querySelector(".delete-btn")) return;

            const btn = doc.createElement("button");
            btn.className = "delete-btn";
            btn.textContent = "x";
            btn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        cursor: pointer;
        z-index: 1000;
        width: 18px;
        height: 18px;
        border-radius: 30%;
        font-weight: bold;
        background-color: red;
        color: white;
        border: none;
      `;
            btn.addEventListener("mouseenter", () => (btn.style.backgroundColor = "darkred"));
            btn.addEventListener("mouseleave", () => (btn.style.backgroundColor = "red"));
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                section.remove();
            });
            section.style.position = "relative";
            section.appendChild(btn);
        });
    }

    function enableDragDropImageBlocks(editor) {
        const doc = editor.getDoc();
        let draggedBlock = null;

        // --- Drag start ---
        doc.addEventListener("dragstart", (e) => {
            const block = e.target.closest(
                ".image-placeholder, .image-with-text, .image-with-placeholder-inline, .image-placeholder-container"
            );
            if (!block) return;

            draggedBlock = block;
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", "dragging");
            block.style.opacity = "0.5";

            // Rimuove eventuale selezione di testo
            editor.getWin().getSelection()?.removeAllRanges();
            e.stopPropagation();
            e.stopImmediatePropagation();
        });

        doc.addEventListener("dragend", () => {
            if (draggedBlock) draggedBlock.style.opacity = "";
            draggedBlock = null;
        });

        // Evita interferenze con input/textarea
        const inputs = doc.querySelectorAll("input, textarea");
        inputs.forEach((input) => {
            input.addEventListener("mousedown", (e) => e.stopPropagation());
            input.addEventListener("dragstart", (e) => e.stopPropagation());
        });

        doc.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (!target || target === draggedBlock || target.contains(draggedBlock)) return;
        });

        doc.addEventListener("drop", (e) => {
            e.preventDefault();
            if (!draggedBlock) return;

            const dropTarget = e.target.closest(
                ".image-placeholder, .image-with-text, .image-with-placeholder-inline, .image-placeholder-container"
            );

            // Se stai rilasciando sopra un altro blocco immagine
            if (dropTarget && dropTarget !== draggedBlock) {
                const rect = dropTarget.getBoundingClientRect();
                const isAboveHalf = e.clientY < rect.top + rect.height / 2;

                if (isAboveHalf) {
                    // Inserisci PRIMA
                    dropTarget.parentNode.insertBefore(draggedBlock, dropTarget);
                } else {
                    // Inserisci DOPO
                    dropTarget.parentNode.insertBefore(draggedBlock, dropTarget.nextSibling);
                }
            } else {
                let range;
                if (doc.caretRangeFromPoint) {
                    range = doc.caretRangeFromPoint(e.clientX, e.clientY);
                } else if (e.rangeParent) {
                    range = doc.createRange();
                    range.setStart(e.rangeParent, e.rangeOffset);
                }

                if (!range) {
                    doc.body.appendChild(draggedBlock);
                } else {
                    range.insertNode(draggedBlock);
                }
            }

            draggedBlock.style.opacity = "";
            draggedBlock = null;

            editor.save();
            onChange?.(editor.getContent());
        });

    }


    return (
        <Editor
            apiKey={apiKey}
            className="editor_wysiwyg"
            onInit={(_evt, editor) => {
                editorRef.current = editor;
                setTimeout(() => {
                    addDeleteButtons(editor);
                    enableDragDropImageBlocks(editor);
                }, 300);
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
                },
            }}
            onEditorChange={(newContent) => {
                onChange?.(newContent);
            }}
        />
    );
}

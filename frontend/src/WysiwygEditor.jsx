import { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import "./WysiwygEditor.css";

export default function WysiwygEditor({ initialHtml }) {
    const [html, setHtml] = useState(initialHtml || "");
    const [showCode, setShowCode] = useState(false);

    return (
        <div className="wysiwyg-editor">
            <div className="editor-toggle">
                <button
                    onClick={() => setShowCode(!showCode)}
                    className="toggle-button"
                >
                    {showCode ? "Mostra WYSIWYG" : "Mostra Codice HTML"}
                </button>
            </div>

            {showCode ? (
                <textarea
                    className="html-textarea"
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                />
            ) : (
                <div className="ckeditor-wrapper">
                    <CKEditor
                        editor={ClassicEditor}
                        data={html}
                        onChange={(event, editor) => {
                            const data = editor.getData();
                            setHtml(data);
                        }}
                    />
                </div>
            )}

            <div className="preview">
                <h3>Anteprima</h3>
                <div className="preview-content" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
        </div>
    );
}

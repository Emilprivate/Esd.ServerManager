import React, { useState, useEffect, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import { useToast } from "../common/toastmanager";

interface FileEditorProps {
  filePath: string;
  onClose: () => void;
}

const FileEditor: React.FC<FileEditorProps> = ({ filePath, onClose }) => {
  const [content, setContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("plaintext");
  const [loading, setLoading] = useState<boolean>(true);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [showCloseConfirmation, setShowCloseConfirmation] =
    useState<boolean>(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetch(`/api/files/read?path=${encodeURIComponent(filePath)}`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content);
        setOriginalContent(data.content);
        setLanguage(detectLanguage(filePath));
        setLoading(false);
        addToast("success", "File loaded successfully!");
      })
      .catch(() => {
        addToast("error", "Failed to load the file.");
        setLoading(false);
      });
  }, [filePath]);

  const detectLanguage = (path: string): string => {
    const extension = path.split(".").pop();
    if (!extension) return "plaintext";
    const languages: { [key: string]: string } = {
      js: "javascript",
      json: "json",
      py: "python",
      html: "html",
      css: "css",
      md: "markdown",
      txt: "plaintext",
    };
    return languages[extension] || "plaintext";
  };

  const handleSave = useCallback(() => {
    addToast("loading", "Saving file...");
    fetch(`/api/files/save?path=${encodeURIComponent(filePath)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
      .then(() => {
        setOriginalContent(content);
        setUnsavedChanges(false);
        addToast("success", "File saved successfully!");
      })
      .catch(() => {
        addToast("error", "Failed to save the file.");
      });
  }, [content, filePath, addToast]);

  const handleClose = () => {
    if (unsavedChanges) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowCloseConfirmation(false);
    onClose();
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
      } else if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    },
    [handleSave, handleClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  if (loading) return <p className="text-gray-400">Loading editor...</p>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden w-3/4 h-3/4 flex flex-col">
        <div className="flex justify-between items-center bg-gray-800 p-4">
          <h2 className="text-xl font-bold text-white">{filePath}</h2>
          <button
            onClick={handleClose}
            className="text-red-500 hover:text-red-300 font-bold"
          >
            Close
          </button>
        </div>
        <div className="flex-1">
          <MonacoEditor
            height="100%"
            theme="vs-dark"
            language={language}
            value={content || ""}
            onChange={(value: string | null) => {
              setContent(value || "");
              setUnsavedChanges(value !== originalContent);
            }}
            options={{
              selectOnLineNumbers: true,
              automaticLayout: true,
            }}
          />
        </div>
        <div className="p-4 bg-gray-800 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!unsavedChanges}
            className={`px-4 py-2 rounded ${
              unsavedChanges
                ? "bg-blue-500 text-white hover:bg-blue-400"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            Save
          </button>
        </div>
      </div>
      {showCloseConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-60 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded shadow-lg text-center">
            <p className="text-white mb-4">
              You have unsaved changes. Are you sure you want to close without
              saving?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowCloseConfirmation(false)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmClose}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-400"
              >
                Close Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileEditor;

import React, { useState, useEffect } from "react";
import {
  FaFolder,
  FaFile,
  FaArrowUp,
  FaTrash,
  FaEdit,
  FaUpload,
} from "react-icons/fa";
import { useToast } from "../common/toastmanager";
import FileEditor from "./fileeditor";
import CircularLoader from "../common/circularloader";

interface FileEntry {
  name: string;
  isDirectory: boolean;
}

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(".");
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loaderMessage, setLoaderMessage] = useState<string>("");
  const { addToast } = useToast();

  const fetchFiles = async () => {
    setLoading(true);
    setLoaderMessage("Loading files...");
    addToast("loading", "Loading files...");
    try {
      const response = await fetch(
        `/api/files/list?path=${encodeURIComponent(currentPath)}`
      );
      const data = await response.json();
      if (data.files) setFiles(data.files);
      setError(null);
      addToast("success", "Files loaded successfully!");
    } catch {
      setError("Failed to load files.");
      addToast("error", "Failed to load files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  const goUp = async () => {
    setLoading(true);
    setLoaderMessage("Navigating...");
    const parts = currentPath.split("/").filter(Boolean);
    setCurrentPath(parts.length > 1 ? parts.slice(0, -1).join("/") : ".");
    await fetchFiles();
  };

  const navigateTo = async (name: string) => {
    setLoading(true);
    setLoaderMessage("Opening folder...");
    setCurrentPath(`${currentPath}/${name}`);
    await fetchFiles();
  };

  const handleDelete = async (name: string) => {
    setLoading(true);
    setLoaderMessage(`Deleting ${name}...`);
    addToast("loading", `Deleting ${name}...`);
    try {
      const response = await fetch(
        `/api/files/delete?path=${encodeURIComponent(
          currentPath + "/" + name
        )}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setFiles((prevFiles) => prevFiles.filter((file) => file.name !== name));
        addToast("success", `${name} deleted successfully!`);
      } else {
        throw new Error();
      }
    } catch {
      setError("Failed to delete the file.");
      addToast("error", `Failed to delete ${name}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setLoaderMessage(`Uploading ${files[0].name}...`);
    addToast("loading", `Uploading ${files[0].name}...`);
    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await fetch(
        `/api/files/upload?path=${encodeURIComponent(currentPath)}`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (response.ok) {
        setFiles((prevFiles) => [
          ...prevFiles,
          { name: files[0].name, isDirectory: false },
        ]);
        addToast("success", `${files[0].name} uploaded successfully!`);
      } else {
        throw new Error();
      }
    } catch {
      setError("Failed to upload the file.");
      addToast("error", `Failed to upload ${files[0].name}.`);
    } finally {
      setLoading(false);
    }
  };

  const supportedExtensions = ["txt", "json", "js", "html", "css", "py", "md"];

  const handleEdit = async (name: string) => {
    setLoading(true);
    setLoaderMessage("Opening file...");
    const filePath = `${currentPath}/${name}`;
    try {
      const response = await fetch(
        `/api/files/read?path=${encodeURIComponent(filePath)}`
      );
      if (response.ok) {
        setEditingFile(filePath);
      } else {
        throw new Error();
      }
    } catch {
      addToast("error", "Failed to open the file.");
    } finally {
      setLoading(false);
    }
  };

  if (editingFile) {
    return (
      <FileEditor filePath={editingFile} onClose={() => setEditingFile(null)} />
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {loading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 z-50">
          <CircularLoader message={loaderMessage} />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">File Manager</h2>
        {currentPath !== "." && (
          <button
            className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            onClick={goUp}
          >
            <FaArrowUp />
            <span>Go Up</span>
          </button>
        )}
      </div>
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">Path: {currentPath}</p>
          <label className="relative group bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center space-x-2 shadow-md transition-all duration-300 hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300">
            <FaUpload className="text-lg group-hover:scale-110 transition-transform duration-300" />
            <span className="font-medium group-hover:underline">Upload</span>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleUpload}
            />
          </label>
        </div>
        {error && <p className="text-red-400">{error}</p>}
        <ul className="divide-y divide-gray-700">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center justify-between p-3 hover:bg-gray-700"
            >
              <div className="flex items-center space-x-3">
                {file.isDirectory ? (
                  <FaFolder className="text-yellow-500" />
                ) : (
                  <FaFile className="text-gray-500" />
                )}
                <span
                  className="cursor-pointer"
                  onClick={() => file.isDirectory && navigateTo(file.name)}
                >
                  {file.name}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                {!file.isDirectory &&
                  supportedExtensions.includes(
                    file.name.split(".").pop() || ""
                  ) && (
                    <button
                      className="text-green-400 hover:text-green-300"
                      onClick={() => handleEdit(file.name)}
                    >
                      <FaEdit />
                    </button>
                  )}
                <button
                  className="text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(file.name)}
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FileManager;

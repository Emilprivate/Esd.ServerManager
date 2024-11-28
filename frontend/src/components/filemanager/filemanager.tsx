import React, { useState, useEffect } from "react";
import {
  FaFolder,
  FaFile,
  FaArrowUp,
  FaTrash,
  FaEdit,
  FaUpload,
  FaSearch,
  FaPlus,
} from "react-icons/fa";
import { useToast } from "../common/toastmanager";
import FileEditor from "./fileeditor";
import CircularLoader from "../common/circularloader";

interface FileEntry {
  name: string;
  isDirectory: boolean;
}

const supportedExtensions = ["txt", "md", "js", "jsx", "ts", "tsx", "json"];

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(".");
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loaderMessage, setLoaderMessage] = useState<string>("");
  const { addToast } = useToast();

  const [searchPath, setSearchPath] = useState<string>("");
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [newFilename, setNewFilename] = useState<string>("");

  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [, setShowUploadModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [, setUploadFiles] = useState<FileList | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setLoaderMessage("Loading files...");
    try {
      const response = await fetch(
        `/api/files/list?path=${encodeURIComponent(currentPath)}`
      );
      const data = await response.json();
      if (data.files) setFiles(data.files);
      setError(null);
    } catch {
      setError("Failed to load files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  const goUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    setCurrentPath(parts.length > 1 ? parts.slice(0, -1).join("/") : ".");
  };

  const navigateTo = (name: string) => {
    setCurrentPath(`${currentPath}/${name}`);
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    setLoading(true);
    setLoaderMessage(`Deleting selected files...`);
    try {
      const promises = Array.from(selectedFiles).map((name) =>
        fetch(
          `/api/files/delete?path=${encodeURIComponent(
            currentPath + "/" + name
          )}`,
          {
            method: "DELETE",
          }
        )
      );
      await Promise.all(promises);
      setFiles((prevFiles) =>
        prevFiles.filter((file) => !selectedFiles.has(file.name))
      );
      setSelectedFiles(new Set());
      addToast("success", "Selected files deleted successfully!");
    } catch {
      setError("Failed to delete selected files.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const isDirectory = Array.from(files).some(
      (file) => file.webkitRelativePath && file.webkitRelativePath.includes("/")
    );

    if (isDirectory) {
      setUploadFiles(files);
      setShowUploadModal(true);
    } else {
      uploadFilesToServer(files);
    }
  };

  const uploadFilesToServer = async (files: FileList) => {
    setLoading(true);
    setLoaderMessage(`Uploading files...`);

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = file.webkitRelativePath || file.name;
      formData.append("files", file, relativePath);
    }

    try {
      const response = await fetch(
        `/api/files/upload-directory?path=${encodeURIComponent(currentPath)}`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (response.ok) {
        await fetchFiles();
        addToast("success", `Files uploaded successfully!`);
      } else {
        throw new Error();
      }
    } catch {
      setError("Failed to upload the files.");
    } finally {
      setLoading(false);
      setUploadFiles(null);
    }
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    await handleDeleteSelected();
  };

  const toggleSelectFile = (name: string) => {
    setSelectedFiles((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(name)) {
        newSelected.delete(name);
      } else {
        newSelected.add(name);
      }
      return newSelected;
    });
  };

  const handlePathSearch = () => {
    if (searchPath.trim() === "") {
      addToast("error", "Please enter a valid path.");
      return;
    }
    setCurrentPath(searchPath);
  };

  const handleCreateFile = async () => {
    if (newFilename.trim() === "") {
      addToast("error", "Please enter a valid filename.");
      return;
    }
    setLoading(true);
    setLoaderMessage(`Creating ${newFilename}...`);
    try {
      const response = await fetch(
        `/api/files/create?path=${encodeURIComponent(currentPath)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: newFilename }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setFiles((prevFiles) => [
          ...prevFiles,
          { name: data.filename, isDirectory: false },
        ]);
        setIsCreatingFile(false);
        setNewFilename("");
        addToast("success", `${data.filename} created successfully!`);
      } else {
        throw new Error();
      }
    } catch {
      setError("Failed to create the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim() === "") {
      addToast("error", "Please enter a valid folder name.");
      return;
    }
    setLoading(true);
    setLoaderMessage(`Creating folder ${newFolderName}...`);
    try {
      const response = await fetch(
        `/api/files/create-folder?path=${encodeURIComponent(currentPath)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderName: newFolderName }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setFiles((prevFiles) => [
          ...prevFiles,
          { name: data.folderName, isDirectory: true },
        ]);
        setIsCreatingFolder(false);
        setNewFolderName("");
        addToast("success", `${data.folderName} created successfully!`);
      } else {
        throw new Error();
      }
    } catch {
      setError("Failed to create the folder.");
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
        <div className="flex items-center space-x-2">
          <button
            aria-label="Create New File"
            className="bg-green-500 hover:bg-green-400 text-white px-3 py-2 rounded-lg flex items-center space-x-2"
            onClick={() => setIsCreatingFile(true)}
          >
            <FaPlus className="text-lg" />
            <span>New File</span>
          </button>
          <button
            aria-label="Create New Folder"
            className="bg-purple-500 hover:bg-purple-400 text-white px-3 py-2 rounded-lg flex items-center space-x-2"
            onClick={() => setIsCreatingFolder(true)}
          >
            <FaFolder className="text-lg" />
            <span>New Folder</span>
          </button>
          <label
            aria-label="Upload Files"
            className="relative group bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg cursor-pointer flex items-center space-x-2"
          >
            <FaUpload className="text-lg" />
            <span className="font-medium">Upload</span>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleUpload}
              multiple
            />
          </label>
        </div>
      </div>
      <div className="flex items-center mb-4">
        <input
          type="text"
          className="flex-1 h-10 px-3 rounded-l-lg bg-gray-700 text-white focus:outline-none"
          placeholder="Enter path to navigate"
          value={searchPath}
          onChange={(e) => setSearchPath(e.target.value)}
        />
        <button
          aria-label="Search Path"
          className="h-10 bg-blue-500 hover:bg-blue-400 text-white px-4 rounded-r-lg"
          onClick={handlePathSearch}
        >
          <FaSearch />
        </button>
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">Path: {currentPath}</p>
        <div className="flex items-center space-x-2">
          {selectedFiles.size > 0 && (
            <button
              aria-label="Delete Selected Files"
              className="bg-red-500 hover:bg-red-400 text-white px-3 py-2 rounded-lg flex items-center space-x-2"
              onClick={() => setShowDeleteModal(true)}
            >
              <FaTrash className="text-lg" />
              <span>Delete Selected</span>
            </button>
          )}
          {currentPath !== "." && (
            <button
              aria-label="Go Up"
              className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              onClick={goUp}
            >
              <FaArrowUp className="text-lg" />
              <span>Go Up</span>
            </button>
          )}
        </div>
      </div>
      {isCreatingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-white text-lg mb-4">Create New File</h3>
            <input
              type="text"
              className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
              placeholder="Enter filename"
              value={newFilename}
              onChange={(e) => setNewFilename(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => {
                  setIsCreatingFile(false);
                  setNewFilename("");
                }}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded"
                onClick={handleCreateFile}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {isCreatingFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-white text-lg mb-4">Create New Folder</h3>
            <input
              type="text"
              className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }}
              >
                Cancel
              </button>
              <button
                className="bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 rounded"
                onClick={handleCreateFolder}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-white text-lg mb-4">Confirm Delete</h3>
            <p className="text-gray-400 mb-4">
              Are you sure you want to delete the selected files? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded"
                onClick={handleConfirmDelete}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex-1 overflow-auto">
        {error && <p className="text-red-400">{error}</p>}
        <ul className="divide-y divide-gray-700">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center justify-between p-3 hover:bg-gray-700"
            >
              <div className="flex items-center space-x-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedFiles.has(file.name)}
                    onChange={() => toggleSelectFile(file.name)}
                  />
                  <span
                    className={`w-5 h-5 rounded-sm border-2 ${
                      selectedFiles.has(file.name)
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-500"
                    } hover:bg-gray-500`}
                  ></span>
                </label>
                {file.isDirectory ? (
                  <FaFolder
                    className="text-yellow-500 cursor-pointer text-lg"
                    onClick={() => navigateTo(file.name)}
                  />
                ) : (
                  <FaFile className="text-gray-500 text-lg" />
                )}
                <span
                  className={`${file.isDirectory ? "cursor-pointer" : ""}`}
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
                      aria-label="Edit File"
                      className="text-green-400 hover:text-green-300"
                      onClick={() =>
                        setEditingFile(`${currentPath}/${file.name}`)
                      }
                    >
                      <FaEdit className="text-lg" />
                    </button>
                  )}
                <button
                  aria-label="Delete File"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => {
                    setSelectedFiles(new Set([file.name]));
                    setShowDeleteModal(true);
                  }}
                >
                  <FaTrash className="text-lg" />
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

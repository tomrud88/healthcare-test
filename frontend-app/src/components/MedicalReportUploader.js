import React, { useState } from "react";

function MedicalReportUploader({ onFileUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Updated to real backend endpoint:
      const response = await fetch(
        "https://upload-medical-documents-750964638675.us-central1.run.app/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      if (data.fileUrl) {
        onFileUploaded(data.fileUrl);
        setFile(null);
      } else {
        setError("Failed to get file URL.");
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  return (
    <div className="mb-4">
      <label className="block mb-1 font-semibold">Upload Medical Report:</label>
      <div className="flex items-center gap-2">
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="border rounded p-1"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}

export default MedicalReportUploader;

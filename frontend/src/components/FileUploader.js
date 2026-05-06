import React, { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 150;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const FileUploader = ({ onFilesSelected, acceptedTypes }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const acceptedFormats = useMemo(
    () =>
      acceptedTypes || {
        "application/pdf": [".pdf"],
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "application/vnd.ms-excel.sheet.macroEnabled.12": [".xlsm"],
        "text/plain": [".txt"],
        "text/csv": [".csv"],
      },
    [acceptedTypes]
  );

  const onDrop = useCallback(
    (acceptedFiles) => {
      setSelectedFiles(acceptedFiles);
      onFilesSelected?.(acceptedFiles);
    },
    [onFilesSelected]
  );

  const onDropRejected = useCallback((fileRejections) => {
    if (!fileRejections.length) {
      return;
    }

    const message = fileRejections
      .map(({ file, errors }) => `${file.name}: ${errors.map((error) => error.message).join(", ")}`)
      .join(". ");

    toast.error(message);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: acceptedFormats,
    multiple: true,
    maxSize: MAX_FILE_SIZE,
  });

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, itemIndex) => itemIndex !== index);
    setSelectedFiles(newFiles);
    onFilesSelected?.(newFiles);
  };

  return (
    <div>
      <div
        {...getRootProps()}
        data-testid="file-uploader"
        className={`border-2 border-dashed border-zinc-300 rounded-none p-12 text-center bg-zinc-50 cursor-pointer upload-zone ${
          isDragActive ? "border-[#0033CC] bg-zinc-100" : ""
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto text-zinc-400 mb-4" strokeWidth={1.5} />
        <p className="text-zinc-700 font-medium mb-2">
          {isDragActive
            ? "Suelta los archivos aqui..."
            : "Arrastra archivos aqui o haz clic para seleccionar"}
        </p>
        <p className="text-sm text-zinc-500">
          Formatos: PDF, imagenes, Word, Excel, TXT y CSV. Maximo {MAX_FILE_SIZE_MB} MB por archivo.
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-700 mb-2">
            Archivos seleccionados ({selectedFiles.length})
          </h3>
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              data-testid={`selected-file-${index}`}
              className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-none"
            >
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-[#0033CC]" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-zinc-900">{file.name}</p>
                  <p className="text-xs text-zinc-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                data-testid={`remove-file-${index}`}
                className="text-zinc-400 hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;

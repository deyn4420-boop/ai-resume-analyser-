import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/utils";

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
    const [file, setFile] = useState<File | null>(null);
    const maxSize = 20 * 1024 * 1024;

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const selectedFile = acceptedFiles[0] || null;

            setFile(selectedFile);
            onFileSelect?.(selectedFile);
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            "application/pdf": [".pdf"],
        },
        maxSize,
    });

    return (
        <div className="w-full gradient-border">
            <div {...getRootProps({ className: "uploader-drag-area" })}>
                <input {...getInputProps({ id: "uploader" })} />

                {file ? (
                    <div
                        className="uploader-selected-file"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center space-x-3 min-w-0">
                            <img src="/images/pdf.png" alt="pdf" className="size-10" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                    {file.name}
                                </p>
                                <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="p-2 cursor-pointer"
                            onClick={() => {
                                setFile(null);
                                onFileSelect?.(null);
                            }}
                        >
                            <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-4 cursor-pointer text-center">
                        <img src="/icons/info.svg" alt="upload" className="size-20" />

                        <div>
                            <p className="text-lg text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and
                                drop
                            </p>

                            <p className="text-lg text-gray-500">
                                PDF (max {formatSize(maxSize)})
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploader;

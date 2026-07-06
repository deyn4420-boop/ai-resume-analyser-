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

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            "application/pdf": [".pdf"],
        },
        maxSize,
    });

    return (
        <div className="w-full gradient-border">
            <div {...getRootProps()}>
                <input {...getInputProps()} />

                <div className="space-y-4 cursor-pointer">
                    <img src="/icons/info.svg" alt="upload" className="size-20" />

                    {file ? (
                        <div className="text-center">
                            <p className="text-lg text-gray-700 font-medium truncate">
                                {file.name}
                            </p>
                            <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-lg text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag
                                and drop
                            </p>

                            <p className="text-lg text-gray-500">
                                PDF (max {formatSize(maxSize)})
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileUploader;

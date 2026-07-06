export const formatSize = (bytes: number): string => {
    const units = ["KB", "MB", "GB"] as const;
    let size = bytes / 1024;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    const formattedSize = Number.isInteger(size) ? size.toString() : size.toFixed(1);

    return `${formattedSize} ${units[unitIndex]}`;
};

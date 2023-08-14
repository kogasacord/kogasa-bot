export type DownloadResponse = {
    filename: string,
    name: string,
    mimetype: string,
}
export type UploadResponse = {
    name: string,
    view: string,
    content: string,
    id: string,
}
export type InfoResponse = {
    file: string,
    size_mbytes: number,
    size_mbits: number,
    speed_mbits: number,
    uploader: string,
    duration: number,
    download_length_seconds: number,
}
export type CheckResult = { 
    reasons?: ("NO_LINK" | "NO_PATH_NAME" | "NOT_YOUTUBE" | "NOT_VIDEO" | "TOO_LONG")[]
};
export type StatusResult = {
    hasReachedLimit: boolean,
    folderSize: number,
    limit?: string,
    usage?: string,
    usageInDrive?: string,
    usageInDriveTrash?: string,
}
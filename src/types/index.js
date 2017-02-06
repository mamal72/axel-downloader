export type DownloadOptions = {
  connections: number,
  maxSpeed: number,
  userAgent: string,
  headers: Array<{key: string, value: string}>
}

export type DownloadProgress = {
  downloading: boolean,
  progress: number,
  speed: number
}

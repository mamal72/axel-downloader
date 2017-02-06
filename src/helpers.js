// @flow
import StreamSplitter from 'stream-splitter';

import { DownloadProgress } from './types';


// Get a stream that splits on a token
export function splitStream(stream: any, token: string = '\n'): any {
  return stream.pipe(StreamSplitter(token));
}

// Get progress and speed of download from a line of string stdout
export function parseProgress(rawDownloadProgress: string): DownloadProgress {
  const regexPattern = /\[\s+(\d+)%][\s.]+\[\s*(\d+\.?\d)KB\/s]/;
  const matchedPatterns = rawDownloadProgress.match(regexPattern);

  if (!matchedPatterns) {
    return {
      downloading: false,
      progress: 0,
      speed: 0
    };
  }

  const [progress, speed] = [Number(matchedPatterns[1]), Number(matchedPatterns[2])];
  return {
    downloading: true,
    progress,
    speed
  };
}

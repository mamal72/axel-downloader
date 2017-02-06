// @flow
import EventEmitter from 'events';
import { spawn } from 'child_process';

import { splitStream, parseProgress } from './helpers';
import { DownloadOptions } from './types';


// A class for download task
export default class Download extends EventEmitter {
  constructor(
    url: string,
    downloadPath: string = process.cwd(),
    {
      connections = 16,
      maxSpeed = 0,
      userAgent,
      headers = []
    }: DownloadOptions = {}
  ) {
    super();

    // Stop download child process on exit
    process.on('exit', this.stop);

    this.url = url;
    this.downloadPath = downloadPath;
    this.connections = connections;
    this.maxSpeed = maxSpeed * 1024; // KB to B
    this.userAgent = userAgent;
    this.headers = headers;
    this.childProcess = null;
  }

  // Start download
  start(): void {
    Download.checkAxel();

    this.childProcess = spawn('axel', this.getCommandArgs());

    const stdout = splitStream(this.childProcess.stdout);
    const stderr = splitStream(this.childProcess.stderr);

    stdout.on('token', (data) => {
      const rawDownloadProgress = data.toString();
      const progressInfo = parseProgress(rawDownloadProgress);
      this.emit('progress', progressInfo);
    });
    stdout.on('close', () => {
      this.emit('finish');
    });
    stderr.on('data', (err) => {
      this.emit('error', err.toString());
    });
    this.emit('start');
  }

  // Stop download
  stop() {
    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = null;
    }
    this.emit('stop');
  }

  // Get axel command arguments
  getCommandArgs(): Array<string> {
    const args = [];

    // download path
    if (this.downloadPath) {
      args.push(`--output=${this.downloadPath}`);
    }

    // connections
    args.push(`-n ${this.connections}`);

    // max speed limit
    if (this.maxSpeed !== 0) {
      args.push(`-s ${this.maxSpeed}`);
    }

    // user-agent
    if (this.userAgent) {
      args.push(`-U ${this.userAgent}`);
    }

    // headers
    if (this.headers.length) {
      args.push(
        this.headers.reduce((prev, curr) => `${prev} -H '${curr.key}: ${curr.value}'`, '')
      );
    }

    // download url
    args.push(this.url);

    return args;
  }

  // Check if axel downloader is installed
  static checkAxel(): void {
    const axelCheck = spawn('axel');
    axelCheck.on('error', () => {
      throw new Error('Axel is not installed or is not available in your path');
    });
  }
}

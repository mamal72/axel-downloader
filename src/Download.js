import EventEmitter from 'events';
import deepEqual from 'deep-equal';
import { spawn } from 'child_process';

import { splitStream, parseProgress } from './helpers';


// A class for download task
export default class Download extends EventEmitter {
  constructor(
    url,
    downloadPath = process.cwd(),
    {
      connections = 16,
      maxSpeed = 0,
      userAgent,
      headers = []
    } = {}
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
    this.status = {};
  }

  // Start download
  start() {
    Download.checkAxel();

    this.childProcess = spawn('axel', this.getCommandArgs());

    const stdout = splitStream(this.childProcess.stdout);
    const stderr = splitStream(this.childProcess.stderr);

    stdout.on('token', (data) => {
      const rawDownloadProgress = data.toString();
      const operation = parseProgress(rawDownloadProgress);

      switch (operation.type) {
        case 'start':
          this.emit('start');
          break;
        case 'progress':
          if (!deepEqual(operation.data, this.status)) {
            this.status = operation.data;
            this.emit('progress', operation.data);
          }
          break;
        case 'connection-finished':
          this.emit('connection-finished', operation.data);
          break;
        default:
          // nothing for now
      }
    });

    this.childProcess.stdout.on('close', () => {
      this.emit('finish');
    });

    stderr.on('data', (err) => {
      this.emit('error', err.toString());
    });
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
  getCommandArgs() {
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
  static checkAxel() {
    const axelCheck = spawn('axel');
    axelCheck.on('error', () => {
      throw new Error('Axel is not installed or is not available in your path');
    });
  }
}

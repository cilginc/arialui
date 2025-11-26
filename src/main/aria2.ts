import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getConfigManager } from './config';

let aria2Process: ChildProcess | null = null;

export function startAria2() {
  const config = getConfigManager().getConfig();
  const aria2Config = config.aria2;

  // Check if aria2c is in PATH or bundled
  const aria2Path = 'aria2c'; // Assuming in PATH for now as per user request

  // Arguments for aria2c
  const args = [
    '--enable-rpc',
    `--rpc-listen-port=${aria2Config.port}`,
    `--rpc-listen-all=${aria2Config.rpcListenAll}`,
    aria2Config.rpcAllowOriginAll ? '--rpc-allow-origin-all' : '',
    `--rpc-secret=${aria2Config.secret}`,
    `--dir=${aria2Config.downloadDir}`,
    `--max-concurrent-downloads=${aria2Config.maxConcurrentDownloads}`,
    `--max-connection-per-server=${aria2Config.maxConnectionPerServer}`,
    `--min-split-size=${aria2Config.minSplitSize}`,
    `--split=${aria2Config.split}`,
    '--quiet=true', // Less output
    // '--no-conf', // Ignore default conf
  ].filter(arg => arg !== ''); // Remove empty args

  console.log(`Spawning aria2c: ${aria2Path} ${args.join(' ')}`);

  aria2Process = spawn(aria2Path, args);

  aria2Process.stdout?.on('data', (data) => {
    console.log(`aria2c stdout: ${data}`);
  });

  aria2Process.stderr?.on('data', (data) => {
    console.error(`aria2c stderr: ${data}`);
  });

  aria2Process.on('close', (code) => {
    console.log(`aria2c process exited with code ${code}`);
    aria2Process = null;
  });

  aria2Process.on('error', (err) => {
    console.error('Failed to start aria2c:', err);
  });
}

export function stopAria2() {
  if (aria2Process) {
    aria2Process.kill();
    aria2Process = null;
  }
}

export function getAria2Config() {
  const config = getConfigManager().getConfig();
  return {
    port: config.aria2.port,
    secret: config.aria2.secret,
  };
}


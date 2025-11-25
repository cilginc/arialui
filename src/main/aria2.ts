import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

let aria2Process: ChildProcess | null = null;
const ARIA2_PORT = 6800;
const ARIA2_SECRET = 'arialui_secret_token'; // Should be generated or configurable

export function startAria2() {
  // Check if aria2c is in PATH or bundled
  const aria2Path = 'aria2c'; // Assuming in PATH for now as per user request

  // Arguments for aria2c
  const args = [
    '--enable-rpc',
    `--rpc-listen-port=${ARIA2_PORT}`,
    '--rpc-listen-all=false', // Only local
    '--rpc-allow-origin-all', // For development/extension
    `--rpc-secret=${ARIA2_SECRET}`,
    '--quiet=true', // Less output
    // '--no-conf', // Ignore default conf
  ];

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
  return {
    port: ARIA2_PORT,
    secret: ARIA2_SECRET,
  };
}

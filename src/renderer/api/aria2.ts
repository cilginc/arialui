interface Aria2Config {
  port: number;
  secret: string;
}

export class Aria2Client {
  private url: string;
  private secret: string;
  private id: number = 0;

  constructor(config: Aria2Config) {
    this.url = `http://localhost:${config.port}/jsonrpc`;
    this.secret = config.secret;
  }

  async call(method: string, params: any[] = []) {
    const payload = {
      jsonrpc: '2.0',
      id: this.id++,
      method: `aria2.${method}`,
      params: [`token:${this.secret}`, ...params],
    };

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.result;
  }

  async getVersion() {
    return this.call('getVersion');
  }

  async addUri(uris: string[], options: any = {}) {
    return this.call('addUri', [uris, options]);
  }

  async tellActive() {
    return this.call('tellActive');
  }

  async tellWaiting(offset: number, num: number) {
    return this.call('tellWaiting', [offset, num]);
  }

  async tellStopped(offset: number, num: number) {
    return this.call('tellStopped', [offset, num]);
  }

  async pause(gid: string) {
    return this.call('pause', [gid]);
  }

  async unpause(gid: string) {
    return this.call('unpause', [gid]);
  }

  async remove(gid: string) {
    return this.call('remove', [gid]);
  }

  async forceRemove(gid: string) {
    return this.call('forceRemove', [gid]);
  }

  async removeDownloadResult(gid: string) {
    return this.call('removeDownloadResult', [gid]);
  }

  async getGlobalStat() {
    return this.call('getGlobalStat');
  }
}

import { ChildProcess, spawn } from "child_process";
import { basename, join } from "path";
import { createInterface } from "readline";

export function getNVoicePath(): string {
  // import/require構文を使うとビルド時に展開してしまうが、
  // バイナリファイルを実行時に参照するために実行時のrequireでロードする必要がある
  return window['require']('n-voice-package').getNVoicePath();
}

class CallbackReceiver {
  private received: string[] = [];
  private callback?: (data: string) => boolean;
  private callbackWaitings: ((data: string) => boolean)[] = [];

  flush(log: ((line: string) => void) | undefined = undefined): void {
    while (this.received.length > 0) {
      if (this.callback === undefined) {
        this.callback = this.callbackWaitings.shift();
        if (this.callback === undefined) {
          break;
        }
      }
      const line = this.received.shift();
      if (line === undefined) {
        break;
      }
      if (log !== undefined) {
        log(line);
      }
      if (this.callback(line)) {
        this.callback = undefined;
      }
    }
  }

  receive(line: string): void {
    this.received.push(line);
  }

  /**
   * callbackが trueを返すまで、次の行を受信する
   */
  waitLine(callback: (data: string) => boolean): void {
    this.callbackWaitings.push(callback);
    this.flush();
  }
}

class CommandLineClient {
  private receiver: CallbackReceiver = new CallbackReceiver();
  private stdout: NodeJS.ReadableStream;
  private stderr: NodeJS.ReadableStream;

  private terminateResolve: (value: number | PromiseLike<number>) => void;
  private terminateReject: (reason?: unknown) => void;
  private terminated: Promise<number>;

  constructor(
    private subprocess: ChildProcess,
    private log: (...args: unknown[]) => void,
    private showStdout: boolean,
  ) {
    this.stdout = this.subprocess.stdout;
    this.stderr = this.subprocess.stderr;

    this.terminateResolve = () => { /* do nothing */ };
    this.terminateReject = () => { /* do nothing */ };
    this.terminated = new Promise<number>((resolve, reject) => {
      this.terminateResolve = resolve;
      this.terminateReject = reject;
    });
  }

  get pid() {
    return this.subprocess.pid;
  }
  get exitCode() {
    return this.subprocess.exitCode;
  }
  waitExit(): Promise<number> {
    return this.terminated;
  }

  kill(): void {
    this.subprocess.kill();
  }

  async run(label: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('run started'); // DEBUG
      const rl = createInterface({
        input: this.stdout,
        terminal: false,
        prompt: '',
      });
      const rlErr = createInterface({
        input: this.stderr,
        terminal: false,
        prompt: '',
      });

      const onLine = (line: string) => {
        if (this.showStdout) {
          this.log(`${label} -> ${line}`);
        }
        this.receiver.receive(line);
        this.flush();
      };
      rl.on('line', onLine);

      this.subprocess.on('error', (err) => {
        console.log('subprocess.error', err);
        reject(err);
        this.terminateReject(err);
      });
      this.subprocess.on('close', (code) => {
        this.log(`${label} terminated: ${code}`);
        this.terminateResolve(code || -1);
      });
      // node 15未満は spawn event がないので起動成功したことにする
      resolve();
    });
  }

  async send(line: string): Promise<void> {
    await new Promise((resolve) => {
      this.log(`<- ${line}`);
      this.subprocess.stdin.write(line + '\n', resolve);
    });
  }

  private flush(): void {
    this.receiver.flush((line: string) => this.log(`-> ${line}`));
  }

  /**
   * callbackが trueを返すまで、次の行を受信する
   */
  waitLine(callback: (data: string) => boolean): void {
    this.receiver.waitLine(callback);
  }
}

// API document https://docs.google.com/document/d/1sy2mzxtJJwcMpqQ2oPWt7qclyXmptoOnXvQywrzzg8Q/edit#

// 参考: https://github.com/seiren-voice/desktop-application/blob/main/electron/CommandLineClient.ts

async function StartNVoice(enginePath: string, dictionaryPath: string, userDictionary: string, modelPath: string, cwd: string): Promise<CommandLineClient> {
  const log = ((...args: unknown[]) => { console.log(...args); });

  console.log('StartNVoice', { enginePath, dictionaryPath, userDictionary, modelPath, cwd }); // DEBUG
  const client = new CommandLineClient(
    spawn(enginePath, [dictionaryPath, userDictionary, modelPath], { stdio: 'pipe', cwd }),
    log,
    true, // options.showStdout,
  );
  await client.run(basename(enginePath));
  return client;
}

const iconv = require('iconv-lite');
function toShiftJisBase64(text: string): string {
  return Buffer.from(iconv.encode(text, 'Shift_JIS')).toString('base64');
}

type Command =
  | 'quit'
  | 'protocol_version'
  | 'name'
  | 'version'
  | 'list_commands'
  | 'talk'
  | 'annotated_talk'
  | 'max_time'
  | 'set_max_time'
  | 'test'

const ErrorCodes: { [code: number]: string } = {
  1: 'invalid argument',
  2: 'model not found',
  101: 'command io error',
  102: 'command not found',
  201: 'file io error',
  301: 'could not read text',
  302: 'could not read path',
  401: 'could not parse text',
};

const supportedProtocolVersion = '1.0.0';
export class NVoiceClient {
  private commandLineClient: CommandLineClient | undefined;

  constructor(readonly options: {
    baseDir: string;
  }) {
    console.log(`NVoiceClient: baseDir: ${this.options.baseDir}`);
  }

  async _startNVoice(): Promise<void> {
    try {
      const baseDir = this.options.baseDir;
      const enginePath = join(baseDir, 'n-voice-engine.exe');
      const dictionaryPath = 'open_jtalk_dic_shift_jis-1.11';
      const userDictionary = 'user.dic';
      const modelPath = 'nvoice_default@2022-07-12T04-10-10.0060@False_nvoice_16k_mcd_L20-D10_S4-F64-C64-I0@2022-07-12T04-08-25.0040@False_False.pt';
      const cwd = baseDir;
      const client = await StartNVoice(enginePath, dictionaryPath, userDictionary, modelPath, cwd);
      this.commandLineClient = client;
      const r = await this.waitOkNg(client);
      const protocolVersion = await this.protocol_version();
      if (protocolVersion !== supportedProtocolVersion) {
        throw new Error(`unexpected protocol version: ${protocolVersion}`);
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // ok か ng が来るまで待って、来たらその後の文字列を返す
  waitOkNg(client: CommandLineClient): Promise<string[]> {
    return new Promise((resolve, reject) => {
      client.waitLine((data: string) => {
        const [first, ...rest] = data.split(' ');
        switch (first) {
          case 'ok':
            resolve(rest);
            return true;

          case 'ng':
            {
              const code = rest[0];
              const title = ErrorCodes[code];
              reject(new Error(`code ${code}: ${title}`));
              return true;
            }

          default:
            return false;
        }
      });
    });
  }

  async _command(command: Command, ...args: string[]): Promise<string[]> {
    if (this.commandLineClient === undefined) {
      await this._startNVoice();
    }
    console.log('send', command, args); // DEBUG
    await this.commandLineClient.send([command, ...args].join(' '));
    return this.waitOkNg(this.commandLineClient);
  }

  async protocol_version(): Promise<string> {
    const r = await this._command('protocol_version');
    return r[0];
  }

  async talk(speed: number, text: string, filename: string): Promise<void> {
    await this._command('talk', speed.toString(), toShiftJisBase64(text), toShiftJisBase64(filename));
  }

  async set_max_time(seconds: number): Promise<void> {
    await this._command('set_max_time', seconds.toString());
  }

  loaded(): boolean {
    return this.commandLineClient !== undefined;
  }
}

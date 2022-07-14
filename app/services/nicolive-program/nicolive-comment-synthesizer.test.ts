import { createSetupFunction } from 'util/test-setup';
import { WrappedChat } from './WrappedChat';

type NicoliveCommentSynthesizerService =
  import('./nicolive-comment-synthesizer').NicoliveCommentSynthesizerService;

const setup = createSetupFunction({
  injectee: {
    NicoliveProgramStateService: {
      updated: {
        subscribe() { }, // TODO state
      },
    },
    NVoiceClientService: {
    },
  },
});

jest.mock('services/nicolive-program/state', () => ({ NicoliveProgramStateService: {} }));
jest.mock('services/nicolive-program/n-voice-client', () => ({ NVoiceClientService: {} }));

beforeEach(() => {
  jest.doMock('services/core/stateful-service');
  jest.doMock('services/core/injector');
});

afterEach(() => {
  jest.resetModules();
});

test('makeSpeech', async () => {
  setup();
  const { NicoliveCommentSynthesizerService } = require('./nicolive-comment-synthesizer');
  const instance = NicoliveCommentSynthesizerService.instance as NicoliveCommentSynthesizerService;

  const testPitch = 0.2;
  const testRate = 0.4;
  const testVolume = 0.6;

  jest.spyOn(instance as any, 'state', 'get').mockReturnValue({
    enabled: true,
    pitch: testPitch,
    webSpeech: {
      rate: testRate,
    },
    nVoice: {
      maxTime: 4,
    },
    volume: testVolume,
    selector: {
      normal: 'nVoice',
      operator: 'webSpeech',
      system: 'webSpeech',
    },
  });

  // 辞書変換しない
  jest
    .spyOn(instance, 'makeSpeechText')
    .mockImplementation((chat: WrappedChat) => chat.value.content);

  const makeChat = (s: string): WrappedChat => ({
    type: 'normal',
    value: { content: s },
    seqId: 1,
  });

  // 空文字列を与えるとnullが返ってくる
  expect(instance.makeSpeech(makeChat(''))).toBeNull();

  // stateの設定値を反映している
  expect(instance.makeSpeech(makeChat('test'))).toEqual({
    text: 'test',
    synthesizer: 'nVoice',
    pitch: testPitch,
    webSpeech: {
      rate: undefined,
    },
    nVoice: {
      maxTime: undefined,
    },
    volume: testVolume,
  });
});

test('WebSpeechSynthesizer', async () => {
  setup();
  const { WebSpeechSynthesizer } = require('./nicolive-comment-synthesizer');

  jest.mock('./nicolive-comment-synthesizer', () => ({
    ...jest.requireActual('./nicolive-comment-synthesizer'),
    NicoliveProgramCommentSynthesizerService: {},
  }));

  const synth = new WebSpeechSynthesizer();

  jest.spyOn(window, 'speechSynthesis', 'get').mockImplementation(undefined);
  expect(synth.available).toBeFalsy();

  jest
    .spyOn(window, 'speechSynthesis', 'get')
    .mockImplementation(() => true as unknown as SpeechSynthesis);
  expect(synth.available).toBeTruthy();

  // TODO
  // expect(synth.makeSpeechText('')).toEqual('');
});

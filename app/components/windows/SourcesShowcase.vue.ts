import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import { WindowsService } from 'services/windows';
import AddSourceInfo from './AddSourceInfo.vue';
import { SourcesService, TSourceType, TPropertiesManager } from 'services/sources';
import { ScenesService } from 'services/scenes';
import { UserService } from 'services/user';
import BrowserSourceIcon from '../../../media/images/browser-source-icon.svg';
import ColorSourceIcon from '../../../media/images/color-source-icon.svg';
import DshowInputIcon from '../../../media/images/display-icon.svg';
// eslint-disable-next-line import/no-duplicates
import ImageSourceIcon from '../../../media/images/slideshow-icon.svg';
import WindowCaptureIcon from '../../../media/images/window-capture-icon.svg';
import AddSceneIcon from '../../../media/images/add-scene-icon.svg';
import AddFileIcon from '../../../media/images/add-file-icon.svg';
import WasapiInputCaptureIcon from '../../../media/images/wasapi-input-icon.svg';
import GameCaptureIcon from '../../../media/images/game-capture-icon.svg';
import TextGdiplusIcon from '../../../media/images/text-gdiplus-icon.svg';
import FfmpegSourceIcon from '../../../media/images/ffmpeg-source-icon.svg';
// eslint-disable-next-line import/no-duplicates
import SlideshowIcon from '../../../media/images/slideshow-icon.svg';
import WasapiOutputIcon from '../../../media/images/wasapi-output-icon.svg';
import MonitorCaptureIcon from '../../../media/images/monitor-capture-icon.svg';
import NdiSourceIcon from '../../../media/images/ndi-icon.svg';
import BlackmagicSourceIcon from '../../../media/images/blackmagic-icon.svg';
import NVoiceCharacterSourceIcon from '../../../media/images/nvoice-character-source-icon.svg';
import { NVoiceCharacterType, NVoiceCharacterTypes } from 'services/nvoice-character';
import { omit } from 'lodash';

type TInspectableSource = TSourceType | NVoiceCharacterType;

interface ISelectSourceOptions {
  propertiesManager?: TPropertiesManager;
  nVoiceCharacterType?: NVoiceCharacterType;
}

@Component({
  components: {
    ModalLayout,
    AddSourceInfo,
    BrowserSourceIcon,
    ColorSourceIcon,
    DshowInputIcon,
    ImageSourceIcon,
    WindowCaptureIcon,
    AddSceneIcon,
    AddFileIcon,
    WasapiInputCaptureIcon,
    TextGdiplusIcon,
    GameCaptureIcon,
    FfmpegSourceIcon,
    SlideshowIcon,
    WasapiOutputIcon,
    MonitorCaptureIcon,
    NdiSourceIcon,
    BlackmagicSourceIcon,
    NVoiceCharacterSourceIcon,
  },
})
export default class SourcesShowcase extends Vue {
  @Inject() sourcesService: SourcesService;
  @Inject() userService: UserService;
  @Inject() scenesService: ScenesService;
  @Inject() windowsService: WindowsService;

  selectSource(sourceType: TInspectableSource, options: ISelectSourceOptions = {}) {
    if (NVoiceCharacterTypes.includes(sourceType as NVoiceCharacterType)) {
      const propertiesManagerSettings: Dictionary<any> = {
        NVoiceCharacterType: sourceType as NVoiceCharacterType,
        ...omit(options, 'propertiesManager'),
      };
      this.sourcesService.showAddSource('browser_source', {
        propertiesManagerSettings,
        propertiesManager: 'nvoice-character',
      });
    } else {
      const propertiesManager = options.propertiesManager || 'default';
      const propertiesManagerSettings: Dictionary<any> = { ...omit(options, 'propertiesManager') };

      this.sourcesService.showAddSource(sourceType as TSourceType, {
        propertiesManagerSettings,
        propertiesManager,
      });
    }
  }

  inspectedSource: TInspectableSource = null;

  inspectSource(inspectedSource: TInspectableSource) {
    this.inspectedSource = inspectedSource;
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get platform() {
    if (!this.loggedIn) return null;
    return this.userService.platform.type;
  }

  selectInspectedSource() {
    this.selectSource(this.inspectedSource);
  }

  get availableSources() {
    return this.sourcesService.getAvailableSourcesTypesList().filter(type => {
      if (type.value === 'text_ft2_source') return false;
      if (type.value === 'scene' && this.scenesService.scenes.length <= 1) return false;
      return true;
    });
  }
}

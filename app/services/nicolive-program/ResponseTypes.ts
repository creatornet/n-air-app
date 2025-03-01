export interface CommonErrorResponse {
  meta: {
    status: number;
    errorCode?: string;
    errorMessage?: string;
  };
  data?: { message: string };
}

export interface ProgramSchedules {
  meta: {
    status: 200;
    errorCode: 'OK';
  };
  data: {
    /** 番組ID */
    nicoliveProgramId: string;
    /** テスト開始時刻 */
    testBeginAt: number;
    /** 放送開始時刻 */
    onAirBeginAt: number;
    /** 放送終了予定時刻 */
    onAirEndAt: number;
    /** 配信コミュニティ・チャンネルID */
    socialGroupId: string;
    /** 配信状態 */
    status: 'reserved' | 'test' | 'onAir' | 'end';
  }[];
}

export interface ProgramInfo {
  meta: {
    status: 200;
    errorCode: 'OK';
  };
  data: {
    /** 番組の状態 */
    status: 'test' | 'onAir' | 'end';
    /** 番組の配信者に関係する情報 */
    socialGroup:
      | {
          providerType: 'community';
          /** コミュニティ名 */
          name: string;
          /** コミュニティID */
          id: string;
          /** コミュレベル */
          communityLevel: number;
          /** サムネイルのURL */
          thumbnailUrl: string;
        }
      | {
          providerType: 'channel';
          /** チャンネル名 */
          name: string;
          /** チャンネルID */
          id: string;
          /** 配信会社名 */
          ownerName: string;
          /** サムネイルのURL */
          thumbnailUrl: string;
        };
    /** コメントのルーム */
    rooms: {
      /** 部屋ID */
      id: number;
      /** 部屋名 */
      name: string;
      /** コメントサーバーの接続先(WebSocket) */
      webSocketUri: string;
      /** コメントサーバーの接続先(XmlSocket) */
      xmlSocketUri: string;
      /** スレッドID */
      threadId: string;
    }[];
    /** 番組タイトル */
    title: string;
    /** 番組情報 */
    description: string;
    /** メンバー限定放送であるか */
    isMemberOnly: boolean;
    /** vpos基準時刻 */
    vposBaseAt: number;
    /** 開演時間 */
    beginAt: number;
    /** 終了時間 */
    endAt: number;
    /** 番組のカテゴリ・追加カテゴリ一覧 */
    categories: string[];
    /** ニコニ広告許可設定 */
    isAdsEnabled: boolean;
    /** 配信者情報 */
    broadcaster: {
      /** 配信者/チャンネルのID */
      id: number;
      /** 配信者/配信会社名 */
      name: string;
    }[];
    /** ストリーム設定 */
    streamSetting: {
      /** 配信最高画質 */
      maxQuality: '6Mbps720p' | '2Mbps450p' | '1Mbps450p' | '384kbps288p' | '192kbps288p';
      /** 配信の向き */
      orientation: 'Landscape' | 'Portrait';
    };
  };
}

export interface Segment {
  meta: {
    status: 200;
    errorCode: 'OK';
  };
  data: {
    end_time: number;
    start_time: number;
  };
}

export interface Extension {
  meta: {
    status: 200;
    errorCode: 'OK';
  };
  data: {
    end_time: number;
  };
}

export interface OperatorComment {
  meta: {
    status: 200;
    errorCode: 'OK';
  };
}

export interface Statistics {
  meta: {
    status: 200;
    errorCode: 'OK';
  };
  data: {
    watchCount: number;
    commentCount: number;
  };
}

export interface NicoadStatistics {
  meta: {
    status: 200;
  };
  data: {
    totalAdPoint: number;
    totalGiftPoint: number;
    conductors: {
      text: string;
      url: string;
    }[];
  };
}

export interface Community {
  // 使用しそうなものだけ雑に抜粋
  id: string; // eg. '1'
  global_id: string; // eg. 'co123'
  name: string;
  description: string;
  public: 'open' | 'closed';
  icon: {
    id: number;
    url: {
      size_128x128: string;
      size_64x64: string;
    };
  };
}

export interface Communities {
  meta: {
    status: 200;
  };
  data: {
    communities: {
      total: number;
      communities: Community[];
    };
  };
}

export type FilterRecord = {
  id: number;
  type: 'word' | 'user' | 'command';
  body: string;
};

export type FilterType = FilterRecord['type'];

export interface Filters {
  meta: {
    status: 200;
  };
  data: FilterRecord[];
}

export type OnairUserProgramData = {
  programId?: string;
  nextProgramId?: string;
};

export type OnairChannelProgramData = {
  testProgramId?: string;
  programId?: string;
  nextProgramId?: string;
};

export type OnairChannelData = {
  id: string;
  name: string;
  ownerName: string;
  thumbnailUrl: string;
  smallThumbnailUrl: string;
};

export type BroadcastStreamData = {
  url: string;
  name: string;
};

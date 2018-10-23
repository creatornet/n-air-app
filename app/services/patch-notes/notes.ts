import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '1.0.20181023-1',
  title: '1.0.20181023-1',
  notes: [
    '変更: ニコニコ生放送配信最適化の低遅延強化 (#84)',
    '変更: アップデートのダウンロード元を東京に変更し、ダウンロードの待ち時間を短縮 (#129)',
    '変更: 設定/配信設定に警告を表示しつつ、ログイン中で表示(編集は無効) (#114)',
    '修正: 設定/録画パスとしてrtmpプロトコルのURIが使えなくなっていたのを修正  (#117)',
    '修正: サイドチェーンのトリガー一覧にソースの名前を表示する (#122)',
    '修正: デザイン:モーダル部分のスペーシングをシンプルにする (#104)',
    '修正: 音声系ソースの名前を翻訳 (#124)'
  ]
};

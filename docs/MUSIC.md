# 旅の音楽（2026-10-22・現行）

全12曲を、遠い低弦、笛のような旋律、控えめな撥弦による静かな旅の編成へ更新しました。テンポは60〜72 BPM、ループは約53〜65秒です。キック・スネア・ハイハットと連続する低音の刻みを外し、四小節単位の短い下降句と、旋律を置かない時間を作っています。全てオリジナルの譜面・合成音色です。

曲のID・題名・地域ごとの4候補と抽選、手動選択、音量・オンオフの保存は引き継ぎます。保存済みの手動選曲も新しい編成になります。初回はオンで、出発などの操作を受けて再生し、「効果音」と独立して切り替えられます。曲の一覧と地域は [HORSE-AND-HORIZONS.md](HORSE-AND-HORIZONS.md) に記載しています。

## 実装

- `music/quiet-score.mjs`：現行の全12曲の室内楽風の編曲。
- `music/journey-music.mjs`：音色、音源の読み込み、再生・クロスフェード。
- `music/game-music.mjs`：メニューと地域別選曲への接続。
- `assets/music/quiet/`：新しい24 kHzステレオOgg音源。1曲約220〜280 KB。
- `tools/render-quiet-music.py`：実行時と同じWebAudioから音源を書き出すツール。

音源を復号して `AudioBufferSourceNode.loop` で再生します。Vorbisを復号できない場合は、同じ譜面をOfflineAudioContextで一度描画して再生します。この場合、最初の曲の準備に時間がかかります。通常の読み込みでは音符を実行時に生成せず、描画・地形生成やJavaScriptタイマーに発音時刻を依存させません。2周目を切り出して前周の音の尾を含め、継ぎ目の微小な差を前後8msで補正します。

切替先の準備が終わるまで現在の曲を維持し、その後0.9秒でクロスフェードします。準備中のオフ操作で再生が復活しないよう、要求番号で取り消しを確認します。復号した音源は最大2曲。出発前やオフ設定のままなら音源を取得せず、音声コンテキストも作りません。効果音と一つのAudioContextを共有し、独立した音量経路へ接続します。メニューの開閉では曲を再開し直しません。

以前の音源と `music/scores.mjs` は制作資料として残しています。現行の選曲画面から鳴るのは新編成です。`loadTrackAssets` は以前の音源検査用、`loadQuietTrack` は現行の音源読み込み用です。

## 検証

```sh
node --test tests/*.test.mjs
python tools/render-quiet-music.py --browser /path/to/chromium
python tests/quiet-music-browser.py --browser /path/to/chromium --recordings
python tests/music-browser.py --browser /path/to/chromium --three /path/to/three.min.js
```

全12曲の実描画と焼き出し音源を検査し、長さ・実効音量・ピーク・継ぎ目・無音の欠落を検査します。本体の試験ではVorbis失敗時の同じ編曲へのフォールバック、共有音声・音設定・メニュー・切り替え・準備中の取り消し・保存・走行を検証します。実出力を録音し、1.6秒のメインスレッド停止とループの継ぎ目、クロスフェードを含む区間を検査します。

画面・モーションと合わせた変更は [QUIET-JOURNEY.md](QUIET-JOURNEY.md) を参照してください。iPhone/Safari実機での聴感、バックグラウンドや通話後の復帰、発熱時の音切れは未確認です。

## 初回音楽統合時の記録（後続改修あり）

統合元として確認できた `main` と `claude/hoverboard-prototype` は、ともに `67f70ee204cd5651569054b86d327bae506f102c` でした。ユーザーの本体統合指示により、この版へ音楽を追加しています。別の場所にあるClaude改修版との同一性は確認できていません。今回の変更は音楽、メニューへの接続、操作部へのキーボード入力の保護です。地形・障害物・走行物理の変更は含みません。

監査では、上記3つのモジュール、音源、メニュー欄、`sfx.context` と `__wlAudio` の接続を一まとまりで確認してください。別版へ統合する場合も、既存の世界・物理を差し戻す必要はありません。

検証コマンド：

```sh
node --test tests/music-scores.test.mjs
python tests/music-browser.py --browser /usr/bin/chromium
```

ブラウザ検証はスマートフォン相当の縦画面で本体を開き、4曲の選択、Ogg失敗時のWAV、効果音との独立、同一AudioContextの利用、読み込み待ち、オフでの取り消し、再読み込み後の設定、音楽再生中の走行を調べます。出力を録音し、メインスレッドの1.6秒停止とクロスフェードを含む区間に100 ms以上の無音がないことを確認します。結果・録音・画面は標準で `/tmp/wind-lover-music-qa/` に保存されます。

iPhone/Safari実機でのバックグラウンド復帰、Bluetoothや通話後の音声復帰、端末負荷による音切れは、実機での確認が残っています。

最新のデフォルト再生、風の継ぎ目、共通出力の仕様は [FEATURED-JOURNEYS.md](FEATURED-JOURNEYS.md) を参照してください。



## 2026-10-22：全12曲と地域別の抽選

追加8曲、4曲ずつの地域別候補、手動モードと保存、追加音源の生成・検証は [HORSE-AND-HORIZONS.md](HORSE-AND-HORIZONS.md) を参照してください。既存4曲の音源は保持しています。

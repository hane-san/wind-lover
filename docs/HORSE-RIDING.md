# 道を駆け、踏み替えて曲がる馬（2026-10-22）

最新版 `1f633ee` の鹿毛の馬、淡い景観、全12曲の静かな編曲、後方の旅のカメラを基にした改修です。本書の操舵・跳躍・効果音の仕様は、以前の「馬とサイドカーの挙動は同一」という記述に優先します。巡航・最高速度の既定値と小さな敵弾判定は引き継ぎます。

## 調査から採った考え方

| 資料 | 確認した内容と、このゲームでの判断 |
| --- | --- |
| [任天堂『トワイライトプリンセス』開発者インタビュー](https://www.nintendo.com/en-za/Iwata-Asks/Iwata-Asks-Wii/Iwata-Asks-Legend-of-Zelda-Twilight-Princess/2-Ideas-Born-Out-of-Functionality/2-Ideas-Born-Out-of-Functionality-227195.html) | 開発陣が実際に騎乗し、大きな動物に乗る重さを探った説明。操作に長い遅延を足すのではなく、踏ん張り・首・鞍上の姿勢に重みを置く方針にしました。 |
| [任天堂『ブレス オブ ザ ワイルド』馬の公式ガイド](https://guiasnintendo.com/2c-switch/zelda-breath-of-the-wild/guia-zelda-breath-of-the-wild/caballos.html) | 馴れた馬が道をたどり、速度を自動で維持する仕組み。ここでは道路の方向を助けつつ、プレイヤーが選んだ左右の走行ラインを残します。 |
| [Rockstarの馬を扱うGDC講演の案内](https://gdconf.com/article/hoof-it-to-gdc-and-see-how-red-dead-redemption-2-s-horses-were-brought-to-life/)・[講演紹介](https://gdcvault.com/play/1027230/AI-Summit-Making-the-Believable) | 自然な動物の移動とキャラクター表現をまとめて設計する方向を参照。今回は走行制御、四肢、乗り手、接地音を別の状態として組み合わせます。GDC本編・PDFは取得時にメンテナンスへ転送され、全講演を視聴したという扱いにはしていません。 |
| [『Ghost of Tsushima』音響スタッフへのインタビュー](https://www.asoundeffect.com/ghost-of-tsushima-sound/) | 探索時の疎な音楽と環境音の配分、馬の細かな音の説明。静かな曲と風を生かし、蹄の接触を短く近い音にします。楽曲は再編曲せず、路面と走行状態に応じた効果音を調整します。 |
| [上田文人氏のPlayStation公式インタビュー](https://blog.playstation.com/archive/2010/09/17/fumito-ueda-interview/) | アグロとの既にある関係性、広い景色と奥行きへの考え方。同行者としての馬と遺構を一緒に見せる、現在の控えめな後方視点を維持する判断の参考にしました。 |

右欄の実装方針は本作での解釈です。作品の素材・旋律・モーションデータは使用しません。新しい跳躍は、ゼルダの特定の動きを再現したものではありません。

## 操作と動き

- 馬だけに専用の手綱応答を追加。道路の向きに沿う操舵と、左右の走行ライン変更を分けます。左右最大8.6m/s、加速応答10/s、反転15/s、離した後12/s。短い入力で道を斜めに横切り続けず、離した位置のラインを覚えます。
- 0.18秒以上の強い入力から反対へ入れると、安全な道路上で約75msの踏み込みを経て、低い踏み替えの跳躍。再発は0.95秒以上空け、細かなスティックの震えでは跳びません。
- 跳躍の上向き速度は6.1m/s、通常の重力は36m/s²。実走で地面から約0.52m・約0.33秒。水平方向へ追加ブーストは入れません。前後の脚を畳み、左右の先導脚を替え、着地で体重を受けます。
- 道路端、屋根下、急な高低差では自動の踏み替えを抑止。進行先も調べ、段差や道路からの落下を単なる平地の跳躍として扱いません。意図して長く舵を入れれば道の外へ出られます。
- キーボードの Space は、約95msの踏み込みから少し大きく跳躍。押し続けても自動連打せず、空中で再ジャンプしません。スマートフォンでは既存のドラッグによる自動の踏み替えで遊べます。
- 首は内側の手綱へ向き、尾と騎手には遅れて荷重が伝わります。騎手そのものを縦に縮める着地表現をやめ、鞍上で吸収します。手綱の端点は、そのフレームの手と口に追従します。
- 馬の接触は埃と鈍い蹄の音。車体の火花、爆発の閃光、エンジンの失速・タイヤの旋回音を馬には使いません。カメラは跳躍時の追加上昇を0.25mに抑えます。

## 接地音と交差する道

蹄音は元の四拍のまとまりを残し、舗装・砂利・土・雪・水で響きと擦れる成分を変えます。四肢ごとに三つの小さな変奏があり、最大60個の短いバッファを再利用します。音声クロックへ240ms先まで接地を予約し、描画フレームの遅れで近い二音が同時にならないようにします。空中・停止・メニュー・乗り換え・タブ非表示では予約を取り消し、8msで滑らかに消音。BGMとは独立し、従来の共通出力を通します。

実走で砂漠の x=75.6km 付近に、上の廃線より下の幹線道路が横方向に近いだけで、操舵補助が下の道へ移る不具合を発見しました。`rideRoute` は足元と候補の高さを比較して追従先を選びます。下を走るときも上の廃線へ吸い寄せません。描画や衝突だけを隠して通過させる修正ではありません。

## 再監査

```sh
node --test tests/*.test.mjs
python tests/horse-riding-browser.py --three /path/to/three.min.js
python tests/horse-rhythm-browser.py
python tests/horse-presentation-browser.py --browser /usr/bin/chromium --three /path/to/three.min.js --out /tmp/horse-presentation
python tests/horse-wake-browser.py --browser /usr/bin/chromium --three /path/to/three.min.js --out /tmp/horse-wake
python tests/featured-browser.py --full-only --vehicle horse --three /path/to/three.min.js
python tests/travel-upgrade-browser.py --browser /usr/bin/chromium --three /path/to/three.min.js
python tests/music-browser.py --three /path/to/three.min.js
python tests/world-smoke.py --three /path/to/three.min.js
python tests/dodge-browser.py --three /path/to/three.min.js
```

重点は三地域での28秒の連続切り返し、上下の交差道路、ニュートラルでのライン保持、意図した離脱、Spaceの実入力、足先と骨格、20/30/60/120fpsの音声時刻、150msの描画遅延、予約の消音・ノード解放です。山道の終点まで約17.1kmと、湖の一周を越える約36.0kmの実走も行います。CPU試験とソフトウェア描画による検証で、実際のスマートフォンのFPS・聴感・発熱は別途確認が必要です。ゲーム内速度は従来の高速な旅を優先した演出値であり、実馬の走行速度を再現していません。

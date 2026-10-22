# Wind Lover

[ゲームをひらく](https://hane-san.github.io/wind-lover/)

壊れかけのサイドカーで、中央アジアの遺構を旅する3Dブラウザーゲーム。砂漠の廃線、トンネルのある山道、青い湖の一周を中心に、盆地と峠をつなぐ120kmの世界を走れます。

開始画面とメニューの先頭から、ウズベキスタンの砂漠の廃線、ビシュケク〜オシュを思わせる山道、イシク・クルの周回へ出発できます。

画面のドラッグ、または A・D で操舵、W で前傾、S でブレーキ。メニューから襲撃をオフにすると、風景を見ながら走れます。スマートフォンの縦画面に対応しています。「乗り物」からキルギス風の馬にも切り替えられます。速度はサイドカーと同じで、タレットはありません。

馬は道に沿いながら左右の走行ラインを選べます。強い切り返しで低く跳び、脚を踏み替えます。キーボードでは Space で跳躍。湖の東岸から峠へ、峠の出口から砂漠へ続く廃線へ、古い案内標をたどって走って移動できます。

メニューの「旅の音楽」で、12曲のオリジナルBGMのオン・オフ、土地に合う曲のランダム選曲・手動選曲、音量を変えられます。初回はオンで、出発操作から再生し、設定は次回にも引き継がれます。効果音は別に切り替えられます。

襲撃をオンにすると、正面の編隊が密度のある弾幕を張ります。小さい自機判定で弾の隙間を抜け、かすめると勢いが増します。地形の継ぎ足しはフレーム間に分散し、負荷に合わせて描画解像度も調整します。

- [馬の操舵・跳躍・蹄音と比較資料](docs/HORSE-RIDING.md)
- [つながる旅路・カーブと襲撃時のカメラ](docs/CONNECTED-JOURNEY.md)
- [キルギス風の馬・地域別選曲・遠景と草雪の色](docs/HORSE-AND-HORIZONS.md)
- [三つの旅路・幾何学弾幕・音と形状の監査](docs/FEATURED-JOURNEYS.md)
- [ゲーム設計](docs/DESIGN.md)
- [マップ改修の内容](docs/MAP.md)
- [音楽の仕様・再監査メモ](docs/MUSIC.md)
- [回避と描画負荷の改修・検証](docs/DODGE.md)

ローカルで起動する場合は、リポジトリのルートで `python -m http.server 8000` を実行し、`http://localhost:8000/` を開いてください。Three.js とフォントはCDNから取得します。

検証は Python の Playwright と Chromium を用います。`python tests/world-smoke.py --browser /usr/bin/chromium` で実行できます。Three.jsをローカルに用意した場合は `--three /absolute/path/three.min.js` を指定できます。

音楽の検証は `node --test tests/music-scores.test.mjs` と `python tests/music-browser.py --browser /usr/bin/chromium` で実行できます。後者は NumPy と FFmpeg も使用し、実際のゲームの出力を録音して、描画停止中・曲の切替中の無音を調べます。同じ `--three` オプションを使えます。

回避と生成処理の検証は `python tests/dodge-browser.py --browser /usr/bin/chromium` です。同じ `--three` オプションを使えます。敵弾との高速な交差、グレイズ、実走行での回避、6種類の弾幕、生成の分割・中止、解像度の適応を確認します。


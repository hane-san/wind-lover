# Wind Lover

[ゲームをひらく](https://hane-san.github.io/wind-lover/)

壊れかけのサイドカーで、廃線の向こうへ。盆地と峠をつなぐ120kmの旅路、10か所の駅跡、集落への寄り道と高架の迂回路を走る3Dブラウザーゲームです。

画面のドラッグ、または A・D で操舵、W で前傾、S でブレーキ。メニューから襲撃をオフにすると、風景を見ながら走れます。スマートフォンの縦画面に対応しています。

メニューの「旅の音楽」で、4曲のオリジナルBGMのオン・オフ、曲の選択、音量を変えられます。初回はオフで、設定は次回にも引き継がれます。効果音は別に切り替えられます。

襲撃をオンにすると、正面の編隊が密度のある弾幕を張ります。小さい自機判定で弾の隙間を抜け、かすめると勢いが増します。地形の継ぎ足しはフレーム間に分散し、負荷に合わせて描画解像度も調整します。

- [ゲーム設計](docs/DESIGN.md)
- [マップ改修の内容](docs/MAP.md)
- [音楽の仕様・再監査メモ](docs/MUSIC.md)
- [回避と描画負荷の改修・検証](docs/DODGE.md)

ローカルで起動する場合は、リポジトリのルートで `python -m http.server 8000` を実行し、`http://localhost:8000/` を開いてください。Three.js とフォントはCDNから取得します。

検証は Python の Playwright と Chromium を用います。`python tests/world-smoke.py --browser /usr/bin/chromium` で実行できます。Three.jsをローカルに用意した場合は `--three /absolute/path/three.min.js` を指定できます。

音楽の検証は `node --test tests/music-scores.test.mjs` と `python tests/music-browser.py --browser /usr/bin/chromium` で実行できます。後者は NumPy と FFmpeg も使用し、実際のゲームの出力を録音して、描画停止中・曲の切替中の無音を調べます。同じ `--three` オプションを使えます。

回避と生成処理の検証は `python tests/dodge-browser.py --browser /usr/bin/chromium` です。同じ `--three` オプションを使えます。敵弾との高速な交差、グレイズ、実走行での回避、6種類の弾幕、生成の分割・中止、解像度の適応を確認します。

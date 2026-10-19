# Wind Lover

[ゲームをひらく](https://hane-san.github.io/wind-lover/)

壊れかけのサイドカーで、廃線の向こうへ。盆地と峠をつなぐ120kmの旅路、10か所の駅跡、集落への寄り道と高架の迂回路を走る3Dブラウザーゲームです。

画面のドラッグ、または A・D で操舵、W で前傾、S でブレーキ。メニューから襲撃をオフにすると、風景を見ながら走れます。スマートフォンの縦画面に対応しています。

- [ゲーム設計](docs/DESIGN.md)
- [マップ改修の内容](docs/MAP.md)

ローカルで起動する場合は、リポジトリのルートで `python -m http.server 8000` を実行し、`http://localhost:8000/` を開いてください。Three.js とフォントはCDNから取得します。

検証は Python の Playwright と Chromium を用います。`python tests/world-smoke.py --browser /usr/bin/chromium` で実行できます。Three.jsをローカルに用意した場合は `--three /absolute/path/three.min.js` を指定できます。

"""Check the streamed journey in a real WebGL browser; no generated files enter the repository."""
import argparse
import functools
import http.server
import json
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', default='/usr/bin/chromium')
    parser.add_argument('--three', type=Path, help='Optional local Three.js r128 UMD bundle')
    parser.add_argument('--screenshots', type=Path, help='Optional screenshot output directory')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]

    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *unused):
            pass

    handler = functools.partial(Handler, directory=str(root))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=args.browser, headless=True, args=[
                '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader',
                '--enable-webgl', '--ignore-gpu-blocklist',
            ])
            page = browser.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True,
                                    has_touch=True, device_scale_factor=1)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            if args.three:
                page.route('**/three.min.js', lambda route: route.fulfill(
                    path=str(args.three.resolve()), content_type='application/javascript'))
            page.route('https://fonts.googleapis.com/**', lambda route: route.abort())
            page.add_init_script("localStorage.setItem('windlover.shells', 'false')")
            page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='load', timeout=120000)
            page.wait_for_function('window.__wl', timeout=120000)
            assert page.url.endswith('/prototype/'), 'Pages entry must lead to the game'
            report = page.evaluate('''() => {
              const w = __wl, check = (ok, message) => { if (!ok) throw Error(message); };
              let grade = 0, samples = 0;
              for (let x = 0; x <= w.X_GOAL; x += 32) {
                const z = w.railZ(x), y = w.railY(x), route = w.railway(x, z);
                check(Number.isFinite(y + z), 'Non-finite railway at ' + x);
                check(Math.abs(z) + 200 < w.halfW(x), 'Railway outside basin at ' + x);
                grade = Math.max(grade, Math.abs(w.railY(x + 1) - y));
                if (route.d < 1) {
                  const g = w.ground(x, z, y + 1);
                  check(!g.water, 'Railway under water at ' + x);
                  check(g.h < y + 1, 'Railway buried at ' + x);
                  check(g.h >= y, 'Missing railway deck at ' + x);
                }
                samples++;
              }
              check(grade < 0.2, 'Railway grade exceeds 20%');
              const loops = [];
              for (const l of w.LOOPS) {
                for (const x of [l.a, l.b]) {
                  check(Math.abs(w.loopZ(l, x) - w.railZ(x)) < 0.001, 'Loop does not rejoin');
                  check(Math.abs(w.loopY(l, x) - w.railY(x)) < 0.001, 'Loop height does not rejoin');
                }
                let steepest = 0;
                for (let x = l.a; x <= l.b; x += 16) {
                  const z = w.loopZ(l, x), y = w.loopY(l, x), g = w.ground(x, z, y + 1);
                  check(!g.water && g.h < y + 1, 'Blocked service road at ' + x);
                  check(g.h >= y - 0.1, 'Missing service road surface at ' + x);
                  steepest = Math.max(steepest, Math.abs(w.loopY(l, x + 1) - y));
                }
                check(steepest < 0.2, 'Service road grade exceeds 20%');
                loops.push({station: l.station?.name || null, detour: !!l.gap, steepest});
              }
              for (const b of w.BREAKS) {
                const x = (b.a + b.b) / 2, z = w.railZ(x), y = w.railY(x);
                check(w.railway(x, z).d > 100, 'Invisible deck across broken bridge');
                check(w.ground(x, z, y + 1).h < y - 20, 'Broken bridge must cross a valley');
                const l = w.LOOPS.find(l => l.gap === b);
                check(Math.abs(w.loopZ(l, x) - z) > 520, 'Detour enters broken span');
              }
              const x = w.BREAKS[0].a - 160, z = w.railZ(x), y = w.railY(x);
              const upper = w.ground(x, z, y + 1).h, lower = w.ground(x, z, -9999).h;
              check(upper > lower + 8, 'Viaduct has no clearance underneath');
              check(w.rideRoute(x, z, lower + 1).half === 14 && w.rideRoute(x, z, lower + 1).loop === undefined,
                    'Road below viaduct attracted to railway');
              for (const s of w.STATIONS) {
                const yaw = Math.atan2(1, w.railZd(s.x)), px = s.x + 29 * s.side * Math.cos(yaw);
                const pz = w.railZ(s.x) - 29 * s.side * Math.sin(yaw), py = w.railY(s.x);
                check(w.stationShelter(px, pz, py + 2), 'Canopy does not shelter: ' + s.name);
                check(!w.stationShelter(px, pz, py + 9), 'Canopy shelters above roof');
              }
              let railStarts = 0;
              for (let i = 0; i < 100; i++) {
                const p = w.randomRoadSpot();
                check(Number.isFinite(p.x + p.z + p.yaw), 'Invalid random start');
                check(p.x > 0 && p.x < w.X_GOAL, 'Start outside journey');
                if (Math.abs(p.z - w.railZ(p.x)) < 0.1) railStarts++;
              }
              return {samples, steepestRailway: grade, loops, stations: w.STATIONS.length, railStarts};
            }''')
            print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)
            page.locator('#btnGo').click(timeout=120000)
            page.locator('#btnMenu').click(timeout=120000)
            drives = page.evaluate('''() => {
              const w = __wl, results = [];
              for (const start of [17000, 28000, 68000]) {
                const loop = w.LOOPS.find(l => l.gap && start >= l.a && start <= l.b);
                const z = loop ? w.loopZ(loop, start) : w.railZ(start);
                const slope = loop ? (w.loopZ(loop, start + 1) - w.loopZ(loop, start - 1)) / 2 : w.railZd(start);
                w.P.pos.set(start, 0, z); w.rebuildAll(); w.placeAt(start, z, Math.atan2(1, slope), 60);
                w.P.dead = false; w.P.stalled = false; w.P.hull = 3; w.P.invuln = 0;
                w.inp.jx = w.inp.jy = w.inp.kx = w.inp.ky = 0;
                let airborne = 0;
                for (let i = 0; i < 2400; i++) {
                  w.stepPhysics(1 / 120);
                  if (i % 40 === 0) w.loadStep();
                  if (!w.P.grounded) airborne++;
                }
                if (!Number.isFinite(w.P.pos.x + w.P.pos.y + w.P.pos.z) || w.P.pos.x < start + 1000 || w.P.stalled)
                  throw Error('Unable to drive through ' + start);
                results.push({start, travelled: w.P.pos.x - start, airborneSeconds: airborne / 120, hull: w.P.hull});
              }
              return results;
            }''')
            print('Drives:', json.dumps(drives), flush=True)
            # Rebuilds must restore stations and found-state keys without retaining unloaded chunks.
            for x in [18800, 109000, 18800]:
                result = page.evaluate('''x => {
                  const w = __wl, z = w.railZ(x); w.P.pos.set(x, w.railY(x) + 1, z); w.rebuildAll();
                  const s = w.STATIONS.find(s => s.x === x), yaw = Math.atan2(1, w.railZd(x)), y = w.railY(x);
                  for (let panel = 0; panel < 6; panel++) {
                    const along = -37.5 + panel * 15, px = x + 29 * s.side * Math.cos(yaw) + along * Math.sin(yaw);
                    const pz = z - 29 * s.side * Math.sin(yaw) + along * Math.cos(yaw);
                    const covered = w.stationShelter(px, pz, y + 2), roof = w.ground(px, pz, y + 9).h > y + 6;
                    if (covered !== roof) throw Error('Canopy hole has invisible roof/shelter at ' + x + ':' + panel);
                  }
                  return {chunks: w.chunks.size, finds: w.finds.filter(f => f.key === 'station:' + x).length};
                }''', x)
                assert result == {'chunks': 25, 'finds': 1}, result
            # Existing single-world previews must remain independent of the journey.
            page.locator('#worldCards2 button').filter(has_text='雪の峠').click(timeout=120000)
            assert page.evaluate('__wl.railway(18800, __wl.railZ(18800)).d === Infinity')
            page.locator('#btnMenu').click()
            page.locator('#worldCards2 button').filter(has_text='廃線をたどる120km').click(timeout=120000)
            assert page.evaluate('__wl.railway(18800, __wl.railZ(18800)).d < 0.001')
            if args.screenshots:
                args.screenshots.mkdir(parents=True, exist_ok=True)
                page.locator('#btnMenu').click()
                for label, x in [('lake-station', 18800), ('broken-viaduct', 28800)]:
                    page.evaluate('''x => {
                      const w = __wl, z = w.railZ(x), y = w.railY(x);
                      w.P.pos.set(x, y + 1, z); w.rebuildAll();
                      window.__wlCam = c => { c.position.set(x - 90, y + 45, z + 110); c.lookAt(x + 110, y, z); };
                      document.querySelector('#menuSheet').hidden = true;
                    }''', x)
                    page.wait_for_timeout(250)
                    page.screenshot(path=str(args.screenshots / (label + '.png')))
            assert not errors, errors
            browser.close()
            print('PASS: geometry, detours, clearance, shelters, driving, streaming and world switching; no page errors.')
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()

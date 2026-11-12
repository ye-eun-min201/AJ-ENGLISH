(function () {
  'use strict';
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));
  const smooth = value => value < .5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  const route = [[-25,4,12],[-18,5,22],[-5,10,24],[10,17,20],[25,8,13],[29,4,-1],[23,6,-17],[12,13,-24],[-3,15,-22],[-17,7,-18],[-29,4,-9],[-31,6,2]];
  const FALLBACK_PATH = 'M80 270C140 150 190 150 270 235S390 300 460 165S570 100 660 220S780 300 860 180';
  const fallbackSegments = [
    [[80,270],[140,150],[190,150],[270,235]], [[270,235],[350,320],[390,300],[460,165]],
    [[460,165],[530,30],[570,100],[660,220]], [[660,220],[750,340],[780,300],[860,180]]
  ];
  const fallbackPoint = value => {
    const parameter = clamp(value) * 4, index = Math.min(3, Math.floor(parameter)), t = parameter - index, points = fallbackSegments[index], one = 1 - t;
    const x = one ** 3 * points[0][0] + 3 * one ** 2 * t * points[1][0] + 3 * one * t ** 2 * points[2][0] + t ** 3 * points[3][0];
    const y = one ** 3 * points[0][1] + 3 * one ** 2 * t * points[1][1] + 3 * one * t ** 2 * points[2][1] + t ** 3 * points[3][1];
    const dx = 3 * one ** 2 * (points[1][0] - points[0][0]) + 6 * one * t * (points[2][0] - points[1][0]) + 3 * t ** 2 * (points[3][0] - points[2][0]);
    const dy = 3 * one ** 2 * (points[1][1] - points[0][1]) + 6 * one * t * (points[2][1] - points[1][1]) + 3 * t ** 2 * (points[3][1] - points[2][1]);
    return { x, y, angle: Math.atan2(dy, dx) * 180 / Math.PI };
  };
  async function create(container, options = {}) {
    if (!container?.replaceChildren) throw new Error('RailScene requires a container.');
    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const host = document.createElement('div');
    host.className = 'rail-scene-surface';
    host.style.cssText = 'position:relative;width:100%;height:100%;min-height:300px;overflow:hidden;background:#070b14;isolation:isolate';
    const loading = document.createElement('div');
    loading.className = 'rail-scene-loading'; loading.textContent = '레일 구성 중';
    loading.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;color:#c9d2e4;font-size:14px;font-weight:700;z-index:2';
    host.append(loading); container.replaceChildren(host);
    let destroyed = false, available = false, renderer, scene, camera, curve, types, frame = 0, observer;
    let visible = !document.hidden, paused = false, cameraMode = 'overview';
    let progress = clamp(options.progress), target = progress, motionStart = progress, motionAt = 0, motionDuration = 0;
    let lastTick = 0, runningTime = 0, orbitAngle = .78, orbitPitch = .58, drag = null, frozenAt = 0;
    let pending = [], fallbackCart, fallbackText, train = [], wheelMeshes = [], water, ferrisWheel, carousel, ferrisCabins = [], carouselHorses = [], balloonClusters = [];
    const disposables = new Set(), geometries = new Set(), materials = new Set(), textureSet = new Set();
    const content = document.createElement('div');
    content.style.cssText = 'position:absolute;inset:0'; host.append(content);
    const caption = document.createElement('span'); caption.className = 'rail-scene-caption';
    caption.style.cssText = 'position:absolute;left:15px;bottom:13px;padding:6px 10px;border:1px solid #ffffff24;border-radius:20px;background:#0a0f1ad9;backdrop-filter:blur(8px);font-size:10px;font-weight:700;color:#f4f2ec;pointer-events:none;z-index:1';
    caption.textContent = '놀이공원 레일 · 정답 후 출발'; host.append(caption);
    const listeners = [];
    function listen(element, name, fn, settings) { element.addEventListener(name, fn, settings); listeners.push(() => element.removeEventListener(name, fn, settings)); }
    function settleMoves() { const ready = pending.filter(item => progress >= item.target - .00001); pending = pending.filter(item => !ready.includes(item)); for (const item of ready) item.resolve({ progress }); }
    function advance(value, settings = {}) {
      if (destroyed) return Promise.resolve({ progress, destroyed: true });
      const next = clamp(value);
      if (next < progress - .00001) { progress = target = motionStart = next; motionAt = motionDuration = 0; for (const item of pending) item.resolve({ progress, reset: true }); pending = []; place(); return Promise.resolve({ progress }); }
      if (Math.abs(next - progress) < .00001) return Promise.resolve({ progress });
      const superseded = pending.filter(item => item.target > next + .00001);
      pending = pending.filter(item => !superseded.includes(item));
      for (const item of superseded) item.resolve({ progress, superseded: true });
      target = next; motionStart = progress; motionAt = performance.now(); if (paused || !visible) frozenAt = motionAt;
      motionDuration = reduced ? 180 : clamp(Math.abs(next - progress) * 12000, 2300, settings.boost ? 4300 : 4700);
      const result = new Promise(resolve => pending.push({ target: next, resolve }));
      schedule(); return result;
    }
    function syncRunState() { const now = performance.now(); if (paused || !visible) { if (!frozenAt) frozenAt = now; cancelAnimationFrame(frame); frame = 0; } else { if (frozenAt && motionDuration) motionAt += now - frozenAt; frozenAt = 0; lastTick = 0; schedule(); } }
    function pause(value = true) { paused = !!value; syncRunState(); }
    function setCamera(mode) { cameraMode = mode === 'ride' ? 'ride' : 'overview'; caption.textContent = available ? cameraMode === 'ride' ? '탑승 시점 · 정답 후 다음 구간' : '놀이공원 전경 · 드래그로 둘러보기' : '3D 표시 미지원 · 2D 레일'; place(true); schedule(); }
    function reset() { for (const item of pending) item.resolve({ progress: 0, reset: true }); pending = []; progress = target = motionStart = clamp(options.progress); motionDuration = 0; place(true); schedule(); }
    function dimensions() { return { width: Math.max(240, container.clientWidth || host.clientWidth || 700), height: Math.max(300, container.clientHeight || host.clientHeight || 480) }; }
    function resize() { if (destroyed) return; const { width, height } = dimensions(); if (renderer && camera) { renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); } place(true); schedule(); }
    function fallback(error) {
      available = false;
      content.innerHTML = '<svg viewBox="0 0 940 420" preserveAspectRatio="xMidYMid meet" aria-label="2D 영어 놀이공원 레일 코스" role="img" style="width:100%;height:100%;display:block"><defs><linearGradient id="rs-sky" x2="0" y2="1"><stop stop-color="#d4edf8"/><stop offset="1" stop-color="#fff1d2"/></linearGradient><linearGradient id="rs-ground" x2="0" y2="1"><stop stop-color="#f7e3c3"/><stop offset="1" stop-color="#eac99f"/></linearGradient></defs><rect width="940" height="420" fill="url(#rs-sky)"/><circle cx="790" cy="68" r="38" fill="#ffdda0"/><g fill="#fff9e8"><ellipse cx="200" cy="68" rx="53" ry="15"/><ellipse cx="237" cy="60" rx="35" ry="22"/><ellipse cx="480" cy="95" rx="68" ry="16"/></g><path d="M0 295Q250 255 470 290T940 275V420H0Z" fill="url(#rs-ground)"/><g data-rs-ferris-wheel transform="translate(285 205)"><path d="m-48 120 48-120 48 120" fill="none" stroke="#df846e" stroke-width="9"/><circle r="85" fill="none" stroke="#80b7cc" stroke-width="7"/><g stroke="#e2b65e" stroke-width="3"><path d="M-85 0H85M0-85V85m-60-60 120 120m-120 0L60-60"/></g><g fill="#ed9c83" stroke="#fff3d9" stroke-width="4"><rect x="-15" y="-99" width="30" height="24" rx="7"/><rect x="-100" y="-10" width="30" height="24" rx="7"/><rect x="70" y="-10" width="30" height="24" rx="7"/><rect x="-15" y="73" width="30" height="24" rx="7"/></g></g><g data-rs-carousel transform="translate(680 282)"><ellipse cy="41" rx="78" ry="15" fill="#83b9ce"/><path d="m-82-46 82-53 82 53Z" fill="#e48670"/><path d="m-42-46 42-53 42 53Z" fill="#fff1d6"/><path d="M-66-45v77m44-77v77m44-77v77m44-77v77" stroke="#d5ad55" stroke-width="4"/><path d="M-77-43H77" stroke="#edcd83" stroke-width="9"/><g fill="#fff4df"><ellipse cx="-44" cy="14" rx="17" ry="9"/><ellipse cx="43" cy="14" rx="17" ry="9"/><path d="m-34 13 3-15 7-1-2 18m77-2 3-15 7-1-2 18"/></g></g><path d="M75 106Q410 167 865 92" fill="none" stroke="#a58d75" stroke-width="2"/><g fill="#e38b73"><path d="m110 112 22 5-17 26Zm122 25 23 3-16 26Zm126 15 23 1-13 26Zm128-3 23-2-9 28Zm129-15 23-4-7 28Zm128-24 23-5-6 28Z"/></g><g stroke="#e4bd6f" stroke-width="7"><path d="M80 270v92m90-160v160m100-127v127m95-98v105m95-204v204m100-235v235m100-180v180m100-105v105m100-195v195"/></g><path d="' + FALLBACK_PATH + '" fill="none" stroke="#77aec5" stroke-width="13"/><path d="' + FALLBACK_PATH + '" fill="none" stroke="#e0f0f0" stroke-width="4" stroke-dasharray="3 8"/><g data-rs-fallback-cart><rect x="-28" y="-30" width="58" height="31" rx="9" fill="#e6876e" stroke="#ad6554" stroke-width="3"/><path d="M-23-19h47" stroke="#ffe1a2" stroke-width="5"/><circle cx="-17" cy="3" r="7" fill="#70564e"/><circle cx="18" cy="3" r="7" fill="#70564e"/><circle cx="-4" cy="-40" r="14" fill="#f2d6af"/><path d="M-10-43v2m13-2v2" stroke="#70564e" stroke-width="3" stroke-linecap="round"/></g><text x="470" y="402" text-anchor="middle" fill="#755548" font-size="14" data-rs-fallback-progress>레일 진행 0%</text></svg>';
      fallbackCart = content.querySelector('[data-rs-fallback-cart]'); fallbackText = content.querySelector('[data-rs-fallback-progress]');
      loading.remove(); caption.textContent = '3D 표시 미지원 · 2D 레일'; place();
      if (typeof options.onError === 'function') options.onError(error instanceof Error ? error : new Error('3D 표시 미지원'));
    }
    function place(snap = false) {
      if (destroyed) return;
      if (!available) { const pos = fallbackPoint(progress); fallbackCart?.setAttribute('transform', 'translate(' + pos.x + ' ' + pos.y + ') rotate(' + pos.angle + ')'); if (fallbackText) fallbackText.textContent = '레일 진행 ' + Math.round(progress * 100) + '%'; return; }
      const T = types;
      if (!T || !curve || !camera) return;
      const up = new T.Vector3(0, 1, 0);
      train.forEach((car, index) => {
        const parameter = ((progress - index * .025) % 1 + 1) % 1, point = curve.getPointAt(parameter), tangent = curve.getTangentAt(parameter).normalize();
        const right = new T.Vector3().crossVectors(up, tangent).normalize(), normal = new T.Vector3().crossVectors(tangent, right).normalize();
        car.position.copy(point).addScaledVector(normal, .56);
        car.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right, normal, tangent));
      });
      wheelMeshes.forEach(wheel => { wheel.rotation.x = -progress * curve.getLength() / .34; });
      const front = curve.getPointAt(((progress % 1) + 1) % 1), tangent = curve.getTangentAt(((progress % 1) + 1) % 1).normalize();
      let desired, look;
      if (cameraMode === 'ride') {
        desired = front.clone().addScaledVector(tangent, -6.5).add(new T.Vector3(0, 3.6, 0));
        look = curve.getPointAt(((progress + .038) % 1 + 1) % 1).add(new T.Vector3(0, 1.4, 0));
      } else {
        const angle = orbitAngle + (reduced ? 0 : Math.sin(runningTime * .045) * .018);
        const radius = camera.aspect < .85 ? 101 : camera.aspect < 1.2 ? 91 : 78;
        desired = new T.Vector3(Math.sin(angle) * radius, radius * Math.sin(orbitPitch), Math.cos(angle) * radius);
        look = new T.Vector3(0, 3.5, 0);
      }
      if (snap || reduced) camera.position.copy(desired); else camera.position.lerp(desired, cameraMode === 'ride' ? .11 : .045);
      camera.lookAt(look);
      if (!reduced) {
        if (water) water.position.y = .32 + Math.sin(runningTime * .6) * .018;
        if (ferrisWheel) { ferrisWheel.rotation.z = runningTime * .075; ferrisCabins.forEach(cabin => { cabin.rotation.z = -ferrisWheel.rotation.z; }); }
        if (carousel) carousel.rotation.y = runningTime * .15;
        carouselHorses.forEach((horse, index) => { horse.position.y = Math.sin(runningTime * 1.25 + index * 1.05) * .24; });
        balloonClusters.forEach((cluster, index) => { cluster.rotation.z = Math.sin(runningTime * .7 + index) * .035; });
      }
      renderer.render(scene, camera);
    }
    function tick(now) {
      frame = 0; if (destroyed || !visible) return;
      const delta = Math.min(.05, Math.max(0, (now - (lastTick || now)) / 1000)); lastTick = now;
      if (!paused) {
        runningTime += delta;
        // Near-target easing must keep ticking until the travel deadline settles the Promise.
        if (motionDuration) {
          const fraction = clamp((now - motionAt) / motionDuration); progress = motionStart + (target - motionStart) * smooth(fraction);
          if (fraction >= 1) { progress = target; motionDuration = 0; settleMoves(); }
        }
      }
      place();
      if (!paused && ((available && !reduced) || motionDuration)) schedule();
    }
    function schedule() { if (!destroyed && visible && !frame) frame = requestAnimationFrame(tick); }
    function destroy() {
      if (destroyed) return; destroyed = true; cancelAnimationFrame(frame); frame = 0; observer?.disconnect(); listeners.forEach(remove => remove());
      for (const item of pending) item.resolve({ progress, destroyed: true }); pending = [];
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); textureSet.forEach(item => item.dispose()); disposables.forEach(item => item.dispose?.());
      renderer?.dispose(); renderer?.forceContextLoss?.(); host.remove();
    }
    const controller = { get available() { return available; }, get message() { return available ? '' : '3D 표시 미지원 · 2D 레일'; }, advance, setCamera, pause, reset, destroy, getProgress: () => progress };
    listen(document, 'visibilitychange', () => { visible = !document.hidden; syncRunState(); });
    listen(window, 'resize', resize);
    try {
      const T = await import('/vendor/three.module.min.mjs');
      if (destroyed) return controller;
      types = T;
      scene = new T.Scene(); scene.background = new T.Color('#070b14'); scene.fog = new T.Fog('#070b14', 92, 178);
      camera = new T.PerspectiveCamera(43, 1, .1, 240);
      renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
      const compact = (window.innerWidth || 1000) < 700; renderer.setPixelRatio(Math.min(compact ? 1.3 : 1.7, window.devicePixelRatio || 1)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .96;
      const canvas = renderer.domElement; canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y'; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', '관람차와 회전목마 사이를 달리는 3D 영어 롤러코스터'); content.replaceChildren(canvas);
      listen(canvas, 'webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(frame); frame = 0; renderer?.dispose(); available = false; fallback(new Error('3D 연결 중단 · 2D 레일 표시')); schedule(); });
      listen(canvas, 'pointerdown', event => { if (cameraMode !== 'overview') return; drag = { x: event.clientX, y: event.clientY, angle: orbitAngle, pitch: orbitPitch }; if (event.pointerType !== 'touch') canvas.setPointerCapture?.(event.pointerId); });
      listen(canvas, 'pointermove', event => { if (!drag || cameraMode !== 'overview') return; orbitAngle = drag.angle - (event.clientX - drag.x) * .006; if (event.pointerType !== 'touch') orbitPitch = clamp(drag.pitch + (event.clientY - drag.y) * .003, .38, .92); place(true); schedule(); });
      const release = () => { drag = null; }; listen(canvas, 'pointerup', release); listen(canvas, 'pointercancel', release); listen(canvas, 'pointerleave', release);
      scene.add(new T.HemisphereLight('#8ea8f5', '#1b1528', .78)); const parkLamp = new T.PointLight('#ffc45c', 1250, 120, 1.75); parkLamp.position.set(2, 26, 4); scene.add(parkLamp);
      const sunlight = new T.DirectionalLight('#b9c9ff', 1.05); sunlight.position.set(-35, 62, 28); sunlight.castShadow = true; sunlight.shadow.mapSize.set(compact ? 1024 : 1536, compact ? 1024 : 1536); sunlight.shadow.camera.left = sunlight.shadow.camera.bottom = -56; sunlight.shadow.camera.right = sunlight.shadow.camera.top = 56; sunlight.shadow.camera.far = 140; sunlight.shadow.normalBias = .08; sunlight.shadow.bias = -.00015; scene.add(sunlight);
      const mat = (color, extra = {}) => { const material = new T.MeshStandardMaterial({ color, roughness: .88, flatShading: true, ...extra }); materials.add(material); return material; };
      const geo = geometry => { geometries.add(geometry); return geometry; };
      const box = geo(new T.BoxGeometry(1, 1, 1)), sphere = geo(new T.IcosahedronGeometry(1, 1)), cylinder = geo(new T.CylinderGeometry(1, 1, 1, 8)), cone = geo(new T.ConeGeometry(1, 1, 7));
      const palette = { grass: mat('#f2dfbd'), base: mat('#dfa98f'), edge: mat('#f0cd78'), trunk: mat('#b7967c'), leaf: mat('#e7a394'), leafLight: mat('#b8d9e7'), leafDark: mat('#eed28b'), rail: mat('#508ba7', { metalness: .33, roughness: .5 }), railTop: mat('#6cabc5', { metalness: .45, roughness: .35 }), tie: mat('#cee2e7'), support: mat('#e9c36b'), cream: mat('#fff1d6'), dark: mat('#70564e'), roof: mat('#e27f6b'), gold: mat('#efc66b'), stone: mat('#ddc6ad'), wall: mat('#f3ddba'), glass: mat('#a5d5e9', { roughness: .24, metalness: .15 }), cart: mat('#e37c65'), pink: mat('#db9a87'), fur: mat('#f2d8ad'), white: mat('#fff6e1'), sky: mat('#86bed5'), butter: mat('#f4cf78'), rose: mat('#e8a293') };
      function mesh(geometry, material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, parent = scene) { const item = new T.Mesh(geometry, material); item.position.set(x, y, z); item.scale.set(sx, sy, sz); item.castShadow = true; item.receiveShadow = true; parent.add(item); return item; }
      const island = mesh(geo(new T.CylinderGeometry(44, 41, 3.2, 72)), palette.base, 0, -2.22, 0, 1.12, 1, .86); island.receiveShadow = true;
      mesh(geo(new T.CylinderGeometry(44.2, 44.2, .65, 72)), palette.grass, 0, -.43, 0, 1.12, 1, .86);
      mesh(geo(new T.CylinderGeometry(41, 40.5, .24, 72)), palette.edge, 0, -3.78, 0, 1.12, 1, .86);
      const floor = mesh(geo(new T.PlaneGeometry(500, 500)), mat('#f6e8d1'), 0, -4.05, 0); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
      // A paved fairground with a small fountain replaces the forest floor.
      water = mesh(geo(new T.CircleGeometry(4.65, 44)), mat('#95d1e7', { roughness: .23, metalness: .19 }), 0, .32, 11, 1, 1, 1); water.rotation.x = -Math.PI / 2; water.castShadow = false;
      mesh(geo(new T.CylinderGeometry(5.1, 5.5, .6, 44)), palette.cream, 0, -.04, 11);
      const fountainRim = mesh(geo(new T.TorusGeometry(4.9, .22, 5, 44)), palette.sky, 0, .36, 11); fountainRim.rotation.x = -Math.PI / 2;
      const fountainJet = mesh(geo(new T.CylinderGeometry(.1, .3, 3.2, 10)), mat('#acdcec', { transparent: true, opacity: .8, roughness: .22 }), 0, 1.94, 11); fountainJet.castShadow = false;
      mesh(sphere, palette.white, 0, 3.56, 11, .35, .22, .35);
      for (let i = 0; i < 7; i++) { const angle = i * .9; const ripple = mesh(geo(new T.TorusGeometry(.65 + i * .22, .02, 3, 24, Math.PI * .7)), palette.cream, Math.cos(angle) * 2, .36, 11 + Math.sin(angle) * 2, 1, 1, 1); ripple.rotation.x = -Math.PI / 2; ripple.castShadow = false; }
      // Curved high and low sections create a real ride instead of a moving progress icon.
      curve = new T.CatmullRomCurve3(route.map(point => new T.Vector3(...point)), true, 'catmullrom', .45); const trackLength = curve.getLength();
      const up = new T.Vector3(0, 1, 0), railPoints = [[], []];
      for (let i = 0; i <= 480; i++) { const u = i / 480, point = curve.getPointAt(u), tangent = curve.getTangentAt(u), side = new T.Vector3().crossVectors(up, tangent).normalize(); railPoints[0].push(point.clone().addScaledVector(side, -.74)); railPoints[1].push(point.clone().addScaledVector(side, .74)); }
      for (const points of railPoints) { const line = new T.CatmullRomCurve3(points, false, 'centripetal'); mesh(geo(new T.TubeGeometry(line, 480, .095, 6, false)), palette.railTop); }
      const ties = new T.InstancedMesh(box, palette.tie, 255); ties.castShadow = ties.receiveShadow = true; scene.add(ties); disposables.add(ties);
      const dummy = new T.Object3D();
      for (let i = 0; i < 255; i++) { const u = i / 255, point = curve.getPointAt(u), tangent = curve.getTangentAt(u).normalize(), right = new T.Vector3().crossVectors(up, tangent).normalize(), normal = new T.Vector3().crossVectors(tangent, right).normalize(); dummy.position.copy(point).addScaledVector(normal, -.17); dummy.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right, normal, tangent)); dummy.scale.set(1.92, .2, .22); dummy.updateMatrix(); ties.setMatrixAt(i, dummy.matrix); }
      ties.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 30; i++) { const u = i / 30, point = curve.getPointAt(u), tangent = curve.getTangentAt(u).normalize(), right = new T.Vector3().crossVectors(up, tangent).normalize();
        for (const sign of [-1, 1]) { const base = point.clone().addScaledVector(right, sign * .95), height = base.y + .45; mesh(box, palette.support, base.x, height / 2 - .45, base.z, .25, height, .25); mesh(box, palette.stone, base.x, -.14, base.z, .65, .45, .65); }
        const beam = mesh(box, palette.support, point.x, point.y - .49, point.z, 2.4, .25, .3); beam.rotation.y = Math.atan2(tangent.x, tangent.z);
        if (point.y > 8) { const cross = mesh(box, palette.support, point.x, point.y / 2 - .25, point.z, .15, point.y * .75, .15); cross.rotation.z = .17; cross.rotation.y = Math.atan2(tangent.x, tangent.z); }
      }
      // Candy-coloured perimeter topiary leaves the plaza and attractions in view.
      let seed = 811;
      const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const trackXZ = Array.from({ length: 160 }, (_, i) => curve.getPointAt(i / 160));
      function nearTrack(x, z, distance) { return trackXZ.some(point => Math.hypot(point.x - x, point.z - z) < distance); }
      function instances(geometry, material, transforms) { const group = new T.InstancedMesh(geometry, material, transforms.length); group.castShadow = group.receiveShadow = true; scene.add(group); disposables.add(group); transforms.forEach((item, i) => { dummy.position.set(item.x, item.y, item.z); dummy.rotation.set(0, item.angle || 0, 0); dummy.scale.set(item.sx, item.sy, item.sz); dummy.updateMatrix(); group.setMatrixAt(i, dummy.matrix); }); group.instanceMatrix.needsUpdate = true; return group; }
      const tileA = [], tileB = [];
      for (let x = -44; x <= 44; x += 4.3) for (let z = -34; z <= 34; z += 4.3) if ((x / 47) ** 2 + (z / 36) ** 2 < .98) ((Math.round((x + 44) / 4.3) + Math.round((z + 34) / 4.3)) % 2 ? tileA : tileB).push({x,y:-.087,z,sx:4.16,sy:.035,sz:4.16});
      instances(box, mat('#f6e6cb'), tileA); instances(box, mat('#efd8b6'), tileB);
      const trunks = [], candyA = [], candyB = [], candyC = [];
      for (let i = 0; i < 68; i++) { const angle = i / 68 * Math.PI * 2 + random() * .08, radius = 33 + random() * 8, x = Math.cos(angle) * radius * 1.08, z = Math.sin(angle) * radius * .82;
        if (nearTrack(x, z, 3)) continue; const scale = .75 + random() * .5;
        trunks.push({x,y:scale*1.2-.1,z,sx:.18*scale,sy:2.5*scale,sz:.18*scale});
        [candyA,candyB,candyC][i % 3].push({x,y:scale*3.0,z,sx:1.2*scale,sy:1.7*scale,sz:1.2*scale,angle:random()*3});
      }
      instances(cylinder, palette.trunk, trunks); instances(sphere, palette.leaf, candyA); instances(sphere, palette.leafLight, candyB); instances(sphere, palette.leafDark, candyC);
      function beamBetween(from, to, material, width = .25, parent = scene) { const a = new T.Vector3(...from), b = new T.Vector3(...to), direction = b.clone().sub(a); const item = mesh(box, material, (a.x+b.x)/2, (a.y+b.y)/2, (a.z+b.z)/2, width, direction.length(), width, parent); item.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize()); return item; }
      const lampMaterial = mat('#fff2bf', { emissive: '#ffe0a0', emissiveIntensity: .35 });
      const festivalColors = [palette.roof,palette.sky,palette.butter,palette.rose];
      // The Ferris wheel cabins counter-rotate, remaining upright as the rotor turns.
      const ferrisRoot = new T.Group(); ferrisRoot.name = 'aj-ferris-wheel-attraction'; ferrisRoot.position.set(-11,0,-5); scene.add(ferrisRoot);
      for (const z of [-1.65,1.65]) { beamBetween([-6.2,.15,z],[0,10,z],palette.roof,.42,ferrisRoot); beamBetween([6.2,.15,z],[0,10,z],palette.roof,.42,ferrisRoot); beamBetween([-5.1,.15,z],[5.1,.15,z],palette.cream,.45,ferrisRoot); }
      ferrisWheel = new T.Group(); ferrisWheel.name = 'aj-ferris-wheel-rotor'; ferrisWheel.position.y = 10; ferrisRoot.add(ferrisWheel);
      for (const z of [-.35,.35]) { const ring = mesh(geo(new T.TorusGeometry(8,.17,5,60)),palette.sky,0,0,z,1,1,1,ferrisWheel); }
      const axle = mesh(cylinder,palette.gold,0,10,0,.55,4.2,.55,ferrisRoot); axle.rotation.x = Math.PI/2;
      for (let i=0;i<10;i++) { const angle=i/10*Math.PI*2, x=Math.cos(angle)*8, y=Math.sin(angle)*8;
        beamBetween([0,0,0],[x,y,0],i%2?palette.cream:palette.butter,.12,ferrisWheel);
        const cabin=new T.Group(); cabin.position.set(x,y,0); ferrisWheel.add(cabin); ferrisCabins.push(cabin);
        mesh(box,festivalColors[i%4],0,-1.12,0,1.55,1.35,1.45,cabin); mesh(box,palette.cream,0,-.28,0,1.75,.24,1.65,cabin); mesh(box,palette.glass,0,-.78,.74,.92,.45,.06,cabin);
        mesh(sphere,lampMaterial,x,y,.47,.15,.15,.15,ferrisWheel);
      }
      // A striped carousel canopy, gold poles and small horses form the second landmark.
      const carouselRoot = new T.Group(); carouselRoot.name = 'aj-carousel-attraction'; carouselRoot.position.set(14,0,1); scene.add(carouselRoot);
      mesh(geo(new T.CylinderGeometry(6.4,6.7,.65,40)),palette.sky,0,.18,0,1,1,1,carouselRoot);
      mesh(geo(new T.CylinderGeometry(6.3,6.3,.18,40)),palette.cream,0,.6,0,1,1,1,carouselRoot);
      mesh(cylinder,palette.gold,0,4.05,0,.36,7.2,.36,carouselRoot);
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2,b=(i+1)/12*Math.PI*2;const triangle=geo(new T.BufferGeometry());triangle.setAttribute('position',new T.Float32BufferAttribute([0,8.6,0,Math.cos(b)*6.8,6,Math.sin(b)*6.8,Math.cos(a)*6.8,6,Math.sin(a)*6.8],3));triangle.computeVertexNormals();const panel=mesh(triangle,i%2?palette.cream:palette.roof,0,0,0,1,1,1,carouselRoot);panel.name='aj-carousel-roof-panel';mesh(sphere,lampMaterial,Math.cos(a)*6.7,5.98,Math.sin(a)*6.7,.17,.17,.17,carouselRoot);}
      const canopyEdge=mesh(geo(new T.CylinderGeometry(6.8,6.8,.35,32,1)),palette.butter,0,5.85,0,1,1,1,carouselRoot);
      mesh(sphere,palette.gold,0,8.77,0,.36,.55,.36,carouselRoot);
      carousel=new T.Group(); carousel.name='aj-carousel-rotor';carouselRoot.add(carousel);
      for(let i=0;i<6;i++){const angle=i/6*Math.PI*2,x=Math.cos(angle)*4.4,z=Math.sin(angle)*4.4;mesh(cylinder,palette.gold,x,3.3,z,.06,5.5,.06,carousel);const horse=new T.Group();horse.position.set(x,0,z);horse.rotation.y=Math.PI/2-angle;carousel.add(horse);carouselHorses.push(horse);
        mesh(sphere,palette.white,0,2.3,0,.48,.38,.9,horse);mesh(sphere,palette.white,0,2.8,.6,.22,.63,.25,horse);mesh(sphere,palette.white,0,3.24,.81,.28,.28,.42,horse);mesh(box,festivalColors[i%4],0,2.62,-.08,.72,.12,.5,horse);for(const side of [-1,1])for(const zLeg of [-.52,.5])mesh(box,palette.white,side*.25,1.88,zLeg,.11,.65,.11,horse);mesh(cone,palette.roof,0,3.58,.7,.13,.35,.13,horse);
      }
      // Ticket and popcorn kiosks, complete with striped awnings and a popcorn crown.
      function kiosk(x,z,angle,material,popcorn=false){const group=new T.Group();group.name=popcorn?'aj-popcorn-kiosk':'aj-ticket-kiosk';group.position.set(x,.05,z);group.rotation.y=angle;scene.add(group);mesh(box,palette.cream,0,1.6,0,4,3.1,3.3,group);for(let i=0;i<7;i++)mesh(box,i%2?palette.cream:material,-1.7+i*.56,1.45,1.68,.55,2.65,.08,group);mesh(box,palette.dark,0,2,1.77,2.1,.95,.1,group);mesh(box,palette.butter,0,1.35,2.05,2.7,.16,.65,group);for(let i=0;i<7;i++){const awning=mesh(box,i%2?palette.cream:material,-1.8+i*.6,3.45,.36,.59,.23,4.25,group);awning.rotation.x=.08;}mesh(box,material,0,4.15,-.2,2.5,.8,.32,group);if(popcorn){for(let i=0;i<8;i++)mesh(sphere,palette.white,(i%4-1.5)*.45,4.72+Math.floor(i/4)*.25,-.14,.32,.3,.32,group);}else{for(const side of [-1,1]){mesh(box,palette.butter,side*.58,4.15,-.01,.6,.4,.06,group);mesh(box,material,side*.58,4.15,.03,.08,.3,.04,group);}}return group;}
      kiosk(-16,12,.35,palette.roof,true);kiosk(-22,7,.6,palette.sky,false);kiosk(24,-10,-.7,palette.roof,false);
      // A light-bulb entrance arch and bunting make the approach unmistakably a fairground.
      const entrance = new T.Group();entrance.name='aj-park-entrance';entrance.position.set(-7,0,29);entrance.rotation.y=-.15;scene.add(entrance);
      for(const side of[-1,1]){mesh(box,palette.roof,side*5.4,2.1,0,.66,4.2,.66,entrance);mesh(box,palette.cream,side*5.4,.25,0,1.25,.5,1.25,entrance);}
      const arch=mesh(geo(new T.TorusGeometry(5.4,.3,5,40,Math.PI)),palette.sky,0,4.1,0,1,1,1,entrance);
      for(let i=0;i<=12;i++){const angle=i/12*Math.PI;mesh(sphere,lampMaterial,Math.cos(angle)*5.4,4.1+Math.sin(angle)*5.4,.36,.18,.18,.18,entrance);}
      mesh(box,palette.butter,0,8.5,.12,4.2,1.35,.35,entrance);for(let i=-1;i<=1;i++)mesh(sphere,palette.roof,i*.9,8.5,.33,.22,.22,.09,entrance);
      const stringPoints=[new T.Vector3(-25,7.8,18),new T.Vector3(-8,6.2,18),new T.Vector3(9,6.5,18),new T.Vector3(25,8.2,18)];const buntingCurve=new T.CatmullRomCurve3(stringPoints);mesh(geo(new T.TubeGeometry(buntingCurve,48,.035,4,false)),palette.dark);
      const flagGeo=geo(new T.BufferGeometry());flagGeo.setAttribute('position',new T.Float32BufferAttribute([-.4,0,0,.4,0,0,0,-.95,0],3));flagGeo.computeVertexNormals();
      const flagMaterials=festivalColors.map(material=>{const copy=material.clone();copy.side=T.DoubleSide;materials.add(copy);return copy;});
      for(let i=0;i<25;i++){const point=buntingCurve.getPointAt(i/24);mesh(flagGeo,flagMaterials[i%4],point.x,point.y,point.z);}
      for(const [index,position] of [[-25,18],[20,14],[-20,-15],[28,-7]].entries()){const cluster=new T.Group();cluster.name='aj-park-balloons';cluster.position.set(position[0],0,position[1]);scene.add(cluster);balloonClusters.push(cluster);mesh(cylinder,palette.gold,0,2,0,.05,4,.05,cluster);for(let i=0;i<3;i++){const x=(i-1)*.9,y=5.2+(i%2)*.65,z=(i%2)*.65;beamBetween([0,2.1,0],[x,y,z],palette.cream,.028,cluster);mesh(sphere,festivalColors[(index+i)%4],x,y,z,.7,.95,.7,cluster);}}
      const platform = mesh(box,palette.cream,-24,.35,14.8,9,1,5);platform.rotation.y=-.6;
      const station=new T.Group();station.name='aj-coaster-station';station.position.set(-24,.85,17.5);station.rotation.y=-.6;scene.add(station);for(const x of[-3.2,3.2])for(const z of[-1.4,1.4])mesh(box,palette.sky,x,2.1,z,.22,4.2,.22,station);for(let i=0;i<9;i++)mesh(box,i%2?palette.cream:palette.roof,-3.6+i*.9,4.35,0,.88,.42,4.2,station);mesh(box,palette.butter,0,3.45,1.6,3.3,.85,.15,station);for(let i=-1;i<=1;i++)mesh(sphere,palette.roof,i*.72,3.45,1.73,.2,.2,.07,station);
      // Three little cars remain attached to the same physical rail tangent.
      const wheelGeo = geo(new T.CylinderGeometry(.33, .33, .2, 12)), eyeGeo = geo(new T.SphereGeometry(.05, 6, 4));
      function passenger(parent, x, z, rabbit) { mesh(sphere, palette.cart, x, 1.05, z, .42, .55, .35, parent); mesh(sphere, palette.fur, x, 1.8, z, .54, .58, .5, parent); for (const sign of [-1, 1]) { mesh(eyeGeo, palette.dark, x + sign * .17, 1.9, z + .44, 1, 1, 1, parent); if (rabbit) mesh(sphere, palette.fur, x + sign * .24, 2.52, z, .15, .56, .17, parent); else mesh(sphere, palette.fur, x + sign * .42, 2.12, z, .22, .23, .2, parent); } mesh(sphere, palette.pink, x, 1.72, z + .48, .08, .06, .05, parent); }
      for (let index = 0; index < 3; index++) { const car = new T.Group(); scene.add(car); train.push(car); mesh(box, palette.cart, 0, .48, 0, 2.05, .85, 2.85, car); mesh(box, palette.gold, 0, .58, 1.44, 1.85, .13, .1, car); mesh(box, palette.cream, 0, .95, -.15, 1.88, .16, 2.6, car); mesh(box, palette.cart, 0, 1.05, -1.23, 2.0, .65, .2, car); for (const sign of [-1, 1]) mesh(box, palette.cart, sign * .94, 1.07, 0, .16, .65, 2.6, car);
        for (const side of [-1, 1]) for (const z of [-.88, .88]) { const wheel = mesh(wheelGeo, palette.dark, side * 1.08, .13, z, 1, 1, 1, car); wheel.rotation.z = Math.PI / 2; wheelMeshes.push(wheel); }
        passenger(car, 0, -.1, index === 0); if (index < 2) mesh(box, palette.dark, 0, .35, -2.4, .16, .16, 2.2, car);
        if (index === 0) { mesh(box, palette.cart, 0, 1.0, 1.1, 1.8, .7, .6, car); mesh(geo(new T.CylinderGeometry(.23, .31, .9, 10)), palette.dark, .55, 1.72, 1.1, 1, 1, 1, car); for (const sign of [-1, 1]) { const light = mesh(geo(new T.SphereGeometry(.15, 8, 6)), palette.gold, sign * .64, 1.2, 1.46, 1, 1, 1, car); } }
      }
      if (options.avatarHTML && typeof options.avatarHTML === 'string' && options.avatarHTML.includes('<svg')) {
        let svg = options.avatarHTML; if (!/<svg[^>]*xmlns=/.test(svg)) svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '); if (!/<svg[^>]*width=/.test(svg)) svg = svg.replace('<svg ', '<svg width="200" height="220" '); const image = new Image();
        image.onload = () => { if (destroyed) return; const texture = new T.Texture(image); texture.colorSpace = T.SRGBColorSpace; texture.needsUpdate = true; textureSet.add(texture); const material = new T.MeshBasicMaterial({ map: texture, transparent: true, side: T.DoubleSide, depthWrite: false }); materials.add(material); mesh(geo(new T.PlaneGeometry(1.8, 2.0)), material, 0, 2.0, .8, 1, 1, 1, train[1]); schedule(); };
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      }
      available = true; loading.remove(); caption.textContent = '놀이공원 전경 · 드래그로 둘러보기';
      observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null; observer?.observe(container);
      resize(); place(true); schedule();
    } catch (error) { if (!destroyed) { renderer?.dispose(); renderer = null; fallback(error); schedule(); } }
    if (!destroyed && typeof options.onReady === 'function') options.onReady(controller);
    return controller;
  }
  window.RailScene = { create, math: { clamp, smooth, route: route.map(point => [...point]), fallbackPoint } };
})();

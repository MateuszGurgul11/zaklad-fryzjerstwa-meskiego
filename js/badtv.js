/*
 * Tło wideo z efektem starego telewizora ("bad TV").
 *
 * Oryginał używa react-three-fiber + postprocessing z własnym efektem
 * "TVEffect". Poniżej ten sam shader (GLSL przepisany 1:1 z bundla)
 * renderowany surowym WebGL-em na pełnoekranowym quadzie — bez three.js,
 * dzięki czemu szablon nie ciągnie 400 kB zależności.
 *
 * Parametry uniformów odpowiadają wartościom z oryginału dla sekcji projektów:
 *   fisheye 0.3 | vignette 0.4/0.5 | scanlines 0.3 @400 | aberracja 0.015
 */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'varying vec2 vUv;',
    'uniform sampler2D inputBuffer;',
    'uniform vec2  uCover;   // korekta proporcji (contain: cały kadr, bez cropu)',
    'uniform float uFisheyeStrength;',
    'uniform float uVignetteIntensity;',
    'uniform float uVignetteSmoothness;',
    'uniform float uScanlinesIntensity;',
    'uniform float uScanlinesCount;',
    'uniform float uChromaticAberrationStrength;',
    '',
    'vec4 sampleCover(vec2 uv){',
    '  vec2 c = (uv - 0.5) * uCover + 0.5;',
    '  if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0)',
    '    return vec4(0.145, 0.188, 0.141, 1.0);',
    '  return texture2D(inputBuffer, c);',
    '}',
    '',
    'void main(){',
    '  vec2 uv = vUv;',
    '  // === FISHEYE / BARREL DISTORTION ===',
    '  vec2 coord = uv - 0.5;',
    '  float dist = length(coord);',
    '  float maxDist = length(vec2(0.5, 0.5));',
    '  float normalizedDist = dist / maxDist;',
    '  float distortionAmount = 1.0 - uFisheyeStrength * (1.0 - normalizedDist * normalizedDist);',
    '  vec2 distortedUv = clamp(coord * distortionAmount + 0.5, 0.0, 1.0);',
    '',
    '  // === CHROMATIC ABERRATION (RGB split) ===',
    '  float caAmount = uChromaticAberrationStrength * (normalizedDist * normalizedDist);',
    '  vec2 caDir = dist > 0.0001 ? coord / dist : vec2(0.0);',
    '  vec2 caOffset = caDir * caAmount;',
    '  vec4 sampleG = sampleCover(distortedUv);',
    '  vec3 cResult = vec3(',
    '    sampleCover(clamp(distortedUv + caOffset, 0.0, 1.0)).r,',
    '    sampleG.g,',
    '    sampleCover(clamp(distortedUv - caOffset, 0.0, 1.0)).b',
    '  );',
    '',
    '  // === SCANLINES ===',
    '  float scanline = sin(distortedUv.y * uScanlinesCount) * 0.5 + 0.5;',
    '  cResult = cResult * (1.0 - uScanlinesIntensity * (1.0 - scanline));',
    '',
    '  // === VIGNETTE ===',
    '  float vignette = 1.0 - smoothstep(1.0 - uVignetteSmoothness, 1.0, normalizedDist) * uVignetteIntensity;',
    '  cResult *= vignette;',
    '',
    '  gl_FragColor = vec4(cResult, sampleG.a);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  /**
   * @param {HTMLElement} host  kontener .bad-tv-video_canvas__T5_8S
   * @param {Array}       sources  [{video, poster}]
   */
  function createBadTV(host, sources) {
    var canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    host.appendChild(canvas);

    var gl = canvas.getContext('webgl', {
      antialias: false, alpha: false, depth: false, stencil: false,
      powerPreference: 'high-performance', preserveDrawingBuffer: false
    });

    /* źródło może być podane jako {video}, {src} albo goły string */
    function srcOf(s) { return (s && (s.video || s.src)) || s; }

    /* fallback: brak WebGL → zwykły <video> lub <img>, bez shadera */
    if (!gl) {
      canvas.remove();
      var box = document.createElement('div');
      box.style.cssText = 'width:100%;height:100%';
      host.appendChild(box);
      return {
        setActive: function (i) {
          var s = srcOf(sources[Math.max(0, Math.min(i, sources.length - 1))]);
          if (!s) return;
          var isVid = /\.(mp4|webm|mov|ogv)(\?|$)/i.test(s);
          var el = box.firstChild;
          if (!el || el.tagName !== (isVid ? 'VIDEO' : 'IMG')) {
            box.innerHTML = '';
            el = document.createElement(isVid ? 'video' : 'img');
            el.style.cssText = 'width:100%;height:100%;object-fit:contain;object-position:center;background:#253024';
            if (isVid) { el.muted = true; el.loop = true; el.playsInline = true; el.autoplay = true; }
            box.appendChild(el);
          }
          if (el.getAttribute('src') !== s) el.src = s;
          if (isVid) el.play().catch(function () {});
        },
        setPlaying: function (p) {
          var el = box.firstChild;
          if (el && el.tagName === 'VIDEO') p ? el.play().catch(function () {}) : el.pause();
        },
        destroy: function () { box.innerHTML = ''; }
      };
    }

    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['inputBuffer', 'uCover', 'uFisheyeStrength', 'uVignetteIntensity', 'uVignetteSmoothness',
     'uScanlinesIntensity', 'uScanlinesCount', 'uChromaticAberrationStrength']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    gl.uniform1i(U.inputBuffer, 0);
    gl.uniform1f(U.uFisheyeStrength, 0.3);
    gl.uniform1f(U.uVignetteIntensity, 0.4);
    gl.uniform1f(U.uVignetteSmoothness, 0.5);
    gl.uniform1f(U.uScanlinesIntensity, 0.3);
    gl.uniform1f(U.uScanlinesCount, 400.0);
    gl.uniform1f(U.uChromaticAberrationStrength, 0.015);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([10, 10, 10]));

    /* Źródłem tekstury może być film albo zdjęcie — tak jak w oryginale,
       gdzie każdy kafel miał flagę isVideo. Elementy tworzymy leniwie. */
    var media = new Map();

    function isVideoSrc(src) { return /\.(mp4|webm|mov|ogv)(\?|$)/i.test(src); }

    function getMedia(src) {
      if (!media.has(src)) {
        var el;
        if (isVideoSrc(src)) {
          el = document.createElement('video');
          el.src = src; el.loop = true; el.muted = true; el.playsInline = true;
          el.preload = 'auto'; el.autoplay = true; el.crossOrigin = 'anonymous';
          el.setAttribute('webkit-playsinline', 'true');
          el.load();
        } else {
          el = new Image();
          el.crossOrigin = 'anonymous';
          el.src = src;
        }
        media.set(src, el);
      }
      return media.get(src);
    }

    function isReady(el) {
      return el.tagName === 'VIDEO' ? el.readyState >= 2 : el.complete && el.naturalWidth > 0;
    }

    var active = null, activeIndex = -1, playing = true, raf = 0, lastTime = -1, needsUpload = false;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.round(host.clientWidth * dpr));
      var h = Math.max(1, Math.round(host.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      // contain: cały kadr w proporcjach, paski po bokach zamiast cropu
      var srcW = 16, srcH = 9;
      if (active && isReady(active)) {
        if (active.tagName === 'VIDEO') {
          srcW = active.videoWidth || 16;
          srcH = active.videoHeight || 9;
        } else {
          srcW = active.naturalWidth || 16;
          srcH = active.naturalHeight || 9;
        }
      }
      var target = srcW / srcH;
      var view = (host.clientWidth || 1) / (host.clientHeight || 1);
      if (view > target) gl.uniform2f(U.uCover, view / target, 1.0);
      else gl.uniform2f(U.uCover, 1.0, target / view);
    }

    function upload() {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, active); } catch (e) { /* ignore */ }
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      resize();
      if (!active || !isReady(active)) return;

      if (active.tagName === 'VIDEO') {
        // klatka filmu — wgrywamy tylko gdy faktycznie się zmieniła
        if (playing && Math.abs(active.currentTime - lastTime) > 0.016) {
          lastTime = active.currentTime;
          upload();
        }
      } else if (needsUpload) {
        // zdjęcie — wystarczy raz
        needsUpload = false;
        upload();
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    raf = requestAnimationFrame(frame);

    var api = {
      setActive: function (i) {
        i = Math.max(0, Math.min(i, sources.length - 1));
        if (i === activeIndex) return;
        activeIndex = i;
        media.forEach(function (m) { if (m.tagName === 'VIDEO') m.pause(); });
        var el = getMedia(srcOf(sources[i]));
        active = el;
        lastTime = -1;
        needsUpload = true;
        if (el.tagName === 'VIDEO') {
          el.currentTime = 0;
          if (playing) el.play().catch(function () {});
        } else if (!isReady(el)) {
          el.addEventListener('load', function () { needsUpload = true; }, { once: true });
        }
      },
      setPlaying: function (p) {
        playing = p;
        if (!active || active.tagName !== 'VIDEO') return;
        p ? active.play().catch(function () {}) : active.pause();
      },
      destroy: function () {
        cancelAnimationFrame(raf);
        media.forEach(function (m) { if (m.tagName === 'VIDEO') { m.pause(); m.src = ''; } });
      }
    };

    // odblokowanie autoodtwarzania po pierwszej interakcji (polityka przeglądarek);
    // dotyczy wyłącznie filmów — aktywnym źródłem bywa też zwykłe zdjęcie
    var unlock = function () {
      document.querySelectorAll('video').forEach(function (v) {
        if (v.paused && v.muted) v.play().catch(function () {});
      });
      if (active && active.tagName === 'VIDEO') active.play().catch(function () {});
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });

    api.setActive(0);
    return api;
  }

  window.createBadTV = createBadTV;
})();

'use strict';
// Steam off the comal: one WebGL pass, up to 8 plumes from the newest pupusas (app.js sets window.__steam).
// A fresh pupusa puffs harder for a second. Half resolution, ~30 fps, only while the comal is on screen and the tab is visible.
// Reduced motion or ?t=<sec>: one still frame. No WebGL: the canvas is removed and the comal stands alone.
(() => {
  const c = document.querySelector('#comal .steam'); if (!c) return;
  const box = c.parentElement;
  const gl = c.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) { c.remove(); return; }
  const vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const fs = `precision mediump float;
uniform vec2 r;uniform float t;uniform float k;uniform vec4 s[8];
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
void main(){
 vec2 px=gl_FragCoord.xy;
 float a=0.;
 for(int i=0;i<8;i++){
  vec4 q=s[i]; if(q.w<.5) continue;
  float up=(px.y-q.y)/q.z;
  if(up<-.5||up>1.9) continue;
  float fi=float(i);
  float sway=sin(up*2.2+t*.5+fi*1.7)*.18*(up+.4);
  float dx=(px.x-q.x)/q.z-sway;
  float spread=.30+up*.24;
  float col=exp(-dx*dx/(spread*spread)*1.3);
  vec2 p=vec2(dx*2.+fi*3.1,up*2.2-t*.5);
  float w=fbm(p+vec2(fbm(p*1.3+t*.1),0.)*1.4);
  float puff=smoothstep(.36,.84,w);
  float life=smoothstep(-.1,.2,up)*exp(-up*1.5);
  a+=col*puff*life;
 }
 vec2 uv=px/r;
 a*=smoothstep(0.,.14,uv.x)*smoothstep(1.,.86,uv.x)*smoothstep(0.,.14,uv.y)*smoothstep(1.,.86,uv.y);
 a=clamp(a*k,0.,.38);
 gl_FragColor=vec4(vec3(.98,.97,.95)*a,a);
}`;
  const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { c.remove(); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(pr, 'r'), uT = gl.getUniformLocation(pr, 't'), uK = gl.getUniformLocation(pr, 'k'), uS = gl.getUniformLocation(pr, 's');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fixed = new URLSearchParams(location.search).get('t');
  const IDLE = [[.38, .44, .22], [.62, .52, .22], [.5, .66, .2]];   // a hot empty comal still shimmers a little
  let w = 0, ht = 0, sc = 1;
  const size = () => {
    const b = c.getBoundingClientRect(); sc = Math.min(devicePixelRatio || 1, 1.5) * .5;
    const nw = Math.max(1, Math.round(b.width * sc)), nh = Math.max(1, Math.round(b.height * sc));
    if (nw !== w || nh !== ht) { w = c.width = nw; ht = c.height = nh; gl.viewport(0, 0, w, ht); }
    return b;
  };
  const draw = (sec, now) => {
    const b = size(), H = b.height, st = window.__steam || { spots: [], base: .35, burst: 0 };
    const spots = st.spots.length ? st.spots : IDLE.map(([x, y, d]) => [x * b.width, y * b.height, d * b.width]);
    const src = new Float32Array(32);
    spots.slice(0, 8).forEach(([x, y, tw], i) => src.set([x * sc, (H - y) * sc, tw * sc * 1.1, 1], i * 4));
    const since = st.burst ? (now - st.burst) / 1000 : 9;
    const k = (st.spots.length ? .62 : .4) + (since < 1.4 ? (1.4 - since) * .8 : 0);
    gl.uniform2f(uR, w, ht); gl.uniform1f(uT, sec); gl.uniform1f(uK, k); gl.uniform4fv(uS, src); gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  let run = false, last = 0, onScreen = false; const t0 = performance.now();
  const still = () => draw(fixed ? +fixed : 20, performance.now());
  const frame = now => { if (!run) return; requestAnimationFrame(frame); if (now - last < 32) return; last = now; draw((now - t0) / 1000 + 20, now); };
  const start = () => { if (run || reduce || fixed || !onScreen || document.hidden) return; run = true; requestAnimationFrame(frame); };
  const stop = () => { run = false; };
  addEventListener('resize', () => { if (!run) still(); });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { onScreen = es[0].isIntersecting; onScreen ? start() : stop(); }).observe(box);
  else onScreen = true;
  if (reduce || fixed) { const redraw = () => still(); box.addEventListener('click', () => setTimeout(redraw, 50)); document.addEventListener('click', () => setTimeout(redraw, 50)); }
  still(); start();
})();

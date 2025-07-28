(function () {
    class WeatherEffect extends Autodesk.Viewing.Extension {
        constructor(v, o) {
            super(v, o);
            this.viewer = v;

            this.snowCount = 60; // 눈 알갯수 ↓
            this.rainCount = 70; // 비 알갯수 ↓

            this.snowSpeed = 1.2; // 눈은 천천히
            this.rainSpeed = 1.7; // 비는 빠르게

            this.snowActive = false;
            this.rainActive = false;
            this.onFrame = this.onFrame.bind(this);
        }

        /* ─────────────────────────────── 초기화 / 해제 ───────────────────────────── */

        load() {
            this.viewer.impl.createOverlayScene("weather");
            this.createSnow();
            this.createRain();
            this.viewer.addEventListener(Autodesk.Viewing.RENDER_PRESENTED_EVENT, this.onFrame);
            return true;
        }

        unload() {
            this.viewer.removeEventListener(Autodesk.Viewing.RENDER_PRESENTED_EVENT, this.onFrame);
            this.stopSnow();
            this.stopRain();
            return true;
        }

        /* ─────────────────────────────── 파티클 생성 ───────────────────────────── */

        createSnow() {
            const bb = this.viewer.model.getBoundingBox();
            const cx = (bb.min.x + bb.max.x) / 2;
            const cy = (bb.min.y + bb.max.y) / 2;
            const w = bb.max.x - bb.min.x;
            const d = bb.max.y - bb.min.y;
            const baseZ = bb.max.z + 50;
            const spawnH = (bb.max.z - bb.min.z) * 0.5;

            const pos = new Float32Array(this.snowCount * 3);
            for (let i = 0; i < this.snowCount; i++) {
                pos[3 * i] = cx + (Math.random() - 0.5) * w * 1.2;
                pos[3 * i + 1] = cy + (Math.random() - 0.5) * d * 1.2;
                pos[3 * i + 2] = baseZ + Math.random() * spawnH;
            }
            this.snowGeo = new THREE.BufferGeometry();
            this.snowGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

            const vs = `
        void main(){
          vec4 mvPos = modelViewMatrix * vec4(position,1.0);
          gl_Position = projectionMatrix * mvPos;
          gl_PointSize = 6.0;
        }`;
            const fs = `
        precision mediump float;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          if(length(uv) > .5) discard;
          gl_FragColor = vec4(1.,1.,1.,1.);
        }`;
            const mat = new THREE.ShaderMaterial({
                vertexShader: vs,
                fragmentShader: fs,
                transparent: true,
                depthWrite: false,
                depthTest: false,
            });
            this.snowPoints = new THREE.PointCloud(this.snowGeo, mat);
            this.snowPoints.frustumCulled = false;
        }

        createRain() {
            const bb = this.viewer.model.getBoundingBox();
            const cx = (bb.min.x + bb.max.x) / 2;
            const cy = (bb.min.y + bb.max.y) / 2;
            const w = bb.max.x - bb.min.x;
            const d = bb.max.y - bb.min.y;
            const baseZ = bb.max.z + 50;
            const spawnH = (bb.max.z - bb.min.z) * 0.5;

            const pos = new Float32Array(this.rainCount * 3);
            for (let i = 0; i < this.rainCount; i++) {
                pos[3 * i] = cx + (Math.random() - 0.5) * w * 1.2;
                pos[3 * i + 1] = cy + (Math.random() - 0.5) * d * 1.2;
                pos[3 * i + 2] = baseZ + Math.random() * spawnH;
            }
            this.rainGeo = new THREE.BufferGeometry();
            this.rainGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

            const vs = `
    void main() {
      vec4 mvPos = modelViewMatrix * vec4(position,1.0);
      gl_Position = projectionMatrix * mvPos;
      gl_PointSize = 10.0;
    }`;

            const fs = `
    precision mediump float;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      if (abs(uv.x) > 0.03) discard;   /* ← 폭 더더 좁게 */
      float fade = smoothstep(0.5, 0.4, abs(uv.y));
      gl_FragColor = vec4(0.6,0.7,1.0,fade);
    }`;
            const mat = new THREE.ShaderMaterial({
                vertexShader: vs,
                fragmentShader: fs,
                transparent: true,
                depthWrite: false,
                depthTest: false,
            });
            this.rainPoints = new THREE.PointCloud(this.rainGeo, mat);
            this.rainPoints.frustumCulled = false;
        }

        /* ─────────────────────────────── 애니메이션 ───────────────────────────── */

        onFrame() {
            const bb = this.viewer.model.getBoundingBox();
            const minZ = bb.min.z;
            const maxZ = bb.max.z + 50;

            if (this.snowActive) {
                const arr = this.snowGeo.attributes.position.array;
                for (let i = 0; i < this.snowCount; i++) {
                    const idx = 3 * i + 2; // Z 값
                    arr[idx] -= this.snowSpeed;
                    if (arr[idx] < minZ) arr[idx] = maxZ;
                }
                this.snowGeo.attributes.position.needsUpdate = true;
            }

            if (this.rainActive) {
                const arr = this.rainGeo.attributes.position.array;
                for (let i = 0; i < this.rainCount; i++) {
                    const idx = 3 * i + 2; // Z 값
                    arr[idx] -= this.rainSpeed;
                    if (arr[idx] < minZ) arr[idx] = maxZ;
                }
                this.rainGeo.attributes.position.needsUpdate = true;
            }

            if (this.snowActive || this.rainActive) this.viewer.impl.invalidate(true, true, true);
        }

        /* ─────────────────────────────── 토글 ───────────────────────────── */

        startSnow() {
            if (this.snowActive) return;
            this.viewer.impl.addOverlay("weather", this.snowPoints);
            this.snowActive = true;
        }
        stopSnow() {
            if (!this.snowActive) return;
            this.viewer.impl.removeOverlay("weather", this.snowPoints);
            this.snowActive = false;
        }

        startRain() {
            if (this.rainActive) return;
            this.viewer.impl.addOverlay("weather", this.rainPoints);
            this.rainActive = true;
        }
        stopRain() {
            if (!this.rainActive) return;
            this.viewer.impl.removeOverlay("weather", this.rainPoints);
            this.rainActive = false;
        }
    }

    Autodesk.Viewing.theExtensionManager.registerExtension("WeatherEffect", WeatherEffect);
})();

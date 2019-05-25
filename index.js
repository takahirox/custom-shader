import {
  Clock,
  FileLoader,
  Mesh,
  OrthographicCamera,
  PlaneBufferGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderer
} from 'three';

const vertexShaderCode = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

class CustomShader extends HTMLElement {
  connectedCallback() {
    this._getVRDevice().then(device => {
      this._loadShaderCode().then(code => {
        this._initialize(device, code);
      });
    });
  }

  _loadShaderCode() {
    const src = this.getAttribute('src') || '';
    return new Promise((resolve, reject) => {
      new FileLoader()
        .setResponseType('text')
        .load(src, resolve, undefined, reject);
    });
  }

  _initialize(device, fragmentShaderCode) {
    const hasDevice = device !== null;

    const shadow = this.attachShadow({mode: 'open'});

    const container = document.createElement('div');
    shadow.appendChild(container);

    const src = this.getAttribute('src') || '';
    const width = parseInt(this.getAttribute('width')) || 0;
    const height = parseInt(this.getAttribute('height')) || 0;

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new PlaneBufferGeometry(2, 2);

    const uniforms = {
      time: {value: 1.0}
    };

    const material = new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShaderCode,
      fragmentShader: fragmentShaderCode
    });

    const mesh = new Mesh(geometry, material);

    scene.add(mesh);

    const renderer = new WebGLRenderer({
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setAnimationLoop(render);

    container.appendChild(renderer.domElement);

    const clock = new Clock();

    function render() {
      material.uniforms.time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    }

    const button = document.createElement('button');
    button.textContent = hasDevice ? 'ENTER VR' : 'FULLSCREEN';
    button.style.display = '';
    button.style.cursor = 'pointer';
    button.style.left = '30px';
    button.style.width = '150px';
    button.style.position = 'absolute';
    button.style.top = '30px';
    button.style.padding = '12px 6px';
    button.style.border = '1px solid #fff';
    button.style.borderRadius = '4px';
    button.style.background = 'rgba(0,0,0,0.1)';
    button.style.color = '#fff';
    button.style.font = 'normal 13px sans-serif';
    button.style.textAlign = 'center';
    button.style.opacity = '0.5';
    button.style.outline = 'none';
    button.style.zIndex = '999';
    container.appendChild(button);

    button.addEventListener('mouseenter', event => {
      button.style.opacity = '1.0';
    }, false);

    button.addEventListener('mouseleave', event => {
      button.style.opacity = '0.5';
    }, false);

    if (hasDevice) {
      button.addEventListener('click', event => {
        if (device.isPresenting) {
          device.exitPresent();
        } else {
          device.requestPresent([{source: renderer.domElement}]);
        };
      }, false);

      window.addEventListener('vrdisplaypresentchange', event => {
        if (device.isPresenting) {
          button.textContent = 'EXIT VR';
          renderer.vr.enabled = true;
        } else {
          button.textContent = 'ENTER VR';
          renderer.vr.enabled = false;
        }
      }, false);

      renderer.vr.setDevice(device);
    } else {
      let isFullscreen = false;
      button.addEventListener('click', event => {
        if (isFullscreen) {
          document.exitFullscreen()
        } else {
          renderer.domElement.requestFullscreen();
        }
      }, false);

      window.addEventListener('fullscreenchange', event => {
        if (document.fullscreenElement) {
          camera.aspect = screen.width / screen.height;
          camera.updateProjectionMatrix();
          renderer.setSize(screen.width, screen.height);
          render();
        } else {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          render();
        }
      }, false);
    }
  }

  _getVRDevice() {
    if (!('getVRDisplays' in navigator)) {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      navigator.getVRDisplays().then(devices => {
        if (devices && devices.length > 0) {
          resolve(devices[0]);
        } else {
          resolve(null);
        }
      });
    });
  }
}

customElements.define('custom-shader', CustomShader);

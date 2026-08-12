let overlayExists = false;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'PING') {
    sendResponse({ pong: true });
    return false;
  }

  if (message.action === 'OPEN_SIGNATURE_OVERLAY') {
    if (!overlayExists) {
      createOverlay();
    }
  }
});

function createOverlay() {
  overlayExists = true;

  const overlay = document.createElement('div');

  overlay.id = 'signature-overlay';

  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '2147483647',
    background: 'rgba(255,255,255,0.01)',
    cursor: 'crosshair'
  });

  overlay.innerHTML = `
    <canvas
      id="signature-canvas"
      width="${window.innerWidth}"
      height="${window.innerHeight}"
      style="
        width:100%;
        height:100%;
        touch-action:none;
      "
    ></canvas>

    <div
      style="
        position:fixed;
        top:20px;
        right:20px;
        display:flex;
        gap:10px;
        z-index:2147483647;
      "
    >
      <button id="clear-signature">
        Clear
      </button>

      <button id="finish-signature">
        Use Signature
      </button>

      <button id="cancel-signature">
        Cancel
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const canvas =
    document.getElementById(
      'signature-canvas'
    );

  const ctx = canvas.getContext('2d');

  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';

  let drawing = false;

  function getPos(e) {
    if (e.touches) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }

    return {
      x: e.clientX,
      y: e.clientY
    };
  }

  function startDraw(e) {
    drawing = true;

    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!drawing) return;

    e.preventDefault();

    const pos = getPos(e);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDraw() {
    drawing = false;
  }

  canvas.addEventListener(
    'mousedown',
    startDraw
  );

  canvas.addEventListener(
    'mousemove',
    draw
  );

  canvas.addEventListener(
    'mouseup',
    stopDraw
  );

  canvas.addEventListener(
    'mouseleave',
    stopDraw
  );

  canvas.addEventListener(
    'touchstart',
    startDraw
  );

  canvas.addEventListener(
    'touchmove',
    draw
  );

  canvas.addEventListener(
    'touchend',
    stopDraw
  );

  document
    .getElementById(
      'clear-signature'
    )
    .addEventListener(
      'click',
      () => {
        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
    );

  document
    .getElementById(
      'cancel-signature'
    )
    .addEventListener(
      'click',
      () => {
        overlay.remove();
        overlayExists = false;
      }
    );

  document
    .getElementById(
      'finish-signature'
    )
    .addEventListener(
      'click',
      () => {
        const signatureDataUrl =
          canvas.toDataURL('image/png');

        overlay.remove();

        overlayExists = false;

        enablePlacementMode(
          signatureDataUrl
        );
      }
    );
}

function enablePlacementMode(signatureDataUrl) {
  alert('Click the signature field.');

  function placeSignature(e) {
    e.preventDefault();
    e.stopPropagation();

    let target = e.target;

    if (
      target.classList &&
      target.classList.contains(
        'signature-pad-wrapper'
      )
    ) {
      target =
        target.querySelector('canvas');
    }

    if (
      target.tagName !== 'CANVAS'
    ) {
      const nestedCanvas =
        target.querySelector?.(
          'canvas'
        );

      if (nestedCanvas) {
        target = nestedCanvas;
      }
    }

    if (
      !target ||
      target.tagName !== 'CANVAS'
    ) {
      alert(
        'No signature canvas found.'
      );

      cleanup();
      return;
    }

    const ctx = target.getContext('2d');

    const img = new Image();

    img.onload = () => {
      ctx.clearRect(
        0,
        0,
        target.width,
        target.height
      );

      const padding = 10;

      const drawWidth =
        target.width - padding * 2;

      const aspectRatio =
        img.width / img.height;

      const drawHeight =
        drawWidth / aspectRatio;

      const y =
        (target.height - drawHeight) / 2;

      ctx.drawImage(
        img,
        padding,
        y,
        drawWidth,
        drawHeight
      );

      [
        'mousedown',
        'mousemove',
        'mouseup',
        'input',
        'change'
      ].forEach((eventType) => {
        target.dispatchEvent(
          new Event(eventType, {
            bubbles: true
          })
        );
      });

      cleanup();
    };

    img.src = signatureDataUrl;
  }

  function cleanup() {
    document.removeEventListener(
      'click',
      placeSignature,
      true
    );
  }

  document.addEventListener(
    'click',
    placeSignature,
    true
  );
}
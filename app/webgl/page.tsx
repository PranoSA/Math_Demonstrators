'use client';

import { useEffect, useRef } from 'react';

const TubeVisualization = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Set the viewport to match the canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Vertex shader program
    const vsSource = `
      attribute vec4 aVertexPosition;
      attribute float aPressure;
      varying float vPressure;
      void main(void) {
        gl_Position = aVertexPosition;
        vPressure = aPressure;
      }
    `;

    // Fragment shader program
    const fsSource = `
      precision mediump float;
      varying float vPressure;
      void main(void) {
        float pressureRatio = vPressure / 10.0;
        gl_FragColor = vec4(0.0, 0.0, pressureRatio, 1.0); // Corrected Blue gradient
      }
    `;

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram!, 'aVertexPosition'),
        pressure: gl.getAttribLocation(shaderProgram!, 'aPressure'),
      },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl);

    // Draw the scene
    drawScene(gl, programInfo, buffers);
  }, []);

  return (
    <div style={{ backgroundColor: 'white', padding: '20px' }}>
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ display: 'block', margin: '0 auto' }}
      />
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div
          style={{
            display: 'inline-block',
            width: '300px',
            height: '20px',
            background: 'linear-gradient(to right, lightblue, blue)',
          }}
        ></div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '300px',
            margin: '0 auto',
          }}
        >
          <span>0</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
};

// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional tube.
function initBuffers(gl: WebGLRenderingContext) {
  // Create a buffer for the tube's positions.
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Define the positions for the tube
  const positions = [
    // Inlet
    -0.9, 0.5, -0.9, -0.5,
    // Throat
    -0.3, 0.2, -0.3, -0.2,
    // Outlet
    0.9, 0.5, 0.9, -0.5,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Create a buffer for the pressures.
  const pressureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pressureBuffer);

  // Define the pressures for the tube
  const pressures = [
    10.0,
    10.0, // Inlet
    2.0,
    2.0, // Throat
    10.0,
    10.0, // Outlet
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pressures), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    pressure: pressureBuffer,
  };
}

function drawScene(gl: WebGLRenderingContext, programInfo: any, buffers: any) {
  // Clear the canvas before we start drawing on it.
  gl.clearColor(1.0, 1.0, 1.0, 1.0); // Clear to white, fully opaque
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the pressures from the pressure
  // buffer into the pressure attribute.
  {
    const numComponents = 1; // pull out 1 value per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pressure);
    gl.vertexAttribPointer(
      programInfo.attribLocations.pressure,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.pressure);
  }

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Draw the tube
  {
    const offset = 0;
    const vertexCount = 6;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

function initShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  if (!shaderProgram || !vertexShader || !fragmentShader) {
    return null;
  }

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      'Unable to initialize the shader program: ' +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
}

function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  if (!shader) {
    return null;
  }

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      'An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export default TubeVisualization;

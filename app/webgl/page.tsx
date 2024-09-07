'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import p5.js to avoid SSR issues
const Sketch = dynamic(() => import('react-p5'), { ssr: false });

type Obstacle = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  size: number;
};

const ProjectileSimulation = () => {
  const [angle, setAngle] = useState(45);
  const [weight, setWeight] = useState(1);
  const [area, setArea] = useState(0.01);
  const [initSpeed, setInitSpeed] = useState(100); // Increased initial speed
  const [play, setPlay] = useState(false);
  const [zoom, setZoom] = useState(0.5); // Adjusted zoom level
  const [obstacle, setObstacle] = useState<null | Obstacle>(null); // State for obstacle

  const density = 1.225; // kg/m^3 (air density at sea level)
  const dragCoefficient = 0.47; // Approximate for a sphere

  let velocityX = 0;
  let velocityY = 0;
  let positionX = 0;
  let positionY = 0;

  let velocityXNoDrag = 0;
  let velocityYNoDrag = 0;
  let positionXNoDrag = 0;
  let positionYNoDrag = 0;

  positionX = 50 + 50 * Math.cos((angle * Math.PI) / 180); // Starting position X at the end of the barrel
  positionY = 50 - 50 * Math.sin((angle * Math.PI) / 180); // Starting position Y at the end of the barrel
  positionXNoDrag = positionX;
  positionYNoDrag = positionY;

  let pathWithDrag: number[][] = [];
  let pathNoDrag: number[][] = [];

  useEffect(() => {
    if (play) {
      // Generate a random obstacle when play is clicked
      const obstacleX = Math.random() * 600 + 100;
      const obstacleY = Math.random() * 400 + 100;
      setObstacle({ x: obstacleX, y: obstacleY, size: 100 });
    }
  }, [play]);

  const setup = (
    p5: {
      createCanvas: (
        arg0: number,
        arg1: number
      ) => { (): any; new (): any; parent: { (arg0: any): void; new (): any } };
    },
    canvasParentRef: any
  ) => {
    p5.createCanvas(800, 600).parent(canvasParentRef);
    resetSimulation();
  };

  const drawGrid = (p5: {
    stroke: (arg0: number) => void;
    strokeWeight: (arg0: number) => void;
    width: number;
    line: (arg0: number, arg1: number, arg2: number, arg3: number) => void;
    height: number;
    text: (arg0: number, arg1: number, arg2: number) => void;
  }) => {
    p5.stroke(200);
    p5.strokeWeight(1);
    for (let x = 0; x <= p5.width; x += 50) {
      p5.line(x, 0, x, p5.height);
      p5.text(x, x + 5, 15);
    }
    for (let y = 0; y <= p5.height; y += 50) {
      p5.line(0, y, p5.width, y);
      p5.text(y, 5, y - 5);
    }
  };

  const displayMouseCoordinates = (p5: any) => {
    const x = p5.mouseX;
    const y = p5.mouseY;
    console.log('x: ', x, 'y: ', y);
    p5.fill(0);
    p5.noStroke();
    p5.textSize(12);
    p5.text(`(${x}, ${y})`, 10, p5.height - 10);
    console.log('x: ', x, 'y: ', y);
  };

  const draw = (p5: any) => {
    p5.background(255);
    console.log('Drawing');
    drawGrid(p5);
    displayMouseCoordinates(p5);

    // Translate to the bottom-left corner and apply zoom
    p5.translate(0, p5.height);
    p5.scale(zoom, -zoom); // Negative scale for y-axis to keep the origin at the bottom-left
    drawGrid(p5);
    // Draw the cannon
    p5.push();
    p5.translate(50, -p5.height + 50); // Move to the cannon's base position (adjusted for scaling)
    p5.rotate(-angle * (Math.PI / 180)); // Rotate to the firing angle
    p5.rect(0, -10, 50, 20); // Draw the cannon barrel
    p5.pop();
    displayMouseCoordinates(p5);

    if (play) {
      const dt = 0.03; // Time step
      const g = 9.81; // Gravity
      displayMouseCoordinates(p5);

      // Calculate air resistance
      const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      const dragForce = 0.5 * density * speed * speed * dragCoefficient * area;
      const dragForceX = (dragForce * velocityX) / speed;
      const dragForceY = (dragForce * velocityY) / speed;

      // Update velocities with drag
      velocityX -= (dragForceX / weight) * dt;
      velocityY -= (g + dragForceY / weight) * dt;

      // Update positions with drag
      positionX += velocityX * dt;
      positionY -= velocityY * dt; // Subtract because p5's y-axis is inverted

      // Update velocities without drag
      velocityXNoDrag = velocityXNoDrag;
      velocityYNoDrag -= g * dt;

      // Update positions without drag
      positionXNoDrag += velocityXNoDrag * dt;
      positionYNoDrag -= velocityYNoDrag * dt; // Subtract because p5's y-axis is inverted

      // Store paths
      pathWithDrag.push([positionX, positionY]);
      pathNoDrag.push([positionXNoDrag, positionYNoDrag]);

      // Stop simulation if projectile hits the ground
      if (positionY >= 550 || positionYNoDrag >= 550) {
        setPlay(false);
      }

      // Check for collision with obstacle
      if (obstacle) {
        const distToObstacle = Math.sqrt(
          (positionX - obstacle.x) ** 2 + (positionY - obstacle.y) ** 2
        );
        if (distToObstacle < obstacle.size / 2 + 10) {
          // Bounce off the obstacle
          velocityX = -velocityX;
          velocityY = -velocityY;
          alert('bounced off');
        }
      }
    }

    // Draw the obstacle
    if (obstacle) {
      p5.fill(100);
      p5.rect(
        obstacle.x - obstacle.size / 2,
        -obstacle.y - obstacle.size / 2,
        obstacle.size,
        obstacle.size
      );
    }

    // Draw the projectile with drag
    p5.fill(0);
    p5.ellipse(positionX, -positionY, 20, 20); // Adjust for scaling and larger size

    // Draw the projectile without drag
    p5.fill(255, 0, 0);
    p5.ellipse(positionXNoDrag, -positionYNoDrag, 20, 20); // Adjust for scaling and larger size

    // Draw paths
    p5.stroke(0);
    p5.strokeWeight(1);
    p5.drawingContext.setLineDash([5, 5]); // Dotted line

    // Draw path with drag
    for (let i = 1; i < pathWithDrag.length; i++) {
      p5.line(
        pathWithDrag[i - 1][0],
        -pathWithDrag[i - 1][1],
        pathWithDrag[i][0],
        -pathWithDrag[i][1]
      );
    }

    p5.stroke(255, 0, 0);
    p5.drawingContext.setLineDash([5, 5]); // Dotted line

    // Draw path without drag
    for (let i = 1; i < pathNoDrag.length; i++) {
      p5.line(
        pathNoDrag[i - 1][0],
        -pathNoDrag[i - 1][1],
        pathNoDrag[i][0],
        -pathNoDrag[i][1]
      );
    }
  };

  const resetSimulation = () => {
    velocityX = initSpeed * Math.cos((angle * Math.PI) / 180);
    velocityY = initSpeed * Math.sin((angle * Math.PI) / 180);
    positionX = 50 + 50 * Math.cos((angle * Math.PI) / 180); // Starting position X at the end of the barrel
    positionY = 550 - 50 * Math.sin((angle * Math.PI) / 180); // Starting position Y at the end of the barrel

    velocityXNoDrag = velocityX;
    velocityYNoDrag = velocityY;
    positionXNoDrag = positionX;
    positionYNoDrag = positionY;

    pathWithDrag = [];
    pathNoDrag = [];
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex flex-col items-center space-y-2">
        <label className="flex flex-col items-center">
          Angle (degrees):
          <input
            type="number"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="border rounded p-1"
          />
        </label>
        <label className="flex flex-col items-center">
          Weight (kg):
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="border rounded p-1"
          />
        </label>
        <label className="flex flex-col items-center">
          Cross-sectional Area (m^2):
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(Number(e.target.value))}
            className="border rounded p-1"
          />
        </label>
        <label className="flex flex-col items-center">
          Initial Speed (m/s):
          <input
            type="number"
            value={initSpeed}
            onChange={(e) => setInitSpeed(Number(e.target.value))}
            className="border rounded p-1"
          />
        </label>
        <label className="flex flex-col items-center">
          Zoom:
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              resetSimulation();
              setPlay(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Play
          </button>
          <button
            onClick={() => setPlay(false)}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Pause
          </button>
        </div>
      </div>
      {/*@ts-ignore*/}
      <Sketch setup={setup} draw={draw} />
    </div>
  );
};

export default ProjectileSimulation;

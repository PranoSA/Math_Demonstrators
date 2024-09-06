'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamically import p5.js to avoid SSR issues
const Sketch = dynamic(() => import('react-p5'), { ssr: false });

const ProjectileSimulation = () => {
  const [angle, setAngle] = useState(45);
  const [weight, setWeight] = useState(1);
  const [area, setArea] = useState(0.01);
  const [play, setPlay] = useState(false);
  const [initSpeed, setInitSpeed] = useState(50);

  const density = 1.225; // kg/m^3 (air density at sea level)
  const dragCoefficient = 0.02; // Approximate for a sphere

  let velocityX = 0;
  let velocityY = 0;
  let positionX = 0;
  let positionY = 0;

  let velocityXNoDrag = 0;
  let velocityYNoDrag = 0;
  let positionXNoDrag = 0;
  let positionYNoDrag = 0;

  let pathWithDrag: number[][] = [];
  let pathNoDrag: number[][] = [];

  velocityX = Math.cos((angle * Math.PI) / 180) * 100;
  velocityY = Math.sin((angle * Math.PI) / 180) * 100;

  const resetVelocities = () => {
    velocityX = Math.cos((angle * Math.PI) / 180) * initSpeed;
    velocityY = Math.sin((angle * Math.PI) / 180) * initSpeed;
    velocityXNoDrag = velocityX;
    velocityYNoDrag = velocityY;
  };

  const setup = (
    p5: import('/home/pranosaurus/projects/Math_Visualizers/client/node_modules/@types/p5/index.d.ts'),
    canvasParentRef: any
  ) => {
    p5.createCanvas(800, 600).parent(canvasParentRef);
    resetSimulation();
  };

  const draw = (
    p5: import('/home/pranosaurus/projects/Math_Visualizers/client/node_modules/@types/p5/index.d.ts')
  ) => {
    p5.background(255);
    //p5.scale(0.1); // Invert the y-axis
    p5.scale(0.1, 0.1);
    // Draw the cannon
    p5.push();
    p5.translate(50, 550); // Move to the cannon's base position
    p5.rotate(-angle * (Math.PI / 180)); // Rotate to the firing angle
    p5.rect(0, -10, 50, 20); // Draw the cannon barrel
    p5.pop();
    //p5.scale(0.01);

    if (play) {
      const dt = 0.03; // Time step
      const g = 9.81; // Gravity
      // Draw paths
      p5.stroke(0);
      p5.strokeWeight(1);
      p5.drawingContext.setLineDash([5, 5]); // Dotted line

      // Draw a random dashed line from bottom left to upper right corner
      p5.line(0, p5.height, p5.width, 0);

      // Calculate air resistance
      const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      const dragForce = 0.5 * density * speed * speed * dragCoefficient * area;
      const dragForceX = (dragForce * velocityX) / speed;
      const dragForceY = (dragForce * velocityY) / speed;

      // Update velocities with drag
      velocityX -= (dragForceX / weight) * dt;
      velocityY -= (g + dragForceY / weight) * dt;

      console.log('Velocity X: ', velocityX);
      console.log('Velocity Y: ', velocityY);

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

      // Draw the projectile with drag
      p5.fill(0);
      p5.ellipse(positionX, positionY, 10, 190);

      // Draw the projectile without drag
      p5.fill(255, 0, 0);
      p5.ellipse(positionXNoDrag, positionYNoDrag, 10, 190);

      // Draw paths
      p5.stroke(0);
      p5.strokeWeight(1);
      p5.drawingContext.setLineDash([5, 5]); // Dotted line
      if (positionY >= 550 || positionYNoDrag >= 550) {
        setPlay(false);
      }

      // Draw the projectile with drag
      // p5.fill(0);
      //p5.ellipse(positionX, positionY, 10, 10);

      // Draw the projectile without drag
      //p5.fill(255, 0, 0);
      //p5.ellipse(positionXNoDrag, positionYNoDrag, 10, 10);

      // Draw paths
      p5.stroke(0);
      p5.strokeWeight(1);
      p5.drawingContext.setLineDash([5, 5]); // Dotted line

      // Draw path with drag
      for (let i = 1; i < pathWithDrag.length; i++) {
        p5.line(
          pathWithDrag[i - 1][0],
          pathWithDrag[i - 1][1],
          pathWithDrag[i][0],
          pathWithDrag[i][1]
        );
      }

      p5.stroke(255, 0, 0);
      p5.drawingContext.setLineDash([5, 5]); // Dotted line

      // Draw path without drag
      for (let i = 1; i < pathNoDrag.length; i++) {
        p5.line(
          pathNoDrag[i - 1][0],
          pathNoDrag[i - 1][1],
          pathNoDrag[i][0],
          pathNoDrag[i][1]
        );
      }
      /*
      for (let i = 0; i < pathWithDrag.length; i++) {
        p5.vertex(pathWithDrag[i][0], pathWithDrag[i][1]);
      }

      p5.endShape();
      /*
      p5.stroke(255, 0, 0);
      p5.noFill(); // Ensure no fill for the shape
      p5.beginShape();
      for (let i = 0; i < pathNoDrag.length; i++) {
        p5.vertex(pathNoDrag[i][0], pathNoDrag[i][1]);
      }
      p5.endShape();*/
      //p5.endShape();
    }

    // Draw the projectile with drag
    p5.fill(0);
    p5.ellipse(positionX, positionY, 10, 10);

    // Draw the projectile without drag
    p5.fill(255, 0, 0);
    p5.ellipse(positionXNoDrag, positionYNoDrag, 10, 10);

    // Draw paths
    /*  p5.stroke(0);
    p5.strokeWeight(1);
    p5.drawingContext.setLineDash([5, 5]); // Dotted line
    p5.beginShape();
    for (let i = 0; i < pathWithDrag.length; i++) {
      p5.vertex(pathWithDrag[i][0], pathWithDrag[i][1]);
    }
    p5.endShape();

    p5.stroke(255, 0, 0);
    p5.beginShape();
    for (let i = 0; i < pathNoDrag.length; i++) {
      p5.vertex(pathNoDrag[i][0], pathNoDrag[i][1]);
    }
    p5.endShape();
    */
  };

  const resetSimulation = () => {
    const initialSpeed = 50; // Initial speed in m/s
    velocityX = initialSpeed * Math.cos((angle * Math.PI) / 180);
    velocityY = initialSpeed * Math.sin((angle * Math.PI) / 180);
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
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <label>
          Angle (degrees):
          <input
            type="number"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
          />
        </label>
        <label>
          Weight (kg):
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
        </label>
        <label>
          Cross-sectional Area (m^2):
          <input
            type="number"
            value={area}
            onChange={(e) => setArea(Number(e.target.value))}
          />
        </label>
        <label>
          Initial Speed (m/s):
          <input
            type="number"
            value={initSpeed}
            onChange={(e) => setInitSpeed(Number(e.target.value))}
          />
        </label>
        <button
          onClick={() => {
            resetSimulation();
            resetVelocities();
            setPlay(true);
          }}
        >
          Play
        </button>
        <button onClick={() => setPlay(false)}>Pause</button>
      </div>
      {/*@ts-ignore*/}
      <Sketch setup={setup} draw={draw} />
    </div>
  );
};

export default ProjectileSimulation;

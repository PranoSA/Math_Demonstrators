'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';

// Dynamically import p5.js to avoid SSR issues
const Sketch = dynamic(() => import('react-p5'), { ssr: false });

type Obstacle = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  size: number;
};

// Define the structure of a projectile
type Projectile = {
  velocityX: number;
  velocityY: number;
  positionX: number;
  positionY: number;
  velocityXNoDrag: number;
  velocityYNoDrag: number;
  positionXNoDrag: number;
  positionYNoDrag: number;
  velocityRocketX: number;
  velocityRocketY: number;
  rocketProjectileX: number;
  rocketProjectileY: number;
  pathWithDrag: number[][];
  pathNoDrag: number[][];
  pathRocket: number[][];
  type?:
    | 'rocket'
    | 'cannon'
    | 'super rocket'
    | 'super cannon'
    | 'cluster'
    | 'super cluster'
    | 'deep penetration'
    | 'super deep penetration'
    | 'super cluster deep penetration'
    | 'air launched';
};
const ProjectileSimulation = () => {
  const [angle, setAngle] = useState(45);
  const [weight, setWeight] = useState(1000);
  const [area, setArea] = useState(1);
  const [initSpeed, setInitSpeed] = useState(100); // Increased initial speed
  const [play, setPlay] = useState(false);
  const [zoom, setZoom] = useState(0.5); // Adjusted zoom level
  const [obstacle, setObstacle] = useState<null | Obstacle>(null); // State for obstacle

  const density = 1.225; // kg/m^3 (air density at sea level)
  const dragCoefficient = 0.1; // Approximate for a sphere
  const projectiles = useRef<Projectile[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  let velocityX = 0;
  let velocityY = 0;
  let positionX = 0;
  let positionY = 0;

  let velocityXNoDrag = 0;
  let velocityYNoDrag = 0;
  let positionXNoDrag = 0;
  let positionYNoDrag = 0;
  let velocityRocketX = 0;
  let velocityRocketY = 0;

  let rocketProjectileX = 0;
  let rocketProjectileY = 0;

  positionX = 50 + 50 * Math.cos((angle * Math.PI) / 180); // Starting position X at the end of the barrel
  positionY = 50 - 50 * Math.sin((angle * Math.PI) / 180); // Starting position Y at the end of the barrel
  positionXNoDrag = positionX;
  positionYNoDrag = positionY;
  rocketProjectileX = positionX;
  rocketProjectileY = positionY;

  velocityX = initSpeed * Math.cos((angle * Math.PI) / 180);
  velocityY = initSpeed * Math.sin((angle * Math.PI) / 180);
  velocityXNoDrag = velocityX;
  velocityYNoDrag = velocityY;
  velocityRocketX = velocityX;
  velocityRocketY = velocityY;

  let pathWithDrag: number[][] = [];
  let pathNoDrag: number[][] = [];
  let pathRocket: number[][] = [];

  const initializeLaunch = () => {
    velocityX = initSpeed * Math.cos((angle * Math.PI) / 180);
    velocityY = initSpeed * Math.sin((angle * Math.PI) / 180);
    positionX = 50 + 50 * Math.cos((angle * Math.PI) / 180); // Starting position X at the end of the barrel
    positionY = 50 - 50 * Math.sin((angle * Math.PI) / 180); // Starting position Y at the end of the barrel
    velocityXNoDrag = velocityX;
    velocityYNoDrag = velocityY;
    positionXNoDrag = positionX;
    positionYNoDrag = positionY;
    pathWithDrag = [];
    pathNoDrag = [];

    //add projectile
    projectiles.current.push({
      velocityX,
      velocityY,
      positionX,
      positionY,
      velocityXNoDrag,
      velocityYNoDrag,
      positionXNoDrag,
      positionYNoDrag,
      velocityRocketX,
      velocityRocketY,
      rocketProjectileX,
      rocketProjectileY,
      pathWithDrag,
      pathNoDrag,
      pathRocket,
    });
  };

  const calculateAirDensity = (elevation: number) => {
    const seaLevelDensity = 1.225; // kg/m^3 (air density at sea level)
    const scaleHeight = 8500; // Scale height for Earth's atmosphere in meters

    if (elevation > 0) {
      // Calculate air density using the barometric formula
      const airDensity = seaLevelDensity * Math.exp(-elevation / scaleHeight);
      return airDensity;
    } else {
      return seaLevelDensity;
    }
  };

  let time_elapsed = 0;

  const keyPressed = (p5: any) => {
    //setPlay(false);
    console.log('Key pressed' + p5.keyCode);
    if (p5.keyCode === p5.ENTER) {
      console.log('Launching from ENTER');
      setPlay(true);
      //add projectile
      initializeLaunch();
    }
    if (p5.keyCode === p5.SPACE) {
      setPlay(false);
    }

    if (p5.keyCode === p5.LEFT_ARROW) {
      setAngle((prevAngle) => Math.min(prevAngle + 1, 90));
    } else if (p5.keyCode === p5.RIGHT_ARROW) {
      setAngle((prevAngle) => Math.max(prevAngle - 1, 0));
    } else if (p5.keyCode === p5.UP_ARROW) {
      setInitSpeed((prevSpeed) => prevSpeed + 1);
    } else if (p5.keyCode === p5.DOWN_ARROW) {
      setInitSpeed((prevSpeed) => Math.max(prevSpeed - 1, 0));
    } else if (p5.keyCode === p5.ENTER || p5.key === p5.SPACE) {
      resetSimulation();
      setPlay(true);
    }
  };

  const dt = 0.15; // Time step
  const g = 9.81; // Gravity

  const updateProjectiles = (p5: any) => {
    projectiles.current.forEach((projectile) => {
      // Calculate air resistance
      const speed = Math.sqrt(
        projectile.velocityX * projectile.velocityX +
          projectile.velocityY * projectile.velocityY
      );

      const dragForce = 0.5 * density * speed * speed * dragCoefficient * area;

      const angle_of_motion = Math.atan2(
        projectile.velocityY,
        projectile.velocityX
      );

      // Calculate drag forces
      const dragForceX = dragForce * Math.cos(angle_of_motion);
      const dragForceY = dragForce * Math.sin(angle_of_motion);

      const rocket_angle_of_motion = Math.atan2(
        projectile.velocityRocketY,
        projectile.velocityRocketX
      );

      let rocket_power_x = 30 * Math.cos(rocket_angle_of_motion);
      let rocket_power_y = 30 * Math.sin(rocket_angle_of_motion);

      if (time_elapsed > 3) {
        rocket_power_x = 0;
        rocket_power_y = 0;
      }

      time_elapsed += dt;

      const rocket_speed = Math.sqrt(
        projectile.velocityRocketX * projectile.velocityRocketX +
          projectile.velocityRocketY * projectile.velocityRocketY
      );
      const drag_rocket_force =
        0.5 * density * rocket_speed * rocket_speed * dragCoefficient * area;
      const drag_rocket_force_x =
        drag_rocket_force * Math.cos(rocket_angle_of_motion);
      const drag_rocket_force_y =
        drag_rocket_force * Math.sin(rocket_angle_of_motion);

      // Update velocities with drag
      projectile.velocityX -= (dragForceX / weight) * dt;
      projectile.velocityY -= (g + dragForceY / weight) * dt;

      // Update positions with drag
      projectile.positionX += projectile.velocityX * dt;
      projectile.positionY += projectile.velocityY * dt; // Subtract because p5's y-axis is inverted

      // Update positions without drag
      projectile.velocityXNoDrag = projectile.velocityXNoDrag;
      projectile.velocityYNoDrag -= g * dt;
      projectile.positionXNoDrag += projectile.velocityXNoDrag * dt;
      projectile.positionYNoDrag += projectile.velocityYNoDrag * dt; // Subtract because p5's y-axis is inverted

      // Update velocity of the rocket
      projectile.velocityRocketX +=
        rocket_power_x * dt - (drag_rocket_force_x / weight) * dt;
      projectile.velocityRocketY +=
        rocket_power_y * dt - (g + drag_rocket_force_y / weight) * dt;

      // Update the rocket position
      projectile.rocketProjectileX += projectile.velocityRocketX * dt;
      projectile.rocketProjectileY += projectile.velocityRocketY * dt;

      // Store paths
      projectile.pathWithDrag.push([
        projectile.positionX,
        projectile.positionY,
      ]);
      projectile.pathNoDrag.push([
        projectile.positionXNoDrag,
        projectile.positionYNoDrag,
      ]);
      projectile.pathRocket.push([
        projectile.rocketProjectileX,
        projectile.rocketProjectileY,
      ]);

      // Stop simulation if both projectile hits the ground
      if (
        projectile.positionY <= 0 &&
        projectile.positionYNoDrag <= 0 &&
        (projectile.rocketProjectileY <= 0 ||
          projectile.rocketProjectileX >= 20000)
      ) {
        //setPlay(false);
        //remove the projectile from the list
        const index = projectiles.current.indexOf(projectile);
        // don't mindleslly leave it out the preceeding projectile
        const projectiles_before = projectiles.current.slice(0, index);
        const projectiles_after = projectiles.current.slice(index + 1);
        projectiles.current = [...projectiles_before, ...projectiles_after];
      }

      // Check for collision with obstacle
      if (obstacle) {
        const distToObstacle = Math.sqrt(
          (projectile.positionX - obstacle.x) ** 2 +
            (projectile.positionY - obstacle.y) ** 2
        );
        if (distToObstacle < obstacle.size / 2 + 10) {
          // Bounce off the obstacle
          projectile.velocityX = -projectile.velocityX;
          projectile.velocityY = -projectile.velocityY;
          alert('bounced off');
        }
      }

      // Draw the projectile with drag if it is in the air
      p5.fill(0);
      if (projectile.positionX > 0 && projectile.positionY > 0) {
        p5.circle(projectile.positionX, projectile.positionY, 200); // Adjust for scaling and larger size
      }

      // Draw the projectile without drag if it is in the air
      p5.fill(255, 0, 0);
      if (projectile.positionXNoDrag > 0 && projectile.positionYNoDrag > 0) {
        p5.circle(projectile.positionXNoDrag, projectile.positionYNoDrag, 200); // Adjust for scaling and larger size
      }

      // Draw the rocket if it is in the air
      p5.fill(0, 255, 0);
      if (
        projectile.rocketProjectileX > 0 &&
        projectile.rocketProjectileY > 0
      ) {
        p5.circle(
          projectile.rocketProjectileX,
          projectile.rocketProjectileY,
          200
        ); // Adjust for scaling and larger size
      }

      // Draw paths
      p5.stroke(0);
      p5.strokeWeight(4);
      p5.drawingContext.setLineDash([5, 5]); // Dotted line

      // Draw path with drag
      for (let i = 1; i < projectile.pathWithDrag.length; i++) {
        p5.line(
          projectile.pathWithDrag[i - 1][0],
          projectile.pathWithDrag[i - 1][1],
          projectile.pathWithDrag[i][0],
          projectile.pathWithDrag[i][1]
        );
      }

      p5.stroke(255, 0, 0);

      // Draw path without drag
      for (let i = 1; i < projectile.pathNoDrag.length; i++) {
        p5.line(
          projectile.pathNoDrag[i - 1][0],
          projectile.pathNoDrag[i - 1][1],
          projectile.pathNoDrag[i][0],
          projectile.pathNoDrag[i][1]
        );
      }

      // Draw path for the rocket
      p5.stroke(0, 255, 0);
      p5.strokeWeight(4);
      p5.drawingContext.setLineDash([5, 5]); // Dotted line
      for (let i = 1; i < projectile.pathRocket.length; i++) {
        p5.line(
          projectile.pathRocket[i - 1][0],
          projectile.pathRocket[i - 1][1],
          projectile.pathRocket[i][0],
          projectile.pathRocket[i][1]
        );
      }
    });
  };

  useEffect(() => {
    if (!play) {
      //reset positions
      positionX = 50 + 50 * Math.cos((angle * Math.PI) / 180); // Starting position X at the end of the barrel
      positionY = 50 - 50 * Math.sin((angle * Math.PI) / 180); // Starting position Y at the end of the barrel
      velocityX = initSpeed * Math.cos((angle * Math.PI) / 180);
      velocityY = initSpeed * Math.sin((angle * Math.PI) / 180);

      // Generate a random obstacle when play is clicked
      const obstacleX = Math.random() * 8000;
      const obstacleY = Math.random() * 6000;
      setObstacle({ x: obstacleX, y: obstacleY, size: 100 });
    }
  }, [play]);

  const setup = (
    p5: {
      createCanvas: (
        arg0: number,
        arg1: number
      ) => { (): any; new (): any; parent: { (arg0: any): void; new (): any } };
      frameRate: (arg0: number) => void; // Add frameRate property
    },
    canvasParentRef: any
  ) => {
    p5.createCanvas(1200, 1200).parent(canvasParentRef);
    p5.frameRate(120);
    resetSimulation();
  };

  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Use useRef for interval

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
      }

      const interval_period = 10;

      //setPlay(false);

      if (intervalRef.current) return; // Prevent multiple intervals

      if (event.key === 'ArrowLeft') {
        intervalRef.current = setInterval(() => {
          setPlay(false);
          setAngle((prevAngle) => Math.min(prevAngle + 1, 90));
        }, interval_period * 10);
      } else if (event.key === 'ArrowRight') {
        intervalRef.current = setInterval(() => {
          setPlay(false);
          setAngle((prevAngle) => Math.max(prevAngle - 1, 0));
        }, interval_period * 10);
      } else if (event.key === 'ArrowUp') {
        intervalRef.current = setInterval(() => {
          setPlay(false);
          setInitSpeed((prevSpeed) => Math.min(prevSpeed + 1, 500));
        }, interval_period);
      } else if (event.key === 'ArrowDown') {
        setPlay(false);
        intervalRef.current = setInterval(() => {
          setInitSpeed((prevSpeed) => Math.max(prevSpeed - 1, 0));
        }, interval_period);
      }
    };

    const handleKeyUp = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const drawSpeedBar = (p5: any) => {
    const barWidth = 100;
    const barHeight = 500;
    const filledHeight = (initSpeed / 500) * barHeight;

    p5.fill(200);
    p5.rect(p5.width - barWidth - 10, 10, barWidth, barHeight);
    p5.fill(0, 255, 0);
    p5.rect(
      p5.width - barWidth - 10,
      10 + barHeight - filledHeight,
      barWidth,
      filledHeight
    );
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
    const step = 50; // Step size for grid lines
    const scaledStep = step / 0.1; // Adjust step size for scaling()

    //draw grid according to this--------
    // 400 will translate to 4000
    // 300 will translate to 3000
    // 200 will translate to 2000
    // 100 will translate to 1000
    // 0 will translate to 0
    for (let x = 0; x <= p5.width; x += step) {
      p5.line(x, 0, x, p5.height);
      p5.text(x * 10, x + 5, 15);
    }

    for (let y = 0; y <= p5.height; y += step) {
      p5.line(0, y, p5.width, y);
      p5.text((p5.height - y) * 10, 5, y - 5);
    }
  };

  const draw = (p5: any) => {
    p5.background(255);
    if (!p5) return;
    // if (true) return;
    drawGrid(p5);

    //flip y-axis
    //p5.translate(0, p5.height);
    p5.scale(0.1, -0.1);
    //now up lift using transform
    p5.translate(0, -p5.height * 10);

    //drawGrid(p5);

    //p5.fill(0);

    p5.push();

    //p5.circle(2000, 3000, 1000);

    //rotate the cannon
    p5.rotate(angle * (Math.PI / 180));

    //draw cannon, the axis are now alligned the way you want it, so no need to rotate
    p5.rect(0, 0, 500, 200);

    //go back to the original position
    p5.pop();
    p5.circle(2000, 2000, 1000);

    //draw the obstacle, which is a circle
    if (obstacle) {
      p5.fill(100);
      p5.circle(obstacle.x, obstacle.y, obstacle.size);
    }
    drawSpeedBar(p5);
    //now start the animation
    updateProjectiles(p5);
    return;
    if (play) {
      // start the projectile motion
      const dt = 0.15; // Time step
      const g = 9.81; // Gravity

      // Calculate air resistance
      const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

      const dragForce = 0.5 * density * speed * speed * dragCoefficient * area;

      const angle_of_motion = Math.atan(velocityY / velocityX);

      //now get dragForceX bbased on cos(angle_of_motion)
      const dragForceX = dragForce * Math.cos(angle_of_motion);

      //now get dragForceY based on sin(angle_of_motion)
      const dragForceY = dragForce * Math.sin(angle_of_motion);

      const rocket_angle_of_motion = Math.atan(
        velocityRocketY / velocityRocketX
      );
      console.log('rocket angle of motion', rocket_angle_of_motion);

      let rocket_power_x = 30 * Math.cos(rocket_angle_of_motion);
      let rocket_power_y = 30 * Math.sin(rocket_angle_of_motion);

      if (time_elapsed > 3) {
        rocket_power_x = 0;
        rocket_power_y = 0;
      }

      time_elapsed += dt;

      const rocket_speed = Math.sqrt(
        velocityRocketX * velocityRocketX + velocityRocketY * velocityRocketY
      );
      const drag_rocket_force =
        0.5 * density * rocket_speed * speed * dragCoefficient;
      const drag_rocket_force_x =
        drag_rocket_force * Math.cos(rocket_angle_of_motion);
      const drag_rocket_force_y =
        drag_rocket_force * Math.sin(rocket_angle_of_motion);

      // Update velocities with drag
      velocityX -= (dragForceX / weight) * dt;
      velocityY -= (g + dragForceY / weight) * dt;

      // Update positions with drag
      positionX += velocityX * dt;
      positionY += velocityY * dt; // Subtract because p5's y-axis is inverted

      //update the position without drag
      velocityXNoDrag = velocityXNoDrag;
      velocityYNoDrag -= g * dt;

      // Update positions without drag
      positionXNoDrag += velocityXNoDrag * dt;
      positionYNoDrag += velocityYNoDrag * dt; // Subtract because p5's y-axis is inverted

      //update velocity of the rocket
      velocityRocketX +=
        rocket_power_x * dt - (drag_rocket_force_x / weight) * dt;

      // velocityRocketY -=
      (g + drag_rocket_force_y / weight) * dt - (rocket_power_y * dt) / weight;

      console.log('Rocket Power X', rocket_power_x);
      console.log('Rocket Power Y', rocket_power_y);
      velocityRocketY -= g * dt - rocket_power_y * dt;

      //update the rocket position
      rocketProjectileX += velocityRocketX * dt;
      rocketProjectileY += velocityRocketY * dt;

      //update position

      // Store paths
      pathWithDrag.push([positionX, positionY]);
      pathNoDrag.push([positionXNoDrag, positionYNoDrag]);
      pathRocket.push([rocketProjectileX, rocketProjectileY]);

      // Stop simulation if both projectile hits the ground
      if (
        positionY <= 0 &&
        positionYNoDrag <= 0 &&
        (rocketProjectileY <= 0 || rocketProjectileX >= 20000)
      ) {
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

      // Draw the projectile with drag if it is in the air
      p5.fill(0);
      if (positionX > 0 && positionY > 0) {
        p5.circle(positionX, positionY, 200); // Adjust for scaling and larger size
      }

      // Draw the projectile without drag if it is in the air
      p5.fill(255, 0, 0);
      if (positionXNoDrag > 0 && positionYNoDrag > 0) {
        p5.circle(positionXNoDrag, positionYNoDrag, 200); // Adjust for scaling and larger size
      }

      // Draw the rocket if it is in the air
      p5.fill(0, 255, 0);
      if (rocketProjectileX > 0 && rocketProjectileY > 0) {
        p5.circle(rocketProjectileX, rocketProjectileY, 200); // Adjust for scaling and larger size
      }

      //draw paths
      p5.stroke(0);
      p5.strokeWeight(4);
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

      // Draw path without drag
      for (let i = 1; i < pathNoDrag.length; i++) {
        p5.line(
          pathNoDrag[i - 1][0],
          pathNoDrag[i - 1][1],
          pathNoDrag[i][0],
          pathNoDrag[i][1]
        );
      }

      //draw path for the rocket
      p5.stroke(0, 255, 0);
      p5.strokeWeight(4);
      p5.drawingContext.setLineDash([5, 5]); // Dotted line
      for (let i = 1; i < pathRocket.length; i++) {
        p5.line(
          pathRocket[i - 1][0],
          pathRocket[i - 1][1],
          pathRocket[i][0],
          pathRocket[i][1]
        );
      }
    }

    // draw another random circle
    //p5.circle(3000, 2000, 1000);

    /*

    // Translate to the bottom-left corner and apply zoom
    //p5.translate(0, p5.height);
    //p5.scale(zoom, zoom); // Negative scale for y-axis to keep the origin at the bottom-left
    //drawGrid(p5);
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
      */
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

    time_elapsed = 0;
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
      <Sketch setup={setup} draw={draw} keyPressed={keyPressed} />
    </div>
  );
};

export default ProjectileSimulation;

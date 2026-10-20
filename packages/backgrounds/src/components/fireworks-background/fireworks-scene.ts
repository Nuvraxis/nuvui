import { between, seeded } from "../../core/random";
import type { Point, Scene, Size } from "../../core/scene";

export interface FireworksSettings {
  speed: number;
  density: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  /** Where it's been, newest last, drawn as its tail. */
  trail: Point[];
}

interface Rocket extends Particle {
  /** How high it bursts. */
  burstAt: number;
}

interface Spark extends Particle {
  age: number;
  life: number;
}

const gravity = 120;
const tail = 6;
// The five colors it draws with, mapped from the theme's chart colors.
const palette = [1, 2, 3, 4, 5].map((n) => `--nuv-background-color-${n}`);

/**
 * Rockets that rise from the bottom and burst into sparks that fall and
 * fade. A press bursts one where it lands.
 */
export function fireworksScene({ speed, density }: FireworksSettings): Scene {
  const random = seeded(3);
  let size: Size = { width: 0, height: 0, ratio: 1, rtl: false };
  let colors: string[] = [];
  let rockets: Rocket[] = [];
  let sparks: Spark[] = [];
  let untilNext = 0.4;

  const pick = () =>
    colors[Math.floor(random() * colors.length)] ?? colors[0] ?? "";

  function burst(at: Point, color = pick()) {
    const count = Math.round(48 * Math.max(density, 0.1));
    for (let index = 0; index < count; index++) {
      const angle = (index / count) * Math.PI * 2 + between(random, -0.1, 0.1);
      // More sparks near the middle than at the rim, as a ball of them.
      const pace = 150 * Math.sqrt(between(random, 0.15, 1));
      sparks.push({
        x: at.x,
        y: at.y,
        vx: Math.cos(angle) * pace,
        vy: Math.sin(angle) * pace,
        color: random() < 0.85 ? color : pick(),
        trail: [],
        age: 0,
        life: between(random, 1.1, 1.7),
      });
    }
  }

  function launch() {
    const burstAt = size.height * between(random, 0.15, 0.45);
    const rise = size.height - burstAt;
    rockets.push({
      x: size.width * between(random, 0.15, 0.85),
      y: size.height + 4,
      vx: between(random, -12, 12),
      // Fast enough to slow to a stop where it bursts.
      vy: -Math.sqrt(2 * gravity * rise),
      color: pick(),
      trail: [],
      burstAt,
    });
  }

  const move = (particle: Particle, seconds: number) => {
    particle.trail.push({ x: particle.x, y: particle.y });
    if (particle.trail.length > tail) particle.trail.shift();
    particle.x += particle.vx * seconds;
    particle.y += particle.vy * seconds;
  };

  function step(seconds: number) {
    const time = seconds * speed;
    for (const rocket of rockets) {
      rocket.vy += gravity * time;
      move(rocket, time);
    }
    const bursting = rockets.filter(
      (rocket) => rocket.vy > -20 || rocket.y <= rocket.burstAt,
    );
    rockets = rockets.filter((rocket) => !bursting.includes(rocket));
    for (const rocket of bursting) burst(rocket, rocket.color);

    const drag = Math.exp(-time * 1.4);
    for (const spark of sparks) {
      spark.vx *= drag;
      spark.vy = spark.vy * drag + gravity * 0.6 * time;
      spark.age += time;
      move(spark, time);
    }
    sparks = sparks.filter((spark) => spark.age < spark.life);

    untilNext -= time;
    if (untilNext <= 0 && size.width > 0) {
      launch();
      untilNext = between(random, 0.7, 1.5);
    }
  }

  const stroke = (
    context: CanvasRenderingContext2D,
    particle: Particle,
    alpha: number,
  ) => {
    context.strokeStyle = particle.color;
    context.globalAlpha = alpha * 0.5;
    context.beginPath();
    const [first, ...rest] = particle.trail;
    if (first) {
      context.moveTo(first.x, first.y);
      for (const point of rest) context.lineTo(point.x, point.y);
      context.lineTo(particle.x, particle.y);
      context.stroke();
    }
    context.fillStyle = particle.color;
    context.globalAlpha = alpha;
    context.fillRect(particle.x - 1, particle.y - 1, 2, 2);
  };

  return {
    theme(theme) {
      colors = palette.map((property) => theme.color(property));
    },
    resize(next) {
      size = next;
    },
    step,
    settle() {
      // Three bursts at different points in their fall.
      sparks = [];
      rockets = [];
      const spots: [number, number][] = [
        [0.25, 0.3],
        [0.62, 0.22],
        [0.8, 0.42],
      ];
      for (const [x, y] of spots) {
        burst({ x: size.width * x, y: size.height * y });
        for (let index = 0; index < 8; index++) step(1 / 30);
      }
      // Bursts only, with no rocket on its way up caught halfway.
      rockets = [];
      untilNext = 0.5;
    },
    draw(context) {
      context.lineWidth = 1.5;
      context.lineCap = "round";
      for (const rocket of rockets) stroke(context, rocket, 0.9);
      for (const spark of sparks) {
        stroke(context, spark, 0.9 * (1 - spark.age / spark.life) ** 1.5);
      }
      context.globalAlpha = 1;
    },
    press(point) {
      burst(point);
    },
  };
}

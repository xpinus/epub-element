const TIMING_EQUATIONS = {
  linear: (timeFraction: number) => {
    return timeFraction;
  },
  easeInSine: (timeFraction: number) => {
    return -Math.cos(timeFraction * (Math.PI / 2)) + 1;
  },

  easeOutSine: (timeFraction: number) => {
    return Math.sin(timeFraction * (Math.PI / 2));
  },
};

export type TimingEquationsType = keyof typeof TIMING_EQUATIONS;

export type TimingFunction = (timeFraction: number) => number;

type AnimateOptions = {
  duration: number;
  draw: (progress: number) => void;
  timing: TimingFunction | TimingEquationsType;
  callback?: () => void;
};

function getTimingFunction(timing: TimingEquationsType) {
  return TIMING_EQUATIONS[timing] as TimingFunction;
}

export function animate({ duration, draw, timing, callback }: AnimateOptions) {
  if (typeof timing === 'string') {
    timing = getTimingFunction(timing);
  }

  const start = performance.now();

  requestAnimationFrame(function animate(time) {
    let timeFraction = (time - start) / duration;
    if (timeFraction > 1) timeFraction = 1;

    const progress = timing(timeFraction);

    draw(progress);

    if (timeFraction < 1) {
      requestAnimationFrame(animate);
    } else {
      callback && callback();
    }
  });
}

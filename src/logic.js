export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const DIR_KEYS = ["UP", "DOWN", "LEFT", "RIGHT"];

export function createGame({ rows = 20, cols = 20, rng = Math.random } = {}) {
  const startX = Math.floor(cols / 2);
  const startY = Math.floor(rows / 2);
  const snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
  ];

  return {
    rows,
    cols,
    snake,
    dir: "RIGHT",
    nextDir: "RIGHT",
    food: placeFood(rows, cols, snake, rng),
    score: 0,
    alive: true,
    paused: false,
    rng,
  };
}

export function step(state) {
  if (!state.alive || state.paused) return state;

  const dir = state.nextDir;
  const vector = DIRECTIONS[dir];
  const head = state.snake[0];
  const next = { x: head.x + vector.x, y: head.y + vector.y };

  if (isWallCollision(state, next) || isSelfCollision(state.snake, next)) {
    return { ...state, alive: false };
  }

  const ateFood = next.x === state.food.x && next.y === state.food.y;
  const newSnake = [next, ...state.snake];
  if (!ateFood) {
    newSnake.pop();
  }

  const newState = {
    ...state,
    snake: newSnake,
    dir,
    score: ateFood ? state.score + 1 : state.score,
  };

  if (ateFood) {
    newState.food = placeFood(state.rows, state.cols, newSnake, state.rng);
  }

  return newState;
}

export function setDirection(state, dir) {
  if (!DIR_KEYS.includes(dir)) return state;
  if (isOpposite(state.dir, dir)) return state;
  return { ...state, nextDir: dir };
}

export function togglePause(state) {
  if (!state.alive) return state;
  return { ...state, paused: !state.paused };
}

export function restart(state) {
  return createGame({ rows: state.rows, cols: state.cols, rng: state.rng });
}

export function isWallCollision(state, point) {
  return point.x < 0 || point.y < 0 || point.x >= state.cols || point.y >= state.rows;
}

export function isSelfCollision(snake, point) {
  return snake.some((segment) => segment.x === point.x && segment.y === point.y);
}

export function placeFood(rows, cols, snake, rng = Math.random) {
  const total = rows * cols - snake.length;
  if (total <= 0) return { x: 0, y: 0 };

  let target = Math.floor(rng() * total);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const occupied = snake.some((segment) => segment.x === x && segment.y === y);
      if (!occupied) {
        if (target === 0) return { x, y };
        target -= 1;
      }
    }
  }

  return { x: 0, y: 0 };
}

function isOpposite(a, b) {
  return (
    (a === "UP" && b === "DOWN") ||
    (a === "DOWN" && b === "UP") ||
    (a === "LEFT" && b === "RIGHT") ||
    (a === "RIGHT" && b === "LEFT")
  );
}

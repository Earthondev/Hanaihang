import {
  createGame,
  step,
  setDirection,
  togglePause,
  restart,
} from "./logic.js";

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const pauseBtn = document.getElementById("btn-pause");
const restartBtn = document.getElementById("btn-restart");

const rows = 20;
const cols = 20;
let state = createGame({ rows, cols });
let lastTick = 0;
const speedMs = 140;

const cells = [];
for (let i = 0; i < rows * cols; i += 1) {
  const cell = document.createElement("div");
  cell.className = "cell";
  boardEl.appendChild(cell);
  cells.push(cell);
}

function render() {
  cells.forEach((cell) => {
    cell.className = "cell";
  });

  state.snake.forEach((segment, index) => {
    const idx = segment.y * cols + segment.x;
    if (!cells[idx]) return;
    cells[idx].classList.add("snake");
    if (index === 0) cells[idx].classList.add("head");
  });

  const foodIdx = state.food.y * cols + state.food.x;
  if (cells[foodIdx]) cells[foodIdx].classList.add("food");

  scoreEl.textContent = `Score: ${state.score}`;
  if (!state.alive) {
    statusEl.textContent = "Game over";
  } else if (state.paused) {
    statusEl.textContent = "Paused";
  } else {
    statusEl.textContent = "Running";
  }

  pauseBtn.textContent = state.paused ? "Resume" : "Pause";
}

function tick(timestamp) {
  if (timestamp - lastTick >= speedMs) {
    state = step(state);
    lastTick = timestamp;
    render();
  }
  requestAnimationFrame(tick);
}

function handleDirection(dir) {
  state = setDirection(state, dir);
}

function handlePause() {
  state = togglePause(state);
  render();
}

function handleRestart() {
  state = restart(state);
  lastTick = 0;
  render();
}

const keyMap = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  w: "UP",
  s: "DOWN",
  a: "LEFT",
  d: "RIGHT",
  W: "UP",
  S: "DOWN",
  A: "LEFT",
  D: "RIGHT",
};

window.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    event.preventDefault();
    handlePause();
    return;
  }
  if (event.key === "r" || event.key === "R") {
    handleRestart();
    return;
  }
  const dir = keyMap[event.key];
  if (dir) {
    event.preventDefault();
    handleDirection(dir);
  }
});

pauseBtn.addEventListener("click", handlePause);
restartBtn.addEventListener("click", handleRestart);

const btnMap = {
  "btn-up": "UP",
  "btn-down": "DOWN",
  "btn-left": "LEFT",
  "btn-right": "RIGHT",
};

Object.entries(btnMap).forEach(([id, dir]) => {
  const btn = document.getElementById(id);
  btn.addEventListener("click", () => handleDirection(dir));
});

render();
requestAnimationFrame(tick);

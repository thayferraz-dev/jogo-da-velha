'use strict';

// ── Estado do jogo ─────────────────────────────────────────────────────────
const state = {
  board: Array(9).fill(null),   // null | 'X' | 'O'
  current: 'X',                 // jogador atual
  gameOver: false,
  mode: 'pvp',                  // 'pvp' | 'pvc'
  score: { X: 0, O: 0, draw: 0 },
};

// Combinações vencedoras (índices no tabuleiro)
const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
  [0, 4, 8], [2, 4, 6],             // diagonais
];

// ── Referências DOM ────────────────────────────────────────────────────────
const cells          = document.querySelectorAll('.cell');
const statusEl       = document.getElementById('status');
const currentEl      = document.getElementById('current-player');
const scoreXEl       = document.getElementById('score-x');
const scoreOEl       = document.getElementById('score-o');
const scoreDrawEl    = document.getElementById('score-draw');
const btnRestart     = document.getElementById('btn-restart');
const btnResetScore  = document.getElementById('btn-reset-score');
const modePvP        = document.getElementById('mode-pvp');
const modePvC        = document.getElementById('mode-pvc');
const modal          = document.getElementById('modal');
const modalIcon      = document.getElementById('modal-icon');
const modalTitle     = document.getElementById('modal-title');
const modalSubtitle  = document.getElementById('modal-subtitle');
const modalBtn       = document.getElementById('modal-btn');

// ── Lógica principal ───────────────────────────────────────────────────────

function checkWinner(board) {
  for (const [a, b, c] of WIN_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo: [a, b, c] };
    }
  }
  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', combo: [] };
  }
  return null;
}

function handleCellClick(e) {
  const index = parseInt(e.currentTarget.dataset.index);

  if (state.gameOver) return;
  if (state.board[index] !== null) return;
  // Em modo PvC, só o X (humano) pode clicar
  if (state.mode === 'pvc' && state.current === 'O') return;

  playMove(index);
}

function playMove(index) {
  state.board[index] = state.current;
  renderCell(index);

  const result = checkWinner(state.board);
  if (result) {
    endGame(result);
    return;
  }

  state.current = state.current === 'X' ? 'O' : 'X';
  updateStatus();

  // CPU joga após um pequeno delay
  if (state.mode === 'pvc' && state.current === 'O' && !state.gameOver) {
    setTimeout(cpuMove, 450);
  }
}

// ── CPU (Minimax) ──────────────────────────────────────────────────────────

function cpuMove() {
  if (state.gameOver) return;
  const best = minimax(state.board.slice(), 'O');
  playMove(best.index);
}

function minimax(board, player) {
  const result = checkWinner(board);
  if (result) {
    if (result.winner === 'O')    return { score:  10 };
    if (result.winner === 'X')    return { score: -10 };
    if (result.winner === 'draw') return { score:   0 };
  }

  const moves = [];
  const opponent = player === 'O' ? 'X' : 'O';

  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue;
    board[i] = player;
    const sub = minimax(board.slice(), opponent);
    moves.push({ index: i, score: sub.score });
    board[i] = null;
  }

  if (player === 'O') {
    // maximiza
    return moves.reduce((best, m) => m.score > best.score ? m : best);
  } else {
    // minimiza
    return moves.reduce((best, m) => m.score < best.score ? m : best);
  }
}

// ── Render ─────────────────────────────────────────────────────────────────

function renderCell(index) {
  const cell = cells[index];
  cell.textContent = state.board[index];
  cell.classList.add(state.board[index].toLowerCase(), 'taken');
}

function updateStatus() {
  const playerLabel = state.current === 'X'
    ? `<span id="current-player" class="player-x-color">X</span>`
    : `<span id="current-player" class="player-o-color">O</span>`;

  if (state.mode === 'pvc' && state.current === 'O') {
    statusEl.innerHTML = `CPU (<span class="player-o-color">O</span>) está pensando…`;
  } else {
    statusEl.innerHTML = `Vez do Jogador ${playerLabel}`;
  }
}

function updateScoreBoard() {
  scoreXEl.textContent    = state.score.X;
  scoreOEl.textContent    = state.score.O;
  scoreDrawEl.textContent = state.score.draw;
}

function highlightWinner(combo) {
  combo.forEach(i => cells[i].classList.add('winner'));
}

// ── Fim de jogo ────────────────────────────────────────────────────────────

function endGame(result) {
  state.gameOver = true;

  if (result.winner === 'draw') {
    state.score.draw++;
    statusEl.textContent = 'Empate!';
    showModal('🤝', 'Empate!', 'Nenhum dos jogadores venceu desta vez.', '#f0a500');
  } else {
    state.score[result.winner]++;
    highlightWinner(result.combo);
    const isHuman = state.mode === 'pvp' || result.winner === 'X';
    const label   = state.mode === 'pvc' && result.winner === 'O' ? 'CPU' : `Jogador ${result.winner}`;
    const color   = result.winner === 'X' ? '#e94560' : '#0f9de8';
    const icon    = result.winner === 'X' ? '🏆' : (state.mode === 'pvc' ? '🤖' : '🏆');
    statusEl.innerHTML = `<span style="color:${color}">${label}</span> venceu!`;
    showModal(icon, `${label} Venceu!`, 'Parabéns! Deseja jogar de novo?', color);
  }

  updateScoreBoard();
}

// ── Modal ──────────────────────────────────────────────────────────────────

function showModal(icon, title, subtitle, color) {
  modalIcon.textContent    = icon;
  modalTitle.textContent   = title;
  modalTitle.style.color   = color;
  modalSubtitle.textContent = subtitle;
  modal.classList.add('show');
}

function hideModal() {
  modal.classList.remove('show');
}

// ── Reset ──────────────────────────────────────────────────────────────────

function resetGame() {
  state.board    = Array(9).fill(null);
  state.current  = 'X';
  state.gameOver = false;

  cells.forEach(cell => {
    cell.textContent = '';
    cell.className   = 'cell'; // remove x, o, taken, winner
  });

  updateStatus();
  hideModal();
}

function resetScore() {
  state.score = { X: 0, O: 0, draw: 0 };
  updateScoreBoard();
  resetGame();
}

// ── Seleção de modo ────────────────────────────────────────────────────────

function setMode(mode) {
  state.mode = mode;
  modePvP.classList.toggle('active', mode === 'pvp');
  modePvC.classList.toggle('active', mode === 'pvc');
  resetGame();
}

// ── Event listeners ────────────────────────────────────────────────────────

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
btnRestart.addEventListener('click', resetGame);
btnResetScore.addEventListener('click', resetScore);
modalBtn.addEventListener('click', resetGame);
modePvP.addEventListener('click', () => setMode('pvp'));
modePvC.addEventListener('click', () => setMode('pvc'));

// Fechar modal clicando fora
modal.addEventListener('click', e => {
  if (e.target === modal) resetGame();
});

// ── Inicialização ──────────────────────────────────────────────────────────
updateStatus();
updateScoreBoard();

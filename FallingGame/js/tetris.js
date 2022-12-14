class Tetromino {
  constructor(block, color) {
    this.block = block;
    this.color = color;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  setOffset = (x, y) => {
    this.offsetX = x;
    this.offsetY = y;
  };

  rotate = () => {
    const block = this.block;
    const newBlock = [...Array(4)].map((_) => Array(4).fill(0));
    block.forEach((row, y) => {
      row.forEach((_, x) => {
        newBlock[y][x] = block[3 - x][y];
      });
    });

    this.block = newBlock;
  };

  clone = () => {
    const clone = new Tetromino(this.block, this.color);
    clone.setOffset(this.offsetX, this.offsetY);
    return clone;
  };
}

const TETROMINOS = [
  new Tetromino(
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    "rgb(255, 0, 0)"
  ),
  new Tetromino(
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    "rgb(0, 128, 0)"
  ),
  new Tetromino(
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    "rgb(255, 255, 0)"
  ),
  new Tetromino(
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
    "rgb(0, 255, 255)"
  ),
  new Tetromino(
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    "rgb(0, 0, 255)"
  ),
  new Tetromino(
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    "rgb(255, 102, 0)"
  ),
  new Tetromino(
    [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    "rgb(128, 0, 128)"
  ),
];

const AREA_WIDTH = 10;
const AREA_HEIGHT = 20;

let tetris;

window.onload = () => {
  tetris = new Tetris();
  tetris.init();
  tetris.start();
};

window.onresize = () => {
  tetris.init();
};

class Tetris {
  constructor() {
    this.container = document.getElementById("canvas-container");
    this.canvas = document.getElementById("canvas");
    this.context = canvas.getContext("2d");

    this.board = [...Array(AREA_HEIGHT)].map((_) =>
      Array(AREA_WIDTH).fill({ value: 0, color: "" })
    );
    this.currentTet = null;
    this.appStarted = false;
  }

  init = () => {
    this.canvas.height = this.container.clientHeight;
    this.canvas.width = this.canvas.height / 2;
    this.cellWidth = this.canvas.width / AREA_WIDTH;
    this.cellHeight = this.canvas.height / AREA_HEIGHT;

    this.clear();
  };

  clear = () => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  start = () => {
    this.container.onclick = () => {
      this.container.onclick = null;
      this.startFall();
    };
  };

  startFall = () => {
    this.container.addEventListener("touchstart", (e) => {
      e.preventDefault();

      this.touchStartX = e.touches[0].pageX;
      this.touchStartY = e.touches[0].pageY;
      this.touchStartTime = new Date();
    });

    // タッチ終了時： スワイプした距離から左右どちらにスワイプしたかを判定する/距離が短い場合何もしない
    this.container.addEventListener("touchend", (e) => {
      const touchEndX = e.changedTouches[0].pageX;
      const touchEndY = e.changedTouches[0].pageY;

      const { touchStartX, touchStartY, cellWidth, cellHeight } = this;

      const minDistanceX = cellWidth * 3;
      const minDistanceY = cellHeight * 3;
      const distanceX = touchEndX - touchStartX;
      const distanceY = touchEndY - touchStartY;
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        if (Math.abs(distanceX) > minDistanceX) {
          if (distanceX > 0) {
            this.moveRight();
          } else {
            this.moveLeft();
          }
          return;
        }
      } else {
        if (Math.abs(distanceY) > minDistanceY) {
          if (distanceY > 0) {
            this.moveDown();
            return;
          }
        }
      }

      const touchEndTime = new Date();
      const diff = touchEndTime.getTime() - this.touchStartTime.getTime();
      if (diff < 300) {
        this.rotate();
      }
    });

    document.onkeydown = (e) => {
      this.clear();
      this.renderBoard();
      if (this.currentTet == null) {
        return;
      }

      switch (e.code) {
        // 下
        case "ArrowDown":
          this.moveDown();
          break;
        // 左
        case "ArrowLeft":
          this.moveLeft();
          break;
        // 右
        case "ArrowRight":
          this.moveRight();
          break;
        // スペース
        case "Space":
          this.rotate();
          break;
      }

      this.renderCurrentTet();
    };

    // 落下スタート
    this.timerId = setInterval(() => {
      this.fall();
    }, 500);
  };

  renderNewTet = () => {
    const tetromino = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
    tetromino.setOffset(3, 0);
    if (this.canMove(tetromino, 0, 0)) {
      this.currentTet = tetromino;
      this.renderCurrentTet();
    } else {
      clearInterval(this.timerId);
    }
  };

  renderCurrentTet = () => {
    const { cellWidth, cellHeight, context, currentTet } = this;

    context.fillStyle = currentTet.color;
    currentTet.block.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value === 0) {
          return;
        }

        context.fillRect(
          currentTet.offsetX * cellWidth + cellWidth * x,
          currentTet.offsetY * cellHeight + cellHeight * y,
          cellWidth,
          cellHeight
        );
      });
    });
  };

  renderBoard = () => {
    const { cellWidth, cellHeight, context, board } = this;

    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.value === 0) {
          return;
        }

        context.fillStyle = cell.color;
        context.fillRect(cellWidth * x, cellHeight * y, cellWidth, cellHeight);
      });
    });
  };

  fall = () => {
    this.clear();

    if (this.currentTet == null) {
      this.renderNewTet();
      this.renderBoard();
      return;
    }

    const { currentTet } = this;
    if (this.canMove(currentTet, 0, 1)) {
      this.currentTet.offsetY = currentTet.offsetY + 1;
      this.renderCurrentTet();
    } else {
      currentTet.block.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value === 0) {
            return;
          }

          this.board[currentTet.offsetY + y][currentTet.offsetX + x] = {
            value: 1,
            color: currentTet.color,
          };
        });
      });
      this.currentTet = null;

      this.checkLine();
    }

    this.renderBoard();
  };

  moveLeft = () => {
    const { currentTet } = this;

    if (this.canMove(currentTet, -1, 0)) {
      this.currentTet.setOffset(currentTet.offsetX - 1, currentTet.offsetY);
    }
  };

  moveRight = () => {
    const { currentTet } = this;
    if (this.canMove(currentTet, 1, 0)) {
      this.currentTet.setOffset(currentTet.offsetX + 1, currentTet.offsetY);
    }
  };

  moveDown = () => {
    const { currentTet } = this;
    if (this.canMove(currentTet, 0, 1)) {
      this.currentTet.setOffset(currentTet.offsetX, currentTet.offsetY + 1);
    }
  };

  rotate = () => {
    const clone = this.currentTet.clone();
    clone.rotate();
    if (this.canMove(clone, 0, 0)) {
      this.currentTet.rotate();
    }
  };

  checkLine = () => {
    const newBoard = this.board.filter((row, y) =>
      row.some((x) => x.value === 0)
    );
    const num = AREA_HEIGHT - newBoard.length;
    for (let i = 0; i < num; i++) {
      newBoard.unshift(Array(AREA_WIDTH).fill({ value: 0, color: "" }));
    }
    this.board = newBoard;
  };

  canMove = (tetromino, distanceX, distanceY) => {
    const { board } = this;

    let canMove = true;
    tetromino.block.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value === 0 || !canMove) {
          return;
        }

        const destX = tetromino.offsetX + x + distanceX;
        const destY = tetromino.offsetY + y + distanceY;
        if (destX < 0 || AREA_WIDTH <= destX) {
          canMove = false;
        } else if (destY < 0 || AREA_HEIGHT <= destY) {
          canMove = false;
        } else if (board[destY][destX].value === 1) {
          canMove = false;
        }
      });
    });

    return canMove;
  };
}

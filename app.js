let eventHub = new Vue();

Vue.component('ttt-cell', {
  template: '<button class="box" :value="value" @click="mark" :id="id"></button>',

  props: ['id'],

  data() {
    return {
      value: null
    };
  },

  created() {
    eventHub.$on('update', this.update);
    eventHub.$on('reset', this.reset);
  },

  beforeDestroy() {
    eventHub.$off('update', this.update);
    eventHub.$off('reset', this.reset);
  },

  methods: {
    mark() {
      // whenever the button is clicked, it dispatches a 'mark' event 
      /// -> (if it has it's 'value' empty).
      if (this.value === null) eventHub.$emit('mark', this.id);
    },
    update(data) {
      if (data.id === this.id) {
        this.value = data.value;
      }
    },
    reset() {
      this.value = null;
    }
  }
});

let app = new Vue({
  el: '#app',

  data: {
    boardSize: 9,
    isGameOn: false,

    board: [],

    player: null,
    pc: null,

    playerTurn: true,

    gameFinished: false,
    gameResult: null
  },

  computed: {
    dimensionSize() {
      return Math.sqrt(this.boardSize);
    },
    currentPlayer() {
      return this.playerTurn ? this.player : this.pc;
    }
  },

  watch: {
    board: function(newBoard, oldBoard) {
      this.registerMove(newBoard, oldBoard);
    }
  },

  created() {
    this.initBoard();
    this.toggleGame();
    eventHub.$on('mark', this.markCell);
  },

  beforeDestroy() {
    eventHub.$off('mark', this.markCell)
  },

  methods: {
    initBoard() {
      if (this.board.length > 0) this.board = [];
      let dimensionSize = this.dimensionSize;
      // fill initially the board with null's
      for (let i=0; i < dimensionSize; i++) {
        this.board.push([]);
        for (let j=0; j < dimensionSize; j++) {
          this.board[i].push(null)
        }
      }
    },

    toggleGame() {
      this.isGameOn = !this.isGameOn;
    },

    chooseSides(e) {
      let playerChoice = Number(e.target.value);
      this.player = playerChoice;
      this.pc = playerChoice === 0 ? 1 : 0;
      this.toggleGame();
    },
    
    reset() {
      this.player = null;
      this.pc = null;
      this.gameResult = null;
      this.gameFinished = false;
      this.initBoard();
      eventHub.$emit('reset');
      this.toggleGame();
    },

    markCell(num) {
      const [cellRow, cellCol] = this.transform1dTo2d(num);
      if (this.board[cellRow][cellCol] === null) {
        let newBoard = this.copyBoard(this.board);
        newBoard[cellRow][cellCol] = this.currentPlayer;
        this.board = newBoard;
      }
    },

    transform1dTo2d(num) {
      let dimensionSize = this.dimensionSize;
      let cellRow = num > (dimensionSize-1) ? Math.floor(num/dimensionSize) : 0;
      let cellCol = num % dimensionSize;

      return [cellRow, cellCol];
    },

    copyBoard(board) {
      return board.map(function(row) {
        return row.slice();
      });
    },

    registerMove(newBoard, oldBoard) {
      oldBoard.forEach(function(row, i) {
        oldBoard[i].forEach(function(col, j) {
          if (oldBoard[i][j] !== newBoard[i][j]) {
            let id = i*3 + j; // transform into id number (0-8)
            eventHub.$emit('update', {
              id: id,
              value: this.currentPlayer
            })
            this.playerTurn = !this.playerTurn;
            this.checkResult();
          }
        }, this)
      }, this)
    },

    // Check if someone won
    getWinner(board) {
      let dimensionSize = this.dimensionSize;
      let vals = [this.player, this.pc];
      let allCellsFilled = true;
      for (let k = 0; k < vals.length; k++) {
        let value = vals[k];

        // Check rows, columns, and diagonals
        let diagonalComplete1 = true;
        let diagonalComplete2 = true;
        for (let i = 0; i < dimensionSize; i++) {
          if (board[i][i] != value) {
            diagonalComplete1 = false;
          }
          // for 3x3 it would be board[(3-1)-i][i]. 3-1 for 0 based loops, else just 3
          if (board[(dimensionSize - 1) - i][i] != value) {
            diagonalComplete2 = false;
          }
          let rowComplete = true;
          let colComplete = true;
          for (let j = 0; j < dimensionSize; j++) {
            if (board[i][j] != value) {
              rowComplete = false;
            }
            if (board[j][i] != value) {
              colComplete = false;
            }
            if (board[i][j] == null) {
              allCellsFilled = false;
            }
          }
          // win, return the winner value
          if (rowComplete || colComplete) return value;
        }
        // win, return the winner value
        if (diagonalComplete1 || diagonalComplete2) return value;
      }
      // draw
      if (allCellsFilled) return -1;
      // no winners, no draw - show goes on
      return null;
    },

    randomMove(board, player) {
      // take a random cell, if it's not null, use it
      // else take another random one, not already used
      const i = parseInt(Math.random() * 10 % 3);
      const j = parseInt(Math.random() * 10 % 3);
      const cell = board[i][j];
      if (cell === null) {
        let newBoard = this.copyBoard(board);
        newBoard[i][j] = player;
        return newBoard;
      }
      else return this.randomMove(board, player);
    },

    pcMove() {
      let copyBoard = this.copyBoard(this.board);
      let pcNextMoveBoard = this.randomMove(copyBoard, this.pc);
      this.board = pcNextMoveBoard;
    },

    checkResult() {
      let winner = this.getWinner(this.board);
      // game ends...
      if (winner !== null) this.endGame(winner);
      // or next round...
      else if (!this.playerTurn) this.pcMove();
    },

    endGame(result) {
      this.gameFinished = true;
      this.gameResult = result;
    }
  }
})
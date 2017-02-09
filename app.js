let eventHub = new Vue();

Vue.component('ttt-cell', {
  template: '<button class="box" :value="value" @click="mark" :id="id"></button>',

  props: ['id'],

  data() {
    return {
      value: ''
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
      if (this.value.length === 0) eventHub.$emit('mark', this.id);
    },
    update(data) {
      if (data.id === this.id) this.value = data.value;
    },
    reset() {
      this.value = '';
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

    numnodes: 0
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
      console.log('board change');
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
      this.board.forEach(function(row, i) {
        this.board[i].forEach(function(col, j) {
          this.board[i][j] = null;
        }, this);
      }, this);
      eventHub.$emit('reset');
      this.initBoard();
      this.toggleGame();
    },

    markCell(id) {
      let dimensionSize = this.dimensionSize;
      let cellRow = id > (dimensionSize-1) ? Math.floor(id/dimensionSize) : 0;
      let cellCol = id % dimensionSize;

      if (this.board[cellRow][cellCol] === null) {
        console.log('mark', id);
        let newBoard = this.copyBoard(this.board);
        newBoard[cellRow][cellCol] = this.currentPlayer;
        this.board = newBoard;
      }
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

    minMax(board, player) {
      this.numnodes++;
      let winner = this.getWinner(board);
      if (winner !== null) {
        switch(winner) {
          case this.pc:
            return [1, board];
          case this.player:
            return [-1, board];
          case -1:
            return [0, board];
        }
      }
      else {
        let nextVal = null;
        let nextBoard = null;

        for (let i = 0; i < this.dimensionSize; i++) {
          for (let j = 0; j < this.dimensionSize; j++) {
            if (board[i][j] === null) {
              board[i][j] = player;
              let value = this.minMax(board, player === 0 ? 1 : 0)[0];
              if ((player && (nextVal === null || value > nextVal)) || (!player && (nextVal === null || value < nextVal))) {
                nextBoard = this.copyBoard(board);
                nextVal = value;
              }
              board[i][j] = null;
            }
          }
        }
        return [nextVal, nextBoard];
      }
    },

    pcMove() {
      let copyBoard = this.copyBoard(this.board);
      let pcNextMoveBoard = this.minMax(copyBoard, this.pc)[1];
      console.log('num. of nodes: ', this.numnodes);
      this.board = pcNextMoveBoard;
    },

    checkResult() {
      let winner = this.getWinner(this.board);
      if (winner === this.player) console.log('You won!');
      else if (winner === this.pc) console.log('PC won!');
      else if (winner === -1) console.log('draw...');
      else if (!this.playerTurn) {
        console.log('next round...');
        this.pcMove();
      }
    }
  }
})
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

    playerTurn: true
  },

  computed: {
    dimensionSize() {
      return Math.sqrt(this.boardSize);
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

    checkScore(game) {
      if (this.isWin(game)) {
        if (this.playerTurn) return 10;
        else return -10;
      }
      return 0;
    },

    minMax() {
      // calculate minMax using checkScore & isWin
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
      this.board = [];
      eventHub.$emit('reset');
      this.initBoard();
      this.toggleGame();
    },

    checkScore() {
      // no winner -> board full ? restart : continue
      // winner -> display winner
    },

    markCell(id) {
      console.log('mark', id);
      let dimensionSize = this.dimensionSize;
      let cellRow = id > (dimensionSize-1) ? Math.floor(id/dimensionSize) : 0;
      let cellCol = id % dimensionSize;
      let value = this.playerTurn ? this.player : this.pc;

      let data = {
        id: id,
        value: value
      };

      this.playerTurn = !this.playerTurn;
      this.board[cellRow][cellCol] = value;
      console.log(cellRow, cellCol);

      eventHub.$emit('update', data);
    }
  }
})
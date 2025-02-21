// Game container size - can adjust as needed, but need to adjust other values in code
const width = 580;
const height = 380;

// Phaser game configuration
const config = {
  type: Phaser.AUTO, // Automatically determine the rendering method (WebGL or Canvas)
  width: width,
  height: height,
  parent: 'game-container', // Attach the game to the specified HTML element
  physics: {
    default: 'arcade', // Use the Arcade physics engine
    arcade: {
      gravity: { y: 1000 }, // Set global gravity
      debug: false // Disable physics debugging
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

let bird;
let pipes;
let score = 0;
let scoreText;
let gameStarted = false;

// Preload assets (images)
function preload() {
  this.load.image('bird', 'assets/valentines_flappy.png');
  this.load.image('pipe', 'assets/pipe.png');
  this.load.image('background', 'assets/background.png');
}

let firstPlay = true; // Flag to track first play

// Create game objects and setup initial state
function create() {
  gameContainer = this.add.container(0, 0);

  // Add background image
  let background = this.add.image(0, 0, 'background');
  background.setOrigin(0, 0);
  background.setDisplaySize(width, height);
  background.setDepth(-1);
  gameContainer.add(background);

  // Add the bird
  bird = this.physics.add.sprite(60, 200, 'bird');
  bird.setGravityY(600);
  bird.setCollideWorldBounds(true);
  bird.setDisplaySize(30, 30);
  bird.body.allowGravity = false; // Disable gravity initially

  // Create pipes group
  pipes = this.physics.add.group();
  this.physics.add.collider(bird, pipes, gameOver, null, this);

  // Add score text (initially hidden)
  scoreText = this.add.text(10, 10, `Score: ${score}`, {
    fontSize: '20px',
    fontFamily: 'Verdana',
    fill: '#fff'
  });
  scoreText.setDepth(10);
  scoreText.setVisible(false);

  gameStarted = false;

  // Show start screen only on the first play
  if (firstPlay) {
    showStartScreen.call(this);
  } else {
    this.input.on('pointerdown', () => {
      if (!gameStarted) {
        startGame.call(this);
        this.input.on('pointerdown', flap, this);
      }
    });
  }
}

// Display start screen overlay
function showStartScreen() {
  let overlay = this.add.rectangle(width / 2, height / 2, width, height, 0xFEC3E4, 0.9); // Soft pink overlay
  overlay.setDepth(5);

  let startText = this.add.text(width / 2, height / 2, "💖 Flappy Love 💖\nClick to start!", {
    fontSize: '40px',
    fontFamily: 'Georgia',
    fill: '#EC1A72',
    align: 'center'
  }).setOrigin(0.5);
  startText.setDepth(6);

  this.input.once('pointerdown', () => {
    startText.destroy();
    overlay.destroy();
    scoreText.setVisible(true);
    firstPlay = false;
    startGame.call(this);
    this.input.on('pointerdown', flap, this);
  });
}

let gameOverFlag = false; // Prevent multiple game over calls

// Handle game over logic
function gameOver() {
  if (gameOverFlag) return;
  gameOverFlag = true;

  this.physics.pause();
  bird.setVelocity(0, 0);
  scoreText.setVisible(false);

  let overlay = this.add.rectangle(width / 2, height / 2, width, height, 0xFEC3E4, 0.9);
  overlay.setDepth(5);

  let gameOverText = this.add.text(width / 2, height / 2, `💔 Game Over 💔\nScore: ${score}\nClick to try again!`, {
    fontSize: '40px',
    fontFamily: 'Georgia',
    fill: '#EC1A72',
    align: 'center'
  }).setOrigin(0.5);
  gameOverText.setDepth(6);

  this.input.enabled = false;

  // Wait 1.5 seconds before restarting the game to avoid spamming
  this.time.delayedCall(1500, () => {
    this.input.enabled = true;
    this.input.once('pointerdown', () => {
      score = 0;
      gameStarted = false;
      gameOverFlag = false;
      this.scene.restart();
    });
  });
}

// Start the game and enable gravity
function startGame() {
  if (gameStarted) return;

  gameStarted = true;
  bird.body.allowGravity = true;
  scoreText.setVisible(true);

  // Generate pipes periodically
  this.time.addEvent({
    delay: Phaser.Math.Between(1300, 1800),
    callback: createPipe,
    callbackScope: this,
    loop: true
  });
}

// Make the bird flap when clicked
function flap() {
  if (!gameStarted) return;
  bird.setVelocityY(-300);
}

// Create pipes with a random gap
function createPipe() {
  const pipeHeight = Phaser.Math.Between(200, 300);
  const gapSize = Phaser.Math.Between(120, 160);

  const topPipe = pipes.create(width, pipeHeight - gapSize, 'pipe');
  topPipe.setVelocityX(-200);
  topPipe.setOrigin(0, 1);
  topPipe.setFlipY(true);
  topPipe.setDisplaySize(50, 200);
  topPipe.body.allowGravity = false;

  const bottomPipe = pipes.create(width, pipeHeight, 'pipe');
  bottomPipe.setVelocityX(-200);
  bottomPipe.setOrigin(0, 0);
  bottomPipe.setDisplaySize(50, 200);
  bottomPipe.body.allowGravity = false;

  // Mark bottom pipe as responsible for scoring
  bottomPipe.scored = false;
}

// Update game state each frame
function update() {

  // Set bounds for floor / ceiling (account for size of bird)
  if (bird.y < 18 || bird.y > 362) {
    gameOver.call(this);
  }

  // Check if the bird has passed a bottom pipe and update score
  pipes.getChildren().forEach(pipe => {
    if (!pipe.scored && pipe.y > height / 2 && pipe.x + pipe.displayWidth < bird.x) {
      score++;
      scoreText.setText(`Score: ${score}`);
      pipe.scored = true;
    }
  });
}

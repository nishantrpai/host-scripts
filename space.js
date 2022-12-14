//  Constants for the keyboard.
var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_SPACE = 32;

//  Creates an instance of the Game class.
function Game() {
  this.windowW = window.innerWidth;
  this.windowH = window.innerHeight;
  this.gameWidth = this.windowW * .35;
  this.gameHeight = this.windowH * .4;


  //  Set the initial config.
  this.config = {
    bombRate: 0.05,
    bombMinVelocity: 50,
    bombMaxVelocity: 50,
    invaderInitialVelocity: 25,
    invaderAcceleration: 1,
    invaderDropDistance: 20,
    rocketVelocity: 120,
    rocketMaxFireRate: 2,
    gameWidth: this.gameWidth,
    gameHeight: this.gameHeight,
    fps: 50,
    debugMode: false,
    invaderRanks: 5,
    invaderFiles: 10,
    shipSpeed: 120,
    ufoSpeed: 5,
    levelDifficultyMultiplier: 0.2,
    pointsPerInvader: 5,
    pointsPerUfo: 50,
    limitLevelIncrease: 25
  };

  //  All state is in the variables below.
  this.lives = 3;
  this.width = 0;
  this.height = 0;
  this.gameBounds = {left: 0, top: 0, right: 0, bottom: 0};
  this.intervalId = 0;
  this.score = 0;
  this.level = 1;

  //  The state stack.
  this.stateStack = [];

  //  Input/output
  this.pressedKeys = {};
  this.gameCanvas = null;

  //  All sounds.
  this.sounds = null;

  //  The previous x position, used for touch.
  this.previousX = 0;
}

//  Initialise the Game with a canvas.
Game.prototype.initialise = function (gameCanvas) {

  //  Set the game canvas.
  this.gameCanvas = gameCanvas;

  //  Set the game width and height.
  this.width = gameCanvas.width;
  this.height = gameCanvas.height;

  //  Set the state game bounds.
  this.gameBounds = {
    left: gameCanvas.width / 2 - this.config.gameWidth / 2,
    right: gameCanvas.width / 2 + this.config.gameWidth / 2,
    top: gameCanvas.height / 2 - this.config.gameHeight / 2.5,
    bottom: gameCanvas.height / 2 + this.config.gameHeight / 2,
  };
};

Game.prototype.moveToState = function (state) {

  //  If we are in a state, leave it.
  if (this.currentState() && this.currentState().leave) {
    this.currentState().leave(game);
    this.stateStack.pop();
  }

  //  If there's an enter function for the new state, call it.
  if (state.enter) {
    state.enter(game);
  }

  //  Set the current state.
  this.stateStack.pop();
  this.stateStack.push(state);
};

//  Start the Game.
Game.prototype.start = function () {

  //  Move into the 'welcome' state.
  this.moveToState(new WelcomeState());

  //  Set the game variables.
  this.lives = 3;
  this.config.debugMode = /debug=true/.test(window.location.href);

  //  Start the game loop.
  var game = this;
  this.intervalId = setInterval(function () {
    GameLoop(game);
  }, 1000 / this.config.fps);

};

//  Returns the current state.
Game.prototype.currentState = function () {
  return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
};

//  Mutes or unmutes the game.
Game.prototype.mute = function (mute) {

  //  If we've been told to mute, mute.
  if (mute === true) {
    this.sounds.mute = true;
  } else if (mute === false) {
    this.sounds.mute = false;
  } else {
    // Toggle mute instead...
    this.sounds.mute = this.sounds.mute ? false : true;
  }
};

//  The main loop.
function GameLoop(game) {
  var currentState = game.currentState();
  if (currentState) {

    //  Delta t is the time to update/draw.
    var dt = 1 / game.config.fps;

    //  Get the drawing context.
    var ctx = this.gameCanvas.getContext("2d");

    //  Update if we have an update function. Also draw
    //  if we have a draw function.
    if (currentState.update) {
      currentState.update(game, dt);
    }
    if (currentState.draw) {
      currentState.draw(game, dt, ctx);
    }
  }
}

Game.prototype.pushState = function (state) {

  //  If there's an enter function for the new state, call it.
  if (state.enter) {
    state.enter(game);
  }
  //  Set the current state.
  this.stateStack.push(state);
};

Game.prototype.popState = function () {

  //  Leave and pop the state.
  if (this.currentState()) {
    if (this.currentState().leave) {
      this.currentState().leave(game);
    }

    //  Set the current state.
    this.stateStack.pop();
  }
};

//  The stop function stops the game.
Game.prototype.stop = function Stop() {
  clearInterval(this.intervalId);
};

//  Inform the game a key is down.
Game.prototype.keyDown = function (keyCode) {
  this.pressedKeys[keyCode] = true;
  //  Delegate to the current state too.
  if (this.currentState() && this.currentState().keyDown) {
    this.currentState().keyDown(this, keyCode);
  }
};

Game.prototype.touchstart = function (s) {
  if (this.currentState() && this.currentState().keyDown) {
    this.currentState().keyDown(this, KEY_SPACE);
  }
};

Game.prototype.touchend = function (s) {
  delete this.pressedKeys[KEY_RIGHT];
  delete this.pressedKeys[KEY_LEFT];
};

Game.prototype.touchmove = function (e) {
  var currentX = e.changedTouches[0].pageX;
  if (this.previousX > 0) {
    if (currentX > this.previousX) {
      delete this.pressedKeys[KEY_LEFT];
      this.pressedKeys[KEY_RIGHT] = true;
    } else {
      delete this.pressedKeys[KEY_RIGHT];
      this.pressedKeys[KEY_LEFT] = true;
    }
  }
  this.previousX = currentX;
};

//  Inform the game a key is up.
Game.prototype.keyUp = function (keyCode) {
  delete this.pressedKeys[keyCode];
  //  Delegate to the current state too.
  if (this.currentState() && this.currentState().keyUp) {
    this.currentState().keyUp(this, keyCode);
  }
};

function WelcomeState() {

}

WelcomeState.prototype.enter = function (game) {

  // Create and load the sounds.
  game.sounds = new Sounds();
  game.sounds.init();
  game.sounds.loadSound('shoot', 'https://mickwhite.dev/retro-assets/sounds/shoot.wav');
  game.sounds.loadSound('bang', 'https://mickwhite.dev/retro-assets/sounds/bang.wav');
  game.sounds.loadSound('explosion', 'https://mickwhite.dev/retro-assets/sounds/explosion.wav');
};

WelcomeState.prototype.update = function (game, dt) {


};

WelcomeState.prototype.draw = function (game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);

  ctx.font = "14px arcade";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "center";
  ctx.textAlign = "center";
  ctx.fillText("Welcome. ", game.width / 2, game.height / 2 - 50);
  ctx.font = "16px arcade";

  ctx.fillText("Press 'Space' or touch to start.", game.width / 2, game.height / 2 + 40);
};

WelcomeState.prototype.keyDown = function (game, keyCode) {
  if (keyCode == KEY_SPACE) {
    //  Space starts the game.
    game.level = 1;
    game.score = 0;
    game.lives = 3;
    game.moveToState(new LevelIntroState(game.level));
  }
};

function GameOverState() {

}

GameOverState.prototype.update = function (game, dt) {

};

GameOverState.prototype.draw = function (game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);

  ctx.font = "30px arcade";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "center";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", game.width / 2, game.height / 2 - 40);
  ctx.font = "16px arcade";
  ctx.fillText("You scored " + game.score + " and got to level " + game.level, game.width / 2, game.height / 2);
  ctx.font = "16px arcade";
  ctx.fillText("Press 'Space' to play again.", game.width / 2, game.height / 2 + 40);
};

GameOverState.prototype.keyDown = function (game, keyCode) {
  if (keyCode == KEY_SPACE) {
    //  Space restarts the game.
    game.lives = 3;
    game.score = 0;
    game.level = 1;
    game.moveToState(new LevelIntroState(1));
  }
};

//  Create a PlayState with the game config and the level you are on.
function PlayState(config, level) {
  this.config = config;
  this.level = level;

  //  Game state.
  this.invaderCurrentVelocity = 10;
  this.invaderCurrentDropDistance = 0;
  this.invadersAreDropping = false;
  this.lastRocketTime = null;

  //  Game entities.
  this.ship = null;
  this.ufo = null;
  this.invaders = [];
  this.rockets = [];
  this.bombs = [];
}

PlayState.prototype.enter = function (game) {

  //  Create the ship.
  this.ship = new Ship(game.width / 2, game.gameBounds.bottom);
  //  Create the ufo.
  this.ufo = new Ufo(game.width / 2, game.gameBounds.top - 30);

  //  Setup initial state.
  this.invaderCurrentVelocity = 10;
  this.invaderCurrentDropDistance = 0;
  this.invadersAreDropping = false;

  //  Set the ship speed for this level, as well as invader params.
  var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
  var limitLevel = (this.level < this.config.limitLevelIncrease ? this.level : this.config.limitLevelIncrease);
  this.shipSpeed = this.config.shipSpeed;
  this.ufoSpeed = this.config.ufoSpeed;
  this.invaderInitialVelocity = this.config.invaderInitialVelocity + 1.5 * (levelMultiplier * this.config.invaderInitialVelocity);
  this.bombRate = this.config.bombRate + (levelMultiplier * this.config.bombRate);
  this.bombMinVelocity = this.config.bombMinVelocity + (levelMultiplier * this.config.bombMinVelocity);
  this.bombMaxVelocity = this.config.bombMaxVelocity + (levelMultiplier * this.config.bombMaxVelocity);
  this.rocketMaxFireRate = this.config.rocketMaxFireRate + 0.4 * limitLevel;

  //  Create the invaders.
  var ranks = this.config.invaderRanks + 0.1 * limitLevel;
  var files = this.config.invaderFiles + 0.2 * limitLevel;
  var invaders = [];

  for (var rank = 0; rank < ranks; rank++) {
    for (var file = 0; file < files; file++) {
      invaders.push(new Invader(
        (game.width / 2) + ((files / 2 - file) * 200 / files),
        (game.gameBounds.top + rank * 20),
        rank, file, 'Invader'));
    }
  }
  this.invaders = invaders;
  this.invaderCurrentVelocity = this.invaderInitialVelocity;
  this.invaderVelocity = {x: -this.invaderInitialVelocity, y: 0};
  this.invaderNextVelocity = null;
};

PlayState.prototype.update = function (game, dt) {

  //  If the left or right arrow keys are pressed, move
  //  the ship. Check this on ticks rather than via a keydown
  //  event for smooth movement, otherwise the ship would move
  //  more like a text editor caret.
  if (game.pressedKeys[KEY_LEFT]) {
    this.ship.x -= this.shipSpeed * dt;
  }
  if (game.pressedKeys[KEY_RIGHT]) {
    this.ship.x += this.shipSpeed * dt;
  }
  if (game.pressedKeys[KEY_SPACE]) {
    this.fireRocket();
  }

  //  Keep the ship in bounds.
  if (this.ship.x < game.gameBounds.left) {
    this.ship.x = game.gameBounds.left;
  }
  if (this.ship.x > game.gameBounds.right) {
    this.ship.x = game.gameBounds.right;
  }

  //  Keep the UFO in bounds.
  var random = 10 * (Math.floor(Math.random() * 10) - 5);

  this.ufo.x += this.ufoSpeed * dt * random;
  if (this.ufo.x <= game.gameBounds.left) {
    this.ufo.x += this.ufo.x * 1
  }
  if (this.ufo.x >= game.gameBounds.right) {
    this.ufo.x = this.ufo.x * -1
  }

  //  Move each bomb.
  for (var i = 0; i < this.bombs.length; i++) {
    var bomb = this.bombs[i];
    bomb.y += dt * bomb.velocity;

    //  If the rocket has gone off the screen remove it.
    if (bomb.y > this.height) {
      this.bombs.splice(i--, 1);
    }
  }

  //  Move each rocket.
  for (i = 0; i < this.rockets.length; i++) {
    var rocket = this.rockets[i];
    rocket.y -= dt * rocket.velocity;

    //  If the rocket has gone off the screen remove it.
    if (rocket.y < 0) {
      this.rockets.splice(i--, 1);
    }
  }

  //  Move the invaders.
  var hitLeft = false, hitRight = false, hitBottom = false;
  for (i = 0; i < this.invaders.length; i++) {
    var invader = this.invaders[i];
    var newx = invader.x + this.invaderVelocity.x * dt;
    var newy = invader.y + this.invaderVelocity.y * dt;
    if (hitLeft == false && newx < game.gameBounds.left) {
      hitLeft = true;
    }
    else if (hitRight == false && newx > game.gameBounds.right) {
      hitRight = true;
    }
    else if (hitBottom == false && newy > game.gameBounds.bottom) {
      hitBottom = true;
    }
    if (!hitLeft && !hitRight && !hitBottom) {
      invader.x = newx;
      invader.y = newy;
    }
  }

  //  Update invader velocities.
  if (this.invadersAreDropping) {
    this.invaderCurrentDropDistance += this.invaderVelocity.y * dt;
    if (this.invaderCurrentDropDistance >= this.config.invaderDropDistance) {
      this.invadersAreDropping = false;
      this.invaderVelocity = this.invaderNextVelocity;
      this.invaderCurrentDropDistance = 0;
    }
  }
  //  If we've hit the left, move down then right.
  if (hitLeft) {
    this.invaderCurrentVelocity += this.config.invaderAcceleration;
    this.invaderVelocity = {x: 0, y: this.invaderCurrentVelocity};
    this.invadersAreDropping = true;
    this.invaderNextVelocity = {x: this.invaderCurrentVelocity, y: 0};
  }
  //  If we've hit the right, move down then left.
  if (hitRight) {
    this.invaderCurrentVelocity += this.config.invaderAcceleration;
    this.invaderVelocity = {x: 0, y: this.invaderCurrentVelocity};
    this.invadersAreDropping = true;
    this.invaderNextVelocity = {x: -this.invaderCurrentVelocity, y: 0};
  }
  //  If we've hit the bottom, it's game over.
  if (hitBottom) {
    this.lives = 0;
  }

  //  Check for rocket/UFO collisions.
  var ufo = this.ufo;
  var ubang = false;

  for (var j = 0; j < this.rockets.length; j++) {
    var rocket = this.rockets[j];

    if (rocket.x >= (ufo.x - ufo.width / 2) && rocket.x <= (ufo.x + ufo.width / 2) &&
      rocket.y >= (ufo.y - ufo.height / 2) && rocket.y <= (ufo.y + ufo.height / 2)) {

      //  Remove the rocket, set 'bang' so we don't process
      //  this rocket again.
      this.rockets.splice(j--, 1);
      ubang = true;
      game.score += this.config.pointsPerUfo;
      break;
    }
  }
  if (ubang) {
    this.ufo = 0;
    game.sounds.playSound('bang');
  }

  //  Check for rocket/invader collisions.
  for (i = 0; i < this.invaders.length; i++) {
    var invader = this.invaders[i];
    var bang = false;

    for (var j = 0; j < this.rockets.length; j++) {
      var rocket = this.rockets[j];

      if (rocket.x >= (invader.x - invader.width / 2) && rocket.x <= (invader.x + invader.width / 2) &&
        rocket.y >= (invader.y - invader.height / 2) && rocket.y <= (invader.y + invader.height / 2)) {

        //  Remove the rocket, set 'bang' so we don't process
        //  this rocket again.
        this.rockets.splice(j--, 1);
        bang = true;
        game.score += this.config.pointsPerInvader;
        break;
      }
    }
    if (bang) {
      this.invaders.splice(i--, 1);
      game.sounds.playSound('bang');
    }
  }

  //  Find all of the front rank invaders.
  var frontRankInvaders = {};
  for (var i = 0; i < this.invaders.length; i++) {
    var invader = this.invaders[i];
    //  If we have no invader for game file, or the invader
    //  for game file is futher behind, set the front
    //  rank invader to game one.
    if (!frontRankInvaders[invader.file] || frontRankInvaders[invader.file].rank < invader.rank) {
      frontRankInvaders[invader.file] = invader;
    }
  }

  //  Give each front rank invader a chance to drop a bomb.
  for (var i = 0; i < this.config.invaderFiles; i++) {
    var invader = frontRankInvaders[i];
    if (!invader) continue;
    var chance = this.bombRate * dt;
    if (chance > Math.random()) {
      //  Fire!
      this.bombs.push(new Bomb(invader.x, invader.y + invader.height / 2,
        this.bombMinVelocity + Math.random() * (this.bombMaxVelocity - this.bombMinVelocity)));
    }
  }

  //  Check for bomb/ship collisions.
  for (var i = 0; i < this.bombs.length; i++) {
    var bomb = this.bombs[i];
    if (bomb.x >= (this.ship.x - this.ship.width / 2) && bomb.x <= (this.ship.x + this.ship.width / 2) &&
      bomb.y >= (this.ship.y - this.ship.height / 2) && bomb.y <= (this.ship.y + this.ship.height / 2)) {
      this.bombs.splice(i--, 1);
      game.lives--;
      game.sounds.playSound('explosion');
    }
  }

  //  Check for invader/ship collisions.
  for (var i = 0; i < this.invaders.length; i++) {
    var invader = this.invaders[i];
    if ((invader.x + invader.width / 2) > (this.ship.x - this.ship.width / 2) &&
      (invader.x - invader.width / 2) < (this.ship.x + this.ship.width / 2) &&
      (invader.y + invader.height / 2) > (this.ship.y - this.ship.height / 2) &&
      (invader.y - invader.height / 2) < (this.ship.y + this.ship.height / 2)) {
      //  Dead by collision!
      game.lives = 0;
      game.sounds.playSound('explosion');
    }
  }

  //  Check for failure/game end
  if (game.lives <= 0) {
    game.moveToState(new GameOverState());
  }

  //  Check for victory
  if (this.invaders.length === 0) {
    game.score += this.level * 50;
    game.level += 1;
    game.moveToState(new LevelIntroState(game.level));
  }

  //display trophy
  switch (game.score) {
    case 100:
      document.getElementById('resume').style.opacity = 1;
      document.getElementById('starfield').style.opacity = 0;
      document.getElementById('gamecontainer').style.display = 'none';
      break;
    default:
  }
};


PlayState.prototype.draw = function (game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);

  //  Draw ship.
  var ship = new Image();
  ship.src = 'https://mickwhite.dev/retro-assets/assets/images/ship.png';
  ctx.drawImage(ship, this.ship.x - (this.ship.width / 2), this.ship.y - (this.ship.height / 2), this.ship.width, this.ship.height);

  //  Draw UFO.
  var ufo = new Image();
  ufo.src = 'https://mickwhite.dev/retro-assets/assets/images/ufo.png';
  ctx.drawImage(ufo, this.ufo.x - (this.ufo.width / 2), this.ufo.y - (this.ufo.height / 2), this.ufo.width, this.ufo.height);

  //  Draw invaders.
  var alien_1 = new Image();
  alien_1.src = 'https://mickwhite.dev/retro-assets/assets/images/alien2.png';
  for (var i = 0; i < this.invaders.length; i++) {
    var invader = this.invaders[i];
    ctx.drawImage(alien_1, invader.x - invader.width / 2, invader.y - invader.height / 2, invader.width, invader.height);
  }

  //  Draw bombs.
  ctx.fillStyle = '#ff0000';
  for (var i = 0; i < this.bombs.length; i++) {
    var bomb = this.bombs[i];
    ctx.fillRect(bomb.x - 2, bomb.y - 2, 2, 4);
  }

  //  Draw rockets.
  ctx.fillStyle = '#32cd32';
  for (var i = 0; i < this.rockets.length; i++) {
    var rocket = this.rockets[i];
    ctx.fillRect(rocket.x, rocket.y - 2, 2, 6);
  }

  //  Draw info.
  // var textYpos = game.gameBounds.top + ((game.height - game.gameBounds.bottom) / 2) - 64 / 2;
  var textYpos = game.gameBounds.bottom + 20;
  ctx.font = "10px arcade";
  ctx.fillStyle = '#ffffff';
  var info = "Score: " + game.score;
  ctx.textAlign = "left";
  ctx.fillText(info, game.gameBounds.left, textYpos);
  info = " Level: " + game.level;
  ctx.textAlign = "right";
  ctx.fillText(info, game.gameBounds.right, textYpos);

  //  If we're in debug mode, draw bounds.
  if (this.config.debugMode) {
    ctx.strokeStyle = '#ff0000';
    ctx.strokeRect(0, 0, game.width, game.height);
    ctx.strokeRect(game.gameBounds.left, game.gameBounds.top,
      game.gameBounds.right - game.gameBounds.left,
      game.gameBounds.bottom - game.gameBounds.top);
  }
};

PlayState.prototype.keyDown = function (game, keyCode) {

  if (keyCode == KEY_SPACE) {
    //  Fire!
    this.fireRocket();
  }
  if (keyCode == 80) {
    //  Push the pause state.
    game.pushState(new PauseState());
  }
};

PlayState.prototype.keyUp = function (game, keyCode) {

};

PlayState.prototype.fireRocket = function () {
  //  If we have no last rocket time, or the last rocket time
  //  is older than the max rocket rate, we can fire.
  if (this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (1000 / this.rocketMaxFireRate)) {
    //  Add a rocket.
    this.rockets.push(new Rocket(this.ship.x, this.ship.y - 12, this.config.rocketVelocity));
    this.lastRocketTime = (new Date()).valueOf();

    //  Play the 'shoot' sound.
    game.sounds.playSound('shoot');
  }
};

function PauseState() {

}

PauseState.prototype.keyDown = function (game, keyCode) {

  if (keyCode == 80) {
    //  Pop the pause state.
    game.popState();
  }
};

PauseState.prototype.draw = function (game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);

  ctx.font = "14px arcade";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("Paused", game.width / 2, game.height / 2);
  return;
};

/*
    Level Intro State

    The Level Intro state shows a 'Level X' message and
    a countdown for the level.
*/
function LevelIntroState(level) {
  this.level = level;
  this.countdownMessage = "3";
}

LevelIntroState.prototype.update = function (game, dt) {

  //  Update the countdown.
  if (this.countdown === undefined) {
    this.countdown = 3; // countdown from 3 secs
  }
  this.countdown -= dt;

  if (this.countdown < 2) {
    this.countdownMessage = "2";
  }
  if (this.countdown < 1) {
    this.countdownMessage = "1";
  }
  if (this.countdown <= 0) {
    //  Move to the next level, popping this state.
    game.moveToState(new PlayState(game.config, this.level));
  }
};

LevelIntroState.prototype.draw = function (game, dt, ctx) {

  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);

  ctx.font = "26px arcade";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("Level " + this.level, game.width / 2, game.height / 2);
  ctx.font = "18px arcade";
  ctx.fillText("Ready in " + this.countdownMessage, game.width / 2, game.height / 2 + 36);
  return;
};

/*
  Ship
  The ship has a position and that's about it.
*/
function Ship(x, y) {
  this.x = x;
  this.y = y;
  this.width = 20;
  this.height = 16;
}

/*
    Rocket

    Fired by the ship, they've got a position, velocity and state.

    */
function Rocket(x, y, velocity) {
  this.x = x;
  this.y = y;
  this.velocity = velocity;
}

/*
    Bomb
    Dropped by invaders, they've got position, velocity.
*/
function Bomb(x, y, velocity) {
  this.x = x;
  this.y = y;
  this.velocity = velocity;
}

/*
    Invader
    Invader's have position, type, rank/file and that's about it.
*/

function Invader(x, y, rank, file, type) {
  this.x = x;
  this.y = y;
  this.rank = rank;
  this.file = file;
  this.type = type;
  this.width = 18;
  this.height = 14;
}

// UFO
function Ufo(x, y) {
  this.x = x;
  this.y = y;
  this.width = 20;
  this.height = 16;
}

/*
    Game State

    A Game State is simply an update and draw proc.
    When a game is in the state, the update and draw procs are
    called, with a dt value (dt is delta time, i.e. the number)
    of seconds to update or draw).

*/
function GameState(updateProc, drawProc, keyDown, keyUp, enter, leave) {
  this.updateProc = updateProc;
  this.drawProc = drawProc;
  this.keyDown = keyDown;
  this.keyUp = keyUp;
  this.enter = enter;
  this.leave = leave;
}

/*

    Sounds

    The sounds class is used to asynchronously load sounds and allow
    them to be played.

*/
function Sounds() {

  //  The audio context.
  this.audioContext = null;

  //  The actual set of loaded sounds.
  this.sounds = {};
}

Sounds.prototype.init = function () {

  //  Create the audio context, paying attention to webkit browsers.
  context = window.AudioContext || window.webkitAudioContext;
  this.audioContext = new context();
  this.mute = false;
};

Sounds.prototype.loadSound = function (name, url) {

  //  Reference to ourselves for closures.
  var self = this;

  //  Create an entry in the sounds object.
  this.sounds[name] = null;

  //  Create an asynchronous request for the sound.
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.responseType = 'arraybuffer';
  req.onload = function () {
    self.audioContext.decodeAudioData(req.response, function (buffer) {
      self.sounds[name] = {buffer: buffer};
    });
  };
  try {
    req.send();
  } catch (e) {
    console.log("An exception occured getting sound. (Sound: " + name + " ). this is because " +
      "your source is local, not a webserver.");
    console.log(e);
  }
};

Sounds.prototype.playSound = function (name) {

  //  If we've not got the sound, don't bother playing it.
  if (this.sounds[name] === undefined || this.sounds[name] === null || this.mute === true) {
    return;
  }

  //  Create a sound source, set the buffer, connect to the speakers and
  //  play the sound.
  var source = this.audioContext.createBufferSource();
  source.buffer = this.sounds[name].buffer;
  source.connect(this.audioContext.destination);
  source.start(0);
};

/*
	Starfield lets you take a div and turn it into a starfield.

*/

//	Define the starfield class.
function Starfield() {
  this.fps = 30;
  this.canvas = null;
  this.width = 0;
  this.width = 0;
  this.minVelocity = 15;
  this.maxVelocity = 30;
  this.stars = 100;
  this.intervalId = 0;
}

//	The main function - initialises the starfield.
Starfield.prototype.initialise = function (div) {
  var self = this;

  //	Store the div.
  this.containerDiv = div;
  self.width = window.innerWidth;
  self.height = window.innerHeight;

  window.onresize = function (event) {
    self.width = window.innerWidth;
    self.height = window.innerHeight;
    self.canvas.width = self.width;
    self.canvas.height = self.height;
    self.draw();
  }

  //	Create the canvas.
  var canvas = document.createElement('canvas');
  div.appendChild(canvas);
  this.canvas = canvas;
  this.canvas.width = this.width;
  this.canvas.height = this.height;
};

Starfield.prototype.start = function () {

  //	Create the stars.
  var stars = [];
  for (var i = 0; i < this.stars; i++) {
    stars[i] = new Star(Math.random() * this.width, Math.random() * this.height, Math.random() * 3 + 1,
      (Math.random() * (this.maxVelocity - this.minVelocity)) + this.minVelocity);
  }
  this.stars = stars;

  var self = this;
  //	Start the timer.
  this.intervalId = setInterval(function () {
    self.update();
    self.draw();
  }, 1000 / this.fps);
};

Starfield.prototype.stop = function () {
  clearInterval(this.intervalId);
};

Starfield.prototype.update = function () {
  var dt = 1 / this.fps;

  for (var i = 0; i < this.stars.length; i++) {
    var star = this.stars[i];
    star.y += dt * star.velocity;
    //	If the star has moved from the bottom of the screen, spawn it at the top.
    if (star.y > this.height) {
      this.stars[i] = new Star(Math.random() * this.width, 0, Math.random() * 3 + 1,
        (Math.random() * (this.maxVelocity - this.minVelocity)) + this.minVelocity);
    }
  }
};

Starfield.prototype.draw = function () {

  //	Get the drawing context.
  var ctx = this.canvas.getContext("2d");

  //	Draw the background.
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, this.width, this.height);

  //	Draw stars.
  ctx.fillStyle = '#ffffff';
  for (var i = 0; i < this.stars.length; i++) {
    var star = this.stars[i];
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
};

function Star(x, y, size, velocity) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.velocity = velocity;
}



console.log('This project was an exercise in : \n1. using js canvas, \n 2. playing with javascript, \n 3. implementing CORS handler, \n and 4. just having a bit of fun.\n\nfeel free to have a play around...');

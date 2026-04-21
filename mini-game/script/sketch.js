let enemies, slain, jo;
let font, spriteSheet, spriteData, particles, progress;
let scene, introSpeechIndex, spawnBubbleX;

function preload() {
  //font files is taken from https://fonts.google.com/specimen/Press+Start+2P
  font = loadFont("assets/PressStart2P-Regular.ttf");
  //sprite sheet is taken from https://rvros.itch.io/animated-pixel-hero
  spriteSheet = loadImage("assets/adventurer-v1.5-Sheet.png");
  //sprite data is adapting JSON sprite data from https://editor.p5js.org/codingtrain/sketches/vhnFx1mml 
  spriteData = loadJSON("assets/sprites/sprite-data.json");
}
 
function setup() {
    createCanvas(windowWidth,windowHeight);
    imageMode(CENTER); //to make it easy to positioning sprite based character
    background(0);

    textFont(font); //set font to loaded font

    scene = "PLAY"; //Available scene: INTRO, PLAY, END
    introSpeechIndex = 0; //utilities for speech sequence in intro
    spawnBubbleX = width+100; //helper for moving a bubble in intro scene

    enemies = new Enemies(); //initiate enemies engine
    slainLimit = 1; //set how much enemies need to be slain for "END"

    jo = new Player(100, height/2, spriteSheet, spriteData, false); //initiate player
    particles = [];

    progress = [
      {letter: "H", obtain: false},
      {letter: "E", obtain: false},
      {letter: "L", obtain: false},
      {letter: "L", obtain: false},
      {letter: "O", obtain: false},
      {letter: "W", obtain: false},                      
      {letter: "O", obtain: false},
      {letter: "R", obtain: false},
      {letter: "L", obtain: false},
      {letter: "D", obtain: false}];
}

function draw() {
    background(0);
    
    switch(scene){
      case "INTRO":
        gameIntro();
        break;
      case "PLAY":
        gamePlay();
        break;
      case "END":
        gameEnd();
        break;
      default:
        //
    }
}

function gameIntro() {
  let introSpeech = ["Hi, my name is Agyl. I am a...", 
                     "Wait!\nThose evil bubbles are attacking me again!",
                     "Please! Help me in defense against them.\nSlain the required bubble so it could form \"HELLO WORLD\""];

  jo.show();
  setTimeout(jo.autoMove(5, width/2), 0);

  //
  if(jo.x >= width/2 && introSpeechIndex == 0){
    jo.setAnimationState("IDLING");
    jo.speech(introSpeech[introSpeechIndex]);
    setTimeout(() => introSpeechIndex = 1, 1000);
  }

  if(introSpeechIndex === 1){
    jo.setAnimationState("IDLING ATTACK");
    jo.speech(introSpeech[introSpeechIndex]);
    setTimeout(() => introSpeechIndex = 2, 2000);
    ellipse(spawnBubbleX, height/2+100, 50, 50);
    spawnBubbleX -= 20;
  }

  if(introSpeechIndex === 2){
    jo.speech(introSpeech[introSpeechIndex]);
    text("Press Spacebar to Continue", width/2, height/2 + 200);
  }

  if(introSpeechIndex === 2 && keyIsPressed){
    scene = "PLAY";
    jo.x = 100;
  }

}

function gamePlay() {
  //display hello world progress
  for(let i=0; i < progress.length; i++){
    push();
    textSize(30);
    textAlign(CENTER,CENTER);
    noStroke();
    if(!progress[i].obtain) { fill(255,255,255,100); }
    else { fill(255,255,255,255); }
    text(progress[i].letter, width/2-150+(i*35), height-50)
    pop();
  }
  
  enemies.run();
  jo.run();

  checkCollision(jo, enemies); //check collision between Jo and Enemies

  //slain bubbles information
  push ();
  fill(255);
  textAlign(RIGHT, TOP);
  textSize(15);
  text("Slain Bubbles:\n"+enemies.getSlain(), width-50, 30);
  pop ();

  //tips for controlling
  push ();
  fill(255);
  textAlign(LEFT, TOP);
  textSize(12);
  textLeading(25);
  text("Left Click for Ranged Attack\nRight Click for Meele Attack\nW to move Up, S to move Down", 50, 30);
  pop ();

  displayParticles();

  // end the game if number of bubbles is according to slain limit variable
  // if(enemies.getSlain() >= slainLimit){
  //   scene = "END";
  //   jo.x = width/2;
  // }

  //check the progress towards end
  let obtained = 0;
  for(let i=0; i < progress.length; i++){
    if(progress[i].obtain){
       obtained += 1;
    }
  }

  // end the game if hello world progress is filled
  if(obtained === 10){
    scene = "END";
    jo.x = width/2;
  } 
}

function gameEnd() {
  let endSpeech = ["All right! That's all of them... for now\n"+ 
                   "Anyway, my name is Agyl. I am a Creative Coder.\n"+
                   "Please, feel free to contact me!",
                   ];
  let endSpeechIndex = 0;

  jo.show();
  jo.x = width/2;
  jo.y = height/2;

  jo.setAnimationState("IDLING");
  jo.speech(endSpeech[endSpeechIndex]);
}

function mousePressed() {
  if(scene === "PLAY")
    jo.attack();
}

//function for initiating particles
function initParticles(x, y,type){
  for(let i=0; i < 30; i++){
    particles.push(new Particle(
      x, //lokasi x
      y,//lokasi y
      random(10,30),
      type //ukuran
    ));
  }
}

//function for displaying any particles added
function displayParticles(){
  for(let i=0; i < particles.length; i++){
    particles[i].show();
    particles[i].update();

    if(particles[i].checkDead()){
      particles.splice(i,1);
    }
  }
}

function checkCollision(jo, enemies) {
    let letter = "";
    let position;
    //check collision between bullets and enemies (Circle to Circle Collision)
    for(let i = 0; i < jo.attacks.bullets.length; i++){
        for(let j = 0; j < enemies.locations.length; j++){
          if(isCollide(jo.attacks.bullets[i], jo.attacks.bulletSize, enemies.locations[j], enemies.size[j]) ){
            letter = enemies.letter[j].toString();
            position = enemies.locations[j].copy();
            initParticles(position.x, position.y, letter);
            for(let i = 0; i < progress.length; i++){
              if(letter === progress[i].letter && !progress[i].obtain){
                progress[i].obtain = true;
                break;
              }
            }
            enemies.destroy(j);
            enemies.addSlain();
          }
        }
    }

    //check collision between blade waves and enemies (Circle to Circle Collision)
    for(let i = 0; i < jo.attacks.blades.length; i++){
        for(let j = 0; j < enemies.locations.length; j++){
          if(isCollide(jo.attacks.blades[i], jo.attacks.bladeSize, enemies.locations[j], enemies.size[j]) ){
            letter = enemies.letter[j].toString();
            position = enemies.locations[j].copy();
            initParticles(position.x, position.y, letter);
            for(let i = 0; i < progress.length; i++){
              if(letter === progress[i].letter && !progress[i].obtain){
                progress[i].obtain = true;
                break;
              }
            }
            enemies.destroy(j);
            enemies.addSlain();
          }
        }
    }

    //check collision between player and enemies (Rectangle to Circle collision)
    for(let i = 0; i < enemies.locations.length; i++){
        if( jo.x + 15 >= enemies.locations[i].x && 
            jo.x - 15 <= enemies.locations[i].x &&
            jo.y + 50 >= enemies.locations[i].y &&
            jo.y - 50 <= enemies.locations[i].y) {
            jo.gotHit();
            enemies.destroy(i);
        }
    }
}

//helper function check circle to circle collision
//adapted from http://www.jeffreythompson.org/collision-detection/circle-circle.php
function isCollide(posA, sizeA, posB, sizeB) {
    var distance = dist(posA.x, posA.y, posB.x, posB.y);
    var collide = false;
    if( distance <= sizeA/2 + sizeB/2 ){
      collide = true;
    }
    return collide;
}
p5.disableFriendlyErrors = true;

const circleArts = [];
const particles = [];
let minSize, maxSize, nums, hues, art, particle;
let bg;

const vector = (x, y) => ({x, y});

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB,360,100,100,100);
  angleMode(DEGREES);

  minSize = 50;
  maxSize = minSize * 2;
  nums = 20;
  hues = color(rand(360),
               100,
               100,
               randBetween(50,75));
  let hueValue = hue(hues);
  if( hueValue <= 180 ){
      bg = color('black');
  } else {
      bg = color('white');
  }

  for(let i = 0; i < nums; i++){
    art = new CircleArt();
    art.init(randBetween(minSize,width-minSize),
             randBetween(minSize,height-minSize),
             randBetween(minSize,maxSize), 
             randBetween(1,3),
             hues);
    circleArts.push(art);
  }
}

function draw() {
  background(bg);

  if(circleArts.length === 0){
    for(let i = 0; i < nums; i++){
        art = new CircleArt();
        art.init(randBetween(minSize,width-minSize),
                 randBetween(minSize,height-minSize),
                 randBetween(minSize,maxSize), 
                 randBetween(1,3),
                 hues);
        circleArts.push(art);
      }
  }
  
  for(let i = 0; i < circleArts.length; i++){
    circleArts[i].run();
    
    if(circleArts[i].isDead()){
        circleArts.splice(i,1);
    }
  }

  if(particles.length > 0){
    displayParticles();
  }
  

//   displayFPS();
}

function displayFPS(){
    let fps = frameRate();
    fill(255);
    stroke(0);
    text("FPS: " + fps.toFixed(2), 10, height - 10);
}

function rand(max){
  return Math.floor(Math.random() * max);
}

function randBetween(min, max){
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function CircleArt() {}
CircleArt.prototype = {
    init(x, y, size, type, colour) {
        this.position = vector(x, y);
        this.oriVelX = random(-2, 2);
        this.oriVelY = random(-2, 2);
        this.velocity = vector(this.oriVelX, this.oriVelY);
        this.type = type;
		this.d = size;
		this.oriSize = this.d;
		this.r = this.d / 2;
		this.colour = colour;
		this.oriColor = this.colour;
		this.gap = 15;
        this.hovered = false;
        this.dead = false;
    },
    run() {
        this.move();
        this.edges();
        this.display();
        this.hover();
        this.update();
    },
    display () {
        if (this.type === 1) {
            push();
            noStroke();
            fill(this.colour);
            ellipse(this.position.x, this.position.y, this.d, this.d);
            pop();
        }

        else if (this.type === 2) {
            push();
            stroke(this.colour);
            strokeWeight(3);
            noFill();
            for (let i = 0; i <= this.d; i += this.gap) {
                ellipse(this.position.x, this.position.y, i, i);
            }
            pop();
        }

        else if (this.type === 3) {
            push();
            noStroke();
            fill(this.colour);

            for (let i = 0; i <= this.d / this.gap; i++) {
                var r = this.gap / 2;
                var circ = 2 * PI * (i * r);
                var n = circ / r;
                var ang = floor(360.0 / n);
                for (let a = 0; a < 360; a += ang) {
                    var x_dot = this.position.x + (i * r) * cos(a);
                    var y_dot = this.position.y + (i * r) * sin(a);
                    ellipse(x_dot, y_dot, 5);
                }
            }
            pop();
        }
    },
    move() {
        this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
    },
    update() {
        if(this.d <= 0){
            
        }
    },
    edges(){
        if (this.position.x > width - this.r ||
            this.position.x < this.r) {
            this.oriVelX *= -1;    
            this.velocity.x *= -1;
        }
        if (this.position.y > height - this.r ||
            this.position.y < this.r) {
            this.oriVelY *= -1;    
            this.velocity.y *= -1;
        }
    },
    hover () {
        let d = dist(this.position.x, this.position.y, mouseX, mouseY);
        if (d <= this.r && this.d > 0) {
            this.hovered = true;
            let checkBg = brightness(bg);
            if( checkBg >= 100){
                this.colour = color(360, 0, 0, 75);
            } else {
                this.colour = color(360, 0, 100, 75);
            }
            
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.d = this.d - 2;
            if(this.d <= 0 && !this.dead) {
                this.dead = true;
                initParticles(this.position.x, this.position.y, this.type, this.oriColor);
            }
        } 
        else if(this.hovered && this.d >= 1) {
            this.colour = this.oriColor;
            this.velocity.x = this.oriVelX;
            this.velocity.y = this.oriVelY;
            this.d = this.oriSize;
            this.hovered = false;
        }
    },
    isDead (){
        return this.dead;
    }
}

function Particle() {}
Particle.prototype = {
    init(x, y, type, colour) {
        this.pos = vector(x, y);
        this.vel = vector(random(-7,7), random(-7,7));
        this.life = 100;
        this.dead = false;
        let diam = randBetween(5,50);
        this.size = diam;
        this.oriSize = diam;
        this.type = type;
        h = hue(colour);
        s = saturation(colour);
        b = brightness(colour);
        a = alpha(colour);
        this.colour = color(h,s,b,a);
        
    },
    show() {
        switch(this.type){
            case 1:
                push();
                noStroke();
                fill(this.colour);
                ellipse(this.pos.x, this.pos.y, this.size, this.size);
                pop();
                break;
            case 2:
                push();
                noFill();
                strokeWeight(3);
                stroke(this.colour);
                ellipse(this.pos.x, this.pos.y, this.size, this.size);
                pop();
            break;
            case 3:
                push();
                // noStroke();
                // fill(this.colour);
                // ellipse(this.pos.x, this.pos.y, 10, 10);
                noFill();
                strokeWeight(7);
                stroke(this.colour);
                point(this.pos.x, this.pos.y);
                pop();
            break;
            default:
                push();
                noFill();
                stroke(this.colour);
                strokeWeight(3);
                point(this.pos.x, this.pos.y);
                pop();
        }
    },
    update() {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.life -= 1;
        this.size = map(this.life, 0, 100, 0, this.oriSize);

        if(this.life <= 0){
            this.dead = true;
        }
        if(this.pos.x > width+this.size || this.pos.x < -this.size ||
            this.pos.y > height+this.size || this.pos.y < -this.sise){
                this.dead = true;
        }
    },
    isDead() {
        return this.dead;
    }
}

function initParticles(x, y, type, colour) {
    for(let i = 0; i < 50; i++){
        particle = new Particle();
        particle.init(x, y, type, colour);
        particles.push(particle);
    }
}

function displayParticles(){  
    for(let i = 0; i < particles.length; i++){
      particles[i].show();
      particles[i].update();

      if(particles[i].isDead()){
        particles.splice(i,1);
      }
    }
  }

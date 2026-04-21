//Separate class for attacking system of Player
//adapted from BulletSystem.js from https://editor.p5js.org/Gyl/sketches/2ItdO9svk

class AttackSystem {
    //necessary variables and array for attack system
    constructor(x, y){
      this.bullets = [];
      this.bulletsVelocity = 10;
      this.bulletSize = 10;
      this.blades = [];
      this.bladeWaveVelocity = 5;
      this.bladeSize = 150;
    }
  
    //run all the required function for attacking
    run(){
        this.showBullets();
        this.moveBullets();
        this.bulletsOut();
        this.showBlade();
        this.bladeWave();
        this.sheathBlade();
    }

    //initiate shoot attack type by make a "bullet" object
    shoot(x, y){
        let bullet = {x: x, y: y};
        this.bullets.push(bullet);
    }
  
    //draws all bullets
    showBullets(){
        push();
        noStroke();
        fill(255);
        for (var i = 0; i < this.bullets.length; i++){
            ellipse(this.bullets[i].x, this.bullets[i].y, this.bulletSize, this.bulletSize);
        }
        pop();
    }
  
    //updates the location of all bullets
    moveBullets(){
      for (var i = 0; i < this.bullets.length; i++){
        this.bullets[i].x += this.bulletsVelocity;
      }
    }
  
    //check if bullets leave the screen and remove them from the array
    bulletsOut(){
        for (var i = 0; i < this.bullets.length; i++){
          if(this.bullets[i].x > width+this.bulletSize){
            this.bullets.splice(i,1);
          }
        }
    }

    //initiate shoot attack type by make a "blade" object
    melee(x, y){
        let blade = { x: x, y: y, ori: x };
        this.blades.push(blade);
    }

    //show blade "wave" in red with a bit transparency
    showBlade(){
        push();
        fill(255,0,0,150);
        noStroke();
        for (var i = 0; i < this.blades.length; i++){
            arc(this.blades[i].x, this.blades[i].y, this.bladeSize, this.bladeSize, radians(-100), radians(100));
        }
        pop();
    }

    //move the blade as a "blade wave" that move slowly
    bladeWave(){
        for (var i = 0; i < this.blades.length; i++){
          this.blades[i].x += this.bladeWaveVelocity;
        }
    }

    //remove the blade wave after certain distance
    sheathBlade() {
        for (var i = 0; i < this.blades.length; i++){
            if(this.blades[i].x > this.blades[i].ori + 50){
                this.blades.splice(i,1);
            }
        }
    }
  }
  
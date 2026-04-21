class Particle {

   constructor(x, y, size, type){
     this.dead = false;
     this.pos = createVector(x, y);
     this.vel = createVector(random(-5,5), random(-5,5));
     this.size = size;
     this.life = 100;
     this.type = type;
   }

   show(){
       if(!this.dead){
        // this.rectangleParticle();
        this.letterParticle(this.type);
       }
   }

   rectangleParticle(){
      rectMode(CENTER);
      push();
      noFill();
      strokeWeight(3);
      stroke(255);
      rect(this.pos.x, this.pos.y, this.size, this.size);      
      pop();
   }

   letterParticle(type){
      push();
      textSize(this.size);
      textAlign(CENTER,CENTER);
      fill(255);
      noStroke();
      text(type,this.pos.x+2,this.pos.y);
      pop();
   }

   update(){
      this.pos.add(this.vel);
      this.life -= 1;
      this.size = map(this.life, 0, 100, 0, 30);

      if(this.life <= 0){
          this.dead = true;
      }
      if(this.pos.x > width+this.size || this.pos.x < -this.size ||
         this.pos.y > height+this.size || this.pos.y < -this.sise){
             this.dead = true;
      }
      
   }

   checkDead(){
       return this.dead;
   }
}
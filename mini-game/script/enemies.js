//Separate class for attacking system of Player
//adapted from AsteroidSystem.js from https://editor.p5js.org/Gyl/sketches/2ItdO9svk

class Enemies {
    //creates arrays to store each enemies data
    constructor(){
      this.locations = []; //locations of enemies
      this.velocities = [];//move velocity of enemies
      this.size = []; //size of enemies
      this.color = [];//color of enemies
      this.letter = [];
      this.slain = 0; //variable for counting slain enemies
      this.particles = [];
    }
    
    //function for running enemies system
    run(){
        this.spawn();
        this.move();
        this.show();
    }
  
    // spawns enemies at random intervals from outside of righmost edge of windows
    spawn(){
      let letters = ["H","E","L","O","W","R","D"];
      if (random(1) < 0.01){
        //random spawn location in vertical term within window height with horizontal location is fixed
        this.locations.push(new createVector(width+100, random(50, height-50)));
        //set velocities of enemies between 3 and 7 to the left so enemies have various speed
        this.velocities.push(new createVector(random(-7, -3), 0));
        //randomize size of the enemies between 30 and 100
        this.size.push(random(40,100));
        //randomize color of the each enemies
        this.color.push(color(random(255),random(255),random(255), 100));
        this.letter.push(letters[ Math.floor(random(0,7)) ]);
      }
    }
  
    //moves all enemies
    move(){
      //for each enemies, move according to their respective speed
      for (var i = 0; i < this.locations.length; i++){
        this.locations[i].add(this.velocities[i]);
      }

      //destroy enemies if dissapear at the leftmost edge of windows to conserve memory & performance
      for (var i = 0; i < this.locations.length; i++){
        if( this.locations.x <= -100 ){
            this.destroy(i);
        }
      }
    }
  
    //draws all enemies based on its location, size, and color
    show(){
      push();
      stroke('#ffffff');
      strokeWeight(3);
      for (var i = 0; i < this.locations.length; i++){
        fill(this.color[i]);
        ellipse(this.locations[i].x, this.locations[i].y, this.size[i], this.size[i]);
        push();
        fill(255);
        noStroke();
        textSize(map(this.size[i],40,100,20,40));
        textAlign(CENTER,CENTER);
        text(this.letter[i], this.locations[i].x+2, this.locations[i].y );
        pop();
      }
      pop();
    }
  
    //destroys all data associated with the enemies at certain index
    destroy(index){
      this.locations.splice(index,1);
      this.velocities.splice(index,1);
      this.size.splice(index,1);
      this.color.splice(index,1);
      this.letter.splice(index,1);
    }

    getSlain(){
      return this.slain;
    }

    addSlain(){
      this.slain += 1;
    }
}


  
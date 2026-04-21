//Separate class for attacking system of Player
//Basic behavior is adapted from Spaceship.js from https://editor.p5js.org/Gyl/sketches/2ItdO9svk
//Sprite animation implementation is adapted from https://editor.p5js.org/codingtrain/sketches/vhnFx1mml 

class Player {
    //necessary data for player: position and attack system
    //attack system required because there are more than one form of attack
    constructor(x, y, spriteSheet, spriteData, hitbox){
        this.x = x;
        this.y = y;
        this.spriteSheet = spriteSheet;
        this.spriteData = spriteData;
        this.animationState = "RUNNING"; //possible value: IDLING, IDLING ATTACK, RUNNING, ATTACKING
        this.hit = false;
        this.hitbox = hitbox;
        this.attacks = new AttackSystem(this.x, this.y);

        //Setting up Sprites Animation for each character animation state
        //using Sprite class, Sprite Sheet Image, and Sprite Data (JSON)
        //Idle while standing
        let idleFrames = this.spriteData.idlingFrames;
        let idleAnimation = [];
        for (let i = 0; i < idleFrames.length; i++) {
            let pos = idleFrames[i].position;
            let img =  this.spriteSheet.get(pos.x, pos.y, pos.w, pos.h);
            idleAnimation.push(img);
        }
        this.idling = new Sprite(idleAnimation, 0.1);

        //Idle while readying attack
        let idleAttackFrames = this.spriteData.idlingAttackFrames;
        let idleAttacAnimation = [];
        for (let i = 0; i < idleAttackFrames.length; i++) {
            let pos = idleAttackFrames[i].position;
            let img =  this.spriteSheet.get(pos.x, pos.y, pos.w, pos.h);
            idleAttacAnimation.push(img);
        }
        this.idlingAttack = new Sprite(idleAttacAnimation, 0.1);

        //Running when moving
        let runFrames = this.spriteData.runningFrames;
        let runAnimation = [];
        for (let i = 0; i < runFrames.length; i++) {
            let pos = runFrames[i].position;
            let img =  this.spriteSheet.get(pos.x, pos.y, pos.w, pos.h);
            runAnimation.push(img);
        }
        this.running = new Sprite(runAnimation, 0.1);

        //Attacking using sword
        let attackFrames = this.spriteData.attackingFrames;
        let attackAnimation = [];
        for (let i = 0; i < attackFrames.length; i++) {
            let pos = attackFrames[i].position;
            let img =  this.spriteSheet.get(pos.x, pos.y, pos.w, pos.h);
            attackAnimation.push(img);
        }
        this.attacking = new Sprite(attackAnimation, 0.1);
    }

    //run all the required function for player
    run(){
        this.show();
        this.move();
        this.attacks.run();
    }

    //setter for setting animation
    setAnimationState(state) {
        this.animationState = state;
    }

    show(){
        //drawing basic shape of player using sprites
        if(this.spriteSheet) {
            switch(this.animationState) {
                case "IDLING":
                    this.idling.show(this.x, this.y);
                    this.idling.animate();
                    break;
                case "IDLING ATTACK":
                    this.idlingAttack.show(this.x, this.y);
                    this.idlingAttack.animate();
                    break;
                case "RUNNING":
                    this.running.show(this.x, this.y);
                    this.running.animate();
                    break;
                case "ATTACKING":
                    this.attacking.show(this.x, this.y);
                    this.attacking.animate();
                default:
                    break;
            }
            
        }

        else { //if there is no sprite available, use basic geometric shapes for player sprites
            if(!this.hit){
                push();
                stroke(255);
                strokeWeight(2);
                fill(0,0,255);
                ellipse(this.x, this.y + 15, 30,70); //body
                ellipse(this.x, this.y - 35, 30,30); //head
                pop();
            }
    
            //draw player as red color if got hit
            if(this.hit){
                push();
                stroke(255);
                strokeWeight(2);
                fill(255,0,0);
                ellipse(this.x, this.y + 15, 30,70); //body
                ellipse(this.x, this.y - 35, 30,30); //head
                pop();
                setTimeout(() => {
                    this.hit = false;
                }, 3000)
            }
            
            //drawing hit box for collision detection purpose if hitbox parameter is set true
            if(this.hitbox){
                push();
                fill(255,0,0,100);
                rectMode(CENTER);
                rect(this.x, this.y, 35, 100);
                pop();
            } 
        }
        
    }

    //function for moving the player - only vertical
    //also limit the movement so player won't move outside of window
    move(){
        if (keyIsDown(UP_ARROW) || keyIsDown(87)){ this.y -= 8; }
        if(this.y <= 50) { this.y = 50; }

        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)){ this.y += 8; }
        if(this.y >= height-50) { this.y = height-50; }
    }

    //function to check condition if player just got hit
    gotHit(){
        if(!this.hit){
            this.hit = true;
        }
        push();
        fill(255);
        textSize(50);
        textAlign(CENTER,CENTER);
        text('HIT', this.x, this.y);
        pop();
    }

    //function for attacking by using mouse button
    //left click for ranged attack, right click for melee attack
    attack(){
        let attacking = false;
        this.setAnimationState("IDLING ATTACK");

        if (mouseIsPressed) {
            if(mouseButton === LEFT){
                this.attacks.shoot(this.x, this.y);
                this.setAnimationState("IDLING ATTACK");
            }

            if(mouseButton === RIGHT){
                document.oncontextmenu = function() { return false; } //prevent right-click menu
                this.setAnimationState("ATTACKING");
                this.attacks.melee(this.x, this.y);
                //set animation to idling again so attacking animation not looping
                setTimeout(() => {
                    this.setAnimationState("IDLING ATTACK");
                }, 450);
            }
        }
    }
    
    //display big text as player "speech"
    speech(content) {
        let talk = content;
        fill(255);
        textAlign(CENTER,CENTER);
        textSize(20);         
        text(talk, width/2, 100);
    }

    //move the character automatically - still buggy if move from right to left
    autoMove(speed, to) {
        if (this.x > to){
            this.x -= speed;
        } else if (this.x >= to) {
            this.x = to;
        }
        if(this.x < to) {
            this.x += speed;
        } else if (this.x <= to) {
            this.x = to;
        }
    }
}
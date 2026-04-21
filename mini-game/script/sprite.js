class Sprite {
    constructor(animation, speed) {
      this.animation = animation;
      this.w = this.animation[0].width;
      this.len = this.animation.length;
      this.speed = speed;
      this.index = 0;
    }
  
    show(x, y) {
     this.x = x;
     this.y = y;
      let index = floor(this.index) % this.len;
      push ();
        translate (this.x, this.y);
        scale (3);
        image(this.animation[index], 0, 0);
      pop ();
    }
  
    animate() {
      this.index += this.speed;
    }
}
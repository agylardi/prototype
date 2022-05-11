let slider1;
let slider2;

let imgInput;
let img;
let adam;

function setup(){
	createCanvas(1080,1080);

  	slider1 = createSlider(6, 30, 8);
  	slider1.position(10, 10);
  	slider1.style('width', '80px');
  	slider2 = createSlider(0, 255, 200);
  	slider2.position(10, 50);
  	slider2.style('width', '80px');
    imgInput = createFileInput(handleFile);
	imgInput.position(10 ,90);
}

function draw(){
	background(200);

	if(img){
        adam = img;
        // print(adam);
        // image(adam,0,0,640,640);
        // loadPixels();
	    adam.loadPixels();
		let hexSide = slider1.value();
		let n = width/(hexSide*1.5);
		let m = height/(hexSide*sqrt(3)/4);
		let contrast = slider2.value();

		for( j = 0; j < m; j+=2){
			for( i = 0; i <= n; i++){

				let x = i*hexSide*1.5;
				let y = j*hexSide*sqrt(3)/2+(hexSide*sqrt(3)/2*(pow(-1,i)/2+.5));
				let xPixel = floor(x/width*adam.width);
				let yPixel = floor(y/width*adam.width);
				let pixelIndex = (xPixel+yPixel*adam.width)*4;
				let r = adam.pixels[pixelIndex+0]+100;
				let g = adam.pixels[pixelIndex+1]+100;
				let b = adam.pixels[pixelIndex+2]+100;
				let avg = (r+g+b)/3;

				if( avg > contrast ){
                    fill(255);
                    stroke(255);
                } else {
                    fill(0);
                    stroke(0);
                }
				// strokeWeight(2);
				noStroke();
				hexagon(x,y,hexSide);
			}
		}
	}
}

function hexagon(x,y,side){
	beginShape()
	angleMode(DEGREES)
	for( a = 0; a < 360; a+=60){
        vertex(side*cos(a)+x, side*sin(a)+y);
    }
	endShape(CLOSE)
}

function handleFile(file) {
    print(file);
    if (file.type === 'image') {
        img = loadImage(file.data);
    } else {
        img = null;
    }
}


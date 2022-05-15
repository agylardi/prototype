let mic;
let volHistory = [];
var angle = 0;
var state = "";
let track;
let tracksArray = [];
let btnImage1, btnImage2;
let alphaSlider;
let timer;
const frate = 30; // frame rate

function preload() {
    HME.createH264MP4Encoder().then(enc => {
      encoder = enc
      encoder.outputFilename = 'test'
      encoder.width = 600
      encoder.height = 480
      encoder.frameRate = frate
      encoder.kbps = 5000 
      encoder.groupOfPictures = 10 
      encoder.initialize()
    })
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  imageMode(CENTER);
  frameRate(frate);
  mic = new p5.AudioIn();
  mic.start();
  btnImage1 = createImg("./images/recordbutton.png","");
  btnImage1.position(0.4*width-125, 0.8*height);
  btnImage2 = createImg("./images/savebutton.png","");
  btnImage2.position(0.6*width-125, -height);
  btnImage2.attribute('disabled','')
  track = createTrack();
  print(track);
  alphaSlider = createSlider(0,255,12);
  alphaSlider.position(width/2-50,20);
  timer = 60;
}

function handleTrackButtonClick(trackObject) {
  if (trackObject.state === "idle" && mic.enabled) {
    getAudioContext().resume();
    trackObject.recorder.record(trackObject.soundFile);
    state = "recording";
    trackObject.state = "recording";
    btnImage1.elt.src  = "./images/stopbutton.png"; 
    btnImage1.position(0.4*width-125, 0.8*height);
    btnImage2.position(0.6*width-125, -height);
  } else if (trackObject.state === "recording") {
    trackObject.recorder.stop();
    state = "stopped";
    trackObject.state = "stopped";
	  btnImage1.elt.src  = "./images/playbutton.png";
    btnImage1.position(0.4*width-125, 0.8*height);
    btnImage2.position(0.6*width-125, 0.8*height);
  } else if (trackObject.state === "stopped") {
    trackObject.soundFile.loop();
    state = "playing";
    trackObject.state = "playing";
    btnImage1.elt.src  = "./images/stopbutton.png";
    btnImage1.position(0.4*width-125, 0.8*height);
    btnImage2.position(0.6*width-125, 0.8*height);
  } else if (trackObject.state === "playing") {
    trackObject.soundFile.stop();
    state = "stopped";
    trackObject.state = "stopped";
    btnImage1.elt.src  = "./images/playbutton.png";
    btnImage1.position(0.4*width-125, 0.8*height);
    btnImage2.position(0.6*width-125, 0.8*height);
  }
}

function createTrack() {
  const newTrackObject = {
    button: btnImage1,
    state: "idle",
    recorder: new p5.SoundRecorder(),
    soundFile: new p5.SoundFile()
  };
  
  btnImage1.mouseClicked(function() {
     handleTrackButtonClick(newTrackObject);
  });

  btnImage2.mouseClicked(function() {
     state = "saved";
     saveSound(newTrackObject.soundFile, 'mySound.wav');
     const anchor = document.createElement('a');
     anchor.href = URL.createObjectURL(newTrackObject.soundFile, { type: 'audio/wav' });
     anchor.download = newTrackObject.soundFile;
     anchor.click();
  });

  newTrackObject.recorder.setInput(mic);
  tracksArray.push(newTrackObject);
  
  return newTrackObject;
}

function draw() {
  
  alphaVal = alphaSlider.value();
  background(0, alphaVal);
  // background(51);
  let vol = mic.getLevel();
  push();
  translate(width/2, 0.4*height);
  r = random(0,229); 
  g = random(0,204); 
  b = random(0,255); 
  a = random(0,220); 
  fill(r, g, b, a);
  noStroke();
  
  if(state === "recording" || state === "playing"){
    volHistory.push(vol);
    beginShape();
    for (let i = 0; i < 360; i++) {
      stroke(255);
      strokeWeight(0.4);
      let r = map(volHistory[i], 0, 1, 10, 600);
      let x = r * cos(i);
      let y = r * sin(i);
      vertex(x, y);
    }
    endShape();
  }
  pop();

  if(state === "recording"){
    encoder.addFrameRgba(drawingContext.getImageData(0, 0, encoder.width, encoder.height).data);

    // fill(0);
    // rectMode(CENTER);
    // rect(0.9*width, 0.9*height, 100, 90);

    fill(255);
    textSize(50);
    textAlign(CENTER,CENTER);
    text(timer, 0.9*width, 0.9*height); 

    // passedTime = int(millis()/1000);
    // countDown = timer - passedTime;

    if (frameCount % frate == 0 && timer > 0){
      timer--;
    }

    if (timer == 0){
      track.recorder.stop();
      state = "stopped";
      track.state = "stopped";
      btnImage1.elt.src  = "./images/playbutton.png";
      btnImage1.position(0.4*width-125, 0.8*height);
      btnImage2.position(0.6*width-125, 0.8*height);
    }

    
  }

  if(state === "saved"){
     state = "stopped";
     btnImage1.position(0.4*width-125, 0.8*height);
     btnImage2.position(0.6*width-125, 0.8*height);

     encoder.finalize()
     const uint8Array = encoder.FS.readFile(encoder.outputFilename);
     const anchor = document.createElement('a')
     anchor.href = URL.createObjectURL(new Blob([uint8Array], { type: 'video/mp4' }))
     anchor.download = encoder.outputFilename
     anchor.click()
     encoder.delete()
  }

  if(volHistory.length > 360) {
    volHistory.splice(0,1);
  }
}

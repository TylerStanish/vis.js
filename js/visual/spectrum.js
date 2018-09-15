var lastProcess = Date.now()
var lastSpectrum = []
var prevPeak = -1
var coreAudio = require('node-core-audio')
var db = require('decibels');

function initSpectrumHandler(){
  // scriptProcessor.onaudioprocess = handleAudio
  let engine = coreAudio.createNewAudioEngine()

  const options = {
    inputChannels: 1,
    outputChannels: 1,
    inputDevice: 2
  }

  console.log('registered audioCallback');
  engine.setOptions(options)
  // THIS MIGHT BE IMPORTANT
  // analyzer.fftSize = 1024;
  engine.addAudioCallback(function(inputBuffer){
    // let spectrum = ft(inputBuffer[0])
    // console.log(inputBuffer);
    let decibels = inputBuffer[0].map((value) => {
      let d = db.fromGain(value);
      if(isNaN(d)){
        return -50;
      }else{
        return d;
      }
    })

    handleAudio(decibels);
    // handleAudio(inputBuffer[0]);
    // return inputBuffer;
  })
}

function handleAudio(inputBuffer){
  // don't do anything if the audio is paused
  // if(!isPlaying){
  //   return
  // }

  var now = Date.now()
  do{
    now = Date.now()
  }while(now - lastProcess < minProcessPeriod)
  lastProcess = Date.now()

  checkHideableText()

  // console.log('bin count',analyzer.frequencyBinCount);


  // var initialArray =  new Uint8Array(analyzer.frequencyBinCount);
  // var initialArray = inputBuffer;

  // var initialArray = Uint8Array.from(inputBuffer);
  // for(let i=0; i<inputBuffer.length; i++){
  //   inputBuffer[i] *= 100;
  // }
  var initialArray = new Uint8Array(inputBuffer);
  // analyzer.getByteFrequencyData(initialArray)
  var array = transformToVisualBins(initialArray)
  // console.log(array);
  ctx.clearRect(-ctx.shadowBlur, -ctx.shadowBlur, spectrumWidth + ctx.shadowBlur, spectrumHeight + ctx.shadowBlur)
  // if(song.getGenre() == 'ayy lmao'){
  //   handleRainbowSpectrum()
  // }
  ctx.fillStyle = 'orange' // bar color

  // array = new Uint8Array(63);
  // for(let i=0; i<array.length; i++){
  //   array[i] = -i;
  // }

  // for(let i=0; i<array.length; i++){
  //   array[i] *= -1;
  // }

  drawSpectrum(array)
  // requestAnimationFrame(() => handleAudio(inputBuffer));
}

var spectrumAnimation = 'phase_1'
var spectrumAnimationStart = 0

function drawSpectrum(array){
  if(isPlaying){
    updateParticleAttributes(array)

    if(lastSpectrum.length == 1){
      lastSpectrum = array
    }
  }

  var drawArray = isPlaying ? array : lastSpectrum
  array = getTransformedSpectrum(array)

  var now = Date.now()

  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = spectrumShadowBlur
  ctx.shadowOffsetX = spectrumShadowOffsetX
  ctx.shadowOffsetY = spectrumShadowOffsetY

  if(spectrumAnimation == 'phase_1'){
    var ratio = (now - started) / 500

    ctx.fillRect(0, spectrumHeight - 2 * resRatio, (spectrumWidth / 2) * ratio, 2 * resRatio)
    ctx.fillRect(spectrumWidth - (spectrumWidth / 2) * ratio, spectrumHeight - 2 * resRatio, (spectrumWidth / 2) * ratio, 2 * resRatio)

    if(ratio > 1){
      console.log('changed phases');
      spectrumAnimation = 'phase_2'
      spectrumAnimationStart = now
    }
  }else if(spectrumAnimation == 'phase_2'){
    var ratio = (now - spectrumAnimationStart) / 500

    ctx.globalAlpha = Math.abs(Math.cos(ratio * 10))

    ctx.fillRect(0, spectrumHeight - 2 * resRatio, spectrumWidth, 2 * resRatio)

    ctx.globalAlpha = 1

    if(ratio > 1){
      spectrumAnimation = 'phase_3'
      spectrumAnimationStart = now
    }
  }else if(spectrumAnimation == 'phase_3'){
    var ratio = (now - spectrumAnimationStart) / 1000

    // drawing pass
    for(var i = 0; i < spectrumSize; i++){
      var value = array[i]

      // Used to smooth transiton between bar & full spectrum (lasts 1 sec)
      if(ratio < 1){
        value = value / (1 + 9 - 9 * ratio)
      }

      if(value < 2 * resRatio){
        value = 2 * resRatio
      }

      ctx.fillRect(i * (barWidth + spectrumSpacing), spectrumHeight - value, barWidth, value, value)
    }
  }

  ctx.clearRect(0, spectrumHeight, spectrumWidth, blockTopPadding)
}

function updateParticleAttributes(array){
  var sum = 0
  for(var i = ampLower; i < ampUpper; i++){
    sum += array[i] / spectrumHeight
  }
  velMult = sum / (ampUpper - ampLower)
  particleSize = velMult
  velMult = Math.pow(velMult, particleExponent) * (1 - absMinParticleVelocity) + absMinParticleVelocity
  particleSize = (maxParticleSize - minParticleSize) * Math.pow(particleSize, particleSizeExponent) + minParticleSize
}

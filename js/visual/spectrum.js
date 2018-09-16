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

    // this inputDevice is from soundflower
    inputDevice: 2
  }

  console.log('registered audioCallback');
  engine.setOptions(options)
  // THIS MIGHT BE IMPORTANT
  // analyzer.fftSize = 1024;
  engine.addAudioCallback(function(inputBuffer){
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

  })
}

function handleAudio(inputBuffer){
  // commenting this, because we never play because stuck on loading, and I don't know how to get around this any other way
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

  var initialArray = new Uint8Array(inputBuffer);

  // analyzer.getByteFrequencyData(initialArray)

  var array = transformToVisualBins(initialArray)
  // console.log(array);
  ctx.clearRect(-ctx.shadowBlur, -ctx.shadowBlur, spectrumWidth + ctx.shadowBlur, spectrumHeight + ctx.shadowBlur)
  ctx.fillStyle = 'orange' // bar color

  drawSpectrum(array)
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

if (! window.AudioContext) {
	if (! window.webkitAudioContext) {
		alert('Could not get audio context! (Are you using IE?)');
	}
	window.AudioContext = window.webkitAudioContext;
}

var colors = {
	'EDM': '#C2C1C3',
	'House': '#EB8C00',
	'Drumstep': '#F22189',
	'Drum & Bass': '#F61A03',
	'Trance': '#007FE8',
	'Electro': '#E7CD00',
	'Glitch Hop': '#0C9758',
	'Nu Disco': '#1DAAB4',
	'Dubstep': '#961EEA',
	'Trap': '#8C0F29',
	'Future Bass': '#B8B8FF'
};

var context = new AudioContext();
var audioBuffer;
var sourceNode;
var analyser;
var javascriptNode;
var barWidth = 10;
var barMargin = 4;
var width = $(document).width() * 0.9;
width -= width % (barWidth + barMargin * 2)
var height = 325;

var velMult = 0.3;

var amplitudeScalar = 5; // the multiplier for the particle system velocity
var ampAnalysisStart = 0.02; // the start of the spectrum section used to determine the speed of the particles
var ampAnalysisLength = 0.15; // the length of the spectrum section used to determine the speed of the particles

//$(".content").hide();
$('#canvas').attr('width', width);
$('#canvas').attr('height', height);
var ctx = $("#canvas").get()[0].getContext("2d");

setupAudioNodes();
loadSound('music/' + file); //music file

function setupAudioNodes() {
	javascriptNode = context.createScriptProcessor(4096, 1, 1);
	javascriptNode.connect(context.destination);

	analyser = context.createAnalyser();
	analyser.smoothingTimeConstant = 0.8;
	analyser.fftSize = 2048;

	sourceNode = context.createBufferSource();
	sourceNode.connect(analyser);
	analyser.connect(javascriptNode);

	sourceNode.connect(context.destination);
}

function loadSound(url) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	request.onload = function() {
		context.decodeAudioData(request.response, function(buffer) {
			playSound(buffer);
		}, onError);
	}
	request.send();
}


function playSound(buffer) {
	sourceNode.buffer = buffer;
	sourceNode.start(0);
	//$(".content").show();
	$("#loading").hide();
}

function onError(e) {
	console.log(e);
}

javascriptNode.onaudioprocess = function() {
	var array =  new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(array);
	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = colors[genre] != undefined ? colors[genre] : colors['EDM']; //bar color
	drawSpectrum(array);
}

function drawSpectrum(array) {
	var sum = 0;
	for (var i = 0; i < array.length; i++){
		if (i == 0) {
			var value = array[i];
		}
		else if (i == array.length - 1) {
			var value = (array[i - 1] + array[i]) / 2;
		}
		else {
			var value = (array[i - 1] + array[i] + array[i + 1]) / 3;
		}
		value = Math.min(value + 1, height);
		if (i >= array.length * ampAnalysisStart && i < array.length * ampAnalysisLength) {
			sum += value / height;
		}
		ctx.fillRect(i * (barWidth + barMargin * 2), height - value, barWidth, height); //1st value = bar side margins
	}
	velMult = sum / (array.length * (ampAnalysisLength - ampAnalysisStart)) * amplitudeScalar;
};
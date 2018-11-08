var bgColor = '#222831';
var strokeColor = '#ff7657';
var strokeColorBg = '#424d5c';

var drawStructure = function(seq, alphabet, positions, width, height, radius, margin) {
	// Draw the structure of a given input sequence.
	$('.alphabet-element').remove();
	$('.struqture-element').remove();
	var nrConnections = seq.length - 1;
	var connectionCounts = {};
	for (var i = 0; i < seq.length - 1; i++) {
		var connection = seq.slice(i, i + 2);
		if (connection in connectionCounts) {
			connectionCounts[connection] += 1;
		} else {
			connectionCounts[connection] = 1;
		}
	}
	var baseWidth = 1;
	var dist;
	$.each(connectionCounts, function(key, value) {
		// Redraw the links between the alphabet elements, but adjust the line width by the
		// frequency of each link.
		var strokeWidth = Math.round(value / nrConnections * 100 * baseWidth);
		strokeWidth = strokeWidth === 0 ? 1 : strokeWidth;
		var connectionStart = key[0];
		var connectionEnd = key[1];
		var startPoint = [positions[connectionStart][0], positions[connectionStart][1]];
		var endPoint = [positions[connectionEnd][0], positions[connectionEnd][1]];
		var midpoint = findMidpoint(startPoint, endPoint);
		if (connectionStart !== connectionEnd) {
			//dist = 60;
			dist = Math.round(radius / 3);
			if (alphabet.indexOf(connectionStart) > alphabet.indexOf(connectionEnd)) {
				//dist = -60;
				dist = -dist;
			}
			var controlPoint = findControlPoint(startPoint, endPoint, midpoint, dist);
			svg.append('path')
				.attr('d', 'M' + startPoint[0] + ',' + startPoint[1] +
					' Q' + controlPoint[0] + ',' + controlPoint[1] +
					' ' + endPoint[0] + ',' + endPoint[1])
				.attr('stroke', strokeColor)
				.attr('fill', 'none')
				.attr('stroke-width', strokeWidth + 'px')
				.attr('class', 'struqture-element');
		} else {
			// Move the circle that visualizes self-links (e.g. AA) outwards along the line between
			// the plot's origin and the link start using vectors. See
			// https://math.stackexchange.com/a/175906 for a detailed explanation of the vector
			// math involved.
			dist = Math.round(radius / 3);
			var x0 = width / 2;
			var y0 = height / 2 + margin.top / 2;
			var x1 = startPoint[0];
			var y1 = startPoint[1];
			var xVector = x1 - x0;
			var yVector = y1 - y0;
			var normalizer = Math.sqrt(Math.pow(xVector, 2) + Math.pow(yVector, 2));
			xVector /= normalizer;
			yVector /= normalizer;
			var xCircle = x1 + dist * xVector;
			var yCircle = y1 + dist * yVector;
			svg.append('circle')
				.attr('cx', xCircle)
				.attr('cy', yCircle)
				.attr('r', dist)
				.attr('stroke', strokeColor)
				.attr('stroke-width', strokeWidth)
				.attr('fill', 'none')
				.attr('class', 'struqture-element');
		}
	});
	$.each(positions, function(key, value) {
		svg.append('circle')
			.attr('cx', value[0])
			.attr('cy', value[1])
			.attr('r', 25)
			.attr('fill', bgColor)
			.attr('stroke', 'none')
			.attr('class', 'alphabet-element');
		svg.append('text')
			.attr('x', value[0])
			.attr('y', value[1])
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'middle')
			.attr('class', 'alphabet-element')
			.attr('id', key)
			.text(key);
	});
};

var getConnections = function(x) {
	// Given an alphabet x, calculate all possible pairwise connections between the elements of
	// this alphabet.
	var result = [];
	for (var i = 0; i < x.length; i++) {
		var start = x[i];
		for (var j = 0; j < x.length; j++) {
			var end = x[j];
			result.push({start: start, end: end});
		}
	}
	return result;
};

var findControlPoint = function(a, b, m, d) {
	// Given two points A and B, the midpoint M between A and B, calculate the coordinates of the
	// control point that is needed to draw a symmetrical (hence M) cubic curve between A and B.
	// The distance d indicates how far away the control point has to be from M and influences the
	// curvature of the resulting path.
	var s = slope(a, b);
	var x, y, sPerpendicular;
	if (s === 0) {
		sPerpendicular = Math.PI / 2;
	} else if (s === Math.PI / 2) {
		sPerpendicular = 0;
	} else {
		sPerpendicular = -1 / s;
	}
	x = m[0] + d * Math.cos(sPerpendicular);
	y = m[1] + d * Math.sin(sPerpendicular);
	return [x, y];
};

var findMidpoint = function(a, b) {
	// Given two points A and B, find the point that is in the middle between both points.
	var x = (a[0] + b[0]) / 2;
	var y = (a[1] + b[1]) / 2;
	x = Math.round(x * 10) / 10;
	y = Math.round(y * 10) / 10;
	return [x, y];
};

var slope = function(a, b) {
	// Given two points A and B, calculate the slope of the line that connects both points.
	if (b[1] === a[1]) {
		return 0;
	}
	if (b[0] === a[0]) {
		return Math.PI / 2;
	} else {
		return (b[1] - a[1]) / (b[0] - a[0]);
	}
};

$(function() {
	var alphabet = ['A', 'T', 'C', 'G'];
	var width = $('.svg-container').width();
	var height = width;
	var radius = Math.round(width * 0.28);
	var margin = {top: 40, right: 0, left: 0, bottom: 0};
	console.log('radius = ' + radius);
	svg = d3.select('.svg-container')
		.append('svg')
			.attr('width', width)
			.attr('height', height + margin.top)
			.attr('text-rendering', 'geometricPrecision')
			.attr('font-family', 'arial')
			.attr('font-size', '12px')
			.attr('fill', '#eee');

	// Place the alphabet elements on a circle around the center of the SVG and calculate their
	// coordinates.
	var positions = {};
	$.each(alphabet, function(index, value) {
		var angle = index / (alphabet.length / 2) * Math.PI - 3 / 4 * Math.PI;
		var xPos = radius * Math.cos(angle);
		var yPos = radius * Math.sin(angle);
		xPos = Math.round(xPos * 10) / 10 + width / 2;
		yPos = Math.round(yPos * 10) / 10 + height / 2 + margin.top;
		positions[value] = [xPos, yPos];
	});

	// Generate a background image that shows all the possible pairwise connections between the
	// alphabet elements.
	var connections = getConnections(alphabet);
	var dist;
	$.each(connections, function(index, value) {
		var startPoint = [positions[value.start][0], positions[value.start][1]];
		var endPoint = [positions[value.end][0], positions[value.end][1]];
		var midpoint = findMidpoint(startPoint, endPoint);
		if (value.start !== value.end) {
			//var dist = 60;
			dist = Math.round(radius / 3);
			if (alphabet.indexOf(value.start) > alphabet.indexOf(value.end)) {
				//dist = -60;
				dist = -dist;
			}
			var controlPoint = findControlPoint(startPoint, endPoint, midpoint, dist);
			svg.append('path')
				.attr('d', 'M' + startPoint[0] + ',' + startPoint[1] +
					' Q' + controlPoint[0] + ',' + controlPoint[1] +
					' ' + endPoint[0] + ',' + endPoint[1])
				.attr('stroke', strokeColorBg)
				.attr('fill', 'none');
			
			// Show the control point.
			/*svg.append('circle')
				.attr('cx', controlPoint[0])
				.attr('cy', controlPoint[1])
				.attr('r', 5)
				.attr('fill', '#00ff00');*/
		} else {
			// Move the circle that visualizes self-links (e.g. AA) outwards along the line between
			// the plot's origin and the link start using vectors. See
			// https://math.stackexchange.com/a/175906 for a detailed explanation of the vector
			// math involved.
			dist = Math.round(radius / 3);
			var x0 = width / 2;
			var y0 = height / 2 + margin.top / 2;
			var x1 = startPoint[0];
			var y1 = startPoint[1];
			var xVector = x1 - x0;
			var yVector = y1 - y0;
			var normalizer = Math.sqrt(Math.pow(xVector, 2) + Math.pow(yVector, 2));
			xVector /= normalizer;
			yVector /= normalizer;
			var xCircle = x1 + dist * xVector;
			var yCircle = y1 + dist * yVector;
			svg.append('circle')
				.attr('cx', xCircle)
				.attr('cy', yCircle)
				.attr('r', dist)
				.attr('stroke', strokeColorBg)
				.attr('fill', 'none');
		}
	});

	// Add the alphabet elements on top (including a background circle to improve legibility).
	$.each(positions, function(key, value) {
		svg.append('circle')
			.attr('cx', value[0])
			.attr('cy', value[1])
			.attr('r', 25)
			.attr('fill', bgColor)
			.attr('stroke', 'none')
			.attr('class', 'alphabet-element');
		svg.append('text')
			.attr('x', value[0])
			.attr('y', value[1])
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'middle')
			.attr('class', 'alphabet-element')
			.attr('id', key)
			.text(key);
	});

	// Add arrows at the top of the figure to indicate the direction of the links.
	var xLeft = Math.round(width / 2 - 20);
	var xMiddle = Math.round(width / 2);
	var xRight = Math.round(width / 2 + 20);
	var y = 40;
	svg.append('path')
		.attr('d', 'M' + xLeft + ',' + y +
			' Q' + xMiddle + ',' + (y - 5) +
			' ' + xRight + ',' + y)
		.attr('stroke', strokeColorBg)
		.attr('fill', 'none')
		.attr('stroke-width', '1px');
	svg.append('path')
		.attr('d', 'M' + (xRight - 5) + ',' + (y - 5) + ' ' +
			xRight + ',' + y + ' ' +
			(xRight - 5) + ',' + (y + 5))
		.attr('stroke', strokeColorBg)
		.attr('fill', 'none')
		.attr('stroke-width', '1px')
		.attr('transform', 'rotate(8, ' + xRight + ', ' + y + ')');
	y = 60;
	svg.append('path')
		.attr('d', 'M' + xLeft + ',' + y +
			' Q' + xMiddle + ',' + (y + 5) +
			' ' + xRight + ',' + y)
		.attr('stroke', strokeColorBg)
		.attr('fill', 'none')
		.attr('stroke-width', '1px');
	svg.append('path')
		.attr('d', 'M' + (xLeft + 5) + ',' + (y + 5) + ' ' +
			xLeft + ',' + y + ' ' +
			(xLeft + 5) + ',' + (y - 5))
		.attr('stroke', strokeColorBg)
		.attr('fill', 'none')
		.attr('stroke-width', '1px')
		.attr('transform', 'rotate(8, ' + xLeft + ', ' + y + ')');

	// User interactions.
	$('.button--plot').on('click', function() {
		var seq = $('textarea').val().toUpperCase();
		seq = seq.replace(/[^ATCG]/g, '');
		if (seq !== '') {
			$('textarea').val(seq);
			$('.info').fadeTo(0, 0);
			drawStructure(seq, alphabet, positions, width, height, radius, margin);
		}
	});
	$('.button--example').on('click', function() {
		var seq = 'GGAGGGGAGAGACTCGCGCTCCGGGCTCAGCGTAGCCGCCCCGAGCAGGACCGGGATTCTCACTAAGCGGGCGCCGTCCTACGACCCCCGCGCGCTTTCAGGACCACTCGGGCACGTGGCAGGTCGCTTGCACGCCCGCGGACTATCCCTGTGACAGGAAAAGGTACGGGCCATTTGGCAAACTAAGGCACAGAGCCTCAGGCGGAAGCTGGGAAGGCGCCGCCCGGCTTGTACCGGCCGAAGGGCCATCCGGGTCAGGCGCACAGGGCAGCGGCGCTGCCGGAGGACCAGGGCCGGCGTGCCGGCGTCCAGCGAGGATGCGCAGACTGCCTCAGGCCCGGCGCCGCCGCACAGGGCATGCGCCGACCCGGTCGGGCGGGAACACCCCGCCCCTCCCGGGCTCCGCCCCAGCTCCGCCCCCGCGCGCCCCGGCCCCGCCCCCGCGCGCTCTCTTGCTTTTCTCAGGTCCTCGGCTCCGCCCCGCTCTAGACCCCGCCCCACGCCGCCATCCCCGTGCCCCTCGGCCCCGCCCCCGCGCCCCGGATATGCTGGGACAGCCCGCGCCCCTAGAACGCTTTGCGTCCCGACGCCCGCAGGTCCTCGCGGTGCGCACCGTTTGCGACTTGGTGAGTGTCTGGG';
		$('textarea').val(seq);
		$('.info').fadeTo(200, 1);
		drawStructure(seq, alphabet, positions, width, height, radius, margin);
	});
	$('textarea').keypress(function(e) {
		if (e.which === 13) {
			e.preventDefault();
			$('.button--plot').click();
		}
	});
});

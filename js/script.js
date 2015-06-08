// Initial setup
var preloader_width = 150; // Preloader width
var preloader_height = 4; // Preloader height
var preloader_color_fill = "#aabbcc"; // Preloader fill color 
var preloader_color_outline = "#aabbcc"; // Preloader outline color
var preloader_color_text = "#aabbcc"; // Preloader text color
var liquid_color = "#40d4ff"; // Color of animated liquid
var background_path = "images/background.png"; // Specify here path to your main background
var background_type = "stretched"; // Specify background type (can be "stretched", "fixed")
var background_pattern_usage = true; // Use pattern above main background (true, false)
var background_pattern_path = "images/pattern.png"; // Specify here path to your pattern
var background_pattern_alpha = 0.25; // Specify here alpha of your pattern (from 0 to 1)
var background_pattern_scale = 100; // Scale factor of your pattern (in percents)
var background_pattern_rotation = 0; // Rotation factor of your pattern
var logo_path = "images/logo.png"; // Specify here path to your logo
var logo_scale = 100; // Logo sale factor (in percents)
var logo_x = 0; // Logo correction factor for X-position (in pixels);
var logo_y = 0; // Logo correction factor for Y-position (in pixels);
var logo_url_enable = true; // Make logo clickable (true, false)  
var logo_url = "http://themeforest.net/user/Kontramax?ref=Kontramax"; // Specify URL when clicking on logo
var logo_url_target = "_self"; // Targeting (_blank, _self, _parent, _top)
var flickering = true; // Flickering (true, false)
var animated_scratches = true; // Animated scratches dust (true, false)

// Other variables
var canvas, stage, exportRoot;
var background, pattern, background_pattern, pattern_matrix, main, logo, loader, progress, textfield, logo_container, counter, description_txt, a_rnd, mask_mc;

// Resize event listener
window.addEventListener('resize', resize, false);

// Init handler
function init() {
	// Creating and resize stage
	canvas = document.getElementById("canvas");
	stage = new createjs.Stage(canvas);
	stage.canvas.width = window.innerWidth;
	stage.canvas.height = window.innerHeight;
	//exportRoot = new lib.index(); // Uncomment to display initial stage in Flash
	//stage.addChild(exportRoot); // Uncomment to display initial stage in Flash
		
	// Ticker
	createjs.Ticker.setFPS(12);
	createjs.Ticker.addListener(stage);
		
	// Files list to load 
	images = images||{};
	var manifest = [
		{src:background_path, id:"background"},
		{src:background_pattern_path, id:"background_pattern"},
		{src:logo_path, id:"logo"}
	];	
	
	// Creating progress bar and textfield
	progress = new createjs.Shape();
	progress.graphics.beginStroke(preloader_color_outline).drawRect(stage.canvas.width / 2 - preloader_width / 2, stage.canvas.height / 2, preloader_width, preloader_height);
	stage.addChild(progress);
		
	textfield = new createjs.Text("Loading 0%", "normal 22px Trebuchet MS", preloader_color_text);
	textfield.x = stage.canvas.width / 2;
	textfield.y = stage.canvas.height / 2 - 30;
	textfield.textAlign ="center";
	stage.addChild(textfield);
		
	// Add preloader, handlers and start loading
	loader = new createjs.LoadQueue(true); // false - tag loading, true - XHR loading, none - XHR+(tag)
	loader.onProgress = handleFileProgress;
	loader.onFileLoad = handleFileLoad;
	loader.onComplete = handleComplete;
	loader.loadManifest(manifest);	
}

// Progress bar
function handleFileProgress(event) {
	var percents = 100*event.loaded;
	//console.log(percents.toFixed() + "%");
	textfield.text = percents.toFixed() + "%";
	progress.graphics.clear();
	progress.graphics.beginStroke(preloader_color_outline).drawRect(stage.canvas.width / 2 - preloader_width / 2, stage.canvas.height / 2, preloader_width, preloader_height);
	progress.graphics.beginFill(preloader_color_fill).drawRect(stage.canvas.width / 2 - preloader_width / 2, stage.canvas.height / 2, preloader_width * event.loaded, preloader_height);
}

// On file load handler
function handleFileLoad(event) {
images[event.id] = event.result; 
}

// On load complete handler
function handleComplete(event) {
	// Remove preloader
	progress.graphics.clear();
	stage.removeChild(progress);
	stage.removeChild(textfield);
		
	// Add background
	background = new createjs.Bitmap(loader.getResult("background"));
	stage.addChild(background);
		
	// Add pattern above background
	if (background_pattern_usage) {
		background_pattern = new Image();
		background_pattern = loader.getResult("background_pattern");
		pattern = new createjs.Shape();
			
		// Scale and rotate pattern
		pattern_matrix = new createjs.Matrix2D;
		pattern_matrix.scale(background_pattern_scale / 100, background_pattern_scale / 100);
		pattern_matrix.rotate(background_pattern_rotation);
		stage.addChild(pattern);
	}

	// Add logo and "no-signal" picture to container with mask
	logo = new createjs.Bitmap(loader.getResult("logo"));
	logo.regX = logo.image.width / 2;
	logo.regY = logo.image.height / 2;	
	logo.scaleX = logo.scaleY = logo_scale/100;
	logo.x = logo.x + logo_x;
	logo.y = logo.y + logo_y;
	
	//Add "no signal" animation
	no_signal = new lib.no_signal();

	mask_mc = new lib.mask_mc();
	logo.mask = mask_mc.shape; // Add mask to logo...
	no_signal.mask = mask_mc.shape; // ... and no-signal pic

	logo_container = new createjs.Container();
	logo_container.addChild(mask_mc, logo, no_signal); // Add all to container
	stage.addChild(logo_container);
	logo_container.rotation = 15;
	
	if (logo_url_enable) {
		stage.enableMouseOver(); 
		mask_mc.cursor = "pointer"; // Hand cursor on mouse over
		mask_mc.onClick = handleLogoClick; // Clickable logo
	}
	
	// Add main animation from Flash
	main = new lib.main();
	stage.addChild(main);
	
	// Add scratches from Flash
	if (animated_scratches) {
		scratches = new lib.scratches();
		stage.addChild(scratches);
	}
	
	// Add jQuery countdown timer
	counter = new createjs.DOMElement(document.getElementById("counter"));
	description_txt = new createjs.DOMElement(document.getElementById("description_txt"));
	stage.addChild(counter, description_txt);

	// Start functions
	counter_start();
	resize();
	recolor_liquid();
	if (flickering) {
		createjs.Ticker.addEventListener("tick", tick);
		flickering_nosignal();
	} else { no_signal.alpha = 0; }
	
	loader.close();
	stage.update();
}

// Recolor liquid
function recolor_liquid() {
	var path = main.liquid_color; // Path to object in flash
	var w = path.nominalBounds.width;
	var h = path.nominalBounds.height;
	var r = hexToR(liquid_color);
	var g = hexToG(liquid_color);
	var b = hexToB(liquid_color);
	var recolor = new createjs.ColorFilter(0,0,0,1, r,g,b,0); // (red, green, blue, alpha)
	path.filters = [recolor];
	path.cache(0 - w / 2, 0 - h / 2, w, h);
	path.updateCache();
}

// Convert HEX to RGB
function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}

// Random elements flickering 
function tick(event) {
	logo.alpha = counter.alpha = description_txt.alpha = 1; // Reset
	a_rnd = Math.random() * 100;
	if (a_rnd.toFixed() <= 5) { logo.alpha = 0.6; }
	if (a_rnd.toFixed() == 31 | a_rnd.toFixed() == 32 | a_rnd.toFixed() == 95 | a_rnd.toFixed() == 96) { counter.alpha = 0.6;}
	if (a_rnd.toFixed() == 95 | a_rnd.toFixed() == 42 | a_rnd.toFixed() == 43) { description_txt.alpha = 0.6;}
}

// Flickering "no signal" picture
function flickering_nosignal() {
	var long_delay = Math.round(Math.random() * (3000 - 800)) + 800; // from 800 ms to 3000 ms
	
	setTimeout(function () {
		var short_delay = Math.round(Math.random() * (795 - 50)) + 50; // from 50 ms to 795 ms
		
		setTimeout(function () {
			no_signal.alpha = 0;
		}, short_delay);
		
		no_signal.alpha = 1;
		flickering_nosignal();
	}, long_delay);
}

// Open URL when click on logo
function handleLogoClick() {
	window.open(logo_url, logo_url_target, false);
}

// Resize browser event handler
function resize() {
	stage.canvas.width = window.innerWidth;
	stage.canvas.height = window.innerHeight;
	
	// Preloader text positioning
	if (textfield != null) {
		textfield.x = stage.canvas.width / 2;
		textfield.y = stage.canvas.height / 2 - 30;
	}
	
	// Main animation positioning
	main.x = stage.canvas.width / 2 - 40;
	main.y = stage.canvas.height / 2 - 10;
		
	// Logo positioning
	logo_container.x = main.x + 228;
	logo_container.y = main.y - 105;

	// Countdown timer positioning
	counter.x = main.x + 170;
	counter.y = - main.y + 133;
	
	// Text positioning
	description_txt.x = main.x - 430;
	description_txt.y = - main.y + 130;
	
	// Scratches positioning
	if (animated_scratches) {
		scratches.x = stage.canvas.width / 2;
		scratches.y = stage.canvas.height / 2;
	}
		
	// Background types
	if (background_type == "stretched") {
		background.scaleX = stage.canvas.width / background.image.width;
		background.scaleY = stage.canvas.height / background.image.height;
	}
	if (background_type == "fixed") {
		background.x = stage.canvas.width / 2 - background.image.width / 2 ;
		background.y = stage.canvas.height / 2 - background.image.height / 2 ;
	}
	
	// Resize background pattern
	if (background_pattern_usage) {
		draw_pattern();
	}
}

// Draw background pattern
function draw_pattern() {
	pattern.graphics.clear();
	pattern.graphics.beginBitmapFill(background_pattern, "repeat", pattern_matrix).drawRect(0, 0, stage.canvas.width, stage.canvas.height);
	pattern.alpha = background_pattern_alpha;
	stage.update();
}

// jQuery Countdown styles 1.6.1. - plugin by Keith Wood
function counter_start() {
	var austDay = new Date();
	austDay = new Date(austDay.getFullYear() + 1, 3 - 1, 6); // Examples: (austDay.getFullYear() + 1, 3 - 1, 6) or (2013, 3 - 1, 6)
	$("#defaultCountdown").countdown({until: austDay, format: 'DHMS'});
}
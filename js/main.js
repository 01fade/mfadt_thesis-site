var camera, scene, renderer;
var video, image, texture, videoMaterial;
var composer;
var shaderTime = 0;
var rgbParams, badtvParams, staticParams, filmParams;

var rgbPass, badtvPass, staticPass, filmPass;
var renderPass, copyPass;
var gui, controls, stats;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000)
    camera.position.z = 3;
    renderer = new THREE.WebGLRenderer({
        antialiasing: true
    });
    renderer.setClearColor(new THREE.Color(0x000000, 1.0));
    $("#WebGL-output").append(renderer.domElement);

    // video = document.createElement('video');
    // video.loop = true;
    // video.volume = 0.9;
    // video.src = "assets/bs.mp4";
    // video.play();

    texture = new THREE.TextureLoader().load( "img/test.jpg" );
    // texture = new THREE.Texture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    texture.generateMipmaps = false;

    var geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
    var material = new THREE.MeshBasicMaterial({
        map: texture
    });
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    //Create Shader Passes
    renderPass = new THREE.RenderPass(scene, camera);
    badtvPass = new THREE.ShaderPass(THREE.BadTVShader);
    staticPass = new THREE.ShaderPass(THREE.StaticShader);
    filmPass = new THREE.ShaderPass(THREE.FilmShader);
    rgbPass = new THREE.ShaderPass(THREE.RGBShiftShader);
    copyPass = new THREE.ShaderPass(THREE.CopyShader);

    //Init parameters
    badtvParams = {
        distortion: 1.9,
        distortion2: 1.2,
        speed: 0.01,
        rollSpeed: 0.0,
        randomSeed: 0.0
    };
    staticParams = {
        amount: 0.1,
        size: 1.0
    };
    filmParams = {
        count: 900,
        sIntensity: 0.1,
        nIntensity: 1.0
    };
    rgbParams = {
        show: false,
        amount: 0.004,
        angle: 0.15
    };

    datGui = new dat.GUI();

    var f1 = datGui.addFolder('Bad TV');
    f1.add(badtvParams, 'distortion', 0.1, 20).step(0.1).listen().name("Thick Distort").onChange(onParamsChange);
    f1.add(badtvParams, 'distortion2', 0.1, 20).step(0.1).listen().name("Fine Distort").onChange(onParamsChange);
    f1.add(badtvParams, 'speed', 0.0, 1.0).step(0.01).listen().name("Distort Speed").onChange(onParamsChange);
    f1.add(badtvParams, 'rollSpeed', 0.0, 1.0).step(0.01).listen().name("Roll Speed").onChange(onParamsChange);
    f1.add(badtvParams, 'randomSeed', 0.0, 200.0).step(0.01).listen().name("Random Seed").onChange(onParamsChange);
    f1.open();

    var f2 = datGui.addFolder('Static');
    f2.add(staticParams, 'amount', 0.0, 1.0).step(0.001).listen().onChange(onParamsChange);
    f2.add(staticParams, 'size', 1.0, 100.0).step(1.0).onChange(onParamsChange);
    f2.open();

    var f3 = datGui.addFolder('Scanlines');
    f3.add(filmParams, 'count', 50, 1000).onChange(onParamsChange);
    f3.add(filmParams, 'sIntensity', 0.0, 2.0).step(0.1).onChange(onParamsChange);
    f3.add(filmParams, 'nIntensity', 0.0, 2.0).step(0.1).onChange(onParamsChange);
    f3.open();

    var f4 = datGui.addFolder('RGB Shift (Three.js)');
    f4.add(rgbParams, "show", true).name("Show").listen().onChange(onToggleShaders);
    f4.add(rgbParams, "amount", 0.0, 0.1).name("Amount").listen().onChange(onParamsChange);
    f4.add(rgbParams, "angle", 0.0, 2.1).name("Angle").listen().onChange(onParamsChange);
    f4.open()
    datGui.close();

    onToggleShaders();
    onParamsChange();

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    // interactive glitch
    $(document).on("mousemove", function(event) {
        badtvPass.uniforms["speed"].value = Math.random() * 0.3 + 0.2;
        rgbPass.uniforms["angle"].value = Math.random() * 2 + 0.5;
        rgbPass.uniforms["amount"].value = Math.random() * 0.03 + 0.005;
        staticPass.uniforms["size"].value = Math.random() * 1.2 + 0.2;
        setTimeout(function() {
            // reset to init parameters
            onParamsChange();
        }, 100)
    });

    // stats = new Stats();
    // stats.setMode(0); // 0: fps, 1: ms
    // $("#Stats-output").append(stats.domElement);
}; // init end

function onWindowResize(e) {
    renderer.setSize(window.innerWidth*1, window.innerHeight*1);
}

function onToggleShaders() {
    //Add Shader Passes to Composer
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(badtvPass);
    composer.addPass(filmPass);
    composer.addPass(staticPass);

    if (rgbParams.show == true) {
        composer.addPass(rgbPass);
    }
    copyPass.renderToScreen = true;
    composer.addPass(copyPass);
}


function onParamsChange() {
    rgbPass.uniforms["angle"].value = rgbParams.angle;
    rgbPass.uniforms["amount"].value = rgbParams.amount;

    badtvPass.uniforms["distortion"].value = badtvParams.distortion;
    badtvPass.uniforms["distortion2"].value = badtvParams.distortion2;
    badtvPass.uniforms["speed"].value = badtvParams.speed;
    badtvPass.uniforms["rollSpeed"].value = badtvParams.rollSpeed;
    badtvPass.uniforms["randomSeed"].value = badtvParams.randomSeed;

    staticPass.uniforms["amount"].value = staticParams.amount;
    staticPass.uniforms["size"].value = staticParams.size;

    filmPass.uniforms["sCount"].value = filmParams.count;
    filmPass.uniforms["sIntensity"].value = filmParams.sIntensity;
    filmPass.uniforms["nIntensity"].value = filmParams.nIntensity;
}

function keyControl() {
    $(document).on("keyup", function(e) {
        if (e.keyCode == 49) { // 1

        } else if (e.keyCode == 50) { // 2

        } else if (e.keyCode == 51) { // 3

        } else if (e.keyCode == 52) { // 4

        }
        if (e.keyCode == 77) { // m
            $("body").css("cursor", "pointer");
        }
        if (e.keyCode == 78) { // n
            $("body").css("cursor", "none");
        }
        onToggleShaders();
    });
}

function animate() {
    shaderTime += 0.05;
    badtvPass.uniforms['time'].value = shaderTime;
    filmPass.uniforms['time'].value = shaderTime;
    staticPass.uniforms['time'].value = shaderTime;

    // if (video.readyState === video.HAVE_ENOUGH_DATA) {
    //     if (texture) texture.needsUpdate = true;
    // }

    requestAnimationFrame(animate);
    composer.render(camera, scene);
    // stats.update();
}

$(window).on("load", function() {
    init();
    animate();
    keyControl();
    // workaround for remove pixelated video
    $(".folder:last input").trigger("click");
    // hide gui
    $(".dg").hide();
})
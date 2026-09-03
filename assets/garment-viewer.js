
(() => {
  const canvas = document.getElementById('garment3d');
  if (!canvas || !window.THREE) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.1, 7.4);

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const garment = new THREE.Group();
  garment.rotation.y = -0.22;
  scene.add(garment);

  const materials = {
    black: new THREE.MeshPhysicalMaterial({color:0x090909, roughness:.38, metalness:.15, clearcoat:.12, clearcoatRoughness:.5}),
    red: new THREE.MeshPhysicalMaterial({color:0x9c0500, roughness:.34, metalness:.12, clearcoat:.18}),
    white: new THREE.MeshPhysicalMaterial({color:0xdedede, roughness:.44, metalness:.06, clearcoat:.08})
  };
  let shellMaterial = materials.black;

  function makeBox(w,h,d,x,y,z,rx=0,ry=0,rz=0,mat=shellMaterial){
    const g = new THREE.BoxGeometry(w,h,d,5,5,2);
    const m = new THREE.Mesh(g,mat);
    m.position.set(x,y,z); m.rotation.set(rx,ry,rz);
    m.castShadow = true; m.receiveShadow = true;
    garment.add(m); return m;
  }

  const parts = [];
  parts.push(makeBox(2.15,3.3,.72,0,-.15,0,0,0,0));
  parts.push(makeBox(.77,2.95,.62,-1.36,-.18,0,0,0,.30));
  parts.push(makeBox(.77,2.95,.62, 1.36,-.18,0,0,0,-.30));
  parts.push(makeBox(1.45,.62,.78,0,1.72,.02,0,0,0));

  // shoulder plates
  parts.push(makeBox(.78,.32,.80,-.88,1.22,.02,0,0,.10));
  parts.push(makeBox(.78,.32,.80, .88,1.22,.02,0,0,-.10));

  // front zip
  const zipMat = new THREE.MeshStandardMaterial({color:0xd6d6d6,metalness:.9,roughness:.18});
  const zip = makeBox(.055,3.08,.78,0,-.17,.02,0,0,0,zipMat);

  // chest badge
  const badgeMat = new THREE.MeshStandardMaterial({color:0xe8e8e8,metalness:.95,roughness:.12});
  const badgeGroup = new THREE.Group();
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(.12,.58,.06),badgeMat);
  b1.rotation.z = -.35;
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(.48,.10,.06),badgeMat);
  b2.position.set(.13,.1,.01); b2.rotation.z=.08;
  badgeGroup.add(b1,b2);
  badgeGroup.position.set(.63,.52,.40);
  garment.add(badgeGroup);

  // seam lines
  const seamMat = new THREE.MeshBasicMaterial({color:0x555555});
  const seamL = new THREE.Mesh(new THREE.BoxGeometry(.018,2.4,.75),seamMat);
  seamL.position.set(-.68,-.27,.04); seamL.rotation.z=.08;
  garment.add(seamL);
  const seamR = seamL.clone(); seamR.position.x=.68; seamR.rotation.z=-.08; garment.add(seamR);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3.4,96),
    new THREE.MeshStandardMaterial({color:0x080808,roughness:.9,metalness:.05})
  );
  floor.rotation.x = -Math.PI/2; floor.position.y=-1.95;
  scene.add(floor);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(3.1,.012,8,128),
    new THREE.MeshBasicMaterial({color:0xe10600,transparent:true,opacity:.42})
  );
  rim.rotation.x = Math.PI/2; rim.position.y=-1.93; scene.add(rim);

  scene.add(new THREE.AmbientLight(0xffffff,.42));
  const key = new THREE.DirectionalLight(0xffffff,5.2); key.position.set(3.8,5,5); scene.add(key);
  const fill = new THREE.DirectionalLight(0x657dff,1.4); fill.position.set(-4,1,3); scene.add(fill);
  const red = new THREE.PointLight(0xe10600,9,12); red.position.set(-3,-1,3.2); scene.add(red);
  const top = new THREE.SpotLight(0xffffff,5,14,.65,.4,1); top.position.set(0,6,1); scene.add(top);

  let controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = 5.1;
    controls.maxDistance = 9.5;
    controls.minPolarAngle = Math.PI*.28;
    controls.maxPolarAngle = Math.PI*.72;
  }

  function resize(){
    const r = canvas.getBoundingClientRect();
    const w=Math.max(1,r.width),h=Math.max(1,r.height);
    renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();

  const views = {
    front: 0,
    side: -Math.PI/2,
    back: Math.PI
  };
  let targetRotation = garment.rotation.y;
  document.querySelectorAll('[data-view]').forEach(btn=>{
    btn.addEventListener('click',()=>targetRotation=views[btn.dataset.view]);
  });

  document.querySelectorAll('.swatch').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      shellMaterial = materials[btn.dataset.color];
      parts.forEach(p=>p.material=shellMaterial);
    });
  });

  const clock = new THREE.Clock();
  function loop(){
    const t=clock.getElapsedTime();
    if(!controls || !controls.enabled){
      garment.rotation.y += (targetRotation-garment.rotation.y)*.07;
    } else if (Math.abs(targetRotation-garment.rotation.y)>.01) {
      garment.rotation.y += (targetRotation-garment.rotation.y)*.07;
    }
    garment.position.y = Math.sin(t*.85)*.035;
    rim.rotation.z=t*.055;
    if(controls) controls.update();
    renderer.render(scene,camera);
    requestAnimationFrame(loop);
  }
  loop();
})();

// v13 — local GLB/GLTF production loader
(() => {
  const input=document.getElementById('glbInput');
  const loadBtn=document.getElementById('assetLoad');
  const status=document.getElementById('assetStatus');
  if(!input||!loadBtn||!window.THREE||!THREE.GLTFLoader)return;

  // Expose a safe loader hook. The existing procedural viewer remains the fallback.
  loadBtn.addEventListener('click',()=>input.click());
  input.addEventListener('change',e=>{
    const file=e.target.files?.[0]; if(!file)return;
    const url=URL.createObjectURL(file);
    const loader=new THREE.GLTFLoader();
    status.textContent='LOADING / '+file.name.toUpperCase();
    loader.load(url,gltf=>{
      const object=gltf.scene;
      object.traverse(o=>{
        if(o.isMesh){
          o.castShadow=true;o.receiveShadow=true;
          if(o.material){
            o.material.metalness=Math.min(o.material.metalness ?? 0,.25);
            o.material.roughness=Math.max(o.material.roughness ?? .4,.28);
          }
        }
      });
      // Find the main scene and replace procedural group content.
      while(garment.children.length) garment.remove(garment.children[0]);
      const box=new THREE.Box3().setFromObject(object);
      const size=box.getSize(new THREE.Vector3());
      const center=box.getCenter(new THREE.Vector3());
      const max=Math.max(size.x,size.y,size.z)||1;
      object.position.sub(center);
      object.scale.setScalar(4.2/max);
      garment.add(object);
      status.textContent='LIVE 3D ASSET / '+file.name.toUpperCase();
      URL.revokeObjectURL(url);
    }, xhr=>{
      if(xhr.total) status.textContent='LOADING / '+Math.round(xhr.loaded/xhr.total*100)+'%';
    },()=>{
      status.textContent='ASSET ERROR / PROCEDURAL FALLBACK';
      URL.revokeObjectURL(url);
    });
  });
})();

// v14 — RESEMBLE finish controller
(() => {
  const buttons=document.querySelectorAll('.finish');
  if(!buttons.length || !window.THREE) return;
  const palettes={
    black:{color:0x090a0b,metalness:.18,roughness:.30},
    white:{color:0xe9eaec,metalness:.08,roughness:.38},
    red:{color:0xd60000,metalness:.22,roughness:.28},
    titanium:{color:0xbfc2c7,metalness:.88,roughness:.20}
  };
  function apply(name){
    const v=palettes[name];
    if(!v)return;
    garment.traverse(o=>{
      if(!o.isMesh||!o.material)return;
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(m=>{
        if(m.color)m.color.setHex(v.color);
        if('metalness' in m)m.metalness=v.metalness;
        if('roughness' in m)m.roughness=v.roughness;
        if('clearcoat' in m)m.clearcoat=.28;
      });
    });
  }
  buttons.forEach(b=>b.addEventListener('click',()=>{
    buttons.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    apply(b.dataset.finish);
  }));
  apply('black');
})();

// v15 — cinematic motion controller
(() => {
  if(!window.THREE || typeof garment==='undefined') return;
  const canvas=document.getElementById('garment3d');
  if(!canvas) return;
  let targetX=0,targetY=0,dragging=false,lastX=0,lastY=0;
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointerup',()=>dragging=false);
  canvas.addEventListener('pointercancel',()=>dragging=false);
  canvas.addEventListener('pointermove',e=>{
    if(dragging){
      targetX+=(e.clientX-lastX)*.008; targetY+=(e.clientY-lastY)*.004;
      lastX=e.clientX;lastY=e.clientY;
    } else {
      const r=canvas.getBoundingClientRect();
      targetX=((e.clientX-r.left)/r.width-.5)*.18;
      targetY=((e.clientY-r.top)/r.height-.5)*.10;
    }
  });
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const next=Math.max(3.1,Math.min(8.2,camera.position.z+e.deltaY*.004));
    camera.position.z+=(next-camera.position.z)*.25;
  },{passive:false});

  const originalLoop=window.__resembleLoop;
  // A lightweight RAF overlay avoids changing the existing renderer loop.
  function motion(){
    garment.rotation.y += (targetX-garment.rotation.y)*.045;
    garment.rotation.x += (-targetY-garment.rotation.x)*.045;
    requestAnimationFrame(motion);
  }
  motion();

  // Scroll reveal for the viewer section.
  const section=canvas.closest('section')||canvas.parentElement;
  if(section){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          section.classList.add('viewer-live');
          io.disconnect();
        }
      });
    },{threshold:.18});
    io.observe(section);
  }
})();

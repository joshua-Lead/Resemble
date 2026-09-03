
(() => {
  const host=document.querySelector('[data-r-badge]');
  if(!host || !window.THREE) return;
  const canvas=document.createElement('canvas');
  canvas.className='r-badge-canvas';
  host.appendChild(canvas);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(28,1,.1,50);
  camera.position.set(0,0,5.8);
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;

  const group=new THREE.Group();
  scene.add(group);

  const titanium=new THREE.MeshPhysicalMaterial({
    color:0xd5d7da,metalness:.95,roughness:.16,clearcoat:.35,clearcoatRoughness:.15
  });
  const red=new THREE.MeshPhysicalMaterial({
    color:0xd60000,metalness:.65,roughness:.2,clearcoat:.3
  });

  const blade1=new THREE.Mesh(new THREE.BoxGeometry(.18,2.25,.16,2,8,2),titanium);
  blade1.rotation.z=-.42; blade1.position.x=-.18;
  const blade2=new THREE.Mesh(new THREE.BoxGeometry(1.35,.18,.18,8,2,2),titanium);
  blade2.rotation.z=.06; blade2.position.set(.22,.15,0);
  const accent=new THREE.Mesh(new THREE.BoxGeometry(.035,.72,.20),red);
  accent.rotation.z=-.42; accent.position.set(.36,-.23,.12);
  group.add(blade1,blade2,accent);

  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(1.58,.012,8,96),
    new THREE.MeshBasicMaterial({color:0xd60000,transparent:true,opacity:.25})
  );
  group.add(ring);

  scene.add(new THREE.AmbientLight(0xffffff,.55));
  const key=new THREE.DirectionalLight(0xffffff,4); key.position.set(3,4,5); scene.add(key);
  const rim=new THREE.PointLight(0xd60000,6,8); rim.position.set(-3,0,3); scene.add(rim);

  let mx=0,my=0;
  host.addEventListener('pointermove',e=>{
    const r=host.getBoundingClientRect();
    mx=(e.clientX-r.left)/r.width-.5; my=(e.clientY-r.top)/r.height-.5;
  });

  function resize(){
    const r=host.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();

  const clock=new THREE.Clock();
  function loop(){
    const t=clock.getElapsedTime();
    group.rotation.y += (mx*.55-group.rotation.y)*.035;
    group.rotation.x += (-my*.28-group.rotation.x)*.035;
    group.rotation.z = Math.sin(t*.65)*.025;
    ring.rotation.z=t*.08;
    const sweep=(Math.sin(t*.5)+1)/2;
    titanium.emissive=new THREE.Color(.035*sweep,.035*sweep,.035*sweep);
    renderer.render(scene,camera); requestAnimationFrame(loop);
  }
  loop();
})();


(() => {
  const canvas = document.getElementById('resemble3d');
  if (!canvas || !window.THREE) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const group = new THREE.Group();
  scene.add(group);

  const silver = new THREE.MeshStandardMaterial({
    color: 0xd9d9d9, metalness: 0.92, roughness: 0.18
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x0b0b0b, metalness: 0.75, roughness: 0.25
  });

  // Two engineered blades forming a forward-leaning R.
  const blade1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 3.7, 0.34),
    silver
  );
  blade1.rotation.z = THREE.MathUtils.degToRad(-18);
  blade1.position.x = -0.55;

  const blade2 = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.48, 0.34),
    silver
  );
  blade2.rotation.z = THREE.MathUtils.degToRad(7);
  blade2.position.set(0.25, 0.45, 0.05);

  const slash = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.34, 0.28),
    dark
  );
  slash.rotation.z = THREE.MathUtils.degToRad(-35);
  slash.position.set(0.35, -0.55, 0.02);

  group.add(blade1, blade2, slash);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.018, 8, 96),
    new THREE.MeshBasicMaterial({color:0xe10600, transparent:true, opacity:0.38})
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  scene.add(new THREE.AmbientLight(0xffffff, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(4, 5, 6);
  scene.add(key);
  const red = new THREE.PointLight(0xe10600, 7, 12);
  red.position.set(-3, -1, 4);
  scene.add(red);

  let targetX = 0, targetY = 0;
  window.addEventListener('pointermove', e => {
    targetX = (e.clientX / innerWidth - 0.5) * 0.5;
    targetY = (e.clientY / innerHeight - 0.5) * 0.28;
  });

  function resize(){
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const clock = new THREE.Clock();
  function animate(){
    const t = clock.getElapsedTime();
    group.rotation.y += (targetX - group.rotation.y) * 0.035;
    group.rotation.x += (targetY - group.rotation.x) * 0.035;
    group.rotation.z = THREE.MathUtils.degToRad(-3) + Math.sin(t * 0.55) * 0.018;
    group.position.y = Math.sin(t * 0.9) * 0.05;
    ring.rotation.z = t * 0.12;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();

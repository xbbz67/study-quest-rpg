import * as THREE from './three/three.module.min.js';

// A light procedural 3D character scene over the accessible seat controls.
const actors=new Map(), reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer=null,scene,camera,floor,observer,width=0,height=0,hasSnapshot=false,failed=false;
let geometries=[],materials=[];
const $=id=>document.getElementById(id);
const palette=['#818cf8','#e5af6b','#c084fc','#6cb8cf','#c77993'];
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
function colorFor(id,mine){return mine?'#55cdb0':palette[Array.from(id).reduce((sum,c)=>sum+c.charCodeAt(0),0)%palette.length];}
function material(color){const m=new THREE.MeshStandardMaterial({color,roughness:.85,flatShading:true});materials.push(m);return m;}
function geometry(g){geometries.push(g);return g;}
function boot(){
 floor=$('theater-floor');if(!floor||!document.body.classList.contains('theater-active')||failed)return false;
 if(renderer)return true;
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.domElement.className='theater-3d-canvas';renderer.domElement.setAttribute('aria-hidden','true');
  floor.append(renderer.domElement);floor.dataset.scene='3d';
  scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,2000);camera.position.z=500;
  scene.add(new THREE.HemisphereLight(0xffefdc,0x343b50,2.5));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-100,180,250);scene.add(light);
  observer=new ResizeObserver(resize);observer.observe(floor);resize();
  $('theater-motion-status').textContent='Nhân vật 3D · vào từ IN, rời qua EXIT';
  return true;
 }catch(error){
  renderer?.dispose();renderer?.domElement.remove();renderer=null;failed=true;
  if(floor)floor.dataset.scene='2d';
  if($('theater-motion-status'))$('theater-motion-status').textContent='Thiết bị đang dùng hình nhân vật 2D; ghế và timer vẫn hoạt động.';
  return false;
 }
}
function point(element){const box=element.getBoundingClientRect(),base=floor.getBoundingClientRect();return{x:box.left-base.left+box.width/2,y:box.bottom-base.top-5};}
function seatPoint(id){const p=point(document.querySelector(`[data-seat="${id}"]`));return{x:p.x,y:p.y-9};}
function doorPoint(id){const p=point($(id).querySelector('.theater-door-frame'));return{x:p.x,y:p.y-5};}
function aisle(){const a=document.querySelector('[data-seat="A4"]').getBoundingClientRect(),b=document.querySelector('[data-seat="A5"]').getBoundingClientRect();return(a.right+b.left)/2-floor.getBoundingClientRect().left;}
function position(actor,p){actor.position={...p};actor.root.position.set(p.x-width/2,height/2-p.y,2);}
function pose(actor,sitting,step=0){
 actor.hips.forEach((hip,i)=>{hip.rotation.x=-1.15*sitting;hip.rotation.z=Math.sin(step+(i?Math.PI:0))*.35*(1-sitting);actor.knees[i].rotation.x=1.15*sitting;});
 actor.arms.forEach((arm,i)=>{arm.rotation.x=-.6*sitting;arm.rotation.z=Math.sin(step+(i?0:Math.PI))*.4*(1-sitting);});
 actor.body.position.y=-10*sitting+Math.abs(Math.sin(step))*(1-sitting)*1.2;
}
function createActor(record,account){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);scene.add(root);
 const skin=material('#ecc19c'),hair=material('#382f34'),shirt=material(colorFor(record.user_id,record.user_id===account)),pants=material('#263247'),shoe=material('#1b202c');
 const sphere=geometry(new THREE.SphereGeometry(10,12,8)),capsule=geometry(new THREE.CapsuleGeometry(3,9,3,6)),calfGeo=geometry(new THREE.CapsuleGeometry(2.8,8,3,6));
 function mesh(geo,mat,parent,x,y,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;}
 mesh(geometry(new THREE.CapsuleGeometry(9,11,4,10)),shirt,body,0,36);
 mesh(sphere,skin,body,0,59);
 mesh(geometry(new THREE.SphereGeometry(10.5,12,6,0,Math.PI*2,0,Math.PI*.5)),hair,body,0,60);
 mesh(geometry(new THREE.SphereGeometry(2.2,6,4)),skin,body,-10,58);mesh(geometries.at(-1),skin,body,10,58);
 const eyes=material('#25212a'),eyeGeo=geometry(new THREE.SphereGeometry(1,6,4));mesh(eyeGeo,eyes,body,-3,59,9.4);mesh(eyeGeo,eyes,body,3,59,9.4);
 const hips=[],knees=[],arms=[];
 for(const side of [-1,1]){
  const hip=new THREE.Group();hip.position.set(side*5,24,0);body.add(hip);mesh(capsule,pants,hip,0,-7);const knee=new THREE.Group();knee.position.y=-14;hip.add(knee);mesh(calfGeo,pants,knee,0,-6);mesh(geometry(new THREE.BoxGeometry(7,4,11)),shoe,knee,0,-12,3);hips.push(hip);knees.push(knee);
  const arm=new THREE.Group();arm.position.set(side*11,43,0);body.add(arm);mesh(capsule,shirt,arm,0,-6);mesh(geometry(new THREE.SphereGeometry(3,6,4)),skin,arm,0,-13);arms.push(arm);
 }
 const shadowMat=new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:.22,depthWrite:false});materials.push(shadowMat);
 const shadow=mesh(geometry(new THREE.CircleGeometry(15,16)),shadowMat,root,0,-2,-1);shadow.scale.y=.28;
 const actor={root,body,hips,knees,arms,shirt,record:{...record},motion:null,waiters:[]};
 const seat=document.querySelector(`[data-seat="${record.seat}"]`);root.scale.setScalar(clamp(seat.getBoundingClientRect().width/62,.5,1));
 return actor;
}
function settle(actor){position(actor,seatPoint(actor.record.seat));pose(actor,1);actor.root.rotation.y=Math.PI*.76;actor.motion=null;}
function finishExit(id,actor){
 scene.remove(actor.root);actors.delete(id);
 const gs=new Set(),ms=new Set();actor.root.traverse(object=>{if(object.geometry)gs.add(object.geometry);if(object.material)ms.add(object.material);});
 gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());geometries=geometries.filter(g=>!gs.has(g));materials=materials.filter(m=>!ms.has(m));
 actor.waiters.splice(0).forEach(resolve=>resolve());
}
function animate(actor,kind){
 const target=seatPoint(actor.record.seat),middle=aisle(),bottom=height-40;
 const start=actor.position||doorPoint('theater-door-in');
 const points=kind==='exit'?[start,{x:start.x,y:target.y+24},{x:middle,y:target.y+24},{x:middle,y:bottom},doorPoint('theater-door-exit')]:[start,{x:middle,y:bottom},{x:middle,y:target.y+24},{x:target.x,y:target.y+24},target];
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));const distance=lengths.reduce((a,b)=>a+b,0);
 actor.motion={kind,points,lengths,distance,start:performance.now(),walk:clamp(distance/100,2.5,7)*1000,stand:kind==='exit'?450:0,sit:kind==='enter'?550:0};
 if(reduced.matches){if(kind==='exit')finishExit(actor.record.user_id,actor);else settle(actor);return;}
 wake();
}
function along(motion,progress){let left=motion.distance*clamp(progress,0,1);for(let i=0;i<motion.lengths.length;i++){const length=motion.lengths[i];if(left<=length||i===motion.lengths.length-1){const t=length?clamp(left/length,0,1):1,a=motion.points[i],b=motion.points[i+1];return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,dx:b.x-a.x,dy:b.y-a.y};}left-=length;}return motion.points.at(-1);}
function updateDoors(){if(floor)for(const kind of ['enter','exit']){const key=kind==='enter'?'entering':'exiting',value=String(Array.from(actors.values()).some(actor=>actor.motion?.kind===kind));if(floor.dataset[key]!==value)floor.dataset[key]=value;}}
function frame(now){
 for(const [id,actor] of actors){const m=actor.motion;if(!m)continue;const elapsed=now-m.start,total=m.stand+m.walk+m.sit;
  if(elapsed>=total){if(m.kind==='exit')finishExit(id,actor);else settle(actor);continue;}
  const walking=elapsed>=m.stand&&elapsed<m.stand+m.walk,p=along(m,(elapsed-m.stand)/m.walk);position(actor,p);
  let sitting=elapsed<m.stand?1-elapsed/m.stand:elapsed>m.stand+m.walk?(elapsed-m.stand-m.walk)/m.sit:0;
  pose(actor,sitting,walking?elapsed*.012:0);
  const direction=walking?(Math.abs(p.dx)>Math.abs(p.dy)?Math.sign(p.dx)*Math.PI/2:p.dy<0?Math.PI:0):Math.PI;actor.root.rotation.y=direction;
 }
 renderer?.render(scene,camera);
 updateDoors();
 if(!Array.from(actors.values()).some(actor=>actor.motion))renderer?.setAnimationLoop(null);
}
function wake(){renderer?.setAnimationLoop(frame);}
function resize(){
 if(!renderer||!floor)return;const w=Math.round(floor.clientWidth),h=Math.round(floor.clientHeight);if(!w||!h||w===width&&h===height)return;
 const wasSized=width>0;width=w;height=h;renderer.setSize(w,h);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();
 if(wasSized)for(const [id,actor] of actors){if(actor.motion?.kind==='exit')finishExit(id,actor);else{actor.root.scale.setScalar(clamp(document.querySelector(`[data-seat="${actor.record.seat}"]`).getBoundingClientRect().width/62,.5,1));settle(actor);}}
 renderer.render(scene,camera);
}
function sync(records,account,{confirmed=false}={}){
 if(!confirmed&&!renderer)return;
 if(!boot()||!confirmed)return;
 const initial=!hasSnapshot;hasSnapshot=true;const incoming=new Map(records.map(row=>[row.user_id,row]));
 for(const [id,actor] of actors)if(!incoming.has(id)&&actor.motion?.kind!=='exit')animate(actor,'exit');
 for(const [id,row] of incoming){let actor=actors.get(id);
  if(!actor){actor=createActor(row,account);actors.set(id,actor);if(initial&&id!==account)settle(actor);else{position(actor,doorPoint('theater-door-in'));animate(actor,'enter');}}
  else {actor.shirt.color.set(colorFor(id,id===account));if(actor.record.seat!==row.seat||actor.motion?.kind==='exit'){actor.record={...row};animate(actor,'enter');}else actor.record={...row};}
 }
 updateDoors();renderer.render(scene,camera);if(Array.from(actors.values()).some(actor=>actor.motion))wake();
}
function stop(){
 observer?.disconnect();renderer?.setAnimationLoop(null);for(const actor of actors.values())actor.waiters.forEach(resolve=>resolve());actors.clear();
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());geometries=[];materials=[];renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();renderer=null;width=height=0;hasSnapshot=false;
 if(floor)floor.dataset.scene='2d';
}
function waitForExit(id){const actor=actors.get(id);if(!actor||actor.motion?.kind!=='exit')return Promise.resolve();return new Promise(resolve=>{const timer=setTimeout(resolve,8500);actor.waiters.push(()=>{clearTimeout(timer);resolve();});});}
reduced.addEventListener('change',()=>{if(reduced.matches){for(const [id,actor] of actors)if(actor.motion?.kind==='exit')finishExit(id,actor);else settle(actor);updateDoors();if(renderer)renderer.render(scene,camera);}});
window.Theater3D={sync,stop,waitForExit,inspect:()=>({enabled:!!renderer,actors:actors.size,moving:Array.from(actors.values()).filter(a=>a.motion).length})};

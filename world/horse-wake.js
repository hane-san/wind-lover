/* Small, contact-led dust and loose seeds; one fixed pool and one draw call. */
(() => {
  function create(THREE, scene, texture) {
    const count=240, particles=Array.from({length:count},()=>({p:new THREE.Vector3(),v:new THREE.Vector3(),life:0,duration:1,size:1,air:false}));
    const positions=new Float32Array(count*3),colours=new Float32Array(count*3),fades=new Float32Array(count),sizes=new Float32Array(count);
    const geometry=new THREE.BufferGeometry();
    for(const [key,array,width] of [['position',positions,3],['color',colours,3],['wakeFade',fades,1],['wakeSize',sizes,1]])geometry.setAttribute(key,new THREE.BufferAttribute(array,width));
    const material=new THREE.PointsMaterial({size:.85,map:texture,vertexColors:true,transparent:true,depthWrite:false,opacity:.32});
    material.onBeforeCompile=shader=>{
      shader.vertexShader='attribute float wakeFade; attribute float wakeSize; varying float vWakeFade;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWakeFade = wakeFade;').replace('gl_PointSize = size;','gl_PointSize = size * wakeSize;');
      shader.fragmentShader='varying float vWakeFade;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_particle_fragment>','#include <map_particle_fragment>\ndiffuseColor.a *= vWakeFade;');
    };
    const points=new THREE.Points(geometry,material);points.frustumCulled=false;points.name='horse-contact-wake';scene.add(points);
    let cursor=0;const airTint=new THREE.Color(0xdce1d5);
    function write(i){
      const p=particles[i],u=1-p.life/p.duration;
      fades[i]=p.life>0?(1-u)*(1-u)*p.strength:0;sizes[i]=p.size*(1+u*.7);
      positions[i*3]=p.p.x;positions[i*3+1]=p.p.y;positions[i*3+2]=p.p.z;
    }
    function dirty(){for(const key of ['position','wakeFade','wakeSize'])geometry.attributes[key].needsUpdate=true;}
    function clear(){for(const p of particles)p.life=0;fades.fill(0);geometry.attributes.wakeFade.needsUpdate=true;points.visible=false;}
    const snowTint=new THREE.Color(0xe6edf2),earthTint=new THREE.Color(0xb6a68b),dustTint=new THREE.Color();
    function emit(position,velocity,colour,weight,water=false,age=0,{snow=0,speed=0,wind=null}={}){
      dustTint.copy(earthTint).lerp(colour,.32);
      const flakes=snow>.45,total=10+Math.floor(Math.min(1,speed/130)*3);
      for(let i=0;i<total;i++){
        const index=cursor++%count,p=particles[index];p.air=i>=total-2;
        p.duration=p.air?.7:.50+Math.random()*.34;p.life=p.duration;
        p.size=p.air?(flakes?.13:.18):flakes?.23+Math.random()*.42:.75+Math.random()*.72;
        p.p.copy(position);p.p.x+=(Math.random()-.5)*(p.air?.8:.30);p.p.z+=(Math.random()-.5)*.30;
        p.p.y+=p.air?.25+Math.random()*.35:.035;
        p.v.set(velocity.x*.045+(Math.random()-.5)*2.5, p.air?.35:(water?1.7:flakes?1.8:1.05)+Math.random()*.9,velocity.z*.045+(Math.random()-.5)*2.5);
        if(wind){p.v.x+=wind.x*.65;p.v.z+=wind.z*.65;}
        // Contacts may fall between frames: leave their marks where the feet landed.
        p.p.addScaledVector(velocity,-age);p.p.addScaledVector(p.v,age);p.life-=age;
        p.strength=weight*(p.air?.65:flakes?.95:.90);p.gravity=p.air?.3:water?5:flakes?3.8:2.7;
        const tint=p.air?(flakes?snowTint:airTint):flakes?snowTint:dustTint;
        colours[index*3]=tint.r;colours[index*3+1]=tint.g;colours[index*3+2]=tint.b;
        write(index);
      }
      geometry.attributes.color.needsUpdate=true;points.visible=true;dirty();
    }
    function update(dt){
      let active=0;
      for(let i=0;i<count;i++){
        const p=particles[i];
        if(p.life>0&&dt>0){p.life=Math.max(0,p.life-dt);p.v.y-=p.gravity*dt;p.p.addScaledVector(p.v,dt);}
        if(p.life>0)active++;write(i);
      }
      points.visible=active>0;dirty();
    }
    clear();return{emit,update,clear,points,get active(){return particles.filter(p=>p.life>0).length;}};
  }
  globalThis.WindHorseWake=Object.freeze({create});
})();

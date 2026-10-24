/* Thin wind-borne threads in world space, away from the rider's central reading corridor. */
(() => {
  function create(THREE,scene){
    const count=52,positions=new Float32Array(count*6),seeds=Array.from({length:count},()=>({x:0,y:0,z:0,ready:false}));
    const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(positions,3));
    const material=new THREE.LineBasicMaterial({color:0xdce3da,transparent:true,opacity:0,depthWrite:false});
    const lines=new THREE.LineSegments(geometry,material);lines.frustumCulled=false;lines.name='roadside-wind-threads';scene.add(lines);
    let strength=0;
    function clear(){for(const s of seeds)s.ready=false;strength=0;material.opacity=0;lines.visible=false;}
    function update(dt,{position,velocity,active=false,snow=0,pressure=0,reduced=false}={}){
      if(!(dt>0))return;
      const speed=Math.hypot(velocity.x,velocity.z),fx=velocity.x/(speed||1),fz=velocity.z/(speed||1);
      const target=active&&!reduced?Math.max(0,Math.min(1,(speed-16)/25))*(1-pressure*.45):0;
      strength+=(target-strength)*(1-Math.exp(-4*dt));material.opacity=strength*.10;
      material.color.setHex(snow>.4?0xe0eaf0:0xcddcce);lines.visible=strength>.005;
      const length=.8+strength*2.1;
      for(let i=0;i<count;i++){
        const s=seeds[i];
        const along=(s.x-position.x)*fx+(s.z-position.z)*fz,cross=(s.x-position.x)*fz-(s.z-position.z)*fx;
        if(!s.ready||along<-20||along>65||Math.abs(cross)>40||Math.abs(s.y-position.y)>12){
          const side=(i%2?1:-1)*(5.5+Math.random()*26),ahead=10+Math.random()*50;
          s.x=position.x+fx*ahead+fz*side;s.z=position.z+fz*ahead-fx*side;s.y=position.y-.4+Math.random()*3.4;s.ready=true;
        }
        s.x+=velocity.x*.06*dt;s.z+=velocity.z*.06*dt;s.y+=Math.sin(i)*.1*dt;
        const k=i*6;positions[k]=s.x;positions[k+1]=s.y;positions[k+2]=s.z;
        positions[k+3]=s.x-fx*length;positions[k+4]=s.y-.05;positions[k+5]=s.z-fz*length;
      }geometry.attributes.position.needsUpdate=true;
    }
    clear();return{update,clear,lines,get strength(){return strength;}};
  }
  globalThis.WindFlowEffects=Object.freeze({create});
})();

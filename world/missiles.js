/* Briefly guided darts commit to a line: readable locks, real acceleration, fixed resources. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function intercept(rx,ry,rz,vx,vy,vz,speed){
    const a=vx*vx+vy*vy+vz*vz-speed*speed,b=2*(rx*vx+ry*vy+rz*vz),c=rx*rx+ry*ry+rz*rz;
    let t;if(Math.abs(a)<1e-6)t=-c/b;
    else{const d=b*b-4*a*c;if(d>=0){const q=Math.sqrt(d),t0=(-b-q)/(2*a),t1=(-b+q)/(2*a);t=t0>0&&t1>0?Math.min(t0,t1):Math.max(t0,t1);}}
    return Number.isFinite(t)&&t>0?clamp(t,.15,3):1;
  }
  function swept(ax,ay,az,bx,by,bz){const x=bx-ax,y=by-ay,z=bz-az,l=x*x+y*y+z*z,u=l>1e-9?clamp(-(ax*x+ay*y+az*z)/l,0,1):0;return (ax+x*u)**2+(ay+y*u)**2+(az+z*u)**2;}
  function acceleratingIntercept(rx,ry,rz,vx,vy,vz,speed){
    let lo=0,hi=3;const cap=Math.max(0,(300-speed)/145);
    for(let i=0;i<15;i++){const t=(lo+hi)/2,a=Math.min(t,cap),distance=speed*a+72.5*a*a+300*Math.max(0,t-cap);
      if(Math.hypot(rx+vx*t,ry+vy*t,rz+vz*t)>distance)lo=t;else hi=t;}
    return clamp((lo+hi)/2,.15,3);
  }
  function create(THREE,scene,{surface,onHit,onGraze,onSound,onBurst,canHit}){
    const count=8,smokeCount=256,items=Array.from({length:count},()=>({p:new THREE.Vector3(),v:new THREE.Vector3(),target:new THREE.Vector3(),age:0,life:0,grazed:false}));
    const body=new THREE.InstancedMesh(new THREE.ConeGeometry(.34,4.2,8),new THREE.MeshLambertMaterial({color:0x404a4e,fog:false}),count);
    const fins=new THREE.InstancedMesh(new THREE.BoxGeometry(1.15,.8,.12),new THREE.MeshLambertMaterial({color:0x6c736c}),count);
    const exhaust=new THREE.InstancedMesh(new THREE.SphereGeometry(.5,6,4),new THREE.MeshBasicMaterial({color:0xffb56b}),count);
    const locks=new THREE.InstancedMesh(new THREE.RingGeometry(3.2,3.55,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xe19a65,transparent:true,opacity:.72,depthWrite:false,fog:false}),count);
    for(const m of [body,fins,exhaust,locks]){m.count=0;m.frustumCulled=false;scene.add(m);}
    const smokeP=new Float32Array(smokeCount*6),smokeF=new Float32Array(smokeCount*2),smokeLife=new Float32Array(smokeCount),geo=new THREE.BufferGeometry();
    smokeP.fill(-9999);geo.setAttribute('position',new THREE.BufferAttribute(smokeP,3));geo.setAttribute('smokeFade',new THREE.BufferAttribute(smokeF,1));
    const mat=new THREE.LineBasicMaterial({color:0x86857c,transparent:true,opacity:.52,depthWrite:false});
    mat.onBeforeCompile=s=>{s.vertexShader='attribute float smokeFade; varying float vSmokeFade;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSmokeFade=smokeFade;');s.fragmentShader='varying float vSmokeFade;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= vSmokeFade;');};
    const smoke=new THREE.LineSegments(geo,mat);smoke.frustumCulled=false;scene.add(smoke);
    const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),dir=new THREE.Vector3(),wanted=new THREE.Vector3(),before=new THREE.Vector3();let cursor=0,totalLaunched=0,totalCommitted=0;
    function launch(origin,target,velocity){
      if(items.filter(m=>m.life>0).length>=2)return false;
      const m=items.find(m=>m.life<=0);if(!m)return false;
      m.p.copy(origin);m.age=0;m.life=4;m.grazed=false;m.speed=170;m.committed=false;
      const flight=acceleratingIntercept(target.x-origin.x,target.y-origin.y,target.z-origin.z,velocity.x,velocity.y,velocity.z,m.speed);
      m.target.copy(target).addScaledVector(velocity,flight);m.v.subVectors(m.target,origin).normalize().multiplyScalar(m.speed);totalLaunched++;
      onSound('launch',origin);return true;
    }
    function clear(){for(const m of items)m.life=0;smokeLife.fill(0);smokeF.fill(0);geo.attributes.smokeFade.needsUpdate=true;for(const m of [body,fins,exhaust,locks])m.count=0;smoke.visible=false;}
    function update(dt,{position,previous=position,velocity,enabled=true,sheltered=false,dead=false}={}){
      if(!enabled||sheltered||dead){clear();return;}
      let n=0;
      for(const m of items){
        if(m.life<=0)continue;before.copy(m.p);m.age+=dt;m.life-=dt;
        if(dt>0){
          m.speed=Math.min(300,m.speed+145*dt);
          if(m.age<.42){
            const flight=acceleratingIntercept(position.x-m.p.x,position.y+.45-m.p.y,position.z-m.p.z,velocity.x,velocity.y,velocity.z,m.speed);
            m.target.copy(position).addScaledVector(velocity,flight);m.target.y+=.45;wanted.subVectors(m.target,m.p).normalize();dir.copy(m.v).normalize();
            const angle=Math.acos(clamp(dir.dot(wanted),-1,1)),k=angle>1e-5?Math.min(1,.85*dt/angle):1;m.v.lerp(wanted.multiplyScalar(m.speed),k);
          }else if(!m.committed){m.committed=true;totalCommitted++;}
          m.v.setLength(m.speed);m.p.addScaledVector(m.v,dt);
          const distance=swept(before.x-previous.x,before.y-previous.y-.45,before.z-previous.z,m.p.x-position.x,m.p.y-position.y-.45,m.p.z-position.z);
          if(distance<.54*.54&&canHit()){onHit('missile');m.life=0;}
          else if(distance>=.54*.54&&distance<3.8*3.8&&!m.grazed){m.grazed=true;onGraze(m.p);onSound('flyby',m.p);}
          if(m.p.y<surface(m.p.x,m.p.z)+.12)m.life=0;
          const i=cursor++%smokeCount,o=i*6;smokeP[o]=before.x;smokeP[o+1]=before.y;smokeP[o+2]=before.z;smokeP[o+3]=m.p.x;smokeP[o+4]=m.p.y;smokeP[o+5]=m.p.z;smokeLife[i]=.95;
        }
        if(m.life<=0){onBurst(m.p);continue;}
        const size=clamp(m.p.distanceTo(position)/170,1,2.2);dir.copy(m.v).normalize();dummy.position.copy(m.p);dummy.quaternion.setFromUnitVectors(up,dir);dummy.scale.setScalar(size);dummy.updateMatrix();body.setMatrixAt(n,dummy.matrix);
        dummy.position.addScaledVector(dir,-.9*size);dummy.updateMatrix();fins.setMatrixAt(n,dummy.matrix);dummy.position.addScaledVector(dir,-1.5*size);dummy.scale.set(1.35*size,1.7*size,1.35*size);dummy.updateMatrix();exhaust.setMatrixAt(n,dummy.matrix);
        dummy.position.set(m.target.x,surface(m.target.x,m.target.z)+.23,m.target.z);dummy.quaternion.identity();dummy.scale.setScalar(1+.08*Math.sin(m.age*22));dummy.updateMatrix();locks.setMatrixAt(n,dummy.matrix);n++;
      }
      for(const mesh of [body,fins,exhaust,locks]){mesh.count=n;mesh.instanceMatrix.needsUpdate=true;}
      let liveSmoke=0;for(let i=0;i<smokeCount;i++){smokeLife[i]=Math.max(0,smokeLife[i]-dt);const f=smokeLife[i]/.95;smokeF[i*2]=f*f;smokeF[i*2+1]=f*f;if(f>0)liveSmoke++;}
      smoke.visible=liveSmoke>0;geo.attributes.position.needsUpdate=geo.attributes.smokeFade.needsUpdate=true;
    }
    clear();return{launch,update,clear,body,locks,get active(){return items.filter(m=>m.life>0).length;},get launched(){return totalLaunched;},get committed(){return totalCommitted;},get capacity(){return count;}};
  }
  globalThis.WindMissiles=Object.freeze({create,intercept,acceleratingIntercept,swept});
})();

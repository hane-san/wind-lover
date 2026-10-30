/* Distinct regional skies, original bird silhouettes and adjoining road surfaces. */
(() => {
  const mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const profiles={
    bay:{top:0x347da9,dusk:0x69688f,hor:0xc4e5e7,haze:0xe3bca1,cloud:0xe0edf0,form:.75,cover:.32,elevation:.48,road:0x627c86,verge:0x9ab7ab,track:20,ruts:0,birds:7,bird:'gull'},
    edo:{top:0x45446f,dusk:0x282e58,hor:0xf2b56c,haze:0xd77f63,cloud:0x71677c,form:.06,cover:.40,elevation:.14,road:0xb79862,verge:0x96994f,track:10,ruts:1,birds:13,bird:'crow'},
    angkor:{top:0x3c7474,dusk:0x27444e,hor:0xc2d5a5,haze:0xd2a970,cloud:0xa9c4b3,form:.82,cover:.48,elevation:.36,road:0x918d70,verge:0x63794d,track:15,ruts:.15,birds:5,bird:'swift'},
    khaosan:{top:0x644487,dusk:0x252d5b,hor:0xe49b72,haze:0xd16468,cloud:0xb695ae,form:.2,cover:.35,elevation:.20,road:0x777188,verge:0xb58f75,track:22,ruts:0,birds:3,bird:'swift'},
    donmueang:{top:0x3688bb,dusk:0x47537d,hor:0xdee8d5,haze:0xf0ba80,cloud:0xf5edd7,form:.9,cover:.38,elevation:.48,road:0x5e7784,verge:0xa6bba1,track:23,ruts:0,birds:5,bird:'swift'},
    straits:{top:0x177fba,dusk:0x356b99,hor:0x9edccd,haze:0xe4bb88,cloud:0xf1f1da,form:1,cover:.36,elevation:.58,road:0xcab585,verge:0xb4bb79,track:13,ruts:.65,birds:10,bird:'gull'},
    kanazawa:{top:0x5c7396,dusk:0x4e4d78,hor:0xc4cbd6,haze:0xd5aa9c,cloud:0x9aaabb,form:.1,cover:.64,elevation:.34,road:0x8f9ba2,verge:0x7e9584,track:18,ruts:0,birds:4,bird:'swift'},
    shikoku:{top:0x438da2,dusk:0x4f667e,hor:0xc7dfbe,haze:0xddc192,cloud:0xd4e7d7,form:.85,cover:.48,elevation:.42,road:0xb2a780,verge:0x5c8655,track:13,ruts:.55,birds:4,bird:'kite'},
    ainu:{top:0x718faa,dusk:0x596780,hor:0xe2dfd0,haze:0xdcb2b3,cloud:0xc9d3d8,form:.14,cover:.38,elevation:.29,road:0xa99d79,verge:0x879565,track:11,ruts:.7,birds:6,bird:'swift'},
    hagiang:{top:0x4c819d,dusk:0x384e76,hor:0xc6d5bd,haze:0xc6b49b,cloud:0xc3d2d3,form:.78,cover:.58,elevation:.40,road:0xb2ada0,verge:0x69845b,track:12,ruts:.35,birds:3,bird:'kite'},
    inner:{top:0x2e555b,dusk:0x25394c,hor:0xb2c190,haze:0xbeb48b,cloud:0x93b0a3,form:.84,cover:.65,elevation:.26,road:0x8c9475,verge:0x536e41,track:12,ruts:.2,birds:6,bird:'swift'},
    thai:{top:0x825a9b,dusk:0x44336b,hor:0xf3c180,haze:0xe99072,cloud:0xdbc6d2,form:.78,cover:.42,elevation:.22,road:0xb29b73,verge:0x9ba06a,track:16,ruts:.5,birds:7,bird:'swift'},
    ryukyu:{top:0x4b81b2,dusk:0x625287,hor:0xe8cc9b,haze:0xee9e73,cloud:0xf0dcd2,form:.6,cover:.30,elevation:.30,road:0xc4bca0,verge:0x93a46c,track:15,ruts:0,birds:6,bird:'gull'},
    okinawa:{top:0x147fc8,dusk:0x42789e,hor:0x92ded6,haze:0xf1c28d,cloud:0xf4f4e7,form:1,cover:.28,elevation:.62,road:0xd0c29b,verge:0x9fbd78,track:16,ruts:.25,birds:11,bird:'gull'},
  };
  const channels=hex=>[16,8,0].map(s=>((hex>>s)&255)/255);
  function weather(stage,time){
    const result={top:[0,0,0],hor:[0,0,0],cloudColour:[0,0,0],stars:0,cloud:0,form:0,cover:0,elevation:0,fog:0};
    for(const {zone,w,index} of stage.weights){
      const p=profiles[zone.id],cycle=.5+.5*Math.sin(time/39+index*.63),evening=zone.id==='edo'?.62+.34*cycle:cycle*.44;
      for(const [key,a,b] of [['top',p.top,p.dusk],['hor',p.hor,p.haze]]){const A=channels(a),B=channels(b);for(let i=0;i<3;i++)result[key][i]+=mix(A[i],B[i],evening)*w;}
      const cloud=channels(p.cloud);for(let i=0;i<3;i++)result.cloudColour[i]+=cloud[i]*w;
      result.form+=p.form*w;result.cover+=p.cover*w;result.cloud+=(.22+p.cover*.42)*w;
      result.elevation+=p.elevation*(1-evening*.46)*w;result.fog+=(['kanazawa','inner','hagiang'].includes(zone.id)?4800:6200)*w;
      result.stars+=Math.max(0,evening-.78)*1.8*w;
    }
    return result;
  }
  function birdPose(zone,index,time){
    const p=profiles[zone.id],group=Math.floor(index/4),phase=time*(p.bird==='kite'?.037:.065)+group*1.7;
    return {x:zone.x+Math.cos(phase)*(230+group*85)+(index%4)*19,z:zone.z+Math.sin(phase)*190+(index%4)*13,
      y:zone.y+125+group*29+Math.sin(phase*1.3+index)*7,yaw:-phase,size:p.bird==='kite'?5:p.bird==='gull'?3.8:3,
      flap:p.bird==='kite'?.7:p.bird==='crow'?3.4:5,colour:p.bird==='gull'?0xe0e4d7:0x242632};
  }
  function createBirds(THREE,parent){
    const capacity=48,geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.9,-2,0,-.1,-.6,0,-.6,0,0,.9,.6,0,-.6,2,0,-.1],3));
    geometry.setAttribute('instancePhase',new THREE.InstancedBufferAttribute(Float32Array.from({length:capacity},(_,i)=>i*1.73),1));
    const phases=geometry.attributes.instancePhase.array,speeds=new Float32Array(capacity);geometry.setAttribute('instanceSpeed',new THREE.InstancedBufferAttribute(speeds,1));
    const clock={value:0},material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,fog:true});
    material.onBeforeCompile=shader=>{shader.uniforms.birdClock=clock;shader.vertexShader='uniform float birdClock;attribute float instanceSpeed;attribute float instancePhase;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.y+=abs(position.x)*sin(birdClock*instanceSpeed+instancePhase)*.48;');};
    const mesh=new THREE.InstancedMesh(geometry,material,capacity),dummy=new THREE.Object3D(),colour=new THREE.Color();mesh.frustumCulled=false;mesh.visible=false;mesh.userData.sceneryKind='regional-birds';mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);parent.add(mesh);
    return {mesh,update(stage,time,visible){
      mesh.visible=Boolean(visible);if(!visible)return;clock.value=time;let count=0;const visibleKinds={};
      for(const {zone,w,index} of stage.weights){
        if(w<.02)continue;const p=profiles[zone.id],fade=clamp((w-.02)/.38);visibleKinds[p.bird]=(visibleKinds[p.bird]||0)+p.birds;
        for(let i=0;i<p.birds&&count<capacity;i++,count++){
          const pose=birdPose(zone,i,time);dummy.position.set(pose.x,pose.y,pose.z);dummy.rotation.set(0,pose.yaw,Math.sin(time*.4+i)*.08);dummy.scale.setScalar(pose.size*fade);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);mesh.setColorAt(count,colour.setHex(pose.colour));phases[count]=index*2.13+i*1.73;speeds[count]=pose.flap;
        }
      }
      mesh.count=count;mesh.userData.birds=visibleKinds;mesh.instanceMatrix.needsUpdate=true;geometry.attributes.instancePhase.needsUpdate=true;geometry.attributes.instanceSpeed.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    }};
  }
  globalThis.WindRegionalAtmosphere=Object.freeze({profiles,weather,birdPose,createBirds});
})();

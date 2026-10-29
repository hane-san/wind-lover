/* A fictional compressed Japan–Southeast Asia sampler. No third-party models or map service. */
(() => {
 const CX=150000,RX=1500,RZ=1050,TAU=Math.PI*2;
 const zones=[
  {id:'bay',road:0x61747b,name:'豊洲風の湾岸',key:'azure',top:0x527fa6,hor:0xc9dfe1,ground:0x6c8b80},
  {id:'edo',road:0xb8a079,name:'夕暮れの江戸平原',key:'steppe',top:0x725c8b,hor:0xe7b183,ground:0x9e9862},
  {id:'angkor',road:0x9b9b81,name:'アンコールの石の森',key:'fergana',top:0x537f84,hor:0xc5d9c2,ground:0x718260},
  {id:'khaosan',road:0x69606e,name:'カオサンの灯り',key:'village',top:0x61547c,hor:0xd2a993,ground:0xa3947b},
  {id:'donmueang',road:0x5b6972,name:'ドンムアンの空',key:'azure',top:0x6888a8,hor:0xe2c8ae,ground:0x8e967a},
  {id:'straits',road:0xc8b587,name:'マレー半島の海岸',key:'issyk',top:0x4d98af,hor:0xd2ece0,ground:0xbeb58d},
 ];
 let path=null;
 function install(routes){
  if(path)return path;const points=[];
  for(let i=0;i<=480;i++){const a=i/480*TAU;points.push({x:CX+RX*Math.cos(a),z:RZ*Math.sin(a),y:20+2*Math.sin(a*2)});}
  points[480]={...points[0]};path=routes.addCircuit('monsoon',points);path.region='monsoon';path.realm='monsoon';path.name='日本と南の海を巡る旅';for(const s of path.segments)s.half=30;routes.indexReach(path,1300);return path;
 }
 function near(x,z){
  const a=((Math.atan2(z/RZ,(x-CX)/RX)%TAU)+TAU)%TAU,i=Math.min(479,Math.floor(a/TAU*480)),s=path?.segments[i];
  if(!s)return {y:20,d:999,s:0};const u=Math.max(0,Math.min(1,((x-s.a.x)*s.dx+(z-s.a.z)*s.dz)/(s.length*s.length)));
  return {y:s.a.y+(s.b.y-s.a.y)*u,d:Math.hypot(x-s.a.x-s.dx*u,z-s.a.z-s.dz*u),s:s.s+s.length*u};
 }
 function stage(x,z){
  const p=near(x,z),u=path?p.s/path.length:0,index=Math.min(5,Math.floor(u*6)),local=u*6-index,v=Math.min(1,local/.12),blend=v*v*(3-2*v);
  return {...zones[index],index,u,previous:zones[(index+5)%6],blend};
 }
 function terrain(x,z){
  const r=Math.hypot((x-CX)/RX,z/RZ),p=near(x,z),q=stage(x,z),inland=(q.id==='edo'?q.blend:0)+(q.previous.id==='edo'?1-q.blend:0);
  const land=p.y-2+Math.sin(x/180)*.8*Math.sin(z/150),v=Math.max(0,Math.min(1,(r-1.05-inland*.40)/.45)),coast=v*v*(3-2*v);
  const inner=140*Math.exp(-((x-CX+250)**2/240000+(z-450)**2/100000))*Math.max(0,Math.min(1,(.92-r)/.20));
  const outer=125*Math.exp(-((x-CX+300)**2/260000+(z-1500)**2/180000))*Math.max(0,Math.min(1,(r-1.07)/.18))*inland;
  return land+inner+outer+(-42-land-inner-outer)*coast;
 }
 function build({THREE,G,M,Merger,heightAt,addSolid},parent,routes){
  const stone=new Merger(),glass=new Merger(),light=new Merger(),portalGeo=new THREE.TorusGeometry(1,.035,5,32),gableGeo=new THREE.CylinderGeometry(1,1,1,3).rotateZ(Math.PI/2);
  // One reusable drooping frond makes the palms read as palms from the panorama camera.
  const frondGeo=(()=>{const p=[],idx=[];for(let i=0;i<=8;i++){const u=i/8,w=Math.sin(u*Math.PI)*2.8;for(const side of [-1,1])p.push(side*w,3*Math.sin(u*Math.PI)-6*u*u,u*18);}for(let i=0;i<8;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;})();
  const block=(x,z,yaw,w,h,d,col,y=heightAt(x,z),solid=true)=>{stone.add(G.box,M(x,y+h/2,z,yaw,w,h,d),col);if(solid)addSolid(x,z,yaw,w/2,d/2,y,y+h);};
  const part=(geo,x,y,z,yaw,sx,sy,sz,col,bright=false)=>(bright?light:stone).add(geo,M(x,y,z,yaw,sx,sy,sz),col);
  const place=(s,off)=>{const p=routes.at(path,s);return {...p,x:p.x-p.tz*off,z:p.z+p.tx*off,yaw:Math.atan2(p.tx,p.tz)};};
  const clear=(x,z,r=18)=>{const p=routes.nearest(x,z);return !p||p.d>p.half+r+8;};
  const palm=(x,z,h=22)=>{if(!clear(x,z,9))return;const y=heightAt(x,z);part(G.cyl,x,y+h/2,z,0,.8,h,.8,0x8c8060);addSolid(x,z,0,.8,.8,y,y+h);for(let k=0;k<7;k++){const a=k/7*TAU;part(frondGeo,x,y+h,z,a,1,1,1,k%2?0x44785b:0x548966);}};
  const gate=(s,off)=>{const p=place(s,off),y=heightAt(p.x,p.z);for(const side of [-1,1])block(p.x-p.tz*side*13,p.z+p.tx*side*13,p.yaw,3,24,4,0x77b8af,y);block(p.x,p.z,p.yaw,30,3,4,0xbcd9bc,y+23,false);part(portalGeo,p.x,y+12,p.z,p.yaw,10,10,10,0x75b9c6,true);};
  for(let s=90,i=0;s<path.length;s+=65,i++){
   const zone=zones[Math.min(5,Math.floor(s/path.length*6))];
   for(const side of [-1,1]){
    const p=place(s,side*(zone.id==='khaosan'?70:115+(i%3)*24)),y=heightAt(p.x,p.z),yaw=p.yaw;if(!clear(p.x,p.z,30))continue;
    if(zone.id==='bay'){
     const h=35+(i%5)*17;block(p.x,p.z,yaw,30,h,32,0x6c919e,y);glass.add(G.box,M(p.x,y+h*.58,p.z,yaw,30.3,h*.65,32.3),0x8cb4c0);
     for(let floor=8;floor<h;floor+=8)part(G.box,p.x,y+floor,p.z,yaw,30.6,.35,32.6,0xc0cfca);
     if(i%3===0){const q=place(s,side*55);block(q.x,q.z,yaw,2,8,2,0x7b8988,heightAt(q.x,q.z));}
    }else if(zone.id==='edo'){
     if(i%3===0){block(p.x,p.z,yaw,23,8,18,0x8b7660,y);part(gableGeo,p.x,y+9,p.z,yaw,27,6,13,0x4b5356);addSolid(p.x,p.z,yaw,13.5,13,y+8,y+12);for(const dx of [-8,8])part(G.box,p.x+p.tx*dx,y+3.5,p.z+p.tz*dx,yaw,1,6,18.3,0x605c50);}
     for(let k=0;k<4;k++){const x=p.x+k*8*p.tx,z=p.z+k*8*p.tz;part(G.taper8,x,heightAt(x,z)+1,z,yaw,1.3,2,.3,0xb7ad72);}
    }else if(zone.id==='angkor'){
     if(i%2===0){block(p.x,p.z,yaw,25,10,30,0x858c79,y);for(let k=0;k<4;k++){part(G.taper8,p.x,y+13+k*5,p.z,yaw,11-k*2,7,11-k*2,0x8d967f);addSolid(p.x,p.z,yaw,11-k*2,11-k*2,y+9.5+k*5,y+16.5+k*5);}}
     palm(p.x+p.tx*24,p.z+p.tz*24,25);
    }else if(zone.id==='khaosan'){
     const h=10+(i%3)*4;block(p.x,p.z,yaw,34,h,23,[0xc3b596,0x9cafa1,0xb99883][i%3],y);
     for(let k=-1;k<=1;k++){const x=p.x+p.tx*k*10,z=p.z+p.tz*k*10;part(G.box,x,y+h*.65,z,yaw,5,h*.6,24,0x507679);}
     const q=place(s,side*53);part(G.box,q.x,y+7,q.z,yaw,20,.7,9,[0xb9675d,0x638f8b,0xb59e61][i%3]);
     part(G.box,q.x,y+11,q.z,yaw,7,3,1,[0xe6a66b,0x9fd6c5,0xd6a8c5][i%3],true);
     for(let k=0;k<3;k++)part(G.ico,q.x+p.tx*k*8,y+6,q.z+p.tz*k*8,0,1.2,1.8,1.2,0xe9c489,true);
    }else if(zone.id==='donmueang'){
     if(side===1){block(p.x,p.z,yaw,52,12,45,0xbec8bd,y);part(G.box,p.x,y+13,p.z,yaw,58,2,50,0x6f8b91);}
     else {block(p.x,p.z,yaw,70,.15,70,0x596366,y,false);for(let k=-2;k<=2;k++)part(G.box,p.x+p.tx*k*12,y+.2,p.z+p.tz*k*12,yaw,1,.1,7,0xd6d3b6);}
    }else{
     palm(p.x,p.z,20+i%6);if(i%4===0){block(p.x,p.z,yaw,15,6,15,0xad9678,y);part(G.cone,p.x,y+8,p.z,yaw,14,6,14,0x806d54);addSolid(p.x,p.z,yaw,14,14,y+5,y+11);}
    }
   }
  }
  // Five lotus-bud towers and long galleries: an invented ruin inspired by Angkor's silhouette.
  const temple=place(path.length*.405,180),base=heightAt(temple.x,temple.z);
  block(temple.x,temple.z,temple.yaw,170,14,110,0x7e8874,base);
  for(let k=-5;k<=5;k++)block(temple.x+Math.cos(temple.yaw)*k*14,temple.z-Math.sin(temple.yaw)*k*14,temple.yaw,4,18,116,0x9a9e85,base+7);
  for(const [dx,dz,h]of [[0,0,155],[-65,-45,100],[65,-45,100],[-65,45,100],[65,45,100]]){
   const x=temple.x+Math.sin(temple.yaw)*dx-Math.cos(temple.yaw)*dz,z=temple.z+Math.cos(temple.yaw)*dx+Math.sin(temple.yaw)*dz;
   if(!clear(x,z,30))continue;block(x,z,temple.yaw,42,h*.35,42,0x858b78,base);
   for(let j=0;j<6;j++){part(G.taper8,x,base+h*.35+j*h*.10,z,temple.yaw,24-j*3.2,h*.13,24-j*3.2,0x929985);addSolid(x,z,temple.yaw,24-j*3.2,24-j*3.2,base+h*(.35+j*.10-.065),base+h*(.35+j*.10+.065));}
  }
  const tower=place(path.length*.73,175),ty=heightAt(tower.x,tower.z);block(tower.x,tower.z,tower.yaw,9,74,9,0xa4b4b1,ty);block(tower.x,tower.z,tower.yaw,28,12,20,0x7aa0a8,ty+68);part(G.cyl,tower.x,ty+88,tower.z,0,1,16,1,0xadbab1);addSolid(tower.x,tower.z,0,1,1,ty+80,ty+96);
  const aircraft=place(path.length*.77,-205),ay=heightAt(aircraft.x,aircraft.z);block(aircraft.x,aircraft.z,aircraft.yaw,5,5,52,0xd2d8ce,ay+3);part(G.box,aircraft.x,ay+7,aircraft.z,aircraft.yaw,58,1.2,11,0xb1c4c2);addSolid(aircraft.x,aircraft.z,aircraft.yaw,29,5.5,ay+6.4,ay+7.6);const tailX=aircraft.x-Math.sin(aircraft.yaw)*18,tailZ=aircraft.z-Math.cos(aircraft.yaw)*18;part(G.box,tailX,ay+13,tailZ,aircraft.yaw,2,15,9,0x8c6974);addSolid(tailX,tailZ,aircraft.yaw,1,4.5,ay+5.5,ay+20.5);
  // Offshore limestone silhouettes frame the southern coast without closing the riding corridor.
  for(let i=0;i<7;i++){const p=place(path.length*(.84+i*.019),-580-(i%3)*190),y=heightAt(p.x,p.z),r=35+(i%3)*12,h=95+(i%4)*24;part(G.taper8,p.x,y+h/2,p.z,p.yaw,r,h,r*.7,0x718b80);addSolid(p.x,p.z,p.yaw,r,r*.7,y,y+h);part(G.half,p.x,y+h,p.z,0,r*.66,12,r*.46,0x53755d);addSolid(p.x,p.z,0,r*.66,r*.46,y+h,y+h+12);}
  gate(90,-90);
  for(const [m,col,emissive]of [[stone,0xffffff,0],[glass,0xffffff,0x07141a],[light,0xffffff,0x634b30]])if(m.p.length){const mat=new THREE.MeshLambertMaterial({vertexColors:true,color:col,emissive,side:THREE.DoubleSide}),mesh=new THREE.Mesh(m.build(),mat);mesh.userData.monsoon=true;parent.add(mesh);}
  portalGeo.dispose();gableGeo.dispose();frondGeo.dispose();
 }
 globalThis.WindMonsoon=Object.freeze({zones,install,near,stage,terrain,build,get path(){return path;},CX,RX,RZ});
})();

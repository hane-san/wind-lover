/* A compressed fictional journey, with original geometry inspired by regional landscapes. */
(() => {
 const CX=150000,RX=1500,RZ=1050,TAU=Math.PI*2,CELL=128;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
 const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
 const baseZones=[
  {id:'bay',name:'豊洲風の運河と湾岸',key:'azure',top:0x527fa6,hor:0xc9dfe1,ground:0x779c89,road:0x667b83,verge:0x9fafa3,track:18},
  {id:'edo',name:'夕暮れの田畑と江戸街道',key:'steppe',top:0x855881,hor:0xf0b576,ground:0x8c9c56,road:0xb29b6c,verge:0x899953,track:8},
  {id:'angkor',name:'環濠とアンコールの森',key:'fergana',top:0x507d7b,hor:0xd4dfbc,ground:0x54734b,road:0x9d9478,verge:0x81805c,track:13},
  {id:'khaosan',name:'カオサンとバンランプー',key:'village',top:0x554974,hor:0xd79d82,ground:0x9e9178,road:0x686578,verge:0xb29d87,track:19},
  {id:'donmueang',name:'ドンムアン・空港と高架',key:'azure',top:0x648eac,hor:0xe1d9bd,ground:0x839275,road:0x637680,verge:0x9baca3,track:20},
  {id:'straits',name:'マレーの入り江と石灰岩',key:'issyk',top:0x4093af,hor:0xc5e4d5,ground:0x62835a,road:0xc7b68b,verge:0xb9c39b,track:11},
 ];
 let atlas=null,zones=baseZones.concat(WindAtlas.additions.map(z=>({...z})));
 let path=null,plots=[],patches=[],patchGrid=new Map(),signAtlas=null;
 const profile=[[0,20],[.045,22],[.085,38],[.14,24],[1/6,23],[.25,21],[1/3,25],[.43,27],[.50,20],[2/3,20],[.77,22],[5/6,31],[.90,60],[.965,27],[1,20]];
 function roadHeight(u){let i=0;while(i<profile.length-2&&u>profile[i+1][0])i++;const a=profile[i],b=profile[i+1];return mix(a[1],b[1],smooth(a[0],b[0],u));}
 function install(routes){
  if(path)return path;const points=[],cum=[0];
  for(let i=0;i<=480;i++){const a=i/480*TAU,r=1+.035*Math.sin(a*3)+.018*Math.sin(a*7);points.push({x:CX+RX*r*Math.cos(a),z:RZ*r*Math.sin(a),y:0});if(i)cum.push(cum.at(-1)+Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z));}
  for(let i=0;i<points.length;i++)points[i].y=roadHeight(cum[i]/cum.at(-1));points[480]={...points[0]};
  path=routes.addCircuit('monsoon',points);Object.assign(path,{region:'monsoon',realm:'monsoon',name:'日本と南の海を巡る旅'});for(const seg of path.segments)seg.half=30;routes.indexReach(path,1300);atlas=WindAtlas.create(routes,path,nearMain,baseZones);zones=atlas.zones;
  const patch=(s,off,hw,hd,kind,floor,water=null,site=null)=>{const p=site||pose(routes,s,off),q={...p,hw,hd,kind,floor,water,c:Math.cos(p.yaw),sn:Math.sin(p.yaw)};patches.push(q);const reach=Math.hypot(hw+24,hd+24);for(let x=Math.floor((q.x-reach)/CELL);x<=Math.floor((q.x+reach)/CELL);x++)for(let z=Math.floor((q.z-reach)/CELL);z<=Math.floor((q.z+reach)/CELL);z++){const key=x+','+z;if(!patchGrid.has(key))patchGrid.set(key,[]);patchGrid.get(key).push(q);}return q;};
  // Flooded and dry fields sit beside the riding corridor, with real shallow floors and banks.
  for(let s=path.length*.182,i=0;s<path.length*.322;s+=96,i++)for(const side of [-1,1])for(let row=0;row<3;row++){
   const p=routes.at(path,s),kind=(i+row)%4===0?'dry':(i+row)%3===0?'gold':'rice',floor=p.y-1.4-row*.35;
   plots.push(patch(s,side*(76+row*91),34,38,kind,floor,kind==='rice'?floor+.32:null));
  }
  // Level water bodies: canals, a bridge opening, the temple moat and the airport's drainage canal.
  for(let u=.035;u<.145;u+=.022)patch(path.length*u,-136,54,105,'canal',9,14);
  patch(path.length*.085,0,220,42,'bridge-water',4,14);
  for(const side of [-1,1]){patch(path.length*.411,300+side*136,26,210,'moat',17,20);patch(path.length*.411+side*190,300,110,26,'moat',17,20);}
  for(let u=.51;u<.65;u+=.035)patch(path.length*u,196,42,139,'city-canal',13,16);
  for(let u=.69;u<.80;u+=.025)patch(path.length*u,330,16,100,'drain',12,16);
  for(let s=path.length*.684;s<path.length*.817;s+=86)patch(s,-174,86,43,'apron',18.7);
  for(let s=path.length*.018;s<path.length*.16;s+=78)patch(s,-250,52,45,'quay',21);
  for(const p of atlas.waterPatches)patch(0,0,p.hw,p.hd,p.kind,p.floor,p.water,p);
  return path;
 }
 function nearMain(x,z){
  const a=((Math.atan2(z/RZ,(x-CX)/RX)%TAU)+TAU)%TAU,i=Math.min(479,Math.floor(a/TAU*480));let best=null;
  for(let j=-1;j<=1;j++){const seg=path?.segments[(i+j+480)%480];if(!seg)continue;const u=clamp(((x-seg.a.x)*seg.dx+(z-seg.a.z)*seg.dz)/(seg.length**2)),px=seg.a.x+seg.dx*u,pz=seg.a.z+seg.dz*u,d=Math.hypot(x-px,z-pz);if(!best||d<best.d)best={y:mix(seg.a.y,seg.b.y,u),d,s:seg.s+seg.length*u,side:(x-px)*-seg.tz+(z-pz)*seg.tx};}
  return best||{y:20,d:999,s:0,side:0};
 }
 function near(x,z){return atlas?atlas.near(x,z):nearMain(x,z);}
 function describe(p){const u=path?p.s/path.length:0,index=Math.min(5,Math.floor(u*6)),v=clamp((u*6-index)/.12);return {...zones[index],index,u,previous:zones[(index+5)%6],blend:v*v*(3-2*v)};}
 function stage(x,z){return atlas?atlas.stage(x,z):describe(near(x,z));}
 function local(p,x,z){const dx=x-p.x,dz=z-p.z;return{x:dx*p.c-dz*p.sn,z:dx*p.sn+dz*p.c};}
 function regionTerrain(id,p,x,z){
  const extra=atlas?.terrain(id,p,x,z);if(extra!==null&&extra!==undefined)return extra;
  const side=p.side,d=Math.abs(side),u=(p.mainS??p.s)/path.length,noise=Math.sin(x/133)*Math.sin(z/171)*1.2;
  if(id==='bay'){const shore=1-smooth(-225,-68,side);return mix(21+noise,-42,shore);}
  if(id==='edo'){const hills=smooth(370,850,d)*(80+35*Math.sin(x/310)*Math.cos(z/340));return p.y-1.2+noise*.35+hills;}
  if(id==='angkor')return 24+noise*.65+9*smooth(400,950,d)*Math.sin(x/570)**2;
  if(id==='khaosan'||id==='donmueang')return 19+noise*.16;
  const coves=96+68*Math.sin(u*TAU*19)+25*Math.cos(u*TAU*37),sea=1-smooth(-coves-145,-coves+15,side);
  const ridge=smooth(70,460,side)*(190+90*Math.sin(x/170)**2+35*Math.cos(z/290));
  return mix(p.y-2+ridge+noise,-42,sea);
 }
 function terrain(x,z){
  const p=near(x,z),q=stage(x,z);let h=q.weights?q.weights.reduce((n,v)=>n+regionTerrain(v.zone.id,p,x,z)*v.w,0):mix(regionTerrain(q.previous.id,p,x,z),regionTerrain(q.id,p,x,z),q.blend);
  h=mix(p.y-.35,h,smooth(34,80,Math.abs(p.side)));
  const ocean=smooth(2.0,2.65,Math.hypot((x-CX)/RX,z/RZ));h=mix(h,-42,ocean);
  for(const patch of patchGrid.get(Math.floor(x/CELL)+','+Math.floor(z/CELL))||[]){const a=local(patch,x,z),dx=Math.abs(a.x)-patch.hw,dz=Math.abs(a.z)-patch.hd,w=1-smooth(8,23,Math.max(dx,dz));if(w>0)h=mix(h,patch.floor,w);}
  return atlas?atlas.ground(h,x,z):h;
 }
 function waterAt(x,z){let top=null;for(const p of patchGrid.get(Math.floor(x/CELL)+','+Math.floor(z/CELL))||[]){if(p.water===null)continue;const q=local(p,x,z);if(Math.abs(q.x)<p.hw-1.5&&Math.abs(q.z)<p.hd-1.5)top=top===null?p.water:Math.max(top,p.water);}return top;}
 function colour(x,z,slope=0){
  const q=stage(x,z),a=q.previous.ground,b=q.ground,n=.94+.06*Math.sin(x/29)*Math.sin(z/41),rock=q.id==='straits'?smooth(.15,.55,slope)*q.blend:0;
  const result=[16,8,0].map((shift,k)=>mix(mix((a>>shift)&255,(b>>shift)&255,q.blend)/255*n,[.58,.61,.53][k],rock));
  return result;
 }
 function pose(routes,s,off=0){const p=routes.at(path,s);return{...p,x:p.x-p.tz*off,z:p.z+p.tx*off,yaw:Math.atan2(p.tx,p.tz)};}
 function signTexture(THREE){
  if(signAtlas)return signAtlas;const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d');
  const labels=[['TOYOSU','WATERFRONT'],['茶屋','街道'],['旅籠','夕暮れ'],['KHAO SAN','NIGHT MARKET'],['BANGLAMPHU','RIVERSIDE'],['NIGHT MARKET','FOOD & MUSIC'],['DON MUEANG','TERMINAL'],['STRAITS','COAST ROAD'],['KANAZAWA','RAIN & LATTICE'],['SHIKOKU','INDIGO RIVER'],['INNER ANGKOR','FOREST GALLERIES'],['RIVER TOWN','THAILAND'],['RYUKYU','VERMILLION TIDE'],['OKINAWA','CORAL COAST'],['NORTHERN LAKE','FOREST & CISE'],['HA GIANG','KARST HIGHLANDS']];
  for(let i=0;i<labels.length;i++){const x=(i%4)*256,y=Math.floor(i/4)*128;g.fillStyle=['#244b61','#715842','#59513b','#653b60','#285e63','#70523c','#2c5a6b','#4b6b57'][i%8];g.fillRect(x,y,256,128);g.strokeStyle='#d0b98c';g.lineWidth=3;g.strokeRect(x+6,y+6,244,116);g.fillStyle='#f5e6c0';g.textAlign='center';g.font='bold 28px sans-serif';g.fillText(labels[i][0],x+128,y+57,238);g.font='17px sans-serif';g.fillText(labels[i][1],x+128,y+91,235);}
  signAtlas=new THREE.CanvasTexture(c);signAtlas.anisotropy=2;return signAtlas;
 }
 function build({THREE,G,M,Merger,heightAt,addSolid},parent,routes){
  const stone=new Merger(),glass=new Merger(),light=new Merger(),water=new Merger(),signs={p:[],uv:[]},stats={fields:plots.length,canals:patches.filter(p=>['canal','city-canal','drain'].includes(p.kind)).length,landformPatches:patches.length,trees:0,houses:0,shops:0,bridges:0,islands:0};
  const part=(geo,x,y,z,yaw,sx,sy,sz,col,bright=false)=>{
   if(sy>.6){const r=routes.nearest(x,z,null,1000),hw=geo===G.box?sx/2:sx,hd=geo===G.box?sz/2:sz;if(r?.path.realm==='monsoon'&&y-sy/2<r.y+26&&!safeBox(x,z,yaw,hw,hd))return false;}
   (bright?light:stone).add(geo,M(x,y,z,yaw,sx,sy,sz),col);return true;
  };
  const clear=(x,z,r=8)=>{const p=routes.nearest(x,z,null,1500);return !p||p.d>p.half+r+5;};
  const safeBox=(x,z,yaw,hw,hd)=>{if(atlas.nodes.some(n=>n.plaza&&Math.hypot(x-n.x,z-n.z)<82+Math.hypot(hw,hd)))return false;const c=Math.cos(yaw),sn=Math.sin(yaw);for(const a of [-hw,0,hw])for(const b of [-hd,0,hd]){const p=routes.nearest(x+c*a+sn*b,z-sn*a+c*b,null,1500);if(p&&p.d<p.half+1)return false;}return true;};
  const solid=(x,z,yaw,hw,hd,bottom,top)=>{if(safeBox(x,z,yaw,hw,hd))addSolid(x,z,yaw,hw,hd,bottom,top);};
  const block=(p,w,h,d,col,y=heightAt(p.x,p.z),collision=true)=>{if(collision&&!safeBox(p.x,p.z,p.yaw,w/2,d/2))return false;part(G.box,p.x,y+h/2,p.z,p.yaw,w,h,d,col);if(collision)addSolid(p.x,p.z,p.yaw,w/2,d/2,y,y+h);return true;};
  const move=(p,right=0,forward=0)=>({...p,x:p.x+Math.cos(p.yaw)*right+Math.sin(p.yaw)*forward,z:p.z-Math.sin(p.yaw)*right+Math.cos(p.yaw)*forward});
  const gable=(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,-1,1,0,-1,0,1,-1,-1,0,1,1,0,1,0,1,1],3));g.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);g.computeVertexNormals();return g;})();
  const rice=(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0,.5,0,0,0,1,0,0,0,-.5,0,0,.5,0,1,0],3));g.computeVertexNormals();return g;})();
  const frond=(()=>{const p=[],ix=[];for(let i=0;i<=8;i++){const u=i/8,w=Math.sin(u*Math.PI)*2.7;for(const side of [-1,1])p.push(side*w,3*Math.sin(u*Math.PI)-6*u*u,u*18);}for(let i=0;i<8;i++){const a=i*2;ix.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;})();
  const roof=(p,w,h,d,col,topCol)=>{if(!safeBox(p.x,p.z,p.yaw,w*.56,d*.58))return;const y=heightAt(p.x,p.z);block(p,w,h,d,col,y);part(gable,p.x,y+h,p.z,p.yaw,w*.56,h*.55,d*.58,topCol);solid(p.x,p.z,p.yaw,w*.56,d*.58,y+h,y+h*1.55);stats.houses++;};
  const tree=(p,h=24,palm=false)=>{if(atlas.nodes.some(n=>n.plaza&&Math.hypot(p.x-n.x,p.z-n.z)<105))return;if(!clear(p.x,p.z,palm?17:10))return;const y=heightAt(p.x,p.z);if(y< -15)return;part(G.cyl,p.x,y+h/2,p.z,p.yaw,.65,h,.65,0x77694e);solid(p.x,p.z,0,.65,.65,y,y+h);stats.trees++;
   if(palm){for(let k=0;k<7;k++)part(frond,p.x,y+h,p.z,k/7*TAU,.9,.9,.9,k%2?0x365d43:0x477a50);}
   else {for(const [dx,dz,dy,r]of [[0,0,0,10],[-6,2,-3,8],[5,-4,-2,8]])part(G.ico,p.x+dx,y+h+dy,p.z+dz,p.yaw,r,r*.7,r,dy?0x48674a:0x557650);solid(p.x,p.z,0,14,14,y+h-9,y+h+7);}
  };
  const beam=(a,b,r,col)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),matrix=new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()),new THREE.Vector3(r,d.length(),r));stone.add(G.cyl,matrix,col);};
  const sign=(p,y,index,w=9,h=4)=>{const x=p.x,z=p.z,c=Math.sin(p.yaw)*w/2,s=Math.cos(p.yaw)*w/2,verts=[[x-c,y-h/2,z-s],[x+c,y-h/2,z+s],[x-c,y+h/2,z-s],[x+c,y+h/2,z+s]],u=index%4*.25,v=1-Math.floor(index/4)*.25;
   for(const [i,uv]of [[0,[u,v-.25]],[1,[u+.25,v-.25]],[2,[u,v]],[2,[u,v]],[1,[u+.25,v-.25]],[3,[u+.25,v]]]){signs.p.push(...verts[i]);signs.uv.push(...uv);}
  };
  const quad=(p,hw,hd,y,col,merger=water)=>{const pts=[move(p,-hw,-hd),move(p,hw,-hd),move(p,-hw,hd),move(p,hw,hd)].map(q=>new THREE.Vector3(q.x,y,q.z));merger.tri(pts[0],pts[2],pts[1],col);merger.tri(pts[1],pts[2],pts[3],col);};
  // A single clipped surface per cell prevents transparent canal/moat rectangles overlapping.
  const waterCells=new Map(),cell=8;
  for(const p of patches.filter(p=>p.water!==null)){const r=Math.hypot(p.hw,p.hd);for(let ix=Math.floor((p.x-r)/cell);ix<=Math.floor((p.x+r)/cell);ix++)for(let iz=Math.floor((p.z-r)/cell);iz<=Math.floor((p.z+r)/cell);iz++){
    const corners=[[ix*cell,iz*cell],[(ix+1)*cell,iz*cell],[(ix+1)*cell,(iz+1)*cell],[ix*cell,(iz+1)*cell]],d=corners.map(([x,z])=>local(p,x,z));
    if(!d.some(q=>Math.abs(q.x)<p.hw+cell&&Math.abs(q.z)<p.hd+cell))continue;const key=ix+','+iz;if(!waterCells.has(key))waterCells.set(key,{candidates:[],corners});waterCells.get(key).candidates.push(p);
  }}
  const clipped=(p,corners)=>{
    let polygon=corners.map(([x,z])=>local(p,x,z));
    for(const [axis,side,edge]of [['x',1,p.hw-1.5],['x',-1,p.hw-1.5],['z',1,p.hd-1.5],['z',-1,p.hd-1.5]]){
      const next=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=side*a[axis]-edge,db=side*b[axis]-edge;if(da<=0)next.push(a);if((da<0)!==(db<0)){const t=da/(da-db);next.push({x:mix(a.x,b.x,t),z:mix(a.z,b.z,t)});}}polygon=next;if(!polygon.length)break;
    }return polygon;
  };
  const area=poly=>Math.abs(poly.reduce((v,p,i)=>{const q=poly[(i+1)%poly.length];return v+p.x*q.z-q.x*p.z;},0))/2;
  const split=(poly,a,b)=>{
    const inside=[],outside=[],distance=p=>(b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x);
    for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=distance(p),dq=distance(q);(dp>=0?inside:outside).push(p);if((dp>0&&dq<0)||(dp<0&&dq>0)){const t=dp/(dp-dq),v={x:mix(p.x,q.x,t),z:mix(p.z,q.z,t)};inside.push(v);outside.push(v);}}
    return{inside,outside};
  };
  const difference=(subject,clip)=>{let inside=subject;const result=[];for(let i=0;i<clip.length&&inside.length;i++){const halves=split(inside,clip[i],clip[(i+1)%clip.length]);if(halves.outside.length>=3&&area(halves.outside)>.00001)result.push(halves.outside);inside=halves.inside;}return result;};
  for(const {candidates,corners}of waterCells.values()){
    const used=[];for(const p of candidates.sort((a,b)=>b.water-a.water)){
      const polygon=clipped(p,corners).map(q=>move(p,q.x,q.z));if(polygon.length<3||area(polygon)<.00001)continue;
      let pieces=[polygon];for(const prior of used)pieces=pieces.flatMap(poly=>difference(poly,prior));used.push(polygon);
      for(const poly of pieces){const pts=poly.map(q=>new THREE.Vector3(q.x,p.water,q.z));for(let i=1;i<pts.length-1;i++)water.tri(pts[0],pts[i+1],pts[i],p.kind==='rice'?0x96aaa1:p.kind==='moat'?0x627f70:0x538e96);}
    }
  }
  stats.waterCells=waterCells.size;
  for(let i=0;i<plots.length;i++){
   const p=plots[i],base=p.floor;if(p.kind!=='rice')quad(p,p.hw-1,p.hd-1,base+.12,p.kind==='gold'?0xaba267:0x897154,stone);
   for(const side of [-1,1]){block(move(p,side*p.hw,0),1.4,.48,p.hd*2,0x7b864f,base);block(move(p,0,side*p.hd),p.hw*2,.48,1.4,0x7b864f,base);}
   if(p.kind!=='dry')for(let x=-25;x<=25;x+=6)for(let z=-29;z<=29;z+=6){const q=move(p,x,z);part(rice,q.x,base+(p.water!==null?.32:.15),q.z,p.yaw,1.3,p.kind==='gold'?1.25:.85,1.3,p.kind==='gold'?0xc0ae62:0x64844e);}
  }
  // Toyosu: canals, a broad bridge, dense glass skyline and a remembered dock crane.
  for(let s=path.length*.018,i=0;s<path.length*.16;s+=78,i++){
   for(const side of [-1,1]){const p=pose(routes,s,side*(side<0?250:96+(i%3)*48)),h=45+(i%5)*19,y=heightAt(p.x,p.z);if(!clear(p.x,p.z,35))continue;block(p,36,h,40,0x6d929e,y);glass.add(G.box,M(p.x,y+h*.54,p.z,p.yaw,36.4,h*.82,40.4),0x91bbc6);for(let floor=8;floor<h;floor+=8)part(G.box,p.x,y+floor,p.z,p.yaw,36.8,.45,40.8,0xd0d8d0);}
  }
  const bridgeS=path.length*.085;for(const ds of [-100,100])for(const side of [-1,1]){const p=pose(routes,bridgeS+ds,side*39),y=heightAt(p.x,p.z),top=routes.at(path,bridgeS+ds).y;block(p,4,Math.max(5,top-y),5,0xa5b7b2,y);}
  stats.bridges++;const crane=pose(routes,path.length*.125,-260),cy=heightAt(crane.x,crane.z);block(crane,6,70,6,0xb0bab0,cy);block(crane,96,3,4,0xb5bfb7,cy+67);block(move(crane,40),1,35,1,0x7e8c85,cy+32);
  sign(pose(routes,path.length*.04,45),36,0,12,5);
  // Edo: an unmarked earth lane, irrigation fields, thatched hamlets and roadside tea houses.
  for(let s=path.length*.19,i=0;s<path.length*.327;s+=165,i++){
   const side=i%2?1:-1,p=pose(routes,s,side*385);roof(p,21,7,17,0x8b7658,0x625d46);const q=pose(routes,s+28,side*393);roof(q,13,5,11,0x8d7f61,0x6a6149);tree(pose(routes,s-30,side*420),20);
  }
  for(const u of [.205,.29]){const p=pose(routes,path.length*u,70);roof(p,16,6,23,0x8e7658,0x5f5947);sign(move(p,-9),heightAt(p.x,p.z)+5,u<.25?1:2,5,5);}
  // Angkor: a green inland plain with sugar palms, forest crowns, moats and five lotus-bud towers.
  for(let s=path.length*.342,i=0;s<path.length*.495;s+=36,i++)for(const side of [-1,1])for(const off of [56,128,220,450]){if(side>0&&s>path.length*.37&&s<path.length*.455&&off>100&&off<450)continue;tree(pose(routes,s+(off%17),side*off),20+(i%5)*3,i%5===0);}
  const temple=pose(routes,path.length*.411,300),ty=24;block(temple,185,9,240,0x7d8469,ty-3);
  for(const level of [0,1,2])block(temple,160-level*35,5,205-level*40,0x8b9278,ty+6+level*5);
  for(const [dx,dz,h]of [[0,0,128],[-52,-62,87],[52,-62,87],[-52,62,87],[52,62,87]]){
   const p=move(temple,dx,dz),base=ty+21;block(p,27,h*.35,27,0x858d74,base);
   for(let j=0;j<7;j++){const r=(17-j*1.8)*(1+.14*Math.sin(j));part(G.taper8,p.x,base+h*.35+j*h*.078,p.z,p.yaw,r,h*.12,r,0x929a7f);solid(p.x,p.z,p.yaw,r,r,base+h*(.35+j*.078-.06),base+h*(.35+j*.078+.06));}
   for(const side of [-1,1])for(let j=0;j<3;j++){const q=move(p,side*14,(-1+j)*8);part(G.box,q.x,base+14,q.z,q.yaw,.5,15,3.5,0x566b52);}
  }
  for(const side of [-1,1]){const p=move(temple,side*78,0);block(p,13,14,224,0x7d886e,ty+6);part(gable,p.x,ty+20,p.z,p.yaw,8,5,114,0x8b967c);solid(p.x,p.z,p.yaw,8,114,ty+20,ty+25);}
  const entrance=pose(routes,path.length*.382),ey=routes.at(path,path.length*.382).y;
  for(const side of [-1,1]){const p=move(entrance,side*49);block(p,30,33,23,0x8a9276,ey);}
  // Only these high beams span a road: 32m below them remain open, including the camera boom.
  const highBox=(p,w,h,d,y,col)=>{part(G.box,p.x,y+h/2,p.z,p.yaw,w,h,d,col);addSolid(p.x,p.z,p.yaw,w/2,d/2,y,y+h);};
  highBox(entrance,129,5,25,ey+33,0x929a7e);
  for(const [off,h,r]of [[0,43,20],[-37,24,12],[37,24,12]]){const p=move(entrance,off);for(let k=0;k<5;k++){const radius=r-k*r*.13,y=ey+38+k*h*.16;part(G.taper8,p.x,y+h*.10,p.z,p.yaw,radius,h*.20,radius,0x939b7f);addSolid(p.x,p.z,p.yaw,radius,radius,y,y+h*.20);}}
  // Bangkok: continuous shophouses, projecting signs, awnings, stalls and high lantern strings.
  for(let s=path.length*.508,i=0;s<path.length*.661;s+=39,i++)for(const side of [-1,1]){
   const p=pose(routes,s,side*62),y=heightAt(p.x,p.z),h=15+(i%3)*4,col=[0xc3987e,0x83aaa1,0xc1ac7f,0xa28fa3][i%4];block(p,26,h,36,col,y);stats.shops++;
   block(p,26.4,.7,36.4,0xc8c4a6,y+h);
   for(let floor=4;floor<h;floor+=5)for(const right of [-9,-3,3,9]){const q=move(p,right,-18.25);part(G.box,q.x,y+floor,q.z,q.yaw,3.4,2.7,.3,0x3e6268);}
   const endSign=move(p,0,-18.7);endSign.yaw+=Math.PI/2;sign(endSign,y+h-2,3+i%3,20,4);
   for(let floor=4;floor<h;floor+=5)for(let k=-1;k<=1;k++){const q=move(p,-side*13.2,k*9);part(G.box,q.x,y+floor,q.z,q.yaw,.3,2.5,4.5,0x425e62);}
   const front=move(p,-side*17);block(front,9,.6,31,[0xa76158,0x4d8882,0xab9156][i%3],y+6,false);
   const shop=move(p,-side*22,8);block(shop,4,2.5,6,0x8d795b,y);sign(move(p,-side*13.6),y+h-3,3+i%3,15,3.5);
   if(i%2===0){const blade=move(p,-side*18,-12);blade.yaw+=Math.PI/2;sign(blade,y+h+2,3+i%3,6,10);}
   if(side===1&&i%3===0){let prev=null;for(let k=0;k<=10;k++){const q=pose(routes,s,-44+k*8.8),h=y+23-3*Math.sin(k/10*Math.PI),a=[q.x,h,q.z];if(prev)beam(prev,a,.065,0x5b514a);prev=a;if(k%2===0)part(G.ico,q.x,h-1,q.z,0,.8,1.2,.8,0xe9bd78,true);}for(const sd of [-1,1])block(pose(routes,s,sd*45),.4,24,.4,0x6b6c60,y);}
  }
  // Don Mueang: a parallel runway and elevated urban road, not another village street.
  for(let s=path.length*.684,i=0;s<path.length*.817;s+=86,i++){
   const runway=pose(routes,s,-174);block(runway,172,.3,86,0x65777a,18.7);for(const side of [-1,1]){const p=move(runway,side*72);quad(p,.3,40,19.08,0xd9d9c0,stone);}for(let k=-2;k<=2;k++){const p=move(runway,0,k*13);quad(p,1,4,19.1,0xe0dfc9,stone);}
   const via=pose(routes,s,184),gy=heightAt(via.x,via.z),y=40;block(via,23,2,89,0x9eaead,y,false);for(const side of [-1,1])block(move(via,side*9),2,y-gy,3,0x929f9a,gy);stats.bridges++;
   if(i%3===0){const p=pose(routes,s,255);block(p,65,12,125,0xc1cabc,19);glass.add(G.box,M(p.x,27,p.z,p.yaw,66,8,126),0x88a9ab);sign(move(p,-34),29,6,26,6);}
  }
  const tower=pose(routes,path.length*.74,130);block(tower,9,72,9,0xa6b4ad,19);block(tower,29,10,22,0x769da4,85);block(tower,2,15,2,0xa9b7b0,95);
  for(const u of [.71,.782]){const p=pose(routes,path.length*u,-195);block(p,5,5,48,0xd5d9cd,22);block(p,55,1,10,0xbdcfce,26);block(move(p,0,-18),2,14,9,0x8a6774,26);for(const side of [-1,1])block(move(p,side*2,-10),1.5,4,3,0x4c5655,19);block(move(p,0,16),1.4,4,2,0x4c5655,19);}
  // Coast: forested limestone escarpments above small coves, fishing huts and offshore stacks.
  for(let s=path.length*.84,i=0;s<path.length*.997;s+=65,i++){
   for(const side of [-1,1])tree(pose(routes,s,side*(68+i%3*23)),20+i%5,true);
   tree(pose(routes,s+20,210),24);if(i%4===0)roof(pose(routes,s,-180),13,6,18,0x977b59,0x76684b);
  }
  for(let i=0;i<9;i++){const p=pose(routes,path.length*(.844+i*.017),-420-(i%3)*150),y=-42,h=110+(i%4)*27,r=30+(i%3)*14;part(G.sediment,p.x,y+h/2,p.z,p.yaw,r,h,r*.7,0x778e81);solid(p.x,p.z,p.yaw,r,r*.7,y,y+h);part(G.half,p.x,y+h,p.z,0,r*.83,18,r*.56,0x4d7050);solid(p.x,p.z,0,r*.83,r*.56,y+h,y+h+18);stats.islands++;}
  // Coastal headlands sit ahead around the bends, so their rock faces enter the forward panorama.
  for(const [u,off,h,r]of [[.878,-112,115,27],[.932,-145,145,34],[.969,-105,100,25]]){const p=pose(routes,path.length*u,off),y=heightAt(p.x,p.z);part(G.sediment,p.x,y+h/2,p.z,p.yaw,r,h,r*.72,0x88978b);solid(p.x,p.z,p.yaw,r,r*.72,y,y+h);part(G.half,p.x,y+h,p.z,p.yaw,r*.83,12,r*.6,0x4e7454);solid(p.x,p.z,p.yaw,r*.83,r*.6,y+h,y+h+12);}
  atlas.build({THREE,G,M,Merger,parent,stone,glass,light,water,part,block,move,roof,tree,sign,quad,beam,safeBox,heightAt,waterAt,addSolid,stats});
  const gate=pose(routes,90,-90),gy=heightAt(gate.x,gate.z),torus=new THREE.TorusGeometry(10,.32,5,32);for(const side of [-1,1])block(move(gate,side*13),3,24,4,0x77b8af,gy);part(torus,gate.x,gy+12,gate.z,gate.yaw,1,1,1,0x75b9c6,true);torus.dispose();
  for(const [m,kind,emissive]of [[stone,'solid',0],[glass,'glass',0x0c1b20],[light,'lantern',0x967047],[water,'water',0x101b18]])if(m.p.length){const mat=kind==='water'?new THREE.MeshPhongMaterial({vertexColors:true,shininess:42,specular:0xb4cabb,transparent:true,opacity:.92,side:THREE.DoubleSide}):new THREE.MeshLambertMaterial({vertexColors:true,emissive,side:THREE.DoubleSide});const mesh=new THREE.Mesh(m.build(),mat);Object.assign(mesh.userData,{monsoon:true,sceneryKind:kind,sceneryStats:stats});parent.add(mesh);}
  if(signs.p.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(signs.p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(signs.uv,2));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:signTexture(THREE),side:THREE.DoubleSide}));Object.assign(mesh.userData,{monsoon:true,sceneryKind:'signs',sceneryStats:stats});parent.add(mesh);}
  gable.dispose();rice.dispose();frond.dispose();
 }
 globalThis.WindMonsoon=Object.freeze({get zones(){return zones;},install,near,stage,terrain,waterAt,colour,build,pose,get atlas(){return atlas;},departure:id=>atlas.departure(id),plazaAt:(x,z)=>atlas?.plazaAt(x,z),guide:(P,s,dt)=>atlas?.guide(P,s,dt),reset:P=>atlas?.reset(P),weather:(x,z,t)=>atlas.weather(x,z,t),get path(){return path;},get plots(){return plots;},get patches(){return patches;},CX,RX,RZ});
})();

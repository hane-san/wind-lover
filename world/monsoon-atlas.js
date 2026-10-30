/* A compact fictional atlas: cultural landscapes connected by a freely chosen web of roads. */
(() => {
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const u=clamp((x-a)/(b-a));return u*u*(3-2*u);};
 const colour=(a,b,t)=>[16,8,0].map(s=>mix((a>>s)&255,(b>>s)&255,t)/255);
 const additions=[
  {id:'kanazawa',name:'雨と格子、現代金沢',key:'azure',x:650,z:420,y:28,top:0x727b96,hor:0xdec5b2,ground:0x829477,road:0x8e9290,verge:0xb0afa0,track:15},
  {id:'shikoku',name:'四国・藍の川と山の集落',key:'fergana',x:280,z:680,y:54,top:0x5b8b9d,hor:0xc5dcc7,ground:0x57754b,road:0xa89b76,verge:0x7c935b,track:12},
  {id:'ainu',name:'北の森と湖、アイヌ文化の景色',key:'karakol',x:-180,z:660,y:30,top:0x6c8ca1,hor:0xd9d6d7,ground:0x738764,road:0xa39a7a,verge:0x82936e,track:11},
  {id:'hagiang',name:'ハジャン・蒼い川と岩の高原',key:'tianshan',x:-700,z:460,y:88,top:0x648b9d,hor:0xd3c9b0,ground:0x637c54,road:0xa39d8b,verge:0x8c9c76,track:13},
  {id:'inner',name:'アンコールの奥、根と回廊',key:'fergana',x:-700,z:-120,y:28,top:0x526f78,hor:0xc5cfac,ground:0x4f6e45,road:0x99906f,verge:0x72825b,track:12},
  {id:'thai',name:'タイの水郷と夕映えの塔',key:'village',x:-350,z:-620,y:22,top:0x985f93,hor:0xf2ba85,ground:0x87946a,road:0xb3a282,verge:0x9da883,track:15},
  {id:'ryukyu',name:'琉球・赤瓦と曲がる城壁',key:'aktau',x:250,z:-580,y:38,top:0x6e74a6,hor:0xe5b98f,ground:0x809060,road:0xbda77c,verge:0x9eab75,track:12},
  {id:'okinawa',name:'沖縄・珊瑚の海と港町',key:'issyk',x:760,z:-260,y:26,top:0x3d9fbd,hor:0xc4e9dc,ground:0x86aa71,road:0xc9ba90,verge:0xa9c592,track:13},
 ];
 const SCALE=1.16;
 function create(routes,main,mainNear,oldZones){
  const CX=150000,zones=oldZones.concat(additions.map(z=>({...z}))).map(z=>({...z,...WindRegionalAtmosphere.profiles[z.id]})),nodes=[],roads=[],grid=new Map(),CELL=128;
  for(let i=0;i<oldZones.length;i++){const p=routes.at(main,main.length*(i/6+.015));Object.assign(zones[i],{x:p.x,z:p.z,y:p.y,radius:460*SCALE});}
  for(const z of zones.slice(6)){z.x=CX+z.x*SCALE;z.z*=SCALE;z.radius=310*SCALE;nodes.push({...z,edges:[],plaza:true});}
  const centre={id:'crossroads',name:'旅の交差点',x:CX,z:0,y:30,edges:[],plaza:true};nodes.push(centre);
  function addRoad(id,points,a,b){const path=routes.addRoad(id,points,'monsoon');path.realm='monsoon';path.atlas=true;path.nodes=[a,b];for(const s of path.segments)s.half=28;roads.push(path);a.edges.push({path,dir:1,to:b});b.edges.push({path,dir:-1,to:a});return path;}
  function link(a,b,index,startTangent=null){
   const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),tx=dx/d,tz=dz/d,h=d*.27;
   const A=a,B={x:a.x+(startTangent?.tx??tx)*h,z:a.z+(startTangent?.tz??tz)*h,y:a.y+(startTangent?.grade||0)*h},C={x:b.x-tx*h,z:b.z-tz*h,y:b.y},D=b,points=[];
   const n=Math.ceil(d/12);for(let i=0;i<=n;i++){const t=i/n,v=1-t;points.push({x:v*v*v*A.x+3*v*v*t*B.x+3*v*t*t*C.x+t*t*t*D.x,z:v*v*v*A.z+3*v*v*t*B.z+3*v*t*t*C.z+t*t*t*D.z,y:v*v*v*A.y+3*v*v*t*B.y+3*v*t*t*C.y+t*t*t*D.y});}
   let total=0;const cum=[0];for(let i=1;i<points.length;i++){total+=Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z);cum.push(total);}
   const flatA=a.plaza?85:0,flatB=b.plaza?85:0,span=Math.max(50,total-flatA-flatB);
   for(let i=0;i<points.length;i++){const u=clamp((cum[i]-flatA)/span),u2=u*u,u3=u2*u,m0=(startTangent?.grade||0)*span;points[i].y=(2*u3-3*u2+1)*a.y+(u3-2*u2+u)*m0+(-2*u3+3*u2)*b.y;}
   if(!a.plaza){
    let j=points.findIndex(p=>mainNear(p.x,p.z).d>=80);if(j<1)j=Math.floor(points.length*.35);const begin=cum[j],startY=mainNear(points[j].x,points[j].z).y,span=Math.max(60,total-85-begin);
    const rise=(mainNear(points[Math.min(n,j+1)].x,points[Math.min(n,j+1)].z).y-mainNear(points[Math.max(0,j-1)].x,points[Math.max(0,j-1)].z).y)/Math.max(1,cum[Math.min(n,j+1)]-cum[Math.max(0,j-1)]);
    for(let i=0;i<points.length;i++){const p=points[i],r=mainNear(p.x,p.z),u=clamp((cum[i]-begin)/span),u2=u*u,u3=u2*u;p.rawY=i<=j?r.y:(2*u3-3*u2+1)*startY+(u3-2*u2+u)*rise*span+(-2*u3+3*u2)*b.y;p.y=mix(r.y,p.rawY,smooth(55,120,r.d));}
   }
   points[0]={...points[0],x:a.x,z:a.z,y:a.y};points[n]={...points[n],x:b.x,z:b.z,y:b.y};return addRoad('atlas-'+index,points,a,b);
  }
  for(let i=0;i<8;i++){link(nodes[i],nodes[(i+1)%8],'ring-'+i);link(nodes[i],centre,'cross-'+i);const m=mainNear(nodes[i].x,nodes[i].z),p=routes.at(main,m.s),anchor={...p,id:'gate-'+i,name:'外周の分かれ道',edges:[],plaza:false,mainS:p.s};nodes.push(anchor);const path=link(anchor,nodes[i],'gate-'+i,p);anchor.edges.push({path:main,dir:1,to:{name:'外周の先へ'}},{path:main,dir:-1,to:{name:'外周を戻る'}});}
  // Geometry queries use an independent, small spatial index; riding preference never moves terrain.
  for(const path of [main,...roads])for(const seg of path.segments)for(let x=Math.floor((Math.min(seg.a.x,seg.b.x)-210)/CELL);x<=Math.floor((Math.max(seg.a.x,seg.b.x)+210)/CELL);x++)for(let z=Math.floor((Math.min(seg.a.z,seg.b.z)-210)/CELL);z<=Math.floor((Math.max(seg.a.z,seg.b.z)+210)/CELL);z++){const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(seg);}
  function near(x,z){const fallback=mainNear(x,z);let best=null;for(const seg of grid.get(Math.floor(x/CELL)+','+Math.floor(z/CELL))||[]){const u=clamp(((x-seg.a.x)*seg.dx+(z-seg.a.z)*seg.dz)/(seg.length**2)),px=seg.a.x+seg.dx*u,pz=seg.a.z+seg.dz*u,d=Math.hypot(x-px,z-pz);if(!best||d<best.d)best={y:mix(seg.a.y,seg.b.y,u),d,s:seg.s+seg.length*u,side:(x-px)*-seg.tz+(z-pz)*seg.tx,path:seg.path};}if(!best)return{...fallback,path:main,mainS:fallback.s};best.y=mix(fallback.y,best.y,1-smooth(150,205,best.d));best.mainS=fallback.s;return best;}
  function stage(x,z){
   const nearest=[];for(let i=0;i<zones.length;i++){const q=zones[i],d=Math.hypot(x-q.x,z-q.z)/(q.radius||400),entry={q,d,i};let j=0;while(j<nearest.length&&nearest[j].d<d)j++;nearest.splice(j,0,entry);if(nearest.length>4)nearest.pop();}
   const edge=nearest[3].d,raw=nearest.slice(0,3).map(a=>Math.max(.0000001,(edge-a.d)**4)),sum=raw.reduce((a,b)=>a+b,0),weights=raw.map((w,i)=>({zone:nearest[i].q,w:w/sum,index:nearest[i].i})),a=nearest[0].q,blend=weights[0].w,previous={...nearest[1].q};
   for(const key of ['top','hor','ground','road','verge']){let value=0;for(const shift of [16,8,0]){const c=weights.slice(1).reduce((n,v)=>n+((v.zone[key]>>shift)&255)*v.w,0)/Math.max(.000001,1-blend);value|=Math.round(c)<<shift;}previous[key]=value;}
   previous.ruts=weights.slice(1).reduce((n,v)=>n+v.zone.ruts*v.w,0)/Math.max(.000001,1-blend);previous.track=weights.slice(1).reduce((n,v)=>n+v.zone.track*v.w,0)/Math.max(.000001,1-blend);return{...a,index:nearest[0].i,previous,blend,weights,u:mainNear(x,z).s/main.length};
  }
  function plazaAt(x,z){let best=null,d=Infinity;for(const n of nodes.filter(n=>n.plaza)){const r=Math.hypot(x-n.x,z-n.z);if(r<96&&r<d){best=n;d=r;}}return best;}
  function surface(x,z,feet=Infinity){
   // The narrower branch must not hide the wider parent road's shoulder at a fork.
   let best=null,score=Infinity;
   for(const r of routes.candidates(x,z)){
    if(r.path.realm!=='monsoon'||r.d>r.half+.5||feet<r.y-.8)continue;
    const rank=Number.isFinite(feet)?Math.abs(feet-r.y-.14):-r.y;
    if(rank<score){best=r;score=rank;}
   }return best;
  }
  function ground(h,x,z){const p=near(x,z),bridge=p.path===main&&Math.abs(p.s-main.length*.085)<75;
   let n=null,d=Infinity;for(const node of nodes)if(node.plaza){const r=Math.hypot(x-node.x,z-node.z);if(r<145&&r<d){n=node;d=r;}}
   if(n)h=mix(h,n.y-.45,1-smooth(105,145,d));
   if(!bridge&&h>p.y-18)h=mix(h,p.y-.45,1-smooth(p.path.segments[0].half+22,p.path.segments[0].half+50,p.d));
   return h;
  }
  function departure(id){const node=nodes.find(n=>n.id===id);if(node){const incoming=node.edges.find(e=>!e.to.plaza);if(incoming){const p=routes.at(incoming.path,incoming.path.length-145);return{...p,yaw:Math.atan2(p.tx,p.tz)};}const edge=node.edges[0],p=routes.at(edge.path,edge.dir>0?35:edge.path.length-35);return{...p,yaw:Math.atan2(p.tx*edge.dir,p.tz*edge.dir)};}const i=oldZones.findIndex(z=>z.id===id),p=routes.at(main,main.length*(Math.max(0,i)/6+.015));return{...p,yaw:Math.atan2(p.tx,p.tz)};}
  function terrain(id,p,x,z){const q=zones.find(q=>q.id===id),d=Math.hypot(x-q.x,z-q.z),wave=Math.sin(x/95)*Math.cos(z/113);
   if(id==='kanazawa')return 23+wave*.65;
   if(id==='shikoku'){const v=(x-q.x)*.7+(z-q.z)*.7;return 18+145*smooth(70,350,Math.abs(v))+wave*12;}
   if(id==='ainu')return 25+wave*1.5+22*smooth(190,470,d);
   if(id==='hagiang'){const v=(x-q.x)*.75-(z-q.z)*.66;return 12+240*smooth(75,330,Math.abs(v))+45*Math.sin(z/85)**2*smooth(100,310,Math.abs(v));}
   if(id==='inner')return 25+wave*4+12*smooth(130,430,d);
   if(id==='thai')return 18+wave*.3;
   if(id==='ryukyu')return 27+wave*2+40*smooth(90,300,d);
   if(id==='okinawa')return mix(24+wave,-38,smooth(100,340,(x-q.x)*.5-(z-q.z)*.85));
   return null;
  }
  const weather=(x,z,t)=>WindRegionalAtmosphere.weather(stage(x,z),t);
  const waterPatches=[];
  const pond=(id,dx,dz,hw,hd,water,yaw=0)=>{const n=nodes.find(n=>n.id===id);waterPatches.push({x:n.x+dx,z:n.z+dz,yaw,hw,hd,water,floor:water-3,kind:id+'-water'});};
  pond('kanazawa',175,0,18,160,24,.35);pond('ainu',58,-212,120,85,27,-.266);
  pond('shikoku',-76,-185,160,28,21,-.39);pond('hagiang',185,-30,26,260,17,.35);
  pond('inner',-155,-20,35,170,23,.25);pond('thai',130,80,45,210,18,.35);
  pond('ryukyu',-150,-80,70,35,30,-.1);pond('okinawa',-205,70,140,110,20,-1.24);
  function build(ctx){
   const {THREE,G,M,Merger,parent,stone,glass,light,part,block,move,roof,tree,sign,quad,beam,safeBox,heightAt,waterAt,addSolid,stats}=ctx;
   const labelIndex={kanazawa:8,shikoku:9,inner:10,thai:11,ryukyu:12,okinawa:13,ainu:14,hagiang:15};
   const frame=n=>({...n,yaw:Math.atan2(n.x-CX,n.z)});
   const sites=(n,r=155,count=18)=>Array.from({length:count},(_,i)=>{const a=i/count*Math.PI*2+.27,q=frame(n);return move(q,Math.cos(a)*(r+i%3*22),Math.sin(a)*(r+i%3*22));}).filter(p=>safeBox(p.x,p.z,p.yaw,28,30)&&stage(p.x,p.z).id===n.id&&(waterAt(p.x,p.z)===null||heightAt(p.x,p.z)>=waterAt(p.x,p.z)));
   const plazas=new Merger();
   for(const n of nodes.filter(n=>n.plaza)){
    const q=stage(n.x,n.z);plazas.add(G.cyl,M(n.x,n.y+.08,n.z,0,82,.12,82),q.road);
    for(let i=0,count=0;i<16&&count<3;i++){const angle=i/16*Math.PI*2,p=move(frame(n),Math.sin(angle)*105,Math.cos(angle)*105);if(!safeBox(p.x,p.z,p.yaw,2,2))continue;const edge=n.edges[count%n.edges.length],id=edge.to.id||n.id;block(p,1.1,3,1.1,0xa1a78c);sign(p,heightAt(p.x,p.z)+4,labelIndex[id]??labelIndex[n.id]??8,9,3);count++;}
   }
   const floor=new THREE.Mesh(plazas.build(),new THREE.MeshLambertMaterial({vertexColors:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:2}));floor.userData.monsoon=true;floor.userData.sceneryKind='plazas';floor.userData.surface='atlas-plaza';parent.add(floor);
   const nBy=id=>nodes.find(n=>n.id===id);
   for(const p of sites(nBy('kanazawa'))){roof(p,21,9,24,0x9d856b,0x545e63);const y=heightAt(p.x,p.z);for(let k=-4;k<=4;k++){const a=move(p,-11,k*2.3);part(G.box,a.x,y+5,a.z,a.yaw,.25,7,.24,0x54463b);}if(Math.sin(p.x)>0){const q=move(p,7,-16);block(q,18,13,16,0xa6b9b7);glass.add(G.box,M(q.x,y+9,q.z,q.yaw,18.4,7,16.4),0x91b9c2);}}
   const art=sites(nBy('kanazawa'),225,16)[0];if(art){const y=heightAt(art.x,art.z);part(G.cyl,art.x,y+5,art.z,0,44,10,44,0xc5d1cb);addSolid(art.x,art.z,0,44,44,y,y+10);part(G.cyl,art.x,y+11,art.z,0,45,1.5,45,0xe0ded1);sign(move(art,0,-47),y+7,8,17,5);}
   for(const id of ['shikoku','hagiang']){const n=nBy(id);for(const p of sites(n,205,22)){roof(p,16,6,18,id==='shikoku'?0x8c7c5f:0xa2987b,0x5d6555);tree(move(p,25),23);}
    for(let k=0;k<7;k++){const p=move(frame(n),(k%2?1:-1)*(220+k%3*35),-220+k*70),y=heightAt(p.x,p.z),h=id==='hagiang'?150+k%3*45:90+k%3*24,r=30+k%3*12;if(!safeBox(p.x,p.z,p.yaw,r,r))continue;part(G.sediment,p.x,y+h/2,p.z,p.yaw,r,h,r*.75,id==='hagiang'?0x7d8c80:0x6b8068);addSolid(p.x,p.z,p.yaw,r,r*.75,y,y+h);part(G.half,p.x,y+h,p.z,0,r*.8,10,r*.6,0x4c6e4c);}
   }
   const northern=nBy('ainu');for(const p of sites(northern,145,22)){roof(p,15,5,19,0x877b59,0x9a8f68);const y=heightAt(p.x,p.z);block(move(p,0,12),7,3,5,0x8b805d,y);}
   for(const n of [northern,nBy('shikoku'),nBy('hagiang')])for(let i=0;i<44;i++){const a=i/44*Math.PI*2,p=move(frame(n),Math.cos(a)*(120+i%4*25),Math.sin(a)*(120+i%4*25));if(!safeBox(p.x,p.z,p.yaw,12,12))continue;const y=heightAt(p.x,p.z),h=19+i%7;
    if(n.id==='ainu'){part(G.cyl,p.x,y+h/2,p.z,0,.45,h,.45,0xd8dace);addSolid(p.x,p.z,0,.45,.45,y,y+h);for(let j=0;j<4;j++)part(G.box,p.x,y+3+j*4,p.z,0,.95,.18,.95,0x576860);part(G.ico,p.x,y+h,p.z,0,9,6,9,0x769374);}
    else tree(p,23+i%7);
   }
   const inner=nBy('inner');for(const p of sites(inner,145,26)){const y=heightAt(p.x,p.z);block(p,19,12,21,0x7d8869,y);for(let k=0;k<3;k++){const q=move(p,(k-1)*6,-11);block(q,2,13,3,0x68785d,y);}
    const q=move(p,0,7);tree(q,30);for(const side of [-1,1])beam([q.x,y+24,q.z],[p.x+side*10,y,p.z],.65,0x786f52);
   }
   const tha=nBy('thai');for(const p of sites(tha,160,24)){roof(p,17,7,25,0xada17d,0x9e6954);tree(move(p,24),23,true);}
   const wat=sites(tha,230,22)[0];if(wat){const y=heightAt(wat.x,wat.z);block(wat,38,12,42,0xc4b17c,y);for(let k=0;k<5;k++){const r=16-k*2.7;part(G.taper8,wat.x,y+16+k*8,wat.z,wat.yaw,r,10,r,0xb2995f);addSolid(wat.x,wat.z,wat.yaw,r,r,y+11+k*8,y+21+k*8);}}
   const ryu=nBy('ryukyu');for(const p of sites(ryu,155,24)){roof(p,20,6,22,0xc4b797,0xa7634c);const y=heightAt(p.x,p.z);for(const side of [-1,1])block(move(p,side*15),3,2.5,30,0xb2b49b,y);tree(move(p,22),22,true);}
   const castle=sites(ryu,235,26)[0];if(castle){const y=heightAt(castle.x,castle.z);for(let k=0;k<3;k++)block(castle,92-k*17,9,65-k*10,0xb9bda6,y+k*9);const q={...castle};roof(q,38,16,42,0xac5644,0xb86a4d);sign(move(q,0,-25),y+10,12,18,5);}
   const oki=nBy('okinawa');for(const p of sites(oki,165,22)){roof(p,18,6,24,0xc2c3aa,0xb46f56);const y=heightAt(p.x,p.z);if(Math.sin(p.z)>0)block(move(p,14),15,16,19,0xc1d1c7,y);tree(move(p,25),22,true);}
   for(let i=0;i<7;i++){const p=move(frame(oki),205+i*24,-150+i%3*45),y=heightAt(p.x,p.z);if(safeBox(p.x,p.z,p.yaw,12,12)){part(G.ico,p.x,y+4,p.z,0,12,8,9,0xc5c9ad);addSolid(p.x,p.z,0,12,9,y,y+12);}}
   const heroSite=(n,r=30)=>[95,-95,145,-145].map(x=>move(frame(n),x,-190)).find(p=>safeBox(p.x,p.z,p.yaw,r,r)&&(waterAt(p.x,p.z)===null||heightAt(p.x,p.z)>=waterAt(p.x,p.z)));
   // Landmarks sit ahead of each arrival, so choosing a district reveals its character immediately.
   const modern=heroSite(nBy('kanazawa'),26);if(modern){const y=heightAt(modern.x,modern.z);block(modern,32,65,28,0xb4c6c6,y);glass.add(G.box,M(modern.x,y+38,modern.z,modern.yaw,32.3,43,28.3),0x89b2bf);for(let k=0;k<7;k++)block(modern,33,.6,29,0xd4c9a6,y+10+k*8);sign(move(modern,0,-16),y+20,8,25,7);}
   const entrance=(n,kind)=>{const p=move(frame(n),0,-170),near=routes.nearest(p.x,p.z),y=near?.y??n.y,col=kind==='ruin'?0x8c9778:0xb2674b;
    for(const side of [-1,1]){const q=move(p,side*49);if(safeBox(q.x,q.z,q.yaw,9,13))block(q,18,34,26,col,y);}
    part(G.box,p.x,y+36,p.z,p.yaw,116,5,28,col);addSolid(p.x,p.z,p.yaw,58,14,y+33.5,y+38.5);
    if(kind==='ruin')for(let k=0;k<5;k++){const r=20-k*2.6;part(G.taper8,p.x,y+42+k*7,p.z,p.yaw,r,10,r,0x939e7d);addSolid(p.x,p.z,p.yaw,r,r,y+37+k*7,y+47+k*7);}
    else for(const side of [-1,1]){const q=move(p,side*28);part(G.box,q.x,y+42,q.z,q.yaw,62,5,37,0xc47a51);addSolid(q.x,q.z,q.yaw,31,18.5,y+39.5,y+44.5);}
   };
   entrance(nBy('inner'),'ruin');entrance(nBy('ryukyu'),'red');
   const high=heroSite(nBy('thai'),30);if(high){const y=heightAt(high.x,high.z);block(high,32,14,35,0xc3b189,y);for(let k=0;k<7;k++){const r=17-k*2;part(G.taper8,high.x,y+19+k*8,high.z,high.yaw,r,12,r,0xbc9d65);addSolid(high.x,high.z,high.yaw,r,r,y+13+k*8,y+25+k*8);}}
   const beacon=heroSite(nBy('okinawa'),20);if(beacon){const y=heightAt(beacon.x,beacon.z);part(G.cyl,beacon.x,y+23,beacon.z,0,7,46,7,0xdce5d8);addSolid(beacon.x,beacon.z,0,7,7,y,y+46);part(G.cyl,beacon.x,y+47,beacon.z,0,9,4,9,0xb96656);addSolid(beacon.x,beacon.z,0,9,9,y+45,y+49);}
   // A broad suspension-style riding bridge over the emerald river, with cables outside the dodge space.
   const bridge=nodes.find(n=>n.id==='shikoku').edges.find(e=>e.to===centre).path;
   for(const side of [-1,1]){let previous=null;for(let i=0;i<=12;i++){const s=110+i*15,p=routes.at(bridge,s),x=p.x-p.tz*side*34,z=p.z+p.tx*side*34,h=p.y+13+7*Math.abs(i/12-.5)*2,a=[x,h,z];if(previous)beam(previous,a,.12,0x766950);previous=a;if(i%3===0){const q={...p,x,z,yaw:Math.atan2(p.tx,p.tz)};block(q,1.1,21,1.1,0x857455,p.y);}}
   }
   const lake=nBy('ainu');for(const side of [-1,1]){const p=move(frame(lake),side*65,-130);if(safeBox(p.x,p.z,p.yaw,12,12)){const y=heightAt(p.x,p.z);for(let i=0;i<3;i++){const q=move(p,i*5,0);part(G.cyl,q.x,y+17,q.z,0,.5,34,.5,0xe2e4d8);addSolid(q.x,q.z,0,.5,.5,y,y+34);part(G.ico,q.x,y+34,q.z,0,8,8,8,0x73967c);}}}
   // A dusk post-town along the original rural road, kept outside every new crossroads.
   for(let s=main.length*.205,i=0;s<main.length*.26;s+=43,i++){const p=routes.at(main,s);for(const side of [-1,1]){const q={...p,x:p.x-p.tz*side*65,z:p.z+p.tx*side*65,yaw:Math.atan2(p.tx,p.tz)};if(!safeBox(q.x,q.z,q.yaw,15,18))continue;roof(q,17,6,25,0x8d7255,0x5e5748);const y=heightAt(q.x,q.z);sign(move(q,-side*10),y+5,i%2?1:2,7,4);part(G.ico,q.x-side*Math.cos(q.yaw)*12,y+5,q.z+side*Math.sin(q.yaw)*12,0,.55,.9,.55,0xe6bc81,true);}}
   stats.atlasNodes=nodes.length;stats.atlasRoads=roads.length;stats.regions=zones.length;
  }
  function drawMap(svg,position){
   const NS='http://www.w3.org/2000/svg',point=p=>({x:260+(p.x-CX)*.15/SCALE,y:185-p.z*.145/SCALE}),el=(tag,attrs,parent=svg)=>{const n=document.createElementNS(NS,tag);for(const [key,v]of Object.entries(attrs))n.setAttribute(key,String(v));parent.append(n);return n;};
   svg.replaceChildren();svg.setAttribute('viewBox','0 0 520 370');svg.setAttribute('aria-label','14の土地とつながる道。丸を押すと移動します');
   for(const path of [main,...roads])el('polyline',{points:path.points.filter((p,i)=>i%4===0||i===path.points.length-1).map(p=>{const q=point(p);return q.x.toFixed(1)+','+q.y.toFixed(1)}).join(' '),fill:'none',stroke:path===main?'#d2c09c':'#8eaaa0','stroke-width':path===main?2:1.4,opacity:.8});
   const labels={bay:'豊洲',edo:'江戸',angkor:'アンコール',khaosan:'カオサン',donmueang:'空港',straits:'海峡',kanazawa:'金沢',shikoku:'四国',ainu:'アイヌ・湖',hagiang:'ハジャン',inner:'遺跡の奥',thai:'タイ水郷',ryukyu:'琉球',okinawa:'沖縄'};
   for(const z of zones){const p=point(z),g=el('g',{'data-atlas-warp':z.id,role:'button',tabindex:0,'aria-label':z.name+'へ移動',style:'cursor:pointer'});el('circle',{cx:p.x,cy:p.y,r:12,fill:'#182b30',stroke:'#d7c398','stroke-width':1.4},g);const text=el('text',{x:p.x,y:p.y+25,'text-anchor':'middle',fill:'#ece3ce','font-size':12,'font-family':'sans-serif'},g);text.textContent=labels[z.id];const title=el('title',{},g);title.textContent=z.name;}
   const p=point(position);el('circle',{cx:p.x,cy:p.y,r:4,fill:'#ffffff',stroke:'#bd9b60','stroke-width':2,'pointer-events':'none'});
  }
  function reset(P){P.atlasTurn=null;P.atlasNodeLock=null;}
  function guide(P,steer,dt){
   if(P.braking){P.atlasTurn=null;return false;}
   if(P.atlasNodeLock&&Math.hypot(P.pos.x-P.atlasNodeLock.x,P.pos.z-P.atlasNodeLock.z)>135)P.atlasNodeLock=null;
   if(!P.atlasTurn&&Math.abs(steer)>.62&&P.hold>.9){let node=null,dist=Infinity;for(const n of nodes){const dx=n.x-P.pos.x,dz=n.z-P.pos.z,d=Math.hypot(dx,dz),ahead=dx*Math.sin(P.yaw)+dz*Math.cos(P.yaw);if(n!==P.atlasNodeLock&&d<100&&ahead> -12&&d<dist&&Math.abs(P.pos.y-n.y)<14){node=n;dist=d;}}
    if(node){let best=null,score=Infinity;for(const e of node.edges){const at=e.path===main?routes.at(main,node.mainS):routes.at(e.path,e.dir>0?Math.min(80,e.path.length*.25):e.path.length-Math.min(80,e.path.length*.25)),yaw=Math.atan2(at.tx*e.dir,at.tz*e.dir),angle=Math.atan2(Math.sin(yaw-P.yaw),Math.cos(yaw-P.yaw));if(Math.abs(angle)>2.35||e.path.id===P.routeTrack)continue;const rank=Math.abs(angle+steer*1.35);if(rank<score){best=e;score=rank;}}
     if(best){P.atlasTurn={node,edge:best};P.atlasNodeLock=node;}}
   }
   if(!P.atlasTurn)return false;const {node,edge}=P.atlasTurn;
   const s=edge.path===main?node.mainS+edge.dir*125:edge.dir>0?Math.min(125,edge.path.length*.32):edge.path.length-Math.min(125,edge.path.length*.32),target=routes.at(edge.path,s),dx=target.x-P.pos.x,dz=target.z-P.pos.z,goal=Math.atan2(dx,dz),angle=Math.atan2(Math.sin(goal-P.yaw),Math.cos(goal-P.yaw));
   P.yaw+=clamp(angle*2.4,-1,1)*dt;P.assistLean=mix(P.assistLean,clamp(-angle*.20,-.22,.22),1-Math.exp(-8*dt));
   if(Math.hypot(P.pos.x-node.x,P.pos.z-node.z)>90&&Math.hypot(dx,dz)<65){P.routeTrack=edge.path.id;P.routeOffset=0;P.atlasTurn=null;}return true;
  }
  return{zones,nodes,roads,waterPatches,build,mergeHeight:(x,z,y)=>{const p=mainNear(x,z);return mix(p.y,y,smooth(55,120,p.d));},near,stage,ground,plazaAt,surface,departure,terrain,weather,guide,reset,drawMap};
 }
 globalThis.WindAtlas=Object.freeze({create,additions,SCALE});
})();

/* Original scenic itineraries, connected to the existing journey. No map service or runtime dependency. */
(() => {
  const TAU = Math.PI * 2, clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const smooth = (a,b,x) => {const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const lerp = (a,b,t) => a+(b-a)*t;
  const definitions = [
    {id:'desert',name:'ウズベキスタン・砂漠の廃線',sub:'峠から続く廃線、砂と青いドーム',x:75100,rail:true,colour:['#465a71','#e6c6a1','#aa8f68']},
    {id:'mountain',name:'ビシュケクからオシュへ',sub:'湖岸と廃線を結ぶ峠、断崖とトンネル',colour:['#718ca7','#d6dcd9','#777b74']},
    {id:'lake',name:'イシク・クルを一周',sub:'湖岸を巡り、東の分岐から天山の峠へ',colour:['#487fbc','#dbe8eb','#5e937d']},
    {id:'astana',name:'草原からアスタナへ',sub:'大草原から巨大な塔へ、廃線と峡谷に戻る大通り',start:.12,colour:['#a49a67','#b5d4df','#576d7a']},
    {id:'charyn',name:'シャリン・赤い峡谷の道',sub:'赤い岩の城と青緑の川、湖岸から草原の都市へ',start:.18,colour:['#bb815f','#cba681','#629b98']},
    {id:'silk',name:'ドゥシャンベからサマルカンドへ',sub:'緑の大通り、山間の隊商路、青い古都へ',colour:['#54715e','#d2b78b','#587f97']},
  ];
  const paths = [], grid = new Map(), CELL = 256;
  let landscapeCache=null,candidateCache=null;
  const mountain = [[32600,300,150],[34000,900,205],[35500,450,300],[36900,-550,405],[38400,-100,510],[39900,1200,610],[41400,1750,655],[43000,900,550],[44600,-300,420],[46300,200,290],[48000,1200,215]];
  const cubic = (a,b,c,d,t) => .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
  function addPath(id,points,closed=false) {
    candidateCache=null;
    const path={id,points,closed,segments:[],length:0};
    for(let i=0;i<points.length;i++){const a=points[i===0&&closed?points.length-2:Math.max(0,i-1)],b=points[i===points.length-1&&closed?1:Math.min(points.length-1,i+1)],l=Math.hypot(b.x-a.x,b.z-a.z);points[i].nx=-(b.z-a.z)/l;points[i].nz=(b.x-a.x)/l;}
    for(let i=0;i<points.length-1;i++) {
      const a=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
      const seg={path,a,b,dx,dz,length,index:i,s:path.length,half:id==='astana'?32:id==='mountain'?28:id==='lake'?21:22,tx:dx/length,tz:dz/length,grade:(b.y-a.y)/length};
      path.segments.push(seg);path.length+=length;
      for(let x=Math.floor((Math.min(a.x,b.x)-170)/CELL);x<=Math.floor((Math.max(a.x,b.x)+170)/CELL);x++)
        for(let z=Math.floor((Math.min(a.z,b.z)-170)/CELL);z<=Math.floor((Math.max(a.z,b.z)+170)/CELL);z++) {
          const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(seg);
        }
    }
    paths.push(path);return path;
  }
  const mp=[];
  for(let j=0;j<mountain.length-1;j++) {
    const a=mountain[Math.max(0,j-1)],b=mountain[j],c=mountain[j+1],d=mountain[Math.min(mountain.length-1,j+2)];
    const n=Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/24);
    for(let k=0;k<n;k++)mp.push({x:cubic(a[0],b[0],c[0],d[0],k/n),z:cubic(a[1],b[1],c[1],d[1],k/n),y:cubic(a[2],b[2],c[2],d[2],k/n)});
  }
  mp.push({x:48000,z:1200,y:215});addPath('mountain',mp);
  const basin=[[0,.72],[8000,.9],[18000,1.12],[28000,1.28],[39000,.5],[52000,.95]];
  function widthAt(x){let i=0;while(i<basin.length-2&&x>basin[i+1][0])i++;return lerp(basin[i][1],basin[i+1][1],smooth(basin[i][0],basin[i+1][0],x));}
  const lp=[],N=1600;
  for(let i=0;i<=N;i++){const a=i/N*TAU,x=15500+8540*Math.cos(a);lp.push({x,z:(-5000+1490*Math.sin(a))*widthAt(x),y:24+14*Math.sin(a)+6*Math.cos(2*a)});}
  // Reuse the exact first vertex at the seam, avoiding a floating point crack.
  lp[N]={...lp[0]};addPath('lake',lp,true);
  function addConnection(id,knots,region){
    if(paths.some(p=>p.id===id))return paths.find(p=>p.id===id);
    const points=[];
    for(let j=0;j<knots.length-1;j++){
      const a=knots[Math.max(0,j-1)],b=knots[j],c=knots[j+1],d=knots[Math.min(knots.length-1,j+2)];
      const n=Math.ceil(Math.hypot(c.x-b.x,c.z-b.z)/24);
      for(let i=0;i<n;i++){const u=i/n;points.push({x:cubic(a.x,b.x,c.x,d.x,u),z:cubic(a.z,b.z,c.z,d.z,u),y:cubic(a.y,b.y,c.y,d.y,u)});}
    }
    points.push({...knots.at(-1)});const path=addPath(id,points);path.connection=true;path.region=region;return path;
  }
  function indexReach(path,reach){
    landscapeCache=null;candidateCache=null;
    for(const seg of path.segments)for(let x=Math.floor((Math.min(seg.a.x,seg.b.x)-reach)/CELL);x<=Math.floor((Math.max(seg.a.x,seg.b.x)+reach)/CELL);x++)
      for(let z=Math.floor((Math.min(seg.a.z,seg.b.z)-reach)/CELL);z<=Math.floor((Math.max(seg.a.z,seg.b.z)+reach)/CELL);z++){
        const key=x+','+z;if(!grid.has(key))grid.set(key,[]);const entries=grid.get(key);if(!entries.includes(seg))entries.push(seg);
      }
  }
  function nearest(x,z,preferred=null,radius=170,roamingOnly=false,landscapeOnly=false) {
    const candidates=grid.get(Math.floor(x/CELL)+','+Math.floor(z/CELL));if(!candidates)return null;
    let best=null,d2=Infinity,u0=0,score=Infinity;
    for(const seg of candidates){if(roamingOnly&&!seg.path.roaming||landscapeOnly&&!seg.path.landscape)continue;const u=clamp(((x-seg.a.x)*seg.dx+(z-seg.a.z)*seg.dz)/(seg.length*seg.length),0,1),dx=x-seg.a.x-seg.dx*u,dz=z-seg.a.z-seg.dz*u,q=dx*dx+dz*dz;
      const rank=preferred?Math.sqrt(q)-(seg.path.id===preferred?1.5:0):q;if(rank<score){score=rank;d2=q;best=seg;u0=u;}}
    if(!best||d2>radius*radius)return null;
    const cx=lerp(best.a.x,best.b.x,u0),cz=lerp(best.a.z,best.b.z,u0);
    return {d:Math.sqrt(d2),cx,cz,nx:-best.tz,nz:best.tx,tx:best.tx,tz:best.tz,y:lerp(best.a.y,best.b.y,u0),grade:best.grade,half:best.half,s:best.s+u0*best.length,path:best.path,segment:best};
  }
  function candidates(x,z,radius=170){
    if(candidateCache?.x===x&&candidateCache.z===z&&candidateCache.radius===radius)return candidateCache.result;
    const found=new Map();
    for(const seg of grid.get(Math.floor(x/CELL)+','+Math.floor(z/CELL))||[]){
      const u=clamp(((x-seg.a.x)*seg.dx+(z-seg.a.z)*seg.dz)/(seg.length*seg.length),0,1),cx=seg.a.x+seg.dx*u,cz=seg.a.z+seg.dz*u,d=Math.hypot(x-cx,z-cz);
      if(d>radius||d>=(found.get(seg.path.id)?.d??Infinity))continue;
      found.set(seg.path.id,{d,cx,cz,nx:-seg.tz,nz:seg.tx,tx:seg.tx,tz:seg.tz,y:lerp(seg.a.y,seg.b.y,u),grade:seg.grade,half:seg.half,s:seg.s+u*seg.length,path:seg.path,segment:seg});
    }const result=[...found.values()];candidateCache={x,z,radius,result};return result;
  }
  function at(path,s) {
    if(typeof path==='string')path=paths.find(p=>p.id===path);
    s=path.closed?((s%path.length)+path.length)%path.length:clamp(s,0,path.length);
    let lo=0,hi=path.segments.length-1;while(lo<hi){const mid=(lo+hi+1)>>1;if(path.segments[mid].s<=s)lo=mid;else hi=mid-1;}
    const a=path.segments[lo],u=clamp((s-a.s)/a.length,0,1);
    return {x:lerp(a.a.x,a.b.x,u),z:lerp(a.a.z,a.b.z,u),y:lerp(a.a.y,a.b.y,u),tx:a.tx,tz:a.tz,s,path};
  }
  function mountainAtX(x){let lo=0,hi=mp.length-2;while(lo<hi){const m=(lo+hi+1)>>1;if(mp[m].x<=x)lo=m;else hi=m-1;}const a=mp[lo],b=mp[lo+1],u=clamp((x-a.x)/(b.x-a.x),0,1);return{z:lerp(a.z,b.z,u),y:lerp(a.y,b.y,u)};}
  // A continuous northern alternative: share the approach and departure tangents with real roads.
  function addNorthernRoad(){
    const existing=paths.find(p=>p.id==='charyn');if(existing)return existing;
    const west=paths.find(p=>p.id==='lake-pass'),east=paths.find(p=>p.id==='astana');
    const a=at(west,west.length*.46),b=at(east,800);
    const knots=[a,
      {x:30500,z:1300,y:180},{x:33000,z:2350,y:230},{x:35500,z:2900,y:255},
      {x:38500,z:3000,y:280},{x:41400,z:3100,y:255},{x:44300,z:2800,y:220},
      {x:47500,z:3350,y:170},{x:51000,z:2450,y:105},b];
    // Uniform Catmull–Rom reverses across a 40m join followed by kilometre-long legs.
    // Hermite endpoint derivatives share the parent road's tangent without tiny control legs.
    const points=[],tangents=knots.map((p,i)=>{
      const u=knots[Math.max(0,i-1)],v=knots[Math.min(knots.length-1,i+1)],l=Math.hypot(v.x-u.x,v.z-u.z);return{x:(v.x-u.x)/l,z:(v.z-u.z)/l,y:(v.y-u.y)/l};
    });
    const wa=at(west,a.s+1),eb=at(east,b.s-1);
    tangents[0]={x:a.tx,z:a.tz,y:wa.y-a.y};tangents[tangents.length-1]={x:b.tx,z:b.tz,y:b.y-eb.y};
    for(let j=0;j<knots.length-1;j++){
      const p=knots[j],q=knots[j+1],l=Math.hypot(q.x-p.x,q.z-p.z),n=Math.ceil(l/24);
      for(let i=0;i<n;i++){const u=i/n,u2=u*u,u3=u2*u,out={};for(const k of ['x','y','z'])out[k]=(2*u3-3*u2+1)*p[k]+(u3-2*u2+u)*tangents[j][k]*l+(-2*u3+3*u2)*q[k]+(u3-u2)*tangents[j+1][k]*l;points.push(out);}
    }
    points.push({...b});const path=addPath('charyn',points);path.region='desert';
    path.connection=false;path.travelRoad=true;path.landscape='canyon';path.name='シャリンの峡谷道';
    for(const seg of path.segments)seg.half=32;
    indexReach(path,1100);
    junctions.push({...a,name:'湖岸・峠道 ↔ 赤い峡谷',path:path.id},
      {...b,name:'赤い峡谷・湖岸 ↔ アスタナ',path:path.id});
    return path;
  }
  function landscapeAt(x,z){
    if(landscapeCache?.x===x&&landscapeCache.z===z)return landscapeCache.result;
    const result=nearest(x,z,null,1100,false,true);landscapeCache={x,z,result};return result;
  }
  function canyonWeight(r){return r?smooth(350,1600,Math.min(r.s,r.path.length-r.s))*(1-smooth(850,1100,r.d)):0;}
  function canyonHeight(r,x,z){
    const side=(x-r.cx)*r.nx+(z-r.cz)*r.nz,d=Math.abs(side);
    // Wide traversable floor, a small side river and stepped sandstone banks, never a road obstacle.
    return r.y+3+145*smooth(210,600,d)+48*smooth(510,800,d)-8*(1-smooth(18,45,Math.abs(side-160)));
  }
  const junctions=[];
  const shelterHeight=26;
  function tunnel(x){return x>=35280&&x<36240?'gallery':x>=36500&&x<37120?(x>=36720&&x<36920?'tunnel':'gallery'):x>=41840&&x<42520?'gallery':null;}
  function hasPanel(seg){const mode=seg.path.id==='mountain'?tunnel((seg.a.x+seg.b.x)*.5):null;return mode==='tunnel'||mode==='gallery'&&Math.floor(seg.s/24)%4!==0;}
  function covered(seg,lateral=0){const mode=seg.path.id==='mountain'?tunnel((seg.a.x+seg.b.x)*.5):null;return hasPanel(seg)&&(mode==='tunnel'||lateral< -seg.half*.30&&lateral> -seg.half-4);}
  function relief(x,z){if(x<31000||x>49600)return -Infinity;const p=mountainAtX(x),d=Math.abs(z-p.z),gate=smooth(31000,32600,x)*(1-smooth(48000,49600,x));return (p.y-12+800*Math.pow(smooth(48,1100,d),.7)+((x>35150&&x<37250)||(x>41700&&x<42650)?120*(1-smooth(40,220,d)):0))*gate-200*(1-gate);}
  globalThis.WindRoutes={definitions,paths,nearest,candidates,at,tunnel,relief,addConnection,mountainAtX,indexReach,shelterHeight,hasPanel,covered,junctions,addNorthernRoad,landscapeAt,canyonWeight,canyonHeight};
})();

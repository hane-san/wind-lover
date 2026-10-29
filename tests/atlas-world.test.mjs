import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync}from'node:fs';
const context=vm.createContext({});for(const f of ['featured-routes','monsoon-atlas','monsoon-world'])vm.runInContext(readFileSync(new URL('../world/'+f+'.js',import.meta.url),'utf8'),context);
const R=context.WindRoutes,M=context.WindMonsoon;M.install(R);const A=M.atlas;
test('fourteen regional departures belong to one connected, branching road web',()=>{
 assert.equal(M.zones.length,14);assert.equal(A.roads.length,24);assert.equal(A.nodes.length,17);
 const seen=new Set(),queue=[A.nodes[0]];while(queue.length){const n=queue.shift();if(seen.has(n.id))continue;seen.add(n.id);for(const e of n.edges)if(e.to.edges)queue.push(e.to);}
 assert.equal(seen.size,A.nodes.length);assert.ok(A.nodes.filter(n=>n.plaza).every(n=>n.edges.length>=3));
 for(const z of M.zones){const p=M.departure(z.id);assert.equal(M.stage(p.x,p.z).id,z.id);assert.ok(Number.isFinite(p.x+p.y+p.z+p.yaw));}
});
test('roads meet at actual shared coordinates with smooth plaza decks and finite grades',()=>{
 for(const path of A.roads){const [a,b]=path.nodes;for(const [p,n]of [[path.points[0],a],[path.points.at(-1),b]])assert.ok(Math.hypot(p.x-n.x,p.z-n.z, p.y-n.y)<1e-7);
  for(const seg of path.segments){assert.ok(seg.length>1&&seg.length<20);assert.ok(Math.abs(seg.grade)<.38,'A compressed climb became a wall');}
  if(a.plaza)assert.ok(Math.abs(R.at(path,60).y-a.y)<1e-8);if(b.plaza)assert.ok(Math.abs(R.at(path,path.length-60).y-b.y)<1e-8);
 }
});
test('landscape and weather colours stay continuous at interior district boundaries',()=>{
 const rgb=q=>[16,8,0].map(s=>(((q.previous.top>>s)&255)*(1-q.blend)+((q.top>>s)&255)*q.blend)/255);
 for(let x=M.CX-800;x<M.CX+801;x+=41)for(let z=-700;z<701;z+=43){const a=M.stage(x,z),b=M.stage(x+.0001,z);assert.ok(a.weights.every(v=>v.w>0));assert.ok(Math.abs(a.weights.reduce((n,v)=>n+v.w,0)-1)<1e-8);const c=rgb(a),d=rgb(b);for(let i=0;i<3;i++)assert.ok(Math.abs(c[i]-d[i])<.005);const sky=A.weather(x,z,30);assert.ok(sky.top.concat(sky.hor).every(v=>v>=0&&v<=1));}
});

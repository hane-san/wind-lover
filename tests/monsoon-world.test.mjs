import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
// The optional circuit must not alter other tests' installed Central Asian network.
const context=vm.createContext({});
for(const file of ['featured-routes','regional-atmosphere','monsoon-atlas','monsoon-world'])vm.runInContext(readFileSync(new URL('../world/'+file+'.js',import.meta.url),'utf8'),context);
const R=context.WindRoutes,M=context.WindMonsoon,before=R.paths.length,path=M.install(R);
test('the optional 9km sampler installs once, with a closed 68m road and six reachable scenes',()=>{
 assert.equal(R.paths.length,before+25);assert.equal(M.install(R),path);assert.equal(R.paths.length,before+25);assert.ok(path.length>9400&&path.length<9500);
 assert.equal(path.closed,true);assert.deepEqual(path.points[0],path.points.at(-1));assert.equal(path.realm,'monsoon');
 const seen=new Set();for(let s=0;s<path.length;s+=11){const p=R.at(path,s),r=R.nearest(p.x,p.z),stage=M.stage(p.x,p.z);seen.add(stage.id);assert.equal(r.path,path);assert.ok(r.d<1e-6);assert.equal(r.half,34);assert.ok(Math.abs(r.grade)<.10);assert.ok(Number.isFinite(M.terrain(p.x,p.z)));}
 assert.ok(seen.size>=6);
});
test('short-region palettes blend across every seam, including the loop seam',()=>{
 const colour=(q,key)=>[16,8,0].map(b=>((q.previous[key]>>b)&255)*(1-q.blend)+((q[key]>>b)&255)*q.blend);
 for(let i=0;i<6;i++){const a=R.at(path,path.length*i/6-.01),b=R.at(path,path.length*i/6+.01),qa=M.stage(a.x,a.z),qb=M.stage(b.x,b.z);for(const key of ['top','hor'])for(let c=0;c<3;c++)assert.ok(Math.abs(colour(qa,key)[c]-colour(qb,key)[c])<.01);}
});
test('the coast slopes below the water rather than sharing a coplanar ocean floor',()=>{
 const z=R.at(path,path.length*.94),ocean=M.terrain(M.CX+(z.x-M.CX)*1.7,z.z*1.7);assert.ok(ocean< -30);
 for(let a=0;a<6.28;a+=.2){let previous=null;for(let r=1;r<1.75;r+=.001){const h=M.terrain(M.CX+M.RX*r*Math.cos(a),M.RZ*r*Math.sin(a));assert.ok(Number.isFinite(h));const next=M.terrain(M.CX+M.RX*(r+.000001)*Math.cos(a),M.RZ*(r+.000001)*Math.sin(a));assert.ok(Math.abs(next-h)<.04,'A quay or cliff is discontinuous at a millimetre step');previous=h;}}
});
test('farms, inland plains and coastal escarpments have different physical geography',()=>{
 assert.equal(M.plots.length,84);assert.deepEqual(new Set(M.plots.map(p=>p.kind)),new Set(['rice','gold','dry']));
 const fields=M.plots.filter(p=>{const r=M.near(p.x,p.z);return r.d>r.path.segments[0].half+50&&M.atlas.nodes.filter(n=>n.plaza).every(n=>Math.hypot(p.x-n.x,p.z-n.z)>145)});assert.ok(fields.length>=30);for(const p of fields)assert.ok(Math.abs(M.terrain(p.x,p.z)-p.floor)<.01);
 const coast=M.pose(R,path.length*.9,500),sea=M.pose(R,path.length*.9,-500),delta=M.pose(R,path.length*.6,500),forest=M.pose(R,path.length*.4,500);
 const n=M.atlas.nodes.find(n=>n.id==='hagiang'),samples=[];for(let x=-280;x<=280;x+=35)for(let z=-280;z<=280;z+=35){const px=n.x+x,pz=n.z+z;if(M.stage(px,pz).id==='hagiang')samples.push(M.terrain(px,pz));}assert.ok(Math.max(...samples)-Math.min(...samples)>100);assert.ok(Number.isFinite(M.terrain(delta.x,delta.z)+M.terrain(forest.x,forest.z)));
 const heights=path.points.map(p=>p.y);assert.ok(Math.max(...heights)-Math.min(...heights)>39);
 assert.ok(M.patches.some(p=>p.kind==='bridge-water'));assert.ok(M.patches.filter(p=>p.kind==='moat').length===4);
});

test('local canals and paddies share their rendered water level with physical ground queries',()=>{
 for(const p of M.patches.filter(p=>p.water!==null))assert.ok(M.waterAt(p.x,p.z)>=p.water);
 for(const p of M.plots.filter(p=>p.kind==='dry'))assert.equal(M.waterAt(p.x,p.z),null);
});

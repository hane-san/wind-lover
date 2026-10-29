import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
// The optional circuit must not alter other tests' installed Central Asian network.
const context=vm.createContext({});
for(const file of ['featured-routes','monsoon-world'])vm.runInContext(readFileSync(new URL('../world/'+file+'.js',import.meta.url),'utf8'),context);
const R=context.WindRoutes,M=context.WindMonsoon,before=R.paths.length,path=M.install(R);
test('the optional 8km sampler installs once, with a closed 60m road and six reachable scenes',()=>{
 assert.equal(R.paths.length,before+1);assert.equal(M.install(R),path);assert.equal(R.paths.length,before+1);assert.ok(path.length>8000&&path.length<8300);
 assert.equal(path.closed,true);assert.deepEqual(path.points[0],path.points.at(-1));assert.equal(path.realm,'monsoon');
 const seen=new Set();for(let s=0;s<path.length;s+=11){const p=R.at(path,s),r=R.nearest(p.x,p.z),stage=M.stage(p.x,p.z);seen.add(stage.id);assert.equal(r.path,path);assert.ok(r.d<1e-6);assert.equal(r.half,30);assert.ok(Math.abs(r.grade)<.005);assert.ok(Number.isFinite(M.terrain(p.x,p.z)));}
 assert.equal(seen.size,6);
});
test('short-region palettes blend across every seam, including the loop seam',()=>{
 const colour=(q,key)=>[16,8,0].map(b=>((q.previous[key]>>b)&255)*(1-q.blend)+((q[key]>>b)&255)*q.blend);
 for(let i=0;i<6;i++){const a=R.at(path,path.length*i/6-.01),b=R.at(path,path.length*i/6+.01),qa=M.stage(a.x,a.z),qb=M.stage(b.x,b.z);for(const key of ['top','hor'])for(let c=0;c<3;c++)assert.ok(Math.abs(colour(qa,key)[c]-colour(qb,key)[c])<.01);}
});
test('the coast slopes below the water rather than sharing a coplanar ocean floor',()=>{
 const z=R.at(path,path.length*.94),ocean=M.terrain(M.CX+(z.x-M.CX)*1.7,z.z*1.7);assert.ok(ocean< -30);
 for(let a=0;a<6.28;a+=.2){let previous=null;for(let r=1;r<1.75;r+=.001){const h=M.terrain(M.CX+M.RX*r*Math.cos(a),M.RZ*r*Math.sin(a));assert.ok(Number.isFinite(h));if(previous!==null)assert.ok(Math.abs(h-previous)<.8,'An off-road hill or coast has a discontinuous step');previous=h;}}
});

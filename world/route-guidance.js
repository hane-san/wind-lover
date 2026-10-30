/* Read a continuous road through a junction; geometry queries remain independent of riding intent. */
(() => {
  function install(routes,railSample){
    const rail={id:'rail',length:Infinity,sample:railSample},links=new Map();
    const sample=(p,s)=>p.sample?p.sample(s):routes.at(p,s);
    for(const path of routes.paths.filter(p=>!p.closed))for(const direction of [-1,1]){
      const end=sample(path,direction>0?path.length:0),options=[];
      for(const other of routes.paths){
        if(other===path)continue;let best=null;
        for(const seg of other.segments){const u=Math.max(0,Math.min(1,((end.x-seg.a.x)*seg.dx+(end.z-seg.a.z)*seg.dz)/(seg.length**2))),x=seg.a.x+seg.dx*u,z=seg.a.z+seg.dz*u,d=Math.hypot(x-end.x,z-end.z),y=seg.a.y+(seg.b.y-seg.a.y)*u;
          if(d<.6&&Math.abs(y-end.y)<.45&&(!best||d<best.d))best={d,s:seg.s+seg.length*u,tx:seg.tx,tz:seg.tz};
        }
        if(best)for(const dir of [-1,1]){if(!other.closed&&((best.s<1&&dir<0)||(best.s>other.length-1&&dir>0)))continue;
          const alignment=(end.tx*best.tx+end.tz*best.tz)*direction*dir;if(alignment>.25)options.push({path:other,s:best.s,direction:dir,alignment});}
      }
      if(railSample){const p=railSample(end.x);if(Math.hypot(p.x-end.x,p.z-end.z)<.7&&Math.abs(p.y-end.y)<.45){const dir=end.tx*direction>=0?1:-1;options.push({path:rail,s:end.x,direction:dir,alignment:(end.tx*p.tx+end.tz*p.tz)*direction*dir});}}
      options.sort((a,b)=>b.alignment-a.alignment);links.set(path.id+':'+direction,options[0]||null);
    }
    function ahead(path,s,distance,direction=1){
      if(typeof path==='string')path=routes.paths.find(p=>p.id===path);
      let rest=Math.max(0,distance);
      for(let i=0;i<6;i++){
        const remaining=direction>0?path.length-s:s;
        if(path.closed||path.sample||rest<=remaining){const p=sample(path,s+direction*rest);return {...p,tx:p.tx*direction,tz:p.tz*direction,direction};}
        const end=sample(path,direction>0?path.length:0);rest-=remaining;
        const link=links.get(path.id+':'+direction);
        if(!link)return {...end,x:end.x+end.tx*direction*rest,z:end.z+end.tz*direction*rest,tx:end.tx*direction,tz:end.tz*direction,direction,extended:true};
        path=link.path;s=link.s;direction=link.direction;
      }
      const p=sample(path,s);return {...p,tx:p.tx*direction,tz:p.tz*direction,direction};
    }
    function choose(x,z,{preferred=null,y=0,yaw=0,steer=0,keepCorridor=false}={}){
      const intent=yaw-Math.max(-1,Math.min(1,steer))*.20,fx=Math.sin(intent),fz=Math.cos(intent);
      let best=null,score=Infinity;
      const candidates=routes.candidates(x,z);
      if(keepCorridor){const current=candidates.find(r=>r.path.id===preferred&&r.d<r.half+.5&&Math.abs(y-r.y-.14)<3&&Math.abs(r.tx*fx+r.tz*fz)>.55);if(current)return current;}
      for(const r of candidates){
        const gap=Math.abs(y-r.y-.14);if(gap>7)continue;
        const alignment=Math.abs(r.tx*fx+r.tz*fz),stay=r.path.id===preferred&&Math.abs(steer)<.3?2.6:0;
        const rank=r.d+8*(1-alignment)+gap*.5-stay;
        if(rank<score){best=r;score=rank;}
      }return best;
    }
    return {ahead,choose,links};
  }
  globalThis.WindRouteGuidance=Object.freeze({install});
})();

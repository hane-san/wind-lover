/* Small, deterministic roadside sequences; no change to the legacy elevation or collision floor. */
(() => {
  function create(routes,railSample,chunkSize=480){
    const cells=new Map(),sites=[];
    const add=site=>{sites.push(site);const key=Math.floor(site.x/chunkSize)+','+Math.floor(site.z/chunkSize);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(site);};
    const sequences={mountain:['poplars','memory','fins','ruin','memory','orchard'],lake:['poplars','orchard','memory','poplars','fins','fins','ruin','orchard'],silk:['orchard','poplars','ruin','memory','fins','orchard','ruin'],astana:['memory','poplars','poplars','ruin'],charyn:['fins','memory','white-bands','fins','ruin']};
    for(const path of routes.paths){
      const styles=sequences[path.id];if(!styles)continue;
      for(let s=240,i=0;s<path.length-200;s+=340,i++){
        const p=routes.at(path,s),u=s/path.length,style=styles[Math.min(styles.length-1,Math.floor(u*styles.length))];
        const side=path.id==='lake'?-1:(i%2?-1:1),off=side*(style==='fins'||style==='white-bands'?245:110+(i%3)*35);
        add({x:p.x-p.tz*off,z:p.z+p.tx*off,y:p.y,yaw:Math.atan2(p.tx,p.tz),style,route:path.id,s,seed:i});
      }
    }
    for(let x=75100,i=0;x<86500;x+=380,i++){
      const p=railSample(x),side=i%2?-1:1,off=side*(150+(i%3)*65);
      add({x:p.x-p.tz*off,z:p.z+p.tx*off,y:p.y,yaw:Math.atan2(p.tx,p.tz),style:['memory','orchard','white-bands','ruin'][Math.floor(i/5)%4],route:'desert',s:x-75100,seed:i});
    }
    return {sites,cells,at:(cx,cz)=>cells.get(cx+','+cz)||[]};
  }
  globalThis.WindScenicJourney=Object.freeze({create});
})();

/* The old defence network wakes in short engagements, then leaves room for the journey. */
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const orders=[['geometry','kinetic','missile'],['kinetic','geometry','missile'],['missile','kinetic','geometry']];
  function create(){return {phase:'scenic',elapsed:0,duration:13,cycle:0,weapon:null,fire:false,event:null,blocked:false,pressure:0};}
  function rest(region,cycle,hull){return ({lake:32,mountain:28,desert:23,city:24,steppe:27}[region]||28)+(cycle%3)*2+(hull<2?9:0);}
  function advance(s,dt,{enabled=true,dead=false,sheltered=false,region='steppe',hull=3,bend=0}={}){
    s.event=null;if(!(dt>0))return s;
    if(!enabled||dead||sheltered){
      if(!s.blocked)s.event='clear';s.blocked=true;s.phase='scenic';s.elapsed=0;s.duration=12;s.weapon=null;s.fire=false;s.pressure=0;return s;
    }
    s.blocked=false;s.elapsed+=dt;
    if(s.elapsed>=s.duration){
      s.elapsed-=s.duration;
      if(s.phase==='scenic'){s.phase='warning';s.duration=2.4;s.event='warning';}
      else if(s.phase==='warning'){s.phase='combat';s.duration=hull<2?22:26;s.event='engage';}
      else if(s.phase==='combat'){s.phase='release';s.duration=4.5;s.event='release';}
      else{s.phase='scenic';s.cycle++;s.duration=rest(region,s.cycle,hull);s.event='clear';}
    }
    let slot=-1;
    if(s.phase==='combat')slot=s.elapsed<8?0:s.elapsed<10?-1:s.elapsed<17?1:s.elapsed<19?-1:2;
    s.weapon=slot<0?null:orders[s.cycle%orders.length][slot];
    // A sharp bend should ask for steering, rather than a simultaneous missile dodge.
    if(s.weapon==='missile'&&Math.abs(bend)>.32)s.weapon='kinetic';
    s.fire=s.phase==='combat'&&!!s.weapon;s.pressure=s.phase==='combat'?clamp((s.elapsed+2)/5,0,1):s.phase==='warning'?.35:0;
    return s;
  }
  globalThis.WindEncounters=Object.freeze({create,advance,rest});
})();

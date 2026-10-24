/* Forward patrols: read a distant salvo, ride into bow range, then leave the view quiet. */
(() => {
  function create(){return {phase:'scenic',elapsed:0,duration:13,cycle:0,weapon:null,fire:false,event:null,blocked:false,pressure:0};}
  function rest(region,cycle,hull){return ({lake:32,mountain:28,desert:24,city:25,steppe:28}[region]||28)+(cycle%3)*2+(hull<2?9:0);}
  function advance(s,dt,{enabled=true,dead=false,sheltered=false,region='steppe',hull=3,bend=0,cleared=false}={}){
    s.event=null;if(!(dt>0))return s;
    if(!enabled||dead||sheltered){if(!s.blocked)s.event='clear';Object.assign(s,{blocked:true,phase:'scenic',elapsed:0,duration:12,weapon:null,fire:false,pressure:0});return s;}
    s.blocked=false;s.elapsed+=dt;
    if(s.phase==='combat'&&cleared&&s.elapsed>1.5)s.duration=Math.min(s.duration,s.elapsed);
    if(s.elapsed>=s.duration){
      s.elapsed=0;
      if(s.phase==='scenic'){s.phase='warning';s.duration=2.6;s.event='warning';}
      else if(s.phase==='warning'){s.phase='combat';s.duration=hull<2?24:32;s.event='engage';}
      else if(s.phase==='combat'){s.phase='release';s.duration=4.5;s.event='release';}
      else{s.phase='scenic';s.cycle++;s.duration=rest(region,s.cycle,hull);s.event='clear';}
    }
    // Three seconds of clear air between salvos also provide a comfortable drawing window.
    const beat=s.elapsed%6.2;
    s.fire=s.phase==='combat'&&beat<3.1&&Math.abs(bend)<.48;
    s.weapon=s.fire?'missile':null;s.pressure=s.phase==='combat'?1:s.phase==='warning'?.35:0;return s;
  }
  globalThis.WindEncounters=Object.freeze({create,advance,rest});
})();

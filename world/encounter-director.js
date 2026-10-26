/* Forward patrols: read a distant salvo, ride into bow range, then leave the view quiet. */
(() => {
  function create(){return {phase:'scenic',elapsed:0,duration:13,cycle:0,scoutCycle:-1,weapon:null,fire:false,event:null,blocked:false,pressure:0,openingWait:0};}
  function rest(region,cycle,hull){return ({lake:14,mountain:23,desert:18,city:18,steppe:20}[region]||28)+(cycle%3)*2+(hull<2?9:0);}
  function advance(s,dt,{enabled=true,dead=false,sheltered=false,region='steppe',hull=3,bend=0,cleared=false,opening=true}={}){
    s.event=null;if(!(dt>0))return s;
    if(!enabled||dead||sheltered){if(!s.blocked)s.event='clear';Object.assign(s,{blocked:true,phase:'scenic',elapsed:0,duration:12,weapon:null,fire:false,pressure:0,openingWait:0});return s;}
    s.blocked=false;s.elapsed+=dt;
    if(s.phase==='combat'&&cleared&&s.elapsed>1.5)s.duration=Math.min(s.duration,s.elapsed);
    if(s.phase==='scenic'&&s.elapsed>=s.duration&&!opening&&s.openingWait<6){s.openingWait+=dt;s.elapsed=s.duration;return s;}
    if(s.elapsed>=s.duration){
      s.openingWait=0;
      s.elapsed=0;
      if(s.phase==='scenic'){s.phase='warning';s.duration=2.6;s.event='warning';}
      else if(s.phase==='warning'){s.phase='combat';s.duration=hull<2?24:32;s.event='engage';}
      else if(s.phase==='combat'){s.phase='release';s.duration=4.5;s.event='release';}
      else{s.phase='scenic';s.cycle++;s.duration=rest(region,s.cycle,hull);s.event='clear';}
    }
    // Three readings overlap the answering bow; the scenic reward remains outside the engagement.
    const beat=s.elapsed%9.4;
    s.turning=Math.abs(bend)>=.48;s.fire=s.phase==='combat'&&beat<5.8&&!s.turning;
    s.weapon=s.fire?'missile':null;s.pressure=s.phase==='combat'?1:s.phase==='warning'?.35:0;return s;
  }
  globalThis.WindEncounters=Object.freeze({create,advance,rest});
})();

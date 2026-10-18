export type Cue = 'tick'|'click'|'select'|'navigate'|'unfold'|'success'|'depart'|'return';
class SoundEngine {
  enabled = true;
  private context?: AudioContext;
  private master?: GainNode;
  private ambient?: {osc:OscillatorNode;gain:GainNode;filter:BiquadFilterNode};
  private pendingCue?: Cue;
  private gestureSeen=false;
  private away=false;
  private lastTick=-Infinity;
  private lastReturn=-Infinity;
  private suspendTimer?:number;

  constructor(){try{this.enabled=localStorage.getItem('orbital.sfx')!=='off';}catch{/* Default remains ON when storage is unavailable. */}}
  initialize(){if(this.enabled){this.pendingCue='navigate';this.requestResume();}}
  /** Called inside real input handlers so autoplay restrictions can be unlocked. */
  unlock(){if(!this.enabled)return;this.gestureSeen=true;this.away=false;this.cancelSuspend();this.requestResume();}
  toggle() {
    this.enabled = !this.enabled;
    try{localStorage.setItem('orbital.sfx',this.enabled?'on':'off');}catch{}
    if(this.master)this.master.gain.value=this.enabled?.12:0;
    if(this.enabled){this.gestureSeen=true;this.away=false;this.pendingCue='success';this.cancelSuspend();this.requestResume();}
    else {this.pendingCue=undefined;this.stopAmbient();}
    return this.enabled;
  }
  private ensureContext(){
    if(this.context)return;
    this.context=new AudioContext();this.master=this.context.createGain();
    this.master.gain.value=this.enabled?.12:0;this.master.connect(this.context.destination);
    this.context.addEventListener('statechange',()=>this.flush());
  }
  private requestResume(){
    try{
      this.ensureContext();
      if(this.context!.state==='running'){this.flush();return;}
      // Retry resume inside each user gesture even if the initial autoplay attempt is pending.
      void this.context!.resume().then(()=>this.flush()).catch(()=>{/* A later gesture can retry. */});
    }catch{/* Unsupported/blocked audio must never interrupt the interface. */}
  }
  private flush(){
    if(!this.enabled||this.away||document.hidden||this.context?.state!=='running')return;
    this.startAmbient();const cue=this.pendingCue;this.pendingCue=undefined;if(cue)this.emit(cue);
  }
  private startAmbient() {
    if(!this.context || !this.master || this.ambient || !this.enabled || this.away || document.hidden) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    osc.type='sawtooth'; osc.frequency.value=48;
    filter.type='lowpass'; filter.frequency.value=130;
    gain.gain.value=.035;
    osc.connect(filter);filter.connect(gain);gain.connect(this.master);osc.start();this.ambient={osc,gain,filter};
  }
  private stopAmbient(){if(!this.ambient)return;const {osc,gain,filter}=this.ambient;osc.stop();osc.disconnect();gain.disconnect();filter.disconnect();this.ambient=undefined;}
  play(cue:Cue) {
    if(!this.enabled || document.hidden || this.away)return;
    if(this.context?.state==='running'){this.emit(cue);return;}
    if(cue==='tick')return; // Hover must not replace a queued click/navigation cue before audio unlocks.
    this.pendingCue=cue;if(this.gestureSeen)this.requestResume();
  }
  private emit(cue:Cue,allowHidden=false){
    if(!this.enabled || !this.context || !this.master || this.context.state!=='running' || (!allowHidden&&document.hidden))return;
    const now=this.context.currentTime;
    // Only hover ticks are throttled. A hover/click can never swallow a page or tab cue.
    if(cue==='tick'){if(now-this.lastTick<.1)return;this.lastTick=now;}
    const osc=this.context.createOscillator(), gain=this.context.createGain();
    const duration=cue==='unfold'?.32:cue==='navigate'?.17:cue==='return'?.2:cue==='depart'?.1:.075;
    const frequencies:Record<Cue,number>={tick:920,click:740,select:460,navigate:220,unfold:110,success:660,depart:360,return:520};
    osc.type=cue==='unfold'?'sawtooth':'sine';
    osc.frequency.setValueAtTime(frequencies[cue],now);
    const end=cue==='tick'?420:cue==='depart'?180:frequencies[cue]*1.9;
    osc.frequency.exponentialRampToValueAtTime(end,now+duration);
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(cue==='unfold'?.07:cue==='click'?.17:.24,now+.006);
    gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    osc.connect(gain);gain.connect(this.master);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(now);osc.stop(now+duration+.02);
  }
  private cancelSuspend(){if(this.suspendTimer!==undefined){clearTimeout(this.suspendTimer);this.suspendTimer=undefined;}}
  leaveTab(){
    if(this.away)return;this.away=true;this.pendingCue=undefined;this.stopAmbient();
    this.emit('depart',true);this.cancelSuspend();
    this.suspendTimer=window.setTimeout(()=>{if(this.away)void this.context?.suspend().catch(()=>{});},140);
  }
  returnToTab(){
    if(document.hidden)return;
    const now=performance.now();if(!this.away&&now-this.lastReturn<250)return;
    this.lastReturn=now;this.away=false;this.cancelSuspend();
    if(this.enabled){this.pendingCue='return';this.requestResume();}
  }
}
export const sound=new SoundEngine();

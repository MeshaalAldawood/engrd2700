(function(){
var SB_URL="https://yxogljeccbequfmqwfia.supabase.co";
var SB_KEY="sb_publishable_sHiwIg9Spr2JdT_rhB8xpQ_cwlemoFK";
var DATA=window.ENGRD2700;
var byId=function(id){return document.getElementById(id);};
var state=loadState();
var currentProblem=null,problemStartedAt=Date.now(),hintsUsed=0;

function uuid(){
  if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
  return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(c){
    var r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16);
  });
}
function emptyMastery(){
  var out={};DATA.skills.forEach(function(s){out[s.id]={level:0,score:0,correct:0,incorrect:0,lastSeen:null,failureMode:null};});return out;
}
function loadState(){
  var clientId=localStorage.getItem("engrd2700_client_id")||uuid();
  localStorage.setItem("engrd2700_client_id",clientId);
  var saved=null;try{saved=JSON.parse(localStorage.getItem("engrd2700_state")||"null");}catch(e){}
  if(saved){
    saved.clientId=clientId;saved.mastery=saved.mastery||{};
    DATA.skills.forEach(function(s){if(!saved.mastery[s.id])saved.mastery[s.id]={level:0,score:0,correct:0,incorrect:0,lastSeen:null,failureMode:null};});
    return saved;
  }
  return{clientId:clientId,sessionId:uuid(),mode:"learn",attempts:[],mastery:emptyMastery()};
}
function saveState(){localStorage.setItem("engrd2700_state",JSON.stringify(state));}
async function rest(table,method,body,query){
  method=method||"GET";query=query||"";
  var headers={apikey:SB_KEY,"Content-Type":"application/json","x-client-id":state.clientId};
  if(method==="POST"||method==="PATCH")headers.Prefer=query.indexOf("on_conflict")>=0?"resolution=merge-duplicates,return=minimal":"return=minimal";
  var res=await fetch(SB_URL+"/rest/v1/"+table+query,{method:method,headers:headers,body:body?JSON.stringify(body):undefined});
  if(!res.ok)throw new Error(res.status+" "+await res.text());
  if(res.status===204)return null;
  try{return await res.json();}catch(e){return null;}
}
function setSync(ok){
  byId("syncStatus").textContent=ok?"● Synced to Supabase":"● Local backup active";
  byId("syncStatus").style.color=ok?"var(--good)":"var(--warn)";
}
async function ensureSession(){
  try{
    var rows=await rest("study_sessions","GET",null,"?id=eq."+state.sessionId+"&select=id");
    if(!rows||rows.length===0)await rest("study_sessions","POST",{id:state.sessionId,client_id:state.clientId,mode:state.mode,metadata:{app_version:"v1"}},"");
    setSync(true);
  }catch(e){console.warn(e);setSync(false);}
}
function skillById(id){return DATA.skills.find(function(s){return s.id===id;});}
function problemScore(p){
  var m=state.mastery[p.skill]||{level:0,score:0};
  var priority=skillById(p.skill).priority==="high"?2:1;
  var stageBonus=0;
  if(state.mode==="mixed")stageBonus=(p.stage==="mixed"||p.stage==="independent")?3:0;
  else if(state.mode==="timed")stageBonus=p.stage!=="guided"?4:0;
  else stageBonus=(m.level<2&&p.stage==="guided")?5:0;
  var weakness=(100-(m.score||0))/20;
  var seen=state.attempts.filter(function(a){return a.problemId===p.id;}).length;
  return priority+stageBonus+weakness-seen*2;
}
function pickProblem(){
  var ranked=DATA.problems.slice().sort(function(a,b){return problemScore(b)-problemScore(a);});
  var top=ranked.slice(0,Math.min(5,ranked.length));
  currentProblem=top[Math.floor(Math.random()*top.length)];
  hintsUsed=0;problemStartedAt=Date.now();renderProblem();
}
function renderProblem(){
  var p=currentProblem,s=skillById(p.skill),m=state.mastery[p.skill];
  byId("unitPill").textContent=s.unit;byId("skillName").textContent=s.name;byId("recognitionCue").textContent=s.cue;byId("modelBox").textContent=s.model;
  byId("skillLevel").textContent="Level "+m.level+" / 4";byId("problemStage").textContent=state.mode==="timed"?"timed":p.stage;byId("problemId").textContent=p.id;byId("problemPrompt").textContent=p.prompt;
  byId("answerInput").value="";byId("hintBox").classList.add("hidden");byId("feedbackBox").classList.add("hidden");
}
function normalize(s){return(s||"").toLowerCase().replace(/\s+/g,"").replace(/[,$]/g,"");}
function judge(p,input){
  var n=normalize(input);
  if(p.aliases&&p.aliases.some(function(a){return n===normalize(a);})){return true;}
  if(p.answer&&n===normalize(p.answer))return true;
  if(p.contains)return p.contains.every(function(tok){return n.indexOf(normalize(tok))>=0;});
  return false;
}
function classifyError(input){if(!(input||"").trim())return"no_attempt";return"execution";}
function masteryAfter(skillId,correct,stage,input){
  var m=state.mastery[skillId],weight=stage==="timed"?18:stage==="mixed"?16:stage==="independent"?14:10;
  m.score=Math.max(0,Math.min(100,(m.score||0)+(correct?weight:-Math.max(8,weight*.7))));
  if(correct)m.correct++;else m.incorrect++;
  m.lastSeen=new Date().toISOString();
  if(correct){
    if(stage==="guided")m.level=Math.max(m.level,1);
    if(stage==="independent")m.level=Math.max(m.level,2);
    if(stage==="mixed")m.level=Math.max(m.level,3);
    if(stage==="timed")m.level=Math.max(m.level,4);
  }else{
    m.failureMode=classifyError(input);
    if(stage==="timed"&&m.level===4)m.level=3;
  }
}
async function syncAttempt(a,input,m){
  await ensureSession();
  await rest("attempts","POST",{
    session_id:state.sessionId,client_id:state.clientId,skill_id:a.skillId,problem_id:a.problemId,stage:a.stage,
    answer:{text:input},correct:a.correct,confidence:a.confidence,hints_used:a.hintsUsed,time_seconds:a.timeSeconds,error_type:a.correct?null:m.failureMode
  },"");
  await rest("skill_mastery","POST",{
    client_id:state.clientId,skill_id:a.skillId,mastery_level:m.level,score:m.score,
    guided_correct:state.attempts.filter(function(x){return x.skillId===a.skillId&&x.stage==="guided"&&x.correct;}).length,
    independent_correct:state.attempts.filter(function(x){return x.skillId===a.skillId&&x.stage==="independent"&&x.correct;}).length,
    mixed_correct:state.attempts.filter(function(x){return x.skillId===a.skillId&&x.stage==="mixed"&&x.correct;}).length,
    timed_correct:state.attempts.filter(function(x){return x.skillId===a.skillId&&x.stage==="timed"&&x.correct;}).length,
    incorrect:m.incorrect,last_result:a.correct,failure_mode:m.failureMode,last_seen:m.lastSeen,updated_at:new Date().toISOString()
  },"?on_conflict=client_id,skill_id");
  await rest("state_snapshots","POST",{session_id:state.sessionId,client_id:state.clientId,state:{mode:state.mode,mastery:state.mastery,last_attempt:a}},"");
  setSync(true);
}
async function submit(){
  if(!currentProblem)return;
  var input=byId("answerInput").value,correct=judge(currentProblem,input);
  var elapsed=Math.max(1,Math.round((Date.now()-problemStartedAt)/1000));
  var stage=state.mode==="timed"?"timed":state.mode==="mixed"?"mixed":currentProblem.stage;
  var a={problemId:currentProblem.id,skillId:currentProblem.skill,correct:correct,stage:stage,timeSeconds:elapsed,hintsUsed:hintsUsed,confidence:+byId("confidence").value,createdAt:new Date().toISOString()};
  state.attempts.push(a);if(state.attempts.length>500)state.attempts=state.attempts.slice(-500);
  masteryAfter(a.skillId,correct,stage,input);saveState();updateStats();renderMastery();
  try{await syncAttempt(a,input,state.mastery[a.skillId]);}catch(e){console.warn(e);setSync(false);}
  var box=byId("feedbackBox");box.className="feedback "+(correct?"good":"bad");
  box.innerHTML="<strong>"+(correct?"Correct":"Not yet")+"</strong><br>"+currentProblem.explanation+"<br><span class='small'>Time: "+elapsed+"s · Hints: "+hintsUsed+"</span>";
}
function renderMastery(){
  var grid=byId("masteryGrid");grid.innerHTML="";
  DATA.skills.forEach(function(s){
    var m=state.mastery[s.id]||{level:0,score:0},row=document.createElement("div");row.className="skill-row";
    row.innerHTML="<div><strong>"+s.name+"</strong><div class='small muted'>"+s.unit+"</div></div><div class='level'>L"+m.level+"/4 · "+Math.round(m.score||0)+"%</div><div class='priority-"+s.priority+"'>"+s.priority+" priority</div>";
    grid.appendChild(row);
  });
}
function updateStats(){
  var a=state.attempts,correct=a.filter(function(x){return x.correct;}).length;
  byId("attemptCount").textContent=a.length;byId("correctCount").textContent=correct;
  byId("avgTime").textContent=a.length?Math.round(a.reduce(function(s,x){return s+x.timeSeconds;},0)/a.length):"—";
  var vals=Object.values(state.mastery),overall=Math.round(vals.reduce(function(s,m){return s+(m.score||0);},0)/vals.length);
  byId("overallMastery").textContent=overall+"%";byId("overallBar").style.width=overall+"%";
}
function switchView(mode,btn){
  document.querySelectorAll(".nav-btn").forEach(function(x){x.classList.remove("active");});btn.classList.add("active");
  state.mode=mode;saveState();
  if(mode==="mastery"){
    byId("learnView").classList.add("hidden");byId("masteryView").classList.remove("hidden");byId("modeLabel").textContent="MASTERY";byId("screenTitle").textContent="Demonstrated ability, not familiarity";renderMastery();
  }else{
    byId("learnView").classList.remove("hidden");byId("masteryView").classList.add("hidden");byId("modeLabel").textContent=mode.toUpperCase()+" MODE";
    byId("screenTitle").textContent=mode==="learn"?"Build the model, then execute":mode==="mixed"?"Recognize the method without labels":"Solve under exam pressure";pickProblem();
  }
}
byId("submitBtn").onclick=submit;
byId("hintBtn").onclick=function(){hintsUsed++;byId("hintBox").textContent=currentProblem.hint||"Identify the problem type before calculating.";byId("hintBox").classList.remove("hidden");};
byId("newProblemBtn").onclick=pickProblem;byId("refreshMastery").onclick=renderMastery;
document.querySelectorAll(".nav-btn").forEach(function(btn){btn.onclick=function(){switchView(btn.dataset.view,btn);};});
updateStats();renderMastery();ensureSession();pickProblem();
})();
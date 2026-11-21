const KEY='haoyi-studio-focus-v2';
const mins=document.getElementById('dashboard-minutes');
const sessions=document.getElementById('dashboard-sessions');
const activity=document.getElementById('dashboard-activity');
function renderSummary(){
  if(!mins) return;
  try{
    const parsed=JSON.parse(localStorage.getItem(KEY)||'{}');
    const records=Array.isArray(parsed.history)?parsed.history:[];
    const d=new Date(); const today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    const recent=records.filter(item=>item && item.day===today);
    mins.textContent=String(recent.reduce((sum,item)=>sum+Number(item.minutes||0),0));
    sessions.textContent=String(recent.length);
    if(activity && records.length){
      const last=records[records.length-1];
      activity.textContent=last.task?('上次专注：'+last.task):'上次专注已完成';
    }
  }catch{
    mins.textContent='0';sessions.textContent='0';
  }
}
renderSummary();
window.addEventListener('pageshow',renderSummary);
window.addEventListener('storage',renderSummary);

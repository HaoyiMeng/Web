const $ = id => document.getElementById(id);
const NOTES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const STRINGS=[{name:'G',pitch:7},{name:'D',pitch:2},{name:'A',pitch:9},{name:'E',pitch:4}];
const SCALES={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],pentatonic:[0,3,5,7,10],chromatic:[0,1,2,3,4,5,6,7,8,9,10,11]};
const INTERVALS=['P1','m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7'];
let currentSelection=null;
function renderFretboard(){
 const root=Number($('root-select').value),scale=$('scale-select').value, intervals=SCALES[scale], el=$('fretboard');el.replaceChildren();
 STRINGS.forEach((string,stringIdx)=>{
   const l=document.createElement('span');l.className='string-label';l.textContent=string.name;el.append(l);
   for(let fret=0;fret<=12;fret++){
     const note=(string.pitch+fret)%12,interval=(note-root+12)%12,active=intervals.includes(interval);
     const cell=document.createElement('div');cell.className='fret-cell'+(fret===0?' open':'');
     const b=document.createElement('button');b.type='button';b.className='note-dot'+(active?' in-scale':'')+(interval===0?' root':'');b.textContent=NOTES[note];
     b.setAttribute('aria-label',`${string.name} string, fret ${fret}, ${NOTES[note]}, interval ${INTERVALS[interval]}`);
     if(currentSelection && currentSelection.stringIdx===stringIdx && currentSelection.fret===fret)b.classList.add('selected');
     b.addEventListener('click',()=>{currentSelection={stringIdx,fret};$('note-readout').textContent=`${string.name} 弦 · 第 ${fret} 品 · ${NOTES[note]} · ${INTERVALS[interval]}`;renderFretboard();});
     cell.append(b);el.append(cell);
   }
 });
 let cap=document.querySelector('.fret-caption');if(!cap){cap=document.createElement('div');cap.className='fret-caption';el.after(cap);}cap.replaceChildren();
 for(let n=-1;n<=12;n++){const e=document.createElement('span');e.className='fret-num';e.textContent=n===-1?'':String(n);cap.append(e);}
 $('scale-notes').textContent='Scale notes: '+intervals.map(i=>NOTES[(root+i)%12]).join(' · ');
}
if ($('root-select') && $('scale-select') && $('fretboard')) {
  NOTES.forEach((name,i)=>{const option=document.createElement('option');option.value=i;option.textContent=name;$('root-select').append(option);});
  $('root-select').value='0';
  $('root-select').addEventListener('change',renderFretboard);
  $('scale-select').addEventListener('change',renderFretboard);
  renderFretboard();
}

//renderer.js
// Renderer: handles UI behaviour
const subjectsList = [
  'english', 'mathematics', 'physics', 'chemistry', 'biology',
  'economics', 'literature', 'government', 'accounting'
];

const subjectsReadable = {
  english: 'Use of English',
  mathematics: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  economics: 'Economics',
  literature: 'Literature in English',
  government: 'Government',
  accounting: 'Accounting'
};

let selectedSubjects = [];
let candidateName = '';
let currentQuestions = [];
let currentIndex = 0;
let answers = {};
let timerInterval = null;
let examDurationSec = 120 * 60; // default 120 minutes for full exam (can change in settings)

function $(id){return document.getElementById(id)}

function init(){
  // populate subject checkboxes
  const container = $('subjects');
  subjectsList.forEach(s => {
    const id = 'chk_' + s;
    const wrapper = document.createElement('label');
    wrapper.innerHTML = `<input type="checkbox" id="${id}" value="${s}"> ${subjectsReadable[s]}`;
    container.appendChild(wrapper);
  });

  $('start-practice').addEventListener('click', startPractice);
  $('start-exam').addEventListener('click', startExam);
  $('prev').addEventListener('click', prevQuestion);
  $('next').addEventListener('click', nextQuestion);
  $('submit-exam').addEventListener('click', submitExam);
  $('back-home').addEventListener('click', showHome);
}

async function startPractice(){
  candidateName = $('candidateName').value.trim() || 'Candidate';
  collectSubjects();
  if(selectedSubjects.length === 0){
    alert('Please choose at least 1 subject in addition to Use of English.');
    return;
  }
  // For practice, load only first subject as demo (you can expand to multiple subjects flow)
  await loadSubject(selectedSubjects[0]);
  showExamScreen(selectedSubjects[0]);
}

async function startExam(){
  candidateName = $('candidateName').value.trim() || 'Candidate';
  collectSubjects();
  if(selectedSubjects.length < 3){
    alert('Please choose 3 subjects for a full exam (besides Use of English).');
    return;
  }
  // Combine subjects: english + first 3 selected
  const examSubjects = ['english', ...selectedSubjects.slice(0,3)];
  // Flatten questions from each subject (40 per subject for non-english, 60 for english) - demo will load only english for speed
  await loadSubject('english');
  showExamScreen('english');
}

function collectSubjects(){
  selectedSubjects = subjectsList.filter(s => s !== 'english')
    .filter(s => document.querySelector(`#chk_${s}`).checked);
}

async function loadSubject(subject){
  const res = await window.electronAPI.loadQuestions(subject);
  if(res.error){
    alert('Error loading questions: ' + res.details);
    currentQuestions = [];
    return;
  }
  // expect an array of questions
  currentQuestions = res.slice(0, 20); // load first 20 as sample
  currentIndex = 0;
  answers = {};
}

function showExamScreen(subject){
  $('home-screen').classList.add('hidden');
  $('result-screen').classList.add('hidden');
  $('exam-screen').classList.remove('hidden');
  $('current-subject').innerText = subjectsReadable[subject] || subject;
  renderQuestion();
  startTimer(10 * 60); // demo: 10 minutes timer for this subject
}

function showHome(){
  $('home-screen').classList.remove('hidden');
  $('exam-screen').classList.add('hidden');
  $('result-screen').classList.add('hidden');
  stopTimer();
}

function renderQuestion(){
  if(!currentQuestions.length) return;
  const q = currentQuestions[currentIndex];
  $('q-number').innerText = `Q${currentIndex + 1}`;
  $('q-text').innerText = q.question;

  const opts = $('options');
  opts.innerHTML = '';
  ['a','b','c','d'].forEach(letter => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.innerText = `${letter.toUpperCase()}. ${q.options[letter]}`;
    btn.onclick = () => selectOption(letter);
    if(answers[currentIndex] === letter) btn.style.border = '2px solid #0b6cff';
    opts.appendChild(btn);
  });
}

function selectOption(letter){
  answers[currentIndex] = letter;
  renderQuestion();
}

function prevQuestion(){
  if(currentIndex === 0) return;
  currentIndex -= 1; renderQuestion();
}
function nextQuestion(){
  if(currentIndex >= currentQuestions.length -1) return;
  currentIndex += 1; renderQuestion();
}

function submitExam(){
  // simple scoring demo: count correct (if questions include answer field)
  let score = 0;
  currentQuestions.forEach((q, idx) => {
    if(answers[idx] && answers[idx] === q.answer) score += 1;
  });

  const resultDiv = $('result-summary');
  resultDiv.innerHTML = `<p>Candidate: ${candidateName}</p><p>Score: ${score} / ${currentQuestions.length}</p>`;
  $('exam-screen').classList.add('hidden');
  $('result-screen').classList.remove('hidden');
  stopTimer();
}

function startTimer(seconds){
  stopTimer();
  let s = seconds;
  $('timer').innerText = formatTime(s);
  timerInterval = setInterval(()=>{
    s -= 1;
    if(s < 0){
      clearInterval(timerInterval);
      submitExam();
      return;
    }
    $('timer').innerText = formatTime(s);
  }, 1000);
}
function stopTimer(){ if(timerInterval) clearInterval(timerInterval); timerInterval = null; }
function formatTime(sec){
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = (sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

window.addEventListener('DOMContentLoaded', init);


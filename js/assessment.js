/* ============================================
   ASSESSMENT.JS — Quiz engine
   ============================================ */

var quizState = {
  skill: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  selectedIndex: null
};

document.addEventListener('DOMContentLoaded', function () {
  renderSkillPicker();
  renderPastAssessments();
  setupExitAndNext();
});

/* ---------- Skill picker ---------- */
function renderSkillPicker() {
  var profile = Models.loadProfile();
  var container = document.getElementById('skill-picker');
  container.innerHTML = '';

  if (profile.skills.length === 0) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<p>Add skills first from the Skills page.</p>' +
        '<a href="profile.html" class="btn btn-primary">+ Add Skill</a>' +
      '</div>';
    return;
  }

  for (var i = 0; i < profile.skills.length; i++) {
    container.appendChild(createSkillPickerCard(profile.skills[i]));
  }
}

function createSkillPickerCard(skill) {
  var hasQuestions = QUESTIONS[skill.name] && QUESTIONS[skill.name].length > 0;

  var card = document.createElement('div');
  card.className = 'card accent-teal skill-picker-card';

  card.innerHTML =
    '<h3>' + escapeHtml(skill.name) + '</h3>' +
    '<p>' + escapeHtml(skill.category || 'Uncategorised') + '</p>' +
    '<p class="muted" style="margin-top:8px;">' +
      (hasQuestions
        ? '5 questions available'
        : 'No custom questions — generic quiz') +
    '</p>' +
    '<button class="btn btn-primary btn-small" style="margin-top:14px;">Start Quiz →</button>';

  card.querySelector('button').addEventListener('click', function () {
    startQuiz(skill);
  });

  return card;
}

/* ---------- Past assessments ---------- */
function renderPastAssessments() {
  var profile = Models.loadProfile();
  var container = document.getElementById('past-assessments');
  container.innerHTML = '';

  if (profile.assessments.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No assessments taken yet.</p></div>';
    return;
  }

  var sorted = profile.assessments.slice().sort(function (a, b) {
    return new Date(b.dateTaken) - new Date(a.dateTaken);
  });

  for (var i = 0; i < sorted.length; i++) {
    var as = sorted[i];
    var skill = findSkill(profile.skills, as.skillId);
    var skillName = skill ? skill.name : 'Unknown skill';

    var colorClass = as.score >= 70 ? 'pill-verified'
                    : as.score >= 40 ? 'pill-assessment'
                    : 'pill-certificate';

    var row = document.createElement('div');
    row.className = 'evidence-row type-assessment';
    row.innerHTML =
      '<div class="evidence-header">' +
        '<div>' +
          '<p class="evidence-title">' + escapeHtml(skillName) + ' — ' + as.score + '%</p>' +
          '<p class="evidence-meta">' + escapeHtml(as.dateTaken || '') +
            ' · ' + as.questionsAttempted + ' questions</p>' +
        '</div>' +
        '<div class="evidence-badges">' +
          '<span class="pill ' + colorClass + '">' + getScoreLabel(as.score) + '</span>' +
        '</div>' +
      '</div>';
    container.appendChild(row);
  }
}

function findSkill(skills, skillId) {
  for (var i = 0; i < skills.length; i++) {
    if (skills[i].id === skillId) return skills[i];
  }
  return null;
}

function getScoreLabel(score) {
  if (score >= 70) return 'Strong';
  if (score >= 40) return 'Moderate';
  return 'Weak';
}

/* ---------- Start quiz ---------- */
function startQuiz(skill) {
  var questions = QUESTIONS[skill.name] && QUESTIONS[skill.name].length > 0
    ? QUESTIONS[skill.name]
    : DEFAULT_QUESTIONS;

  quizState = {
    skill: skill,
    questions: questions.slice(0, 5),   // max 5
    currentIndex: 0,
    answers: [],
    selectedIndex: null
  };

  document.getElementById('picker-view').hidden = true;
  document.getElementById('result-view').hidden = true;
  document.getElementById('quiz-view').hidden = false;

  document.getElementById('quiz-skill-name').textContent = skill.name;

  renderQuestion();
}

/* ---------- Render current question ---------- */
function renderQuestion() {
  var q = quizState.questions[quizState.currentIndex];
  var total = quizState.questions.length;
  var current = quizState.currentIndex + 1;

  document.getElementById('quiz-progress').textContent = 'Question ' + current + ' of ' + total;
  document.getElementById('quiz-progress-fill').style.width =
    ((current - 1) / total * 100) + '%';

  document.getElementById('quiz-question').textContent = q.q;

  var optionsContainer = document.getElementById('quiz-options');
  optionsContainer.innerHTML = '';
  quizState.selectedIndex = null;

  for (var i = 0; i < q.options.length; i++) {
    (function (idx) {
      var opt = document.createElement('button');
      opt.className = 'quiz-option';
      opt.textContent = q.options[idx];
      opt.addEventListener('click', function () {
        selectOption(idx);
      });
      optionsContainer.appendChild(opt);
    })(i);
  }

  // Update Next button
  var nextBtn = document.getElementById('quiz-next');
  nextBtn.disabled = true;
  nextBtn.textContent = (current === total) ? 'Finish →' : 'Next →';
}

function selectOption(idx) {
  quizState.selectedIndex = idx;

  var options = document.querySelectorAll('.quiz-option');
  for (var i = 0; i < options.length; i++) {
    options[i].classList.toggle('selected', i === idx);
  }

  document.getElementById('quiz-next').disabled = false;
}

/* ---------- Next / Finish ---------- */
function setupExitAndNext() {
  document.getElementById('quiz-next').addEventListener('click', handleNext);
  document.getElementById('quiz-exit').addEventListener('click', exitQuiz);
  document.getElementById('result-back').addEventListener('click', backToPicker);
}

function handleNext() {
  if (quizState.selectedIndex === null) return;

  quizState.answers.push(quizState.selectedIndex);
  quizState.currentIndex++;

  if (quizState.currentIndex >= quizState.questions.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
}

function exitQuiz() {
  if (!confirm('Exit quiz? Your answers will be lost.')) return;
  backToPicker();
}

function backToPicker() {
  document.getElementById('picker-view').hidden = false;
  document.getElementById('quiz-view').hidden = true;
  document.getElementById('result-view').hidden = true;
  renderSkillPicker();
  renderPastAssessments();
}

/* ---------- Finish ---------- */
function finishQuiz() {
  var correct = 0;
  for (var i = 0; i < quizState.questions.length; i++) {
    if (quizState.answers[i] === quizState.questions[i].correct) {
      correct++;
    }
  }

  var total = quizState.questions.length;
  var score = Math.round((correct / total) * 100);

  // Save as assessment evidence
  var profile = Models.loadProfile();
  profile.assessments.push({
    id: Models.uid('as'),
    skillId: quizState.skill.id,
    score: score,
    dateTaken: new Date().toISOString().slice(0, 10),
    questionsAttempted: total
  });
  Models.saveProfile(profile);

  // Show result
  document.getElementById('quiz-view').hidden = true;
  document.getElementById('result-view').hidden = false;

  document.getElementById('result-score').textContent = score + '%';
  document.getElementById('result-meta').textContent =
    correct + ' of ' + total + ' correct · ' + quizState.skill.name;

  var msg = '';
  if (score >= 80) msg = 'Excellent! Strong evidence added to your profile.';
  else if (score >= 60) msg = 'Good job! This adds solid evidence.';
  else if (score >= 40) msg = 'Decent — consider more practice to raise confidence.';
  else msg = 'Keep learning — try again after some practice.';
  document.getElementById('result-message').textContent = msg;
}

/* ---------- Escape HTML ---------- */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
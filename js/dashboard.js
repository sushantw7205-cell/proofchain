/* ============================================
   DASHBOARD.JS — Reads profile from Firestore
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {
  renderDashboard();
});

function renderDashboard() {
  Models.loadProfile().then(function (profile) {
    var analysis = Scoring.analyzeProfile(profile);
    renderStudentCard(profile);
    renderSummaryTiles(profile, analysis);
    renderSkillCards(analysis);
    renderRecommendations(analysis);
    setupResetButton();
  }).catch(function (err) {
    console.error('Dashboard load failed:', err);
    document.getElementById('skills-container').innerHTML =
      '<div class="empty-state"><p>Could not load profile. Check console.</p></div>';
  });
}

function renderStudentCard(profile) {
  var s = profile.student || {};
  setText('student-name', s.name || 'Student');
  setText('student-course', s.course || '');
  setText('student-goal', s.goal ? ('Goal: ' + s.goal) : '');
  setText('student-avatar', (s.name || 'S').charAt(0).toUpperCase());
}

function renderSummaryTiles(profile, analysis) {
  setText('stat-skills', profile.skills.length);
  setText('stat-evidence', profile.evidence.length);

  var verifiedCount = 0;
  for (var i = 0; i < profile.evidence.length; i++) {
    if (profile.evidence[i].verified) verifiedCount++;
  }
  setText('stat-verified', verifiedCount);

  var avgConfidence = 0;
  if (analysis.length > 0) {
    var sum = 0;
    for (var j = 0; j < analysis.length; j++) {
      sum += analysis[j].confidence.score;
    }
    avgConfidence = Math.round(sum / analysis.length);
  }
  setText('stat-confidence', avgConfidence + '%');
}

function renderSkillCards(analysis) {
  var container = document.getElementById('skills-container');
  if (!container) return;
  container.innerHTML = '';

  if (analysis.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No skills yet.</p></div>';
    return;
  }

  for (var i = 0; i < analysis.length; i++) {
    container.appendChild(createSkillCard(analysis[i]));
  }
}

function createSkillCard(item) {
  var skill = item.skill;
  var confidence = item.confidence;
  var proficiency = item.proficiency;
  var recommendation = item.recommendation;

  var confColor = confidence.score >= 70 ? 'var(--green)'
    : confidence.score >= 40 ? 'var(--yellow)'
    : 'var(--red)';

  var evidenceCount = confidence.breakdown.length;

  var card = document.createElement('div');
  card.className = 'skill-card card';

  card.innerHTML =
    '<div class="skill-card-header">' +
      '<div>' +
        '<h3 class="skill-name">' + escapeHtml(skill.name) + '</h3>' +
        '<p class="skill-category">' + escapeHtml(skill.category || '') + '</p>' +
      '</div>' +
      '<span class="skill-badge" style="background:' + confColor + '22;color:' + confColor + '">' +
        confidence.score + '%' +
      '</span>' +
    '</div>' +
    '<div class="skill-bars">' +
      '<div class="bar-row">' +
        '<span class="bar-label">Confidence</span>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + confidence.score + '%;background:' + confColor + '"></div></div>' +
        '<span class="bar-value">' + confidence.score + '%</span>' +
      '</div>' +
      '<div class="bar-row">' +
        '<span class="bar-label">Proficiency</span>' +
        '<div class="bar-track"><div class="bar-fill bar-prof" style="width:' + proficiency + '%"></div></div>' +
        '<span class="bar-value">' + proficiency + '%</span>' +
      '</div>' +
    '</div>' +
    '<div class="skill-footer">' +
      '<span class="skill-meta">' + evidenceCount + ' evidence item' + (evidenceCount === 1 ? '' : 's') + '</span>' +
      '<button class="btn-link">Why this score? →</button>' +
    '</div>' +
    '<div class="why-panel" hidden>' + renderBreakdownTable(confidence, proficiency) + '</div>' +
    '<div class="recommendation-mini"><strong>Next:</strong> ' + escapeHtml(recommendation.title) + '</div>';

  var toggleBtn = card.querySelector('.btn-link');
  var panel = card.querySelector('.why-panel');
  toggleBtn.addEventListener('click', function () {
    panel.hidden = !panel.hidden;
    toggleBtn.textContent = panel.hidden ? 'Why this score? →' : 'Hide breakdown ↑';
  });

  return card;
}

function renderBreakdownTable(confidence, proficiency) {
  if (confidence.breakdown.length === 0) {
    return '<p class="muted">No evidence yet.</p>';
  }

  var rows = '';
  for (var i = 0; i < confidence.breakdown.length; i++) {
    var b = confidence.breakdown[i];
    rows += '<tr>' +
      '<td>' + escapeHtml(b.title) + '</td>' +
      '<td>' + b.base.toFixed(1) + '</td>' +
      '<td>' + b.recencyMultiplier.toFixed(1) + '</td>' +
      '<td>' + (b.verified ? '✓' : '—') + '</td>' +
      '<td class="pts">' + b.points.toFixed(2) + '</td>' +
    '</tr>';
  }

  return '<table class="breakdown-table">' +
    '<thead><tr><th>Evidence</th><th>Weight</th><th>Recency</th><th>Verified</th><th>Points</th></tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '<tfoot><tr>' +
      '<td colspan="4" class="muted">Total points → normalized to 0–100</td>' +
      '<td class="pts"><strong>' + confidence.totalPoints.toFixed(2) + '</strong></td>' +
    '</tr></tfoot>' +
  '</table>' +
  '<p class="formula muted">Confidence = Σ(evidence points) ÷ 8 × 100 · Proficiency estimate = ' + proficiency + '%</p>';
}

function renderRecommendations(analysis) {
  var container = document.getElementById('recommendations');
  if (!container) return;
  container.innerHTML = '';

  if (analysis.length === 0) {
    container.innerHTML = '<p class="muted">Add skills to see recommendations.</p>';
    return;
  }

  var sorted = analysis.slice().sort(function (a, b) {
    return a.confidence.score - b.confidence.score;
  });
  var top = sorted.slice(0, 2);

  for (var i = 0; i < top.length; i++) {
    var item = top[i];
    var el = document.createElement('div');
    el.className = 'recommendation-card card accent-teal';
    el.innerHTML =
      '<p class="rec-skill">' + escapeHtml(item.skill.name) + '</p>' +
      '<p class="rec-title">' + escapeHtml(item.recommendation.title) + '</p>' +
      '<p class="rec-reason muted">' + escapeHtml(item.recommendation.reason) + '</p>';
    container.appendChild(el);
  }
}

function setupResetButton() {
  var btn = document.getElementById('reset-btn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    if (confirm('Reset to demo data?')) {
      Models.resetToDemo().then(function () {
        renderDashboard();
      });
    }
  });
}

function setText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
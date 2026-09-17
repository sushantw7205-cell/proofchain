/* ============================================
   DASHBOARD.JS — Renders the student dashboard
   ============================================ */

(function () {

  /* ---------- Load data ---------- */
  const profile = Models.loadProfile();
  const { student, skills, evidence, assessments } = profile;

  /* ---------- Student header ---------- */
  document.getElementById('student-name').textContent = student.name;
  document.getElementById('student-course').textContent = student.course;
  document.getElementById('student-goal').textContent = student.goal
    ? 'Goal: ' + student.goal
    : '';

  /* ---------- Stats row ---------- */
  document.getElementById('stat-skills').textContent = skills.length;
  document.getElementById('stat-evidence').textContent = evidence.length;
  document.getElementById('stat-assessments').textContent = assessments.length;

  // Average confidence across all skills
  const confidences = skills.map(sk =>
    Scoring.calculateConfidence(sk.id, evidence, assessments).score
  );
  const avgConf = confidences.length
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 0;
  document.getElementById('stat-confidence').textContent = avgConf + '%';

  /* ---------- Skill cards ---------- */
  const skillCardsEl = document.getElementById('skill-cards');

  if (skills.length === 0) {
    skillCardsEl.innerHTML = `
      <div class="card empty-state">
        <h3>No skills yet</h3>
        <p>Add your first skill to start building your profile.</p>
        <a href="profile.html" class="btn btn-primary">+ Add Skill</a>
      </div>
    `;
  } else {
    skillCardsEl.innerHTML = skills.map(skill => {
      const conf = Scoring.calculateConfidence(skill.id, evidence, assessments);
      const prof = Scoring.estimateProficiency(skill.id, skill, assessments);
      return renderSkillCard(skill, conf, prof);
    }).join('');
  }

  /**
   * Build the HTML for a single skill card.
   */
  function renderSkillCard(skill, conf, prof) {
    const confColor = conf.score >= 75 ? 'var(--green)'
                    : conf.score >= 50 ? 'var(--yellow)'
                    : 'var(--red)';
    const relatedCount = (skill.relatedSkills || []).length;

    return `
      <div class="card skill-card">
        <div class="skill-head">
          <h3>${skill.name}</h3>
          <span class="badge">${skill.category}</span>
        </div>

        <div class="progress-block">
          <div class="progress-row">
            <span class="progress-label">Proficiency</span>
            <span class="progress-value">${prof}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${prof}%"></div></div>
        </div>

        <div class="progress-block">
          <div class="progress-row">
            <span class="progress-label">Evidence Confidence</span>
            <span class="progress-value" style="color:${confColor}">${conf.score}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${conf.score}%; background:${confColor}"></div></div>
        </div>

        <p class="muted skill-meta">
          ${conf.breakdown.length} evidence item${conf.breakdown.length === 1 ? '' : 's'}
          · ${relatedCount} related skill${relatedCount === 1 ? '' : 's'}
        </p>

        <button class="btn btn-ghost btn-small" onclick="showBreakdown('${skill.id}')">
          Why this score?
        </button>
      </div>
    `;
  }

  /* ---------- Breakdown modal (global) ---------- */
  window.showBreakdown = function (skillId) {
    const skill = skills.find(s => s.id === skillId);
    const conf = Scoring.calculateConfidence(skillId, evidence, assessments);

    const rows = conf.breakdown.length
      ? conf.breakdown.map(b => `
        <tr>
          <td>${b.title}</td>
          <td>${b.type}</td>
          <td>${b.recency}</td>
          <td>${b.verified ? '✅' : '—'}</td>
          <td class="right">+${b.points}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="5" class="muted center">No evidence yet</td></tr>`;

    const html = `
      <div class="modal-backdrop" onclick="closeModal(event)">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-head">
            <h3>${skill.name} — Confidence Breakdown</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
          </div>
          <p class="muted">Total points: <strong>${conf.totalPoints}</strong> / ${conf.maxPoints}</p>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Evidence</th><th>Type</th><th>Recency</th><th>Verified</th><th class="right">Points</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="muted center" style="margin-top:14px">
            Final confidence: <strong style="color:var(--teal)">${conf.score}%</strong>
          </p>
        </div>
      </div>
    `;

    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstChild);
  };

  window.closeModal = function (e) {
    if (e && e.target && !e.target.classList.contains('modal-backdrop')) return;
    const el = document.querySelector('.modal-backdrop');
    if (el) el.remove();
  };

  /* ---------- Next Proof recommendation ---------- */
  if (skills.length > 0) {
    // Pick the skill with lowest confidence
    const sorted = skills.map(sk => ({
      skill: sk,
      conf: Scoring.calculateConfidence(sk.id, evidence, assessments).score
    })).sort((a, b) => a.conf - b.conf);

    const weakest = sorted[0];
    const rec = Scoring.recommendNextTask(weakest.skill.id, weakest.conf, evidence);

    document.getElementById('next-proof-card').innerHTML = `
      <p class="muted">Recommended action for <strong>${weakest.skill.name}</strong></p>
      <h3 style="margin:10px 0">${rec.title}</h3>
      <p class="muted">${rec.reason}</p>
      <button class="btn btn-primary" style="margin-top:14px">Start Task</button>
    `;
    document.getElementById('next-proof-section').style.display = 'block';
  }

  /* ---------- Recent evidence ---------- */
  const recentEl = document.getElementById('recent-evidence');
  const recent = [...evidence]
    .sort((a, b) => new Date(b.dateCompleted) - new Date(a.dateCompleted))
    .slice(0, 6);

  if (recent.length === 0) {
    recentEl.innerHTML = `<div class="card empty-state"><p>No evidence yet.</p></div>`;
  } else {
    recentEl.innerHTML = recent.map(ev => {
      const skill = skills.find(s => s.id === ev.skillId);
      return `
        <div class="card accent-blue">
          <h4>${ev.title}</h4>
          <p class="muted">${skill ? skill.name : '—'} · ${ev.type}</p>
          <p class="muted" style="font-size:0.82rem; margin-top:6px">
            ${ev.dateCompleted} ${ev.verified ? '· ✅ verified' : ''}
          </p>
        </div>
      `;
    }).join('');
  }

})();
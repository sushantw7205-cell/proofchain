/* ============================================
   RECRUITER.JS — Public read-only profile + skill graph
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {
  var profile = loadProfileFromUrl() || Models.loadProfile();
  var analysis = Scoring.analyzeProfile(profile);

  renderPublicProfile(profile, analysis);
  renderRecruiterSkills(analysis);
  renderEvidenceTimeline(profile);
  renderSkillGraph(profile, analysis);
  setupShareButton(profile);
});

/* ---------- Load from ?profile=BASE64 (for real sharing) ---------- */
function loadProfileFromUrl() {
  var params = new URLSearchParams(window.location.search);
  var encoded = params.get('profile');
  if (!encoded) return null;

  try {
    var json = atob(decodeURIComponent(encoded));
    var parsed = JSON.parse(json);
    if (parsed && parsed.student && Array.isArray(parsed.skills)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Invalid profile in URL:', err);
  }
  return null;
}

/* ---------- Header ---------- */
function renderPublicProfile(profile, analysis) {
  var s = profile.student;

  setText('public-avatar', (s.name || 'S').charAt(0).toUpperCase());
  setText('public-name', s.name || 'Student');
  setText('public-course', s.course || '');
  setText('public-goal', s.goal ? ('🎯 ' + s.goal) : '');

  setText('pub-skills', profile.skills.length);
  setText('pub-evidence', profile.evidence.length);

  var avg = 0;
  if (analysis.length > 0) {
    var sum = 0;
    for (var i = 0; i < analysis.length; i++) sum += analysis[i].confidence.score;
    avg = Math.round(sum / analysis.length);
  }
  setText('pub-confidence', avg + '%');
}

/* ---------- Skill cards ---------- */
function renderRecruiterSkills(analysis) {
  var container = document.getElementById('recruiter-skills');
  container.innerHTML = '';

  if (analysis.length === 0) {
    container.innerHTML = '<p class="muted">No skills to show.</p>';
    return;
  }

  // Sort by confidence descending
  var sorted = analysis.slice().sort(function (a, b) {
    return b.confidence.score - a.confidence.score;
  });

  for (var i = 0; i < sorted.length; i++) {
    container.appendChild(createRecruiterSkillCard(sorted[i]));
  }
}

function createRecruiterSkillCard(item) {
  var skill = item.skill;
  var conf = item.confidence;
  var prof = item.proficiency;

  var color = conf.score >= 70 ? 'var(--green)'
    : conf.score >= 40 ? 'var(--yellow)'
    : 'var(--red)';

  var verifiedCount = conf.breakdown.filter(function (b) { return b.verified; }).length;

  var card = document.createElement('div');
  card.className = 'card recruiter-skill-card';
  card.innerHTML =
    '<div class="skill-card-header">' +
      '<div>' +
        '<h3 class="skill-name">' + escapeHtml(skill.name) + '</h3>' +
        '<p class="skill-category">' + escapeHtml(skill.category || '') + '</p>' +
      '</div>' +
      '<span class="skill-badge" style="background:' + color + '22;color:' + color + '">' +
        conf.score + '%' +
      '</span>' +
    '</div>' +
    '<div class="skill-bars">' +
      '<div class="bar-row">' +
        '<span class="bar-label">Confidence</span>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + conf.score + '%;background:' + color + '"></div></div>' +
        '<span class="bar-value">' + conf.score + '%</span>' +
      '</div>' +
      '<div class="bar-row">' +
        '<span class="bar-label">Proficiency</span>' +
        '<div class="bar-track"><div class="bar-fill bar-prof" style="width:' + prof + '%"></div></div>' +
        '<span class="bar-value">' + prof + '%</span>' +
      '</div>' +
    '</div>' +
    '<div class="skill-footer">' +
      '<span class="skill-meta">' +
        conf.breakdown.length + ' evidence item' + (conf.breakdown.length === 1 ? '' : 's') +
        (verifiedCount > 0 ? ' · ' + verifiedCount + ' verified' : '') +
      '</span>' +
    '</div>';
  return card;
}

/* ---------- Evidence timeline ---------- */
function renderEvidenceTimeline(profile) {
  var container = document.getElementById('recruiter-evidence');
  container.innerHTML = '';

  if (profile.evidence.length === 0) {
    container.innerHTML = '<p class="muted">No evidence yet.</p>';
    return;
  }

  var sorted = profile.evidence.slice().sort(function (a, b) {
    return new Date(b.dateCompleted) - new Date(a.dateCompleted);
  });

  for (var i = 0; i < sorted.length; i++) {
    container.appendChild(createEvidenceTimelineRow(sorted[i], profile));
  }
}

function createEvidenceTimelineRow(ev, profile) {
  var skill = null;
  for (var i = 0; i < profile.skills.length; i++) {
    if (profile.skills[i].id === ev.skillId) { skill = profile.skills[i]; break; }
  }
  var skillName = skill ? skill.name : 'Unknown';

  var row = document.createElement('div');
  row.className = 'evidence-row type-' + (ev.type || 'project');

  var verifiedBadge = ev.verified
    ? '<span class="pill pill-verified">✓ Verified</span>'
    : '';

  var linkHtml = ev.link
    ? '<a href="' + escapeHtml(ev.link) + '" target="_blank" rel="noopener">View link →</a>'
    : '<span class="muted">No link</span>';

  row.innerHTML =
    '<div class="evidence-header">' +
      '<div>' +
        '<p class="evidence-title">' + escapeHtml(ev.title) + '</p>' +
        '<p class="evidence-meta">' + escapeHtml(skillName) +
          ' · ' + escapeHtml(ev.dateCompleted || '') + '</p>' +
      '</div>' +
      '<div class="evidence-badges">' +
        '<span class="pill pill-' + ev.type + '">' + escapeHtml(ev.type) + '</span>' +
        verifiedBadge +
      '</div>' +
    '</div>' +
    (ev.description ? '<p class="evidence-desc">' + escapeHtml(ev.description) + '</p>' : '') +
    '<div class="evidence-footer">' + linkHtml + '</div>';

  return row;
}

/* ---------- Skill Graph (SVG) ---------- */
function renderSkillGraph(profile, analysis) {
  var svg = document.getElementById('skill-graph');
  svg.innerHTML = '';

  if (profile.skills.length === 0) {
    svg.innerHTML = '<text x="300" y="200" text-anchor="middle" fill="#94a3b8">No skills to graph</text>';
    return;
  }

  var W = 600, H = 400;
  var CX = W / 2, CY = H / 2;
  var radius = 130;

  // Position skills in a circle
  var positions = {};
  var n = profile.skills.length;
  for (var i = 0; i < n; i++) {
    var angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    var x = CX + Math.cos(angle) * radius;
    var y = CY + Math.sin(angle) * radius;
    positions[profile.skills[i].id] = { x: x, y: y, skill: profile.skills[i] };
  }

  // Lookup: id → analysis item
  var analysisMap = {};
  for (var j = 0; j < analysis.length; j++) {
    analysisMap[analysis[j].skill.id] = analysis[j];
  }

  // Draw edges (relationships)
  for (var k = 0; k < profile.skills.length; k++) {
    var sk = profile.skills[k];
    var related = sk.relatedSkills || [];
    for (var r = 0; r < related.length; r++) {
      var other = positions[related[r]];
      if (!other) continue;

      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', positions[sk.id].x);
      line.setAttribute('y1', positions[sk.id].y);
      line.setAttribute('x2', other.x);
      line.setAttribute('y2', other.y);
      line.setAttribute('stroke', 'rgba(148, 163, 184, 0.25)');
      line.setAttribute('stroke-width', '1.5');
      svg.appendChild(line);
    }
  }

  // Draw nodes
  for (var id in positions) {
    if (!positions.hasOwnProperty(id)) continue;
    var pos = positions[id];
    var analysisItem = analysisMap[id];
    var conf = analysisItem ? analysisItem.confidence.score : 0;

    var color = conf >= 70 ? '#22c55e'
      : conf >= 40 ? '#f59e0b'
      : conf >= 1 ? '#ef4444'
      : '#475569';

    var nodeRadius = 22 + (conf / 100) * 14;   // 22 – 36

    // Circle
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', nodeRadius);
    circle.setAttribute('fill', color);
    circle.setAttribute('fill-opacity', '0.15');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);

    // Confidence label inside circle
    var confText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    confText.setAttribute('x', pos.x);
    confText.setAttribute('y', pos.y + 4);
    confText.setAttribute('text-anchor', 'middle');
    confText.setAttribute('fill', color);
    confText.setAttribute('font-size', '13');
    confText.setAttribute('font-weight', '700');
    confText.textContent = conf + '%';
    svg.appendChild(confText);

    // Skill name below
    var nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nameText.setAttribute('x', pos.x);
    nameText.setAttribute('y', pos.y + nodeRadius + 16);
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('fill', '#cbd5e1');
    nameText.setAttribute('font-size', '12');
    nameText.setAttribute('font-weight', '600');
    nameText.textContent = pos.skill.name;
    svg.appendChild(nameText);
  }
}

/* ---------- Share button ---------- */
function setupShareButton(profile) {
  var btn = document.getElementById('copy-share-btn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    // Encode profile into base64 URL-safe
    var json = JSON.stringify(profile);
    var encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(json))));

    var baseUrl = window.location.origin + window.location.pathname;
    var shareUrl = baseUrl + '?profile=' + encoded;

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(function () {
        btn.textContent = '✓ Link Copied!';
        setTimeout(function () { btn.textContent = 'Copy Share Link'; }, 2000);
      }).catch(function () {
        prompt('Copy this link:', shareUrl);
      });
    } else {
      prompt('Copy this link:', shareUrl);
    }
  });
}

/* ---------- Utilities ---------- */
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
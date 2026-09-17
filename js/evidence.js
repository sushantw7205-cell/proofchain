/* ============================================
   EVIDENCE.JS — Evidence CRUD via Firestore
   ============================================ */

var editingEvidenceId = null;

document.addEventListener('DOMContentLoaded', function () {
  Models.loadProfile().then(function (profile) {
    renderEvidenceList(profile);
    setupEvidenceModal();
  });
});

function renderEvidenceList(profile) {
  var container = document.getElementById('evidence-list');
  container.innerHTML = '';

  if (profile.evidence.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No evidence yet. Add your first project or task.</p></div>';
    return;
  }

  var sorted = profile.evidence.slice().sort(function (a, b) {
    return new Date(b.dateCompleted) - new Date(a.dateCompleted);
  });

  for (var i = 0; i < sorted.length; i++) {
    container.appendChild(createEvidenceRow(sorted[i], profile));
  }
}

function createEvidenceRow(ev, profile) {
  var skill = null;
  for (var i = 0; i < profile.skills.length; i++) {
    if (profile.skills[i].id === ev.skillId) { skill = profile.skills[i]; break; }
  }
  var skillName = skill ? skill.name : 'Unknown skill';

  var row = document.createElement('div');
  row.className = 'evidence-row type-' + (ev.type || 'project');

  var verifiedBadge = ev.verified ? '<span class="pill pill-verified">Verified</span>' : '';
  var linkHtml = ev.link
    ? '<a href="' + escapeHtml(ev.link) + '" target="_blank" rel="noopener">View link →</a>'
    : '<span class="muted">No link</span>';

  row.innerHTML =
    '<div class="evidence-header">' +
      '<div>' +
        '<p class="evidence-title">' + escapeHtml(ev.title) + '</p>' +
        '<p class="evidence-meta">' + escapeHtml(skillName) + ' · ' +
          escapeHtml(ev.dateCompleted || 'No date') + '</p>' +
      '</div>' +
      '<div class="evidence-badges">' +
        '<span class="pill pill-' + ev.type + '">' + escapeHtml(ev.type) + '</span>' +
        verifiedBadge +
      '</div>' +
    '</div>' +
    (ev.description ? '<p class="evidence-desc">' + escapeHtml(ev.description) + '</p>' : '') +
    '<div class="evidence-footer">' +
      linkHtml +
      '<div class="skill-row-actions">' +
        '<button class="btn btn-ghost btn-small" data-action="edit">Edit</button>' +
        '<button class="btn btn-danger btn-small" data-action="delete">Delete</button>' +
      '</div>' +
    '</div>';

  row.querySelector('[data-action="edit"]').addEventListener('click', function () {
    openEvidenceModal(ev, profile);
  });
  row.querySelector('[data-action="delete"]').addEventListener('click', function () {
    deleteEvidence(ev.id);
  });

  return row;
}

function populateSkillDropdown(profile, selectedId) {
  var select = document.getElementById('field-evidence-skill');
  select.innerHTML = '<option value="">— Select a skill —</option>';

  for (var i = 0; i < profile.skills.length; i++) {
    var opt = document.createElement('option');
    opt.value = profile.skills[i].id;
    opt.textContent = profile.skills[i].name;
    if (selectedId && selectedId === profile.skills[i].id) {
      opt.selected = true;
    }
    select.appendChild(opt);
  }
}

function setupEvidenceModal() {
  var backdrop = document.getElementById('evidence-modal-backdrop');
  var form = document.getElementById('evidence-form');

  document.getElementById('add-evidence-btn').addEventListener('click', function () {
    Models.loadProfile().then(function (profile) {
      openEvidenceModal(null, profile);
    });
  });

  document.getElementById('evidence-modal-cancel').addEventListener('click', function (e) {
    e.preventDefault();
    closeEvidenceModal();
  });

  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) closeEvidenceModal();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    handleEvidenceSubmit();
  });
}

function openEvidenceModal(ev, profile) {
  populateSkillDropdown(profile, ev ? ev.skillId : null);
  var backdrop = document.getElementById('evidence-modal-backdrop');
  var title = document.getElementById('evidence-modal-title');

  if (ev) {
    editingEvidenceId = ev.id;
    title.textContent = 'Edit Evidence';
    document.getElementById('field-evidence-title').value = ev.title || '';
    document.getElementById('field-evidence-type').value = ev.type || 'project';
    document.getElementById('field-evidence-desc').value = ev.description || '';
    document.getElementById('field-evidence-link').value = ev.link || '';
    document.getElementById('field-evidence-date').value = ev.dateCompleted || '';
    document.getElementById('field-evidence-verified').checked = !!ev.verified;
  } else {
    editingEvidenceId = null;
    title.textContent = 'Add Evidence';
    document.getElementById('evidence-form').reset();
    document.getElementById('field-evidence-date').value = new Date().toISOString().slice(0, 10);
  }

  backdrop.hidden = false;
}

function closeEvidenceModal() {
  document.getElementById('evidence-modal-backdrop').hidden = true;
  editingEvidenceId = null;
}

function handleEvidenceSubmit() {
  var title = document.getElementById('field-evidence-title').value.trim();
  var skillId = document.getElementById('field-evidence-skill').value;
  var type = document.getElementById('field-evidence-type').value;
  var description = document.getElementById('field-evidence-desc').value.trim();
  var link = document.getElementById('field-evidence-link').value.trim();
  var date = document.getElementById('field-evidence-date').value;
  var verified = document.getElementById('field-evidence-verified').checked;

  if (!title) { alert('Please enter a title.'); return; }
  if (!skillId) { alert('Please select a skill.'); return; }

  Models.loadProfile().then(function (profile) {
    if (editingEvidenceId) {
      for (var i = 0; i < profile.evidence.length; i++) {
        if (profile.evidence[i].id === editingEvidenceId) {
          profile.evidence[i].title = title;
          profile.evidence[i].skillId = skillId;
          profile.evidence[i].type = type;
          profile.evidence[i].description = description;
          profile.evidence[i].link = link;
          profile.evidence[i].dateCompleted = date;
          profile.evidence[i].verified = verified;
          break;
        }
      }
    } else {
      profile.evidence.push({
        id: Models.uid('ev'),
        skillId: skillId,
        type: type,
        title: title,
        description: description,
        link: link,
        dateCompleted: date,
        verified: verified
      });
    }

    return Models.saveProfile(profile).then(function () {
      closeEvidenceModal();
      renderEvidenceList(profile);
    });
  });
}

function deleteEvidence(evidenceId) {
  if (!confirm('Delete this evidence?')) return;

  Models.loadProfile().then(function (profile) {
    profile.evidence = profile.evidence.filter(function (e) { return e.id !== evidenceId; });
    return Models.saveProfile(profile).then(function () {
      renderEvidenceList(profile);
    });
  });
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
/* ============================================
   PROFILE.JS — Skill CRUD via Firestore
   ============================================ */

var editingSkillId = null;
var cachedProfile = null;

document.addEventListener('DOMContentLoaded', function () {
  Models.loadProfile().then(function (profile) {
    cachedProfile = profile;
    renderSkillList(profile);
    setupModal();
  });
});

function renderSkillList(profile) {
  var container = document.getElementById('skills-list');
  container.innerHTML = '';

  if (profile.skills.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No skills yet. Add your first skill.</p></div>';
    return;
  }

  for (var i = 0; i < profile.skills.length; i++) {
    container.appendChild(createSkillRow(profile.skills[i]));
  }
}

function createSkillRow(skill) {
  var row = document.createElement('div');
  row.className = 'skill-row';

  row.innerHTML =
    '<div class="skill-row-info">' +
      '<h3>' + escapeHtml(skill.name) + '</h3>' +
      '<p>' + escapeHtml(skill.category || 'Uncategorised') +
        ' · Self level: ' + escapeHtml(skill.selfLevel || 'Beginner') + '</p>' +
    '</div>' +
    '<div class="skill-row-actions">' +
      '<button class="btn btn-ghost btn-small" data-action="edit">Edit</button>' +
      '<button class="btn btn-danger btn-small" data-action="delete">Delete</button>' +
    '</div>';

  row.querySelector('[data-action="edit"]').addEventListener('click', function () {
    openModal(skill);
  });
  row.querySelector('[data-action="delete"]').addEventListener('click', function () {
    deleteSkill(skill.id);
  });

  return row;
}

function setupModal() {
  var backdrop = document.getElementById('modal-backdrop');
  var form = document.getElementById('skill-form');
  var cancelBtn = document.getElementById('modal-cancel');

  document.getElementById('add-skill-btn').addEventListener('click', function () {
    openModal(null);
  });

  cancelBtn.addEventListener('click', function (e) {
    e.preventDefault();
    closeModal();
  });

  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) closeModal();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    handleFormSubmit();
  });
}

function openModal(skill) {
  var backdrop = document.getElementById('modal-backdrop');
  var title = document.getElementById('modal-title');

  if (skill) {
    editingSkillId = skill.id;
    title.textContent = 'Edit Skill';
    document.getElementById('field-name').value = skill.name || '';
    document.getElementById('field-category').value = skill.category || '';
    document.getElementById('field-level').value = skill.selfLevel || 'Beginner';
  } else {
    editingSkillId = null;
    title.textContent = 'Add New Skill';
    document.getElementById('skill-form').reset();
  }

  backdrop.hidden = false;
}

function closeModal() {
  document.getElementById('modal-backdrop').hidden = true;
  editingSkillId = null;
}

function handleFormSubmit() {
  var name = document.getElementById('field-name').value.trim();
  var category = document.getElementById('field-category').value.trim();
  var level = document.getElementById('field-level').value;

  if (!name) {
    alert('Please enter a skill name.');
    return;
  }

  Models.loadProfile().then(function (profile) {
    if (editingSkillId) {
      for (var i = 0; i < profile.skills.length; i++) {
        if (profile.skills[i].id === editingSkillId) {
          profile.skills[i].name = name;
          profile.skills[i].category = category;
          profile.skills[i].selfLevel = level;
          break;
        }
      }
    } else {
      profile.skills.push({
        id: Models.uid('sk'),
        name: name,
        category: category,
        selfLevel: level,
        relatedSkills: []
      });
    }

    return Models.saveProfile(profile).then(function () {
      cachedProfile = profile;
      closeModal();
      renderSkillList(profile);
    });
  });
}

function deleteSkill(skillId) {
  if (!confirm('Delete this skill? Evidence linked to it will also be removed.')) return;

  Models.loadProfile().then(function (profile) {
    profile.skills = profile.skills.filter(function (s) { return s.id !== skillId; });
    profile.evidence = profile.evidence.filter(function (e) { return e.skillId !== skillId; });
    profile.assessments = profile.assessments.filter(function (a) { return a.skillId !== skillId; });

    return Models.saveProfile(profile).then(function () {
      cachedProfile = profile;
      renderSkillList(profile);
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
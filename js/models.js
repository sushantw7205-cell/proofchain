/* ============================================
   MODELS.JS — Data shapes + default seed data
   ============================================ */

const Models = (() => {

  /* ---------- Default empty profile ---------- */
  const DEFAULT_PROFILE = {
    student: {
      id: 'stu_local',
      name: 'New Student',
      course: 'BCS',
      goal: '',
      createdAt: new Date().toISOString()
    },
    skills: [],
    evidence: [],
    assessments: []
  };

  /* ---------- Seed data (demo) ---------- */
  const SEED_PROFILE = {
    student: {
      id: 'stu_arjun',
      name: 'Arjun Patil',
      course: 'BCS Student',
      goal: 'Frontend Developer',
      createdAt: '2026-01-15T00:00:00.000Z'
    },
    skills: [
      {
        id: 'sk_js',
        name: 'JavaScript',
        category: 'Frontend',
        selfLevel: 'Advanced',
        relatedSkills: ['sk_html', 'sk_css']
      },
      {
        id: 'sk_html',
        name: 'HTML',
        category: 'Frontend',
        selfLevel: 'Advanced',
        relatedSkills: ['sk_css', 'sk_js']
      },
      {
        id: 'sk_css',
        name: 'CSS',
        category: 'Frontend',
        selfLevel: 'Advanced',
        relatedSkills: ['sk_html', 'sk_js']
      },
      {
        id: 'sk_sql',
        name: 'SQL',
        category: 'Backend',
        selfLevel: 'Intermediate',
        relatedSkills: []
      }
    ],
    evidence: [
      {
        id: 'ev_001',
        skillId: 'sk_js',
        type: 'project',
        title: 'REST API project',
        description: 'Built a small client to consume a public API and render results.',
        link: 'https://github.com/arjun/rest-api-client',
        dateCompleted: '2026-02-10',
        verified: true
      },
      {
        id: 'ev_002',
        skillId: 'sk_js',
        type: 'project',
        title: 'Responsive portfolio',
        description: 'Personal portfolio site with responsive layout.',
        link: 'https://github.com/arjun/portfolio',
        dateCompleted: '2025-11-20',
        verified: false
      },
      {
        id: 'ev_003',
        skillId: 'sk_js',
        type: 'task',
        title: 'JavaScript task: 86%',
        description: 'Solved a timed JS problem set.',
        link: '',
        dateCompleted: '2026-01-30',
        verified: false
      },
      {
        id: 'ev_004',
        skillId: 'sk_sql',
        type: 'project',
        title: 'SQL mini-project',
        description: 'Designed a schema and wrote join queries.',
        link: '',
        dateCompleted: '2025-09-12',
        verified: false
      }
    ],
    assessments: [
      {
        id: 'as_001',
        skillId: 'sk_js',
        score: 86,
        dateTaken: '2026-02-15',
        questionsAttempted: 10
      }
    ]
  };

  /* ---------- Functions ---------- */

  function loadProfile() {
    const existing = Storage.load('profile');
    if (existing) return existing;
    Storage.save('profile', SEED_PROFILE);
    return SEED_PROFILE;
  }

  function saveProfile(profile) {
    return Storage.save('profile', profile);
  }

  function resetToSeed() {
    Storage.save('profile', SEED_PROFILE);
    return SEED_PROFILE;
  }

  function uid(prefix) {
    prefix = prefix || 'id';
    return prefix + '' + Date.now() + '' + Math.floor(Math.random() * 1000);
  }

  /* ---------- Public API ---------- */
  return {
    DEFAULT_PROFILE: DEFAULT_PROFILE,
    SEED_PROFILE: SEED_PROFILE,
    loadProfile: loadProfile,
    saveProfile: saveProfile,
    resetToSeed: resetToSeed,
    uid: uid
  };

})();
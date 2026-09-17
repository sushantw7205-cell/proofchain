/* ============================================
   SEED.JS — Demo data for new users
   ============================================ */

var SeedData = (function () {

  function getDemoProfile(userId, name, email) {
    var today = new Date().toISOString().slice(0, 10);
    var twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    var sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
      student: {
        id: userId || 'stu_local',
        name: name || 'New Student',
        email: email || '',
        course: 'BCS Student',
        goal: 'Frontend Developer',
        createdAt: new Date().toISOString()
      },
      skills: [
        { id: 'sk_js',   name: 'JavaScript', category: 'Frontend', selfLevel: 'Advanced',     relatedSkills: ['sk_html', 'sk_css'] },
        { id: 'sk_html', name: 'HTML',       category: 'Frontend', selfLevel: 'Advanced',     relatedSkills: ['sk_css', 'sk_js'] },
        { id: 'sk_css',  name: 'CSS',        category: 'Frontend', selfLevel: 'Advanced',     relatedSkills: ['sk_html', 'sk_js'] },
        { id: 'sk_sql',  name: 'SQL',        category: 'Backend',  selfLevel: 'Intermediate', relatedSkills: [] }
      ],
      evidence: [
        {
          id: 'ev_001',
          skillId: 'sk_js',
          type: 'project',
          title: 'REST API project',
          description: 'Built a small client to consume a public API and render results.',
          link: 'https://github.com/arjun/rest-api-client',
          dateCompleted: twoMonthsAgo,
          verified: true
        },
        {
          id: 'ev_002',
          skillId: 'sk_js',
          type: 'project',
          title: 'Responsive portfolio',
          description: 'Personal portfolio site with responsive layout.',
          link: 'https://github.com/arjun/portfolio',
          dateCompleted: sixMonthsAgo,
          verified: false
        },
        {
          id: 'ev_003',
          skillId: 'sk_js',
          type: 'task',
          title: 'JavaScript task: 86%',
          description: 'Solved a timed JS problem set.',
          link: '',
          dateCompleted: twoMonthsAgo,
          verified: false
        },
        {
          id: 'ev_004',
          skillId: 'sk_sql',
          type: 'project',
          title: 'SQL mini-project',
          description: 'Designed a schema and wrote join queries.',
          link: '',
          dateCompleted: sixMonthsAgo,
          verified: false
        }
      ],
      assessments: [
        {
          id: 'as_001',
          skillId: 'sk_js',
          score: 86,
          dateTaken: twoMonthsAgo,
          questionsAttempted: 10
        }
      ]
    };
  }

  return {
    getDemoProfile: getDemoProfile
  };
})();
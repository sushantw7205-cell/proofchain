/* SCORING.JS — The confidence engine */

var Scoring = (function () {

  var WEIGHTS = {
    project: 3.0,
    assessment: 2.5,
    task: 1.5,
    certificate: 0.5
  };

  var RECENCY = {
    freshDays: 90,
    recentDays: 365,
    freshMult: 1.0,
    recentMult: 0.8,
    oldMult: 0.5
  };

  var VERIFICATION_BONUS = 1.2;
  var MAX_POINTS = 8;

  function getRecencyMultiplier(dateStr) {
    if (!dateStr) return RECENCY.oldMult;
    var days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= RECENCY.freshDays) return RECENCY.freshMult;
    if (days <= RECENCY.recentDays) return RECENCY.recentMult;
    return RECENCY.oldMult;
  }

  function getRecencyLabel(dateStr) {
    if (!dateStr) return { text: 'No date', cls: 'rec-old' };
    var days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= RECENCY.freshDays) return { text: 'Fresh', cls: 'rec-fresh' };
    if (days <= RECENCY.recentDays) return { text: 'Recent', cls: 'rec-recent' };
    return { text: 'Old', cls: 'rec-old' };
  }

  function estimateProficiency(skill, assessments) {
    var skillAssessments = assessments.filter(function (a) { return a.skillId === skill.id; });

    if (skillAssessments.length > 0) {
      var sum = 0;
      for (var i = 0; i < skillAssessments.length; i++) {
        sum += skillAssessments[i].score || 0;
      }
      return Math.round(sum / skillAssessments.length);
    }

    var selfMap = { Beginner: 40, Intermediate: 65, Advanced: 85 };
    return selfMap[skill.selfLevel] || 50;
  }

  function calculateConfidence(skill, evidence, assessments) {
    var skillEvidence = evidence.filter(function (e) { return e.skillId === skill.id; });
    var skillAssessments = assessments.filter(function (a) { return a.skillId === skill.id; });

    if (skillEvidence.length === 0 && skillAssessments.length === 0) {
      return { score: 0, totalPoints: 0, breakdown: [], hasEvidence: false };
    }

    var totalPoints = 0;
    var breakdown = [];

    for (var i = 0; i < skillEvidence.length; i++) {
      var ev = skillEvidence[i];
      var base = WEIGHTS[ev.type] || 1;
      var recMult = getRecencyMultiplier(ev.dateCompleted);
      var verMult = ev.verified ? VERIFICATION_BONUS : 1;
      var points = base * recMult * verMult;
      totalPoints += points;
      breakdown.push({
        id: ev.id, title: ev.title, type: ev.type,
        base: base, recencyMultiplier: recMult,
        recencyLabel: getRecencyLabel(ev.dateCompleted),
        verified: !!ev.verified, points: points
      });
    }

    for (var j = 0; j < skillAssessments.length; j++) {
      var as = skillAssessments[j];
      var scoreFactor = (as.score || 0) / 100;
      var base2 = WEIGHTS.assessment;
      var recMult2 = getRecencyMultiplier(as.dateTaken);
      var points2 = base2 * scoreFactor * recMult2;
      totalPoints += points2;
      breakdown.push({
        id: as.id, title: 'Assessment — ' + as.score + '%', type: 'assessment',
        base: base2, recencyMultiplier: recMult2,
        recencyLabel: getRecencyLabel(as.dateTaken),
        verified: false, points: points2
      });
    }

    breakdown.sort(function (a, b) { return b.points - a.points; });

    var score = Math.min(100, Math.round((totalPoints / MAX_POINTS) * 100));

    return { score: score, totalPoints: totalPoints, breakdown: breakdown, hasEvidence: true };
  }

  function recommendNextTask(skill, confidence) {
    if (!confidence.hasEvidence) {
      return { title: 'Add your first project using ' + skill.name, reason: 'No evidence yet — start with a small project.' };
    }

    var hasRecentProject = confidence.breakdown.some(function (b) {
      return b.type === 'project' && b.recencyMultiplier === RECENCY.freshMult;
    });
    var hasAssessment = confidence.breakdown.some(function (b) { return b.type === 'assessment'; });

    if (!hasRecentProject) {
      return { title: 'Build a new project using ' + skill.name, reason: 'Recent project evidence is missing — this will boost confidence.' };
    }
    if (!hasAssessment) {
      return { title: 'Take the ' + skill.name + ' practical assessment', reason: 'A scored assessment adds measurable proof.' };
    }
    if (confidence.score < 70) {
      return { title: 'Add one more medium-sized project', reason: 'More recent evidence will raise your confidence score.' };
    }
    return { title: 'Great work — consider peer verification', reason: 'Ask a mentor to verify your strongest project.' };
  }

  function analyzeSkill(skill, evidence, assessments) {
    var confidence = calculateConfidence(skill, evidence, assessments);
    var proficiency = estimateProficiency(skill, assessments);
    var recommendation = recommendNextTask(skill, confidence);
    return { skill: skill, confidence: confidence, proficiency: proficiency, recommendation: recommendation };
  }

  function analyzeProfile(profile) {
    var results = [];
    for (var i = 0; i < profile.skills.length; i++) {
      results.push(analyzeSkill(profile.skills[i], profile.evidence, profile.assessments));
    }
    return results;
  }

  return {
    WEIGHTS: WEIGHTS,
    calculateConfidence: calculateConfidence,
    estimateProficiency: estimateProficiency,
    recommendNextTask: recommendNextTask,
    analyzeSkill: analyzeSkill,
    analyzeProfile: analyzeProfile,
    getRecencyLabel: getRecencyLabel
  };

})();
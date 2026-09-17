/* ============================================
   SCORING.JS — The Confidence Engine ⭐
   ============================================
   This is ProofChain's core algorithm.
   It converts raw evidence into a confidence score (0–100%).

   Rules:
   - Projects are strong evidence (weight 3.0)
   - Assessments are medium-strong (weight 2.5, scaled by score)
   - Tasks are medium (weight 1.5)
   - Certificates are weak (weight 0.5)
   - Recent evidence counts more than old evidence
   - Verified evidence gets a 20% bonus
   ============================================ */

const Scoring = (() => {

  /* ---------- Constants ---------- */

  const WEIGHTS = {
    project:     3.0,
    assessment:  2.5,
    task:        1.5,
    certificate: 0.5
  };

  const RECENCY = {
    fresh:  { days: 90,        multiplier: 1.0 },  // < 3 months
    recent: { days: 365,       multiplier: 0.8 },  // < 1 year
    old:    { days: Infinity,  multiplier: 0.5 }   // older
  };

  const VERIFICATION_BONUS = 1.2;
  const MAX_POINTS = 8.0; // tuned so a strong profile hits ~90-100

  /* ---------- Helpers ---------- */

  function getRecencyMultiplier(dateStr) {
    if (!dateStr) return RECENCY.old.multiplier;
    const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= RECENCY.fresh.days)  return RECENCY.fresh.multiplier;
    if (days <= RECENCY.recent.days) return RECENCY.recent.multiplier;
    return RECENCY.old.multiplier;
  }

  function getRecencyLabel(dateStr) {
    const mult = getRecencyMultiplier(dateStr);
    if (mult === 1.0) return 'Fresh';
    if (mult === 0.8) return 'Recent';
    return 'Old';
  }

  /* ---------- Core: confidence for one skill ---------- */

  /**
   * Calculate confidence breakdown for a skill.
   * Returns { score, totalPoints, breakdown: [...] }
   */
  function calculateConfidence(skillId, evidence, assessments) {
    const skillEvidence = evidence.filter(e => e.skillId === skillId);
    const skillAssessments = assessments.filter(a => a.skillId === skillId);

    if (skillEvidence.length === 0 && skillAssessments.length === 0) {
      return { score: 0, totalPoints: 0, breakdown: [] };
    }

    let totalPoints = 0;
    const breakdown = [];

    // 1. Projects / tasks / certificates
    skillEvidence.forEach(ev => {
      const base = WEIGHTS[ev.type] || 1;
      const recencyMult = getRecencyMultiplier(ev.dateCompleted);
      const verifiedMult = ev.verified ? VERIFICATION_BONUS : 1;
      const points = base * recencyMult * verifiedMult;
      totalPoints += points;

      breakdown.push({
        id: ev.id,
        title: ev.title,
        type: ev.type,
        recency: getRecencyLabel(ev.dateCompleted),
        verified: ev.verified,
        base: base,
        recencyMult: recencyMult,
        verifiedMult: verifiedMult,
        points: Number(points.toFixed(2))
      });
    });

    // 2. Assessments
    skillAssessments.forEach(as => {
      const scoreFactor = as.score / 100;
      const base = WEIGHTS.assessment;
      const recencyMult = getRecencyMultiplier(as.dateTaken);
      const points = base * scoreFactor * recencyMult;
      totalPoints += points;

      breakdown.push({
        id: as.id,
        title: 'Assessment (' + as.score + '%)',
        type: 'assessment',
        recency: getRecencyLabel(as.dateTaken),
        verified: false,
        base: base,
        scoreFactor: scoreFactor,
        recencyMult: recencyMult,
        points: Number(points.toFixed(2))
      });
    });

    const score = Math.min(100, Math.round((totalPoints / MAX_POINTS) * 100));
    return {
      score: score,
      totalPoints: Number(totalPoints.toFixed(2)),
      maxPoints: MAX_POINTS,
      breakdown: breakdown
    };
  }

  /* ---------- Proficiency estimate ---------- */

  function estimateProficiency(skillId, skill, assessments) {
    const skillAssessments = assessments.filter(a => a.skillId === skillId);
    if (skillAssessments.length === 0) {
      const selfMap = { Beginner: 40, Intermediate: 65, Advanced: 85 };
      return selfMap[skill.selfLevel] || 50;
    }
    const avg = skillAssessments.reduce((s, a) => s + a.score, 0) / skillAssessments.length;
    return Math.round(avg);
  }

  /* ---------- Recommendation engine ---------- */

  function recommendNextTask(skillId, confidence, evidence) {
    const skillEvidence = evidence.filter(e => e.skillId === skillId);

    if (skillEvidence.length === 0) {
      return {
        title: 'Add your first project using this skill',
        reason: 'No evidence yet — start with a small project.'
      };
    }

    const hasAssessment = skillEvidence.some(e => e.type === 'assessment');
    const hasRecentProject = skillEvidence.some(e =>
      e.type === 'project' && getRecencyMultiplier(e.dateCompleted) === 1.0
    );

    if (!hasRecentProject) {
      return {
        title: 'Build a recent project using this skill',
        reason: 'Recent project evidence is missing — this will boost confidence.'
      };
    }
    if (!hasAssessment) {
      return {
        title: 'Take the practical assessment',
        reason: 'A scored assessment adds measurable proof.'
      };
    }
    if (confidence < 70) {
      return {
        title: 'Add one more medium-sized project',
        reason: 'More evidence will raise your confidence score.'
      };
    }
    return {
      title: 'Ask a mentor to verify your strongest project',
      reason: 'Verification gives a 20% confidence bonus.'
    };
  }

  /* ---------- Public API ---------- */
  return {
    calculateConfidence: calculateConfidence,
    estimateProficiency: estimateProficiency,
    recommendNextTask: recommendNextTask,
    getRecencyLabel: getRecencyLabel,
    WEIGHTS: WEIGHTS,
    MAX_POINTS: MAX_POINTS
  };

})();
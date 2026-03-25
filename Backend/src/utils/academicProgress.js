const { YEARS, SEMESTERS } = require("../models/User");

function addMonths(date, months) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function getProgressIndex(year, semester) {
  const yearIndex = YEARS.indexOf(year);
  const semesterIndex = SEMESTERS.indexOf(semester);

  if (yearIndex < 0 || semesterIndex < 0) {
    return 0;
  }

  return yearIndex * 2 + semesterIndex;
}

function getProgressValue(index) {
  const boundedIndex = Math.max(0, Math.min(index, YEARS.length * SEMESTERS.length - 1));
  const year = YEARS[Math.floor(boundedIndex / 2)];
  const semester = SEMESTERS[boundedIndex % 2];

  return { year, semester };
}

async function syncAcademicProgress(user) {
  let shouldSave = false;

  if (!user.academicCycleStartedAt) {
    user.academicCycleStartedAt = user.createdAt || new Date();
    shouldSave = true;
  }

  if (!user.academicStartYear) {
    user.academicStartYear = user.year;
    shouldSave = true;
  }

  if (!user.academicStartSemester) {
    user.academicStartSemester = user.semester;
    shouldSave = true;
  }

  const baseIndex = getProgressIndex(user.academicStartYear, user.academicStartSemester);
  const now = new Date();
  let advancedSemesters = 0;
  let checkpoint = new Date(user.academicCycleStartedAt);

  while (addMonths(checkpoint, 6) <= now) {
    checkpoint = addMonths(checkpoint, 6);
    advancedSemesters += 1;
  }

  const { year, semester } = getProgressValue(baseIndex + advancedSemesters);

  if (user.year !== year) {
    user.year = year;
    shouldSave = true;
  }

  if (user.semester !== semester) {
    user.semester = semester;
    shouldSave = true;
  }

  if (shouldSave) {
    await user.save();
  }

  return user;
}

module.exports = {
  syncAcademicProgress,
};

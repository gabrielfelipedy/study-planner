export type DashboardStats = {
  totalTopics: number;
  completedTopics: number;
  completionPercentage: number;
  revisionAdherencePercentage: number;
};

export type CompletionDataPoint = {
  date: string;             // YYYY-MM-DD
  completed: number;        // daily completion count
  cumulativePercentage: number;  // cumulative % of all topics completed by this date
};

export type SubjectDistribution = {
  subjectName: string;
  subjectColor: string | null;
  completed: number;
  total: number;
  percentage: number;       // completed / total for this subject
};

export type WeeklyStudyHours = {
  weekStart: string;        // ISO date of Monday (YYYY-MM-DD)
  plannedHours: number;     // sum of estimatedMinutes / 60 for study-type slots that week
  actualHours: number;      // sum of estimatedMinutes / 60 for completed study-type slots that week
};

export type RevisionAdherence = {
  weekStart: string;        // ISO date of Monday (YYYY-MM-DD)
  scheduled: number;        // count of revision-type slots that week
  completed: number;        // count of completed revision-type slots that week
};

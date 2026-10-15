export type TaskStatus = 
  | 'QUEUED'
  | 'PLANNING'
  | 'AWAITING_PLAN_APPROVAL'
  | 'EXECUTING'
  | 'AWAITING_REVIEW'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface JulesTaskPlanStep {
  index: number;
  description: string;
  filesTargeted: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';
}

export interface JulesTaskPlan {
  summary: string;
  steps: JulesTaskPlanStep[];
  approved: boolean;
  approvalNotes?: string;
}

export interface JulesTask {
  id: string;
  title: string;
  prompt: string;
  repo: string;
  branch: string;
  baseBranch?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  plan?: JulesTaskPlan;
  prUrl?: string;
  diffSummary?: string;
  logs: string[];
}

export interface CreateTaskParams {
  repo: string;
  prompt: string;
  title?: string;
  baseBranch?: string;
  targetBranch?: string;
  autoApprovePlan?: boolean;
}

export interface ApprovePlanParams {
  taskId: string;
  approved: boolean;
  feedback?: string;
}

export interface SendFeedbackParams {
  taskId: string;
  message: string;
}

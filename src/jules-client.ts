import {
  JulesTask,
  CreateTaskParams,
  ApprovePlanParams,
  SendFeedbackParams,
  TaskStatus,
} from './types.js';

export class JulesClient {
  private apiKey: string;
  private baseUrl: string;
  private mockMode: boolean;
  private mockTasks: Map<string, JulesTask> = new Map();

  constructor() {
    this.apiKey = process.env.JULES_API_KEY || '';
    this.baseUrl = process.env.JULES_API_BASE_URL || 'https://jules.googleapis.com/v1alpha';
    this.mockMode = process.env.JULES_MOCK_MODE === 'true' || !this.apiKey;

    if (this.mockMode) {
      this.initMockData();
    }
  }

  private initMockData() {
    const demoTask: JulesTask = {
      id: 'jules-task-demo-8492',
      title: 'Refactor Authentication Flow & Add OAuth2 Token Refresh',
      prompt: 'Implement automatic OAuth2 refresh token rotation and update middleware',
      repo: 'Helfstein-one/my-saas-api',
      branch: 'jules/oauth2-refresh-rotation',
      baseBranch: 'main',
      status: 'AWAITING_PLAN_APPROVAL',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      updatedAt: new Date().toISOString(),
      plan: {
        summary: 'Add token refresh rotation and invalidate expired refresh tokens on reuse.',
        approved: false,
        steps: [
          {
            index: 1,
            description: 'Update Prisma schema to add RefreshToken family and revocation flags',
            filesTargeted: ['prisma/schema.prisma'],
            status: 'PENDING',
          },
          {
            index: 2,
            description: 'Implement token rotation logic inside AuthController and AuthService',
            filesTargeted: ['src/services/auth.service.ts', 'src/controllers/auth.controller.ts'],
            status: 'PENDING',
          },
          {
            index: 3,
            description: 'Write integration test verifying token reuse detection and revocation',
            filesTargeted: ['tests/auth.test.ts'],
            status: 'PENDING',
          },
        ],
      },
      prUrl: undefined,
      diffSummary: 'Planning complete. Awaiting user plan approval before editing files.',
      logs: [
        '[12:00:01] Cloned repository Helfstein-one/my-saas-api',
        '[12:00:04] Checked out branch jules/oauth2-refresh-rotation',
        '[12:00:10] Analyzed AST and dependencies in prisma/schema.prisma and src/services/auth.service.ts',
        '[12:00:14] Generated execution plan with 3 steps.',
      ],
    };
    this.mockTasks.set(demoTask.id, demoTask);
  }

  public isUsingMock(): boolean {
    return this.mockMode;
  }

  public async createTask(params: CreateTaskParams): Promise<JulesTask> {
    if (this.mockMode) {
      const taskId = `jules-${Date.now().toString(36)}`;
      const title = params.title || params.prompt.slice(0, 60);
      const branch = params.targetBranch || `jules/${taskId}`;

      const newTask: JulesTask = {
        id: taskId,
        title,
        prompt: params.prompt,
        repo: params.repo,
        branch,
        baseBranch: params.baseBranch || 'main',
        status: params.autoApprovePlan ? 'EXECUTING' : 'PLANNING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plan: {
          summary: `Automatic plan formulated for: ${title}`,
          approved: Boolean(params.autoApprovePlan),
          steps: [
            {
              index: 1,
              description: 'Inspect codebase and locate affected components',
              filesTargeted: ['README.md'],
              status: params.autoApprovePlan ? 'IN_PROGRESS' : 'PENDING',
            },
            {
              index: 2,
              description: 'Execute targeted code changes',
              filesTargeted: ['src/'],
              status: 'PENDING',
            },
            {
              index: 3,
              description: 'Run project tests and lint checks',
              filesTargeted: ['tests/'],
              status: 'PENDING',
            },
          ],
        },
        logs: [
          `[${new Date().toLocaleTimeString()}] Task initiated for ${params.repo}`,
          `[${new Date().toLocaleTimeString()}] Branch created: ${branch}`,
          `[${new Date().toLocaleTimeString()}] Formulating multi-step execution plan...`,
        ],
      };

      this.mockTasks.set(taskId, newTask);
      return newTask;
    }

    const response = await fetch(`${this.baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create Jules task (${response.status}): ${errorText}`);
    }

    return (await response.json()) as JulesTask;
  }

  public async listTasks(repo?: string, limit: number = 10): Promise<JulesTask[]> {
    if (this.mockMode) {
      let tasks = Array.from(this.mockTasks.values());
      if (repo) {
        tasks = tasks.filter((t) => t.repo.toLowerCase() === repo.toLowerCase());
      }
      return tasks.slice(0, limit);
    }

    const url = new URL(`${this.baseUrl}/tasks`);
    if (repo) url.searchParams.set('repo', repo);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'x-goog-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list Jules tasks (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as any;
    return (data.tasks || data) as JulesTask[];
  }

  public async getTask(taskId: string): Promise<JulesTask> {
    if (this.mockMode) {
      const task = this.mockTasks.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found in Jules registry.`);
      }
      return task;
    }

    const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'x-goog-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch Jules task ${taskId} (${response.status}): ${errorText}`);
    }

    return (await response.json()) as JulesTask;
  }

  public async approvePlan(params: ApprovePlanParams): Promise<JulesTask> {
    if (this.mockMode) {
      const task = this.mockTasks.get(params.taskId);
      if (!task) {
        throw new Error(`Task ${params.taskId} not found.`);
      }

      if (params.approved) {
        task.status = 'EXECUTING';
        if (task.plan) {
          task.plan.approved = true;
          task.plan.approvalNotes = params.feedback || 'Plan approved by user/Antigravity.';
          if (task.plan.steps[0]) {
            task.plan.steps[0].status = 'IN_PROGRESS';
          }
        }
        task.logs.push(`[${new Date().toLocaleTimeString()}] Plan approved. Jules starting execution.`);
      } else {
        task.status = 'PLANNING';
        task.logs.push(
          `[${new Date().toLocaleTimeString()}] Plan rejected with feedback: "${params.feedback || 'Please refine steps'}"`
        );
      }
      task.updatedAt = new Date().toISOString();
      return task;
    }

    const response = await fetch(`${this.baseUrl}/tasks/${params.taskId}:approvePlan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to approve Jules plan (${response.status}): ${errorText}`);
    }

    return (await response.json()) as JulesTask;
  }

  public async sendFeedback(params: SendFeedbackParams): Promise<JulesTask> {
    if (this.mockMode) {
      const task = this.mockTasks.get(params.taskId);
      if (!task) {
        throw new Error(`Task ${params.taskId} not found.`);
      }
      task.logs.push(`[${new Date().toLocaleTimeString()}] Antigravity Steering: "${params.message}"`);
      task.updatedAt = new Date().toISOString();
      return task;
    }

    const response = await fetch(`${this.baseUrl}/tasks/${params.taskId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send feedback to Jules (${response.status}): ${errorText}`);
    }

    return (await response.json()) as JulesTask;
  }

  public async getDiff(taskId: string): Promise<{ diff: string; prUrl?: string }> {
    if (this.mockMode) {
      const task = this.mockTasks.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found.`);
      }
      return {
        diff: `diff --git a/src/auth.ts b/src/auth.ts
index 83bc12..9a43fe 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -14,6 +14,14 @@ export async function refreshToken(oldToken: string) {
+  const isReused = await checkTokenFamilyReuse(oldToken);
+  if (isReused) {
+    await revokeAllTokensInFamily(oldToken);
+    throw new SecurityException('Compromised refresh token reuse detected');
+  }
+  return generateNewTokenPair(oldToken);
 }`,
        prUrl: task.prUrl || `https://github.com/${task.repo}/pull/42`,
      };
    }

    const response = await fetch(`${this.baseUrl}/tasks/${taskId}/diff`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'x-goog-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get diff for task ${taskId} (${response.status}): ${errorText}`);
    }

    return (await response.json()) as { diff: string; prUrl?: string };
  }

  public async cancelTask(taskId: string, reason?: string): Promise<JulesTask> {
    if (this.mockMode) {
      const task = this.mockTasks.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found.`);
      }
      task.status = 'CANCELLED';
      task.logs.push(`[${new Date().toLocaleTimeString()}] Task cancelled by user. Reason: ${reason || 'N/A'}`);
      task.updatedAt = new Date().toISOString();
      return task;
    }

    const response = await fetch(`${this.baseUrl}/tasks/${taskId}:cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to cancel Jules task ${taskId} (${response.status}): ${errorText}`);
    }

    return (await response.json()) as JulesTask;
  }
}

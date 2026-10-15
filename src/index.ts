#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { JulesClient } from './jules-client.js';

// Load environment variables (.env file if present)
dotenv.config();

const julesClient = new JulesClient();

const server = new Server(
  {
    name: 'jules-ai-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define MCP Tools
const TOOLS: Tool[] = [
  {
    name: 'jules_create_task',
    description:
      'Creates a new autonomous coding task for Google Jules AI. Jules will checkout the repo, inspect files, formulate an execution plan, and prepare a PR.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'GitHub repository in "owner/repo" format (e.g., "Helfstein-one/my-app")',
        },
        prompt: {
          type: 'string',
          description:
            'Detailed instructions for Jules: the problem statement, requirements, architectural constraints, and test criteria.',
        },
        title: {
          type: 'string',
          description: 'Short descriptive title for the task (optional)',
        },
        baseBranch: {
          type: 'string',
          description: 'Base branch to branch off from (defaults to "main")',
        },
        targetBranch: {
          type: 'string',
          description: 'Branch name for Jules to push changes to (optional, auto-generated if omitted)',
        },
        autoApprovePlan: {
          type: 'boolean',
          description:
            'Whether Jules should start coding immediately upon finishing planning, or wait for approval (default: false)',
        },
      },
      required: ['repo', 'prompt'],
    },
  },
  {
    name: 'jules_list_tasks',
    description: 'Lists recent and active coding tasks handled by Google Jules AI.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Filter tasks by repository ("owner/repo")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tasks to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'jules_get_task_status',
    description:
      'Fetches real-time status, logs, current step progress, and proposed plan for a specific Jules task.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The unique Jules Task ID (e.g. "jules-task-demo-8492")',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'jules_approve_plan',
    description:
      'Approves or rejects the execution plan formulated by Jules. Jules will not modify code until its plan is approved.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The unique Jules Task ID',
        },
        approved: {
          type: 'boolean',
          description: 'True to approve the plan and begin code execution; False to reject and request changes.',
        },
        feedback: {
          type: 'string',
          description:
            'Feedback notes or requested modifications if rejecting, or steering directives if approving.',
        },
      },
      required: ['taskId', 'approved'],
    },
  },
  {
    name: 'jules_send_feedback',
    description:
      'Sends a steering message, guidance, or mid-session instruction to an ongoing Jules coding session.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The unique Jules Task ID',
        },
        message: {
          type: 'string',
          description: 'The message or additional context to send to Jules.',
        },
      },
      required: ['taskId', 'message'],
    },
  },
  {
    name: 'jules_get_diff',
    description:
      'Fetches the git diff and PR link produced by Jules once execution or milestone steps have started.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The unique Jules Task ID',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'jules_cancel_task',
    description: 'Aborts and cancels an active Jules autonomous coding task.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The unique Jules Task ID',
        },
        reason: {
          type: 'string',
          description: 'Optional reason for cancelling the task',
        },
      },
      required: ['taskId'],
    },
  },
];

// Handle ListTools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle CallTool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'jules_create_task': {
        const repo = String(args.repo);
        const prompt = String(args.prompt);
        const title = args.title ? String(args.title) : undefined;
        const baseBranch = args.baseBranch ? String(args.baseBranch) : undefined;
        const targetBranch = args.targetBranch ? String(args.targetBranch) : undefined;
        const autoApprovePlan = Boolean(args.autoApprovePlan);

        const task = await julesClient.createTask({
          repo,
          prompt,
          title,
          baseBranch,
          targetBranch,
          autoApprovePlan,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Jules task created successfully',
                  mode: julesClient.isUsingMock() ? 'mock/sandbox' : 'live-jules-api',
                  task,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'jules_list_tasks': {
        const repo = args.repo ? String(args.repo) : undefined;
        const limit = args.limit ? Number(args.limit) : 10;
        const tasks = await julesClient.listTasks(repo, limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: tasks.length,
                  mode: julesClient.isUsingMock() ? 'mock/sandbox' : 'live-jules-api',
                  tasks,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'jules_get_task_status': {
        const taskId = String(args.taskId);
        const task = await julesClient.getTask(taskId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(task, null, 2),
            },
          ],
        };
      }

      case 'jules_approve_plan': {
        const taskId = String(args.taskId);
        const approved = Boolean(args.approved);
        const feedback = args.feedback ? String(args.feedback) : undefined;

        const updated = await julesClient.approvePlan({ taskId, approved, feedback });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: approved ? 'Plan approved. Jules is now executing.' : 'Plan rejected.',
                  task: updated,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'jules_send_feedback': {
        const taskId = String(args.taskId);
        const message = String(args.message);

        const updated = await julesClient.sendFeedback({ taskId, message });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Feedback delivered to Jules session.',
                  task: updated,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'jules_get_diff': {
        const taskId = String(args.taskId);
        const diffData = await julesClient.getDiff(taskId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(diffData, null, 2),
            },
          ],
        };
      }

      case 'jules_cancel_task': {
        const taskId = String(args.taskId);
        const reason = args.reason ? String(args.reason) : undefined;
        const updated = await julesClient.cancelTask(taskId, reason);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: `Task ${taskId} cancelled.`,
                  task: updated,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool requested: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `[Jules MCP Error]: ${error.message || String(error)}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[jules-ai-mcp] Server running on stdio');
}

main().catch((err) => {
  console.error('[jules-ai-mcp] Fatal error starting server:', err);
  process.exit(1);
});

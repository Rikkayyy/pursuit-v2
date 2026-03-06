export type GoalStatus = 'active' | 'completed' | 'archived';
export type TaskType = 'recurring' | 'one_time';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Goal {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    color: string;
    status: GoalStatus;
    created_at: string;
    updated_at: string;
}

export interface Milestone {
    id: string;
    goal_id: string;
    title: string;
    is_completed: boolean;
    due_date?: string;
    sort_order: number;
    created_at: string;
}

export interface Task {
    id: string;
    goal_id: string;
    title: string;
    type: TaskType;
    frequency?: Frequency;
    scheduled_days?: number[];
    due_date?: string;
    sort_order: number;
    created_at: string;
}

export interface TaskLog {
    id: string;
    task_id: string;
    user_id: string;
    date: string;
    completed_at: string;
}
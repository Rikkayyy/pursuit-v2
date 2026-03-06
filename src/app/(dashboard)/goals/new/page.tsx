import GoalForm from "@/components/features/goals/GoalForm";

export default function NewGoal() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold">New Goal</h1>
        <p className="text-sm text-gray-500 mt-1">What do you want to achieve?</p>
        <div className="mt-6">
          <GoalForm />
        </div>
      </div>
    </div>
  );
}
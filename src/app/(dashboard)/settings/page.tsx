import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/ui/SignOutButton";
import DeleteAccountButton from "@/components/ui/DeleteAccountButton";

export default async function Settings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Account Info */}
        <div className="mt-6 rounded-xl bg-white border border-gray-200 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
            Account
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">User ID</p>
              <p className="text-sm font-mono text-gray-600">{user.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Joined</p>
              <p className="text-sm font-medium">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="mt-4 rounded-xl bg-white border border-gray-200 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
            About
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm">Version</p>
              <p className="text-sm text-gray-500">0.1.0 (MVP)</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">Method</p>
              <p className="text-sm text-gray-500">GPS — Goal · Plan · System</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 rounded-xl bg-white border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <SignOutButton />
          </div>
          <div className="p-4">
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </div>
  );
} 
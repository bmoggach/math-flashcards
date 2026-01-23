import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { getAdminUserSummaries } from '@/lib/db';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function getAdminEmails() {
  return process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()).filter(Boolean) ?? [];
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/');
  }

  const adminEmails = getAdminEmails();
  if (!adminEmails.includes(session.user.email)) {
    redirect('/');
  }

  const users = await getAdminUserSummaries();
  const totalUsers = users.length;
  const onboardedUsers = users.filter(user => user.onboarded).length;
  const totalAttempts = users.reduce((sum, user) => sum + user.totalAttempts, 0);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <p className="text-sm text-emerald-600 font-semibold">Admin Dashboard</p>
            <h1 className="text-3xl font-bold text-gray-900">Authentication Overview</h1>
            <p className="text-gray-500 mt-1">Track who has signed in and their latest activity.</p>
          </div>
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button
              type="submit"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Users</p>
            <div className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</div>
            <p className="text-sm text-gray-400 mt-1">signed in with Google</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Onboarded Users</p>
            <div className="text-3xl font-bold text-gray-900 mt-2">{onboardedUsers}</div>
            <p className="text-sm text-gray-400 mt-1">completed onboarding</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Attempts Logged</p>
            <div className="text-3xl font-bold text-gray-900 mt-2">{totalAttempts}</div>
            <p className="text-sm text-gray-400 mt-1">across all users</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Authenticated Users</h2>
            <p className="text-sm text-gray-500">{totalUsers} total</p>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">No users have signed in yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">User</th>
                    <th className="py-2 pr-4 font-medium">Child</th>
                    <th className="py-2 pr-4 font-medium">Onboarded</th>
                    <th className="py-2 pr-4 font-medium">Signed Up</th>
                    <th className="py-2 pr-4 font-medium">Attempts</th>
                    <th className="py-2 pr-4 font-medium">Accuracy</th>
                    <th className="py-2 pr-4 font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {users.map(user => {
                    const accuracy = user.totalAttempts > 0
                      ? Math.round((user.correctAttempts / user.totalAttempts) * 100)
                      : 0;
                    const createdLabel = dateFormatter.format(user.createdAt);
                    const lastAttemptLabel = user.lastAttemptAt
                      ? dateFormatter.format(new Date(user.lastAttemptAt))
                      : 'No practice yet';

                    return (
                      <tr key={user.id} className="border-t border-gray-100">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-gray-800">{user.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </td>
                        <td className="py-3 pr-4">{user.childName || '—'}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.onboarded
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {user.onboarded ? 'Yes' : 'Not yet'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500">{createdLabel}</td>
                        <td className="py-3 pr-4">{user.totalAttempts}</td>
                        <td className="py-3 pr-4">{accuracy}%</td>
                        <td className="py-3 pr-4 text-gray-500">{lastAttemptLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                Familying
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Dashboard</span>
              <UserButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
            <div className="flex flex-col items-center justify-center h-full">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Your Family Dashboard!
              </h1>
              <p className="text-gray-600 text-center max-w-md mb-8">
                This is your family's central hub. From here you can manage calendars, 
                assign tasks, share photos, and keep everyone connected.
              </p>
              
              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl px-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      📅
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Calendar</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    View and manage family events and schedules
                  </p>
                  <button className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-500">
                    Open Calendar →
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      ✅
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Tasks</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Assign and track household responsibilities
                  </p>
                  <button className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-500">
                    View Tasks →
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      📸
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Photos</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Share and organize family memories
                  </p>
                  <button className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-500">
                    View Photos →
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      💬
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Messages</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Stay connected with family chat
                  </p>
                  <button className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-500">
                    Open Messages →
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      📊
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Budget</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Track family expenses and budgets
                  </p>
                  <button className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-500">
                    View Budget →
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-100 p-3 rounded-lg">
                      ⚙️
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Settings</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Manage family members and preferences
                  </p>
                  <button className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-500">
                    Open Settings →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

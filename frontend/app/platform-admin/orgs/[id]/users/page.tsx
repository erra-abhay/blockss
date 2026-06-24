"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function OrgUsersPage({ params }: { params: { id: string } }) {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("STUDENT");

  const fetchTenant = async () => {
    try {
      const res = await fetch(`http://localhost:1501/api/tenant/${params.id}`, {
        headers: { "Authorization": `Bearer ${Cookies.get("token")}` }
      });
      if (res.ok) setTenant(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [params.id]);

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:1501/api/tenant/${params.id}/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${Cookies.get("token")}` }
      });
      if (res.ok) fetchTenant();
    } catch (e) {
      console.error(e);
    }
  };

  const resetPassword = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's password?")) return;
    try {
      const res = await fetch(`http://localhost:1501/api/tenant/${params.id}/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${Cookies.get("token")}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Password reset successfully!\nNew Password: ${data.newPassword}\nPlease copy this now!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:1501/api/tenant/${params.id}/users`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Cookies.get("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newUserName, email: newUserEmail, role: newUserRole })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`User created!\nUsername: ${data.credentials.username}\nPassword: ${data.credentials.password}\nPlease copy this now!`);
        setNewUserName("");
        setNewUserEmail("");
        fetchTenant();
      } else {
        alert("Failed to add user: " + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-zinc-500">Loading users...</div>;
  if (!tenant) return <div className="text-red-400">Organization not found.</div>;

  const filteredUsers = tenant.users?.filter((u: any) => 
    u.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(filterQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">User Management</h1>
        <p className="text-zinc-400 text-sm">Add, remove, or reset passwords for users in {tenant.name}.</p>
      </div>

      {/* Add User Form */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Add New User</h3>
        <form onSubmit={addUser} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1">Full Name</label>
            <input required value={newUserName} onChange={e => setNewUserName(e.target.value)} type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="John Doe" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1">Email (for generating username)</label>
            <input required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} type="email" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="john@example.com" />
          </div>
          <div className="w-48">
            <label className="block text-xs text-zinc-500 mb-1">Role</label>
            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="STUDENT">Student</option>
              <option value="TENANT_ADMIN">Tenant Admin</option>
            </select>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors border border-indigo-500/50">
            Add User
          </button>
        </form>
      </div>

      {/* Filter and List */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
          <h3 className="text-sm font-medium text-zinc-300">Existing Users</h3>
          <input 
            type="text" 
            placeholder="Filter by name, username, role..." 
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 w-64"
          />
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/50 border-b border-zinc-800/50 text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium text-center">Role</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
            {filteredUsers?.map((u: any) => (
              <tr key={u.id} className="hover:bg-zinc-800/20">
                <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-indigo-300">{u.username}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700/50">{u.role}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => resetPassword(u.id)} className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors">Reset Password</button>
                  <button onClick={() => deleteUser(u.id)} className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 transition-colors">Delete</button>
                </td>
              </tr>
            ))}
            {(!filteredUsers || filteredUsers.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">No users found matching your filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

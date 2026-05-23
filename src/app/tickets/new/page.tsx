'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Lookup {
  id: number;
  name: string;
}
interface ContactLookup extends Lookup {
  company_name: string | null;
}
interface AgentLookup {
  id: number;
  full_name: string | null;
  username: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Lookup[]>([]);
  const [priorities, setPriorities] = useState<Lookup[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<Lookup[]>([]);
  const [agents, setAgents] = useState<AgentLookup[]>([]);
  const [contacts, setContacts] = useState<ContactLookup[]>([]);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [contactId, setContactId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priorityId, setPriorityId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [slaId, setSlaId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/tickets/lookups');
      if (res.ok) {
        const d = await res.json();
        setStatuses(d.statuses);
        setPriorities(d.priorities);
        setSlaPolicies(d.sla_policies);
        setAgents(d.agents);
        setContacts(d.contacts);
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim() || null,
          contact_id: contactId ? Number(contactId) : null,
          assignee_user_id: assigneeId ? Number(assigneeId) : null,
          priority_id: priorityId ? Number(priorityId) : null,
          status_id: statusId ? Number(statusId) : null,
          sla_policy_id: slaId ? Number(slaId) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create ticket');
      }
      const ticket = await res.json();
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="New Ticket"
        breadcrumbs={[{ label: 'Tickets', href: '/tickets' }, { label: 'New' }]}
      />
      <div className="mt-6 max-w-3xl">
        <Link href="/tickets" className="inline-flex items-center text-sm text-gray-600 hover:text-teal-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to tickets
        </Link>

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Short summary..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Details, steps, context..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">— None —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company_name ? ` (${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">— Unassigned —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name || a.username}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">— Default —</option>
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">— Default —</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">SLA Policy</label>
              <select
                value={slaId}
                onChange={(e) => setSlaId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">— Default —</option>
                {slaPolicies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link href="/tickets" className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

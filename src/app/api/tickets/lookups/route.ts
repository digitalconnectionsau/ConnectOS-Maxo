import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

/**
 * GET /api/tickets/lookups
 * Returns the data needed to populate ticket form dropdowns: statuses,
 * priorities, SLA policies, teams, agents (users), and contacts.
 */
export async function GET() {
  try {
    const db = await getDatabase();
    const [statuses, priorities, slaPolicies, teams, agents, contacts] = await Promise.all([
      db.query(`SELECT id, name, color, is_closed, is_default, sort_order
                  FROM ticket_statuses ORDER BY sort_order ASC, id ASC`),
      db.query(`SELECT id, name, color, is_default, sort_order
                  FROM ticket_priorities ORDER BY sort_order ASC, id ASC`),
      db.query(`SELECT id, name, response_minutes, resolution_minutes, is_default
                  FROM sla_policies ORDER BY is_default DESC, name ASC`),
      db.query(`SELECT id, name FROM teams ORDER BY name ASC`),
      db.query(`SELECT id, full_name, username, email
                  FROM users WHERE is_active = TRUE ORDER BY full_name ASC NULLS LAST, username ASC`),
      db.query(`SELECT id, name, company_name FROM contacts ORDER BY name ASC LIMIT 1000`),
    ]);
    return NextResponse.json({
      statuses: statuses.rows,
      priorities: priorities.rows,
      sla_policies: slaPolicies.rows,
      teams: teams.rows,
      agents: agents.rows,
      contacts: contacts.rows,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

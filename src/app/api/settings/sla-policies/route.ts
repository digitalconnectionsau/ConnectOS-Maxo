import { NextRequest } from 'next/server';
import { listRows, insertRow, SPEC_SLA } from '@/lib/settings-crud';

export const GET = () => listRows(SPEC_SLA);
export const POST = (req: NextRequest) => insertRow(req, SPEC_SLA);

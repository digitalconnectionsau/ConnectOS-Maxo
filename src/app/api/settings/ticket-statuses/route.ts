import { NextRequest } from 'next/server';
import { listRows, insertRow, SPEC_STATUSES } from '@/lib/settings-crud';

export const GET = () => listRows(SPEC_STATUSES);
export const POST = (req: NextRequest) => insertRow(req, SPEC_STATUSES);

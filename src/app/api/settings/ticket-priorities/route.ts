import { NextRequest } from 'next/server';
import { listRows, insertRow, SPEC_PRIORITIES } from '@/lib/settings-crud';

export const GET = () => listRows(SPEC_PRIORITIES);
export const POST = (req: NextRequest) => insertRow(req, SPEC_PRIORITIES);

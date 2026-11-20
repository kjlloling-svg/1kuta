import { getCurrentUser } from '@/lib/auth';
import { fail,json } from '@/lib/api';
export const dynamic='force-dynamic';
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (user) return json({authenticated: true, user, role: user.role});
    // Optional session checks treat a signed-out visitor as an ordinary result.
    if (new URL(request.url).searchParams.get('optional') === '1') return json({authenticated: false});
    return json({error: 'Not logged in', authenticated: false}, 401);
  } catch (error) {
    return fail(error);
  }
}

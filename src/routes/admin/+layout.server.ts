import type { LayoutServerLoad } from './$types';

/**
 * Meneruskan identitas operator dari hook ke layout.
 *
 * Hanya id dan email yang dikirim ke browser. Tidak ada token, tidak ada
 * daftar operator, tidak ada service role key.
 */
export const load: LayoutServerLoad = ({ locals }) => {
  return {
    operator: locals.operator ? { email: locals.operator.email } : null
  };
};

// Lihat https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    interface Locals {
      /** Operator yang sedang login dan terdaftar di admin_users, atau null. */
      operator: { id: string; email: string } | null;
    }
  }
}

export {};

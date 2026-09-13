/**
 * Designer-tier basic client (A0 typed stub).
 * Name / contact / project link only. Consolidated history = Professional+ (later).
 * Wired in InteriorClientPanel; jobMeta.customerName stays the live proposal field.
 */

export type BasicClientContact = {
  name: string;
  email?: string;
  phone?: string;
};

export type BasicClientRecord = {
  id: string;
  contact: BasicClientContact;
  /** Associated project id when linked; optional until project browser ids stabilize. */
  projectId?: string;
  notes?: string;
  updatedAt: string;
};

export function createBasicClientStub(
  partial: Partial<BasicClientRecord> & { contact?: Partial<BasicClientContact> } = {},
): BasicClientRecord {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? `client-local-${Date.now()}`,
    contact: {
      name: partial.contact?.name ?? "",
      email: partial.contact?.email,
      phone: partial.contact?.phone,
    },
    projectId: partial.projectId,
    notes: partial.notes,
    updatedAt: partial.updatedAt ?? now,
  };
}

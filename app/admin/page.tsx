'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

type RsvpRow = {
  guest_id: number;
  first_name: string;
  last_name: string | null;
  relationship_type: string | null;
  related_guest_id: number | null;
  related_first_name: string | null;
  related_last_name: string | null;
  attending: boolean | null;
  dietary_requirements: string | null;
  accessibility_requirements: string | null;
  submitted_at: string | null;
};

const inputClassName =
  'w-full rounded-xl border border-[#e8ded0] bg-white px-4 py-3 text-[#1d2420] outline-none focus:ring-2 focus:ring-[#98c3b0]';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Something went wrong.';
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rows, setRows] = useState<RsvpRow[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addPartner, setAddPartner] = useState(false);
  const [partnerFirstName, setPartnerFirstName] = useState('');
  const [partnerLastName, setPartnerLastName] = useState('');
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [addGuestError, setAddGuestError] = useState('');
  const [addGuestSuccess, setAddGuestSuccess] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [relationshipError, setRelationshipError] = useState('');
  const [relationshipSuccess, setRelationshipSuccess] = useState('');
  const [isLinkingCouple, setIsLinkingCouple] = useState(false);
  const [deletingGuestId, setDeletingGuestId] = useState<number | null>(null);
  const [guestActionError, setGuestActionError] = useState('');

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setLoginError(error.message);
        setUser(data.session?.user ?? null);
        setIsCheckingSession(false);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoginError(getErrorMessage(error));
          setIsCheckingSession(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoginError('');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!user) {
      setRows([]);
      setDashboardError('');
      return () => {
        active = false;
      };
    }

    setIsLoadingRows(true);
    setDashboardError('');

    async function loadDashboard() {
      const { data, error } = await supabase.rpc('admin_list_rsvp_data');
      if (error) throw error;
      if (active) setRows(data);
    }

    loadDashboard()
      .catch((error: unknown) => {
        if (active) setDashboardError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoadingRows(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setLoginError(error.message);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) setLoginError(error.message);
  }

  async function handleAddGuests(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddGuestError('');
    setAddGuestSuccess('');
    setIsAddingGuest(true);

    const newGuests = [
      { first_name: firstName, last_name: lastName },
      ...(addPartner
        ? [{ first_name: partnerFirstName, last_name: partnerLastName }]
        : []),
    ];

    try {
      const { error } = await supabase.rpc('admin_add_guests', {
        p_guests: newGuests,
      });

      if (error) throw error;

      setFirstName('');
      setLastName('');
      setPartnerFirstName('');
      setPartnerLastName('');
      setAddPartner(false);
      setAddGuestSuccess(
        addPartner ? 'Couple added to the guest list.' : 'Guest added to the guest list.',
      );

      const { data, error: refreshError } = await supabase.rpc(
        'admin_list_rsvp_data',
      );
      if (refreshError) throw refreshError;
      setRows(data);
    } catch (error: unknown) {
      setAddGuestError(getErrorMessage(error));
    } finally {
      setIsAddingGuest(false);
    }
  }

  async function handleLinkCouple(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRelationshipError('');
    setRelationshipSuccess('');
    setIsLinkingCouple(true);

    try {
      const { error } = await supabase.rpc('admin_link_couple', {
        p_guest_id: Number(selectedGuestId),
        p_partner_id: Number(selectedPartnerId),
      });

      if (error) throw error;

      setSelectedGuestId('');
      setSelectedPartnerId('');
      setRelationshipSuccess('Couple relationship created.');
      await refreshGuestRows();
    } catch (error: unknown) {
      setRelationshipError(getErrorMessage(error));
    } finally {
      setIsLinkingCouple(false);
    }
  }

  async function refreshGuestRows() {
    const { data, error } = await supabase.rpc('admin_list_rsvp_data');
    if (error) throw error;
    setRows(data);
  }

  async function handleDeleteGuest(row: RsvpRow) {
    const guestName = [row.first_name, row.last_name]
      .filter(Boolean)
      .join(' ');
    const partnerName = [row.related_first_name, row.related_last_name]
      .filter(Boolean)
      .join(' ');
    const relationshipNote =
      row.relationship_type === 'couple' && partnerName
        ? ` Their partner, ${partnerName}, will remain on the guest list but be unlinked.`
        : '';

    if (
      !window.confirm(
        `Delete ${guestName} and their RSVP?${relationshipNote} This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingGuestId(row.guest_id);
    setGuestActionError('');

    try {
      const { error } = await supabase.rpc('admin_delete_guest', {
        p_guest_id: row.guest_id,
      });
      if (error) throw error;
      await refreshGuestRows();
    } catch (error: unknown) {
      setGuestActionError(getErrorMessage(error));
    } finally {
      setDeletingGuestId(null);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="min-h-screen bg-[#faf8f2] p-8 text-[#1d2420]">
        Checking admin session...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f2] px-4 py-12 text-[#1d2420]">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 shadow"
        >
          <div>
            <p className="font-manrope text-sm uppercase tracking-widest text-[#5c6863]">
              Wedding RSVP
            </p>
            <h1 className="mt-2 font-bodoni text-4xl">Admin sign in</h1>
          </div>
          <label className="block space-y-2">
            <span>Email</span>
            <input
              className={inputClassName}
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span>Password</span>
            <input
              className={inputClassName}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {loginError && (
            <p role="alert" className="text-sm text-red-800">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-[#152820] px-5 py-3 text-white hover:bg-[#0b1611]"
          >
            Sign in
          </button>
        </form>
      </main>
    );
  }

  const attendingCount = rows.filter((row) => row.attending === true).length;
  const declinedCount = rows.filter((row) => row.attending === false).length;
  const unansweredCount = rows.filter((row) => row.attending === null).length;

  return (
    <main className="min-h-screen bg-[#faf8f2] px-4 py-8 text-[#1d2420] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-manrope text-sm uppercase tracking-widest text-[#5c6863]">
              Wedding RSVP
            </p>
            <h1 className="font-bodoni text-4xl">Admin dashboard</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-[#152820] px-5 py-2 hover:bg-[#dce8e1]"
          >
            Sign out
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="RSVP totals">
          {[
            { label: 'Attending', count: attendingCount },
            { label: 'Declined', count: declinedCount },
            { label: 'Awaiting response', count: unansweredCount },
          ].map(({ label, count }) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-[#5c6863]">{label}</p>
              <p className="mt-1 font-bodoni text-4xl">{count}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-bodoni text-3xl">Add guests</h2>
          <form onSubmit={handleAddGuests} className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span>First name</span>
                <input
                  className={inputClassName}
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span>Last name</span>
                <input
                  className={inputClassName}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </label>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={addPartner}
                onChange={(event) => setAddPartner(event.target.checked)}
              />
              Add this guest’s partner
            </label>

            {addPartner && (
              <div className="grid gap-4 rounded-2xl bg-[#faf8f2] p-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span>Partner’s first name</span>
                  <input
                    className={inputClassName}
                    required
                    value={partnerFirstName}
                    onChange={(event) => setPartnerFirstName(event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span>Partner’s last name</span>
                  <input
                    className={inputClassName}
                    value={partnerLastName}
                    onChange={(event) => setPartnerLastName(event.target.value)}
                  />
                </label>
              </div>
            )}

            {addGuestError && (
              <p role="alert" className="text-sm text-red-800">
                Could not add guest: {addGuestError}
              </p>
            )}
            {addGuestSuccess && (
              <p role="status" className="text-sm text-green-800">
                {addGuestSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={isAddingGuest}
              className="rounded-full bg-[#152820] px-6 py-3 text-white hover:bg-[#0b1611] disabled:opacity-50"
            >
              {isAddingGuest ? 'Adding...' : addPartner ? 'Add couple' : 'Add guest'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-bodoni text-3xl">Connect existing guests</h2>
          <p className="mt-2 text-sm text-[#5c6863]">
            Only guests without an existing relationship can be connected.
          </p>
          <form
            onSubmit={handleLinkCouple}
            className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto]"
          >
            <label className="space-y-2">
              <span>First guest</span>
              <select
                required
                className={inputClassName}
                value={selectedGuestId}
                onChange={(event) => setSelectedGuestId(event.target.value)}
              >
                <option value="">Choose a guest</option>
                {rows
                  .filter((row) => row.relationship_type === null)
                  .map((row) => (
                    <option key={row.guest_id} value={row.guest_id}>
                      {[row.first_name, row.last_name]
                        .filter(Boolean)
                        .join(' ')}
                    </option>
                  ))}
              </select>
            </label>
            <span className="hidden self-end pb-3 sm:block">&amp;</span>
            <label className="space-y-2">
              <span>Partner</span>
              <select
                required
                className={inputClassName}
                value={selectedPartnerId}
                onChange={(event) => setSelectedPartnerId(event.target.value)}
              >
                <option value="">Choose a guest</option>
                {rows
                  .filter(
                    (row) =>
                      row.relationship_type === null &&
                      String(row.guest_id) !== selectedGuestId,
                  )
                  .map((row) => (
                    <option key={row.guest_id} value={row.guest_id}>
                      {[row.first_name, row.last_name]
                        .filter(Boolean)
                        .join(' ')}
                    </option>
                  ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={
                isLinkingCouple ||
                !selectedGuestId ||
                !selectedPartnerId ||
                rows.filter((row) => row.relationship_type === null).length < 2
              }
              className="self-end rounded-full bg-[#152820] px-6 py-3 text-white hover:bg-[#0b1611] disabled:opacity-50"
            >
              {isLinkingCouple ? 'Connecting...' : 'Connect couple'}
            </button>
          </form>
          {relationshipError && (
            <p role="alert" className="mt-4 text-sm text-red-800">
              Could not connect guests: {relationshipError}
            </p>
          )}
          {relationshipSuccess && (
            <p role="status" className="mt-4 text-sm text-green-800">
              {relationshipSuccess}
            </p>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-bodoni text-3xl">Guest responses</h2>
          {guestActionError && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-800">
              Could not update the guest list: {guestActionError}
            </p>
          )}
          {dashboardError && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-800">
              Could not load dashboard data: {dashboardError}
              {dashboardError.includes('Admin access required') &&
                ' Add your Supabase Auth user ID to public.admin_users, then sign in again.'}
            </p>
          )}
          {isLoadingRows ? (
            <p className="mt-5">Loading guest responses...</p>
          ) : rows.length === 0 && !dashboardError ? (
            <p className="mt-5 text-[#5c6863]">No guests have been added yet.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e8ded0] text-[#5c6863]">
                    <th className="p-3">Guest</th>
                    <th className="p-3">Relationship</th>
                    <th className="p-3">Attendance</th>
                    <th className="p-3">Dietary</th>
                    <th className="p-3">Accessibility</th>
                    <th className="p-3">Submitted</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.guest_id} className="border-b border-[#e8ded0] align-top">
                      <td className="p-3">
                        {[row.first_name, row.last_name].filter(Boolean).join(' ')}
                      </td>
                      <td className="p-3">
                        {row.relationship_type === 'couple' && row.related_first_name
                          ? `Couple with ${[row.related_first_name, row.related_last_name]
                              .filter(Boolean)
                              .join(' ')}`
                          : row.relationship_type ?? '—'}
                      </td>
                      <td className="p-3">
                        {row.attending === null
                          ? 'No response'
                          : row.attending
                            ? 'Attending'
                            : 'Declined'}
                      </td>
                      <td className="whitespace-pre-wrap p-3">
                        {row.dietary_requirements || '—'}
                      </td>
                      <td className="whitespace-pre-wrap p-3">
                        {row.accessibility_requirements || '—'}
                      </td>
                      <td className="p-3">
                        {row.submitted_at
                          ? new Date(row.submitted_at).toLocaleString()
                          : '—'}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={deletingGuestId === row.guest_id}
                          onClick={() => handleDeleteGuest(row)}
                          className="whitespace-nowrap rounded-full border border-red-700 px-3 py-1 text-red-800 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingGuestId === row.guest_id
                            ? 'Deleting...'
                            : 'Remove guest'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

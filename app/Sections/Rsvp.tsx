
'use client';


import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Silk from '../Components/silk';


type Guest = {
    id: number;
    first_name: string;
    last_name: string | null;
};

export default function Rsvp() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGuests, setSelectedGuests] = useState<Guest[]>([]);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [isLoadingGuests, setIsLoadingGuests] = useState(false);
    const [lookupError, setLookupError] = useState('');
    const [isLoadingInvite, setIsLoadingInvite] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [requirements, setRequirements] = useState<Record<number, {
        dietary: string;
        accessibility: string;
        songChoice: string;
    }>>({});
    const [attendance, setAttendance] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        let ignoreResult = false;
        const term = searchTerm.trim();

        if (term.length < 3) {
            setGuests([]);
            setIsLoadingGuests(false);
            setLookupError('');
            return;
        }

        setIsLoadingGuests(true);
        setLookupError('');

        const timeout = setTimeout(() => {
            async function searchGuests() {
                try {
                    const { data, error } = await supabase.rpc(
                        'search_guest_names',
                        { p_search: term },
                    );

                    if (error) {
                        throw error;
                    }

                    if (!ignoreResult) {
                        setGuests(data);
                        setIsLoadingGuests(false);
                    }
                } catch (error: unknown) {
                    if (!ignoreResult) {
                        setLookupError(
                            error instanceof Error
                                ? error.message
                                : 'Unable to search invitations.',
                        );
                        setIsLoadingGuests(false);
                    }
                }
            }

            void searchGuests();
        }, 250);

        return () => {
            ignoreResult = true;
            clearTimeout(timeout);
        };
    }, [searchTerm]);

    const filteredNames = guests;

    const handleSelectGuest = async (guest: Guest) => {
        setSearchTerm('');
        setSelectedGuests([guest]);
        setAttendance(null);
        setInviteError('');
        setRequirements({});
        setSubmitError('');
        setIsSubmitted(false);
        setIsLoadingInvite(true);

        try {
            const { data, error } = await supabase.rpc('get_couple_guests', {
                p_guest_id: guest.id,
            });

            if (error) {
                throw error;
            }

            setSelectedGuests(data);
            setRequirements(
                Object.fromEntries(
                    data.map((selectedGuest: Guest) => [
                        selectedGuest.id,
                        { dietary: '', accessibility: '', songChoice: '' },
                    ]),
                ),
            );
        } catch (error: unknown) {
            setInviteError(
                error instanceof Error
                    ? error.message
                    : 'Unable to load the invitation.',
            );
        } finally {
            setIsLoadingInvite(false);
        }
    };

    const handleChangeName = () => {
        setSelectedGuests([]);
        setSearchTerm('');
        setAttendance(null);
        setInviteError('');
        setRequirements({});
        setSubmitError('');
        setIsSubmitted(false);
    };

    const handleSubmitRsvp = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const selectedGuest = selectedGuests[0];

        if (!selectedGuest || attendance === null || inviteError) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const { error } = await supabase.rpc('submit_couple_rsvp', {
                p_guest_id: selectedGuest.id,
                p_attending: attendance,
                p_requirements: selectedGuests.map((guest) => ({
                    guest_id: guest.id,
                    dietary_requirements:
                        requirements[guest.id]?.dietary.trim() || null,
                    accessibility_requirements:
                        requirements[guest.id]?.accessibility.trim() || null,
                    spotify_choice:
                        requirements[guest.id]?.songChoice.trim() || null,
                })),
            });

            if (error) {
                throw error;
            }

            setIsSubmitted(true);
        } catch (error: unknown) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Unable to save your RSVP.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <section
            id="section-rsvp"
            className="relative bg-deep-forest px-4 pt-28 pb-16 md:pt-36 md:pb-24"
        >
            <div
                className="pointer-events-none absolute inset-x-0 -top-48 bottom-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('/Images/greenSilk.jpg')",
                    maskImage: 'linear-gradient(to bottom, transparent 0, black 12rem)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 12rem)',
                }}
                aria-hidden="true"
            />
            <div className="relative z-10 mx-auto w-full max-w-xl">
                <div className="relative rounded-3xl  p-8 text-center font-antic text-warm-ivory  md:p-12">

                    <div className="flex flex-col gap-6 w-full text-warm-ivory">

                        {/* RSVP Heading */}
                        <div className="text-center text-8xl">
                            <h1>RS</h1>
                            <h1>VP</h1>
                        </div>

                        <img
                            src="/svg/first_decoration_dark.svg"
                            className="mx-auto h-auto w-24 brightness-0 invert"
                            alt=""
                        />

                        {/* Introduction */}
                        <h2 className="text-4xl">
                            Welcome
                        </h2>

                        <p className="text-md">
                            We can't wait to celebrate with you!
                        </p>

                        <p className="text-md">
                            Please let us know if you will be joining us by
                        </p>

                        <h2 className="text-4xl">
                            1 July 2027
                        </h2>

                        <p className="text-md">
                            Your response helps us to finalise seating,
                            catering, and all the little details that make
                            the day special.
                        </p>


                        {/* Invitation Search */}
                        <form
                            className="pt-20 flex flex-col gap-5"
                            onSubmit={handleSubmitRsvp}
                        >

                            {selectedGuests.length === 0 ? (
                                <>
                                    <h2 className="text-2xl">
                                        Search your Invitation
                                    </h2>

                                    <p className="text-sm opacity-70">
                                        Start typing your name to find your invitation
                                    </p>

                                    {/* Search Input */}
                                    <input
                                        type="text"
                                        id="invitation-search"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        placeholder="Start typing your name..."
                                        autoComplete="off"
                                        className="text-deeper-forest placeholder:text-deeper-forest/80 uppercase text-center p-4 rounded-full bg-[#AFD0C1] focus:outline-none focus:ring-2 focus:ring-deep-forest/20 hover:bg-[#D5EEE3] ease-in-out duration-300"
                                    />

                                    {/* Search Results */}
                                    {searchTerm && (
                                        <div className=" text-deeper-forest rounded-3xl overflow-hidden bg-[#D5EEE3] shadow-sm">

                                            {searchTerm.trim().length < 3 ? (
                                                <div className="px-6 py-5 text-sm opacity-70">
                                                    Enter at least 3 letters to search.
                                                </div>
                                            ) : isLoadingGuests ? (
                                                <div className="px-6 py-5 text-sm opacity-70">
                                                    Loading invitations...
                                                </div>
                                            ) : lookupError ? (
                                                <div className="px-6 py-5 text-sm text-red-800">
                                                    We couldn't load the guest list: {lookupError}
                                                </div>
                                            ) : filteredNames.length > 0 ? (
                                                <div className="flex flex-col">

                                                    {filteredNames.map((guest) => (
                                                        <button
                                                            key={guest.id}
                                                            type="button"
                                                            onClick={() =>
                                                                handleSelectGuest(guest)
                                                            }
                                                            className="px-6 py-4 text-center hover:bg-[#AFD0C1] transition-colors duration-300"
                                                        >
                                                            {[guest.first_name, guest.last_name].filter(Boolean).join(' ')}
                                                        </button>
                                                    ))}

                                                </div>
                                            ) : (
                                                <div className="px-6 py-5 text-sm opacity-70">
                                                    We couldn't find an invitation
                                                    matching that name.
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Invitation Found */}
                                    <div className="flex flex-col gap-4">

                                        <p className="text-sm uppercase tracking-widest opacity-70">
                                            Invitation Found
                                        </p>

                                        <div className="rounded-3xl bg-[#D5EEE3] p-6 text-deep-forest">

                                            <p className="text-2xl whitespace-pre-line">
                                                {selectedGuests
                                                    .map((guest) => [guest.first_name, guest.last_name].filter(Boolean).join(' '))
                                                    .join('\n&\n')}
                                            </p>


                                        </div>

                                        {selectedGuests.length > 1 && (
                                            <p className="text-sm">
                                                You can RSVP for both of you together.
                                            </p>
                                        )}

                                        {isLoadingInvite && (
                                            <p className="text-sm opacity-70">
                                                Loading your invitation...
                                            </p>
                                        )}

                                        {inviteError && (
                                            <p role="alert" className="text-sm text-red-800">
                                                We couldn’t load the full invitation: {inviteError}
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleChangeName}
                                            className="text-sm underline underline-offset-4 opacity-70 hover:opacity-100 transition-opacity"
                                        >
                                            That's not {selectedGuests.length > 1 ? "us" : "me"}
                                        </button>

                                    </div>


                                    {/* Attendance */}
                                    <div className="pt-10 flex flex-col gap-5">

                                        <h2 className="text-2xl">
                                            Will you be Attending our Wedding?
                                        </h2>

                                        <div className="flex flex-col gap-3">

                                            <label className="flex items-center gap-3 rounded-full bg-[#D5EEE3] p-4 text-deep-forest accent-deep-forest cursor-pointer transition-colors hover:bg-[#AFD0C1]">
                                                <input
                                                    type="radio"
                                                    name="attendance"
                                                    value="yes"
                                                    checked={attendance === true}
                                                    onChange={() => {
                                                        setAttendance(true);
                                                        setIsSubmitted(false);
                                                        setSubmitError('');
                                                    }}
                                                />
                                                <span>
                                                    Yes, {selectedGuests.length > 1 ? "we'll" : "I'll"} be there
                                                </span>
                                            </label>

                                            <label className="flex items-center gap-3 rounded-full bg-[#D5EEE3] p-4 text-deep-forest accent-deep-forest cursor-pointer transition-colors hover:bg-[#AFD0C1]">
                                                <input
                                                    type="radio"
                                                    name="attendance"
                                                    value="no"
                                                    checked={attendance === false}
                                                    onChange={() => {
                                                        setAttendance(false);
                                                        setIsSubmitted(false);
                                                        setSubmitError('');
                                                    }}
                                                />
                                                <span>
                                                    Sorry, {selectedGuests.length > 1 ? "we" : "I"} can't make it
                                                </span>
                                            </label>

                                        </div>

                                        <div className="pt-10 flex flex-col gap-8">
                                            {selectedGuests.map((guest) => {
                                                const name = [
                                                    guest.first_name,
                                                    guest.last_name,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ');
                                                const guestRequirements =
                                                    requirements[guest.id] ?? {
                                                        dietary: '',
                                                        accessibility: '',
                                                        songChoice: '',
                                                    };

                                                return (
                                                    <fieldset
                                                        key={guest.id}
                                                        className="flex flex-col gap-4 text-left"
                                                    >
                                                        {selectedGuests.length > 1 && (
                                                            <legend className="mb-2 w-full text-center text-2xl">
                                                                Requirements for {name}
                                                            </legend>
                                                        )}

                                                        <label
                                                            htmlFor={`dietary-${guest.id}`}
                                                            className="text-lg"
                                                        >
                                                            Dietary requirements
                                                        </label>
                                                        <textarea
                                                            id={`dietary-${guest.id}`}
                                                            value={guestRequirements.dietary}
                                                            onChange={(event) =>
                                                                setRequirements((current) => ({
                                                                    ...current,
                                                                    [guest.id]: {
                                                                        ...guestRequirements,
                                                                        dietary: event.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            placeholder="None, or tell us about any dietary requirements"
                                                            rows={3}
                                                            className="rounded-3xl bg-[#D5EEE3] p-4 text-deeper-forest placeholder:text-deeper-forest/80 focus:outline-none focus:ring-2 focus:ring-deep-forest/20"
                                                        />

                                                        <label
                                                            htmlFor={`accessibility-${guest.id}`}
                                                            className="text-lg"
                                                        >
                                                            Accessibility requirements
                                                        </label>
                                                        <textarea
                                                            id={`accessibility-${guest.id}`}
                                                            value={guestRequirements.accessibility}
                                                            onChange={(event) =>
                                                                setRequirements((current) => ({
                                                                    ...current,
                                                                    [guest.id]: {
                                                                        ...guestRequirements,
                                                                        accessibility:
                                                                            event.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            placeholder="None, or tell us how we can make the day accessible for you"
                                                            rows={3}
                                                            className="rounded-3xl bg-[#D5EEE3] p-4 text-deeper-forest placeholder:text-deeper-forest/80 focus:outline-none focus:ring-2 focus:ring-deep-forest/20"
                                                        />
                                                        <label
                                                            htmlFor={`songChoice-${guest.id}`}
                                                            className="text-lg"
                                                        >
                                                            Song request
                                                        </label>
                                                        <p className="text-sm opacity-80">
                                                            We’d love to hear which songs you’d enjoy on the day. We’ll take your suggestions into account as we put together the final playlist.
                                                        </p>
                                                        <textarea
                                                            id={`songChoice-${guest.id}`}
                                                            value={guestRequirements.songChoice}
                                                            onChange={(event) =>
                                                                setRequirements((current) => ({
                                                                    ...current,
                                                                    [guest.id]: {
                                                                        ...guestRequirements,
                                                                        songChoice:
                                                                            event.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            placeholder="Song title and artist (optional)"
                                                            rows={3}
                                                            className="rounded-3xl bg-[#D5EEE3] p-4 text-deeper-forest placeholder:text-deeper-forest/80 focus:outline-none focus:ring-2 focus:ring-deep-forest/20"
                                                        />
                                                    </fieldset>
                                                );
                                            })}
                                        </div>

                                        {submitError && (
                                            <p role="alert" className="text-sm text-red-800">
                                                We couldn’t save your RSVP: {submitError}
                                            </p>
                                        )}

                                        {isSubmitted && (
                                            <p role="status" className="text-sm">
                                                {selectedGuests.length > 1 ? "Your RSVP has been saved for everyone on this invitation, See you there!" : "Your RSVP has been saved, See you there!"}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoadingInvite || isSubmitting || attendance === null || Boolean(inviteError)}
                                            className="rounded-full bg-deep-forest px-6 py-4 text-white transition-colors hover:bg-deeper-forest disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Saving RSVP...' : 'Submit RSVP'}
                                        </button>

                                    </div>
                                </>
                            )}

                        </form>

                    </div>
                </div>
            </div>
        </section>
    )
}

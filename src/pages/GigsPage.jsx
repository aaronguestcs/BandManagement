import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateTimePicker } from "@/components/ui/datetime"
import { durationToSeconds, formatDuration } from "@/lib/utils"
import { format } from "date-fns"

import { useEffect, useState } from "react"

// Native <select> styled to match the shadcn Input (there's no shadcn Select in
// the project yet). Pulled out so both dropdowns share one look.
const selectClass =
    "w-full h-9 rounded-md border border-gray-200 bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"

// The blank shape of the Add Gig form. Keys mirror the GigUpdate fields (the
// user-entered ones). Kept at module scope so it's a single source of truth for
// both the initial state and resetting the form after submit.
const emptyGigForm = {
    dateTime: undefined, // held as a real Date; formatted to a string on submit
    venue: "",
    setlistId: "",
    pay: "",
    gigDuration: "",
    notes: "",
}

export default function GigsPage({ bandId, API }) {
    const [gigs, setGigs] = useState([])
    const [setlists, setSetlists] = useState([])
    const [setlistSongs, setSetlistSongs] = useState([])
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [totalRevenue, setTotalRevenue] = useState(0);


    // Dialog open/close state. Controlling it lets us close the dialog
    // ourselves after a successful submit.
    const [open, setOpen] = useState(false)

    // All user-entered fields live in one object (mirrors GigUpdate). date_time
    // is held as a real Date and only formatted to the "YYYY-MM-DD HH:MM" string
    // the backend expects on submit.
    const [formData, setFormData] = useState(emptyGigForm)

    // null = the dialog is adding a new gig; an id = editing that gig. Drives
    // whether submit POSTs or PUTs, and the dialog's title/button labels.
    const [editingId, setEditingId] = useState(null)

    // Generic updater: writes one field while preserving the rest. `[field]`
    // is a computed key so the same helper works for every input.
    function updateField(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    function gigPassed(dateTimeStr, currentDateTime) {
        const target = new Date(dateTimeStr.replace(' ', 'T'));

        if (isNaN(target.getTime())) {
            return 'Invalid date';
        }

        return currentDateTime > target
    }

    function timeUntil(dateTimeStr, currentDateTime) {
        // Parse "YYYY-MM-DD HH:MM" into a valid Date
        const target = new Date(dateTimeStr.replace(' ', 'T'));

        if (isNaN(target.getTime())) {
        return { error: 'Invalid date format' };
        }

        const diffMs = target - currentDateTime;
        const isPast = diffMs < 0;
        const absMs = Math.abs(diffMs);

        const totalHours = Math.floor(absMs / (1000 * 60 * 60));
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;

        const message = days + " days, " + hours + " hours";
        return { days, hours, isPast, message };
    }

    function displayDateTime(dateTimeStr) {
        const date = new Date(dateTimeStr.replace(' ', 'T'));

        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Time formatting (12-hour, lowercase am/pm, no leading zero)
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours === 0 ? 12 : hours;
        const minutesStr = minutes.toString().padStart(2, '0');

        // Day with ordinal suffix (1st, 2nd, 3rd, 4th...)
        const day = date.getDate();
        const suffix = getOrdinalSuffix(day);

        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${hours}:${minutesStr}${ampm} : ${month} ${day}${suffix} ${year}`;
        }

        function getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th'; // covers 11th-13th
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    function getSetlistName(setlistId) {
        const setlist = setlists.find(s => s.id === parseInt(setlistId));
        return setlist ? setlist.name : "";
    }

    // Sum every song's duration for the given setlist. setlistSongs holds all of
    // the band's setlist-song rows (each with its nested song), so we just filter
    // to this setlist and fold the durations.
    function getSetlistDuration(setlistId) {
        if (!setlistId) return "";
        const secs = setlistSongs
            .filter(ss => ss.setlist_id === parseInt(setlistId))
            .reduce((sum, ss) => sum + durationToSeconds(ss.song.duration), 0);
        return secs ? formatDuration(secs) + "h" : "";
    }

    function gigStatus(dateTimeStr, currentDateTime) {
        const target = new Date(dateTimeStr.replace(' ', 'T'));

        if (isNaN(target.getTime())) {
            return 'Invalid date';
        }

        const diffMs = target - currentDateTime;

        if (diffMs < 0) {
            return 'Passed';
        }

        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;

        return `In ${days} Days, ${hours} Hours`;
    }

    useEffect(() => {
        if (!bandId) return
        fetch(`${API}/gigs/?band_id=${bandId}`)
            .then(res => res.json())
            .then(data => setGigs(data || []))
        // Setlists power the "attach a setlist" dropdown.
        fetch(`${API}/setlists/?band_id=${bandId}`)
            .then(res => res.json())
            .then(data => setSetlists(data))
        // All setlist-song rows for the band; used to total each setlist's duration.
        fetch(`${API}/setlists/songs/?band_id=${bandId}`)
            .then(res => res.json())
            .then(data => setSetlistSongs(data || []))
    }, [bandId])

    useEffect(() => {
        if (!gigs || gigs.length === 0) {
            setTotalRevenue(0);
            return;
        }
        const revenue = gigs.reduce((sum, gig) => sum + (gig.pay || 0), 0);
        setTotalRevenue(revenue);

    }, [gigs])

    function resetForm() {
        setFormData(emptyGigForm)
    }

    function openAddGig() {
        setEditingId(null)
        resetForm()
        setOpen(true)
    }

    function openEditGig(gig) {
        setEditingId(gig.id)
        setFormData({
            // date_time comes back as "YYYY-MM-DD HH:MM"; the picker wants a Date.
            dateTime: gig.date_time ? new Date(gig.date_time.replace(" ", "T")) : undefined,
            venue: gig.venue || "",
            setlistId: gig.setlist_id ? String(gig.setlist_id) : "",
            pay: gig.pay ?? "",
            gigDuration: gig.gig_duration || "",
            notes: gig.notes || "",
        })
        setOpen(true)
    }

    async function handleDeleteGig(id) {
        await fetch(`${API}/gigs/${id}`, { method: "DELETE" })
        setGigs(prev => prev.filter(g => g.id !== id))
    }

    function formatPay(amount) {
        return `$${amount.toLocaleString('en-US')}`;
}

    async function handleSubmitGig(e) {
        e.preventDefault()

        if (!formData.dateTime) return // date/time is required

        // The form collects the GigUpdate fields; band_id is added here from
        // props (not typed by the user) to form the full GigCreate payload.
        // Empty strings become null so we don't send blank values for optional columns.
        const payload = {
            band_id: bandId,
            date_time: formData.dateTime ? format(formData.dateTime, "yyyy-MM-dd HH:mm") : null,
            venue: formData.venue || null,
            setlist_id: formData.setlistId ? parseInt(formData.setlistId) : null,
            pay: formData.pay ? parseInt(formData.pay) : null,
            gig_duration: formData.gigDuration || null,
            notes: formData.notes || null,
        }

        if (editingId) {
            const res = await fetch(`${API}/gigs/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const updated = await res.json()
            setGigs(prev => prev.map(g => g.id === editingId ? updated : g))
        } else {
            const res = await fetch(`${API}/gigs/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const created = await res.json()
            setGigs(prev => [...prev, created])
        }

        resetForm()
        setOpen(false)
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Gigs</h1>
                <Button variant="outline" onClick={openAddGig}>+ Add Gig</Button>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Gig" : "Add Gig"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmitGig} className="space-y-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Date &amp; Time *</label>
                                <DateTimePicker
                                    value={formData.dateTime}
                                    onChange={date => updateField("dateTime", date)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Venue</label>
                                <Input
                                    value={formData.venue}
                                    onChange={e => updateField("venue", e.target.value)}
                                    placeholder="The Cave"
                                />
                            </div>


                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Setlist</label>
                                <select
                                    className={selectClass}
                                    value={formData.setlistId}
                                    onChange={e => updateField("setlistId", e.target.value)}
                                >
                                    <option value="">No setlist</option>
                                    {setlists.map(setlist => (
                                        <option key={setlist.id} value={setlist.id}>
                                            {setlist.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Pay ($)</label>
                                    <Input
                                        type="number"
                                        value={formData.pay}
                                        onChange={e => updateField("pay", e.target.value)}
                                        placeholder="500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Duration</label>
                                    <Input
                                        value={formData.gigDuration}
                                        onChange={e => updateField("gigDuration", e.target.value)}
                                        placeholder="HH:MM"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Notes</label>
                                <Input
                                    value={formData.notes}
                                    onChange={e => updateField("notes", e.target.value)}
                                    placeholder="Load-in at 6pm, backline provided"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="submit" className="flex-1" disabled={!formData.dateTime}>{editingId ? "Save Changes" : "Add Gig"}</Button>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            {gigs.length === 0 ? (
                <p className="text-gray-500">No gigs yet. Click "Add Gig" to create one.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Setlist</TableHead>
                            <TableHead>Gig Duration</TableHead>
                            <TableHead>Setlist Duration</TableHead>
                            <TableHead>Date &amp; Time</TableHead>
                            <TableHead>Pay</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...gigs].sort((a, b) => {
                            const ta = new Date(a.date_time.replace(" ", "T"));
                            const tb = new Date(b.date_time.replace(" ", "T"));
                            const aPast = ta < currentDateTime;
                            const bPast = tb < currentDateTime;
                            // Upcoming before passed; upcoming soonest-first, passed most-recent-first.
                            if (aPast !== bPast) return aPast ? 1 : -1;
                            return aPast ? tb - ta : ta - tb;
                        }).map((gig) => (
                            <TableRow key={gig.id}>
                                <TableCell className={gigPassed(gig.date_time, currentDateTime) === true ? "text-yellow-500" : ""}>
                                    {gigStatus(gig.date_time, currentDateTime)}
                                </TableCell>
                                <TableCell>{gig.venue}</TableCell>
                                <TableCell>{getSetlistName(gig.setlist_id)}</TableCell>
                                <TableCell>{gig.gig_duration}h</TableCell>
                                <TableCell>{getSetlistDuration(gig.setlist_id) || "—"}</TableCell>
                                <TableCell>{displayDateTime(gig.date_time)}</TableCell>
                                <TableCell>{formatPay(gig.pay)}</TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-3">
                                    <button
                                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                        onClick={() => openEditGig(gig)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                        onClick={() => handleDeleteGig(gig.id)}
                                    >
                                        Remove
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={5}>Total Revenue</TableCell>
                            <TableCell>{formatPay(totalRevenue)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            )}
        </>
    )
}
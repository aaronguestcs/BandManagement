import { useState, useEffect } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Field from "@/components/ui/field"

const DUMMY_SETLISTS = [
    {
        id: 1,
        name: "Friday Night at The Pour House",
        songs: ["Sweet Home Alabama", "Mr. Brightside", "Don't Stop Believin'", "Wagon Wheel"],
    },
    {
        id: 2,
        name: "Saturday Acoustic Set",
        songs: ["Blackbird", "Landslide", "Fast Car"],
    },
    {
        id: 3,
        name: "New Year's Eve Closer",
        songs: ["Bohemian Rhapsody", "September", "Africa", "Living on a Prayer", "Don't Stop Me Now"],
    },
]

export default function SetlistsPage({ bandId, API }) {
    const [expanded, setExpanded] = useState({})
    const [dialogOpen, setDialogOpen] = useState(false)
    const [setlists, setSetlists] = useState([])
    const [newName, setNewName] = useState("")

    useEffect(() => {
        async function fetchSetlists() {
            try {
                const res = await fetch(`${API}/setlists/?band_id=${bandId}`)
                const data = await res.json()
                setSetlists(data)
            } catch (err) {
                console.error("Error fetching setlists:", err)
            }
        }
        if (bandId) {
            fetchSetlists()
        }
        else {
            setSetlists(DUMMY_SETLISTS)
        }
    }, [])

    async function handleSaveSetlist() {
        const body = JSON.stringify({
            name: newName,
            band_id: bandId,
        })
        const res = await fetch(`${API}/setlists/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,


            // if (editingId) {
            //     const res = await fetch(`${API}/songs/${editingId}`, {
            //         method: "PUT",
            //         headers: { "Content-Type": "application/json" },
            //         body,
            //     })
            //     const updated = await res.json()
            //     setSongs(prev => prev.map(s => s.id === editingId ? updated : s))
            // } else {
            //     const res = await fetch(`${API}/songs/`, {
            //         method: "POST",
            //         headers: { "Content-Type": "application/json" },
            //         body,
            //     })
            //     const saved = await res.json()
            //     setSongs(prev => [...prev, saved])
            // }

        })
        setDialogOpen(false)

    }

    function toggleExpand(id) {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Setlists</h1>
                <Button onClick={() => setDialogOpen(true)} variant="outline">
                    + New Setlist
                </Button>
            </div>

            <div className="space-y-2">
                {DUMMY_SETLISTS.map(setlist => (
                    <div key={setlist.id} className="border rounded-md overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                            <span className="font-medium">{setlist.name}</span>
                            <button
                                className="text-xs font-semibold text-gray-500 hover:text-gray-800 tracking-wide transition-colors"
                                onClick={() => toggleExpand(setlist.id)}
                            >
                                {expanded[setlist.id] ? "COLLAPSE" : "EXPAND"}
                            </button>
                        </div>

                        {expanded[setlist.id] && (
                            <div className="border-t px-4 py-3 bg-gray-50">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-gray-500">
                                            <th className="pb-2 font-medium w-8">#</th>
                                            <th className="pb-2 font-medium">Title</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {setlist.songs.map((song, i) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-white">
                                                <td className="py-2 text-gray-400">{i + 1}</td>
                                                <td className="py-2 font-medium">{song}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add / edit dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Setlist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <Field label="Name">
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </Field>
                        <div className="flex gap-2 pt-4">
                            <Button onClick={handleSaveSetlist}>
                                Create Setlist
                            </Button>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

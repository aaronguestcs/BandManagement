import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Field from "@/components/ui/field"


export default function SetlistsPage({ bandId, API }) {
    const navigate = useNavigate()
    const [expanded, setExpanded] = useState({})
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [setlists, setSetlists] = useState([])
    const [newName, setNewName] = useState("")
    const [setlistSongs, setSetlistSongs] = useState([])
    const [setlistDict, setSetlistDict] = useState({})

    async function fetchSetlists() {
        try {
            const res = await fetch(`${API}/setlists/?band_id=${bandId}`)
            const data = await res.json()
            setSetlists(data)
        } catch (err) {
            console.error("Error fetching setlists:", err)
        }
    }

    async function fetchSetlistSongs() {
        try {
            const res = await fetch(`${API}/setlists/songs/?band_id=${bandId}`)
            const data = await res.json()
            setSetlistSongs(data)
        }
        catch (err) {
            console.error("Error fetching setlist songs:", err)
        }
    }

    useEffect(() => {
        if (!bandId) return
        fetchSetlists()
        fetchSetlistSongs()
    }, [bandId])

    useEffect(() => {
        if (!setlistSongs.length) return
        const newDict = {}
        setlists.forEach(setlist => {
            const songs = setlistSongs.filter(setlistSong => setlistSong.setlist_id === setlist.id) //map(setlistSong => setlistSong.song_id)
            newDict[setlist.id] = songs // Song object embedded in setlistSong object
        })
        setSetlistDict(newDict)
    }, [setlists])

    async function handleSaveSetlist() {
        if (newName === "") return
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
        fetchSetlists()
        setAddDialogOpen(false)

    }

    function handleConfig(id) {
        navigate(`/setlists/${id}`)
    }

    function toggleExpand(id) {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Setlists</h1>
                <Button onClick={() => setAddDialogOpen(true)} variant="outline">
                    + New Setlist
                </Button>
            </div>

            <div className="space-y-2">
                {setlists.map(setlist => {
                    const hasSongs = setlistSongs.some(ss => ss.setlist_id === setlist.id)
                    return (
                    <div key={setlist.id}>
                        <div className="border rounded-md overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">

                                <span className="font-medium">{setlist.name}</span>

                                <button
                                    className={`text-xs font-semibold tracking-wide transition-colors ${hasSongs ? "text-gray-500 hover:text-gray-800" : "text-gray-300 cursor-default"}`}
                                    onClick={() => hasSongs && toggleExpand(setlist.id)}
                                >
                                    {expanded[setlist.id] ? "COLLAPSE" : "EXPAND"}
                                </button>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                                <button onClick={() => handleConfig(setlist.id)} className="text-xs font-semibold text-gray-500 hover:text-gray-800 tracking-wide transition-colors">
                                    Configure
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
                                            {setlistSongs.filter(setlistSong => setlistSong.setlist_id === setlist.id).toSorted((a, b) => a.position - b.position).map((setlistSong, i) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-white">
                                                    <td className="py-2 text-gray-400">{i + 1}</td>
                                                    <td className="py-2 font-medium">{setlistSong.song.title}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                    )
                })}
            </div>

            {/* Add / edit dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
                            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

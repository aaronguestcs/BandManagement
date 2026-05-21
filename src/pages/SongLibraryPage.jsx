import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// Hardcoded to band 1 until auth is implemented
const BAND_ID = 1

const API = "http://localhost:8000"

const EMPTY_FORM = { title: "", artist: "", key: "", bpm: "", duration: "", notes: "" }

export default function SongLibraryPage() {
    const [query, setQuery] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)

    const [songs, setSongs] = useState([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)

    // Load saved songs on mount
    useEffect(() => {
        fetch(`${API}/songs/?band_id=${BAND_ID}`)
            .then(r => r.json())
            .then(setSongs)
            .catch(() => {}) // table may not exist yet
    }, [])

    // Debounced Discogs search — waits 350ms after the user stops typing
    // before firing the request. The cleanup function cancels the pending
    // timeout if the user types again before 350ms, preventing stale results.
    useEffect(() => {
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${API}/songs/search?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setSearchResults(data)
            } finally {
                setIsSearching(false)
            }
        }, 350)

        return () => clearTimeout(timer)
    }, [query])

    function handleSelectResult(result) {
        // Pre-fill the dialog with whatever Discogs gave us; user can edit before saving
        setForm({
            title: result.title,
            artist: result.artist,
            key: "",
            bpm: "",
            duration: "",
            notes: "",
        })
        setSearchResults([])
        setQuery("")
        setDialogOpen(true)
    }

    function handleOpenBlankForm() {
        setForm(EMPTY_FORM)
        setDialogOpen(true)
    }

    async function handleSaveSong() {
        const res = await fetch(`${API}/songs/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...form,
                bpm: form.bpm ? parseInt(form.bpm) : null,
                band_id: BAND_ID,
            }),
        })
        const saved = await res.json()
        setSongs(prev => [...prev, saved])
        setDialogOpen(false)
    }

    async function handleDeleteSong(id) {
        await fetch(`${API}/songs/${id}`, { method: "DELETE" })
        setSongs(prev => prev.filter(s => s.id !== id))
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Song Library</h1>
                <Button variant="outline" onClick={handleOpenBlankForm}>
                    + Add Manually
                </Button>
            </div>

            {/* Search bar */}
            <div className="relative max-w-lg mb-8">
                <Input
                    placeholder="Search Discogs for a song or artist..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoComplete="off"
                />

                {/* Live results dropdown */}
                {(searchResults.length > 0 || isSearching) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                        {isSearching && (
                            <p className="px-4 py-3 text-sm text-gray-400">Searching...</p>
                        )}
                        {searchResults.map(result => (
                            <button
                                key={result.discogs_id}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0 transition-colors"
                                onClick={() => handleSelectResult(result)}
                            >
                                {result.thumb ? (
                                    <img
                                        src={result.thumb}
                                        alt=""
                                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{result.title}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {result.artist}
                                        {result.year ? ` · ${result.year}` : ""}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Song table */}
            {songs.length === 0 ? (
                <p className="text-gray-400 text-sm">
                    No songs yet — search above or add one manually.
                </p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-gray-500">
                            <th className="pb-2 font-medium">Title</th>
                            <th className="pb-2 font-medium">Artist</th>
                            <th className="pb-2 font-medium">Key</th>
                            <th className="pb-2 font-medium">BPM</th>
                            <th className="pb-2 font-medium">Duration</th>
                            <th className="pb-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {songs.map(song => (
                            <tr key={song.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="py-3 font-medium">{song.title}</td>
                                <td className="py-3 text-gray-600">{song.artist}</td>
                                <td className="py-3 text-gray-600">{song.key || "—"}</td>
                                <td className="py-3 text-gray-600">{song.bpm || "—"}</td>
                                <td className="py-3 text-gray-600">{song.duration || "—"}</td>
                                <td className="py-3 text-right">
                                    <button
                                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                        onClick={() => handleDeleteSong(song.id)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Add / edit dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Song to Library</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <Field label="Title *">
                            <Input
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Sweet Home Alabama"
                            />
                        </Field>

                        <Field label="Artist *">
                            <Input
                                value={form.artist}
                                onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                                placeholder="Lynyrd Skynyrd"
                            />
                        </Field>

                        <div className="grid grid-cols-3 gap-3">
                            <Field label="Key">
                                <Input
                                    value={form.key}
                                    onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                                    placeholder="G"
                                />
                            </Field>
                            <Field label="BPM">
                                <Input
                                    type="number"
                                    value={form.bpm}
                                    onChange={e => setForm(f => ({ ...f, bpm: e.target.value }))}
                                    placeholder="120"
                                />
                            </Field>
                            <Field label="Duration">
                                <Input
                                    value={form.duration}
                                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                                    placeholder="3:45"
                                />
                            </Field>
                        </div>

                        <Field label="Notes">
                            <Input
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Capo 2, start slow..."
                            />
                        </Field>

                        <div className="flex gap-2 pt-2">
                            <Button
                                className="flex-1"
                                onClick={handleSaveSong}
                                disabled={!form.title || !form.artist}
                            >
                                Add to Library
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

function Field({ label, children }) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {children}
        </div>
    )
}

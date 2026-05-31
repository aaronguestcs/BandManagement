import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"

export default function SetlistBuilderPage({ bandId, API }) {
    const { id } = useParams()
    const setlistId = parseInt(id)
    const navigate = useNavigate()

    const [setlistName, setSetlistName] = useState("")
    const [setlistSongs, setSetlistSongs] = useState([])
    const [songLibrary, setSongLibrary] = useState([])
    const [librarySearch, setLibrarySearch] = useState("")

    async function fetchSetlistName() {
        const res = await fetch(`${API}/setlists/?band_id=${bandId}`)
        const data = await res.json()
        const found = data.find(s => s.id === setlistId)
        if (found) setSetlistName(found.name)
    }

    async function fetchSetlistSongs() {
        const res = await fetch(`${API}/setlists/songs/?band_id=${bandId}`)
        const data = await res.json()
        setSetlistSongs(
            data
                .filter(ss => ss.setlist_id === setlistId)
                .sort((a, b) => a.position - b.position)
        )
    }

    async function fetchSongLibrary() {
        const res = await fetch(`${API}/songs/?band_id=${bandId}`)
        const data = await res.json()
        setSongLibrary(data)
    }

    useEffect(() => {
        if (!bandId) return
        fetchSetlistName()
        fetchSetlistSongs()
        fetchSongLibrary()
    }, [bandId, setlistId])

    async function handleAddSong(songId) {
        await fetch(`${API}/setlists/${setlistId}/songs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ song_id: songId, band_id: bandId }),
        })
        fetchSetlistSongs()
    }

    async function handleRemoveSong(songId) {
        await fetch(`${API}/setlists/${setlistId}/songs/${songId}`, {
            method: "DELETE",
        })
        fetchSetlistSongs()
    }

    const filteredLibrary = songLibrary.filter(song =>
        song.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
        song.artist.toLowerCase().includes(librarySearch.toLowerCase())
    )

    return (
        <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/setlists")}
                    className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                    ← Setlists
                </button>
                <h1 className="text-3xl font-bold">{setlistName || "Loading..."}</h1>
            </div>

            <div className="flex gap-8">
                {/* Left column: songs currently in the setlist */}
                <div className="flex-1">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Songs in Setlist
                    </h2>
                    {setlistSongs.length === 0 ? (
                        <p className="text-gray-400 text-sm">No songs yet — add some from the library.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-gray-500">
                                    <th className="pb-2 font-medium w-8">#</th>
                                    <th className="pb-2 font-medium">Title</th>
                                    <th className="pb-2 font-medium">Artist</th>
                                    <th className="pb-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {setlistSongs.map((ss, i) => (
                                    <tr key={ss.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="py-3 text-gray-400">{i + 1}</td>
                                        <td className="py-3 font-medium">{ss.song.title}</td>
                                        <td className="py-3 text-gray-600">{ss.song.artist}</td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => handleRemoveSong(ss.song_id)}
                                                className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="w-px bg-gray-200" />

                {/* Right column: song library browser */}
                <div className="w-64">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Song Library
                    </h2>
                    <Input
                        placeholder="Search songs..."
                        value={librarySearch}
                        onChange={e => setLibrarySearch(e.target.value)}
                        className="mb-3"
                    />
                    <div className="overflow-y-auto max-h-[60vh] border border-gray-200 rounded-md">
                        {filteredLibrary.length === 0 ? (
                            <p className="text-gray-400 text-sm px-4 py-3">No songs in Library.</p>
                        ) : (
                            filteredLibrary.map(song => {
                                return (
                                    <div
                                        key={song.id}
                                        className="flex items-center justify-between px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="min-w-0 mr-3">
                                            <p className="text-sm font-medium truncate">{song.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                                        </div>
                                        <button
                                            onClick={() => handleAddSong(song.id)}
                                            className="text-xs font-semibold tracking-wide transition-colors shrink-0 text-gray-500 hover:text-gray-800"
                                        >
                                            Add
                                        </button>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

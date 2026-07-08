import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GripVertical } from "lucide-react"
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { durationToSeconds, formatDuration } from "@/lib/utils"

// One draggable row in the setlist. useSortable wires this row into the
// DndContext: `attributes`/`listeners` make it grabbable, `transform`/`transition`
// animate it as the list reshuffles. We put the listeners ONLY on the grip handle
// so the Remove button (and text selection) still work normally.
function SortableSongRow({ ss, index, onRemove }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: ss.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className="border-b last:border-0 hover:bg-gray-50 bg-white"
        >
            <td className="py-3 text-gray-400">
                <div className="flex items-center gap-2">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
                        aria-label="Drag to reorder"
                    >
                        <GripVertical size={16} />
                    </button>
                    {index + 1}
                </div>
            </td>
            <td className="py-3 font-medium">{ss.song.title}</td>
            <td className="py-3 text-gray-600">{ss.song.artist}</td>
            <td className="py-3 text-right">
                <button
                    onClick={() => onRemove(ss.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                    Remove
                </button>
            </td>
        </tr>
    )
}

export default function SetlistBuilderPage({ bandId, API }) {
    const { id } = useParams()
    const setlistId = parseInt(id)
    const navigate = useNavigate()

    const [setlistName, setSetlistName] = useState("")
    const [isEditingName, setIsEditingName] = useState(false)
    const [nameDraft, setNameDraft] = useState("")
    const [setlistSongs, setSetlistSongs] = useState([])
    const [songLibrary, setSongLibrary] = useState([])
    const [librarySearch, setLibrarySearch] = useState("")

    // Require a small drag distance before a grab "counts" as a drag, so a plain
    // click on the handle doesn't accidentally trigger a reorder.
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    async function fetchSetlistName() {
        const res = await fetch(`${API}/setlists/${setlistId}`)
        const data = await res.json()
        if (data) setSetlistName(data.name)
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

    function startEditingName() {
        setNameDraft(setlistName)
        setIsEditingName(true)
    }

    async function handleRenameSetlist() {
        const trimmed = nameDraft.trim()
        // Ignore empty or unchanged names
        if (!trimmed || trimmed === setlistName) {
            setIsEditingName(false)
            return
        }
        // Optimistically show new name -> send it to backend
        setSetlistName(trimmed)
        setIsEditingName(false)
        await fetch(`${API}/setlists/${setlistId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmed }),
        })
    }

    // Sends current order of setlist to backend to be reorder. Done after dragging/removing/adding setlist songs
    function persistOrder(songs) {
        return fetch(`${API}/setlists/${setlistId}/reorder`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ordered_ids: songs.map(ss => ss.id) }),
        })
    }

    async function handleAddSong(songId) {
        // Insert song on the backend for a real row id
        const res = await fetch(`${API}/setlists/${setlistId}/songs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ song_id: songId, band_id: bandId }),
        })
        const entry = await res.json()
        const song = songLibrary.find(s => s.id === songId) // nested detail, from state

        // Optimistically append to the displayed list
        const updated = [...setlistSongs, { ...entry, song }]
        setSetlistSongs(updated)

        // Set new row order in database 
        persistOrder(updated)
    }

    async function handleRemoveSong(setlistSongId) {
        // Optimistically remove song from the displayed list
        const updated = setlistSongs.filter(ss => ss.id !== setlistSongId)
        setSetlistSongs(updated)

        // Actually delete the row, then reorder the remaining rows
        await fetch(`${API}/setlists/${setlistId}/songs/${setlistSongId}`, { method: "DELETE" })
        persistOrder(updated)
    }

    // Fires when a drag finishes. Reorders local display instantly for smoothness
    async function handleDragEnd(event) {
        const { active, over } = event
        if (!over || active.id === over.id) return // dropped in place

        const oldIndex = setlistSongs.findIndex(ss => ss.id === active.id)
        const newIndex = setlistSongs.findIndex(ss => ss.id === over.id)
        const reordered = arrayMove(setlistSongs, oldIndex, newIndex)
        setSetlistSongs(reordered)
        persistOrder(reordered)
    }

    const totalDuration = formatDuration(
        setlistSongs.reduce((sum, ss) => sum + durationToSeconds(ss.song.duration), 0)
    )

    // case-sensitive search on title or artist
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
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <Input
                            autoFocus
                            value={nameDraft}
                            onChange={e => setNameDraft(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter") handleRenameSetlist()
                                if (e.key === "Escape") setIsEditingName(false)
                            }}
                            className="text-2xl font-bold h-auto py-1 max-w-sm"
                        />
                        <Button size="sm" onClick={handleRenameSetlist}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingName(false)}>
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{setlistName || "Loading..."}</h1>
                        {setlistName && (
                            <button
                                onClick={startEditingName}
                                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-8">
                {/* Left column: songs currently in the setlist */}
                <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-3">
                        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Songs in Setlist
                        </h2>
                        <span className="text-sm text-gray-600">
                            Setlist Duration: <span className="font-medium">{totalDuration}</span>
                        </span>
                    </div>
                    {setlistSongs.length === 0 ? (
                        <p className="text-gray-400 text-sm">No songs yet — add some from the library.</p>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-gray-500">
                                        <th className="pb-2 font-medium w-16">#</th>
                                        <th className="pb-2 font-medium">Title</th>
                                        <th className="pb-2 font-medium">Artist</th>
                                        <th className="pb-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <SortableContext
                                        items={setlistSongs.map(ss => ss.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {setlistSongs.map((ss, i) => (
                                            <SortableSongRow
                                                key={ss.id}
                                                ss={ss}
                                                index={i}
                                                onRemove={handleRemoveSong}
                                            />
                                        ))}
                                    </SortableContext>
                                </tbody>
                            </table>
                        </DndContext>
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
